/**
 * Pure fee arithmetic shared by the API (authoritative) and the web app (live previews).
 * Every function here is deterministic and side-effect free so it can be unit tested
 * exhaustively; the API wraps them in database transactions.
 */
import { DateLike, daysBetween, monthsInclusive, toISODate } from './dates';
import { Paise, roundToRupee } from './money';
import type { DiscountMode, InvoiceStatus, LateFeeFrequency, LateFeeMode } from './enums';

/* ------------------------------------------------------------------ */
/* Late fee                                                            */
/* ------------------------------------------------------------------ */

export interface LateFeeRuleInput {
  enabled: boolean;
  mode: LateFeeMode;
  /** Paise per period when mode = FIXED. */
  amount: Paise;
  /** Basis points per period when mode = PERCENT (250 = 2.5%). */
  percentBp: number;
  frequency: LateFeeFrequency;
  /** Days after the due date during which no late fee accrues. */
  graceDays: number;
  /** Maximum late fee per invoice in paise; null = uncapped. */
  maxCap: Paise | null;
}

export const DEFAULT_LATE_FEE_RULE: LateFeeRuleInput = {
  enabled: false,
  mode: 'FIXED',
  amount: 0,
  percentBp: 0,
  frequency: 'PER_DAY',
  graceDays: 0,
  maxCap: null,
};

export interface LateFeeResult {
  amount: Paise;
  daysLate: number;
  chargeableDays: number;
  periods: number;
  capped: boolean;
}

/**
 * Late fee for an invoice.
 * - `daysLate` counts calendar days after the due date up to `asOf`.
 * - Nothing accrues during the grace period; after it, periods are counted from the end
 *   of the grace period (so a 5-day grace with ₹50/day charges ₹50 on day 6).
 * - PERCENT is applied to the outstanding principal (excluding any late fee already
 *   charged) and rounded to the whole rupee.
 */
export function computeLateFee(rule: LateFeeRuleInput, principalOutstanding: Paise, dueDate: DateLike, asOf: DateLike): LateFeeResult {
  const daysLate = Math.max(0, daysBetween(dueDate, asOf));
  const chargeableDays = Math.max(0, daysLate - Math.max(0, rule.graceDays));
  const none: LateFeeResult = { amount: 0, daysLate, chargeableDays, periods: 0, capped: false };
  if (!rule.enabled || principalOutstanding <= 0 || chargeableDays === 0) return none;

  let periods: number;
  switch (rule.frequency) {
    case 'ONCE':
      periods = 1;
      break;
    case 'PER_DAY':
      periods = chargeableDays;
      break;
    case 'PER_WEEK':
      periods = Math.ceil(chargeableDays / 7);
      break;
    case 'PER_MONTH':
      periods = Math.ceil(chargeableDays / 30);
      break;
    default:
      periods = 0;
  }

  const perPeriod = rule.mode === 'FIXED' ? rule.amount : roundToRupee((principalOutstanding * rule.percentBp) / 10_000);
  let amount = Math.max(0, perPeriod * periods);
  let capped = false;
  if (rule.maxCap !== null && rule.maxCap !== undefined && rule.maxCap >= 0 && amount > rule.maxCap) {
    amount = rule.maxCap;
    capped = true;
  }
  return { amount, daysLate, chargeableDays, periods, capped };
}

/* ------------------------------------------------------------------ */
/* Pro-ration for in-year (mid-session) admissions                     */
/* ------------------------------------------------------------------ */

export interface ProrationResult {
  factor: number;
  monthsInTerm: number;
  monthsBilled: number;
}

/**
 * Month-based pro-ration: a student joining in any month pays for that month and every
 * remaining month of the term. Joining on/before the term start = full term (factor 1);
 * joining after the term ends = 0.
 */
export function prorationFactor(termStart: DateLike, termEnd: DateLike, joinDate: DateLike): ProrationResult {
  const monthsInTerm = monthsInclusive(termStart, termEnd);
  const join = toISODate(joinDate);
  if (join <= toISODate(termStart)) return { factor: 1, monthsInTerm, monthsBilled: monthsInTerm };
  if (join > toISODate(termEnd)) return { factor: 0, monthsInTerm, monthsBilled: 0 };
  const monthsBilled = monthsInclusive(join, termEnd);
  return { factor: monthsInTerm ? monthsBilled / monthsInTerm : 1, monthsInTerm, monthsBilled };
}

export function prorate(amount: Paise, factor: number): Paise {
  if (factor >= 1) return amount;
  if (factor <= 0) return 0;
  return roundToRupee(amount * factor);
}

/* ------------------------------------------------------------------ */
/* Discounts                                                           */
/* ------------------------------------------------------------------ */

export interface DiscountInput {
  id: string;
  mode: DiscountMode;
  /** Basis points for PERCENT (1000 = 10%), paise per invoice for FIXED. */
  value: number;
  /** Fee heads the discount applies to. Empty = every non-late-fee line. */
  feeHeadIds: string[];
}

export interface DiscountableLine {
  feeHeadId: string;
  amount: Paise;
  isLateFee?: boolean;
}

export interface LineDiscountResult {
  discount: Paise;
  sources: { discountId: string; amount: Paise }[];
}

/**
 * Apply approved discounts to invoice lines. Percentages are computed on the gross line
 * amount and rounded to the rupee; FIXED amounts are spread across eligible lines in
 * proportion to what remains payable on each. A line's discount never exceeds its amount.
 */
export function applyDiscounts(lines: DiscountableLine[], discounts: DiscountInput[]): LineDiscountResult[] {
  const out: LineDiscountResult[] = lines.map(() => ({ discount: 0, sources: [] }));
  const eligible = (d: DiscountInput, l: DiscountableLine) => !l.isLateFee && (d.feeHeadIds.length === 0 || d.feeHeadIds.includes(l.feeHeadId));

  const add = (i: number, discountId: string, amt: number) => {
    const room = lines[i].amount - out[i].discount;
    const take = Math.max(0, Math.min(room, Math.round(amt)));
    if (take <= 0) return 0;
    out[i].discount += take;
    const existing = out[i].sources.find((s) => s.discountId === discountId);
    if (existing) existing.amount += take;
    else out[i].sources.push({ discountId, amount: take });
    return take;
  };

  for (const d of discounts.filter((x) => x.mode === 'PERCENT')) {
    lines.forEach((l, i) => {
      if (eligible(d, l)) add(i, d.id, roundToRupee((l.amount * d.value) / 10_000));
    });
  }

  for (const d of discounts.filter((x) => x.mode === 'FIXED')) {
    const idx = lines.map((l, i) => (eligible(d, l) ? i : -1)).filter((i) => i >= 0);
    const remaining = idx.map((i) => lines[i].amount - out[i].discount);
    const pool = remaining.reduce((a, b) => a + b, 0);
    if (pool <= 0) continue;
    let toGive = Math.min(d.value, pool);
    // proportional split, last eligible line absorbs rounding remainder
    idx.forEach((i, k) => {
      if (toGive <= 0) return;
      const share = k === idx.length - 1 ? toGive : Math.floor((d.value * remaining[k]) / pool);
      toGive -= add(i, d.id, Math.min(share, toGive));
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Payment allocation                                                  */
/* ------------------------------------------------------------------ */

export interface AllocatableLine {
  lineId: string;
  invoiceId: string;
  /** Remaining payable on the line. */
  balance: Paise;
  /** Invoice due date — older invoices are settled first. */
  dueDate: DateLike;
  /** Fee head priority — lower settles first within an invoice. Late fees carry a high number. */
  priority: number;
  /** Stable order within an invoice. */
  sortOrder: number;
}

export interface AllocationResult {
  allocations: { lineId: string; invoiceId: string; amount: Paise }[];
  allocated: Paise;
  unallocated: Paise;
}

/**
 * Allocate a payment across open invoice lines: oldest due date first, then fee head
 * priority, then line order. Whatever is left becomes advance credit (wallet).
 */
export function allocatePayment(amount: Paise, lines: AllocatableLine[]): AllocationResult {
  const sorted = [...lines]
    .filter((l) => l.balance > 0)
    .sort((a, b) => {
      const da = toISODate(a.dueDate);
      const db = toISODate(b.dueDate);
      if (da !== db) return da < db ? -1 : 1;
      if (a.invoiceId !== b.invoiceId) return a.invoiceId < b.invoiceId ? -1 : 1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.sortOrder - b.sortOrder;
    });
  let left = Math.max(0, Math.round(amount));
  const allocations: AllocationResult['allocations'] = [];
  for (const l of sorted) {
    if (left <= 0) break;
    const take = Math.min(left, l.balance);
    allocations.push({ lineId: l.lineId, invoiceId: l.invoiceId, amount: take });
    left -= take;
  }
  return { allocations, allocated: Math.round(amount) - left, unallocated: left };
}

/* ------------------------------------------------------------------ */
/* Invoice status & aging                                              */
/* ------------------------------------------------------------------ */

export function deriveInvoiceStatus(input: { total: Paise; amountPaid: Paise; dueDate: DateLike; cancelled?: boolean; today: DateLike }): InvoiceStatus {
  if (input.cancelled) return 'CANCELLED';
  const balance = input.total - input.amountPaid;
  if (balance <= 0) return 'PAID';
  if (toISODate(input.dueDate) < toISODate(input.today)) return 'OVERDUE';
  if (input.amountPaid > 0) return 'PARTIALLY_PAID';
  return 'PENDING';
}

export const AGING_BUCKETS = ['0-30', '31-60', '61-90', '90+'] as const;
export type AgingBucket = (typeof AGING_BUCKETS)[number];

/** Bucket for a number of days past due (1..30 → "0-30"). */
export function agingBucket(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 30) return '0-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
}

/* ------------------------------------------------------------------ */
/* Dues policy                                                         */
/* ------------------------------------------------------------------ */

export interface PolicyThreshold {
  enabled: boolean;
  thresholdAmount: Paise | null;
  thresholdDays: number | null;
}

/**
 * A policy triggers when the student's overdue amount reaches the amount threshold OR the
 * oldest overdue invoice reaches the days threshold. A policy with neither threshold set
 * triggers on any overdue amount.
 */
export function policyTriggered(policy: PolicyThreshold, overdueAmount: Paise, maxDaysOverdue: number): boolean {
  if (!policy.enabled || overdueAmount <= 0) return false;
  const hasAmt = policy.thresholdAmount !== null && policy.thresholdAmount !== undefined;
  const hasDays = policy.thresholdDays !== null && policy.thresholdDays !== undefined;
  if (!hasAmt && !hasDays) return true;
  return (hasAmt && overdueAmount >= (policy.thresholdAmount as number)) || (hasDays && maxDaysOverdue >= (policy.thresholdDays as number));
}

/* ------------------------------------------------------------------ */
/* Numbering                                                           */
/* ------------------------------------------------------------------ */

export function formatSequence(prefix: string, scope: string, value: number, pad = 5, sep = '/'): string {
  return [prefix, scope, String(value).padStart(pad, '0')].filter(Boolean).join(sep);
}

/** "2026-27" for a year starting in April 2026. */
export function academicYearLabel(startYear: number): string {
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}
