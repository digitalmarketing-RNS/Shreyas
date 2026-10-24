"use client";

import { Download, FileUp, Plus, Search } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/display/card";
import { PhoneText } from "@/components/ui/display/phone-text";
import { StatusPill } from "@/components/ui/display/status-pill";
import { EmptyState } from "@/components/ui/feedback/empty-state";
import { EMPTY_STATE_COPY } from "@/components/ui/feedback/empty-state-copy";
import { JobTray } from "@/components/ui/feedback/job-tray";
import type { Job } from "@/components/ui/feedback/jobs";
import { AppShell, type AppShellProps, type AppShellVariant } from "@/components/ui/shell/app-shell";
import { CheckInToggle } from "@/components/ui/shell/check-in-toggle";
import { NAV_FOOTER_ITEM, NAV_GROUPS, SETTINGS_SECTIONS } from "@/components/ui/shell/nav-items";
import { NotificationBell } from "@/components/ui/shell/notification-bell";
import { OrgSwitcher } from "@/components/ui/shell/org-switcher";
import { PageHeader } from "@/components/ui/shell/page-header";
import { Pagination } from "@/components/ui/shell/pagination";
import type { SidebarPreference } from "@/components/ui/shell/sidebar";
import { UserMenu } from "@/components/ui/shell/user-menu";
import { ZoomFrame } from "../_kit/zoom-frame";
import { INSTITUTION, LEADS, ME, MEMBERSHIPS } from "../_kit/sample-data";
import { DemoFeed } from "./notification-specimens";

const ALL_ITEMS = [...NAV_GROUPS.flatMap((group) => group.items), NAV_FOOTER_ITEM];

function titleFor(path: string): string {
  const section = SETTINGS_SECTIONS.find((item) => item.href === path);
  if (section) return section.label;
  const item = [...ALL_ITEMS].sort((a, b) => b.href.length - a.href.length).find((nav) => (nav.href === "/" ? path === "/" : path.startsWith(nav.href)));
  return item?.label ?? "My day";
}

/** A search field for the header's search slot (the real one is group 1's SearchInput). */
function SearchSlot() {
  return (
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-icon-sm -translate-y-1/2 text-muted" />
      <input
        type="search"
        aria-label="Search leads"
        placeholder="Search leads by name, email or mobile"
        autoComplete="off"
        className="h-control-sm w-72 rounded-md border border-input bg-surface pr-2.5 pl-9 text-sm text-fg transition-colors duration-fast placeholder:text-muted hover:border-muted"
      />
    </div>
  );
}

const RUNNING_IMPORT: Job = {
  id: "job-demo",
  kind: "lead_import",
  status: "running",
  total: 1240,
  totals: { created: 520, updated: 96, failed: 24 },
  startedAt: "2:30 pm",
  etaText: "About 2 min left",
};

export type ShellDemoState = "route-loading" | "offline" | "suspended" | "no-permission" | "page-error" | "job-running";

/** One AppShell in a frame, with working navigation, collapse, drawer, menus and bell. */
export function ShellDemo({
  label,
  note,
  frameLabel,
  width,
  height = 520,
  variant = "standard",
  preference = "auto",
  state,
  startPath,
}: {
  label: string;
  note?: ReactNode;
  /** Names the frame's landmarks ("Main (expanded)"). */
  frameLabel: string;
  width: number;
  height?: number;
  variant?: AppShellVariant;
  preference?: SidebarPreference;
  state?: ShellDemoState;
  startPath?: string;
}) {
  const [path, setPath] = useState(startPath ?? (variant === "settings" ? "/settings/channels" : variant === "full-bleed" ? "/inbox" : "/leads"));
  const [pref, setPref] = useState<SidebarPreference>(preference);
  const [checkedIn, setCheckedIn] = useState(true);

  const saveCheckIn = async (next: boolean) => {
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    setCheckedIn(next);
  };

  const shellProps: AppShellProps = {
    variant,
    width: path === "/leads" || variant === "full-bleed" ? "full" : "content",
    pathname: path,
    orgName: variant === "partner" ? "Shiksha Leads Network, Pune" : INSTITUTION,
    orgSwitcher: (
      <OrgSwitcher
        current={MEMBERSHIPS[0]}
        memberships={MEMBERSHIPS}
        onSwitch={() => new Promise((resolve) => window.setTimeout(resolve, 1200))}
      />
    ),
    search: <SearchSlot />,
    checkIn: <CheckInToggle checkedIn={checkedIn} since="9:12 am" onChange={saveCheckIn} />,
    notifications: <NotificationBell unread={3} feed={(id) => <DemoFeed headingId={id} />} />,
    userMenu: (
      <UserMenu
        user={variant === "partner" ? { name: "Rohan Deshpande", email: "rohan@shikshaleads.in", role: "Publisher" } : ME}
        variant={variant === "partner" ? "partner" : "standard"}
        checkIn={{ checkedIn, since: "9:12 am", onChange: saveCheckIn }}
      />
    ),
    drawerTop: (
      <>
        <OrgSwitcher current={MEMBERSHIPS[0]} memberships={MEMBERSHIPS} variant="drawer" />
        <CheckInToggle checkedIn={checkedIn} since="9:12 am" onChange={saveCheckIn} />
      </>
    ),
    sidebarPreference: pref,
    onSidebarPreferenceChange: setPref,
    navCounts: { inbox: 4, "my-day": 3 },
    routeLoading: state === "route-loading",
    offline: state === "offline" ? true : false,
    suspended: state === "suspended",
    jobTray: state === "job-running" ? <JobTray jobs={[RUNNING_IMPORT]} /> : null,
    preview: { label: frameLabel, height, onNavigate: setPath },
  };

  return (
    <ZoomFrame label={label} note={note} width={width} height={height}>
      <AppShell {...shellProps}>
        <SamplePage path={path} variant={variant} state={state} />
      </AppShell>
    </ZoomFrame>
  );
}

function SamplePage({ path, variant, state }: { path: string; variant: AppShellVariant; state?: ShellDemoState }) {
  const title = titleFor(path);
  if (state === "no-permission") {
    const copy = EMPTY_STATE_COPY.noPermission;
    return (
      <EmptyState
        variant="no-permission"
        icon={copy.icon}
        title={copy.title}
        body={copy.body.replace("{Institution}", INSTITUTION)}
        actions={
          <Button variant="link" onClick={() => {}}>
            Go to My day
          </Button>
        }
      />
    );
  }
  if (state === "page-error") {
    const copy = EMPTY_STATE_COPY.error;
    return (
      <EmptyState
        variant="error"
        icon={copy.icon}
        title={copy.title}
        body={copy.body}
        reference="7F3K-21"
        actions={
          <Button variant="primary" size="md">
            Try again
          </Button>
        }
      />
    );
  }
  if (variant === "partner") {
    return (
      <>
        <PageHeader headingLevel={2} title="Leads you sent" count="1,248" description="Leads from Shiksha Leads Network this admission cycle." />
        <Card variant="flush" title="This week" titleLevel={3}>
          <LeadRows />
        </Card>
      </>
    );
  }
  if (variant === "full-bleed") {
    return (
      <div className="flex h-full min-h-0">
        <div className="flex w-80 shrink-0 flex-col border-r border-border bg-surface">
          <h2 className="m-0 border-b border-border px-4 py-3 text-md text-fg">Inbox</h2>
          <ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-0">
            {LEADS.map((lead, index) => (
              <li key={lead.name} className={index === 0 ? "border-l-2 border-accent bg-accent-subtle px-4 py-3" : "border-l-2 border-transparent px-4 py-3"}>
                <p dir="auto" className="m-0 text-sm font-medium text-fg">
                  {lead.name}
                </p>
                <p className="m-0 text-xs text-muted">{index === 0 ? "Is the hostel open in May?" : `Enquired about ${lead.course}`}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-border bg-surface px-4 py-3 text-sm font-semibold text-fg">Ananya Rao</div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 text-sm text-muted">The thread scrolls inside its pane; the page does not.</div>
        </div>
      </div>
    );
  }
  if (variant === "settings") {
    return (
      <>
        <PageHeader
          variant="settings"
          headingLevel={2}
          title={title}
          description="Connect the email, SMS and WhatsApp accounts that send messages for your institution."
        />
        <Card title="WhatsApp" titleLevel={3} actions={<StatusPill domain="channel_accounts.status" value="connected" />}>
          <p className="m-0 text-sm text-muted">+91 80 2612 3456 · Display name “Lakeview College Admissions”</p>
        </Card>
      </>
    );
  }
  return (
    <>
      <PageHeader
        headingLevel={2}
        title={title}
        count={path === "/leads" ? "12,480" : undefined}
        primary={{ id: "add", label: "Add lead", icon: <Plus />, disabledReason: state === "suspended" ? `${INSTITUTION}'s account is suspended.` : undefined }}
        secondary={[
          { id: "import", label: "Import", icon: <FileUp /> },
          { id: "export", label: "Export", icon: <Download /> },
        ]}
      />
      <Card variant="flush">
        <LeadRows />
        <Pagination listName="leads" from={1} to={25} total={12480} pageSize={25} isFirst isLast={false} />
      </Card>
    </>
  );
}

function LeadRows() {
  return (
    <ul className="m-0 list-none p-0">
      {LEADS.map((lead) => (
        <li key={lead.name} className="flex min-h-row flex-wrap items-center gap-x-4 gap-y-1 border-b border-border px-4 py-2 text-table last:border-b-0">
          <span dir="auto" className="min-w-40 flex-1 font-medium text-fg">
            {lead.name}
          </span>
          <span className="min-w-40 text-muted">{lead.course}</span>
          <span className="min-w-24 text-muted">{lead.city}</span>
          <PhoneText value={lead.phone} />
          <span className="text-fg">{lead.stage}</span>
        </li>
      ))}
    </ul>
  );
}
