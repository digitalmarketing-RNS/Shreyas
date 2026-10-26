"use client";

import { Tooltip } from "@/components/ui/overlays/tooltip";
import { cn } from "@/lib/cn";

/**
 * The short form of a number or amount with its exact value behind it (Money compact,
 * NumberText compact): the visible "₹1.5L" is aria-hidden and an sr-only exact value follows it,
 * and a Tooltip shows the exact value. It takes tabindex="0" so the tooltip opens on focus, unless
 * it sits inside another focusable element (a tile link).
 */
export function ExactValueTooltip({
  short,
  exact,
  tooltip,
  inFocusable = false,
  className,
}: {
  short: string;
  /** Read by screen readers: "₹1,50,000.00". */
  exact: string;
  /** Tooltip text: "Exact amount ₹1,50,000.00". */
  tooltip: string;
  inFocusable?: boolean;
  className?: string;
}) {
  return (
    <Tooltip content={tooltip}>
      <span tabIndex={inFocusable ? undefined : 0} className={cn("rounded-sm", className)}>
        <span aria-hidden="true">{short}</span>
        <span className="sr-only">{exact}</span>
      </span>
    </Tooltip>
  );
}
