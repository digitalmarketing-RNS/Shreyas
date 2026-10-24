"use client";

import { type FocusEvent, type ReactNode, useId, useState } from "react";
import { cn } from "@/lib/cn";
import { CONTROL_HEIGHT, controlBox } from "./control-styles";
import { dateErrorMessage, fromIso, parseDateParts, toIso } from "./dates";
import { FieldGroup } from "./field-group";

export type MemorableDateProps = {
  /** "Date of birth". */
  legend: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** The ISO date leaves under this name; the parts go as `{name}_day`, `{name}_month`, `{name}_year`. */
  name: string;
  defaultValue?: string | null;
  onValueChange?: (iso: string | null) => void;
  /** public: 48 px inputs, text-base (the default on public pages); staff: 40 px. */
  surface?: "staff" | "public";
  /** The person's own date of birth: bday-day, bday-month and bday-year. Otherwise off. */
  ownDate?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * A date people know, such as a date of birth (components.md DatePicker, memorable-date variant):
 * three short inputs in a fieldset, "Day", "Month" and "Year", all inputmode="numeric" (month names
 * such as "oct" still work from a keyboard). The three parts are checked as one date when focus
 * leaves the group. Public pages use it instead of a calendar.
 */
export function MemorableDate({
  legend,
  hint = "For example 27 3 2008",
  error,
  name,
  defaultValue = null,
  onValueChange,
  surface = "public",
  ownDate = false,
  required = false,
  disabled = false,
  className,
}: MemorableDateProps) {
  const base = useId();
  const start = fromIso(defaultValue);
  const [day, setDay] = useState(start ? String(start.day) : "");
  const [month, setMonth] = useState(start ? String(start.month) : "");
  const [year, setYear] = useState(start ? String(start.year) : "");
  const [problem, setProblem] = useState<string | null>(null);
  const isPublic = surface === "public";
  const size = isPublic ? "lg" : "md";

  const evaluate = (d: string, m: string, y: string) => {
    if (!d && !m && !y) return { iso: null, message: null };
    const parsed = parseDateParts(d, m, y);
    return {
      iso: parsed.ok ? toIso(parsed.date) : null,
      message: dateErrorMessage(parsed, { example: "27 3 2008" }),
    };
  };

  const update = (d: string, m: string, y: string) => {
    const result = evaluate(d, m, y);
    onValueChange?.(result.iso);
    // Once an error shows, the group is checked again on every input.
    if (problem) setProblem(result.message);
  };

  const onGroupBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setProblem(evaluate(day, month, year).message);
  };

  const shownError = error ?? problem ?? undefined;
  const invalid = Boolean(shownError);
  const iso = evaluate(day, month, year).iso;
  const autoComplete = (part: "day" | "month" | "year") => (ownDate ? `bday-${part}` : "off");

  const part = (
    key: "day" | "month" | "year",
    label: string,
    value: string,
    set: (value: string) => void,
    width: string,
  ) => {
    const id = `${base}-${key}`;
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className={cn("text-fg", isPublic ? "text-base" : "text-sm")}>
          {label}
        </label>
        <input
          id={id}
          name={`${name}_${key}`}
          type="text"
          inputMode="numeric"
          autoComplete={autoComplete(key)}
          value={value}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onChange={(event) => {
            const next = event.currentTarget.value;
            set(next);
            update(key === "day" ? next : day, key === "month" ? next : month, key === "year" ? next : year);
          }}
          className={cn(
            "px-3 tabular-nums",
            CONTROL_HEIGHT[size],
            isPublic ? "text-base" : "text-sm pointer-coarse:text-base",
            width,
            controlBox({ invalid, disabled }),
          )}
        />
      </div>
    );
  };

  return (
    <FieldGroup legend={legend} hint={hint} error={shownError} name={name} required={required} disabled={disabled} surface={surface} className={className}>
      <div className="flex flex-wrap items-end gap-3" onBlur={onGroupBlur}>
        {part("day", "Day", day, setDay, "w-14")}
        {part("month", "Month", month, setMonth, "w-14")}
        {part("year", "Year", year, setYear, "w-20")}
      </div>
      <input type="hidden" name={name} value={iso ?? ""} />
    </FieldGroup>
  );
}
