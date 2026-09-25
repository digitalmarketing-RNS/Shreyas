/**
 * Money helpers. All amounts in RNSIS Nexus are stored and transported as integer paise
 * (1 rupee = 100 paise) — the same convention Razorpay and Stripe use — so no floating
 * point error ever enters the ledger. Formatting uses the Indian numbering system
 * (₹1,00,000).
 */

export type Paise = number;

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrWholeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const plainFormatter = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ₹1,23,456.50 — whole rupee amounts drop the paise unless `alwaysPaise` is set. */
export function formatINR(paise: Paise | null | undefined, opts: { alwaysPaise?: boolean } = {}): string {
  const value = Number(paise ?? 0) / 100;
  if (!opts.alwaysPaise && Number.isInteger(value)) return inrWholeFormatter.format(value);
  return inrFormatter.format(value);
}

/** 1,23,456.50 without currency symbol (used in PDFs/Excel where the column says ₹). */
export function formatAmountPlain(paise: Paise | null | undefined): string {
  return plainFormatter.format(Number(paise ?? 0) / 100);
}

/** Compact Indian units for dashboards: ₹4.2 L, ₹1.3 Cr. */
export function formatINRCompact(paise: Paise | null | undefined): string {
  const rupees = Number(paise ?? 0) / 100;
  const abs = Math.abs(rupees);
  const sign = rupees < 0 ? '-' : '';
  if (abs >= 1_00_00_000) return `${sign}₹${trim(abs / 1_00_00_000)} Cr`;
  if (abs >= 1_00_000) return `${sign}₹${trim(abs / 1_00_000)} L`;
  if (abs >= 1_000) return `${sign}₹${trim(abs / 1_000)} K`;
  return `${sign}₹${trim(abs)}`;
}

function trim(n: number): string {
  return n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

export function rupeesToPaise(rupees: number | string): Paise {
  const n = typeof rupees === 'string' ? Number(rupees.replace(/[₹,\s]/g, '')) : rupees;
  if (!Number.isFinite(n)) throw new Error(`Invalid amount: ${rupees}`);
  return Math.round(n * 100);
}

export function paiseToRupees(paise: Paise): number {
  return Math.round(paise) / 100;
}

/** Round to the nearest whole rupee (computed amounts such as pro-rated fees and % discounts). */
export function roundToRupee(paise: number): Paise {
  return Math.round(paise / 100) * 100;
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`;
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : '', rest ? twoDigits(rest) : ''].filter(Boolean).join(' ');
}

/** Indian-system number to words: 120000 -> "One Lakh Twenty Thousand". */
export function numberToIndianWords(num: number): string {
  num = Math.floor(Math.abs(num));
  if (num === 0) return 'Zero';
  const parts: string[] = [];
  const crore = Math.floor(num / 1_00_00_000);
  num %= 1_00_00_000;
  const lakh = Math.floor(num / 1_00_000);
  num %= 1_00_000;
  const thousand = Math.floor(num / 1_000);
  num %= 1_000;
  if (crore) parts.push(`${numberToIndianWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (num) parts.push(threeDigits(num));
  return parts.join(' ');
}

/** "Rupees One Lakh Twenty Thousand and Fifty Paise Only" — printed on receipts. */
export function amountInWords(paise: Paise): string {
  const rupees = Math.floor(Math.abs(paise) / 100);
  const p = Math.abs(paise) % 100;
  let out = `Rupees ${numberToIndianWords(rupees)}`;
  if (p) out += ` and ${twoDigits(p)} Paise`;
  return `${out} Only`;
}
