/**
 * Plain calendar dates for the date inputs (components.md: DatePicker, DateRangePicker,
 * DateTimePicker). A date is { year, month (1-12), day } with no time and no zone; the value that
 * leaves a picker is the ISO string "2026-10-06".
 *
 * Names are written out here rather than taken from Intl, so the server and every browser print
 * the same text ("06 Oct 2026", "Tuesday, 6 October 2026") and nothing differs at hydration.
 * September is "Sept", as in CLDR's en-IN data (decisions.md section 3).
 */

import { DEFAULT_TIME_ZONE, calendarDate } from "@/lib/format";

export type PlainDate = { year: number; month: number; day: number };

export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"] as const;
export const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
/** Weeks start on Sunday (components.md DatePicker: weekStartsOn 0, the CLDR value for India). */
export const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAYS_MIN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
export const WEEK_STARTS_ON = 0;

const pad2 = (n: number) => String(n).padStart(2, "0");

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isValidDate(date: PlainDate): boolean {
  return (
    Number.isInteger(date.year) &&
    Number.isInteger(date.month) &&
    Number.isInteger(date.day) &&
    date.year >= 1 &&
    date.year <= 9999 &&
    date.month >= 1 &&
    date.month <= 12 &&
    date.day >= 1 &&
    date.day <= daysInMonth(date.year, date.month)
  );
}

/** "2026-10-06" → { year: 2026, month: 10, day: 6 }; anything else → null. */
export function fromIso(value: string | null | undefined): PlainDate | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return isValidDate(date) ? date : null;
}

export function toIso(date: PlainDate): string {
  return `${String(date.year).padStart(4, "0")}-${pad2(date.month)}-${pad2(date.day)}`;
}

function toUtcMs(date: PlainDate): number {
  return Date.UTC(date.year, date.month - 1, date.day);
}

function fromUtcMs(ms: number): PlainDate {
  const d = new Date(ms);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(date: PlainDate): number {
  return new Date(toUtcMs(date)).getUTCDay();
}

export function addDays(date: PlainDate, days: number): PlainDate {
  return fromUtcMs(toUtcMs(date) + days * 86_400_000);
}

/** Adds months, keeping the day where it exists (31 Jan + 1 month → 28 or 29 Feb). */
export function addMonths(date: PlainDate, months: number): PlainDate {
  const index = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

export function addYears(date: PlainDate, years: number): PlainDate {
  return addMonths(date, years * 12);
}

export function compareDates(a: PlainDate, b: PlainDate): number {
  return toUtcMs(a) - toUtcMs(b);
}

export function sameDay(a: PlainDate | null | undefined, b: PlainDate | null | undefined): boolean {
  return Boolean(a && b && a.year === b.year && a.month === b.month && a.day === b.day);
}

/** Whole days from a to b (inclusive count is this + 1). */
export function daysBetween(a: PlainDate, b: PlainDate): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / 86_400_000);
}

export function startOfWeek(date: PlainDate): PlainDate {
  return addDays(date, -((weekday(date) - WEEK_STARTS_ON + 7) % 7));
}

export function endOfWeek(date: PlainDate): PlainDate {
  return addDays(startOfWeek(date), 6);
}

export function startOfMonth(date: PlainDate): PlainDate {
  return { year: date.year, month: date.month, day: 1 };
}

export function endOfMonth(date: PlainDate): PlainDate {
  return { year: date.year, month: date.month, day: daysInMonth(date.year, date.month) };
}

export function clampDate(date: PlainDate, min?: PlainDate | null, max?: PlainDate | null): PlainDate {
  if (min && compareDates(date, min) < 0) return min;
  if (max && compareDates(date, max) > 0) return max;
  return date;
}

/** Today's calendar date in a time zone (the institution's, by default). */
export function todayIn(timeZone: string = DEFAULT_TIME_ZONE, now: Date = new Date()): PlainDate {
  return calendarDate(now, timeZone);
}

// -- display -----------------------------------------------------------------------------------

/** The canonical display form: "06 Oct 2026". */
export function formatPlainDate(date: PlainDate): string {
  return `${pad2(date.day)} ${MONTHS_SHORT[date.month - 1]} ${date.year}`;
}

/** The accessible name of a calendar day: "Tuesday, 6 October 2026". */
export function formatLongDate(date: PlainDate): string {
  return `${WEEKDAYS_LONG[weekday(date)]}, ${date.day} ${MONTHS_LONG[date.month - 1]} ${date.year}`;
}

/** The summary form: "Tue, 06 Oct 2026". */
export function formatWeekdayDate(date: PlainDate): string {
  return `${WEEKDAYS_SHORT[weekday(date)]}, ${formatPlainDate(date)}`;
}

/** "October 2026" (calendar caption). */
export function formatMonthYear(year: number, month: number): string {
  return `${MONTHS_LONG[month - 1]} ${year}`;
}

/**
 * A range for a trigger: "1 Sept - 30 Sept 2026", "28 Sept - 4 Oct 2026",
 * "20 Dec 2025 - 5 Jan 2026"; one day prints once.
 */
export function formatRangeShort(from: PlainDate, to: PlainDate): string {
  if (sameDay(from, to)) return `${from.day} ${MONTHS_SHORT[from.month - 1]} ${from.year}`;
  const start =
    from.year === to.year ? `${from.day} ${MONTHS_SHORT[from.month - 1]}` : `${from.day} ${MONTHS_SHORT[from.month - 1]} ${from.year}`;
  return `${start} - ${to.day} ${MONTHS_SHORT[to.month - 1]} ${to.year}`;
}

/** A range spelt out for an accessible name: "1 September to 30 September 2026". */
export function formatRangeLong(from: PlainDate, to: PlainDate): string {
  if (sameDay(from, to)) return `${from.day} ${MONTHS_LONG[from.month - 1]} ${from.year}`;
  const start =
    from.year === to.year ? `${from.day} ${MONTHS_LONG[from.month - 1]}` : `${from.day} ${MONTHS_LONG[from.month - 1]} ${from.year}`;
  return `${start} to ${to.day} ${MONTHS_LONG[to.month - 1]} ${to.year}`;
}

// -- typed input ---------------------------------------------------------------------------------

const MONTH_WORDS: Record<string, number> = {};
MONTHS_LONG.forEach((name, index) => {
  const lower = name.toLowerCase();
  MONTH_WORDS[lower] = index + 1;
  MONTH_WORDS[lower.slice(0, 3)] = index + 1;
});
MONTH_WORDS.sept = 9;

/** A month typed as a number (1-12) or a name ("oct", "October", "Sept"). */
export function parseMonth(text: string): number | null {
  const value = text.trim().toLowerCase().replace(/\.$/, "");
  if (/^\d{1,2}$/.test(value)) {
    const month = Number(value);
    return month >= 1 && month <= 12 ? month : null;
  }
  return MONTH_WORDS[value] ?? null;
}

/** Two-digit years: 00 to 69 are the 2000s, 70 to 99 the 1900s. */
export function expandYear(text: string): number | null {
  if (/^\d{4}$/.test(text)) return Number(text);
  if (/^\d{2}$/.test(text)) {
    const year = Number(text);
    return year <= 69 ? 2000 + year : 1900 + year;
  }
  return null;
}

export type ParsedDate = { ok: true; date: PlainDate } | { ok: false; reason: "unreadable" | "nonexistent" };

/**
 * Reads a typed date. Day first, never month first. Accepted: DD/MM/YYYY, D/M/YY, DD-MM-YYYY,
 * DD.MM.YYYY, "6 Oct 2026", "6 Sept 2026", "06 Oct 2026" and "2026-10-06". A shape that matches
 * but names no real day ("31/02/2026") is "nonexistent"; anything else is "unreadable".
 */
export function parseTypedDate(text: string): ParsedDate {
  const value = text.trim().replace(/\s+/g, " ");
  if (!value) return { ok: false, reason: "unreadable" };

  let parts: { day: number; month: number | null; year: number | null } | null = null;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  const numeric = /^(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{2}|\d{4})$/.exec(value);
  const named = /^(\d{1,2})(?:st|nd|rd|th)?[\s/.-]+([a-z]+)\.?,?[\s/.-]+(\d{2}|\d{4})$/i.exec(value);

  if (iso) parts = { day: Number(iso[3]), month: Number(iso[2]), year: Number(iso[1]) };
  else if (numeric) parts = { day: Number(numeric[1]), month: Number(numeric[2]), year: expandYear(numeric[3]) };
  else if (named) {
    const month = parseMonth(named[2]);
    if (month === null) return { ok: false, reason: "unreadable" };
    parts = { day: Number(named[1]), month, year: expandYear(named[3]) };
  }

  if (!parts || parts.year === null || parts.month === null) return { ok: false, reason: "unreadable" };
  const date = { year: parts.year, month: parts.month, day: parts.day };
  return isValidDate(date) ? { ok: true, date } : { ok: false, reason: "nonexistent" };
}

/** Day, month and year typed in three boxes (the memorable-date inputs). */
export function parseDateParts(day: string, month: string, year: string): ParsedDate {
  const d = day.trim();
  const m = month.trim();
  const y = year.trim();
  if (!/^\d{1,2}$/.test(d) || !/^\d{4}$/.test(y)) return { ok: false, reason: "unreadable" };
  const monthNumber = parseMonth(m);
  if (monthNumber === null) {
    return /^\d{1,2}$/.test(m) ? { ok: false, reason: "nonexistent" } : { ok: false, reason: "unreadable" };
  }
  const date = { year: Number(y), month: monthNumber, day: Number(d) };
  return isValidDate(date) ? { ok: true, date } : { ok: false, reason: "nonexistent" };
}

/** The error copy for a typed date (components.md DatePicker content). */
export function dateErrorMessage(
  result: ParsedDate,
  { min, max, example = "06/10/2026" }: { min?: PlainDate | null; max?: PlainDate | null; example?: string } = {},
): string | null {
  if (!result.ok) {
    return result.reason === "nonexistent"
      ? "That date doesn't exist. Check the day and month."
      : `Enter a date like ${example}.`;
  }
  if (min && compareDates(result.date, min) < 0) return `Choose a date on or after ${formatPlainDate(min)}.`;
  if (max && compareDates(result.date, max) > 0) return `Choose a date on or before ${formatPlainDate(max)}.`;
  return null;
}

/** The weeks shown for a month: rows of 7 dates, including the days of the months around it. */
export function monthGrid(year: number, month: number): PlainDate[][] {
  const first = startOfWeek({ year, month, day: 1 });
  const last = endOfWeek(endOfMonth({ year, month, day: 1 }));
  const weeks: PlainDate[][] = [];
  let cursor = first;
  while (compareDates(cursor, last) <= 0) {
    const week: PlainDate[] = [];
    for (let i = 0; i < 7; i += 1) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}
