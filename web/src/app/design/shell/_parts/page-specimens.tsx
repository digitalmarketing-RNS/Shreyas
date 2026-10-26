"use client";

import { ArrowRightLeft, CalendarPlus, Download, FileUp, GitMerge, Pencil, Plus, Send, Trash2, TriangleAlert } from "lucide-react";
import { type ReactNode, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { DescriptionList } from "@/components/ui/display/description-list";
import { StatusPill } from "@/components/ui/display/status-pill";
import { Alert } from "@/components/ui/feedback/alert";
import { EmptyState } from "@/components/ui/feedback/empty-state";
import { EMPTY_STATE_COPY } from "@/components/ui/feedback/empty-state-copy";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { Breadcrumbs } from "@/components/ui/shell/breadcrumbs";
import { PageHeader } from "@/components/ui/shell/page-header";
import { Pagination } from "@/components/ui/shell/pagination";
import { type TabItem, Tabs } from "@/components/ui/shell/tabs";
import { cn } from "@/lib/cn";
import { SIMULATED_NOTE, Specimen, StateGrid, simulatedFocus } from "../../_gallery";
import { StaticPreview } from "../_kit/static-preview";

const noop = () => {};

const LEAD_TABS: TabItem[] = [
  { value: "details", label: "Details" },
  { value: "timeline", label: "Timeline" },
  { value: "follow-ups", label: "Follow-ups", count: 2 },
  { value: "notes", label: "Notes", count: 3 },
  { value: "messages", label: "Messages", count: 14 },
  { value: "calls", label: "Calls" },
  { value: "documents", label: "Documents" },
  { value: "tickets", label: "Tickets" },
  { value: "opportunities", label: "Opportunities", count: 1 },
  { value: "payments", label: "Payments", attention: true },
];

const LEAD_BREADCRUMBS = [{ label: "Leads", href: "/leads" }, { label: "Ananya Rao", userEntered: true }];

export function PageHeaderSpecimens() {
  return (
    <div className="flex flex-col gap-4">
      <Specimen label="list (S05)" note="Title, record count, actions: secondary first, the primary last. Below md only the primary stays; the rest move into More actions." surface="bg" stack>
        <PageHeader
          headingLevel={3}
          title="Leads"
          count="12,480"
          primary={{ id: "add", label: "Add lead", icon: <Plus />, onSelect: noop }}
          secondary={[
            { id: "import", label: "Import", icon: <FileUp />, onSelect: noop },
            { id: "export", label: "Export", icon: <Download />, onSelect: noop },
          ]}
          className="w-full"
        />
      </Specimen>
      <Specimen label="detail (S08)" note="Breadcrumbs, the record name (text-xl, wraps, dir=auto), StatusPill, meta row, actions and page tabs." surface="bg" stack>
        <PageHeader
          variant="detail"
          headingLevel={3}
          breadcrumbs={<Breadcrumbs items={LEAD_BREADCRUMBS} onNavigate={noop} />}
          title="Ananya Rao"
          status={<StatusPill domain="leads.untouched" value="true" />}
          meta={["Lead #10482", "Created 03 Oct 2026", "Owner Priya Nair"]}
          primary={{ id: "message", label: "Send message", icon: <Send />, onSelect: noop }}
          secondary={[
            { id: "stage", label: "Change stage", icon: <ArrowRightLeft />, onSelect: noop },
            { id: "follow", label: "Add follow-up", icon: <CalendarPlus />, onSelect: noop },
          ]}
          more={[
            { id: "merge", label: "Merge duplicate", icon: <GitMerge />, onSelect: noop },
            { id: "delete", label: "Delete lead", icon: <Trash2 />, destructive: true, onSelect: noop },
          ]}
          tabs={<Tabs items={LEAD_TABS} label="Lead sections" activation="manual" renderPanel={(value) => <TabPanelText value={value} />} />}
          className="w-full"
        />
      </Specimen>
      <Specimen label="settings (S28)" surface="bg" stack>
        <PageHeader
          variant="settings"
          headingLevel={3}
          breadcrumbs={<Breadcrumbs items={[{ label: "Settings", href: "/settings" }, { label: "Lead fields" }]} onNavigate={noop} />}
          title="Lead fields"
          description="Fields you can add to every lead, with their type and rules."
          primary={{ id: "add-field", label: "Add field", icon: <Plus />, onSelect: noop }}
          className="w-full"
        />
      </Specimen>
      <StateGrid columns={3}>
        <Specimen label="builder: saved" note="Sticky under the header in the app (drawn in place here)." stack>
          <PageHeader variant="builder" sticky={false} headingLevel={3} title="New enquiry welcome" saveState="saved" primary={{ id: "publish", label: "Publish", onSelect: noop }} className="w-full" />
        </Specimen>
        <Specimen label="builder: saving" stack>
          <PageHeader variant="builder" sticky={false} headingLevel={3} title="New enquiry welcome" saveState="saving" primary={{ id: "publish", label: "Publish", onSelect: noop }} className="w-full" />
        </Specimen>
        <Specimen label="builder: unsaved" note="“Unsaved changes” in text-warning with an icon." stack>
          <PageHeader variant="builder" sticky={false} headingLevel={3} title="New enquiry welcome" saveState="unsaved" primary={{ id: "publish", label: "Publish", onSelect: noop }} className="w-full" />
        </Specimen>
        <Specimen label="loading" note="Title and button Skeletons of the same sizes." surface="bg" stack>
          <PageHeader headingLevel={3} title="Leads" loading className="w-full" />
        </Specimen>
        <Specimen label="read-only (merged or on hold)" note="A neutral “Read-only” pill; changing actions are aria-disabled with a reason." surface="bg" stack>
          <PageHeader
            variant="detail"
            headingLevel={3}
            title="Ananya R."
            readOnly
            meta={["Lead #10377", "Merged into lead #10482"]}
            primary={{ id: "edit", label: "Edit lead", icon: <Pencil />, disabledReason: "This record was merged and can't be edited." }}
            className="w-full"
          />
        </Specimen>
        <Specimen label="long user-entered name" note="Wraps; never truncated on the h1." surface="bg" stack>
          <PageHeader variant="detail" headingLevel={3} title="ശ്രീലക്ഷ്മി പ്രഭാകരൻ നായർ കൊച്ചുപറമ്പിൽ" meta={["Lead #10466"]} className="w-full" />
        </Specimen>
      </StateGrid>
    </div>
  );
}

function TabPanelText({ value }: { value: string }) {
  if (value === "notes") {
    const copy = EMPTY_STATE_COPY.notes;
    return <EmptyState size="section" icon={copy.icon} title={copy.title} body={copy.body} headingLevel={4} actions={<Button size="sm">Add note</Button>} />;
  }
  if (value === "details") {
    return (
      <DescriptionList
        items={[
          { label: "Course", value: "B.Tech Computer Science" },
          { label: "City", value: "Pune" },
          { label: "Source", value: "Website form" },
        ]}
      />
    );
  }
  return <p className="m-0 text-sm text-muted">{`The ${value} panel loads when its tab is chosen.`}</p>;
}

export function BreadcrumbSpecimens() {
  return (
    <StateGrid columns={2}>
      <Specimen label="full (md and up)" note="Ancestors link; the current page is text with aria-current=&quot;page&quot;." stack>
        <Breadcrumbs form="full" items={[{ label: "Settings", href: "/settings" }, { label: "Channels", href: "/settings/channels" }, { label: "WhatsApp" }]} onNavigate={noop} />
        <Breadcrumbs form="full" items={[{ label: "Automations", href: "/automations" }, { label: "New enquiry welcome" }]} onNavigate={noop} />
      </Specimen>
      <Specimen label="collapsed middle (more than 4 levels)" note="The Ellipsis button opens a menu: “Show 2 more levels”." stack>
        <Breadcrumbs
          form="full"
          items={[
            { label: "Settings", href: "/settings" },
            { label: "Teams", href: "/settings/teams" },
            { label: "Pune campus", href: "/settings/teams/pune" },
            { label: "Admissions", href: "/settings/teams/pune/admissions" },
            { label: "Evening counsellors" },
          ]}
          onNavigate={noop}
        />
      </Specimen>
      <Specimen label="long label (truncates at 192 px, full name in a Tooltip)" stack>
        <Breadcrumbs
          form="full"
          items={[
            { label: "Opportunities", href: "/opportunities" },
            { label: "MBA 2027 intake, Pune and Nagpur campuses", href: "/opportunities/mba-2027" },
            { label: "Ananya Rao", userEntered: true },
          ]}
          onNavigate={noop}
        />
      </Specimen>
      <Specimen label="back link (below md)" note="Only the parent, with sr-only “Back to ”." stack>
        <Breadcrumbs form="back" items={LEAD_BREADCRUMBS} onNavigate={noop} />
      </Specimen>
      <Specimen label="hover and focus-visible" note={SIMULATED_NOTE} stack>
        <StaticPreview className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-fg underline underline-offset-2">Leads</span>
          <span className={cn("rounded-sm text-muted", simulatedFocus)}>Leads</span>
        </StaticPreview>
      </Specimen>
    </StateGrid>
  );
}

const PANEL_TABS: TabItem[] = [
  { value: "keys", label: "API keys", count: 2 },
  { value: "webhooks", label: "Webhooks" },
  { value: "lead-ads", label: "Lead ads", disabledReason: "Connect Meta or Google first." },
];

export function TabsSpecimens() {
  const [loadingPanel, setLoadingPanel] = useState("timeline");
  return (
    <div className="flex flex-col gap-4">
      <Specimen label="page tabs (md), manual activation, with overflow" note="S08's ten tabs: the ones that don't fit move into “More”. Arrow keys move; Enter or Space opens the focused tab." stack>
        <div className="w-full">
          <Tabs items={LEAD_TABS} label="Lead sections" activation="manual" renderPanel={(value) => <TabPanelText value={value} />} />
        </div>
      </Specimen>
      <StateGrid columns={2}>
        <Specimen label="panel tabs (sm), automatic activation" note="Inside a card; panels already in memory open as focus moves. A tab that must show but cannot open is aria-disabled with a tooltip." stack>
          <div className="w-full rounded-lg border border-border bg-surface p-3">
            <Tabs items={PANEL_TABS} label="Integrations and API" size="sm" renderPanel={(value) => <TabPanelText value={value} />} />
          </div>
        </Specimen>
        <Specimen label="URL-synced (?tab=)" note="router.replace keeps the tab in the URL without a history entry per switch." stack>
          <div className="w-full">
            <Suspense fallback={<Skeleton width="60%" />}>
              <Tabs
                items={LEAD_TABS.slice(0, 4)}
                label="Lead sections (URL-synced)"
                syncParam="tab"
                renderPanel={(value) => <TabPanelText value={value} />}
              />
            </Suspense>
          </div>
        </Specimen>
        <Specimen label="loading panel and panel error" note="The panel shows its Skeleton or EmptyState (error); the tabs stay usable." stack>
          <div className="w-full">
            <Tabs
              items={[
                { value: "timeline", label: "Timeline" },
                { value: "calls", label: "Calls" },
              ]}
              value={loadingPanel}
              onValueChange={setLoadingPanel}
              label="Lead sections (loading example)"
              renderPanel={(value) =>
                value === "timeline" ? (
                  <div aria-busy="true" className="flex flex-col gap-2">
                    <Skeleton width="80%" />
                    <Skeleton width="60%" />
                    <Skeleton width="70%" />
                  </div>
                ) : (
                  <EmptyState
                    size="section"
                    variant="error"
                    icon={EMPTY_STATE_COPY.error.icon}
                    title={EMPTY_STATE_COPY.error.title}
                    body={EMPTY_STATE_COPY.error.body}
                    reference="9QW2-04"
                    headingLevel={4}
                    actions={
                      <Button variant="secondary" size="sm">
                        Try again
                      </Button>
                    }
                  />
                )
              }
            />
          </div>
        </Specimen>
        <Specimen label="tab states" note={`${SIMULATED_NOTE}: inactive, hover, active (2 px bar and text colour), focus-visible (inset), with count, needs attention.`} stack>
          <StaticPreview className="flex flex-wrap items-end gap-1 border-b border-border">
            <TabDraw label="Details" />
            <TabDraw label="Timeline" className="bg-surface-hover text-fg" />
            <TabDraw label="Notes" count={3} active />
            <TabDraw label="Calls" className="outline-2 -outline-offset-2 outline-focus-ring outline-solid" />
            <TabDraw label="Payments" attention />
          </StaticPreview>
        </Specimen>
      </StateGrid>
    </div>
  );
}

function TabDraw({ label, active = false, count, attention = false, className }: { label: string; active?: boolean; count?: number; attention?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-control-md min-w-12 items-center justify-center gap-2 rounded-t-md px-3 text-sm font-medium",
        active ? "text-fg after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-accent after:content-['']" : "text-muted",
        className,
      )}
    >
      {label}
      {count ? (
        <span className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-pill px-1.5 text-xs text-fg", active ? "bg-accent-subtle" : "bg-surface-sunken")}>
          {count}
        </span>
      ) : null}
      {attention ? <TriangleAlert aria-hidden="true" className="size-icon-sm text-warning" /> : null}
    </span>
  );
}

export function PaginationSpecimens() {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const [loading, setLoading] = useState<"next" | "previous" | "first" | null>(null);
  const total = 12480;
  const lastPage = Math.ceil(total / size);
  const go = (target: number, which: "next" | "previous" | "first") => {
    setLoading(which);
    window.setTimeout(() => {
      setPage(target);
      setLoading(null);
    }, 600);
  };
  const [more, setMore] = useState<"idle" | "loading" | "done" | "error">("idle");

  return (
    <div className="flex flex-col gap-4">
      <Specimen label="pager, live" note="First page and Previous page are aria-disabled on page 1; focus stays on the pressed button. Changing rows per page goes back to the first page." stack>
        <div className="w-full overflow-hidden rounded-lg border border-border">
          <Pagination
            listName="leads"
            from={(page - 1) * size + 1}
            to={Math.min(page * size, total)}
            total={total}
            pageSize={size}
            onPageSizeChange={(next) => {
              setSize(next);
              setPage(1);
            }}
            isFirst={page === 1}
            isLast={page === lastPage}
            loading={loading}
            onFirst={() => go(1, "first")}
            onPrevious={() => go(Math.max(1, page - 1), "previous")}
            onNext={() => go(Math.min(lastPage, page + 1), "next")}
          />
        </div>
      </Specimen>
      <StateGrid columns={2}>
        <Specimen label="middle page" stack>
          <Frame>
            <Pagination listName="leads" from={26} to={50} total={12480} pageSize={25} isFirst={false} isLast={false} />
          </Frame>
        </Specimen>
        <Specimen label="last page" stack>
          <Frame>
            <Pagination listName="leads" from={12476} to={12480} total={12480} pageSize={25} isFirst={false} isLast />
          </Frame>
        </Specimen>
        <Specimen label="loading next page" note="The pressed button loads; the rows stay; a 2 px bar runs along the table top." stack>
          <Frame>
            <Pagination listName="leads" from={26} to={50} total={12480} pageSize={25} isFirst={false} isLast={false} loading="next" />
          </Frame>
        </Specimen>
        <Specimen label="count unknown" note="The range shows without a total until the count returns." stack>
          <Frame>
            <Pagination listName="leads" from={1} to={25} total={null} pageSize={25} isFirst isLast={false} />
          </Frame>
        </Specimen>
        <Specimen label="count capped" note="Counted up to 10,001 rows: “of 10,000+”." stack>
          <Frame>
            <Pagination listName="leads" from={1} to={25} total={10001} capped pageSize={25} isFirst isLast={false} />
          </Frame>
        </Specimen>
        <Specimen label="single page" note="The range and the select stay; every button is aria-disabled." stack>
          <Frame>
            <Pagination listName="payments" from={1} to={7} total={7} pageSize={25} isFirst isLast />
          </Frame>
        </Specimen>
        <Specimen label="compact (narrow containers)" stack>
          <Pagination variant="compact" listName="recipients" from={51} to={75} total={1240} pageSize={25} isFirst={false} isLast={false} />
        </Specimen>
        <Specimen label="combined (S05, S26)" note="The right part of the footer bar, with BulkActionBar (group 3) on the left; below lg it wraps." stack>
          <Frame>
            <Pagination
              variant="combined"
              listName="leads"
              from={1}
              to={25}
              total={12480}
              pageSize={25}
              isFirst
              isLast={false}
              start={<span className="text-sm text-fg">3 leads selected</span>}
            />
          </Frame>
        </Specimen>
        <Specimen label="empty" note="The footer is hidden; the table shows its EmptyState." stack>
          <EmptyState size="compact" variant="no-results" title={EMPTY_STATE_COPY.leadsFiltered.title} body={EMPTY_STATE_COPY.leadsFiltered.body} headingLevel={4} />
        </Specimen>
        <Specimen label="error loading a page" note="The old rows stay; an Alert above the table offers “Try again”." stack>
          <Alert
            tone="danger"
            title="Couldn't load the next page"
            actions={
              <Button variant="secondary" size="sm">
                Try again
              </Button>
            }
          >
            The rows below are from the previous page.
          </Alert>
        </Specimen>
      </StateGrid>
      <StateGrid columns={4}>
        <Specimen label="load more: idle (live)" stack>
          <Pagination
            variant="load-more"
            label="Show older activity"
            state={more}
            onLoadMore={() => {
              setMore("loading");
              window.setTimeout(() => setMore("done"), 900);
            }}
          />
        </Specimen>
        <Specimen label="load more: loading" stack>
          <Pagination variant="load-more" label="Show 20 more" state="loading" />
        </Specimen>
        <Specimen label="load more: all loaded" stack>
          <Pagination variant="load-more" label="Show 20 more" state="done" />
        </Specimen>
        <Specimen label="load more: error" stack>
          <Pagination variant="load-more" label="Show 20 more" state="error" onLoadMore={noop} />
        </Specimen>
      </StateGrid>
    </div>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return <div className="w-full overflow-hidden rounded-lg border border-border">{children}</div>;
}
