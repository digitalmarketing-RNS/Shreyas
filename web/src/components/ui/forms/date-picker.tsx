"use client";

import { CalendarDays, TriangleAlert } from "lucide-react";
import { Popover } from "radix-ui";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { DEFAULT_TIME_ZONE } from "@/lib/format";
import { Button } from "../button";
import { IconButton } from "../icon-button";
import { Calendar } from "./calendar";
import {
  BARE_INPUT,
  CONTROL_HEIGHT,
  CONTROL_PADDING_X,
  CONTROL_TEXT,
  type ControlSize,
  POPOVER_PANEL,
  RING_FROM_INPUT,
  controlBox,
} from "./control-styles";
import { type PlainDate, compareDates, dateErrorMessage, formatPlainDate, fromIso, parseTypedDate, toIso, todayIn } from "./dates";
import { joinIds, useFieldControl } from "./field-context";

export type DatePickerProps = {
  /** ISO date, "2026-10-06". */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (iso: string | null) => void;
  min?: string;
  max?: string;
  /** Days that cannot be chosen (holidays), as ISO dates. */
  disabledDates?: string[];
  /** A past date that is allowed but unusual (S11): the warning shown under the field. */
  pastWarning?: string;
  /** Today in the institution's zone, as ISO; computed when not given. */
  today?: string;
  timeZone?: string;
  /** "dropdown" adds month and year selects to the calendar caption (wide ranges). */
  captionLayout?: "label" | "dropdown";
  name?: string;
  /** sm 32 or md 40 (staff); public pages use MemorableDate instead of a calendar. */
  size?: Exclude<ControlSize, "lg">;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
};

/**
 * One calendar date, no time (components.md DatePicker): a typed-date input with a calendar
 * button that opens a Radix Popover (modal, role="dialog", "Choose a date"). The input is always
 * enough on its own.
 *
 * - Typed dates, day first: DD/MM/YYYY, D/M/YY, DD-MM-YYYY, DD.MM.YYYY, "6 Oct 2026", "2026-10-06".
 *   Read on blur and on Enter; a valid date is shown again as "06 Oct 2026".
 * - Alt+ArrowDown or the calendar button opens the calendar on the chosen day (or today). Choosing
 *   a day fills the input, closes the popover and returns focus to the calendar button; Esc does
 *   the same without a change.
 * - The value leaves as an ISO date with no time zone.
 */
export function DatePicker({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  disabledDates = [],
  pastWarning,
  today: todayProp,
  timeZone = DEFAULT_TIME_ZONE,
  captionLayout = "label",
  name,
  size = "md",
  required: requiredProp,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  invalid: invalidProp,
  id: idProp,
  className,
}: DatePickerProps) {
  const control = useFieldControl({
    id: idProp,
    required: requiredProp,
    disabled: disabledProp,
    readOnly: readOnlyProp,
    invalid: invalidProp,
  });
  const warningId = useId();
  const [today] = useState<PlainDate>(() => fromIso(todayProp) ?? todayIn(timeZone));
  const minDate = fromIso(min);
  const maxDate = fromIso(max);
  const disabledSet = new Set(disabledDates);

  const [innerValue, setInnerValue] = useState<string | null>(defaultValue);
  const iso = value !== undefined ? value : innerValue;
  const chosen = fromIso(iso);
  const [text, setText] = useState(chosen ? formatPlainDate(chosen) : "");
  const [open, setOpen] = useState(false);
  const [errorShown, setErrorShown] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const reportError = control.reportError;

  const commit = (next: PlainDate | null) => {
    const nextIso = next ? toIso(next) : null;
    if (value === undefined) setInnerValue(nextIso);
    onValueChange?.(nextIso);
    setText(next ? formatPlainDate(next) : "");
    setErrorShown(false);
    reportError(null);
  };

  const check = (raw: string, show: boolean) => {
    if (!raw.trim()) {
      if (value === undefined) setInnerValue(null);
      onValueChange?.(null);
      reportError(null);
      setErrorShown(false);
      return;
    }
    const parsed = parseTypedDate(raw);
    const message = dateErrorMessage(parsed, { min: minDate, max: maxDate });
    const blocked = parsed.ok && disabledSet.has(toIso(parsed.date)) ? "That day can't be chosen. Pick another date." : null;
    const problem = message ?? blocked;
    if (!problem && parsed.ok) {
      if (show) commit(parsed.date);
      else {
        reportError(null);
        setErrorShown(false);
      }
      return;
    }
    if (show || errorShown) {
      reportError(problem);
      setErrorShown(true);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && event.altKey) {
      event.preventDefault();
      setOpen(true);
    } else if (event.key === "Enter") {
      check(event.currentTarget.value, true);
    }
  };

  if (control.readOnly) {
    return (
      <p id={control.id} aria-describedby={control.describedBy} className="m-0 text-sm text-fg">
        {chosen ? formatPlainDate(chosen) : "Not set"}
      </p>
    );
  }

  const showWarning = Boolean(pastWarning && chosen && compareDates(chosen, today) < 0);

  return (
    <div className={cn("flex flex-col", className)}>
      <Popover.Root open={open} onOpenChange={setOpen} modal>
        <Popover.Anchor asChild>
          <div
            className={cn(
              "flex w-40 items-center gap-1 pr-1",
              CONTROL_HEIGHT[size],
              CONTROL_TEXT[size],
              CONTROL_PADDING_X[size],
              "pr-1",
              controlBox({ invalid: control.invalid, disabled: control.disabled }),
              RING_FROM_INPUT,
            )}
          >
            <input
              id={control.id}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={text}
              disabled={control.disabled}
              required={control.required}
              aria-invalid={control.invalid || undefined}
              aria-describedby={joinIds(control.describedBy, showWarning && warningId)}
              onChange={(event) => {
                setText(event.currentTarget.value);
                if (errorShown) check(event.currentTarget.value, false);
              }}
              onBlur={(event) => check(event.currentTarget.value, true)}
              onKeyDown={onKeyDown}
              className={BARE_INPUT}
            />
            <IconButton
              ref={buttonRef}
              variant="in-field"
              icon={<CalendarDays />}
              aria-label="Open calendar"
              aria-haspopup="dialog"
              aria-expanded={open}
              disabled={control.disabled}
              onClick={() => setOpen((current) => !current)}
            />
          </div>
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            aria-label="Choose a date"
            align="start"
            sideOffset={4}
            collisionPadding={8}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              buttonRef.current?.focus();
            }}
            className={cn(POPOVER_PANEL, "p-3")}
          >
            <Calendar
              selected={chosen}
              today={today}
              min={minDate}
              max={maxDate}
              isDateDisabled={(date) => disabledSet.has(toIso(date))}
              captionLayout={captionLayout}
              autoFocus
              onSelect={(date) => {
                commit(date);
                setOpen(false);
              }}
            />
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={(minDate && compareDates(today, minDate) < 0) || (maxDate && compareDates(today, maxDate) > 0) || false}
                onClick={() => {
                  commit(today);
                  setOpen(false);
                }}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  commit(null);
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {showWarning ? (
        <p id={warningId} className="m-0 mt-1 flex items-start gap-1 text-xs text-warning">
          <TriangleAlert aria-hidden="true" className="mt-px size-icon-sm shrink-0" />
          {pastWarning}
        </p>
      ) : null}
      {name ? <input type="hidden" name={name} value={iso ?? ""} /> : null}
    </div>
  );
}
