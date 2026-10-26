"use client";

import { CircleAlert, Ellipsis, TriangleAlert } from "lucide-react";
import { Toolbar } from "radix-ui";
import { type ReactElement, type RefObject, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { ControlTooltip } from "@/components/ui/icon-button";
import { ConfirmDialog } from "@/components/ui/overlays/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/overlays/dropdown-menu";
import { useMediaQuery } from "@/components/ui/shell/use-media-query";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { TableNoun } from "./data-table-types";

export type BulkAction = {
  id: string;
  /** "Reassign", "Change stage". */
  label: string;
  icon: ReactElement;
  /** Opens the action's own dialog first (S13 reassign, S10 compose, S09 change stage…). */
  onSelect: () => void;
};

export type BulkJob = {
  /** "Reassigning 312 leads…". */
  label: string;
  done: number;
  total: number;
  /** The job can stop: shows "Cancel". */
  cancellable?: boolean;
  /** "Stopping…": rows already done stay done. */
  cancelling?: boolean;
  /** Polling lost the connection: the label says it is still working. */
  connectionLost?: boolean;
};

export type BulkResult =
  | {
      tone: "warning";
      /** "Changed 298 of 312 leads. 14 were skipped: 9 have a locked stage, 5 would move to an earlier stage." */
      message: string;
      onDownloadReport: () => void;
      onSelectSkipped: () => void;
      onDismiss: () => void;
    }
  | { tone: "danger"; message: string; onRetry: () => void };

export type BulkActionBarProps = {
  noun: TableNoun;
  /** Rows selected (on any page). */
  selectedCount: number;
  /** "All 1,284 matching leads selected": the job runs on the filter as it was when it started. */
  allMatching?: boolean;
  /** The matching total, for the all-matching count. */
  matchingTotal?: number;
  actions: BulkAction[];
  /** The More menu: "Update a field", "Unassign", "Send to a webhook"… */
  moreActions?: BulkAction[];
  /** Delete sits last in More, after a separator; it always asks first (typed over 100 rows). */
  onDelete?: (count: number) => Promise<void>;
  job?: BulkJob | null;
  onCancelJob?: () => void;
  result?: BulkResult | null;
  onClearSelection: () => void;
  /** "Clear selection" returns focus to the table's select-all checkbox. */
  selectAllRef?: RefObject<HTMLInputElement | null>;
  className?: string;
};

export const BULK_TEXT = {
  hint: (noun: TableNoun) => `Select ${noun.other} to act on them.`,
  wait: "Wait for the current job to finish.",
  lostConnection: "Still working. We'll update this when the connection is back.",
  failed: (noun: TableNoun) => `The job stopped before changing any ${noun.other}.`,
} as const;

/**
 * Act on many selected records at once and follow the job to its end (components.md,
 * BulkActionBar). The left part of the table's footer bar; Pagination is the right part. Radix
 * Toolbar: one tab stop, Left and Right move between buttons. Below xl the action buttons drop their
 * labels into tooltips and keep their names. Progress is a progressbar, announced at the start,
 * each quarter and the end; results are announced in the same status and focus does not move.
 */
export function BulkActionBar({
  noun,
  selectedCount,
  allMatching = false,
  matchingTotal,
  actions,
  moreActions = [],
  onDelete,
  job,
  onCancelJob,
  result,
  onClearSelection,
  selectAllRef,
  className,
}: BulkActionBarProps) {
  const base = useId();
  const wide = useMediaQuery("(min-width: 80rem)", true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const count = allMatching && matchingTotal !== undefined ? matchingTotal : selectedCount;
  const running = Boolean(job);
  const reason = running ? BULK_TEXT.wait : selectedCount === 0 && !allMatching ? BULK_TEXT.hint(noun) : undefined;

  // Announce the job at its start, each quarter and the end; and each result once.
  const quarter = job ? Math.floor((job.done / Math.max(job.total, 1)) * 4) : -1;
  const [seen, setSeen] = useState<{ job: string | null; quarter: number; result: string | null }>({ job: null, quarter: -1, result: null });
  const [live, setLive] = useState("");
  const jobKey = job ? job.label : null;
  const resultKey = result ? result.message : null;
  if (seen.job !== jobKey || seen.quarter !== quarter || seen.result !== resultKey) {
    setSeen({ job: jobKey, quarter, result: resultKey });
    if (result && resultKey !== seen.result) setLive(result.message);
    else if (job && jobKey !== seen.job) setLive(`${job.label} Started.`);
    else if (job && quarter !== seen.quarter && quarter > 0) setLive(`${formatNumber(job.done)} of ${formatNumber(job.total)} done.`);
  }

  const actionButton = (action: BulkAction) => {
    const button = (
      <Toolbar.Button key={action.id} asChild>
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={action.icon}
          aria-label={action.label}
          disabledReason={reason}
          onClick={action.onSelect}
        >
          <span className="max-xl:sr-only">{action.label}</span>
        </Button>
      </Toolbar.Button>
    );
    // Below xl the label moves into a tooltip; with a reason, the button's own tooltip shows that.
    return !wide && !reason ? (
      <ControlTooltip key={action.id} content={action.label}>
        {button}
      </ControlTooltip>
    ) : (
      button
    );
  };

  let state;
  if (result) {
    state =
      result.tone === "warning" ? (
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-warning-subtle px-3 py-1.5 text-sm text-fg">
          <TriangleAlert aria-hidden="true" className="size-icon-sm shrink-0 text-warning" />
          <span className="min-w-0">{result.message}</span>
          <span className="flex flex-wrap items-center gap-3">
            <Button variant="link" onClick={result.onDownloadReport}>
              Download report
            </Button>
            <Button variant="link" onClick={result.onSelectSkipped}>
              {`Select skipped ${noun.other}`}
            </Button>
            <Button variant="link" onClick={result.onDismiss}>
              Dismiss
            </Button>
          </span>
        </div>
      ) : (
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-danger-subtle px-3 py-1.5 text-sm text-fg">
          <CircleAlert aria-hidden="true" className="size-icon-sm shrink-0 text-danger" />
          <span className="min-w-0">{result.message}</span>
          <Button variant="link" onClick={result.onRetry}>
            Try again
          </Button>
        </div>
      );
  } else if (job) {
    const percent = Math.round((job.done / Math.max(job.total, 1)) * 100);
    state = (
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg">
        <span id={`${base}-job`} className="font-medium">
          {job.cancelling ? "Stopping…" : job.connectionLost ? BULK_TEXT.lostConnection : job.label}
        </span>
        <span
          role="progressbar"
          aria-labelledby={`${base}-job`}
          aria-valuemin={0}
          aria-valuemax={job.total}
          aria-valuenow={job.done}
          aria-valuetext={`${formatNumber(job.done)} of ${formatNumber(job.total)} done`}
          className="block h-1.5 w-48 overflow-hidden rounded-pill bg-surface-sunken"
        >
          <span className="block h-full rounded-pill bg-accent motion-safe:transition-[width] motion-safe:duration-base" style={{ width: `${percent}%` }} />
        </span>
        <span className="text-muted tabular-nums">{`${formatNumber(job.done)} of ${formatNumber(job.total)} done`}</span>
        {job.cancellable && !job.cancelling ? (
          <Button variant="secondary" size="sm" onClick={onCancelJob}>
            Cancel
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2", className)}>
      {state ?? (
        <>
          {selectedCount > 0 || allMatching ? (
            <span className="flex items-center gap-2">
              <span className="text-sm font-medium text-fg tabular-nums">
                {allMatching ? `All ${formatNumber(count)} matching ${noun.other} selected` : `${formatNumber(selectedCount)} selected`}
              </span>
              <Button
                variant="link"
                onClick={() => {
                  onClearSelection();
                  window.requestAnimationFrame(() => selectAllRef?.current?.focus());
                }}
              >
                Clear selection
              </Button>
            </span>
          ) : (
            <span className="text-sm text-muted">{BULK_TEXT.hint(noun)}</span>
          )}
        </>
      )}
      {result ? null : (
        <Toolbar.Root aria-label={`Actions for selected ${noun.other}`} className="flex flex-wrap items-center gap-2">
          {actions.map(actionButton)}
          {moreActions.length > 0 || onDelete ? (
            <DropdownMenu modal={false}>
              <Toolbar.Button asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    leadingIcon={<Ellipsis />}
                    aria-label={`More actions for selected ${noun.other}`}
                    disabledReason={reason}
                  >
                    <span className="max-xl:sr-only">More</span>
                  </Button>
                </DropdownMenuTrigger>
              </Toolbar.Button>
              <DropdownMenuContent align="end">
                {moreActions.map((action) => (
                  <DropdownMenuItem key={action.id} icon={action.icon} onSelect={action.onSelect}>
                    {action.label}
                  </DropdownMenuItem>
                ))}
                {onDelete ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive onSelect={() => setConfirmOpen(true)}>
                      Delete
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </Toolbar.Root>
      )}
      {onDelete ? (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={`Delete ${formatNumber(count)} ${count === 1 ? noun.one : noun.other}?`}
          description={`They'll be hidden from every list and report. Their payments and consent records are kept. You can't undo this.`}
          confirmLabel={`Delete ${formatNumber(count)} ${count === 1 ? noun.one : noun.other}`}
          confirmingLabel="Deleting…"
          tone="danger"
          typedConfirmation={count > 100 ? String(count) : undefined}
          onConfirm={() => onDelete(count)}
        />
      ) : null}
      <p role="status" className="sr-only">
        {live}
      </p>
    </div>
  );
}
