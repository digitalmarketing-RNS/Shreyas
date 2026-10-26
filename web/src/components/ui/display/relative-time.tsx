"use client";

import { AlarmClock } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Tooltip } from "@/components/ui/overlays/tooltip";
import { cn } from "@/lib/cn";
import { DEFAULT_TIME_ZONE, formatDateTimeWithZone, formatDue, formatRelativeTime, toDateTimeAttribute } from "@/lib/format";
import { StatusPill } from "./status-pill";

/* One shared clock for every RelativeTime on the page: it ticks every 60 s and pauses while the
 * tab is hidden (it catches up when the tab comes back). */
const listeners = new Set<() => void>();
let clockNow = Date.now();
let timer: number | undefined;

function tick() {
  clockNow = Date.now();
  for (const listener of listeners) listener();
}

function onVisibility() {
  if (document.visibilityState === "visible") tick();
}

function subscribeClock(listener: () => void) {
  listeners.add(listener);
  if (timer === undefined) {
    clockNow = Date.now();
    timer = window.setInterval(() => {
      if (document.visibilityState === "visible") tick();
    }, 60_000);
    document.addEventListener("visibilitychange", onVisibility);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
      document.removeEventListener("visibilitychange", onVisibility);
    }
  };
}

const getClock = () => clockNow;
const getServerClock = () => null;

export type RelativeTimeProps = {
  /** The instant, ISO 8601 (UTC). */
  value: string;
  /**
   * past (feeds only: timeline, notifications, inbox, "last engaged"): "5 min ago", from 7 days on
   * the absolute date. due (follow-ups, payment-link expiry): "Overdue · due 05 Oct, 4:00 pm IST";
   * the absolute time is always shown.
   */
  variant?: "past" | "due";
  /** The absolute date-time with zone, formatted on the server ("06 Oct 2026, 2:30 pm IST"). */
  absolute?: string;
  timeZone?: string;
  /**
   * A fixed reference instant: the text is relative from the first render and does not tick
   * (previews and tests). Without it the server renders the absolute string and the client swaps
   * in the relative text after mount.
   */
  now?: string;
  /**
   * Inside a focusable parent (a feed item link, a row link): not a second tab stop; the tooltip
   * opens while the parent has focus.
   */
  inFocusable?: boolean;
  /** In table cells: min-w-20 so the swap doesn't move columns; overdue shows as a StatusPill. */
  inTable?: boolean;
  className?: string;
};

/**
 * How long ago something happened, with the exact date and time one hover or focus away; and due
 * times in words that are never relative alone (components.md, RelativeTime). The accessible text
 * holds both forms ("5 min ago, 06 Oct 2026, 2:30 pm IST"). The refresh never announces. On touch
 * a tap toggles the tooltip.
 */
export function RelativeTime({
  value,
  variant = "past",
  absolute: absoluteProp,
  timeZone = DEFAULT_TIME_ZONE,
  now,
  inFocusable = false,
  inTable = false,
  className,
}: RelativeTimeProps) {
  const ref = useRef<HTMLTimeElement>(null);
  const [open, setOpen] = useState(false);
  const live = useSyncExternalStore(now ? noopSubscribe : subscribeClock, getClock, getServerClock);
  const reference = now ? Date.parse(now) : live;
  const absolute = absoluteProp ?? formatDateTimeWithZone(value, { timeZone });

  // Inside a focusable parent the tooltip follows the parent's focus.
  useEffect(() => {
    if (!inFocusable) return;
    const parent = ref.current?.parentElement?.closest<HTMLElement>("a[href], button, [tabindex]");
    if (!parent) return;
    const show = () => setOpen(true);
    const hide = () => setOpen(false);
    parent.addEventListener("focusin", show);
    parent.addEventListener("focusout", hide);
    return () => {
      parent.removeEventListener("focusin", show);
      parent.removeEventListener("focusout", hide);
    };
  }, [inFocusable]);

  let text: string;
  let overdue = false;
  if (variant === "due") {
    if (reference === null) text = `Due ${absolute}`;
    else {
      const due = formatDue(value, { now: reference, timeZone });
      text = due.text;
      overdue = due.state === "overdue";
    }
  } else {
    text = reference === null ? absolute : formatRelativeTime(value, { now: reference, timeZone });
  }
  const showsAbsolute = text === absolute || variant === "due";

  const content = (
    <time
      ref={ref}
      dateTime={toDateTimeAttribute(value)}
      tabIndex={inFocusable ? undefined : 0}
      onPointerDown={(event) => {
        if (event.pointerType === "touch") setOpen((current) => !current);
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm tabular-nums",
        variant === "past" ? "text-muted" : overdue ? "text-danger" : "text-fg",
        inTable && "min-w-20",
        className,
      )}
    >
      {overdue && !inTable ? <AlarmClock aria-hidden="true" className="size-icon-sm shrink-0" /> : null}
      <span>{text}</span>
      {showsAbsolute ? null : <span className="sr-only">, {absolute}</span>}
    </time>
  );

  const withTooltip = (
    <Tooltip content={absolute} open={open} onOpenChange={setOpen}>
      {content}
    </Tooltip>
  );

  if (overdue && inTable) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <StatusPill domain="follow_ups.status" value="overdue" />
        {withTooltip}
      </span>
    );
  }
  return withTooltip;
}

function noopSubscribe() {
  return () => {};
}
