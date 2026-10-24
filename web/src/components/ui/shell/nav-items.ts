import {
  CalendarDays,
  ChartColumn,
  FileText,
  House,
  IndianRupee,
  Layers,
  LifeBuoy,
  type LucideIcon,
  Megaphone,
  MessagesSquare,
  Settings,
  UsersRound,
  Workflow,
} from "lucide-react";

/**
 * The main navigation (components.md, Sidebar): groups, items, routes and the permission each
 * needs. Items whose permission the role lacks are hidden, never disabled.
 */
export type NavItemId =
  | "my-day"
  | "leads"
  | "opportunities"
  | "calendar"
  | "inbox"
  | "tickets"
  | "broadcasts"
  | "automations"
  | "templates"
  | "payments"
  | "reports"
  | "settings";

export type NavCountWords = {
  /** In the accessible name: "Inbox, 4 chats waiting". */
  one: string;
  other: string;
  /** In the collapsed tooltip: "Inbox · 4 waiting". */
  short: string;
};

export type NavItem = {
  id: NavItemId;
  label: string;
  href: string;
  icon: LucideIcon;
  /** The permission key that shows the item; none means every role sees it. */
  permission?: string;
  /** Screen IDs, for reference. */
  screens: string;
  /** What a count on this item means. */
  count?: NavCountWords;
};

export type NavGroup = { id: string; label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "work",
    label: "Work",
    items: [
      {
        id: "my-day",
        label: "My day",
        href: "/",
        icon: House,
        screens: "S04",
        count: { one: "overdue follow-up", other: "overdue follow-ups", short: "overdue" },
      },
      { id: "leads", label: "Leads", href: "/leads", icon: UsersRound, permission: "leads.view", screens: "S05" },
      { id: "opportunities", label: "Opportunities", href: "/opportunities", icon: Layers, screens: "S26" },
      { id: "calendar", label: "Calendar", href: "/calendar", icon: CalendarDays, screens: "S12" },
      {
        id: "inbox",
        label: "Inbox",
        href: "/inbox",
        icon: MessagesSquare,
        permission: "inbox.use",
        screens: "S15",
        count: { one: "chat waiting", other: "chats waiting", short: "waiting" },
      },
      { id: "tickets", label: "Tickets", href: "/tickets", icon: LifeBuoy, screens: "S40" },
    ],
  },
  {
    id: "outreach",
    label: "Outreach",
    items: [
      { id: "broadcasts", label: "Broadcasts", href: "/broadcasts", icon: Megaphone, screens: "S16" },
      { id: "automations", label: "Automations", href: "/automations", icon: Workflow, screens: "S17" },
      { id: "templates", label: "Templates", href: "/templates", icon: FileText, screens: "S19" },
    ],
  },
  {
    id: "money",
    label: "Money and reports",
    items: [
      { id: "payments", label: "Payments", href: "/payments", icon: IndianRupee, screens: "S25" },
      { id: "reports", label: "Reports", href: "/reports", icon: ChartColumn, screens: "S20-S23" },
    ],
  },
];

export const NAV_FOOTER_ITEM: NavItem = {
  id: "settings",
  label: "Settings",
  href: "/settings",
  icon: Settings,
  screens: "S28-S38, S41",
};

export type SettingsSection = { label: string; href: string };

/** The Settings subnav, in order (S28-S38, S41, S42 Privacy requests, S43 Incidents, S44 Retention). */
export const SETTINGS_SECTIONS: SettingsSection[] = [
  { label: "Lead fields", href: "/settings/lead-fields" },
  { label: "Stages", href: "/settings/stages" },
  { label: "Lead rules", href: "/settings/lead-rules" },
  { label: "Enquiry forms", href: "/settings/forms" },
  { label: "Privacy notices", href: "/settings/privacy-notices" },
  { label: "Users", href: "/settings/users" },
  { label: "Roles", href: "/settings/roles" },
  { label: "Teams", href: "/settings/teams" },
  { label: "Channels", href: "/settings/channels" },
  { label: "Payments", href: "/settings/payments" },
  { label: "Integrations and API", href: "/settings/integrations" },
  { label: "Publishers", href: "/settings/publishers" },
  { label: "Privacy requests", href: "/settings/privacy-requests" },
  { label: "Incidents", href: "/settings/incidents" },
  { label: "Retention", href: "/settings/retention" },
  { label: "Audit log", href: "/settings/audit-log" },
];

/**
 * The active item: the one whose route is the longest prefix of the path. An exact match is
 * aria-current="page"; a deeper page in that section (a lead profile under Leads) is "true".
 */
export function activeNavState(href: string, currentPath: string, allHrefs: readonly string[]): "page" | "true" | undefined {
  const matches = (candidate: string) =>
    candidate === "/" ? currentPath === "/" : currentPath === candidate || currentPath.startsWith(`${candidate}/`);
  if (!matches(href)) return undefined;
  const longest = allHrefs.filter(matches).sort((a, b) => b.length - a.length)[0];
  if (longest !== href) return undefined;
  return currentPath === href ? "page" : "true";
}

/** "Inbox, 4 chats waiting"; counts above 99 read "99+". */
export function navAccessibleName(item: NavItem, count?: number): string {
  if (!item.count || !count) return item.label;
  const shown = count > 99 ? "99+" : String(count);
  return `${item.label}, ${shown} ${count === 1 ? item.count.one : item.count.other}`;
}

/** The words after the label in a link's name: ", 4 chats waiting" (sr-only text). */
export function navCountWords(item: NavItem, count?: number): string {
  if (!item.count || !count) return "";
  return `, ${count > 99 ? "99+" : count} ${count === 1 ? item.count.one : item.count.other}`;
}

/** "Inbox · 4 waiting" for the collapsed tooltip. */
export function navTooltip(item: NavItem, count?: number): string {
  if (!item.count || !count) return item.label;
  return `${item.label} · ${count > 99 ? "99+" : count} ${item.count.short}`;
}
