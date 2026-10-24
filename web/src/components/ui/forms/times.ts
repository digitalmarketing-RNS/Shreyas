/**
 * Times of day and time zones for DateTimePicker (components.md, "DateTimePicker (with time zone)").
 *
 * - Typed times: "4:30 pm", "4.30pm", "16:30", "1630", "430p", "4". Without am or pm, 1:00 to 7:59
 *   means pm, 8:00 to 11:59 means am and 12 means noon (open question 8).
 * - Zones: IANA names from Intl.supportedValuesOf("timeZone"), with V8's legacy aliases turned
 *   into current names (Asia/Calcutta → Asia/Kolkata) before anything is listed, compared or stored.
 * - A local date and time in a zone becomes one UTC instant; a time skipped by a clock change is
 *   reported, and a time that happens twice takes its first occurrence.
 */

import type { PlainDate } from "./dates";

export type PlainTime = { hour: number; minute: number };

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Reads a typed time, or null when it cannot be read. */
export function parseTypedTime(text: string): PlainTime | null {
  let value = text.trim().toLowerCase().replace(/\s+/g, "");
  if (!value) return null;

  let meridiem: "am" | "pm" | null = null;
  const suffix = /(a\.?m?\.?|p\.?m?\.?)$/.exec(value);
  if (suffix) {
    meridiem = suffix[1].startsWith("a") ? "am" : "pm";
    value = value.slice(0, suffix.index);
  }
  if (meridiem === null && /noon$/.test(value)) return { hour: 12, minute: 0 };

  let hour: number;
  let minute: number;
  const separated = /^(\d{1,2})[:.](\d{2})$/.exec(value);
  if (separated) {
    hour = Number(separated[1]);
    minute = Number(separated[2]);
  } else if (/^\d{1,2}$/.test(value)) {
    hour = Number(value);
    minute = 0;
  } else if (/^\d{3,4}$/.test(value)) {
    hour = Number(value.slice(0, value.length - 2));
    minute = Number(value.slice(-2));
  } else {
    return null;
  }
  if (minute > 59) return null;

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === "am") hour = hour === 12 ? 0 : hour;
    else hour = hour === 12 ? 12 : hour + 12;
    return { hour, minute };
  }
  if (hour > 23) return null;
  if (hour >= 1 && hour <= 7) hour += 12; // 1:00 to 7:59 without am or pm means the afternoon
  return { hour, minute };
}

/** "4:30 pm", "12:00 pm", "12:15 am". */
export function formatTime12(time: PlainTime): string {
  const meridiem = time.hour < 12 ? "am" : "pm";
  const hour = time.hour % 12 === 0 ? 12 : time.hour % 12;
  return `${hour}:${pad2(time.minute)} ${meridiem}`;
}

export function timeKey(time: PlainTime): string {
  return `${pad2(time.hour)}:${pad2(time.minute)}`;
}

export function sameTime(a: PlainTime | null | undefined, b: PlainTime | null | undefined): boolean {
  return Boolean(a && b && a.hour === b.hour && a.minute === b.minute);
}

/** Every 15 minutes of the day, 12:00 am to 11:45 pm. */
export const QUARTER_HOURS: PlainTime[] = Array.from({ length: 96 }, (_, index) => ({
  hour: Math.floor(index / 4),
  minute: (index % 4) * 15,
}));

/** The quarter hour at or after a time (the list opens there when nothing is chosen). */
export function nextQuarterHour(time: PlainTime): PlainTime {
  const minutes = Math.ceil((time.hour * 60 + time.minute) / 15) * 15;
  const capped = Math.min(minutes, 23 * 60 + 45);
  return { hour: Math.floor(capped / 60), minute: capped % 60 };
}

// -- time zones ------------------------------------------------------------------------------------

/** V8 (Chrome, Edge, Node) still uses some old names; these map them to current IANA names. */
export const ZONE_ALIASES: Record<string, string> = {
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Rangoon": "Asia/Yangon",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Europe/Kiev": "Europe/Kyiv",
};

export function canonicalZone(zone: string): string {
  return ZONE_ALIASES[zone] ?? zone;
}

/** The city part of a zone name: "Asia/Kolkata" → "Kolkata", "America/New_York" → "New York". */
export function zoneCity(zone: string): string {
  const last = zone.split("/").pop() ?? zone;
  return last.replace(/_/g, " ");
}

/** Every zone the runtime knows, under current names, A to Z by city. */
export function listZones(): string[] {
  let zones: string[] = [];
  try {
    zones = Intl.supportedValuesOf("timeZone");
  } catch {
    zones = [];
  }
  const set = new Set(zones.map(canonicalZone));
  set.add("Asia/Kolkata");
  set.add("UTC");
  return [...set].sort((a, b) => zoneCity(a).localeCompare(zoneCity(b), "en"));
}

/** The browser's zone, under its current name. */
export function browserZone(): string {
  try {
    return canonicalZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return "UTC";
  }
}

const zoneFormats = new Map<string, Intl.DateTimeFormat>();
function zoneFormat(zone: string, key: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const id = `${zone}|${key}`;
  let format = zoneFormats.get(id);
  if (!format) {
    format = new Intl.DateTimeFormat("en-IN", { ...options, timeZone: zone });
    zoneFormats.set(id, format);
  }
  return format;
}

/** The zone's offset from UTC in minutes at an instant (Kolkata: 330). */
export function zoneOffsetMinutes(zone: string, utcMs: number): number {
  const parts = zoneFormat(zone, "parts", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(utcMs));
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60_000);
}

/** "UTC+05:30", "UTC−04:00", "UTC+00:00". */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? "−" : "+";
  const abs = Math.abs(minutes);
  return `UTC${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

function zoneName(zone: string, utcMs: number, style: "long" | "short"): string {
  const parts = zoneFormat(zone, style, { timeZoneName: style, hour: "numeric" }).formatToParts(new Date(utcMs));
  return parts.find((part) => part.type === "timeZoneName")?.value ?? zone;
}

/** "India Standard Time", "Gulf Standard Time", "British Summer Time". */
export function zoneLongName(zone: string, utcMs: number): string {
  return zoneName(zone, utcMs, "long");
}

/** "IST" (en-IN), "GST", "GMT+4"… */
export function zoneShortName(zone: string, utcMs: number): string {
  return zoneName(zone, utcMs, "short");
}

/** The option label: "India Standard Time (UTC+05:30) · Kolkata". */
export function zoneLabel(zone: string, utcMs: number): string {
  return `${zoneLongName(zone, utcMs)} (${formatOffset(zoneOffsetMinutes(zone, utcMs))}) · ${zoneCity(zone)}`;
}

export type ZonedResult = { status: "ok" | "ambiguous"; utcMs: number } | { status: "gap"; utcMs: null };

/**
 * The UTC instant of a wall-clock date and time in a zone. "gap": the time does not exist (clocks
 * go forward); "ambiguous": it happens twice (clocks go back), and the first occurrence is used.
 */
export function zonedToUtc(date: PlainDate, time: PlainTime, zone: string): ZonedResult {
  const local = Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute);
  const offsets = new Set([
    zoneOffsetMinutes(zone, local - 36 * 3_600_000),
    zoneOffsetMinutes(zone, local),
    zoneOffsetMinutes(zone, local + 36 * 3_600_000),
  ]);
  const candidates = [...offsets]
    .map((offset) => local - offset * 60_000)
    .filter((utc) => zoneOffsetMinutes(zone, utc) * 60_000 === local - utc)
    .sort((a, b) => a - b);
  const unique = [...new Set(candidates)];
  if (unique.length === 0) return { status: "gap", utcMs: null };
  return { status: unique.length > 1 ? "ambiguous" : "ok", utcMs: unique[0] };
}

/** The wall-clock date and time of an instant in a zone. */
export function utcToZoned(utcMs: number, zone: string): { date: PlainDate; time: PlainTime } {
  const shifted = new Date(utcMs + zoneOffsetMinutes(zone, utcMs) * 60_000);
  return {
    date: { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() },
    time: { hour: shifted.getUTCHours(), minute: shifted.getUTCMinutes() },
  };
}

/** Hours from one instant to another (negative when `to` is earlier). */
export function hoursBetween(fromUtcMs: number, toUtcMs: number): number {
  return (toUtcMs - fromUtcMs) / 3_600_000;
}

