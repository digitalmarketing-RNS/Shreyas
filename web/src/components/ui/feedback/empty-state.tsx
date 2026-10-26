import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * - first-use: nothing exists yet; says what will appear and how to start.
 * - no-results: a filter or search matched nothing; offers to clear it.
 * - cleared: work is done ("You're all caught up").
 * - needs-setup: something must be connected first; admins get the action, others who to ask.
 * - no-permission: the role can't see this; names who can help, no action.
 * - error: loading failed; "Try again" and a reference code.
 */
export type EmptyStateVariant = "first-use" | "no-results" | "cleared" | "needs-setup" | "no-permission" | "error";

/** page: the main area; section: a tab or card; compact: a popover, table body or small panel (no icon). */
export type EmptyStateSize = "page" | "section" | "compact";

export type EmptyStateProps = {
  variant?: EmptyStateVariant;
  size?: EmptyStateSize;
  /** Decorative (aria-hidden). Not drawn in the compact size. */
  icon?: LucideIcon;
  /** The state in plain words, at most 6 words, no exclamation marks. */
  title: string;
  /** What appears here or why it's empty, then what to do: one or two sentences. */
  body?: ReactNode;
  /** Buttons (md on a page, sm in compact) or a link: a verb plus object. */
  actions?: ReactNode;
  /** The error variant's reference code: "7F3K-21". */
  reference?: string;
  /** h2 on a page, h3 in a tab, h4 inside a card section. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

const SIZE = {
  page: { root: "py-16", circle: "size-12", icon: "size-icon-lg", title: "text-md text-fg", actions: "mt-4" },
  section: { root: "py-8", circle: "size-control-md", icon: "size-icon-md", title: "text-sm font-semibold text-fg", actions: "mt-4" },
  compact: { root: "py-6", circle: "", icon: "", title: "text-sm font-medium text-fg", actions: "mt-3" },
} as const;

/**
 * Explains why a page, tab, panel or list has nothing to show, and offers the next step
 * (components.md, EmptyState). The result count announcement comes from the list's status line,
 * not from here; when an empty state replaces content after a filter change, focus stays on the
 * control that changed.
 */
export function EmptyState({
  variant = "first-use",
  size = "page",
  icon: Icon,
  title,
  body,
  actions,
  reference,
  headingLevel = 2,
  className,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;
  const styles = SIZE[size];
  return (
    <div
      data-variant={variant}
      className={cn("mx-auto flex max-w-sm flex-col items-center px-4 text-center", styles.root, className)}
    >
      {Icon && size !== "compact" ? (
        <span
          aria-hidden="true"
          className={cn("mb-3 inline-flex items-center justify-center rounded-pill bg-surface-sunken text-muted", styles.circle)}
        >
          <Icon className={styles.icon} />
        </span>
      ) : null}
      <Heading className={cn("m-0", styles.title)}>{title}</Heading>
      {body ? <div className="mt-1 text-sm leading-prose text-muted">{body}</div> : null}
      {reference ? <p className="mt-2 mb-0 font-mono text-xs text-muted">Ref: {reference}</p> : null}
      {actions ? <div className={cn("flex flex-wrap items-center justify-center gap-2", styles.actions)}>{actions}</div> : null}
    </div>
  );
}
