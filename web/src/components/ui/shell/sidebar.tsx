"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { type ReactElement, type ReactNode, useEffect } from "react";
import { Badge } from "@/components/ui/display/badge";
import { Tooltip } from "@/components/ui/overlays/tooltip";
import { cn } from "@/lib/cn";
import {
  NAV_FOOTER_ITEM,
  NAV_GROUPS,
  type NavGroup,
  type NavItem,
  type NavItemId,
  activeNavState,
  navAccessibleName,
  navTooltip,
} from "./nav-items";
import { useShell } from "./shell-context";

/**
 * The person's collapse choice, saved in member prefs and mirrored to a cookie so the server
 * renders the right width. auto: expanded from xl, collapsed from lg to xl. expanded: expanded
 * from lg. collapsed: the rail at every width from md. Below md there is no rail (the drawer).
 */
export type SidebarPreference = "auto" | "expanded" | "collapsed";

/** rail: the column beside the content (md and up). drawer: the expanded form inside the nav Drawer. */
export type SidebarForm = "rail" | "drawer";

type FormClasses = {
  nav: string;
  groupWrap: string;
  groupLabel: string;
  divider: string;
  link: string;
  label: string;
  badge: string;
  dot: string;
  /** Shown only in the expanded form / only in the collapsed form. */
  expandedOnly: string;
  collapsedOnly: string;
  /** The collapsed form's sr-only text, removed in the expanded form. */
  collapsedSrOnly: string;
};

/*
 * The expanded and collapsed forms differ only in classes, decided by the shell's container width
 * (@container/shell), so the server renders the right form and nothing shifts on load. The width
 * changes at once, with no animation, so content reflows a single time.
 */
const FORMS: Record<"drawer" | `rail-${SidebarPreference}`, FormClasses> = {
  drawer: {
    nav: "w-full",
    groupWrap: "px-4 pt-4 pb-1",
    groupLabel: "",
    divider: "hidden",
    link: "gap-3 px-2",
    label: "block",
    badge: "inline-flex",
    dot: "hidden",
    expandedOnly: "block",
    collapsedOnly: "hidden",
    collapsedSrOnly: "hidden",
  },
  "rail-collapsed": {
    nav: "w-sidebar-collapsed",
    groupWrap: "",
    groupLabel: "sr-only",
    divider: "block",
    link: "w-control-md justify-center",
    label: "hidden",
    badge: "hidden",
    dot: "block",
    expandedOnly: "hidden",
    collapsedOnly: "block",
    collapsedSrOnly: "sr-only",
  },
  "rail-expanded": {
    nav: "w-sidebar-collapsed @5xl/shell:w-sidebar",
    groupWrap: "@5xl/shell:px-4 @5xl/shell:pt-4 @5xl/shell:pb-1",
    groupLabel: "sr-only @5xl/shell:not-sr-only",
    divider: "block @5xl/shell:hidden",
    link: "w-control-md justify-center @5xl/shell:w-auto @5xl/shell:justify-start @5xl/shell:gap-3 @5xl/shell:px-2",
    label: "hidden @5xl/shell:block",
    badge: "hidden @5xl/shell:inline-flex",
    dot: "block @5xl/shell:hidden",
    expandedOnly: "hidden @5xl/shell:block",
    collapsedOnly: "block @5xl/shell:hidden",
    collapsedSrOnly: "sr-only @5xl/shell:hidden",
  },
  "rail-auto": {
    nav: "w-sidebar-collapsed @7xl/shell:w-sidebar",
    groupWrap: "@7xl/shell:px-4 @7xl/shell:pt-4 @7xl/shell:pb-1",
    groupLabel: "sr-only @7xl/shell:not-sr-only",
    divider: "block @7xl/shell:hidden",
    link: "w-control-md justify-center @7xl/shell:w-auto @7xl/shell:justify-start @7xl/shell:gap-3 @7xl/shell:px-2",
    label: "hidden @7xl/shell:block",
    badge: "hidden @7xl/shell:inline-flex",
    dot: "block @7xl/shell:hidden",
    expandedOnly: "hidden @7xl/shell:block",
    collapsedOnly: "block @7xl/shell:hidden",
    collapsedSrOnly: "sr-only @7xl/shell:hidden",
  },
};

/** Item look shared with the Settings subnav: the active item has a 1 px accent edge and weight, never fill or colour alone. */
export const navItemClassName =
  "group/item relative mx-2 flex h-control-sm shrink-0 items-center rounded-md border border-transparent text-sm text-fg transition-colors duration-fast hover:bg-surface-hover focus-inset";
export const navItemActiveClassName =
  "border-accent bg-accent-subtle font-semibold text-accent hover:bg-accent-subtle forced-colors:border-[Highlight]";

export type SidebarProps = {
  form?: SidebarForm;
  /** rail only. */
  preference?: SidebarPreference;
  /** The current path, for the active item. */
  currentPath: string;
  groups?: NavGroup[];
  footerItem?: NavItem;
  /** Inbox: chats waiting for the person; My day: overdue follow-ups. Absent until loaded (no skeleton). */
  counts?: Partial<Record<NavItemId, number>>;
  /** Hides items whose permission the role lacks. */
  can?: (permission: string) => boolean;
  /** The rail's effective state (from the shell's width and the preference); null before measured. */
  collapsed?: boolean | null;
  /** The collapse button: toggles the preference from lg, opens the drawer from md to lg. */
  onToggle?: () => void;
  /** The nav's id (the collapse button's aria-controls). */
  id?: string;
  label?: string;
  /** Intercepts navigation (framed previews keep the gallery page and only move the active item). */
  onNavigate?: (href: string) => void;
  prefetch?: boolean;
  /** Drawer form: the OrgSwitcher and CheckInToggle, which the narrow header hides. */
  top?: ReactNode;
  /**
   * Draw the rail in one form at any width, outside a shell (documentation). In the app the form
   * follows the shell's width and the preference.
   */
  fixedForm?: "expanded" | "collapsed";
  className?: string;
};

/**
 * The main navigation between the app's sections (components.md, Sidebar): expanded, collapsed and
 * drawer forms. A list of links, not a menu: Tab moves through the links in order, then the
 * collapse button; Enter follows a link; no arrow-key roving. In the collapsed form each link keeps
 * its full accessible name and shows its Tooltip on the right on hover and focus.
 */
export function Sidebar({
  form = "rail",
  preference = "auto",
  currentPath,
  groups = NAV_GROUPS,
  footerItem = NAV_FOOTER_ITEM,
  counts,
  can,
  collapsed = null,
  onToggle,
  id,
  label = "Main",
  onNavigate,
  prefetch,
  top,
  fixedForm,
  className,
}: SidebarProps) {
  const classes =
    form === "drawer" || fixedForm === "expanded" ? FORMS.drawer : fixedForm === "collapsed" ? FORMS["rail-collapsed"] : FORMS[`rail-${preference}`];
  const allowed = (item: NavItem) => !item.permission || !can || can(item.permission);
  const visibleGroups = groups.map((group) => ({ ...group, items: group.items.filter(allowed) })).filter((group) => group.items.length > 0);
  const hrefs = [...visibleGroups.flatMap((group) => group.items.map((item) => item.href)), footerItem.href];
  const showTooltips = form === "rail" && (fixedForm ? fixedForm === "collapsed" : collapsed === true);
  const expandedNow =
    form === "drawer" || fixedForm === "expanded" ? true : fixedForm === "collapsed" ? false : collapsed === null ? preference !== "collapsed" : !collapsed;

  const renderItem = (item: NavItem) => (
    <SidebarLink
      key={item.id}
      item={item}
      count={counts?.[item.id]}
      current={activeNavState(item.href, currentPath, hrefs)}
      classes={classes}
      tooltip={showTooltips}
      onNavigate={onNavigate}
      prefetch={prefetch}
    />
  );

  return (
    <nav
      id={id}
      aria-label={label}
      className={cn(
        "flex flex-col bg-surface",
        form === "rail" &&
          !fixedForm &&
          "sticky top-header z-(--z-sidebar) hidden h-[calc(var(--shell-vh,100dvh)-var(--layout-header))] shrink-0 self-start border-r border-border @3xl/shell:flex",
        form === "rail" && fixedForm && "shrink-0 border-r border-border",
        form === "drawer" && "h-full",
        classes.nav,
        form === "rail" && fixedForm === "expanded" && "w-sidebar",
        className,
      )}
    >
      {top ? <div className="flex flex-col gap-2 border-b border-border px-3 py-3">{top}</div> : null}
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {visibleGroups.map((group, index) => {
          const labelId = `${id ?? "nav"}-${group.id}`;
          return (
            <div key={group.id} className="flex flex-col">
              {index > 0 ? <div aria-hidden="true" className={cn("mx-3 my-2 border-t border-border", classes.divider)} /> : null}
              <div className={classes.groupWrap}>
                <p id={labelId} className={cn("m-0 text-xs font-medium text-muted", classes.groupLabel)}>
                  {group.label}
                </p>
              </div>
              <ul aria-labelledby={labelId} className="m-0 flex list-none flex-col gap-0.5 p-0">
                {group.items.map((item) => (
                  <li key={item.id} className="flex">
                    {renderItem(item)}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-0.5 border-t border-border py-2">
        {renderItem(footerItem)}
        {form === "rail" ? (
          <CollapseButton
            classes={classes}
            navId={id}
            expanded={expandedNow}
            tooltip={showTooltips}
            onToggle={onToggle}
          />
        ) : null}
      </div>
    </nav>
  );
}

function SidebarLink({
  item,
  count,
  current,
  classes,
  tooltip,
  onNavigate,
  prefetch,
}: {
  item: NavItem;
  count?: number;
  current: "page" | "true" | undefined;
  classes: FormClasses;
  tooltip: boolean;
  onNavigate?: (href: string) => void;
  prefetch?: boolean;
}) {
  const Icon = item.icon;
  const active = current !== undefined;
  const link = (
    <Link
      href={item.href}
      prefetch={prefetch}
      aria-current={current}
      aria-label={navAccessibleName(item, count)}
      onNavigate={
        onNavigate
          ? (event) => {
              event.preventDefault();
              onNavigate(item.href);
            }
          : undefined
      }
      className={cn(navItemClassName, classes.link, active && navItemActiveClassName, "min-w-0 flex-1")}
    >
      <Icon aria-hidden="true" className={cn("size-icon-md shrink-0", active ? "text-accent" : "text-muted group-hover/item:text-fg")} />
      <span className={cn("min-w-0 flex-1 truncate pt-0.5 pb-1", classes.label)}>{item.label}</span>
      {count ? (
        <>
          <Badge variant="count" count={count} decorative className={cn("ml-auto", classes.badge)} />
          <span aria-hidden="true" className={cn("absolute top-1 right-2 size-2 rounded-pill bg-accent", classes.dot)} />
        </>
      ) : null}
      <PendingReporter />
    </Link>
  );
  if (!tooltip) return link;
  return (
    <Tooltip content={navTooltip(item, count)} side="right">
      {link}
    </Tooltip>
  );
}

/** Reports a pending client navigation to the shell, which shows the 2 px route-loading bar after 300 ms. */
function PendingReporter() {
  const { pending } = useLinkStatus();
  const { setNavigating } = useShell();
  useEffect(() => {
    if (!pending) return;
    setNavigating(true);
    return () => setNavigating(false);
  }, [pending, setNavigating]);
  return null;
}

function CollapseButton({
  classes,
  navId,
  expanded,
  tooltip,
  onToggle,
}: {
  classes: FormClasses;
  navId?: string;
  expanded: boolean;
  tooltip: boolean;
  onToggle?: () => void;
}) {
  const button: ReactElement = (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={navId}
      onClick={onToggle}
      className={cn(navItemClassName, classes.link, "cursor-pointer text-muted hover:text-fg")}
    >
      <PanelLeftClose aria-hidden="true" className={cn("size-icon-md shrink-0", classes.expandedOnly)} />
      <PanelLeftOpen aria-hidden="true" className={cn("size-icon-md shrink-0", classes.collapsedOnly)} />
      <span className={cn("min-w-0 flex-1 truncate pt-0.5 pb-1 text-left", classes.label)}>Collapse menu</span>
      <span className={classes.collapsedSrOnly}>Expand menu</span>
    </button>
  );
  if (!tooltip) return button;
  return (
    <Tooltip content="Expand menu" side="right">
      {button}
    </Tooltip>
  );
}
