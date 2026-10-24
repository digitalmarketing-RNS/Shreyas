"use client";

import { Tooltip as RadixTooltip } from "radix-ui";
import type { ReactElement, ReactNode } from "react";
import { tooltipContentClassName } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";

export type TooltipProps = {
  /** Short and plain, under 80 characters, no full stop for labels ("Copy lead link"). */
  content: ReactNode;
  /** One focusable element (a button, a link, or an element with tabindex="0"). */
  children: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Controlled mode (RelativeTime toggles it on tap; collapsed nav opens it on focus). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Overrides the provider's 400 ms hover delay. */
  delayDuration?: number;
  className?: string;
};

/**
 * A short text hint on hover and keyboard focus (components.md, Tooltip): names of icon-only
 * controls, collapsed nav labels, the absolute time behind a relative one, the exact amount behind
 * a compact one, the full text of a truncated label. Radix Tooltip (the Provider in the root layout
 * sets 400 ms and skipDelayDuration 300): role="tooltip", linked with aria-describedby while open,
 * hoverable, stays until dismissed, Esc closes it and keeps focus on the trigger. Opens at once on
 * keyboard focus. No links or buttons inside, and never the only place for information a task needs.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  open,
  defaultOpen,
  onOpenChange,
  delayDuration,
  className,
}: TooltipProps) {
  return (
    <RadixTooltip.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} delayDuration={delayDuration}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content side={side} align={align} sideOffset={6} collisionPadding={8} className={cn(tooltipContentClassName, className)}>
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

/**
 * The tooltip bubble drawn in place, for documentation and screenshots only (the /design
 * gallery). Never use it in the app.
 */
export function TooltipPreview({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-block max-w-64 rounded-sm bg-inverse px-2 py-1 text-xs text-on-inverse shadow-pop", className)}>
      {children}
    </span>
  );
}
