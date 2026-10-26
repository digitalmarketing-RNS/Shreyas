"use client";

import { Tooltip } from "radix-ui";
import { type ReactElement, useId } from "react";
import { cn } from "@/lib/cn";
import { tooltipContentClassName } from "../icon-button";
import { useControllableState } from "./hooks";

export type SegmentOption = {
  value: string;
  label: string;
  icon?: ReactElement;
  /** A count after the label: "Overdue 4". */
  count?: number;
  disabled?: boolean;
};

export type SegmentedControlProps = {
  /** Names the group: "Calendar view", "Show results as". */
  legend: string;
  /** Keep the legend for screen readers only. */
  legendHidden?: boolean;
  /**
   * In a sentence (ConditionBuilder: "Leads that match [all | any] of these conditions"): the ids
   * of the text before and after it. The root becomes <span role="radiogroup" aria-labelledby>
   * with no fieldset or legend of its own.
   */
  labelledBy?: string;
  options: SegmentOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  /** sm: 32 px track, 28 px segments. md: 40 px track, 32 px segments. */
  size?: "sm" | "md";
  /** Icon-only segments: the label is sr-only and shows as a tooltip. */
  iconOnly?: boolean;
  /** Segments share the width (mobile and narrow panels). */
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
};

/** One segment's label, shared with the gallery's still pictures of hover and focus. */
export function segmentClassName(size: "sm" | "md" = "md") {
  return cn(
    "inline-flex min-w-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm text-sm font-medium whitespace-nowrap text-muted transition-colors duration-fast select-none",
    size === "sm" ? "h-7 px-3" : "h-8 px-4",
    "[&_svg]:size-icon-sm [&_svg]:shrink-0",
  );
}

/** The track around the segments. */
export function segmentTrackClassName(size: "sm" | "md" = "md") {
  return cn("inline-flex items-center gap-0.5 rounded-md bg-surface-sunken", size === "sm" ? "h-control-sm p-0.5" : "h-control-md p-1");
}

/**
 * Switches between 2 to 5 views of the same content, or picks one short value, with every option
 * visible (components.md SegmentedControl). Native radios, so Tab enters on the selected segment,
 * the arrow keys move and select, and disabled segments are skipped. When each option shows a
 * different panel of content, use Tabs instead. The choice applies at once.
 */
export function SegmentedControl({
  legend,
  legendHidden = false,
  labelledBy,
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  size = "md",
  iconOnly = false,
  fullWidth = false,
  disabled = false,
  className,
}: SegmentedControlProps) {
  const base = useId();
  const [selected, setSelected] = useControllableState(value, defaultValue ?? options[0]?.value ?? "", onValueChange);
  const groupName = name ?? `${base}-segment`;

  const track = (
    // Spans throughout: in a sentence the control is phrasing content inside a <p>.
    <span className={cn(segmentTrackClassName(size), fullWidth && "flex w-full")}>
      {options.map((option, index) => {
        const id = `${base}-${index}`;
        const off = disabled || option.disabled;
        const segment = (
          <span key={option.value} className={cn("relative flex", fullWidth && "flex-1")}>
            <input
              id={id}
              type="radio"
              name={groupName}
              value={option.value}
              checked={selected === option.value}
              disabled={off}
              onChange={() => setSelected(option.value)}
              className="peer sr-only"
            />
            <label
              htmlFor={id}
              className={cn(
                segmentClassName(size),
                off
                  ? "cursor-not-allowed peer-checked:bg-surface-hover peer-checked:text-fg"
                  : "hover:bg-surface-hover hover:text-fg peer-checked:bg-accent peer-checked:text-on-accent peer-checked:hover:bg-accent-hover",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring peer-focus-visible:outline-solid",
              )}
            >
              {option.icon ? <span aria-hidden="true" className="inline-flex">{option.icon}</span> : null}
              <span className={cn(iconOnly && "sr-only")}>{option.label}</span>
              {option.count !== undefined ? <span className="tabular-nums">{option.count}</span> : null}
            </label>
          </span>
        );
        if (!iconOnly) return segment;
        return (
          <Tooltip.Root key={option.value}>
            <Tooltip.Trigger asChild>{segment}</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="top" sideOffset={6} className={tooltipContentClassName}>
                {option.label}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        );
      })}
    </span>
  );

  if (labelledBy) {
    return (
      <span role="radiogroup" aria-labelledby={labelledBy} className={cn("inline-flex align-middle", className)}>
        {track}
      </span>
    );
  }

  return (
    <fieldset disabled={disabled} className={cn("m-0 min-w-0 border-0 p-0", className)}>
      <legend className={cn("mb-2 p-0 text-sm font-medium text-fg", legendHidden && "sr-only")}>{legend}</legend>
      {track}
    </fieldset>
  );
}
