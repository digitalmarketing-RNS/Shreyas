"use client";

import {
  AlarmClock,
  ArrowRight,
  Bell,
  Check,
  CircleCheck,
  CircleX,
  IndianRupee,
  ListChecks,
  type LucideIcon,
  MailOpen,
  MessageCircle,
  Settings,
  TimerOff,
  TriangleAlert,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RelativeTime } from "@/components/ui/display/relative-time";
import { StatusPill } from "@/components/ui/display/status-pill";
import { EmptyState } from "@/components/ui/feedback/empty-state";
import { EMPTY_STATE_COPY } from "@/components/ui/feedback/empty-state-copy";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";

export type NotificationEvent =
  | "lead_assigned"
  | "whatsapp_received"
  | "email_opened"
  | "payment_started"
  | "payment_succeeded"
  | "payment_failed"
  | "follow_up_due"
  | "stage_changed"
  | "job_finished"
  | "auto_checkout"
  | "channel_problem";

const EVENT_ICON: Record<NotificationEvent, LucideIcon> = {
  lead_assigned: UserRoundPlus,
  whatsapp_received: MessageCircle,
  email_opened: MailOpen,
  payment_started: IndianRupee,
  payment_succeeded: CircleCheck,
  payment_failed: CircleX,
  follow_up_due: AlarmClock,
  stage_changed: ArrowRight,
  job_finished: ListChecks,
  auto_checkout: TimerOff,
  channel_problem: TriangleAlert,
};

export type FeedItem = {
  id: string;
  /** notifications.event; anything unknown shows the Bell icon. */
  event: NotificationEvent | (string & {});
  title: string;
  body?: string;
  /** The lead's name, in the meta line. */
  lead?: string;
  /** The target (usually the lead, S08); a merged lead links to the primary lead. */
  href?: string;
  /** The lead was erased or is on hold: no link, "This lead is no longer available". */
  targetGone?: boolean;
  /** ISO instant and the server-formatted absolute time ("06 Oct 2026, 2:30 pm IST"). */
  time: { iso: string; absolute: string };
  /** The day group: "Today", "Yesterday", "03 Oct 2026". */
  day: string;
  unread?: boolean;
  /** acted_at set: a CircleCheck before the time, sr text "Done". */
  acted?: boolean;
  /** Not acted on within the response window: warning icon circle and a "Missed" pill. */
  missed?: boolean;
};

export type FeedFilter = "unread" | "all" | "missed";

const FILTERS: { value: FeedFilter; label: string }[] = [
  { value: "unread", label: "Unread" },
  { value: "all", label: "All" },
  { value: "missed", label: "Missed" },
];

const EMPTY = {
  unread: EMPTY_STATE_COPY.notificationsUnread,
  all: EMPTY_STATE_COPY.notificationsAll,
  missed: EMPTY_STATE_COPY.notificationsMissed,
} as const;

export type NotificationFeedProps = {
  /** popover: in the bell, 20 most recent per filter, then "See all". page: S24, full width max-w-form. */
  variant?: "popover" | "page";
  items: FeedItem[];
  filter: FeedFilter;
  onFilterChange?: (filter: FeedFilter) => void;
  state?: "ready" | "loading" | "error";
  onRetry?: () => void;
  onMarkAllRead?: () => void;
  onMarkRead?: (id: string) => void;
  /** Opening an item marks it read and navigates. */
  onOpen?: (id: string) => void;
  /** New items that arrived while the list was scrolled: "Show 2 new". */
  pendingNew?: number;
  onShowNew?: () => void;
  settingsHref?: string;
  seeAllHref?: string;
  /** The h2's id, which names the popover. */
  headingId?: string;
  /** A fixed "now" for the relative times (previews). */
  now?: string;
  /** page: the load-more control (Pagination load-more). */
  loadMore?: ReactNode;
  /** Intercepts item navigation (previews). */
  onNavigate?: (href: string) => void;
  className?: string;
};

/**
 * The alerts about the person's leads and work, with unread, done and missed states (components.md,
 * NotificationFeed). Unread is the dot, the weight and sr-only "Unread" at the start of the link
 * text; Missed is its pill text; never colour alone. New items never push the list under the
 * pointer: they wait behind "Show N new" unless the list is at the top. Opening the popover marks
 * nothing as read.
 */
export function NotificationFeed({
  variant = "popover",
  items,
  filter,
  onFilterChange,
  state = "ready",
  onRetry,
  onMarkAllRead,
  onMarkRead,
  onOpen,
  pendingNew = 0,
  onShowNew,
  settingsHref = "/me/notifications",
  seeAllHref = "/notifications",
  headingId: headingIdProp,
  now,
  loadMore,
  onNavigate,
  className,
}: NotificationFeedProps) {
  const ownHeadingId = useId();
  const headingId = headingIdProp ?? ownHeadingId;
  const listRef = useRef<HTMLDivElement>(null);
  const popover = variant === "popover";

  const filtered = items.filter((item) => (filter === "unread" ? item.unread : filter === "missed" ? item.missed : true));
  const shown = popover ? filtered.slice(0, 20) : filtered;
  const days: { day: string; items: FeedItem[] }[] = [];
  for (const item of shown) {
    const group = days.find((entry) => entry.day === item.day);
    if (group) group.items.push(item);
    else days.push({ day: item.day, items: [item] });
  }
  const anyUnread = items.some((item) => item.unread);

  const showNew = () => {
    onShowNew?.();
    // Focus moves to the first new item once it has rendered.
    window.requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>("[data-feed-item]")?.focus());
  };

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        popover ? "max-h-[min(560px,calc(100dvh-6rem))] bg-surface-raised" : "w-full max-w-form rounded-lg border border-border bg-surface",
        className,
      )}
    >
      <div className="flex flex-col gap-2 border-b border-border px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <h2 id={headingId} className="m-0 min-w-0 flex-1 text-sm font-semibold text-fg">
            Notifications
          </h2>
          {anyUnread && onMarkAllRead ? (
            <Button variant="link" onClick={onMarkAllRead}>
              Mark all as read
            </Button>
          ) : null}
          <IconButton asChild icon={<Settings />} aria-label="Notification settings" size="xs">
            <Link href={settingsHref} />
          </IconButton>
        </div>
        <FeedFilterControl value={filter} onChange={onFilterChange} />
      </div>

      <div ref={listRef} className="relative min-h-0 flex-1 overflow-y-auto">
        {pendingNew > 0 && state === "ready" ? (
          <div className="sticky top-0 z-(--z-raised) flex justify-center py-2">
            <Button variant="secondary" size="sm" className="bg-surface-raised shadow-pop" onClick={showNew}>
              {`Show ${pendingNew} new`}
            </Button>
          </div>
        ) : null}
        {state === "loading" ? (
          <ul aria-hidden="true" className="m-0 flex list-none flex-col p-0">
            {[0, 1, 2].map((row) => (
              <li key={row} className="flex min-h-16 gap-3 px-3 py-2">
                <Skeleton shape="circle" size="md" />
                <span className="flex flex-1 flex-col">
                  <Skeleton width="60%" />
                  <Skeleton text="xs" width="90%" />
                  <Skeleton text="xs" width="40%" />
                </span>
              </li>
            ))}
          </ul>
        ) : state === "error" ? (
          <div className="flex flex-col items-start gap-2 px-3 py-4">
            <p className="m-0 text-sm text-fg">Couldn&apos;t load notifications.</p>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            size="compact"
            variant={EMPTY[filter].variant}
            title={EMPTY[filter].title}
            body={EMPTY[filter].body}
            headingLevel={3}
            actions={
              filter === "all" ? (
                <Button asChild variant="link">
                  <Link href={settingsHref}>Notification settings</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="m-0 flex list-none flex-col p-0 pb-1">
            {days.map((group) => {
              const dayId = `${headingId}-${group.day.replace(/\W+/g, "-")}`;
              return (
                <li key={group.day}>
                  <h3 id={dayId} className="m-0 px-3 pt-3 pb-1 text-xs font-medium text-muted">
                    {group.day}
                  </h3>
                  <ul aria-labelledby={dayId} className="m-0 flex list-none flex-col p-0">
                    {group.items.map((item) => (
                      <FeedRow key={item.id} item={item} now={now} onOpen={onOpen} onMarkRead={onMarkRead} onNavigate={onNavigate} />
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
        {!popover && loadMore ? <div className="border-t border-border px-3 py-3">{loadMore}</div> : null}
      </div>

      {popover ? (
        <div className="border-t border-border px-3 py-2">
          <Button asChild variant="link">
            <Link href={seeAllHref}>See all notifications</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function FeedRow({
  item,
  now,
  onOpen,
  onMarkRead,
  onNavigate,
}: {
  item: FeedItem;
  now?: string;
  onOpen?: (id: string) => void;
  onMarkRead?: (id: string) => void;
  onNavigate?: (href: string) => void;
}) {
  const Icon = EVENT_ICON[item.event as NotificationEvent] ?? Bell;
  const unread = Boolean(item.unread) && !item.acted;
  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex size-control-sm shrink-0 items-center justify-center rounded-pill",
          item.missed ? "bg-warning-subtle text-warning" : "bg-surface-sunken text-muted",
        )}
      >
        <Icon className="size-icon-sm" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        {unread ? <span className="sr-only">Unread. </span> : null}
        <span dir="auto" className={cn("text-sm text-fg", unread && "font-semibold")}>
          {item.title}
          <span className="sr-only">. </span>
        </span>
        {item.targetGone ? (
          <span className="text-xs leading-prose text-muted">This lead is no longer available</span>
        ) : item.body ? (
          <span dir="auto" className="line-clamp-2 pb-1 text-xs leading-prose text-muted">
            {item.body}
            <span className="sr-only">. </span>
          </span>
        ) : null}
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          {item.lead ? (
            <span dir="auto">
              {item.lead}
              <span className="sr-only">. </span>
            </span>
          ) : null}
          {item.acted ? (
            <span className="inline-flex items-center gap-1">
              <CircleCheck aria-hidden="true" className="size-icon-sm text-success" />
              <span className="sr-only">Done. </span>
            </span>
          ) : null}
          <RelativeTime value={item.time.iso} absolute={item.time.absolute} now={now} inFocusable={!item.targetGone} />
          {item.missed ? <StatusPill domain="notifications.state" value="missed" /> : null}
        </span>
      </span>
    </>
  );

  const rowClass = cn(
    "flex min-h-16 gap-3 px-3 py-2 pr-10 text-left transition-colors duration-fast",
    unread ? "bg-accent-subtle" : undefined,
  );

  return (
    <li className="group/row relative">
      {item.targetGone || !item.href ? (
        <div className={rowClass}>{content}</div>
      ) : (
        <Link
          href={item.href}
          data-feed-item=""
          onClick={() => onOpen?.(item.id)}
          onNavigate={
            onNavigate
              ? (event) => {
                  event.preventDefault();
                  onNavigate(item.href ?? "");
                }
              : undefined
          }
          className={cn(rowClass, "focus-inset hover:bg-surface-hover")}
        >
          {content}
        </Link>
      )}
      {unread ? <span aria-hidden="true" className="pointer-events-none absolute top-4 right-4 size-2 rounded-pill bg-accent" /> : null}
      {unread && onMarkRead ? (
        <IconButton
          icon={<Check />}
          aria-label="Mark as read"
          size="xs"
          onClick={() => onMarkRead(item.id)}
          className="absolute right-2 bottom-2 opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100 pointer-coarse:opacity-100"
        />
      ) : null}
    </li>
  );
}

/** The SegmentedControl look (group 1, sm): native radios in a fieldset; arrow keys move and select. */
function FeedFilterControl({ value, onChange }: { value: FeedFilter; onChange?: (filter: FeedFilter) => void }) {
  const name = useId();
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">Show</legend>
      <div className="inline-flex h-control-sm items-center gap-0.5 rounded-md bg-surface-sunken p-0.5">
        {FILTERS.map((option) => (
          <label key={option.value} className="relative flex">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange?.(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex h-7 min-w-12 cursor-pointer items-center justify-center rounded-sm px-3 text-sm font-medium text-muted select-none",
                "transition-colors duration-fast hover:bg-surface-hover hover:text-fg",
                "peer-checked:bg-accent peer-checked:text-on-accent peer-checked:hover:bg-accent-hover peer-checked:hover:text-on-accent",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring peer-focus-visible:outline-solid",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
