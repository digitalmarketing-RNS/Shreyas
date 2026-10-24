"use client";

import { ChevronRight } from "lucide-react";
import { Collapsible } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DisclosureProps = {
  /** Names what opens: "Details", "14 skipped". */
  label: ReactNode;
  /** A different label while open, only when the action changes ("Show them" / "Hide them"). */
  openLabel?: ReactNode;
  children: ReactNode;
  /** native: <details> and <summary>, works without JavaScript (public pages). controlled: Radix Collapsible. */
  variant?: "native" | "controlled";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Public pages: a 44 px trigger. */
  surface?: "staff" | "public";
  className?: string;
};

const TRIGGER =
  "inline-flex items-center gap-1 rounded-sm text-sm font-medium text-fg underline-offset-2 hover:underline cursor-pointer select-none";

/**
 * Shows or hides extra detail under a button, in place (components.md Disclosure). Opening never
 * moves focus; the content follows the trigger in the tab order. Tab focuses the trigger; Enter or
 * Space toggles. The chevron points right when closed and down when open (aria-hidden).
 */
export function Disclosure({
  label,
  openLabel,
  children,
  variant = "native",
  open,
  defaultOpen,
  onOpenChange,
  surface = "staff",
  className,
}: DisclosureProps) {
  const height = surface === "public" ? "min-h-hit-public" : "min-h-hit";
  if (variant === "native") {
    return (
      <details
        className={cn("group", className)}
        open={open ?? defaultOpen}
        onToggle={(event) => onOpenChange?.(event.currentTarget.open)}
      >
        <summary className={cn(TRIGGER, height, "list-none [&::-webkit-details-marker]:hidden")}>
          <ChevronRight
            aria-hidden="true"
            className="size-icon-sm shrink-0 text-muted group-open:rotate-90 motion-safe:transition-transform motion-safe:duration-fast"
          />
          {openLabel ? (
            <>
              <span className="group-open:hidden">{label}</span>
              <span className="hidden group-open:inline">{openLabel}</span>
            </>
          ) : (
            label
          )}
        </summary>
        <div className="pt-2 text-sm text-fg">{children}</div>
      </details>
    );
  }
  return (
    <Collapsible.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} className={cn("group/disclosure", className)}>
      <Collapsible.Trigger className={cn(TRIGGER, height)}>
        <ChevronRight
          aria-hidden="true"
          className="size-icon-sm shrink-0 text-muted group-data-[state=open]/disclosure:rotate-90 motion-safe:transition-transform motion-safe:duration-fast"
        />
        {openLabel ? (
          <>
            <span className="group-data-[state=open]/disclosure:hidden">{label}</span>
            <span className="hidden group-data-[state=open]/disclosure:inline">{openLabel}</span>
          </>
        ) : (
          label
        )}
      </Collapsible.Trigger>
      <Collapsible.Content className="pt-2 text-sm text-fg">{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}
