"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "../icon-button";
import {
  MONTHS_LONG,
  type PlainDate,
  WEEKDAYS_LONG,
  WEEKDAYS_MIN,
  addDays,
  addMonths,
  addYears,
  compareDates,
  endOfWeek,
  formatLongDate,
  formatMonthYear,
  monthGrid,
  sameDay,
  startOfWeek,
  toIso,
} from "./dates";

export type CalendarMonth = { year: number; month: number };

export type CalendarProps = {
  /** single (default) or range. */
  mode?: "single" | "range";
  selected?: PlainDate | null;
  range?: { from: PlainDate | null; to: PlainDate | null };
  /** A day was chosen (Enter, Space or a click). In range mode the owner decides start and end. */
  onSelect?: (date: PlainDate) => void;
  /** The first month shown; controlled when `month` is passed. */
  month?: CalendarMonth;
  defaultMonth?: CalendarMonth;
  onMonthChange?: (month: CalendarMonth) => void;
  numberOfMonths?: 1 | 2;
  min?: PlainDate | null;
  max?: PlainDate | null;
  isDateDisabled?: (date: PlainDate) => boolean;
  /** Today in the institution's zone (passed in, so server and browser agree). */
  today: PlainDate;
  /** "dropdown" adds month and year selects to the caption, for wide ranges such as a date of birth. */
  captionLayout?: "label" | "dropdown";
  /** Focus the chosen day (or today, or the nearest enabled day) when the calendar mounts. */
  autoFocus?: boolean;
  className?: string;
};

/** Day button classes, shared with the gallery's still pictures of each state. */
export const calendarDayClassName = {
  base: "relative inline-flex size-control-sm items-center justify-center rounded-md text-sm text-fg tabular-nums transition-colors duration-fast hover:bg-surface-hover focus-inset",
  outside: "text-muted",
  disabled: "cursor-not-allowed text-muted line-through hover:bg-transparent",
  chosen: "bg-accent font-medium text-on-accent hover:bg-accent-hover focus-visible:outline-on-accent",
  between: "rounded-none bg-accent-subtle text-fg hover:bg-accent-subtle",
  preview: "rounded-none bg-surface-hover",
  today: "font-semibold after:absolute after:bottom-1 after:left-1/2 after:h-0.5 after:w-3 after:-translate-x-1/2 after:rounded-pill after:bg-accent",
  todayChosen: "after:bg-on-accent",
} as const;

function monthKey(m: CalendarMonth) {
  return m.year * 12 + (m.month - 1);
}

function fromKey(key: number): CalendarMonth {
  return { year: Math.floor(key / 12), month: (key % 12) + 1 };
}

/**
 * The day grid of the date pickers (components.md DatePicker, "inline calendar"; DateRangePicker).
 * role="grid"; each day is a button named with its full date ("Tuesday, 6 October 2026"); the
 * chosen day has aria-selected, today aria-current="date", disabled days aria-disabled. Weeks start
 * on Sunday. The caption is aria-live="polite", so month changes are read.
 *
 * Keyboard: arrows move by a day or a week; Home and End go to the start and end of the week;
 * PageUp and PageDown change the month (with Shift, the year); Enter or Space chooses. One day is
 * the tab stop (roving tabindex).
 *
 * Our own grid rather than react-day-picker, which is not installed yet (open question 1).
 */
export function Calendar({
  mode = "single",
  selected = null,
  range,
  onSelect,
  month: monthProp,
  defaultMonth,
  onMonthChange,
  numberOfMonths = 1,
  min = null,
  max = null,
  isDateDisabled,
  today,
  captionLayout = "label",
  autoFocus = false,
  className,
}: CalendarProps) {
  const base = useId();
  const isDisabled = (date: PlainDate) =>
    Boolean((min && compareDates(date, min) < 0) || (max && compareDates(date, max) > 0) || isDateDisabled?.(date));

  const anchor = mode === "range" ? (range?.from ?? range?.to ?? null) : selected;
  const nearestEnabled = (date: PlainDate) => {
    if (!isDisabled(date)) return date;
    for (let offset = 1; offset <= 366; offset += 1) {
      if (!isDisabled(addDays(date, offset))) return addDays(date, offset);
      if (!isDisabled(addDays(date, -offset))) return addDays(date, -offset);
    }
    return date;
  };

  const [innerMonth, setInnerMonth] = useState<CalendarMonth>(() => {
    const start = defaultMonth ?? anchor ?? today;
    return { year: start.year, month: start.month };
  });
  const visibleMonth = monthProp ?? innerMonth;
  const setMonth = (next: CalendarMonth) => {
    if (!monthProp) setInnerMonth(next);
    onMonthChange?.(next);
  };

  const [focused, setFocused] = useState<PlainDate>(() => nearestEnabled(anchor ?? today));
  const [hovered, setHovered] = useState<PlainDate | null>(null);
  const moveFocus = useRef(autoFocus);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // The tab stop must be a day that is on screen.
  const firstKey = monthKey(visibleMonth);
  const lastKey = firstKey + numberOfMonths - 1;
  const focusedKey = monthKey(focused);
  const tabDate =
    focusedKey >= firstKey && focusedKey <= lastKey ? focused : nearestEnabled({ year: visibleMonth.year, month: visibleMonth.month, day: 1 });

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`button[data-date="${toIso(tabDate)}"]`)?.focus();
  });

  const goTo = (date: PlainDate) => {
    const clamped = min && compareDates(date, min) < 0 ? min : max && compareDates(date, max) > 0 ? max : date;
    setFocused(clamped);
    const key = monthKey(clamped);
    if (key < firstKey) setMonth(fromKey(key));
    else if (key > lastKey) setMonth(fromKey(key - numberOfMonths + 1));
    moveFocus.current = true;
  };

  const onDayKeyDown = (date: PlainDate) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, () => PlainDate> = {
      ArrowLeft: () => addDays(date, -1),
      ArrowRight: () => addDays(date, 1),
      ArrowUp: () => addDays(date, -7),
      ArrowDown: () => addDays(date, 7),
      Home: () => startOfWeek(date),
      End: () => endOfWeek(date),
      PageUp: () => (event.shiftKey ? addYears(date, -1) : addMonths(date, -1)),
      PageDown: () => (event.shiftKey ? addYears(date, 1) : addMonths(date, 1)),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    goTo(move());
  };

  const choose = (date: PlainDate) => {
    if (isDisabled(date)) return;
    setFocused(date);
    onSelect?.(date);
  };

  const months = Array.from({ length: numberOfMonths }, (_, index) => fromKey(firstKey + index));
  const canGoBack = !min || monthKey(min) < firstKey;
  const canGoForward = !max || monthKey(max) > lastKey;

  const inRange = (date: PlainDate) => {
    if (mode !== "range" || !range?.from) return false;
    const end = range.to ?? null;
    if (!end) return false;
    return compareDates(date, range.from) >= 0 && compareDates(date, end) <= 0;
  };
  const inPreview = (date: PlainDate) => {
    if (mode !== "range" || !range?.from || range.to || !hovered) return false;
    const [a, b] = compareDates(hovered, range.from) < 0 ? [hovered, range.from] : [range.from, hovered];
    return compareDates(date, a) >= 0 && compareDates(date, b) <= 0;
  };

  const years = (() => {
    const from = min?.year ?? today.year - 100;
    const to = max?.year ?? today.year + 10;
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  })();

  return (
    <div ref={gridRef} className={cn("flex flex-col gap-4 sm:flex-row", className)}>
      {months.map((m, index) => {
        const captionId = `${base}-caption-${index}`;
        const weeks = monthGrid(m.year, m.month);
        const showOutside = numberOfMonths === 1;
        return (
          <div key={`${m.year}-${m.month}`} className="flex flex-col gap-2">
            <div className="flex h-control-sm items-center justify-between gap-1">
              {index === 0 ? (
                <IconButton
                  icon={<ChevronLeft />}
                  aria-label="Previous month"
                  disabled={!canGoBack}
                  tooltip={false}
                  onClick={() => setMonth(fromKey(firstKey - 1))}
                />
              ) : (
                <span className="size-control-sm" />
              )}
              {captionLayout === "dropdown" && numberOfMonths === 1 ? (
                <div className="flex items-center gap-1">
                  <span id={captionId} aria-live="polite" className="sr-only">
                    {formatMonthYear(m.year, m.month)}
                  </span>
                  <select
                    aria-label="Month"
                    value={m.month}
                    onChange={(event) => setMonth({ year: m.year, month: Number(event.currentTarget.value) })}
                    className="h-control-sm rounded-md border border-input bg-surface-raised px-1.5 text-sm text-fg"
                  >
                    {MONTHS_LONG.map((name, i) => (
                      <option key={name} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Year"
                    value={m.year}
                    onChange={(event) => setMonth({ year: Number(event.currentTarget.value), month: m.month })}
                    className="h-control-sm rounded-md border border-input bg-surface-raised px-1.5 text-sm text-fg tabular-nums"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span id={captionId} aria-live="polite" className="text-sm font-semibold text-fg">
                  {formatMonthYear(m.year, m.month)}
                </span>
              )}
              {index === months.length - 1 ? (
                <IconButton
                  icon={<ChevronRight />}
                  aria-label="Next month"
                  disabled={!canGoForward}
                  tooltip={false}
                  onClick={() => setMonth(fromKey(firstKey + 1))}
                />
              ) : (
                <span className="size-control-sm" />
              )}
            </div>
            <table role="grid" aria-labelledby={captionId} className="border-collapse" onMouseLeave={() => setHovered(null)}>
              <thead>
                <tr role="row">
                  {WEEKDAYS_MIN.map((day, i) => (
                    <th key={day} role="columnheader" scope="col" abbr={WEEKDAYS_LONG[i]} className="size-control-sm p-0 text-xs font-normal text-muted">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week) => (
                  <tr key={toIso(week[0])} role="row">
                    {week.map((date) => {
                      const outside = date.month !== m.month;
                      if (outside && !showOutside) return <td key={toIso(date)} role="gridcell" className="size-control-sm p-0" />;
                      const disabled = isDisabled(date);
                      const isToday = sameDay(date, today);
                      const isStart = mode === "range" && sameDay(date, range?.from);
                      const isEnd = mode === "range" && sameDay(date, range?.to);
                      const isChosen = mode === "single" ? sameDay(date, selected) : isStart || isEnd;
                      const between = !isChosen && inRange(date);
                      const preview = !isChosen && !between && inPreview(date);
                      const hasBand = mode === "range" && Boolean(range?.from && range?.to) && !sameDay(range?.from, range?.to);
                      const label = `${formatLongDate(date)}${isStart ? ", start of range" : ""}${isEnd ? ", end of range" : ""}`;
                      return (
                        <td
                          key={toIso(date)}
                          role="gridcell"
                          aria-selected={isChosen || between || undefined}
                          className="size-control-sm p-0 text-center"
                        >
                          <button
                            type="button"
                            data-date={toIso(date)}
                            tabIndex={sameDay(date, tabDate) ? 0 : -1}
                            aria-label={label}
                            aria-current={isToday ? "date" : undefined}
                            aria-disabled={disabled || undefined}
                            onClick={() => choose(date)}
                            onKeyDown={onDayKeyDown(date)}
                            onFocus={() => setFocused(date)}
                            onMouseEnter={() => setHovered(date)}
                            className={cn(
                              calendarDayClassName.base,
                              outside && calendarDayClassName.outside,
                              disabled && calendarDayClassName.disabled,
                              between && calendarDayClassName.between,
                              preview && calendarDayClassName.preview,
                              isChosen && calendarDayClassName.chosen,
                              isChosen && hasBand && isStart && "rounded-r-none",
                              isChosen && hasBand && isEnd && "rounded-l-none",
                              isToday && calendarDayClassName.today,
                              isToday && isChosen && calendarDayClassName.todayChosen,
                            )}
                          >
                            {date.day}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
