import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { DialogPreview } from "@/components/ui/overlays/dialog";
import { GalleryPage, Section, Specimen, StateGrid } from "../_gallery";
import { KeyboardNotes } from "./_kit/keyboard-notes";
import { StaticPreview } from "./_kit/static-preview";
import { CheckInSpecimens, OrgSwitcherSpecimens, UserMenuSpecimens } from "./_parts/account-specimens";
import { AppHeaderSpecimens, SettingsSubnavSpecimens, SidebarSpecimens, SkipLinkSpecimens } from "./_parts/nav-specimens";
import { BellSpecimens, FeedSpecimens } from "./_parts/notification-specimens";
import { BreadcrumbSpecimens, PageHeaderSpecimens, PaginationSpecimens, TabsSpecimens } from "./_parts/page-specimens";
import { SessionDialogDemos } from "./_parts/session-demos";
import { ShellDemo } from "./_parts/shell-demo";

export const metadata: Metadata = { title: "Shell and navigation" };

export default function Page() {
  return (
    <GalleryPage
      title="Shell and navigation"
      description="The frame around every staff screen and how people move through it (components.md, group 2: Shell and navigation). The AppShell previews render at their real widths, scaled to fit, and work: open the menus, collapse the sidebar, open the drawer in the phone frame."
    >
      <Section
        id="app-shell"
        title="AppShell"
        description="SkipLink, sticky header, sidebar, banner slot, main, background tasks and the toast region, with the same landmarks everywhere. The layout follows the shell's own width (container queries), which is the window's width in the app."
      >
        <ShellDemo label="sidebar expanded (xl and up)" note="Standard variant on Leads. “Collapse menu” at the bottom of the sidebar collapses it." frameLabel="expanded" width={1280} />
        <ShellDemo label="sidebar collapsed (the person collapsed it)" note="Icons only; labels in tooltips on the right; counts become dots." frameLabel="collapsed" width={1280} preference="collapsed" />
        <ShellDemo label="lg to xl: collapsed by default" note="“Expand menu” expands it and pushes the content." frameLabel="lg" width={1100} />
        <ShellDemo label="md to lg: rail only" note="“Expand menu” and the header's menu button open the full navigation as a left drawer over the page." frameLabel="md" width={860} />
        <ShellDemo
          label="mobile nav (below md)"
          note="No rail. The menu button opens the drawer, with the OrgSwitcher and the CheckInToggle at its top; focus starts on the current page's link; Esc closes it and returns focus to the menu button."
          frameLabel="mobile"
          width={390}
          height={640}
        />
        <ShellDemo label="variant: settings" note="The section subnav is a second column at lg and up; below lg it is the “Settings section” button." frameLabel="settings" width={1280} variant="settings" />
        <ShellDemo label="variant: full-bleed (S12, S15, S18)" note="Main has no max width or padding; the panes scroll, the page does not." frameLabel="full-bleed" width={1280} variant="full-bleed" height={440} />
        <ShellDemo label="variant: partner (S39)" note="The publisher's name and Sign out only: no sidebar, no org switcher, no check-in, no bell." frameLabel="partner" width={1100} variant="partner" height={440} />
        <StateGrid columns={2}>
          <ShellDemo label="state: route loading" note="A client navigation pending for more than 300 ms: the 2 px bar under the header." frameLabel="route loading" width={1024} height={360} state="route-loading" />
          <ShellDemo label="state: offline" note="A warning Banner while the browser is offline, announced once (role=status). Nothing is queued." frameLabel="offline" width={1024} height={360} state="offline" />
          <ShellDemo
            label="state: read-only institution (suspended)"
            note="A danger Banner; actions that change data are aria-disabled with the reason."
            frameLabel="suspended"
            width={1024}
            height={360}
            state="suspended"
          />
          <ShellDemo label="state: no permission" note="Main shows EmptyState (no-permission); the nav item is hidden, not disabled." frameLabel="no permission" width={1024} height={360} state="no-permission" />
          <ShellDemo label="state: page error" note="error.tsx shows EmptyState (error) with a reference; header and sidebar keep working." frameLabel="page error" width={1024} height={360} state="page-error" />
          <ShellDemo label="background tasks" note="The JobTray sits bottom-right above any sticky bottom bar; toasts sit above it." frameLabel="tasks" width={1024} height={360} state="job-running" />
        </StateGrid>
        <StateGrid columns={3}>
          <Specimen label="state: idle warning" note="Opens 2 minutes before the idle limit with focus on “Stay signed in”. Static time, not a countdown." surface="bg">
            <StaticPreview>
              <DialogPreview
                size="sm"
                title="You'll be signed out soon"
                description="For your security we sign you out after 30 minutes without activity. You'll be signed out at 4:32 pm."
                footer={
                  <>
                    <Button variant="secondary" size="md">
                      Sign out now
                    </Button>
                    <Button variant="primary" size="md">
                      Stay signed in
                    </Button>
                  </>
                }
              />
            </StaticPreview>
          </Specimen>
          <Specimen label="state: session expired" note="Not dismissible; the page stays mounted underneath, so typed input is kept." surface="bg">
            <StaticPreview>
              <DialogPreview
                size="sm"
                title="You've been signed out"
                description="For your security we sign you out after a period without activity. Sign in again in the new tab, then come back here. What you typed is kept."
                footer={
                  <Button variant="primary" size="md" external>
                    Sign in again
                  </Button>
                }
              />
            </StaticPreview>
          </Specimen>
          <Specimen label="state: switched institution in another tab" note="Blocking; no request is sent with the wrong institution's screen showing." surface="bg">
            <StaticPreview>
              <DialogPreview
                size="sm"
                title="You switched institution in another tab"
                description="This tab still shows Lakeview College. Reload to continue in Lakeview Public School."
                footer={
                  <Button variant="primary" size="md">
                    Reload
                  </Button>
                }
              />
            </StaticPreview>
          </Specimen>
        </StateGrid>
        <Specimen label="session dialogs, live" stack>
          <SessionDialogDemos />
        </Specimen>
        <KeyboardNotes
          items={[
            ["Tab order", "SkipLink, then the header controls (menu, home, org switcher, search, check-in, bell, account menu), the sidebar links and the collapse button, banners, main, background tasks."],
            ["F8", "Moves focus to the toast region; F8 again or Shift+Tab returns."],
            ["Esc", "Closes the topmost overlay."],
            ["Client route change", "Focus moves to the page's h1 (tabindex=-1); the first load keeps the browser default. Back and forward restore scroll."],
          ]}
        />
      </Section>

      <Section id="skip-link" title="SkipLink" description="Jumps past the header and sidebar to <main id=&quot;main&quot; tabindex=&quot;-1&quot;>.">
        <SkipLinkSpecimens />
        <KeyboardNotes
          items={[
            ["First Tab", "Shows the link at the top left."],
            ["Enter", "Moves focus to main (or the target heading); the next Tab continues from there."],
          ]}
        />
      </Section>

      <Section id="sidebar" title="Sidebar" description="The main navigation, expanded, collapsed and as a drawer. Items whose permission the role lacks are hidden, never disabled.">
        <SidebarSpecimens />
        <Section id="settings-subnav" level={3} title="Settings subnav" description="The second-level navigation of the Settings area: a column at lg and up, a popover link list below lg.">
          <SettingsSubnavSpecimens />
        </Section>
        <KeyboardNotes
          items={[
            ["Tab", "Moves through the links in order, then the collapse button. No arrow-key roving: it is a list of links, not a menu."],
            ["Enter", "Follows a link."],
            ["Collapsed", "Each link shows its tooltip on focus."],
            ["Drawer", "Focus starts on the current page's link; Tab is trapped; Esc closes it and returns focus to the menu button."],
          ]}
        />
      </Section>

      <Section id="app-header" title="AppHeader" description="The institution context and the person's own controls. Icon controls are IconButton md-bar (40 px, 24 px icons).">
        <AppHeaderSpecimens />
        <KeyboardNotes
          items={[
            ["Tab", "Moves left to right through the controls."],
            ["Menus, popover", "Each control's own keys apply: arrows in menus, Esc in the popover."],
            ["/", "Focuses search only when single-key shortcuts are on (account menu setting)."],
          ]}
        />
      </Section>

      <Section id="org-switcher" title="OrgSwitcher" description="Which institution the person is working in, and the switch for people who belong to several.">
        <OrgSwitcherSpecimens />
        <KeyboardNotes
          items={[
            ["Enter, Space or Down", "Opens the menu."],
            ["Arrows, typing", "Move through institutions; typeahead jumps by name."],
            ["Enter", "Chooses; Esc closes and returns focus to the trigger."],
            ["Searchable form", "Typing filters; Down moves into the list."],
          ]}
        />
      </Section>

      <Section id="user-menu" title="UserMenu" description="Who the person is, their preferences (theme, reduced motion, shortcuts) and sign out.">
        <UserMenuSpecimens />
        <KeyboardNotes
          items={[
            ["Arrows, typing", "As DropdownMenu."],
            ["Right / Left", "Opens and closes the Theme submenu."],
            ["Space", "Toggles a checkbox item without closing the menu."],
            ["Esc", "Closes."],
          ]}
        />
      </Section>

      <Section id="check-in-toggle" title="CheckInToggle" description="Whether a counsellor is at work and taking new leads. The accessible name is always “Checked in”; the switch shows on or off.">
        <CheckInSpecimens />
        <KeyboardNotes
          items={[
            ["Tab", "Focuses the switch."],
            ["Space", "Toggles. In the menu-item form Space toggles without closing the menu."],
          ]}
        />
      </Section>

      <Section id="notification-bell" title="NotificationBell" description="How many alerts the person hasn't read, and the feed. Opening it marks nothing as read.">
        <BellSpecimens />
        <KeyboardNotes
          items={[
            ["Enter or Space", "Opens the feed; focus moves into it."],
            ["Esc", "Closes and returns focus to the bell."],
          ]}
        />
      </Section>

      <Section id="notification-feed" title="NotificationFeed" description="Alerts with unread, done and missed states, in the bell popover and on the notifications page (S24).">
        <FeedSpecimens />
        <KeyboardNotes
          items={[
            ["Tab order", "Mark all as read, settings, the filter, each item link and its Mark as read button, See all."],
            ["Arrows (filter)", "Switch between Unread, All and Missed."],
            ["Enter", "Opens an item (and marks it read)."],
            ["Show N new", "Loads the new items and moves focus to the first one."],
            ["Esc", "Closes the popover."],
          ]}
        />
      </Section>

      <Section id="page-header" title="PageHeader" description="Where you are, what the page is, its state and the page-level actions. In the app the title is the page's one h1.">
        <PageHeaderSpecimens />
        <KeyboardNotes
          items={[
            ["Tab", "Breadcrumbs, then the actions in visual order."],
            ["Route change", "The h1 (tabindex=-1) receives focus."],
          ]}
        />
      </Section>

      <Section id="breadcrumbs" title="Breadcrumbs" description="Where a detail or settings page sits, with a one-step way back up.">
        <BreadcrumbSpecimens />
        <KeyboardNotes
          items={[
            ["Tab", "Moves through the links; the current page is not focusable."],
            ["Enter, Space or Down", "Opens the collapsed levels' menu."],
          ]}
        />
      </Section>

      <Section id="tabs" title="Tabs" description="Panels of one record or page, with overflow into “More” for long, team-configured tab sets.">
        <TabsSpecimens />
        <KeyboardNotes
          items={[
            ["Tab", "Enters the tablist on the active tab; the next Tab goes to More (if shown), then into the panel."],
            ["Left / Right", "Move between visible tabs, wrapping; Home and End jump."],
            ["Enter or Space", "Manual activation: opens the focused tab. Automatic: moving opens it."],
            ["More", "Choosing a tab activates it and moves focus to it."],
          ]}
        />
      </Section>

      <Section id="pagination" title="Pagination" description="The only pager: cursor-based, so no numbered pages. Buttons at the ends are aria-disabled, so focus stays on the pressed button.">
        <PaginationSpecimens />
        <KeyboardNotes
          items={[
            ["Tab", "Rows per page, First page, Previous page, Next page."],
            ["Rows per page", "Changing it keeps focus on the select, resets to the first page and announces “Showing 50 rows per page”."],
            ["Next / Previous", "Focus stays on the pressed button, even when it has just become aria-disabled; the table scrolls to its top."],
            ["Load more", "After loading, focus moves to the first new item."],
          ]}
        />
      </Section>
    </GalleryPage>
  );
}
