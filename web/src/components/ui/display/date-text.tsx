import {
  DEFAULT_TIME_ZONE,
  MISSING,
  formatDate,
  formatDateRange,
  formatDateShort,
  formatDateTime,
  formatDateTimeWithZone,
  formatTime,
  formatTimeWithZone,
  toDateTimeAttribute,
} from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * - date: "06 Oct 2026". date-short: "06 Oct" in the current year (feeds and cards only).
 * - time: "2:30 pm". time-zone: "2:30 pm IST".
 * - date-time: "06 Oct 2026, 2:30 pm". with-zone: "06 Oct 2026, 2:30 pm IST" (follow-ups,
 *   scheduled sends, link expiry, receipts, the audit log, and when the viewer's zone differs).
 * - range: "6–12 Oct 2026", "30 Sept – 4 Oct 2026".
 */
export type DateTextVariant = "date" | "date-short" | "time" | "time-zone" | "date-time" | "with-zone" | "range";

type DateInput = Date | string | number;

export type DateTextProps = {
  value: DateInput | null;
  variant?: DateTextVariant;
  /** range: the end. */
  end?: DateInput;
  /** The org's zone, or a follow-up's own stored zone. */
  timeZone?: string;
  /** date-short: the reference "now" for the current-year test. */
  now?: DateInput;
  /** Meta lines use text-muted; content text-fg. */
  muted?: boolean;
  className?: string;
};

/**
 * A date, a time, or both, in the institution's time zone, with the zone named where a time drives
 * an action (components.md, DateText). <time dateTime="{ISO}">; formatted on the server.
 */
export function DateText({ value, variant = "date", end, timeZone = DEFAULT_TIME_ZONE, now, muted = false, className }: DateTextProps) {
  const tone = muted ? "text-muted" : "text-fg";
  if (value === null || value === undefined) {
    return (
      <span className={cn("text-muted", className)}>
        <span aria-hidden="true">{MISSING}</span>
        <span className="sr-only">No date</span>
      </span>
    );
  }
  if (variant === "range" && end !== undefined) {
    return (
      <span className={cn(tone, "tabular-nums", className)} data-start={toDateTimeAttribute(value)} data-end={toDateTimeAttribute(end)}>
        {formatDateRange(value, end, { timeZone })}
      </span>
    );
  }
  const text =
    variant === "date-short"
      ? formatDateShort(value, { timeZone, now })
      : variant === "time"
        ? formatTime(value, { timeZone })
        : variant === "time-zone"
          ? formatTimeWithZone(value, { timeZone })
          : variant === "date-time"
            ? formatDateTime(value, { timeZone })
            : variant === "with-zone"
              ? formatDateTimeWithZone(value, { timeZone })
              : formatDate(value, { timeZone });
  return (
    <time dateTime={toDateTimeAttribute(value)} className={cn(tone, "tabular-nums", className)}>
      {text}
    </time>
  );
}
