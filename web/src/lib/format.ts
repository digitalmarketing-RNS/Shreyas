/**
 * Display formatting for the whole app (decisions.md section 3; components.md "Formatters as
 * display components").
 *
 * - Always the en-IN locale, whatever the browser's: 1,23,45,678; "06 Oct 2026, 2:30 pm IST".
 * - Data stays raw: money as integer minor units (paise), times as UTC instants, phone numbers in
 *   E.164. These functions only turn them into strings.
 * - Format on the server and pass strings to client components. Browsers ship their own ICU
 *   data, so formatting in the browser can disagree with the server and break hydration. The unit
 *   tests pin the outputs of Node 22 (ICU 77.1, CLDR 47).
 * - Masking helpers produce the masked string for display. Masking itself happens on the server:
 *   a role that may not see a value must never receive it.
 */

export const LOCALE = "en-IN";
/** The default org time zone. A follow-up displays in its own stored zone. */
export const DEFAULT_TIME_ZONE = "Asia/Kolkata";
/** U+2212, the minus sign used for negative amounts and deltas. */
export const MINUS = "−";
/** Shown for a missing value; components add sr-only text such as "Not set". */
export const MISSING = "—";
/** U+2022, the mask character (it is in our Inter subset). */
export const MASK_CHAR = "•";

type DateInput = Date | string | number;
type ZoneOptions = { timeZone?: string };

const numberFormats = new Map<string, Intl.NumberFormat>();
function numberFormat(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options);
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(LOCALE, options);
    numberFormats.set(key, format);
  }
  return format;
}

const dateFormats = new Map<string, Intl.DateTimeFormat>();
function dateFormat(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(options);
  let format = dateFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(LOCALE, options);
    dateFormats.set(key, format);
  }
  return format;
}

/** Replaces a leading hyphen-minus with U+2212. */
function withMinus(text: string): string {
  return text.replace(/^-/, MINUS);
}

// -- numbers -------------------------------------------------------------------------------

/** Counts in Indian grouping: 12345678 → "1,23,45,678". */
export function formatNumber(value: number | bigint): string {
  return withMinus(numberFormat({ maximumFractionDigits: 2 }).format(value));
}

/** Short counts for KPI tiles and chart axes: "12L", "1.2Cr", "12.5K". Show the exact value nearby. */
export function formatCompactNumber(value: number | bigint): string {
  return withMinus(numberFormat({ notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(value));
}

/** A ratio as a percentage with at most one decimal: 0.1234 → "12.3%". Not finite → "—". */
export function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return MISSING;
  return withMinus(numberFormat({ style: "percent", maximumFractionDigits: 1 }).format(ratio));
}

/** part / whole as a percentage; "—" when the whole is zero (components add sr-only "Not available"). */
export function formatShare(part: number, whole: number): string {
  if (whole === 0) return MISSING;
  return formatPercent(part / whole);
}

/** A change as a signed percentage: "+12.3%", "−4.1%", "0%". */
export function formatPercentChange(ratio: number): string {
  if (!Number.isFinite(ratio)) return MISSING;
  return withMinus(numberFormat({ style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(ratio));
}

/** A change in percentage points: "+4 pts", "−4 pts", "+1 pt", "0 pts". */
export function formatPointsChange(points: number): string {
  if (!Number.isFinite(points)) return MISSING;
  const text = numberFormat({ maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(points);
  return `${withMinus(text)} ${Math.abs(points) === 1 ? "pt" : "pts"}`;
}

// -- money ---------------------------------------------------------------------------------

/** Money in integer minor units (paise for INR): a bigint, or a string of digits. Never a JS number. */
export type MinorUnits = bigint | string;

export type MoneyOptions = { currency?: string };

function toBigInt(value: MinorUnits): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) return BigInt(value.trim());
  throw new RangeError(`Money must be integer minor units as a bigint or a digit string, got ${String(value)}`);
}

/** Number of minor-unit digits for a currency: INR 2, USD 2, JPY 0, KWD 3. */
export function currencyDigits(currency = "INR"): number {
  return numberFormat({ style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

/**
 * Integer minor units as an exact decimal string, without a float: 123456789n → "1234567.89",
 * -50000n → "-500.00". Intl.NumberFormat formats such strings exactly.
 */
export function minorUnitsToDecimal(value: MinorUnits, currency = "INR"): `${number}` {
  const units = toBigInt(value);
  const digits = currencyDigits(currency);
  const negative = units < BigInt(0);
  const abs = negative ? -units : units;
  if (digits === 0) return `${negative ? "-" : ""}${abs.toString()}` as `${number}`;
  const scale = BigInt(10) ** BigInt(digits);
  const whole = abs / scale;
  const fraction = (abs % scale).toString().padStart(digits, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${fraction}` as `${number}`;
}

function currencyOptions(currency: string): Intl.NumberFormatOptions {
  // "$" alone is ambiguous next to rupee amounts, so other currencies show their ISO code.
  return { style: "currency", currency, currencyDisplay: currency === "INR" ? "symbol" : "code" };
}

/**
 * Exact money with all minor digits: 123456789n → "₹12,34,567.89"; 0n → "₹0.00";
 * -50000n → "−₹500.00" (the caller adds a word such as "refund"; never a minus sign alone).
 */
export function formatMoney(value: MinorUnits, { currency = "INR" }: MoneyOptions = {}): string {
  const digits = currencyDigits(currency);
  const decimal = minorUnitsToDecimal(value, currency);
  const format = numberFormat({ ...currencyOptions(currency), minimumFractionDigits: digits, maximumFractionDigits: digits });
  // Intl.NumberFormat accepts decimal strings (Intl.NumberFormat v3) and formats them exactly.
  return withMinus(format.format(decimal));
}

/**
 * Short money for KPI tiles and chart axes only: "₹1.5L", "₹1.2Cr", "₹50K". Always pair it with
 * the exact amount (tooltip and accessible name). Never the long form ("12 million").
 */
export function formatMoneyCompact(value: MinorUnits, { currency = "INR" }: MoneyOptions = {}): string {
  const decimal = minorUnitsToDecimal(value, currency);
  const format = numberFormat({
    ...currencyOptions(currency),
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  return withMinus(format.format(decimal));
}

// -- dates and times -------------------------------------------------------------------------

function toDate(value: DateInput): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new RangeError(`Invalid date: ${String(value)}`);
  return date;
}

/** The machine value for <time dateTime>: an ISO 8601 instant in UTC. */
export function toDateTimeAttribute(value: DateInput): string {
  return toDate(value).toISOString();
}

const DATE: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
const DATE_SHORT: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
const TIME: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true };

/** "06 Oct 2026". September prints "Sept", so leave room for four letters. */
export function formatDate(value: DateInput, { timeZone = DEFAULT_TIME_ZONE }: ZoneOptions = {}): string {
  return dateFormat({ ...DATE, timeZone }).format(toDate(value));
}

/** "06 Oct" when the date falls in the current year (in the zone), else "06 Oct 2025". Feeds and cards only. */
export function formatDateShort(
  value: DateInput,
  { timeZone = DEFAULT_TIME_ZONE, now = new Date() }: ZoneOptions & { now?: DateInput } = {},
): string {
  const date = toDate(value);
  if (calendarDate(date, timeZone).year !== calendarDate(toDate(now), timeZone).year) return formatDate(date, { timeZone });
  return dateFormat({ ...DATE_SHORT, timeZone }).format(date);
}

/** "2:30 pm". */
export function formatTime(value: DateInput, { timeZone = DEFAULT_TIME_ZONE }: ZoneOptions = {}): string {
  return dateFormat({ ...TIME, timeZone }).format(toDate(value));
}

/** "2:30 pm IST" (en-IN names Asia/Kolkata "IST"; other zones print as "GST", "GMT+4" and so on). */
export function formatTimeWithZone(value: DateInput, { timeZone = DEFAULT_TIME_ZONE }: ZoneOptions = {}): string {
  return dateFormat({ ...TIME, timeZoneName: "short", timeZone }).format(toDate(value));
}

/** "06 Oct 2026, 2:30 pm". */
export function formatDateTime(value: DateInput, { timeZone = DEFAULT_TIME_ZONE }: ZoneOptions = {}): string {
  return dateFormat({ ...DATE, ...TIME, timeZone }).format(toDate(value));
}

/**
 * "06 Oct 2026, 2:30 pm IST". For follow-ups, scheduled sends, payment-link expiry, receipts, the
 * audit log, and whenever the viewer's browser zone differs from the org's.
 */
export function formatDateTimeWithZone(value: DateInput, { timeZone = DEFAULT_TIME_ZONE }: ZoneOptions = {}): string {
  return dateFormat({ ...DATE, ...TIME, timeZoneName: "short", timeZone }).format(toDate(value));
}

/** "6–12 Oct 2026", "30 Sept – 4 Oct 2026" (ICU's range pattern drops the leading zero). */
export function formatDateRange(
  start: DateInput,
  end: DateInput,
  { timeZone = DEFAULT_TIME_ZONE }: ZoneOptions = {},
): string {
  return dateFormat({ ...DATE, timeZone }).formatRange(toDate(start), toDate(end));
}

type CalendarDate = { year: number; month: number; day: number };

/** The calendar date of an instant in a time zone. */
export function calendarDate(value: DateInput, timeZone = DEFAULT_TIME_ZONE): CalendarDate {
  const parts = dateFormat({ year: "numeric", month: "numeric", day: "numeric", timeZone }).formatToParts(toDate(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Whole calendar days from `from` to `to` in the zone (yesterday → today is 1). */
function calendarDaysBetween(from: Date, to: Date, timeZone: string): number {
  const a = calendarDate(from, timeZone);
  const b = calendarDate(to, timeZone);
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000);
}

const relative = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto", style: "short" });

/**
 * Feed times (timeline, notifications, inbox, "last engaged"): "just now", "5 min ago",
 * "3 hr ago", "yesterday", "3 days ago"; from 7 days on, the absolute date "29 Sept 2026".
 * Render the absolute value on the server and swap this in on the client after mount.
 */
export function formatRelativeTime(
  value: DateInput,
  { now = new Date(), timeZone = DEFAULT_TIME_ZONE }: ZoneOptions & { now?: DateInput } = {},
): string {
  const date = toDate(value);
  const current = toDate(now);
  const seconds = (current.getTime() - date.getTime()) / 1000;
  if (Math.abs(seconds) < 60) return "just now";
  if (seconds < 0) return formatDateTime(date, { timeZone }); // the future is never relative in feeds
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return relative.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return relative.format(-hours, "hour");
  const days = calendarDaysBetween(date, current, timeZone);
  if (days < 7) return relative.format(-Math.max(days, 1), "day");
  return formatDate(date, { timeZone });
}

export type DueState = "overdue" | "today" | "tomorrow" | "upcoming";

/**
 * Due times are never relative alone; the absolute time is always in the text:
 * "Overdue · due 05 Oct, 4:00 pm IST", "Due today · 4:00 pm IST",
 * "Due tomorrow · 10:00 am IST", "Due 09 Oct, 10:00 am IST".
 */
export function formatDue(
  value: DateInput,
  { now = new Date(), timeZone = DEFAULT_TIME_ZONE }: ZoneOptions & { now?: DateInput } = {},
): { state: DueState; text: string } {
  const due = toDate(value);
  const current = toDate(now);
  const time = formatTimeWithZone(due, { timeZone });
  const dayAndTime = `${formatDateShort(due, { timeZone, now: current })}, ${time}`;
  if (due.getTime() < current.getTime()) return { state: "overdue", text: `Overdue · due ${dayAndTime}` };
  const days = calendarDaysBetween(current, due, timeZone);
  if (days === 0) return { state: "today", text: `Due today · ${time}` };
  if (days === 1) return { state: "tomorrow", text: `Due tomorrow · ${time}` };
  return { state: "upcoming", text: `Due ${dayAndTime}` };
}

// -- lists ---------------------------------------------------------------------------------

/** "Email, SMS and WhatsApp". */
export function formatList(items: readonly string[], type: "conjunction" | "disjunction" = "conjunction"): string {
  return new Intl.ListFormat(LOCALE, { style: "long", type }).format(items);
}

// -- phone numbers -------------------------------------------------------------------------

const E164 = /^\+[1-9]\d{6,14}$/;
/** Indian two-digit STD codes (the metros); other landline codes have three or four digits. */
const INDIA_METRO_CODES = new Set(["11", "20", "22", "33", "40", "44", "79", "80"]);

type PhoneKind = "auto" | "mobile" | "landline";
type SplitPhone = { countryCode: string; groups: string[] };

function groupDigits(digits: string, sizes: number[]): string[] {
  const groups: string[] = [];
  let index = 0;
  for (const size of sizes) {
    groups.push(digits.slice(index, index + size));
    index += size;
  }
  return groups;
}

function splitPhone(e164: string, kind: PhoneKind): SplitPhone | null {
  if (!E164.test(e164)) return null;
  const digits = e164.slice(1);
  if (digits.startsWith("91") && digits.length === 12) {
    const national = digits.slice(2);
    const landline = kind === "landline" || (kind === "auto" && /^[1-5]/.test(national));
    if (!landline) return { countryCode: "91", groups: groupDigits(national, [5, 5]) };
    const code = INDIA_METRO_CODES.has(national.slice(0, 2)) ? 2 : 3;
    return { countryCode: "91", groups: groupDigits(national, code === 2 ? [2, 4, 4] : [3, 3, 4]) };
  }
  if (digits.startsWith("971")) {
    const national = digits.slice(3);
    if (national.length === 9) return { countryCode: "971", groups: groupDigits(national, [2, 3, 4]) };
    if (national.length === 8) return { countryCode: "971", groups: groupDigits(national, [1, 3, 4]) };
    return null;
  }
  if (digits.startsWith("65") && digits.length === 10) {
    return { countryCode: "65", groups: groupDigits(digits.slice(2), [4, 4]) };
  }
  if (digits.startsWith("61") && digits.length === 11 && digits[2] === "4") {
    return { countryCode: "61", groups: groupDigits(digits.slice(2), [3, 3, 3]) };
  }
  if (digits.startsWith("44") && digits.length === 12 && digits[2] === "7") {
    return { countryCode: "44", groups: groupDigits(digits.slice(2), [4, 6]) };
  }
  if (digits.startsWith("1") && digits.length === 11) {
    return { countryCode: "1", groups: groupDigits(digits.slice(1), [3, 3, 4]) };
  }
  return null;
}

/**
 * An E.164 number grouped the way people read and dial it: "+91 98765 43210",
 * "+91 80 2612 3456" (kind "landline"), "+971 50 123 4567".
 *
 * India: numbers starting 1–5 are landlines; numbers starting 6–9 are shown as mobiles unless the
 * caller knows the number is a landline (Bengaluru 80 and Ahmedabad 79 overlap the mobile ranges,
 * and the type is never guessed from the first digit). Also grouped: UAE, Singapore, Australian
 * and UK mobiles, and +1. Anything else, or anything that is not E.164, comes back unchanged.
 * The server validates numbers; this is display only.
 */
export function formatPhone(e164: string, { kind = "auto" }: { kind?: PhoneKind } = {}): string {
  const split = splitPhone(e164.trim(), kind);
  if (!split) return e164;
  return `+${split.countryCode} ${split.groups.join(" ")}`;
}

/** The last `count` digits of a number: "3210". */
export function lastDigits(value: string, count = 4): string {
  return value.replace(/\D/g, "").slice(-count);
}

function maskAllButLast(text: string, keep: number): string {
  let digitsLeft = text.replace(/\D/g, "").length;
  let out = "";
  for (const char of text) {
    if (/\d/.test(char)) {
      out += digitsLeft > keep ? MASK_CHAR : char;
      digitsLeft -= 1;
    } else {
      out += char;
    }
  }
  return out;
}

/**
 * The masked form of a phone number, for roles that may not see it: "+91 ••••• •3210" (country
 * code and last four digits). Run it on the server; never send the full number to such a role.
 */
export function maskPhone(e164: string, { kind = "auto" }: { kind?: PhoneKind } = {}): string {
  const split = splitPhone(e164.trim(), kind);
  if (!split) return `+${maskAllButLast(e164.replace(/^\+/, ""), 4)}`;
  return `+${split.countryCode} ${maskAllButLast(split.groups.join(" "), 4)}`;
}

/** The sentence screen readers get instead of the dots: "Mobile number hidden, ends in 3210". */
export function describeMaskedPhone(e164: string, label = "Mobile number"): string {
  return `${label} hidden, ends in ${lastDigits(e164)}`;
}

function splitEmail(email: string): { local: string; domain: string } | null {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;
  return { local: email.slice(0, at), domain: email.slice(at + 1) };
}

/** The masked form of an email: "pr•••@gmail.com" (first two characters and the domain). */
export function maskEmail(email: string): string {
  const parts = splitEmail(email.trim());
  const dots = MASK_CHAR.repeat(3);
  if (!parts) return dots;
  const shown = Array.from(parts.local).slice(0, parts.local.length > 2 ? 2 : 1).join("");
  return `${shown}${dots}@${parts.domain}`;
}

/** "Email hidden, starts pr, at gmail.com". */
export function describeMaskedEmail(email: string): string {
  const parts = splitEmail(email.trim());
  if (!parts) return "Email hidden";
  const shown = Array.from(parts.local).slice(0, parts.local.length > 2 ? 2 : 1).join("");
  return `Email hidden, starts ${shown}, at ${parts.domain}`;
}
