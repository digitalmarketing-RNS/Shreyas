/**
 * Date-only helpers. Due dates, term dates and attendance dates are calendar dates in
 * India Standard Time. They are handled as ISO "YYYY-MM-DD" strings (or Date objects at
 * UTC midnight, which is how Prisma returns @db.Date columns) so that day arithmetic never
 * drifts across time zones.
 */

export const SCHOOL_TIMEZONE = 'Asia/Kolkata';

export type DateLike = Date | string;

/** Normalise to "YYYY-MM-DD". Date objects are read in UTC (Prisma @db.Date semantics). */
export function toISODate(d: DateLike): string {
  if (typeof d === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid date: ${d}`);
    return parsed.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

/** Today's calendar date in IST, independent of the server's timezone. */
export function todayIST(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: SCHOOL_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(now);
}

/** Date at UTC midnight for a calendar date — the value to store in @db.Date columns. */
export function dateOnly(d: DateLike): Date {
  return new Date(`${toISODate(d)}T00:00:00.000Z`);
}

/** Whole days from `a` to `b` (b - a). */
export function daysBetween(a: DateLike, b: DateLike): number {
  const ms = dateOnly(b).getTime() - dateOnly(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function addDays(d: DateLike, days: number): string {
  const base = dateOnly(d);
  base.setUTCDate(base.getUTCDate() + days);
  return toISODate(base);
}

export function isBefore(a: DateLike, b: DateLike): boolean {
  return toISODate(a) < toISODate(b);
}

/** Number of calendar months touched from start to end inclusive (Apr 1 – Sep 30 = 6). */
export function monthsInclusive(start: DateLike, end: DateLike): number {
  const s = toISODate(start);
  const e = toISODate(end);
  const [sy, sm] = s.split('-').map(Number);
  const [ey, em] = e.split('-').map(Number);
  return Math.max(0, (ey - sy) * 12 + (em - sm) + 1);
}

const DISPLAY_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 15 Oct 2026 */
export function formatDateIN(d: DateLike | null | undefined): string {
  if (!d) return '—';
  const [y, m, day] = toISODate(d).split('-').map(Number);
  return `${String(day).padStart(2, '0')} ${DISPLAY_MONTHS[m - 1]} ${y}`;
}

/** 15 Oct 2026, 04:32 PM (IST) */
export function formatDateTimeIN(d: DateLike | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: SCHOOL_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/** Age in completed years on a given date. */
export function ageOn(dob: DateLike, on: DateLike): number {
  const [by, bm, bd] = toISODate(dob).split('-').map(Number);
  const [oy, om, od] = toISODate(on).split('-').map(Number);
  let age = oy - by;
  if (om < bm || (om === bm && od < bd)) age--;
  return age;
}
