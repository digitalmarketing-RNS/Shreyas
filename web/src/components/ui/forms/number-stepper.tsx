"use client";

import { Minus, Plus } from "lucide-react";
import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { CONTROL_HEIGHT, RING_FROM_INPUT, controlBox } from "./control-styles";
import { useFieldControl } from "./field-context";
import { Select } from "./select";

export type DurationUnit = { value: string; label: string; minutes: number };

export const DURATION_UNITS: DurationUnit[] = [
  { value: "minutes", label: "minutes", minutes: 1 },
  { value: "hours", label: "hours", minutes: 60 },
  { value: "days", label: "days", minutes: 1440 },
];

export type NumberStepperProps = {
  /** An integer, or null when empty. Duration: whole minutes. */
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null, detail: { text: string; valid: boolean }) => void;
  /** Range of the number shown (for a duration, in the chosen unit). */
  min: number;
  max: number;
  step?: number;
  /** PageUp and PageDown step (5). */
  pageStep?: number;
  /** Score: shows "+5" after blur; 0 has no sign. */
  signed?: boolean;
  /** Text after the group: "leads a day", "hours". */
  unit?: string;
  /** Duration: value plus a unit Select, stored as minutes (S18 waits, S11 reminders). */
  units?: DurationUnit[];
  defaultUnit?: string;
  /** Names the buttons: "score change" → "Decrease score change", "Increase score change". */
  valueName: string;
  /** "Enter a whole number from -10 to +10." */
  rangeError?: string;
  size?: "sm" | "md";
  /** w-14 fits 3 characters (default); w-20 fits 5. */
  inputWidth?: "w-14" | "w-20";
  name?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Read-only text: "+5 points". */
  readOnlyText?: (value: number | null) => string;
  invalid?: boolean;
  id?: string;
  className?: string;
};

function parseInteger(text: string): number | null | "invalid" {
  const value = text.trim().replace(/−/g, "-");
  if (!value) return null;
  if (!/^[+-]?\d+$/.test(value)) return "invalid";
  const number = Number(value);
  return Object.is(number, -0) ? 0 : number;
}

function clearHold(state: { timer: number | null }) {
  if (state.timer !== null) {
    window.clearTimeout(state.timer);
    window.clearInterval(state.timer);
  }
  state.timer = null;
}

function display(value: number | null, signed: boolean): string {
  if (value === null) return "";
  if (signed && value > 0) return `+${value}`;
  return String(value);
}

/**
 * A small whole number with buttons to step it (components.md NumberStepper): the stage score,
 * daily caps, quotas, retry counts, waits. type="text" with role="spinbutton": no scroll-wheel
 * changes and no "e". A value typed outside the range stays as typed and the error states the
 * range; only the buttons and arrow keys clamp.
 *
 * Keyboard: ArrowUp/ArrowDown change by 1, PageUp/PageDown by 5, Enter submits the form. The
 * buttons are not tab stops (the input covers keyboard use); mouse-down on them keeps focus in the
 * input, holding one repeats after 400 ms and then every 80 ms, and a polite region repeats the
 * value for touch screen-reader users.
 */
export function NumberStepper({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  step = 1,
  pageStep = 5,
  signed = false,
  unit,
  units,
  defaultUnit,
  valueName,
  rangeError,
  size = "md",
  inputWidth = "w-14",
  name,
  required: requiredProp,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  readOnlyText,
  invalid: invalidProp,
  id: idProp,
  className,
}: NumberStepperProps) {
  const control = useFieldControl({
    id: idProp,
    required: requiredProp,
    disabled: disabledProp,
    readOnly: readOnlyProp,
    invalid: invalidProp,
  });
  const [unitValue, setUnitValue] = useState(() => {
    if (!units) return "";
    if (defaultUnit) return defaultUnit;
    const start = value ?? defaultValue;
    const fitting = [...units].reverse().find((u) => start !== null && start % u.minutes === 0 && start !== 0);
    return (fitting ?? units[0]).value;
  });
  const unitMinutes = units?.find((u) => u.value === unitValue)?.minutes ?? 1;
  const toShown = (minutes: number | null) => (minutes === null ? null : units ? Math.round(minutes / unitMinutes) : minutes);
  const toStored = (shown: number | null) => (shown === null ? null : units ? shown * unitMinutes : shown);

  const initial = toShown(value !== undefined ? value : defaultValue);
  const [text, setText] = useState(display(initial, signed));
  const [spoken, setSpoken] = useState("");
  const [errorShown, setErrorShown] = useState(false);
  const numberRef = useRef<number | null>(initial);
  const hold = useRef<{ timer: number | null }>({ timer: null });
  const pointerStep = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const parsed = parseInteger(text);
  const current = parsed === "invalid" ? null : parsed;
  const valid = parsed !== "invalid" && (parsed === null || (parsed >= min && parsed <= max));
  const message = rangeError ?? `Enter a whole number from ${display(min, signed)} to ${display(max, signed)}.`;

  const reportError = control.reportError;
  useEffect(() => {
    const state = hold.current;
    return () => clearHold(state);
  }, []);

  const valueText = (n: number | null) => {
    if (n === null) return "";
    const words = signed ? (n > 0 ? `plus ${n}` : n < 0 ? `minus ${-n}` : "0") : String(n);
    const unitWords = units ? units.find((u) => u.value === unitValue)?.label : unit;
    return unitWords ? `${words} ${unitWords}` : words;
  };

  const emit = (nextText: string, nextUnitMinutes = unitMinutes) => {
    const next = parseInteger(nextText);
    const ok = next !== "invalid" && (next === null || (next >= min && next <= max));
    const shown = next === "invalid" ? null : next;
    numberRef.current = shown;
    onValueChange?.(shown === null ? null : units ? shown * nextUnitMinutes : shown, { text: nextText, valid: ok });
    if (errorShown) {
      reportError(ok ? null : message);
      if (ok) setErrorShown(false);
    }
  };

  const stepBy = (delta: number, announce = false) => {
    const at = numberRef.current;
    // From empty, the first step lands on 0, or on the nearest end of the range.
    const next = Math.min(max, Math.max(min, at === null ? 0 : at + delta));
    const nextText = display(next, signed);
    setText(nextText);
    emit(nextText);
    if (announce) setSpoken(valueText(next));
  };

  const stopHold = () => clearHold(hold.current);

  const startHold = (delta: number) => (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || control.disabled || control.readOnly) return;
    event.preventDefault(); // keep focus in the input
    pointerStep.current = true;
    stepBy(delta, true);
    stopHold();
    hold.current.timer = window.setTimeout(() => {
      hold.current.timer = window.setInterval(() => {
        const at = numberRef.current;
        if (at !== null && ((delta > 0 && at >= max) || (delta < 0 && at <= min))) return stopHold();
        stepBy(delta, true);
      }, 80);
    }, 400);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const moves: Record<string, number> = { ArrowUp: step, ArrowDown: -step, PageUp: pageStep, PageDown: -pageStep };
    const delta = moves[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    stepBy(delta);
  };

  if (control.readOnly) {
    const shown = toShown(value !== undefined ? value : defaultValue);
    return (
      <p id={control.id} aria-describedby={control.describedBy} className="m-0 text-sm text-fg">
        {readOnlyText ? readOnlyText(shown) : `${display(shown, signed)}${unit ? ` ${unit}` : ""}`}
      </p>
    );
  }

  const atMin = current !== null && current <= min;
  const atMax = current !== null && current >= max;
  const invalid = control.invalid;

  const button = (delta: number) => {
    const blocked = delta < 0 ? atMin : atMax;
    const label = `${delta < 0 ? "Decrease" : "Increase"} ${valueName}`;
    return (
      <button
        type="button"
        tabIndex={-1}
        aria-label={label}
        aria-disabled={blocked || undefined}
        disabled={control.disabled}
        onPointerDown={blocked ? (event) => event.preventDefault() : startHold(delta)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onClick={(event) => {
          // Keyboard and screen-reader activation (no pointer-down) steps once.
          if (pointerStep.current) {
            pointerStep.current = false;
            return;
          }
          event.preventDefault();
          if (!blocked) stepBy(delta, true);
        }}
        className={cn(
          "inline-flex aspect-square h-full shrink-0 items-center justify-center text-muted transition-colors duration-fast",
          delta < 0 ? "rounded-l-md border-r border-input" : "rounded-r-md border-l border-input",
          control.disabled
            ? "cursor-not-allowed border-border"
            : blocked
              ? "cursor-not-allowed"
              : "hover:bg-surface-hover hover:text-fg active:bg-surface-sunken",
        )}
      >
        {delta < 0 ? <Minus aria-hidden="true" className="size-icon-sm" /> : <Plus aria-hidden="true" className="size-icon-sm" />}
      </button>
    );
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-2", className)}>
      <div
        className={cn(
          "inline-flex items-stretch overflow-visible",
          CONTROL_HEIGHT[size],
          controlBox({ invalid, disabled: control.disabled }),
          RING_FROM_INPUT,
        )}
      >
        {button(-step)}
        <input
          ref={inputRef}
          id={control.id}
          type="text"
          role="spinbutton"
          inputMode={min >= 0 ? "numeric" : undefined}
          autoComplete="off"
          aria-valuenow={current ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={valueText(current) || undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={control.describedBy}
          aria-required={control.required || undefined}
          disabled={control.disabled}
          value={text}
          onChange={(event) => {
            setText(event.currentTarget.value);
            emit(event.currentTarget.value);
          }}
          onBlur={() => {
            const trimmed = text.trim();
            const next = parseInteger(trimmed);
            if (next !== "invalid" && next !== null) setText(display(next, signed));
            else if (trimmed !== text) setText(trimmed);
            if (!valid) {
              setErrorShown(true);
              reportError(message);
            }
          }}
          onKeyDown={onKeyDown}
          className={cn(
            "min-w-0 bg-transparent text-center text-fg tabular-nums focus-visible:outline-none disabled:cursor-not-allowed",
            size === "sm" ? "text-sm" : "text-sm pointer-coarse:text-base",
            inputWidth,
          )}
        />
        {button(step)}
      </div>
      {units ? (
        <div className={cn(size === "sm" ? "w-28" : "w-32")}>
          <Select
            size={size}
            aria-label={`${valueName} unit`}
            options={units.map((u) => ({ value: u.value, label: u.label }))}
            value={unitValue}
            disabled={control.disabled}
            onValueChange={(next) => {
              if (!next) return;
              setUnitValue(next);
              const minutes = units.find((u) => u.value === next)?.minutes ?? 1;
              emit(text, minutes);
            }}
          />
        </div>
      ) : unit ? (
        <span className="text-sm text-muted">{unit}</span>
      ) : null}
      {name ? <input type="hidden" name={name} value={current === null ? "" : String(toStored(current))} /> : null}
      <span role="status" className="sr-only">
        {spoken}
      </span>
    </div>
  );
}
