"use client";

import { Tooltip } from "@/components/ui/overlays/tooltip";
import { cn } from "@/lib/cn";

export const NEW_LEAD_TOOLTIP = "New: nobody has worked on this lead yet.";

/**
 * The New marker before a lead's name in tables (Status vocabulary: leads.untouched): a size-2
 * accent dot, explained by the visible "New lead" legend; the tooltip is an extra, never the only
 * explanation. The row's sr-only "New, " carries the meaning for screen readers.
 */
export function NewLeadDot({ withTooltip = true, className }: { withTooltip?: boolean; className?: string }) {
  const dot = <span aria-hidden="true" className={cn("inline-block size-2 shrink-0 rounded-pill bg-accent", className)} />;
  if (!withTooltip) return dot;
  return <Tooltip content={NEW_LEAD_TOOLTIP}>{dot}</Tooltip>;
}
