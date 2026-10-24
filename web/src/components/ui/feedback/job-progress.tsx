"use client";

import { Download, RotateCcw, UsersRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DescriptionList } from "@/components/ui/display/description-list";
import { StatusPill } from "@/components/ui/display/status-pill";
import { ConfirmDialog } from "@/components/ui/overlays/confirm-dialog";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import {
  JOB_KIND_ICON,
  type Job,
  type JobState,
  deriveJobState,
  isExport,
  isFinished,
  isImport,
  jobNoun,
  jobProcessed,
  jobResultSentence,
  jobTitle,
} from "./jobs";
import { ProgressBar } from "./progress-bar";

export type JobProgressVariant = "inline" | "tray" | "toast";

export type JobProgressActions = {
  /** Shown while queued or running; asks first ("Stop this import?"). Resolve when the stop request is sent. */
  onCancel?: () => Promise<void> | void;
  onRetry?: () => void;
  /** Done with failures: "Download error report (20 rows)". */
  onDownloadErrors?: () => void;
  /** Opens S05 filtered to the job. */
  onViewLeads?: () => void;
  /** Exports: the signed download link (expires after 15 minutes). */
  onDownloadFile?: () => void;
};

export type JobProgressProps = JobProgressActions & {
  job: Job;
  variant?: JobProgressVariant;
  /** Announce start, every 25% and the end in a polite status region. Off for toasts (the toast is the announcement). */
  announce?: boolean;
  /** inline: the heading level of the title. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

/**
 * A long-running import, bulk action or export from start to finish, with counts, errors and a way
 * to stop it (components.md, JobProgress). Variants: inline (the S13 result dialog body,
 * ImportWizard step 4), tray (compact, in the JobTray) and toast (in a job toast).
 */
export function JobProgress({
  job,
  variant = "inline",
  announce = variant !== "toast",
  headingLevel = 3,
  className,
  onCancel,
  onRetry,
  onDownloadErrors,
  onViewLeads,
  onDownloadFile,
}: JobProgressProps) {
  const titleId = useId();
  const state = deriveJobState(job);
  const processed = jobProcessed(job);
  const total = job.total ?? job.totals.requested;
  const percent = total ? Math.round((processed / total) * 100) : null;
  const finished = isFinished(state);
  const title = jobTitle(job);
  const Icon = JOB_KIND_ICON[job.kind];
  const Heading = `h${headingLevel}` as const;
  const announcement = useMilestones(job, state, percent, announce);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const valueText = total ? `${formatNumber(processed)} of ${formatNumber(total)}` : undefined;
  const unit = isImport(job.kind) ? "rows" : "leads";
  // A failed or stopped job keeps its last value; a finished one fills the bar.
  const done = state === "done" || state === "done_with_errors";
  const barValue = total ? (done ? total : processed) : done ? 100 : null;
  const bar = (
    <ProgressBar
      labelledBy={titleId}
      value={barValue}
      max={total ?? 100}
      valueText={variant === "inline" ? valueText : undefined}
      valueLabel={total ? `${valueText} ${unit}, ${percent}%` : "Working…"}
      size={variant === "inline" ? "md" : "sm"}
      hideLabel={variant !== "inline"}
    />
  );

  const cancelButton =
    onCancel && (state === "queued" || state === "running" || state === "not_responding") ? (
      <>
        <Button variant="secondary" size="sm" loading={job.cancelling} loadingLabel="Stopping…" onClick={() => setConfirmOpen(true)}>
          Cancel
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={isImport(job.kind) ? "Stop this import?" : `Stop this task?`}
          description={isImport(job.kind) ? "Rows already imported stay." : "Leads already done stay done."}
          confirmLabel={isImport(job.kind) ? "Stop import" : "Stop task"}
          cancelLabel="Keep going"
          onConfirm={onCancel}
        />
      </>
    ) : null;

  const statusLine = <StatusLine job={job} state={state} total={total} processed={processed} />;

  const results = finished ? (
    <div className="flex flex-wrap items-center gap-2">
      {state === "done_with_errors" && onDownloadErrors ? (
        <Button variant="secondary" size="sm" leadingIcon={<Download />} onClick={onDownloadErrors}>
          {`Download error report (${formatNumber(job.totals.failed ?? 0)} rows)`}
        </Button>
      ) : null}
      {(state === "done" || state === "done_with_errors") && onViewLeads && !isExport(job.kind) ? (
        <Button variant="secondary" size="sm" leadingIcon={<UsersRound />} onClick={onViewLeads}>
          View these leads
        </Button>
      ) : null}
      {state === "done" && isExport(job.kind) && onDownloadFile ? (
        <Button variant="primary" size="sm" leadingIcon={<Download />} onClick={onDownloadFile}>
          Download file
        </Button>
      ) : null}
      {state === "failed" && onRetry ? (
        <Button variant="secondary" size="sm" leadingIcon={<RotateCcw />} onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  ) : null;

  const live = announce ? (
    <span role="status" className="sr-only">
      {announcement}
    </span>
  ) : null;

  if (variant !== "inline") {
    const failed = job.totals.failed ?? 0;
    return (
      <div className={cn("flex min-w-0 flex-col gap-2", className)}>
        <div className="flex items-center gap-2">
          {variant === "tray" ? (
            <p id={titleId} className="m-0 min-w-0 flex-1 truncate pt-0.5 pb-1 text-sm font-semibold text-fg">
              {title}
            </p>
          ) : (
            <span id={titleId} className="sr-only">
              {title}
            </span>
          )}
          <StatusPill domain="jobs.status" value={state} />
        </div>
        {bar}
        <p className="m-0 text-xs text-muted tabular-nums">
          {finished ? (
            jobResultSentence(job)
          ) : (
            <>
              {valueText ?? "Working…"}
              {failed > 0 ? (
                <>
                  {" · "}
                  <span className="text-danger">{formatNumber(failed)} failed</span>
                </>
              ) : null}
            </>
          )}
        </p>
        {finished && variant === "tray" ? results : null}
        {live}
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Icon aria-hidden="true" className="size-icon-md shrink-0 text-muted" />
        <Heading id={titleId} className="m-0 min-w-0 text-sm font-semibold text-fg">
          {title}
        </Heading>
        <StatusPill domain="jobs.status" value={state} />
        <span className="ml-auto">{cancelButton}</span>
      </div>
      {bar}
      <DescriptionList variant="counts" items={countItems(job)} />
      {statusLine}
      {results}
      {live}
    </div>
  );
}

function countItems(job: Job) {
  const { requested, created, updated, failed, skipped } = job.totals;
  const items: { label: string; value: string; valueClassName?: string }[] = [];
  if (requested !== undefined) items.push({ label: "Requested", value: formatNumber(requested) });
  if (created !== undefined) items.push({ label: "Created", value: formatNumber(created) });
  if (updated !== undefined) items.push({ label: "Updated", value: formatNumber(updated) });
  if (failed !== undefined) items.push({ label: "Failed", value: formatNumber(failed), valueClassName: failed > 0 ? "text-danger" : undefined });
  if (skipped !== undefined) items.push({ label: "Skipped", value: formatNumber(skipped) });
  return items;
}

function StatusLine({ job, state, total, processed }: { job: Job; state: JobState; total?: number; processed: number }) {
  let text: string;
  switch (state) {
    case "queued":
      text = "Waiting to start. Other tasks are ahead of it.";
      break;
    case "running":
      text = job.etaText ? `Started ${job.startedAt} · ${job.etaText}` : `Started ${job.startedAt}`;
      break;
    case "not_responding":
      text = "No progress for 2 minutes. It may resume on its own; you can also stop it.";
      break;
    case "done":
    case "done_with_errors":
      text = jobResultSentence(job);
      break;
    case "failed":
      text = job.failureReason ?? "It stopped before finishing. Nothing was changed.";
      break;
    case "cancelled":
      text = total
        ? `Stopped at ${formatNumber(processed)} of ${formatNumber(total)}. ${isImport(job.kind) ? "Rows" : "Leads"} already done stay done.`
        : "Stopped. Work already done stays done.";
      break;
  }
  return <p className={cn("m-0 text-sm", state === "failed" ? "text-fg" : "text-muted")}>{text}</p>;
}

/** Start, every 25%, and the end, announced once each (components.md, JobProgress a11y). */
function useMilestones(job: Job, state: JobState, percent: number | null, enabled: boolean): string {
  const [message, setMessage] = useState("");
  const said = useRef<{ started: boolean; quarter: number; ended: boolean }>({ started: false, quarter: 0, ended: false });
  const noun = jobNoun(job.kind);

  useEffect(() => {
    if (!enabled) return;
    const memory = said.current;
    let next: string | null = null;
    if (isFinished(state)) {
      if (!memory.ended) {
        memory.ended = true;
        next =
          state === "failed"
            ? `${noun} failed.`
            : state === "cancelled"
              ? `${noun} stopped.`
              : `${noun} finished. ${jobResultSentence(job)}`;
      }
    } else if (state === "running" && !memory.started) {
      memory.started = true;
      next = `${noun} started`;
    } else if (percent !== null) {
      const quarter = Math.floor(percent / 25);
      if (quarter > memory.quarter && quarter < 4) {
        memory.quarter = quarter;
        next = `${noun} ${quarter * 25}% done`;
      }
    }
    if (next) setMessage(next);
  }, [enabled, state, percent, noun, job]);

  return message;
}
