import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * - count neutral: nav and tab counts. count accent: on an active tab or a selected filter.
 *   count danger: the bell's unread count.
 * - tag neutral: "Promotional", "Default", "Under 18"…; tag outline: the same words where a filled
 *   tag is too heavy (dense tables, selected rows); tag warning: "Test mode" only.
 * - dot: "has items" in the collapsed sidebar; never alone without a name or tooltip.
 */
export type BadgeVariant = "count" | "count-accent" | "count-danger" | "tag" | "tag-outline" | "tag-warning" | "dot";

const VARIANT: Record<BadgeVariant, string> = {
  count: "min-w-5 justify-center rounded-pill border border-transparent bg-surface-sunken px-1.5 text-fg tabular-nums",
  "count-accent": "min-w-5 justify-center rounded-pill border border-transparent bg-accent-subtle px-1.5 text-accent tabular-nums",
  "count-danger": "min-w-5 justify-center rounded-pill border border-transparent bg-danger px-1.5 text-on-danger tabular-nums",
  tag: "rounded-sm border border-transparent bg-surface-sunken px-1.5 text-fg",
  "tag-outline": "rounded-sm border border-strong px-1.5 text-muted",
  "tag-warning": "rounded-sm border border-transparent bg-warning-subtle px-1.5 text-warning",
  dot: "size-2 rounded-pill bg-accent",
};

/** "99+" above 99; 0 shows nothing. */
export function formatCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

export type BadgeProps = {
  variant?: BadgeVariant;
  /** Count variants: the number (0 renders nothing). */
  count?: number;
  /** Tag variants: a word or two. */
  children?: ReactNode;
  /**
   * Hide the badge from assistive tech when its parent's name already includes the count
   * ("Inbox, 4 chats waiting"). Tags are read as text.
   */
  decorative?: boolean;
  className?: string;
};

/**
 * A small label for a count or a fixed attribute (components.md, Badge). Not for lifecycle state:
 * that is StatusPill. Meaning is always in the word, never in the fill. Not focusable.
 */
export function Badge({ variant = "tag", count, children, decorative = false, className }: BadgeProps) {
  const isCount = variant.startsWith("count");
  if (isCount && (!count || count <= 0)) return null;
  if (variant === "dot") return <span aria-hidden="true" className={cn("inline-block shrink-0", VARIANT.dot, className)} />;
  return (
    <span
      aria-hidden={decorative || undefined}
      className={cn("inline-flex h-5 shrink-0 items-center text-xs font-medium whitespace-nowrap", VARIANT[variant], className)}
    >
      {isCount ? formatCount(count ?? 0) : children}
    </span>
  );
}
