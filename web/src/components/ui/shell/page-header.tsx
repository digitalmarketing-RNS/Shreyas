"use client";

import { Ellipsis, LoaderCircle, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { type ReactElement, type ReactNode, useRef } from "react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/display/status-pill";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { IconButton } from "@/components/ui/icon-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { cn } from "@/lib/cn";
import { useShellLayer } from "./shell-context";
import { MEDIA_MD, useMediaQuery } from "./use-media-query";

export type PageAction = {
  id: string;
  label: string;
  icon?: ReactElement;
  onSelect?: () => void;
  href?: string;
  /** Actions that change data on a read-only record are aria-disabled with a reason. */
  disabledReason?: string;
  /** Destructive overflow items sit last, after a separator, and open a ConfirmDialog. */
  destructive?: boolean;
};

export type PageHeaderVariant = "list" | "detail" | "settings" | "builder";

export type PageHeaderProps = {
  variant?: PageHeaderVariant;
  /** A noun ("Leads", "Lead fields") or, on detail pages, the record name. */
  title: ReactNode;
  /** h1 in the app (exactly one per page). The /design gallery's specimens use a lower level. */
  headingLevel?: 1 | 2 | 3;
  /** The title is a user-entered name: dir="auto", text-xl leading-prose, wraps, never truncates. */
  recordName?: boolean;
  /** The record count after the title ("12,480"), in text-muted. */
  count?: string;
  /** A StatusPill after the title (inside the title's container, not inside the h1). */
  status?: ReactNode;
  description?: ReactNode;
  /** Key facts as text-xs text-muted items: "Lead #10482", "Created 03 Oct 2026". */
  meta?: ReactNode[];
  /** Breadcrumbs above the title row. */
  breadcrumbs?: ReactNode;
  /** The primary action (rightmost, last). */
  primary?: PageAction;
  /** Secondary actions, before the primary. Below md they move into More actions. */
  secondary?: PageAction[];
  /** Overflow actions in the "More actions" menu. */
  more?: PageAction[];
  /** Tabs attached to the bottom edge (detail pages). */
  tabs?: ReactNode;
  /** builder: "Saved", "Saving…" (with a Spinner) or "Unsaved changes" (warning, with an icon). */
  saveState?: "saved" | "saving" | "unsaved";
  /** Title and button Skeletons of the same sizes. */
  loading?: boolean;
  /** Merged records and records on hold: a neutral "Read-only" pill; changing actions need a disabledReason. */
  readOnly?: boolean;
  /** The builder variant sticks under the header; pass false to draw it in place (documentation). */
  sticky?: boolean;
  className?: string;
};

/**
 * The top of every page: where you are, what the page is, its state, and the page-level actions
 * (components.md, PageHeader). Normal Tab order: breadcrumbs, then the actions in visual order. The
 * h1 has tabindex="-1" and receives focus after a client route change (AppShell). The builder
 * variant is sticky under the header and sets --sticky-extra while it shows, so a focused field
 * scrolls clear of it.
 */
export function PageHeader({
  variant = "list",
  title,
  headingLevel = 1,
  recordName = variant === "detail",
  count,
  status,
  description,
  meta,
  breadcrumbs,
  primary,
  secondary = [],
  more = [],
  tabs,
  saveState,
  loading = false,
  readOnly = false,
  sticky = true,
  className,
}: PageHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const builder = variant === "builder";
  const wide = useMediaQuery(MEDIA_MD);
  useShellLayer("page-header-builder", ref, { edge: "top", active: builder && sticky });
  const Heading = `h${headingLevel}` as const;

  const overflow = [...(wide ? [] : secondary), ...more];
  const regular = overflow.filter((action) => !action.destructive);
  const destructive = overflow.filter((action) => action.destructive);

  if (loading) {
    return (
      <div aria-hidden="true" className={cn("flex min-h-pagebar flex-col gap-1 pb-section-gap", className)}>
        {breadcrumbs ? <Skeleton width="40%" /> : null}
        <div className="flex items-center gap-2">
          <Skeleton shape="title" />
          <span className="flex-1" />
          <Skeleton shape="button" />
          <Skeleton shape="button" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1",
        builder
          ? cn("border-b border-border bg-surface px-gutter-sm py-2 shadow-bar @3xl/shell:px-gutter", sticky && "sticky top-header z-(--z-sticky)")
          : "pb-section-gap",
        tabs && "pb-0",
        className,
      )}
    >
      {breadcrumbs}
      <div className="flex min-h-pagebar flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <Heading
              tabIndex={-1}
              dir={recordName ? "auto" : undefined}
              className={cn("m-0 min-w-0 break-words text-fg", recordName ? "text-xl leading-prose" : "text-lg")}
            >
              {title}
            </Heading>
            {count ? <span className="text-lg font-normal text-muted tabular-nums">{count}</span> : null}
            {status}
            {readOnly ? <StatusPill tone="neutral" label="Read-only" /> : null}
            {builder && saveState ? <SaveState state={saveState} /> : null}
          </div>
          {description ? <p className="m-0 text-sm text-muted">{description}</p> : null}
          {meta && meta.length > 0 ? (
            <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-muted">
              {meta.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
        {primary || secondary.length > 0 || more.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {wide ? secondary.map((action) => <ActionButton key={action.id} action={action} variant="secondary" />) : null}
            {overflow.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton icon={<Ellipsis />} aria-label="More actions" variant="secondary" size="sm" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {regular.map((action) => (
                    <MenuAction key={action.id} action={action} />
                  ))}
                  {destructive.length > 0 ? <DropdownMenuSeparator /> : null}
                  {destructive.map((action) => (
                    <MenuAction key={action.id} action={action} />
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {primary ? <ActionButton action={primary} variant="primary" /> : null}
          </div>
        ) : null}
      </div>
      {tabs}
    </div>
  );
}

function ActionButton({ action, variant }: { action: PageAction; variant: "primary" | "secondary" }) {
  if (action.href && !action.disabledReason) {
    return (
      <Button asChild variant={variant} size="sm" leadingIcon={action.icon}>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    );
  }
  return (
    <Button variant={variant} size="sm" leadingIcon={action.icon} disabledReason={action.disabledReason} onClick={action.onSelect}>
      {action.label}
    </Button>
  );
}

function MenuAction({ action }: { action: PageAction }) {
  return (
    <DropdownMenuItem icon={action.icon} destructive={action.destructive} unavailableReason={action.disabledReason} onSelect={() => action.onSelect?.()}>
      {action.label}
    </DropdownMenuItem>
  );
}

function SaveState({ state }: { state: "saved" | "saving" | "unsaved" }) {
  return (
    <span role="status" className="inline-flex items-center gap-1 text-sm">
      {state === "saving" ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-icon-sm text-muted motion-safe:animate-spin" />
          <span className="text-muted">Saving…</span>
        </>
      ) : state === "unsaved" ? (
        <>
          <TriangleAlert aria-hidden="true" className="size-icon-sm text-warning" />
          <span className="text-warning">Unsaved changes</span>
        </>
      ) : (
        <span className="text-muted">Saved</span>
      )}
    </span>
  );
}
