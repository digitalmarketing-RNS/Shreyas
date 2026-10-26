"use client";

import { ChevronDown, X } from "lucide-react";
import { type KeyboardEvent, useRef } from "react";
import { ControlTooltip } from "@/components/ui/icon-button";
import { Popover } from "@/components/ui/overlays/popover";
import { cn } from "@/lib/cn";
import { DateFilterEditor } from "./date-filter-editor";
import { NumberRangeFilterEditor } from "./number-range-filter-editor";
import { PicklistFilterEditor } from "./picklist-filter-editor";
import { type QuickFilterDef, type QuickFilterValue, rangeError, summarise } from "./quick-filters";
import { YesNoFilterEditor } from "./yes-no-filter-editor";

export type QuickFilterChipProps = {
  def: QuickFilterDef;
  value: QuickFilterValue | undefined;
  onValueChange: (value: QuickFilterValue | undefined) => void;
  /** Removes the filter (the remove button, or Backspace or Delete on the chip). */
  onRemove: () => void;
  /** Today in the institution's zone, for date presets. */
  today?: string;
  /** Gallery: start with the popover open. */
  defaultOpen?: boolean;
};

const CHIP = "inline-flex h-control-sm max-w-full items-center gap-1.5 border px-3 text-sm whitespace-nowrap transition-colors duration-fast";

/**
 * One quick filter: a Popover trigger with the field label, the value summary and ChevronDown,
 * plus a joined remove button while active (components.md, QuickFilterBar). The chip's name starts
 * with its visible text and then says what it is ("Stage: Interested, Applied. Filter", 2.5.3).
 * Enter, Space or Arrow Down opens the popover with focus on its first control; Esc closes it and
 * returns focus to the chip; Backspace or Delete on an active chip removes its filter.
 */
export function QuickFilterChip({ def, value, onValueChange, onRemove, today, defaultOpen }: QuickFilterChipProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const summary = summarise(def, value);
  const active = summary !== null;

  const remove = () => {
    onRemove();
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const removeButton = (
    <ControlTooltip content={`Remove the ${def.label} filter`}>
      <button
        type="button"
        aria-label={`Remove the ${def.label} filter`}
        onClick={remove}
        className={cn(
          "-ml-px inline-flex size-control-sm shrink-0 items-center justify-center rounded-r-md border text-muted transition-colors duration-fast hover:text-fg",
          def.removed ? "border-input bg-surface" : "border-accent bg-accent-subtle",
        )}
      >
        <X aria-hidden="true" className="size-icon-sm" />
      </button>
    </ControlTooltip>
  );

  if (def.removed) {
    return (
      <span className="inline-flex max-w-full items-center">
        <span className={cn(CHIP, "rounded-l-md border-input bg-surface text-muted")}>
          <span className="text-fg">{def.label}</span>
          <span>· Field removed</span>
        </span>
        {removeButton}
      </span>
    );
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" && event.currentTarget.getAttribute("aria-expanded") !== "true") {
      event.preventDefault();
      event.currentTarget.click();
      return;
    }
    if (active && (event.key === "Backspace" || event.key === "Delete")) {
      event.preventDefault();
      remove();
    }
  };

  const listValues = value?.type === "list" ? value.values : [];
  let editor;
  switch (def.type) {
    case "picklist":
    case "owner":
      editor = <PicklistFilterEditor def={def} values={listValues} onValuesChange={(values) => onValueChange({ type: "list", values })} />;
      break;
    case "date":
      editor = <DateFilterEditor label={def.label} today={today} value={value?.type === "date" ? value : undefined} onValueChange={onValueChange} />;
      break;
    case "yesno":
      editor = (
        <YesNoFilterEditor
          label={def.label}
          value={value?.type === "yesno" ? value.value : "any"}
          onValueChange={(next) => onValueChange({ type: "yesno", value: next })}
        />
      );
      break;
    case "number":
      editor = (
        <NumberRangeFilterEditor
          label={def.label}
          from={value?.type === "number" ? value.from : null}
          to={value?.type === "number" ? value.to : null}
          error={rangeError(value)}
          onChange={(range) => onValueChange({ type: "number", ...range })}
        />
      );
      break;
  }

  return (
    <span className="inline-flex max-w-full items-center">
      <Popover
        aria-label={`Filter by ${def.label.toLowerCase()}`}
        defaultOpen={defaultOpen}
        contentClassName="w-72"
        trigger={
          <button
            ref={triggerRef}
            type="button"
            onKeyDown={onKeyDown}
            className={cn(
              CHIP,
              active
                ? "rounded-l-md border-accent bg-accent-subtle text-fg"
                : "rounded-md border-input bg-surface text-fg hover:bg-surface-hover",
              "aria-expanded:bg-surface-hover aria-expanded:data-[active]:bg-accent-subtle",
            )}
            data-active={active ? "" : undefined}
          >
            <span className="flex min-w-0 items-center">
              <span>{def.label}</span>
              {active ? (
                <>
                  <span>:&nbsp;</span>
                  <span className="max-w-48 truncate pt-0.5 pb-1 font-medium">{summary}</span>
                </>
              ) : null}
              <span className="sr-only">. Filter</span>
            </span>
            <ChevronDown aria-hidden="true" className="size-icon-sm shrink-0 text-muted" />
          </button>
        }
      >
        {editor}
      </Popover>
      {active ? removeButton : null}
    </span>
  );
}
