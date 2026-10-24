"use client";

import { Bell, CircleQuestionMark, ExternalLink, Keyboard, LogOut, Monitor, Moon, Settings, Sun, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/display/avatar";
import { StatusPill } from "@/components/ui/display/status-pill";
import { Spinner } from "@/components/ui/feedback/spinner";
import { Toaster } from "@/components/ui/feedback/toaster";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPreview,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSubTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { PopoverPreview } from "@/components/ui/overlays/popover";
import { CheckInToggle } from "@/components/ui/shell/check-in-toggle";
import { OrgSwitcher } from "@/components/ui/shell/org-switcher";
import { UserMenu } from "@/components/ui/shell/user-menu";
import { cn } from "@/lib/cn";
import { SIMULATED_NOTE, Specimen, StateGrid, simulatedFocus } from "../../_gallery";
import { MANY_MEMBERSHIPS, ME, MEMBERSHIPS } from "../_kit/sample-data";
import { StaticPreview } from "../_kit/static-preview";
import { ZoomFrame } from "../_kit/zoom-frame";

const slowSwitch = () => new Promise<void>((resolve) => window.setTimeout(resolve, 1500));
const failingSwitch = () => new Promise<void>((_, reject) => window.setTimeout(() => reject(new Error("network")), 900));

export function OrgSwitcherSpecimens() {
  return (
    <Toaster>
      <div className="flex flex-col gap-4">
        <StateGrid columns={3}>
          <Specimen label="single membership" note="Plain text: no button, no chevron.">
            <OrgSwitcher current={MEMBERSHIPS[0]} memberships={[MEMBERSHIPS[0]]} />
          </Specimen>
          <Specimen label="menu (2 to 8), closed" note="Live: opens a radio menu. Choosing shows “Switching…”.">
            <OrgSwitcher current={MEMBERSHIPS[0]} memberships={MEMBERSHIPS} supportStaff onSwitch={slowSwitch} />
          </Specimen>
          <Specimen label="searchable (9 or more), closed" note="Live: a Popover with search and a listbox.">
            <OrgSwitcher current={{ ...MEMBERSHIPS[0], trial: true }} memberships={MANY_MEMBERSHIPS} supportStaff onSwitch={slowSwitch} />
          </Specimen>
          <Specimen label="hover" note={SIMULATED_NOTE}>
            <StaticPreview className="w-auto">
              <OrgSwitcher current={MEMBERSHIPS[0]} memberships={MEMBERSHIPS} className="bg-surface-hover" />
            </StaticPreview>
          </Specimen>
          <Specimen label="focus-visible" note={SIMULATED_NOTE}>
            <StaticPreview className="w-auto">
              <OrgSwitcher current={MEMBERSHIPS[0]} memberships={MEMBERSHIPS} className={simulatedFocus} />
            </StaticPreview>
          </Specimen>
          <Specimen label="switching" note="Spinner and “Switching…”; the menu is closed; clicks are ignored.">
            <OrgSwitcher current={MEMBERSHIPS[0]} memberships={MEMBERSHIPS} switching />
          </Specimen>
          <Specimen label="switch failed" note="Live: choose another institution; an error toast says “Couldn't switch institution. Try again.”">
            <OrgSwitcher current={MEMBERSHIPS[0]} memberships={MEMBERSHIPS} onSwitch={failingSwitch} />
          </Specimen>
          <Specimen label="in-drawer" note="Full width inside the nav drawer below md." stack>
            <div className="w-sidebar max-w-full rounded-md border border-border bg-surface-raised p-2">
              <OrgSwitcher current={MEMBERSHIPS[0]} memberships={MEMBERSHIPS} variant="drawer" onSwitch={slowSwitch} />
            </div>
          </Specimen>
        </StateGrid>
        <StateGrid columns={2}>
          <Specimen label="open: menu" note="Current institution checked; a suspended one is unavailable with its reason; “Manage institutions” for our staff." surface="bg" stack>
            <StaticPreview>
              <DropdownMenuPreview className="w-72 max-w-full">
                <DropdownMenuLabel>Switch institution</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={MEMBERSHIPS[0].id}>
                  {MEMBERSHIPS.map((membership, index) => (
                    <DropdownMenuRadioItem
                      key={membership.id}
                      value={membership.id}
                      highlighted={index === 1}
                      icon={<Avatar name={membership.name} size="sm" variant="institution" />}
                      description={membership.suspended ? undefined : membership.role}
                      unavailableReason={membership.suspended ? "Suspended. Contact your account owner." : undefined}
                      badge={membership.suspended ? <StatusPill domain="orgs.status" value="suspended" className="ml-2" /> : undefined}
                    >
                      {membership.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem icon={<Settings />}>Manage institutions</DropdownMenuItem>
              </DropdownMenuPreview>
            </StaticPreview>
          </Specimen>
          <Specimen label="open: searchable" note="Typing filters; Down moves into the list; Enter chooses." surface="bg" stack>
            <StaticPreview>
              <PopoverPreview title="Switch institution" variant="list" size="md">
                <div className="px-1 pt-1">
                  <div className="flex h-control-sm items-center rounded-md border border-input bg-surface px-2.5 text-sm text-fg">Narmada</div>
                </div>
                <ul className="m-0 mt-1 list-none p-0">
                  <li className="flex min-h-menu-item items-center gap-2 rounded-sm bg-surface-hover px-2 py-1.5 text-sm outline-2 -outline-offset-2 outline-focus-ring outline-solid">
                    <Avatar name="Narmada Junior College, Pune" size="sm" variant="institution" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate pt-0.5 pb-1 text-fg">Narmada Junior College, Pune</span>
                      <span className="-mt-1 text-xs text-muted">Support staff</span>
                    </span>
                  </li>
                </ul>
              </PopoverPreview>
            </StaticPreview>
          </Specimen>
        </StateGrid>
      </div>
    </Toaster>
  );
}

export function UserMenuSpecimens() {
  return (
    <Toaster>
      <StateGrid columns={3}>
        <Specimen label="closed" note="Live: the Theme items change this page's theme at once.">
          <UserMenu user={ME} onSavePreference={() => new Promise((resolve) => window.setTimeout(resolve, 300))} onSignOut={() => new Promise((resolve) => window.setTimeout(resolve, 1500))} />
        </Specimen>
        <Specimen label="theme save failed" note="Live: the choice still applies; a toast says it wasn't saved.">
          <UserMenu user={{ ...ME, name: "Vikram Shah", email: "vikram.shah@lakeview.edu.in", role: "Admin" }} onSavePreference={() => Promise.reject(new Error("offline"))} />
        </Specimen>
        <Specimen label="partner (S39)" note="Header block and Sign out only.">
          <UserMenu user={{ name: "Rohan Deshpande", email: "rohan@shikshaleads.in", role: "Publisher" }} variant="partner" />
        </Specimen>
        <Specimen label="hover and focus-visible" note={SIMULATED_NOTE}>
          <StaticPreview className="flex w-auto gap-3">
            <UserMenu user={ME} className="bg-surface-hover" />
            <UserMenu user={ME} className={simulatedFocus} />
          </StaticPreview>
        </Specimen>
        <Specimen label="open: standard" note="With the Theme submenu open." surface="bg" stack>
          <StaticPreview className="flex flex-wrap items-start gap-2">
            <DropdownMenuPreview className="w-64 max-w-full">
              <MenuHeader />
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<UserRound />}>Your profile</DropdownMenuItem>
              <DropdownMenuItem icon={<Bell />}>Notification settings</DropdownMenuItem>
              <DropdownMenuSubTrigger icon={<Monitor />} highlighted className="bg-surface-hover">
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuCheckboxItem checked={false}>Reduce motion</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked icon={<Keyboard />}>
                Single-key shortcuts
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<CircleQuestionMark />}>Help and guides</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<LogOut />}>Sign out</DropdownMenuItem>
            </DropdownMenuPreview>
            <DropdownMenuPreview className="w-48">
              <DropdownMenuRadioGroup value="system">
                <DropdownMenuRadioItem value="system" icon={<Monitor />}>
                  Match system
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="light" icon={<Sun />} highlighted>
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark" icon={<Moon />}>
                  Dark
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuPreview>
          </StaticPreview>
        </Specimen>
        <Specimen label="open: narrow header (check-in moves here)" surface="bg" stack>
          <StaticPreview>
            <DropdownMenuPreview className="w-64 max-w-full">
              <MenuHeader />
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<UserRound />}>Your profile</DropdownMenuItem>
              <DropdownMenuItem icon={<Bell />}>Notification settings</DropdownMenuItem>
              <DropdownMenuCheckboxItem checked description="Since 9:12 am" highlighted>
                Checked in
              </DropdownMenuCheckboxItem>
              <DropdownMenuSubTrigger icon={<Monitor />}>Theme</DropdownMenuSubTrigger>
            </DropdownMenuPreview>
          </StaticPreview>
        </Specimen>
        <Specimen label="signing out" note="The item shows a Spinner, then the app navigates to /login." surface="bg" stack>
          <StaticPreview>
            <DropdownMenuPreview className="w-64 max-w-full">
              <MenuHeader />
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<ExternalLink />}>Help and guides</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<Spinner size="xs" delay={0} />} highlighted>
                Signing out…
              </DropdownMenuItem>
            </DropdownMenuPreview>
          </StaticPreview>
        </Specimen>
      </StateGrid>
    </Toaster>
  );
}

function MenuHeader() {
  return (
    <div className="flex flex-col px-2 py-2">
      <span className="truncate pt-0.5 pb-1 text-sm font-semibold text-fg">{ME.name}</span>
      <span className="-mt-1 truncate text-xs text-muted">{ME.email}</span>
      <span className="text-xs text-muted">{ME.role}</span>
    </div>
  );
}

const save = (ms: number, fail = false) => () =>
  new Promise<void>((resolve, reject) => window.setTimeout(() => (fail ? reject(new Error("offline")) : resolve()), ms));

export function CheckInSpecimens() {
  return (
    <div className="flex flex-col gap-4">
      <StateGrid columns={3}>
        <Specimen label="header: checked in" note="Live. Below xl the status line is in the tooltip.">
          <CheckInToggle checkedIn since="9:12 am" onChange={save(500)} />
        </Specimen>
        <Specimen label="header: checked out" note="Live.">
          <CheckInToggle checkedIn={false} onChange={save(500)} />
        </Specimen>
        <Specimen label="header: checked out automatically">
          <CheckInToggle checkedIn={false} autoCheckedOutAt="7:00 pm" onChange={save(500)} />
        </Specimen>
        <Specimen label="header: saving" note="aria-disabled; after 300 ms a spinner sits on the thumb.">
          <CheckInToggle checkedIn since="9:12 am" frozen="saving" />
        </Specimen>
        <Specimen label="header: failed" note="Live: it flips back and the status line says so (role=&quot;alert&quot;).">
          <CheckInToggle checkedIn={false} onChange={save(600, true)} frozen="failed" />
        </Specimen>
        <Specimen label="hover and focus-visible" note={`${SIMULATED_NOTE}: hover:bg-muted on the track; the ring sits on the track.`}>
          <StaticPreview className="flex w-auto flex-col gap-2">
            <SwitchDraw checked={false} className="bg-muted" />
            <SwitchDraw checked className={simulatedFocus} />
          </StaticPreview>
        </Specimen>
      </StateGrid>
      <ZoomFrame label="header: xl and up" note="The status line shows beside the label." width={1280} height={49}>
        <div className="@container/shell flex h-full items-center justify-end bg-surface px-3">
          <CheckInToggle checkedIn since="9:12 am" onChange={save(500)} />
        </div>
      </ZoomFrame>
      <StateGrid columns={3}>
        <Specimen label="card (S04 My day)" surface="bg" stack>
          <CheckInToggle variant="card" headingLevel={3} checkedIn since="9:12 am" leadsToday={6} autoCheckoutTime="7:00 pm IST" onChange={save(500)} className="w-full" />
        </Specimen>
        <Specimen label="card: checked out automatically" surface="bg" stack>
          <CheckInToggle variant="card" headingLevel={3} checkedIn={false} autoCheckedOutAt="7:00 pm" leadsToday={11} autoCheckoutTime="7:00 pm IST" onChange={save(500)} className="w-full" />
        </Specimen>
        <Specimen label="menu item (UserMenu, nav drawer)" note="A menuitemcheckbox; Space toggles without closing the menu." surface="bg" stack>
          <StaticPreview>
            <DropdownMenuPreview>
              <DropdownMenuCheckboxItem checked description="Since 9:12 am">
                Checked in
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={false} description="Not taking new leads" highlighted>
                Checked in
              </DropdownMenuCheckboxItem>
            </DropdownMenuPreview>
          </StaticPreview>
        </Specimen>
      </StateGrid>
    </div>
  );
}

function SwitchDraw({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span className="inline-flex h-control-sm items-center gap-2 px-2">
      <span className={cn("inline-flex h-5 w-9 items-center rounded-pill border border-transparent p-px", checked ? "bg-accent" : "bg-input", className)}>
        <span className={cn("size-4 rounded-pill shadow-card", checked ? "translate-x-4 bg-on-accent" : "bg-surface")} />
      </span>
      <span className="text-sm font-medium text-fg">Checked in</span>
    </span>
  );
}
