import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LATE_FEE_RULE,
  agingBucket,
  allocatePayment,
  applyDiscounts,
  computeLateFee,
  deriveInvoiceStatus,
  policyTriggered,
  prorate,
  prorationFactor,
  formatSequence,
  academicYearLabel,
} from './fees';
import { amountInWords, formatINR, formatINRCompact, numberToIndianWords, rupeesToPaise } from './money';
import { addDays, daysBetween, monthsInclusive, todayIST } from './dates';

const R = (rupees: number) => rupees * 100;

describe('money formatting (Indian system)', () => {
  it('formats lakhs and crores with Indian grouping', () => {
    expect(formatINR(R(100000))).toBe('₹1,00,000');
    expect(formatINR(R(12345678))).toBe('₹1,23,45,678');
    expect(formatINR(12345)).toBe('₹123.45');
    expect(formatINR(R(500), { alwaysPaise: true })).toBe('₹500.00');
  });
  it('compacts to L / Cr', () => {
    expect(formatINRCompact(R(420000))).toBe('₹4.2 L');
    expect(formatINRCompact(R(13000000))).toBe('₹1.3 Cr');
  });
  it('converts rupee strings to paise safely', () => {
    expect(rupeesToPaise('₹1,00,000.50')).toBe(10000050);
    expect(rupeesToPaise(0.1 + 0.2)).toBe(30);
    expect(() => rupeesToPaise('abc')).toThrow();
  });
  it('spells amounts in Indian words', () => {
    expect(numberToIndianWords(120000)).toBe('One Lakh Twenty Thousand');
    expect(numberToIndianWords(12345678)).toBe('One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight');
    expect(amountInWords(R(45000) + 50)).toBe('Rupees Forty Five Thousand and Fifty Paise Only');
  });
});

describe('dates', () => {
  it('counts days and months on calendar dates', () => {
    expect(daysBetween('2026-10-15', '2026-10-30')).toBe(15);
    expect(daysBetween('2026-10-30', '2026-10-15')).toBe(-15);
    expect(addDays('2026-12-30', 5)).toBe('2027-01-04');
    expect(monthsInclusive('2026-04-01', '2026-09-30')).toBe(6);
    expect(monthsInclusive('2026-10-01', '2027-03-31')).toBe(6);
  });
  it('computes today in IST regardless of server TZ', () => {
    // 20:00 UTC on 25 Sep is already 26 Sep in India
    expect(todayIST(new Date('2026-09-25T20:00:00Z'))).toBe('2026-09-26');
  });
});

describe('late fee rule builder', () => {
  const rule = { ...DEFAULT_LATE_FEE_RULE, enabled: true, mode: 'FIXED' as const, amount: R(50), frequency: 'PER_DAY' as const };

  it('is off by default', () => {
    expect(computeLateFee(DEFAULT_LATE_FEE_RULE, R(40000), '2026-10-15', '2026-11-30').amount).toBe(0);
  });
  it('charges fixed per day after due date', () => {
    expect(computeLateFee(rule, R(40000), '2026-10-15', '2026-10-20').amount).toBe(R(250));
  });
  it('respects grace period', () => {
    const r = { ...rule, graceDays: 5 };
    expect(computeLateFee(r, R(40000), '2026-10-15', '2026-10-20').amount).toBe(0);
    expect(computeLateFee(r, R(40000), '2026-10-15', '2026-10-21').amount).toBe(R(50));
  });
  it('caps at the maximum', () => {
    const r = { ...rule, maxCap: R(500) };
    const res = computeLateFee(r, R(40000), '2026-10-15', '2026-12-31');
    expect(res.amount).toBe(R(500));
    expect(res.capped).toBe(true);
  });
  it('charges per week (partial weeks count)', () => {
    const r = { ...rule, frequency: 'PER_WEEK' as const, amount: R(200) };
    expect(computeLateFee(r, R(40000), '2026-10-15', '2026-10-23').amount).toBe(R(400));
  });
  it('charges a percentage of outstanding principal', () => {
    const r = { ...rule, mode: 'PERCENT' as const, percentBp: 200, frequency: 'ONCE' as const };
    expect(computeLateFee(r, R(40000), '2026-10-15', '2026-10-16').amount).toBe(R(800));
  });
  it('charges nothing when principal is cleared or not yet due', () => {
    expect(computeLateFee(rule, 0, '2026-10-15', '2026-11-15').amount).toBe(0);
    expect(computeLateFee(rule, R(40000), '2026-10-15', '2026-10-15').amount).toBe(0);
  });
  it('recalculates when the due date moves later (15 Oct → 30 Oct)', () => {
    const before = computeLateFee(rule, R(40000), '2026-10-15', '2026-10-25').amount;
    const after = computeLateFee(rule, R(40000), '2026-10-30', '2026-10-25').amount;
    expect(before).toBe(R(500));
    expect(after).toBe(0);
  });
});

describe('pro-ration for mid-session admission', () => {
  it('bills full term when joining before start', () => {
    expect(prorationFactor('2026-04-01', '2026-09-30', '2026-03-15').factor).toBe(1);
  });
  it('bills remaining months including joining month', () => {
    const p = prorationFactor('2026-04-01', '2026-09-30', '2026-07-10');
    expect(p.monthsBilled).toBe(3);
    expect(p.factor).toBe(0.5);
    expect(prorate(R(45000), p.factor)).toBe(R(22500));
  });
  it('rounds pro-rated amounts to whole rupees', () => {
    const p = prorationFactor('2026-04-01', '2026-06-30', '2026-06-01');
    expect(prorate(R(10000), p.factor)).toBe(R(3333));
  });
  it('bills nothing after the term ends', () => {
    expect(prorationFactor('2026-04-01', '2026-06-30', '2026-07-01').factor).toBe(0);
  });
});

describe('discounts', () => {
  const lines = [
    { feeHeadId: 'tuition', amount: R(40000) },
    { feeHeadId: 'activity', amount: R(5000) },
    { feeHeadId: 'late', amount: R(500), isLateFee: true },
  ];
  it('applies percentage only to chosen fee heads', () => {
    const res = applyDiscounts(lines, [{ id: 'sib', mode: 'PERCENT', value: 1000, feeHeadIds: ['tuition'] }]);
    expect(res.map((r) => r.discount)).toEqual([R(4000), 0, 0]);
  });
  it('never discounts late fees and splits fixed amounts proportionally', () => {
    const res = applyDiscounts(lines, [{ id: 'spl', mode: 'FIXED', value: R(9000), feeHeadIds: [] }]);
    expect(res[0].discount + res[1].discount).toBe(R(9000));
    expect(res[0].discount).toBe(R(8000));
    expect(res[2].discount).toBe(0);
  });
  it('never exceeds the line amount when discounts stack', () => {
    const res = applyDiscounts(lines, [
      { id: 'a', mode: 'PERCENT', value: 8000, feeHeadIds: ['tuition'] },
      { id: 'b', mode: 'PERCENT', value: 5000, feeHeadIds: ['tuition'] },
    ]);
    expect(res[0].discount).toBe(R(40000));
    expect(res[0].sources).toEqual([
      { discountId: 'a', amount: R(32000) },
      { discountId: 'b', amount: R(8000) },
    ]);
  });
});

describe('payment allocation', () => {
  const lines = [
    { lineId: 'l3', invoiceId: 'inv2', balance: R(30000), dueDate: '2026-10-15', priority: 10, sortOrder: 0 },
    { lineId: 'l1', invoiceId: 'inv1', balance: R(40000), dueDate: '2026-04-15', priority: 10, sortOrder: 0 },
    { lineId: 'late', invoiceId: 'inv1', balance: R(500), dueDate: '2026-04-15', priority: 999, sortOrder: 9 },
    { lineId: 'l2', invoiceId: 'inv1', balance: R(5000), dueDate: '2026-04-15', priority: 20, sortOrder: 1 },
  ];
  it('settles oldest invoice first, principal before late fee', () => {
    const res = allocatePayment(R(45200), lines);
    expect(res.allocations.map((a) => [a.lineId, a.amount])).toEqual([
      ['l1', R(40000)],
      ['l2', R(5000)],
      ['late', R(200)],
    ]);
    expect(res.unallocated).toBe(0);
  });
  it('puts any excess into advance credit', () => {
    const res = allocatePayment(R(80000), lines);
    expect(res.allocated).toBe(R(75500));
    expect(res.unallocated).toBe(R(4500));
  });
});

describe('invoice status, aging and policies', () => {
  it('derives status', () => {
    const base = { total: R(1000), dueDate: '2026-10-15', today: '2026-10-10' };
    expect(deriveInvoiceStatus({ ...base, amountPaid: 0 })).toBe('PENDING');
    expect(deriveInvoiceStatus({ ...base, amountPaid: R(100) })).toBe('PARTIALLY_PAID');
    expect(deriveInvoiceStatus({ ...base, amountPaid: R(1000) })).toBe('PAID');
    expect(deriveInvoiceStatus({ ...base, amountPaid: R(100), today: '2026-10-16' })).toBe('OVERDUE');
    expect(deriveInvoiceStatus({ ...base, amountPaid: 0, cancelled: true })).toBe('CANCELLED');
  });
  it('buckets aging', () => {
    expect([1, 30, 31, 60, 61, 90, 91, 400].map(agingBucket)).toEqual(['0-30', '0-30', '31-60', '31-60', '61-90', '61-90', '90+', '90+']);
  });
  it('triggers policies on amount OR days thresholds', () => {
    const p = { enabled: true, thresholdAmount: R(10000), thresholdDays: 60 };
    expect(policyTriggered(p, R(5000), 10)).toBe(false);
    expect(policyTriggered(p, R(10000), 10)).toBe(true);
    expect(policyTriggered(p, R(500), 61)).toBe(true);
    expect(policyTriggered({ ...p, enabled: false }, R(99999), 999)).toBe(false);
  });
  it('formats sequential numbers', () => {
    expect(formatSequence('INV', '2026-27', 42)).toBe('INV/2026-27/00042');
    expect(formatSequence('RNSIS', '2026-27', 1, 4, '-')).toBe('RNSIS-2026-27-0001');
    expect(academicYearLabel(2026)).toBe('2026-27');
  });
});
