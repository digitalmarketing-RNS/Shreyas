import {
  ArrowRightLeft,
  Download,
  FileDown,
  FileUp,
  ListChecks,
  type LucideIcon,
  Send,
  ShieldOff,
  Trash2,
  UserRoundMinus,
  Webhook,
} from "lucide-react";
import { formatNumber } from "@/lib/format";

/**
 * Background jobs as JobProgress shows them (components.md, JobProgress). jobs.kind and
 * jobs.status come from the schema; "not responding", "done with errors" and "cancelling" are
 * derived here and read their labels from the Status vocabulary (domain "jobs.status").
 */
export type JobKind =
  | "lead_import"
  | "opportunity_import"
  | "bulk_update"
  | "bulk_stage_change"
  | "bulk_message"
  | "bulk_reassign"
  | "bulk_unassign"
  | "bulk_delete"
  | "bulk_webhook"
  | "export"
  | "report_export"
  | "erasure";

export type JobStatus = "queued" | "running" | "done" | "failed" | "cancelled";

/** The state the UI shows: the stored status plus the derived ones. */
export type JobState = JobStatus | "not_responding" | "done_with_errors";

export type JobTotals = {
  requested?: number;
  created?: number;
  updated?: number;
  failed?: number;
  skipped?: number;
};

export type Job = {
  id: string;
  kind: JobKind;
  /** How many leads a bulk job touches: "Updating 240 leads". */
  count?: number;
  status: JobStatus;
  /** Running with no heartbeat for 2 minutes. */
  heartbeatStale?: boolean;
  /** Cancel was pressed and the server is stopping it. */
  cancelling?: boolean;
  /** The total to process, when known (makes the bar determinate). */
  total?: number;
  totals: JobTotals;
  /** Formatted on the server: "2:30 pm". */
  startedAt: string;
  /** Shown once 10% is done and 5 s have passed: "About 2 min left". */
  etaText?: string;
  /** Failed jobs: what went wrong and what was (not) changed, in our words. */
  failureReason?: string;
};

const TITLES: Record<JobKind, (count: string) => string> = {
  lead_import: () => "Importing leads",
  opportunity_import: () => "Importing opportunities",
  bulk_update: (n) => `Updating ${n} leads`,
  bulk_stage_change: (n) => `Changing stage for ${n} leads`,
  bulk_message: (n) => `Sending to ${n} leads`,
  bulk_reassign: (n) => `Reassigning ${n} leads`,
  bulk_unassign: (n) => `Removing owners from ${n} leads`,
  bulk_delete: (n) => `Deleting ${n} leads`,
  bulk_webhook: (n) => `Sending ${n} leads to a webhook`,
  export: () => "Preparing lead export",
  report_export: () => "Preparing report export",
  erasure: () => "Erasing personal data",
};

/** The noun used in announcements and the tray line: "Import finished", "Export 50% done". */
const NOUNS: Record<JobKind, string> = {
  lead_import: "Import",
  opportunity_import: "Import",
  bulk_update: "Update",
  bulk_stage_change: "Stage change",
  bulk_message: "Sending",
  bulk_reassign: "Reassignment",
  bulk_unassign: "Owner removal",
  bulk_delete: "Deletion",
  bulk_webhook: "Webhook send",
  export: "Export",
  report_export: "Export",
  erasure: "Erasure",
};

export const JOB_KIND_ICON: Record<JobKind, LucideIcon> = {
  lead_import: FileUp,
  opportunity_import: FileUp,
  bulk_update: ListChecks,
  bulk_stage_change: ListChecks,
  bulk_message: Send,
  bulk_reassign: ArrowRightLeft,
  bulk_unassign: UserRoundMinus,
  bulk_delete: Trash2,
  bulk_webhook: Webhook,
  export: Download,
  report_export: FileDown,
  erasure: ShieldOff,
};

export function jobTitle(job: Pick<Job, "kind" | "count">): string {
  return TITLES[job.kind](formatNumber(job.count ?? 0));
}

export function jobNoun(kind: JobKind): string {
  return NOUNS[kind];
}

export function isImport(kind: JobKind): boolean {
  return kind === "lead_import" || kind === "opportunity_import";
}

export function isExport(kind: JobKind): boolean {
  return kind === "export" || kind === "report_export";
}

/** processed = created + updated + failed + skipped. */
export function jobProcessed(job: Pick<Job, "totals">): number {
  const { created = 0, updated = 0, failed = 0, skipped = 0 } = job.totals;
  return created + updated + failed + skipped;
}

export function deriveJobState(job: Pick<Job, "status" | "heartbeatStale" | "totals">): JobState {
  if (job.status === "running" && job.heartbeatStale) return "not_responding";
  if (job.status === "done" && (job.totals.failed ?? 0) > 0) return "done_with_errors";
  return job.status;
}

export function isFinished(state: JobState): boolean {
  return state === "done" || state === "done_with_errors" || state === "failed" || state === "cancelled";
}

/** "1,180 created, 20 updated, 20 failed." Only the counts that apply. */
export function jobResultSentence(job: Pick<Job, "totals">): string {
  const parts: string[] = [];
  const { created, updated, failed, skipped } = job.totals;
  if (created) parts.push(`${formatNumber(created)} created`);
  if (updated) parts.push(`${formatNumber(updated)} updated`);
  if (failed) parts.push(`${formatNumber(failed)} failed`);
  if (skipped) parts.push(`${formatNumber(skipped)} skipped`);
  return parts.length ? `${parts.join(", ")}.` : "Nothing needed changing.";
}

/** The tray's collapsed line: "2 tasks running", "1 task running, 1 finished", "Import finished". */
export function traySummary(jobs: readonly Pick<Job, "kind" | "status" | "heartbeatStale" | "totals">[]): string {
  const running = jobs.filter((job) => !isFinished(deriveJobState(job))).length;
  const finished = jobs.length - running;
  if (jobs.length === 1 && finished === 1) {
    const state = deriveJobState(jobs[0]);
    const noun = jobNoun(jobs[0].kind);
    if (state === "failed") return `${noun} failed`;
    if (state === "cancelled") return `${noun} stopped`;
    return `${noun} finished`;
  }
  const runningText = `${running} ${running === 1 ? "task" : "tasks"} running`;
  if (finished === 0) return runningText;
  if (running === 0) return `${finished} ${finished === 1 ? "task" : "tasks"} finished`;
  return `${runningText}, ${finished} finished`;
}
