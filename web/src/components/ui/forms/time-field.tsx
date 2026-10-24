"use client";

import { Check, Clock } from "lucide-react";
import { Popover } from "radix-ui";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  BARE_INPUT,
  CONTROL_HEIGHT,
  CONTROL_PADDING_X,
  CONTROL_TEXT,
  OPTION_ACTIVE,
  OPTION_ROW,
  POPOVER_PANEL,
  RING_FROM_INPUT,
  controlBox,
} from "./control-styles";
import { useFieldControl } from "./field-context";
import { type PlainTime, QUARTER_HOURS, formatTime12, nextQuarterHour, parseTypedTime, sameTime } from "./times";

export type TimeFieldProps = {
  value?: PlainTime | null;
  defaultValue?: PlainTime | null;
  onValueChange?: (time: PlainTime | null) => void;
  /** Where the list opens when nothing is chosen: the quarter hour after this time. */
  now?: PlainTime;
  size?: "sm" | "md";
  disabled?: boolean;
  id?: string;
  className?: string;
};

/**
 * The time part of DateTimePicker (components.md DateTimePicker): a typed time with a list of every
 * 15 minutes. Accepted: "4:30 pm", "4.30pm", "16:30", "1630", "430p", "4"; without am or pm,
 * 1:00 to 7:59 is pm and 8:00 to 11:59 is am. Combobox keys: ArrowDown opens the list on the
 * chosen time (or the next quarter hour), Enter chooses, Esc closes, Tab moves on. Typing does
 * not filter the list.
 */
export function TimeField({
  value,
  defaultValue = null,
  onValueChange,
  now = { hour: 9, minute: 0 },
  size = "md",
  disabled: disabledProp,
  id: idProp,
  className,
}: TimeFieldProps) {
  const control = useFieldControl({ id: idProp, disabled: disabledProp });
  const base = useId();
  const listboxId = `${base}-listbox`;
  const optionId = (index: number) => `${base}-option-${index}`;
  const [inner, setInner] = useState<PlainTime | null>(defaultValue);
  const chosen = value !== undefined ? value : inner;
  const [text, setText] = useState(chosen ? formatTime12(chosen) : "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [errorShown, setErrorShown] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const reportError = control.reportError;

  useEffect(() => {
    if (!open || active < 0) return;
    document.getElementById(`${base}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, base]);

  const startIndex = () => {
    const target = chosen ?? nextQuarterHour(now);
    const index = QUARTER_HOURS.findIndex((t) => t.hour * 60 + t.minute >= target.hour * 60 + target.minute);
    return index < 0 ? QUARTER_HOURS.length - 1 : index;
  };

  const commit = (time: PlainTime | null) => {
    if (value === undefined) setInner(time);
    onValueChange?.(time);
    setText(time ? formatTime12(time) : "");
    setErrorShown(false);
    reportError(null);
  };

  const read = (raw: string, show: boolean) => {
    if (!raw.trim()) {
      if (value === undefined) setInner(null);
      onValueChange?.(null);
      reportError(null);
      return;
    }
    const parsed = parseTypedTime(raw);
    if (parsed) {
      if (show) commit(parsed);
      else reportError(null);
      return;
    }
    if (show || errorShown) {
      setErrorShown(true);
      reportError("Enter a time like 4:30 pm.");
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) {
          setOpen(true);
          setActive(event.altKey ? -1 : startIndex());
        } else setActive((index) => Math.min(QUARTER_HOURS.length - 1, index + 1));
        return;
      case "ArrowUp":
        event.preventDefault();
        if (!open) {
          setOpen(true);
          setActive(startIndex());
        } else setActive((index) => Math.max(0, index - 1));
        return;
      case "PageDown":
        if (open) {
          event.preventDefault();
          setActive((index) => Math.min(QUARTER_HOURS.length - 1, index + 4));
        }
        return;
      case "PageUp":
        if (open) {
          event.preventDefault();
          setActive((index) => Math.max(0, index - 4));
        }
        return;
      case "Enter":
        if (open && active >= 0) {
          event.preventDefault();
          commit(QUARTER_HOURS[active]);
          setOpen(false);
        } else read(event.currentTarget.value, true);
        return;
      case "Escape":
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
        return;
      case "Tab":
        setOpen(false);
        return;
      default:
        return;
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
      <Popover.Anchor asChild>
        <div
          ref={anchorRef}
          className={cn(
            "flex w-full items-center gap-2",
            CONTROL_HEIGHT[size],
            CONTROL_TEXT[size],
            CONTROL_PADDING_X[size],
            controlBox({ invalid: control.invalid, disabled: control.disabled }),
            RING_FROM_INPUT,
            className,
          )}
        >
          <input
            id={control.id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="none"
            aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
            aria-describedby={control.describedBy}
            aria-invalid={control.invalid || undefined}
            autoComplete="off"
            spellCheck={false}
            disabled={control.disabled}
            value={text}
            onChange={(event) => {
              setText(event.currentTarget.value);
              if (errorShown) read(event.currentTarget.value, false);
            }}
            onBlur={(event) => {
              if (anchorRef.current?.contains(event.relatedTarget as Node | null)) return;
              read(event.currentTarget.value, true);
            }}
            onClick={() => {
              if (!open) {
                setOpen(true);
                setActive(startIndex());
              }
            }}
            onKeyDown={onKeyDown}
            className={BARE_INPUT}
          />
          <Clock aria-hidden="true" className="size-icon-sm shrink-0 text-muted" />
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          role="presentation"
          align="start"
          sideOffset={4}
          collisionPadding={8}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
          }}
          className={cn(POPOVER_PANEL, "w-(--radix-popover-trigger-width) min-w-36")}
        >
          <div id={listboxId} role="listbox" aria-labelledby={control.field?.labelId} className="max-h-60 overflow-y-auto p-1">
            {QUARTER_HOURS.map((time, index) => (
              <div
                key={index}
                id={optionId(index)}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => {
                  if (index !== active) setActive(index);
                }}
                onClick={() => {
                  commit(time);
                  setOpen(false);
                }}
                className={cn(OPTION_ROW, "h-menu-item justify-between tabular-nums", index === active && OPTION_ACTIVE, sameTime(time, chosen) && "font-medium")}
              >
                {formatTime12(time)}
                {sameTime(time, chosen) ? <Check aria-hidden="true" className="size-icon-sm shrink-0 text-accent" /> : null}
              </div>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
