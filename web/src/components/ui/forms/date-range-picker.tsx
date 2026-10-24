"use client";

import { CalendarRange, Check, ChevronDown } from "lucide-react";
import { Popover } from "radix-ui";
import { type KeyboardEvent, useId, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { DEFAULT_TIME_ZONE } from "@/lib/format";
import { Button } from "../button";
import { Calendar, type CalendarMonth } from "./calendar";
import { CONTROL_HEIGHT, POPOVER_PANEL, controlBox } from "./control-styles";
import {
  type PlainDate,
  addDays,
  addMonths,
  addYears,
  compareDates,
  daysBetween,
  endOfMonth,
  formatPlainDate,
  formatRangeLong,
  formatRangeShort,
  fromIso,
  parseTypedDate,
  startOfMonth,
  toIso,
  todayIn,
} from "./dates";
import { joinIds } from "./field-context";
import { Select } from "./select";

export type DateRangeCompare = "previous" | "last_year";
export type DateRangeValue = { from: string; to: string; compare: DateRangeCompare | null } | null;

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_financial_year"
  | "custom";

export const DATE_RANGE_PRESETS: Array<{ value: DateRangePreset; label: string }> = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "this_financial_year", label: "This financial year (Apr-Mar)" },
  { value: "custom", label: "Custom" },
];

/** A preset's dates, computed from today in the institution's zone. */
export function presetRange(preset: DateRangePreset, today: PlainDate): { from: PlainDate; to: PlainDate } | null {
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "yesterday":
      return { from: addDays(today, -1), to: addDays(today, -1) };
    case "last_7_days":
      return { from: addDays(today, -6), to: today };
    case "last_30_days":
      return { from: addDays(today, -29), to: today };
    case "this_month":
      return { from: startOfMonth(today), to: today };
    case "last_month": {
      const previous = addMonths(startOfMonth(today), -1);
      return { from: previous, to: endOfMonth(previous) };
    }
    case "this_quarter": {
      const quarterStart = Math.floor((today.month - 1) / 3) * 3 + 1;
      return { from: { year: today.year, month: quarterStart, day: 1 }, to: today };
    }
    case "this_financial_year": {
      const year = today.month >= 4 ? today.year : today.year - 1;
      return { from: { year, month: 4, day: 1 }, to: today };
    }
    default:
      return null;
  }
}

/** The comparison period: the same length just before, or the same dates a year earlier. */
export function comparisonRange(from: PlainDate, to: PlainDate, compare: DateRangeCompare): { from: PlainDate; to: PlainDate } {
  if (compare === "last_year") return { from: addYears(from, -1), to: addYears(to, -1) };
  const length = daysBetween(from, to) + 1;
  return { from: addDays(from, -length), to: addDays(from, -1) };
}

function useMinWidth(px: number): boolean {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia(`(min-width: ${px}px)`);
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia(`(min-width: ${px}px)`).matches,
    () => true,
  );
}

export type DateRangePickerProps = {
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  /** Called on Apply only, so reports query once. */
  onValueChange?: (value: DateRangeValue) => void;
  /** presets and calendar (reports, default) or calendar only (list filters). */
  presets?: boolean;
  /** S20: the "Compare with" checkbox and select. */
  compare?: boolean;
  maxDays?: number;
  /** sm 32 (page bar, default) or md 40. */
  size?: "sm" | "md";
  /** Today in the institution's zone (ISO); presets are computed from it. */
  today?: string;
  timeZone?: string;
  /** Footer note: "Dates in IST". */
  zoneNote?: string;
  /** Hidden inputs: `{name}_from`, `{name}_to`, `{name}_compare`. */
  name?: string;
  disabled?: boolean;
  className?: string;
};

type Draft = {
  from: PlainDate | null;
  to: PlainDate | null;
  preset: DateRangePreset;
  fromText: string;
  toText: string;
  compareOn: boolean;
  compare: DateRangeCompare;
  month: CalendarMonth;
  error: string | null;
};

/**
 * A start and an end date for reports and list filters (components.md DateRangePicker), with
 * presets and an optional comparison period. Nothing changes until Apply, so reports query once;
 * Cancel or Esc keeps the previous range.
 *
 * - Days: the first click sets the start, the second the end (they swap if the end is earlier), a
 *   third starts again. Editing the inputs or the calendar switches the preset to Custom.
 * - Keyboard: the trigger opens with Enter or Space and focus goes to the chosen preset (or
 *   "From"); presets are native radios (arrows move and choose); the grid uses the DatePicker keys;
 *   Esc cancels; Ctrl+Enter (Cmd+Enter) applies from anywhere inside.
 * - The trigger's name spells the range out: "Date range: 1 September to 30 September 2026".
 */
export function DateRangePicker({
  value,
  defaultValue = null,
  onValueChange,
  presets = true,
  compare: showCompare = false,
  maxDays = 366,
  size = "sm",
  today: todayProp,
  timeZone = DEFAULT_TIME_ZONE,
  zoneNote = "Dates in IST",
  name,
  disabled = false,
  className,
}: DateRangePickerProps) {
  const base = useId();
  const [today] = useState<PlainDate>(() => fromIso(todayProp) ?? todayIn(timeZone));
  const [innerValue, setInnerValue] = useState<DateRangeValue>(defaultValue);
  const applied = value !== undefined ? value : innerValue;
  const [open, setOpen] = useState(false);
  const wide = useMinWidth(768);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const appliedFrom = fromIso(applied?.from);
  const appliedTo = fromIso(applied?.to);

  const draftFromApplied = (): Draft => {
    const matching = presets && appliedFrom && appliedTo
      ? DATE_RANGE_PRESETS.find((p) => {
          const r = presetRange(p.value, today);
          return r && toIso(r.from) === toIso(appliedFrom) && toIso(r.to) === toIso(appliedTo);
        })?.value
      : undefined;
    const anchor = appliedFrom ?? today;
    return {
      from: appliedFrom,
      to: appliedTo,
      preset: matching ?? "custom",
      fromText: appliedFrom ? formatPlainDate(appliedFrom) : "",
      toText: appliedTo ? formatPlainDate(appliedTo) : "",
      compareOn: Boolean(applied?.compare),
      compare: applied?.compare ?? "previous",
      month: { year: anchor.year, month: anchor.month },
      error: null,
    };
  };
  const [draft, setDraft] = useState<Draft>(draftFromApplied);

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  const setRange = (from: PlainDate | null, to: PlainDate | null, preset: DateRangePreset, moveMonth = true) => {
    update({
      from,
      to,
      preset,
      fromText: from ? formatPlainDate(from) : "",
      toText: to ? formatPlainDate(to) : "",
      error: null,
      ...(moveMonth && from ? { month: { year: from.year, month: from.month } } : {}),
    });
  };

  const choosePreset = (preset: DateRangePreset) => {
    const range = presetRange(preset, today);
    if (range) setRange(range.from, range.to, preset);
    else update({ preset });
  };

  const onDay = (date: PlainDate) => {
    if (!draft.from || draft.to) return setRange(date, null, "custom", false);
    if (compareDates(date, draft.from) < 0) return setRange(date, draft.from, "custom", false);
    setRange(draft.from, date, "custom", false);
  };

  const readInput = (which: "from" | "to", text: string) => {
    if (!text.trim()) {
      update(which === "from" ? { from: null, fromText: "", preset: "custom" } : { to: null, toText: "", preset: "custom" });
      return;
    }
    const parsed = parseTypedDate(text);
    if (!parsed.ok) {
      update({ error: parsed.reason === "nonexistent" ? "That date doesn't exist. Check the day and month." : "Enter a date like 06/10/2026." });
      return;
    }
    const patch: Partial<Draft> =
      which === "from"
        ? { from: parsed.date, fromText: formatPlainDate(parsed.date), month: { year: parsed.date.year, month: parsed.date.month } }
        : { to: parsed.date, toText: formatPlainDate(parsed.date) };
    update({ ...patch, preset: "custom", error: null });
  };

  const problem = (() => {
    if (draft.error) return draft.error;
    if (draft.from && draft.to && compareDates(draft.to, draft.from) < 0) return "The end date is before the start date.";
    if (draft.from && draft.to && daysBetween(draft.from, draft.to) + 1 > maxDays) return `Choose a range of ${maxDays} days or less.`;
    return null;
  })();

  const apply = () => {
    if (problem) return;
    const next: DateRangeValue =
      draft.from && draft.to
        ? { from: toIso(draft.from), to: toIso(draft.to), compare: showCompare && draft.compareOn ? draft.compare : null }
        : draft.from
          ? { from: toIso(draft.from), to: toIso(draft.from), compare: showCompare && draft.compareOn ? draft.compare : null }
          : null;
    if (value === undefined) setInnerValue(next);
    onValueChange?.(next);
    setOpen(false);
  };

  const onContentKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      apply();
    }
  };

  // Trigger text and name.
  const triggerText = appliedFrom && appliedTo ? formatRangeShort(appliedFrom, appliedTo) : "Any date";
  const comparison =
    appliedFrom && appliedTo && applied?.compare ? comparisonRange(appliedFrom, appliedTo, applied.compare) : null;
  const triggerName = `Date range: ${appliedFrom && appliedTo ? formatRangeLong(appliedFrom, appliedTo) : "any date"}${
    comparison ? `, compared with ${formatRangeLong(comparison.from, comparison.to)}` : ""
  }`;

  const errorId = `${base}-error`;

  return (
    <div className={cn("inline-flex flex-col", className)}>
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          if (next) setDraft(draftFromApplied());
          setOpen(next);
        }}
        modal
      >
        <Popover.Trigger
          disabled={disabled}
          aria-label={triggerName}
          className={cn(
            "inline-flex min-w-56 items-center gap-2 rounded-md border px-3 text-left text-sm font-medium transition-colors duration-fast",
            comparison ? "min-h-12 py-1" : CONTROL_HEIGHT[size],
            disabled ? "cursor-not-allowed border-transparent bg-surface-sunken text-muted" : "border-strong bg-transparent text-fg hover:bg-surface-hover",
          )}
        >
          <CalendarRange aria-hidden="true" className="size-icon-sm shrink-0 text-muted" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate">{triggerText}</span>
            {comparison ? (
              <span className="truncate text-xs font-normal text-muted">vs {formatRangeShort(comparison.from, comparison.to)}</span>
            ) : null}
          </span>
          <ChevronDown aria-hidden="true" className="size-icon-sm shrink-0 text-muted" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            ref={contentRef}
            aria-label="Choose a date range"
            align="start"
            sideOffset={4}
            collisionPadding={8}
            onKeyDown={onContentKeyDown}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              const target =
                contentRef.current?.querySelector<HTMLInputElement>("input[type=radio]:checked") ??
                contentRef.current?.querySelector<HTMLInputElement>(presets ? "input[type=radio]" : "input[data-range-input=from]");
              target?.focus();
            }}
            className={cn(POPOVER_PANEL, "flex max-h-(--radix-popover-content-available-height) w-[min(40rem,calc(100vw-1rem))] flex-col overflow-y-auto")}
          >
            <div className="flex flex-col md:flex-row">
              {presets ? (
                <fieldset className="m-0 min-w-0 border-0 border-b border-border p-2 md:w-44 md:shrink-0 md:border-r md:border-b-0">
                  <legend className="float-left mb-1 w-full px-2 pt-1 text-xs font-medium text-muted">Quick ranges</legend>
                  <div className="clear-both flex flex-col">
                    {DATE_RANGE_PRESETS.map((preset) => (
                      <label
                        key={preset.value}
                        className={cn(
                          "flex h-menu-item cursor-pointer items-center justify-between gap-2 rounded-sm px-2 text-sm text-fg transition-colors duration-fast hover:bg-surface-hover",
                          "focus-inset has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus-ring has-[:focus-visible]:outline-solid",
                          "has-[:checked]:bg-accent-subtle has-[:checked]:font-medium",
                        )}
                      >
                        <input
                          type="radio"
                          name={`${base}-preset`}
                          value={preset.value}
                          checked={draft.preset === preset.value}
                          onChange={() => choosePreset(preset.value)}
                          className="peer sr-only"
                        />
                        <span className="truncate">{preset.label}</span>
                        <Check aria-hidden="true" className="hidden size-icon-sm shrink-0 text-accent peer-checked:block" />
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col gap-3 p-3">
                <div className="flex flex-wrap gap-2">
                  {(["from", "to"] as const).map((which) => {
                    const id = `${base}-${which}`;
                    return (
                      <div key={which} className="flex flex-col gap-1">
                        <label htmlFor={id} className="text-xs font-medium text-fg">
                          {which === "from" ? "From" : "To"}
                        </label>
                        <input
                          id={id}
                          data-range-input={which}
                          type="text"
                          autoComplete="off"
                          spellCheck={false}
                          value={which === "from" ? draft.fromText : draft.toText}
                          aria-invalid={Boolean(problem) || undefined}
                          aria-describedby={joinIds(problem && errorId)}
                          onChange={(event) =>
                            update(which === "from" ? { fromText: event.currentTarget.value } : { toText: event.currentTarget.value })
                          }
                          onBlur={(event) => readInput(which, event.currentTarget.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.ctrlKey && !event.metaKey) {
                              event.preventDefault();
                              readInput(which, event.currentTarget.value);
                            }
                          }}
                          className={cn("w-36 px-2.5 text-sm", CONTROL_HEIGHT.sm, controlBox({ invalid: Boolean(problem) }))}
                        />
                      </div>
                    );
                  })}
                </div>
                {problem ? (
                  <p id={errorId} role="alert" className="m-0 text-xs font-medium text-danger">
                    {problem}
                  </p>
                ) : null}
                <Calendar
                  mode="range"
                  range={{ from: draft.from, to: draft.to }}
                  numberOfMonths={wide ? 2 : 1}
                  month={draft.month}
                  onMonthChange={(month) => update({ month })}
                  today={today}
                  onSelect={onDay}
                />
                {showCompare ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex min-h-hit cursor-pointer items-center gap-2 text-sm text-fg">
                      <input
                        type="checkbox"
                        checked={draft.compareOn}
                        onChange={(event) => update({ compareOn: event.currentTarget.checked })}
                        className="size-checkbox cursor-pointer appearance-none rounded-xs border border-input bg-surface checked:border-accent checked:bg-accent forced-colors:appearance-auto"
                      />
                      Compare with
                    </label>
                    <div className="w-52">
                      <Select
                        size="sm"
                        aria-label="Comparison period"
                        disabled={!draft.compareOn}
                        value={draft.compare}
                        onValueChange={(next) => update({ compare: (next as DateRangeCompare) ?? "previous" })}
                        options={[
                          { value: "previous", label: "Previous period" },
                          { value: "last_year", label: "Same period last year" },
                        ]}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2">
              <span className="text-xs text-muted">{zoneNote}</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => setRange(null, null, "custom")}>
                  Clear
                </Button>
                <Popover.Close asChild>
                  <Button variant="secondary">Cancel</Button>
                </Popover.Close>
                <Button onClick={apply}>Apply</Button>
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {name && applied ? (
        <>
          <input type="hidden" name={`${name}_from`} value={applied.from} />
          <input type="hidden" name={`${name}_to`} value={applied.to} />
          <input type="hidden" name={`${name}_compare`} value={applied.compare ?? ""} />
        </>
      ) : null}
    </div>
  );
}
