import { Megaphone } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback/alert";
import { Banner } from "@/components/ui/feedback/banner";
import { EmptyState } from "@/components/ui/feedback/empty-state";
import { EMPTY_STATE_COPY, EMPTY_STATE_COPY_KEYS, type EmptyStateCopy } from "@/components/ui/feedback/empty-state-copy";
import { COMPLIANCE_MESSAGES, COMPLIANCE_MESSAGE_KEYS, type ComplianceMessage, type MessageParams } from "@/components/ui/feedback/messages";
import { ProgressBar } from "@/components/ui/feedback/progress-bar";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { SkeletonTable } from "@/components/ui/feedback/skeleton-table";
import { GalleryPage, Section, Specimen, StateGrid } from "../_gallery";
import { KeyboardNotes } from "../shell/_kit/keyboard-notes";
import {
  AlertLiveSpecimens,
  BannerStackSpecimen,
  JobProgressSpecimens,
  LoadingRegionSpecimens,
  SpinnerSpecimens,
  ToastSpecimens,
} from "./_parts/feedback-live";

export const metadata: Metadata = { title: "Feedback" };

const PARAMS: MessageParams = {
  lead: "Ananya",
  Institution: "Lakeview College",
  reason: "the sample values for the variables are missing",
  date: "20 Oct 2026",
};

function EmptyActions({ copy, size }: { copy: EmptyStateCopy; size: "page" | "section" | "compact" }) {
  if (copy.actions.length === 0) return null;
  return (
    <>
      {copy.actions.map((action) =>
        action.kind === "link" ? (
          <Button key={action.label} variant="link">
            {action.label}
          </Button>
        ) : (
          <Button key={action.label} variant={action.kind} size={size === "page" ? "md" : "sm"}>
            {action.label}
          </Button>
        ),
      )}
    </>
  );
}

export default function Page() {
  return (
    <GalleryPage
      title="Feedback"
      description="Toasts, alerts, banners, empty states, loading and progress (components.md, group 2: Feedback), with the full compliance-message catalogue and the empty-state copy for every place."
    >
      <div className="max-w-form rounded-lg border border-border bg-surface p-4 text-sm leading-prose text-muted">
        <p className="m-0 font-semibold text-fg">Which message to use</p>
        <ul className="m-0 mt-1 list-disc pl-5">
          <li>Toast: the result of something the person just did, or a background job finishing. Never the only record.</li>
          <li>Alert: a message about one part of a page, form, dialog or panel. Stays until its cause goes.</li>
          <li>Banner: a condition that affects the whole institution or session. Sits above the page header.</li>
          <li>EmptyState: a region has nothing to show, and why. Field errors belong to Field, never to toasts.</li>
        </ul>
      </div>

      <Section id="toast" title="Toast" description="Confirms the result of an action, or reports a background job, without moving focus or blocking work. Not used on public pages.">
        <ToastSpecimens />
        <KeyboardNotes
          items={[
            ["F8", "Moves focus to the toast region (“Updates (F8)”); F8 again or Shift+Tab returns."],
            ["Tab", "Moves through actions and close buttons."],
            ["Esc", "Dismisses the focused toast. A swipe right dismisses on touch."],
          ]}
        />
      </Section>

      <Section id="alert" title="Alert" description="A message about one region that stays until its cause is gone. Tone is in the icon and the words, never colour alone.">
        <StateGrid columns={2}>
          <Specimen label="info" stack>
            <Alert tone="info" title="Promotional messages wait for 9:00 am IST">
              They&apos;re held during quiet hours. Service messages go now.
            </Alert>
          </Specimen>
          <Specimen label="success" stack>
            <Alert tone="success" title="Domain verified">
              Bulk email from admissions.lakeview.edu.in can start now.
            </Alert>
          </Specimen>
          <Specimen label="warning" stack>
            <Alert
              tone="warning"
              title="38 of 250 leads will be skipped"
              actions={
                <Button variant="secondary" size="sm">
                  Download the list
                </Button>
              }
            >
              They have no telco-registered consent for promotional or explicit-consent SMS, and their enquiries are more than 7 days old.
            </Alert>
          </Specimen>
          <Specimen label="danger" stack>
            <Alert tone="danger" title="Meta rejected this template" actions={<Button variant="link">Edit template</Button>}>
              Reason given: the sample values for the variables are missing. Edit it and submit again, or appeal.
            </Alert>
          </Specimen>
          <Specimen label="neutral (the topic's icon, on surface-subtle)" stack>
            <Alert messageKey="lead_merged" actions={<Button variant="secondary" size="sm">Open Ananya Rao</Button>} />
          </Specimen>
          <Specimen label="compact (table toolbars, narrow panels)" stack>
            <Alert messageKey="contacts_masked" layout="compact" />
          </Specimen>
          <Specimen label="body with a secondary sentence" stack>
            <Alert tone="warning" title="Another follow-up at this time">
              Asha already has a follow-up at 4:30 pm IST on 07 Oct. <span className="text-muted">You can still save.</span>
            </Alert>
          </Specimen>
          <Specimen label="action running" stack>
            <Alert
              messageKey="minor_pending"
              params={PARAMS}
              actions={
                <Button variant="secondary" size="sm" loading loadingLabel="Sending…">
                  Resend consent request
                </Button>
              }
            />
          </Specimen>
        </StateGrid>
        <AlertLiveSpecimens />
        <Section id="compliance-messages" level={3} title="Compliance and condition messages" description="The whole catalogue, as Alerts (A) and Banners (B), with {lead} = Ananya and {Institution} = Lakeview College.">
          <div className="flex flex-col gap-3">
            {COMPLIANCE_MESSAGE_KEYS.map((key) => {
              const message: ComplianceMessage = COMPLIANCE_MESSAGES[key];
              const action = message.action;
              const actionButton = action ? (
                <Button variant="secondary" size="sm" className="h-auto min-h-control-sm py-1 text-left whitespace-normal">
                  {action.label}
                </Button>
              ) : undefined;
              return (
                <Specimen
                  key={key}
                  label={`${key} · ${message.where.map((where) => (where === "alert" ? "A" : "B")).join(" + ")}`}
                  note={`${message.shownOn}${action?.audience ? ` · action for ${action.audience}` : ""}`}
                  stack
                  surface="bg"
                >
                  {message.where.includes("alert") ? <Alert messageKey={key} params={PARAMS} actions={actionButton} className="w-full" /> : null}
                  {message.where.includes("banner") ? (
                    <div className="w-full overflow-hidden rounded-md border border-border">
                      <Banner messageKey={key} params={PARAMS} kind={message.tone === "danger" ? "blocking" : message.tone === "info" ? "info" : "attention"} action={actionButton} />
                    </div>
                  ) : null}
                </Specimen>
              );
            })}
          </div>
        </Section>
        <KeyboardNotes
          items={[
            ["Tab", "Actions and links are in the normal order."],
            ["Error summary", "Receives focus when it appears (tabindex=-1); each link moves focus to its field."],
          ]}
        />
      </Section>

      <Section id="banner" title="Banner" description="A condition that affects the whole institution or session, at the top of every page until it is fixed. Not sticky; it scrolls away with the page.">
        <StateGrid columns={2}>
          <Specimen label="blocking (danger, not dismissible)" stack surface="bg">
            <div className="w-full overflow-hidden rounded-md border border-border">
              <Banner kind="blocking" messageKey="org_suspended" params={PARAMS} />
            </div>
          </Specimen>
          <Specimen label="attention (warning, hidden for 24 hours)" stack surface="bg">
            <div className="w-full overflow-hidden rounded-md border border-border">
              <Banner kind="attention" messageKey="gateway_test" />
            </div>
          </Specimen>
          <Specimen label="info (hidden until the cause changes)" stack surface="bg">
            <div className="w-full overflow-hidden rounded-md border border-border">
              <Banner kind="info" messageKey="support_access" params={PARAMS} />
            </div>
          </Specimen>
          <Specimen label="session (offline, new version: goes when resolved)" stack surface="bg">
            <div className="w-full overflow-hidden rounded-md border border-border">
              <Banner kind="session" messageKey="new_version" action={<Button variant="secondary" size="sm">Reload</Button>} />
            </div>
          </Specimen>
          <Specimen label="success tone" stack surface="bg">
            <div className="w-full overflow-hidden rounded-md border border-border">
              <Banner kind="info" tone="success" title="WhatsApp is reconnected">
                Messages that were waiting are sending now.
              </Banner>
            </div>
          </Specimen>
          <Specimen label="action running" stack surface="bg">
            <div className="w-full overflow-hidden rounded-md border border-border">
              <Banner
                kind="blocking"
                messageKey="gateway_reconnect"
                action={
                  <Button variant="secondary" size="sm" loading loadingLabel="Reconnecting…">
                    Reconnect
                  </Button>
                }
              />
            </div>
          </Specimen>
        </StateGrid>
        <Specimen label="stack: more than 2 banners" note="The first 2 show, then “2 more notices” expands the stack. The dismiss button reads “Hide this notice for today”." stack>
          <BannerStackSpecimen />
        </Specimen>
        <KeyboardNotes items={[["Tab order", "Banners come after the header and sidebar and before main; the SkipLink goes past them."]]} />
      </Section>

      <Section id="empty-state" title="EmptyState" description="Why a region has nothing to show, and the next step. Titles state the state in plain words; the action is a verb plus object.">
        <StateGrid columns={3}>
          <Specimen label="first-use · page" surface="bg">
            <EmptyState
              variant="first-use"
              icon={EMPTY_STATE_COPY.leads.icon}
              title={EMPTY_STATE_COPY.leads.title}
              body={EMPTY_STATE_COPY.leads.body}
              actions={<EmptyActions copy={EMPTY_STATE_COPY.leads} size="page" />}
            />
          </Specimen>
          <Specimen label="no-results · section">
            <EmptyState size="section" variant="no-results" icon={EMPTY_STATE_COPY.leadsFiltered.icon} title={EMPTY_STATE_COPY.leadsFiltered.title} body={EMPTY_STATE_COPY.leadsFiltered.body} headingLevel={3} actions={<EmptyActions copy={EMPTY_STATE_COPY.leadsFiltered} size="section" />} />
          </Specimen>
          <Specimen label="cleared · section">
            <EmptyState size="section" variant="cleared" icon={EMPTY_STATE_COPY.myDay.icon} title={EMPTY_STATE_COPY.myDay.title} body={EMPTY_STATE_COPY.myDay.body} headingLevel={3} actions={<EmptyActions copy={EMPTY_STATE_COPY.myDay} size="section" />} />
          </Specimen>
          <Specimen label="needs-setup · section" note="Admins get the action; others are told who to ask.">
            <EmptyState size="section" variant="needs-setup" icon={EMPTY_STATE_COPY.inboxNoNumber.icon} title={EMPTY_STATE_COPY.inboxNoNumber.title} body={EMPTY_STATE_COPY.inboxNoNumber.body} headingLevel={3} actions={<EmptyActions copy={EMPTY_STATE_COPY.inboxNoNumber} size="section" />} />
          </Specimen>
          <Specimen label="no-permission · page" surface="bg">
            <EmptyState variant="no-permission" icon={EMPTY_STATE_COPY.noPermission.icon} title={EMPTY_STATE_COPY.noPermission.title} body={EMPTY_STATE_COPY.noPermission.body.replace("{Institution}", "Lakeview College")} actions={<EmptyActions copy={EMPTY_STATE_COPY.noPermission} size="page" />} />
          </Specimen>
          <Specimen label="error · page" note="A reference code line." surface="bg">
            <EmptyState variant="error" icon={EMPTY_STATE_COPY.error.icon} title={EMPTY_STATE_COPY.error.title} body={EMPTY_STATE_COPY.error.body} reference="7F3K-21" actions={<EmptyActions copy={EMPTY_STATE_COPY.error} size="page" />} />
          </Specimen>
          <Specimen label="compact (popover, table body, small panel)" note="No icon; title and one action at most." surface="surface-raised">
            <EmptyState size="compact" variant="no-results" title={EMPTY_STATE_COPY.popoverList.title} headingLevel={3} actions={<Button variant="link">Clear search</Button>} />
          </Specimen>
          <Specimen label="action running">
            <EmptyState size="section" variant="first-use" icon={Megaphone} title={EMPTY_STATE_COPY.broadcasts.title} body={EMPTY_STATE_COPY.broadcasts.body} headingLevel={3} actions={<Button size="sm" loading loadingLabel="Opening…">New broadcast</Button>} />
          </Specimen>
          <Specimen label="retrying" note="“Try again” loads, then content or the error again with a new reference.">
            <EmptyState size="section" variant="error" icon={EMPTY_STATE_COPY.error.icon} title={EMPTY_STATE_COPY.error.title} body={EMPTY_STATE_COPY.error.body} reference="8LM4-02" headingLevel={3} actions={<Button size="sm" loading loadingLabel="Trying again…">Try again</Button>} />
          </Specimen>
        </StateGrid>
        <Section id="empty-state-copy" level={3} title="Empty-state copy" description="Every place's copy, drawn at section size (compact for the popover list).">
          <StateGrid columns={3}>
            {EMPTY_STATE_COPY_KEYS.map((key) => {
              const copy: EmptyStateCopy = EMPTY_STATE_COPY[key];
              const size = copy.icon ? "section" : "compact";
              return (
                <Specimen key={key} label={`${copy.place} · ${copy.variant}`}>
                  <EmptyState
                    size={size}
                    variant={copy.variant}
                    icon={copy.icon ?? undefined}
                    title={copy.title}
                    body={copy.body ? copy.body.replace("{Institution}", "Lakeview College") : undefined}
                    reference={copy.reference}
                    headingLevel={4}
                    actions={<EmptyActions copy={copy} size={size} />}
                  />
                </Specimen>
              );
            })}
          </StateGrid>
        </Section>
        <KeyboardNotes items={[["Tab", "Actions in normal order. When an empty state replaces content after a filter change, focus stays on the control that changed."]]} />
      </Section>

      <Section id="skeleton" title="Skeleton" description="A placeholder in the shape of content loading for the first time. Decorative and aria-hidden; the region is aria-busy and says “Loading {thing}…” once.">
        <StateGrid columns={4}>
          <Specimen label="line (40% to 90%)" stack>
            <Skeleton width="90%" className="w-full" />
            <Skeleton width="70%" />
            <Skeleton width="40%" />
          </Specimen>
          <Specimen label="title, pill, button" stack>
            <Skeleton shape="title" />
            <Skeleton shape="pill" />
            <Skeleton shape="button" />
          </Specimen>
          <Specimen label="circle (avatar sizes)">
            <Skeleton shape="circle" size="sm" />
            <Skeleton shape="circle" size="md" />
            <Skeleton shape="circle" size="lg" />
          </Specimen>
          <Specimen label="tile and card" stack>
            <Skeleton shape="tile" />
            <Skeleton shape="card" className="h-16" />
          </Specimen>
        </StateGrid>
        <Specimen label="table (header real, 8 rows at h-row)" stack>
          <div className="w-full overflow-hidden rounded-lg border border-border bg-surface">
            <SkeletonTable caption="Payments" columns={[{ header: "Lead" }, { header: "Amount", align: "end" }, { header: "Status", pill: true }, { header: "Paid at" }]} />
          </div>
        </Specimen>
        <LoadingRegionSpecimens />
        <Section id="loading-rules" level={3} title="Loading rules">
          <ol className="m-0 flex max-w-form flex-col gap-1 pl-5 text-sm leading-prose text-fg">
            <li>First load shows the region&apos;s Skeleton after 300 ms. Never a full-page spinner, never a spinner and a skeleton together.</li>
            <li>Refetching keeps the content, sets aria-busy and shows a 2 px bar along the region&apos;s top. Content is not dimmed.</li>
            <li>A pressed button shows its own loading state. Inline saves show a Spinner and “Saving…”, then “Saved” for 2 s.</li>
            <li>Toggles update at once and revert with an inline error if the save fails.</li>
            <li>Long jobs never block the screen: they become JobProgress.</li>
            <li>After 10 s a region adds “Still loading…”; after 30 s it shows EmptyState (error) with “Try again”.</li>
            <li>One region failing never blanks the page.</li>
            <li>Announce once: “Loading leads…”, then the result through the list&apos;s status line.</li>
            <li>Reduced motion: skeletons are static; spinners become a static icon with visible “Loading…”.</li>
          </ol>
        </Section>
      </Section>

      <Section id="progress-bar" title="ProgressBar" description="How far a task has got, or that it is running, with the value also in words. Not focusable; not a live region.">
        <StateGrid columns={3}>
          <Specimen label="0%" stack>
            <ProgressBar label="Importing rows" value={0} max={5000} valueText="0 of 5,000" valueLabel="0 of 5,000 rows, 0%" className="w-full" />
          </Specimen>
          <Specimen label="in progress, with helper" stack>
            <ProgressBar label="Importing rows" value={1240} max={5000} valueText="1,240 of 5,000" valueLabel="1,240 of 5,000 rows, 25%" helper="About 2 min left" className="w-full" />
          </Specimen>
          <Specimen label="complete" note="The parent replaces it with the result within 1 s." stack>
            <ProgressBar label="Sending" value={1240} max={1240} valueText="1,240 of 1,240" className="w-full" />
          </Specimen>
          <Specimen label="indeterminate" note="Under reduced motion a static third at the start; the label carries the meaning." stack>
            <ProgressBar label="Preparing export" value={null} valueText="Working…" helper="Large exports can take a few minutes." className="w-full" />
          </Specimen>
          <Specimen label="paused" stack>
            <ProgressBar label="Sending" value={496} max={1240} paused className="w-full" />
          </Specimen>
          <Specimen label="failed" note="The bar stays at its last value in the accent colour; the parent's pill and message say it failed." stack>
            <ProgressBar label="Importing rows" value={640} max={1240} valueText="640 of 1,240" className="w-full" />
          </Specimen>
          <Specimen label="sm (4 px), in the tray" stack>
            <ProgressBar label="Sending to 240 leads" hideLabel size="sm" value={96} max={240} className="w-full" />
          </Specimen>
          <Specimen label="route and region loading (2 px)" stack>
            <ProgressBar label="Loading page" hideLabel size="sm" value={null} className="w-full" trackClassName="h-0.5 rounded-none" />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="job-progress" title="JobProgress" description="A long-running import, bulk action or export from start to finish, with counts, errors and a way to stop it, while people keep working.">
        <JobProgressSpecimens />
        <KeyboardNotes
          items={[
            ["Tab", "Cancel, result actions and tray controls are buttons and links in normal order."],
            ["Tray", "Comes after main in the Tab order; Esc collapses it."],
          ]}
        />
      </Section>

      <Section id="spinner" title="Spinner" description="A small “working” sign for short waits inside a control or line. Becomes a static icon under reduced motion.">
        <SpinnerSpecimens />
      </Section>
    </GalleryPage>
  );
}
