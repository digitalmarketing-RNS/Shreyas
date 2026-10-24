"use client";

import { House, Search, UsersRound } from "lucide-react";
import { type ReactNode, useState } from "react";
import { CheckInToggle } from "@/components/ui/shell/check-in-toggle";
import { AppHeader } from "@/components/ui/shell/app-header";
import { NotificationBell } from "@/components/ui/shell/notification-bell";
import { OrgSwitcher } from "@/components/ui/shell/org-switcher";
import { SettingsSubnav } from "@/components/ui/shell/settings-subnav";
import { Sidebar, navItemActiveClassName, navItemClassName } from "@/components/ui/shell/sidebar";
import { UserMenu } from "@/components/ui/shell/user-menu";
import { cn } from "@/lib/cn";
import { SIMULATED_NOTE, Specimen, StateGrid, simulatedFocus } from "../../_gallery";
import { INSTITUTION, ME, MEMBERSHIPS } from "../_kit/sample-data";
import { StaticPreview } from "../_kit/static-preview";
import { ZoomFrame } from "../_kit/zoom-frame";
import { DemoFeed } from "./notification-specimens";

export function SkipLinkSpecimens() {
  return (
    <StateGrid columns={3}>
      <Specimen label="hidden" note="sr-only, not display:none, so it stays first in the tab order. Press Tab at the top of this page to see the gallery's own.">
        <span className="text-sm text-muted">Nothing shows until it has focus.</span>
      </Specimen>
      <Specimen label="visible on focus" note={SIMULATED_NOTE}>
        <span className={cn("inline-flex h-control-md items-center rounded-md bg-accent px-4 text-sm font-medium text-on-accent shadow-pop", simulatedFocus)}>
          Skip to main content
        </span>
      </Specimen>
      <Specimen label="other targets" note="S01 and S02 point at the form's first heading; S05 adds a second link.">
        <span className="inline-flex h-control-md items-center rounded-md bg-accent px-4 text-sm font-medium text-on-accent">Skip to the form</span>
        <span className="inline-flex h-control-md items-center rounded-md bg-accent px-4 text-sm font-medium text-on-accent">Skip to filters</span>
      </Specimen>
    </StateGrid>
  );
}

function SidebarBox({ children, height = "h-140" }: { children: ReactNode; height?: string }) {
  return <div className={cn("flex w-fit overflow-hidden rounded-md border border-border", height)}>{children}</div>;
}

export function SidebarSpecimens() {
  const [path, setPath] = useState("/leads/10482");
  return (
    <div className="flex flex-col gap-4">
      <StateGrid columns={3}>
        <Specimen label="expanded" note={'Lead profile open: Leads is aria-current="true" (a deeper page). Links are live here; they move the active item.'} stack>
          <SidebarBox>
            <Sidebar id="spec-nav-expanded" label="Main (expanded specimen)" fixedForm="expanded" currentPath={path} counts={{ inbox: 4, "my-day": 3 }} onNavigate={setPath} prefetch={false} />
          </SidebarBox>
        </Specimen>
        <Specimen label="collapsed" note="Icons only; group labels become dividers (and stay as sr-only names); counts become dots; tooltips on the right." stack>
          <SidebarBox>
            <Sidebar id="spec-nav-collapsed" label="Main (collapsed specimen)" fixedForm="collapsed" currentPath="/inbox" counts={{ inbox: 4, "my-day": 3 }} onNavigate={() => {}} prefetch={false} />
          </SidebarBox>
        </Specimen>
        <Specimen label="drawer (below md, and “Expand menu” from md to lg)" note="Its top holds the OrgSwitcher and the CheckInToggle, which the narrow header hides." stack>
          <SidebarBox height="h-160">
            <div className="w-sidebar bg-surface-raised">
              <Sidebar
                form="drawer"
                id="spec-nav-drawer"
                label="Main (drawer specimen)"
                currentPath="/"
                counts={{ inbox: 4, "my-day": 3 }}
                onNavigate={() => {}}
                prefetch={false}
                top={
                  <>
                    <OrgSwitcher current={MEMBERSHIPS[0]} memberships={MEMBERSHIPS} variant="drawer" />
                    <CheckInToggle checkedIn since="9:12 am" onChange={() => new Promise((resolve) => window.setTimeout(resolve, 400))} />
                  </>
                }
              />
            </div>
          </SidebarBox>
        </Specimen>
      </StateGrid>
      <StateGrid columns={4}>
        <Specimen label="item: default" stack>
          <ItemDraw label="Opportunities" />
        </Specimen>
        <Specimen label="item: hover" note={SIMULATED_NOTE} stack>
          <ItemDraw label="Opportunities" className="bg-surface-hover" iconClassName="text-fg" />
        </Specimen>
        <Specimen label="item: active (current section)" note="1 px accent edge and weight, not fill alone." stack>
          <ItemDraw label="Leads" active />
        </Specimen>
        <Specimen label="item: focus-visible" note={`${SIMULATED_NOTE}: inset ring.`} stack>
          <ItemDraw label="Opportunities" className="outline-2 -outline-offset-2 outline-focus-ring outline-solid" />
        </Specimen>
        <Specimen label="item: with count" note="Name: “Inbox, 4 chats waiting”." stack>
          <ItemDraw label="Inbox" count={4} />
        </Specimen>
        <Specimen label="item: with dot (collapsed)" note="Tooltip “Inbox · 4 waiting”." stack>
          <ItemDraw label="Inbox" collapsed count={4} />
        </Specimen>
        <Specimen label="loading counts" note="Counts are absent until loaded; no skeleton." stack>
          <ItemDraw label="Inbox" />
        </Specimen>
        <Specimen label="count capped" note="“99+”." stack>
          <ItemDraw label="My day" count={140} />
        </Specimen>
      </StateGrid>
      <Specimen label="narrow height" note="The scroll area scrolls; the Settings item and the collapse button stay pinned." stack>
        <SidebarBox height="h-72">
          <Sidebar id="spec-nav-short" label="Main (narrow height specimen)" fixedForm="expanded" currentPath="/payments" onNavigate={() => {}} prefetch={false} />
        </SidebarBox>
      </Specimen>
    </div>
  );
}

function ItemDraw({
  label,
  active = false,
  collapsed = false,
  count,
  className,
  iconClassName,
}: {
  label: string;
  active?: boolean;
  collapsed?: boolean;
  count?: number;
  className?: string;
  iconClassName?: string;
}) {
  const Icon = label === "My day" ? House : UsersRound;
  return (
    <StaticPreview className="w-sidebar max-w-full rounded-md border border-border bg-surface py-2">
      <div
        className={cn(
          navItemClassName,
          collapsed ? "w-control-md justify-center" : "gap-3 px-2",
          active && navItemActiveClassName,
          className,
        )}
      >
        <Icon aria-hidden="true" className={cn("size-icon-md shrink-0", active ? "text-accent" : "text-muted", iconClassName)} />
        {collapsed ? null : <span className="min-w-0 flex-1 truncate pt-0.5 pb-1">{label}</span>}
        {count && !collapsed ? (
          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-surface-sunken px-1.5 text-xs font-medium text-fg tabular-nums">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
        {count && collapsed ? <span className="absolute top-1 right-2 size-2 rounded-pill bg-accent" /> : null}
      </div>
    </StaticPreview>
  );
}

export function SettingsSubnavSpecimens() {
  const [path, setPath] = useState("/settings/channels");
  return (
    <StateGrid columns={2}>
      <Specimen label="column (lg and up)" note="Links are live here." stack>
        <SidebarBox height="h-120">
          <SettingsSubnav form="column" visibility="always" currentPath={path} onNavigate={setPath} prefetch={false} />
        </SidebarBox>
      </Specimen>
      <Specimen label="popover (below lg)" note="“Settings section” opens the same links; nothing navigates until one is chosen." stack>
        <SettingsSubnav form="popover" visibility="always" currentPath={path} onNavigate={setPath} prefetch={false} />
      </Specimen>
    </StateGrid>
  );
}

function SearchSlot() {
  return (
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-icon-sm -translate-y-1/2 text-muted" />
      <input
        type="search"
        aria-label="Search leads"
        placeholder="Search leads by name, email or mobile"
        className="h-control-sm w-72 rounded-md border border-input bg-surface pr-2.5 pl-9 text-sm text-fg transition-colors duration-fast placeholder:text-muted hover:border-muted"
      />
    </div>
  );
}

function HeaderFrame({ label, note, width, variant = "standard", routeLoading = false }: { label: string; note?: string; width: number; variant?: "standard" | "partner"; routeLoading?: boolean }) {
  return (
    <ZoomFrame label={label} note={note} width={width} height={49}>
      <div className="@container/shell h-full bg-bg">
        <AppHeader
          as="div"
          variant={variant}
          orgName={variant === "partner" ? "Shiksha Leads Network, Pune" : INSTITUTION}
          orgSwitcher={<OrgSwitcher current={MEMBERSHIPS[0]} memberships={MEMBERSHIPS} />}
          search={<SearchSlot />}
          checkIn={<CheckInToggle checkedIn since="9:12 am" />}
          notifications={<NotificationBell unread={3} feed={(id) => <DemoFeed headingId={id} />} />}
          userMenu={<UserMenu user={ME} variant={variant === "partner" ? "partner" : "standard"} />}
          onOpenMenu={() => {}}
          routeLoading={routeLoading}
          className="static"
        />
      </div>
    </ZoomFrame>
  );
}

export function AppHeaderSpecimens() {
  return (
    <div className="flex flex-col gap-4">
      <HeaderFrame label="standard: xl and up" note="Check-in shows its status line." width={1280} />
      <HeaderFrame label="standard: lg to xl" note="Check-in status moves into its tooltip." width={1100} />
      <HeaderFrame label="standard: md to lg" note="The menu button appears (opens the nav drawer); the product name hides." width={860} />
      <HeaderFrame label="narrow: below md" note="Menu, home, the org name as text, bell, account menu. Check-in and switching move into the drawer and the account menu." width={390} />
      <HeaderFrame label="partner (S39)" note="Product mark, the publisher's name, and an account menu with Sign out only." width={1100} variant="partner" />
      <HeaderFrame label="route loading" note="A client navigation pending for more than 300 ms: 2 px bar along the bottom edge." width={1100} routeLoading />
    </div>
  );
}
