"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback/alert";
import { Banner } from "@/components/ui/feedback/banner";
import { BannerStack } from "@/components/ui/feedback/banner-stack";
import { JobProgress } from "@/components/ui/feedback/job-progress";
import { JobTray } from "@/components/ui/feedback/job-tray";
import type { Job } from "@/components/ui/feedback/jobs";
import { LoadingRegion } from "@/components/ui/feedback/loading-region";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { SkeletonTable } from "@/components/ui/feedback/skeleton-table";
import { Spinner } from "@/components/ui/feedback/spinner";
import { ToastPreview } from "@/components/ui/feedback/toast";
import { Toaster, useToast } from "@/components/ui/feedback/toaster";
import { EmptyState } from "@/components/ui/feedback/empty-state";
import { EMPTY_STATE_COPY } from "@/components/ui/feedback/empty-state-copy";
import { Specimen, StateGrid } from "../../_gallery";
import { StaticPreview } from "../../shell/_kit/static-preview";

/* --------------------------------------------------------------------------------------------- Toast */

const IMPORT_RUNNING: Job = {
  id: "job-toast",
  kind: "lead_import",
  status: "running",
  total: 1200,
  totals: { created: 480, updated: 12, failed: 8 },
  startedAt: "2:30 pm",
  etaText: "About 2 min left",
};

function ToastButtons() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => toast({ tone: "success", title: "Follow-up added for 07 Oct, 10:00 am IST" })}>
        Success
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          toast({
            tone: "error",
            foreground: true,
            title: "Couldn't send the message",
            description: "The WhatsApp number isn't connected. An admin can reconnect it in Settings > Channels.",
            action: { label: "Try again", altText: "Send it again from the lead's Messages tab", onAction: () => {} },
          })
        }
      >
        Error with retry
      </Button>
      <Button variant="secondary" size="sm" onClick={() => toast({ tone: "info", title: "Export is being prepared. We'll tell you when it's ready." })}>
        Info
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          toast({
            tone: "success",
            title: "Lead moved to Not interested",
            action: { label: "Undo", altText: "Change the stage back from the lead profile", onAction: () => {} },
          })
        }
      >
        With undo
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          const id = "job-demo-toast";
          toast({ id, tone: "info", title: "Importing leads", job: IMPORT_RUNNING });
          window.setTimeout(() => {
            toast({
              id,
              tone: "success",
              title: "Import finished: 1,180 created, 20 failed",
              action: { label: "View report", altText: "Open the import from Leads > Imports", onAction: () => {} },
            });
          }, 3000);
        }}
      >
        Job (updates in place)
      </Button>
    </div>
  );
}

export function ToastSpecimens() {
  return (
    <Toaster>
      <div className="flex flex-col gap-4">
        <Specimen label="live" note="Toasts never take focus. F8 moves focus to the region; Esc dismisses the focused toast. Success and info leave after 6 s (paused on hover and focus); errors and toasts with an action stay." stack>
          <ToastButtons />
        </Specimen>
        <StateGrid columns={3}>
          <Specimen label="success (6 s)" surface="bg">
            <StaticPreview>
              <ToastPreview toast={{ tone: "success", title: "Stage changed to Counselling done" }} />
            </StaticPreview>
          </Specimen>
          <Specimen label="error (stays until dismissed)" note="type foreground when caused by the person's own action." surface="bg">
            <StaticPreview>
              <ToastPreview
                toast={{
                  tone: "error",
                  title: "Couldn't send the message",
                  description: "The WhatsApp number isn't connected. An admin can reconnect it in Settings > Channels.",
                  action: { label: "Try again", altText: "", onAction: () => {} },
                }}
              />
            </StaticPreview>
          </Specimen>
          <Specimen label="info (6 s)" surface="bg">
            <StaticPreview>
              <ToastPreview toast={{ tone: "info", title: "Export is being prepared. We'll tell you when it's ready." }} />
            </StaticPreview>
          </Specimen>
          <Specimen label="with action (never dismisses itself)" surface="bg">
            <StaticPreview>
              <ToastPreview toast={{ tone: "success", title: "Lead moved to Not interested", action: { label: "Undo", altText: "", onAction: () => {} } }} />
            </StaticPreview>
          </Specimen>
          <Specimen label="job (stays until the job ends)" surface="bg">
            <StaticPreview>
              <ToastPreview toast={{ tone: "info", title: "Importing leads", job: IMPORT_RUNNING }} />
            </StaticPreview>
          </Specimen>
          <Specimen label="job done (replaced in place)" surface="bg">
            <StaticPreview>
              <ToastPreview toast={{ tone: "success", title: "Import finished: 1,180 created, 20 failed", action: { label: "View report", altText: "", onAction: () => {} } }} />
            </StaticPreview>
          </Specimen>
          <Specimen label="entering, leaving, queued, moved" note="Slides in from the right (fades under reduced motion); leaves on timeout, close, Esc or a swipe right. At most 3 show; the rest wait. While it would cover the focused element the viewport moves to the top right." surface="bg">
            <StaticPreview className="flex flex-col gap-2">
              <ToastPreview toast={{ tone: "success", title: "Message sent to Ananya Rao" }} />
              <ToastPreview toast={{ tone: "success", title: "240 leads reassigned" }} className="opacity-60" />
            </StaticPreview>
          </Specimen>
        </StateGrid>
      </div>
    </Toaster>
  );
}

/* --------------------------------------------------------------------------------------------- Alert */

export function AlertLiveSpecimens() {
  const [polite, setPolite] = useState(false);
  const [assertive, setAssertive] = useState(false);
  const [focusedKey, setFocusedKey] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  return (
    <StateGrid columns={2}>
      <Specimen label="live: polite (role=status)" note="Appears after a change the person made, such as picking a template." stack>
        <Button variant="secondary" size="sm" onClick={() => setPolite((value) => !value)}>
          {polite ? "Pick an approved template" : "Pick the template in review"}
        </Button>
        {polite ? <Alert messageKey="wa_template_review" live="polite" onAction={() => setPolite(false)} /> : null}
      </Specimen>
      <Specimen label="live: assertive (role=alert)" note="An error that appears after submit." stack>
        <Button variant="secondary" size="sm" onClick={() => setAssertive(true)}>
          Submit
        </Button>
        {assertive ? (
          <Alert tone="danger" live="assertive" title="Couldn't save the lead">
            The mobile number belongs to lead #10482, Ananya Rao. Open that lead, or use a different number.
          </Alert>
        ) : null}
      </Specimen>
      <Specimen label="live: focused (a dialog's server error)" note="tabindex=-1; focus moves to it; no live role, so it is read once." stack>
        <Button variant="secondary" size="sm" onClick={() => setFocusedKey((key) => key + 1)}>
          Show the server error
        </Button>
        {focusedKey > 0 ? (
          <Alert key={focusedKey} tone="danger" live="focused" title="Couldn't save the stage">
            The lead was changed by Vikram Shah a moment ago. Reload it to see the latest, then try again.
          </Alert>
        ) : null}
      </Specimen>
      <Specimen label="dismissible advice" note="Only advice that may be ignored; remembered per person and alert key." stack>
        {dismissed ? (
          <Button variant="link" onClick={() => setDismissed(false)}>
            Show the tip again
          </Button>
        ) : (
          <Alert tone="info" title="Tip: save this view" onDismiss={() => setDismissed(true)}>
            Save these filters as a view so your team can open the same list.
          </Alert>
        )}
      </Specimen>
    </StateGrid>
  );
}

/* -------------------------------------------------------------------------------------------- Banner */

export function BannerStackSpecimen() {
  const [hidden, setHidden] = useState<string[]>([]);
  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-bg">
      <BannerStack label="Notices (example)">
        <Banner kind="blocking" messageKey="wa_reconnect" params={{ Institution: "Lakeview College" }} action={<Button variant="secondary" size="sm">Reconnect</Button>} />
        {hidden.includes("dlt") ? null : (
          <Banner
            kind="attention"
            messageKey="dlt_self_cert"
            action={<Button variant="link">How to renew</Button>}
            onDismiss={() => setHidden((current) => [...current, "dlt"])}
          />
        )}
        <Banner kind="info" messageKey="trial_ending" action={<Button variant="link">View plans</Button>} onDismiss={() => {}} />
        <Banner kind="blocking" messageKey="gateway_reconnect" action={<Button variant="secondary" size="sm">Reconnect</Button>} />
      </BannerStack>
      <p className="m-0 px-gutter-sm py-3 text-sm text-muted">The page header and content follow the stack.</p>
    </div>
  );
}

/* ---------------------------------------------------------------------------------- Loading regions */

const LEAD_COLUMNS = [
  { header: "Name" },
  { header: "Stage", pill: true },
  { header: "Owner" },
  { header: "Last engaged", align: "end" as const },
];

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4">
      <Skeleton shape="title" />
      <Skeleton width="90%" />
      <Skeleton width="70%" />
      <div className="mt-2 flex gap-2">
        <Skeleton shape="button" />
        <Skeleton shape="pill" />
      </div>
    </div>
  );
}

export function LoadingRegionSpecimens() {
  const [loading, setLoading] = useState(false);
  const [refetching, setRefetching] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <StateGrid columns={4}>
        <Specimen label="waiting (first 300 ms)" note="Hidden, so fast loads never flash." stack>
          <LoadingRegion loading phase="waiting" thing="follow-ups" skeleton={<CardSkeleton />} className="w-full" />
        </Specimen>
        <Specimen label="shown" note="aria-busy; one polite “Loading follow-ups…”." stack>
          <LoadingRegion loading phase="shown" thing="follow-ups" skeleton={<CardSkeleton />} className="w-full" />
        </Specimen>
        <Specimen label="still loading after 10 s" stack>
          <LoadingRegion loading phase="still-loading" thing="follow-ups" skeleton={<CardSkeleton />} className="w-full" />
        </Specimen>
        <Specimen label="failed after 30 s" note="EmptyState (error) replaces it." stack>
          <LoadingRegion
            loading
            phase="failed"
            thing="follow-ups"
            skeleton={<CardSkeleton />}
            className="w-full"
            timeoutFallback={
              <EmptyState
                size="compact"
                variant="error"
                title={EMPTY_STATE_COPY.error.title}
                body="Check your connection and try again."
                reference="7F3K-21"
                headingLevel={4}
                actions={<Button size="sm">Try again</Button>}
              />
            }
          />
        </Specimen>
      </StateGrid>
      <Specimen label="table: live first load and refetch" note="The header row stays real; 8 rows at the row height. A refetch keeps the rows (not dimmed) under a 2 px bar." stack>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setLoading(true);
              window.setTimeout(() => setLoading(false), 2500);
            }}
          >
            First load
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setRefetching(true);
              window.setTimeout(() => setRefetching(false), 2000);
            }}
          >
            Refetch
          </Button>
        </div>
        <div className="w-full overflow-hidden rounded-lg border border-border bg-surface">
          <LoadingRegion loading={loading} refetching={refetching} thing="leads" skeleton={<SkeletonTable caption="Leads" columns={LEAD_COLUMNS} />}>
            <SkeletonFreeTable />
          </LoadingRegion>
        </div>
      </Specimen>
    </div>
  );
}

function SkeletonFreeTable() {
  const rows = [
    ["Ananya Rao", "Counselling done", "Priya Nair", "5 min ago"],
    ["Arjun Mehta", "Applied", "Vikram Shah", "yesterday"],
    ["ગુરુપ્રસાદ જોશી", "Interested", "Asha Menon", "3 days ago"],
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-table">
        <caption className="sr-only">Leads</caption>
        <thead>
          <tr className="h-row-header border-b border-border">
            {LEAD_COLUMNS.map((column) => (
              <th key={column.header} scope="col" className={`px-3 text-xs font-medium text-muted ${column.align === "end" ? "text-right" : ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="h-row border-b border-border last:border-b-0">
              {row.map((cell, index) => (
                <td key={cell} dir={index === 0 ? "auto" : undefined} className={`px-3 text-fg ${index === 3 ? "text-right text-muted" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------- Jobs */

const JOBS: Record<string, Job> = {
  queued: { id: "j-queued", kind: "export", status: "queued", totals: {}, startedAt: "2:30 pm" },
  running: {
    id: "j-running",
    kind: "lead_import",
    status: "running",
    total: 5000,
    totals: { created: 1100, updated: 120, failed: 20 },
    startedAt: "2:30 pm",
    etaText: "About 2 min left",
  },
  notResponding: { id: "j-stale", kind: "bulk_update", count: 240, status: "running", heartbeatStale: true, total: 240, totals: { updated: 96 }, startedAt: "2:12 pm" },
  done: { id: "j-done", kind: "bulk_stage_change", count: 240, status: "done", total: 240, totals: { requested: 240, updated: 240 }, startedAt: "2:30 pm" },
  doneErrors: {
    id: "j-errors",
    kind: "lead_import",
    status: "done",
    total: 1220,
    totals: { created: 1180, updated: 20, failed: 20 },
    startedAt: "2:30 pm",
  },
  failed: {
    id: "j-failed",
    kind: "lead_import",
    status: "failed",
    total: 1240,
    totals: {},
    startedAt: "2:30 pm",
    failureReason: "The import stopped because the file couldn't be read. Nothing was changed.",
  },
  cancelled: { id: "j-cancelled", kind: "bulk_message", count: 1240, status: "cancelled", total: 1240, totals: { created: 0, updated: 640 }, startedAt: "2:30 pm" },
  cancelling: { id: "j-cancelling", kind: "bulk_message", count: 1240, status: "running", cancelling: true, total: 1240, totals: { updated: 700 }, startedAt: "2:30 pm" },
  exportDone: { id: "j-export", kind: "export", status: "done", totals: {}, startedAt: "2:30 pm" },
};

const actions = {
  onCancel: () => new Promise<void>((resolve) => window.setTimeout(resolve, 600)),
  onRetry: () => {},
  onDownloadErrors: () => {},
  onViewLeads: () => {},
  onDownloadFile: () => {},
};

export function JobProgressSpecimens() {
  return (
    <div className="flex flex-col gap-4">
      <StateGrid columns={2}>
        {(
          [
            ["queued", JOBS.queued],
            ["running (determinate)", JOBS.running],
            ["not responding (no heartbeat for 2 minutes)", JOBS.notResponding],
            ["cancelling", JOBS.cancelling],
            ["done", JOBS.done],
            ["done with errors", JOBS.doneErrors],
            ["failed", JOBS.failed],
            ["cancelled", JOBS.cancelled],
            ["export done (download link)", JOBS.exportDone],
          ] as const
        ).map(([label, job]) => (
          <Specimen key={label} label={`inline: ${label}`} stack>
            <JobProgress job={job} announce={false} {...actions} className="w-full" />
          </Specimen>
        ))}
      </StateGrid>
      <StateGrid columns={3}>
        <Specimen label="tray item: running" surface="bg" stack>
          <div className="w-full rounded-lg border border-border bg-surface-raised p-3 shadow-pop">
            <JobProgress job={JOBS.running} variant="tray" announce={false} />
          </div>
        </Specimen>
        <Specimen label="tray item: done with errors" surface="bg" stack>
          <div className="w-full rounded-lg border border-border bg-surface-raised p-3 shadow-pop">
            <JobProgress job={JOBS.doneErrors} variant="tray" announce={false} {...actions} />
          </div>
        </Specimen>
        <Specimen label="toast form" surface="bg" stack>
          <StaticPreview>
            <ToastPreview toast={{ tone: "info", title: "Importing leads", job: JOBS.running }} />
          </StaticPreview>
        </Specimen>
      </StateGrid>
      <StateGrid columns={2}>
        <Specimen label="JobTray: collapsed" note="Drawn in place here; in the app it is fixed bottom-right. Hover, focus inside or “Show task details” expands it." surface="bg" stack>
          <JobTray inline jobs={[JOBS.running, JOBS.doneErrors]} actionsFor={() => actions} onHide={() => {}} />
        </Specimen>
        <Specimen label="JobTray: expanded, more than 3" note="Up to 3 items, then “2 more”. Esc or “Hide task details” collapses it." surface="bg" stack>
          <JobTray inline defaultExpanded jobs={[JOBS.running, JOBS.doneErrors, JOBS.notResponding, JOBS.queued, JOBS.cancelled]} actionsFor={() => actions} onHide={() => {}} />
        </Specimen>
      </StateGrid>
    </div>
  );
}

/* ----------------------------------------------------------------------------------------- Spinner */

export function SpinnerSpecimens() {
  return (
    <StateGrid columns={4}>
      <Specimen label="xs 16 px, sm 20 px, md 24 px" note="Hidden for the first 300 ms of a wait.">
        <Spinner size="xs" delay={0} standalone />
        <Spinner size="sm" delay={0} standalone />
        <Spinner size="md" delay={0} standalone />
      </Specimen>
      <Specimen label="with label">
        <Spinner size="xs" delay={0} label="Saving…" />
        <Spinner size="xs" delay={0} label="Checking payment status…" />
      </Specimen>
      <Specimen label="inline (inside a control)" note="The control's own loading text is the announcement.">
        <Button variant="primary" size="sm" loading loadingLabel="Saving…">
          Save changes
        </Button>
      </Specimen>
      <Specimen label="standalone (popover body)" note="role=status with the visible label, or sr-only “Loading”." surface="surface-raised">
        <Spinner size="sm" delay={0} standalone label="Loading…" />
      </Specimen>
    </StateGrid>
  );
}
