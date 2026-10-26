import { Merge } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { StatusPill } from "@/components/ui/display/status-pill";
import { cn } from "@/lib/cn";
import { NewLeadDot } from "./new-lead-dot";
import type { RowMarker } from "./data-table-types";

export type PrimaryCellProps = {
  name: string;
  href: string;
  marker?: RowMarker;
  /** Merged rows: the main record's name. */
  mergedInto?: string;
  secondary?: ReactNode;
};

/**
 * The record's name as a full-height link to its profile, with the New dot or the Merge icon
 * before it (components.md, DataTable). Markers are never colour alone: new rows start with sr-only
 * "New, "; merged rows say "Merged into Meera Pillai"; rows on hold carry the "On hold" pill.
 * Ctrl+Enter (Cmd+Enter) opens the profile in a new tab, as for any link.
 */
export function PrimaryCell({ name, href, marker = null, mergedInto, secondary }: PrimaryCellProps) {
  const muted = marker === "merged" || marker === "on-hold";
  return (
    <div className="flex min-w-0 items-center gap-2">
      {marker === "new" ? <NewLeadDot /> : null}
      {marker === "merged" ? <Merge aria-hidden="true" className="size-icon-sm shrink-0 text-muted" /> : null}
      <div className="flex min-w-0 flex-col">
        <Link
          href={href}
          title={name}
          className={cn(
            "-my-1 flex min-h-hit min-w-0 items-center rounded-sm font-medium underline-offset-2 hover:underline focus-inset",
            muted ? "text-muted" : "text-fg",
          )}
        >
          {marker === "new" ? <span className="sr-only">New, </span> : null}
          <span dir="auto" className="truncate pt-0.5 pb-1">
            {name}
          </span>
        </Link>
        {marker === "merged" && mergedInto ? (
          <span className="truncate pb-1 text-xs text-muted">{`Merged into ${mergedInto}`}</span>
        ) : secondary ? (
          <span className="truncate pb-1 text-xs text-muted">{secondary}</span>
        ) : null}
      </div>
      {marker === "on-hold" ? <StatusPill domain="leads.restricted_at" value="set" className="ml-auto" /> : null}
    </div>
  );
}
