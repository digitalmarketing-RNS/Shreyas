"use client";

import { Progress } from "radix-ui";
import { useId } from "react";
import { cn } from "@/lib/cn";

export type ProgressBarProps = {
  /** "Importing rows". Hidden with hideLabel (route and region loading use the region's own status). */
  label?: string;
  hideLabel?: boolean;
  /** Names the bar from another element instead (a JobProgress title). */
  labelledBy?: string;
  /** The count done; null or undefined for indeterminate (no known total). */
  value?: number | null;
  /** The total. */
  max?: number;
  /** The value in words at the right of the label row: "1,240 of 5,000". */
  valueText?: string;
  /** aria-valuetext: "1,240 of 5,000 rows, 25%". */
  valueLabel?: string;
  /** "About 2 min left", "Large exports can take a few minutes." */
  helper?: string;
  /** sm 4 px (route and region loading, tray, toast); md 8 px, the default with a label. */
  size?: "sm" | "md";
  /** paused: the indicator stays and the value text says "Paused at 40%". */
  paused?: boolean;
  className?: string;
  trackClassName?: string;
};

/**
 * How far a task has got (determinate) or that it is running (indeterminate), with the value also
 * in words (components.md, ProgressBar). Radix Progress: role="progressbar", aria-valuemin 0,
 * aria-valuemax, aria-valuenow (omitted when indeterminate), aria-valuetext. Not a live region;
 * JobProgress announces milestones. Under reduced motion the indeterminate bar is a static third
 * of the track at the start and the label carries the meaning ("Working…").
 */
export function ProgressBar({
  label,
  hideLabel = false,
  labelledBy,
  value,
  max = 100,
  valueText,
  valueLabel,
  helper,
  size = "md",
  paused = false,
  className,
  trackClassName,
}: ProgressBarProps) {
  const labelId = useId();
  const helperId = useId();
  const indeterminate = value === null || value === undefined;
  const percent = indeterminate ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  const shownValue = paused ? `Paused at ${Math.round(percent)}%` : valueText;
  const showRow = !hideLabel && (label || shownValue);

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      {showRow ? (
        <div className="flex items-baseline justify-between gap-3 text-sm">
          {label ? (
            <span id={labelId} className="min-w-0 text-fg">
              {label}
            </span>
          ) : (
            <span />
          )}
          {shownValue ? <span className="shrink-0 text-muted tabular-nums">{shownValue}</span> : null}
        </div>
      ) : label ? (
        <span id={labelId} className="sr-only">
          {label}
        </span>
      ) : null}
      <Progress.Root
        value={indeterminate ? null : value}
        max={max}
        getValueLabel={() => valueLabel ?? shownValue ?? `${Math.round(percent)}%`}
        aria-labelledby={labelledBy ?? (label ? labelId : undefined)}
        aria-describedby={helper ? helperId : undefined}
        className={cn(
          "relative w-full overflow-hidden rounded-pill bg-surface-sunken",
          size === "sm" ? "h-1" : "h-2",
          trackClassName,
        )}
      >
        <Progress.Indicator
          className={cn(
            "h-full rounded-pill bg-accent",
            indeterminate ? "w-1/3 motion-safe:animate-indeterminate" : "w-full motion-safe:transition-transform motion-safe:duration-base",
          )}
          style={indeterminate ? undefined : { transform: `translateX(-${100 - percent}%)` }}
        />
      </Progress.Root>
      {helper ? (
        <span id={helperId} className="text-xs text-muted">
          {helper}
        </span>
      ) : null}
    </div>
  );
}
