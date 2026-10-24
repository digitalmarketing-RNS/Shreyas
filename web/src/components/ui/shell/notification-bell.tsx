"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { Popover as RadixPopover } from "radix-ui";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { popoverPanelClassName } from "@/components/ui/overlays/popover";
import { cn } from "@/lib/cn";

export type NewAlert = { id: string; title: string; lead?: string };

export type NotificationBellProps = {
  unread: number;
  /** The NotificationFeed (popover variant). Give it `headingId` so the popover is named by its h2. */
  feed: (headingId: string) => ReactNode;
  /** Below md the bell is a link to the notifications page (S24) instead of a popover. */
  href?: string;
  /**
   * Alerts that arrived during the session, newest last. Announced politely, at most one every
   * 10 seconds, batched ("3 new notifications"). The person can turn this off.
   */
  arrivals?: NewAlert[];
  announce?: boolean;
  /** Which form shows: by the shell's width (default), or one form at any width (documentation). */
  form?: "responsive" | "popover" | "link";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

function bellName(unread: number): string {
  if (unread <= 0) return "Notifications";
  return `Notifications, ${unread > 99 ? "99+" : unread} unread`;
}

/**
 * How many alerts the person hasn't read, and the alert feed (components.md, NotificationBell).
 * IconButton md-bar with the count badge (aria-hidden: the count is in the name); a Radix Popover
 * from md, a link to /notifications below md. Enter or Space opens; focus moves into the feed; Esc
 * closes and returns focus to the bell. Opening it marks nothing as read. The live region is
 * separate from the button, so a name change is not announced twice.
 */
export function NotificationBell({
  unread,
  feed,
  href = "/notifications",
  arrivals = [],
  announce = true,
  form = "responsive",
  open,
  onOpenChange,
  className,
}: NotificationBellProps) {
  const headingId = useId();
  const message = useArrivalAnnouncements(arrivals, announce);
  const name = bellName(unread);

  const popover = (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange} modal>
      <RadixPopover.Trigger asChild>
        <IconButton
          icon={<Bell />}
          aria-label={name}
          tooltip="Notifications"
          size="md-bar"
          badge={unread}
          className="data-[state=open]:bg-surface-hover data-[state=open]:text-fg"
        />
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          aria-labelledby={headingId}
          align="end"
          sideOffset={4}
          collisionPadding={8}
          className={cn(popoverPanelClassName, "w-[min(var(--layout-dialog-sm),calc(100vw-2rem))] overflow-hidden p-0")}
        >
          {feed(headingId)}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );

  const link = (
    <IconButton asChild icon={<Bell />} aria-label={name} tooltip="Notifications" size="md-bar" badge={unread}>
      <Link href={href} />
    </IconButton>
  );

  return (
    <span className={cn("inline-flex", className)}>
      {form === "link" ? null : <span className={cn(form === "responsive" && "hidden @3xl/shell:inline-flex")}>{popover}</span>}
      {form === "popover" ? null : <span className={cn(form === "responsive" && "inline-flex @3xl/shell:hidden")}>{link}</span>}
      <span role="status" className="sr-only">
        {message}
      </span>
    </span>
  );
}

/** At most one announcement every 10 seconds; arrivals in between are batched. */
function useArrivalAnnouncements(arrivals: NewAlert[], enabled: boolean): string {
  const [message, setMessage] = useState("");
  const announced = useRef(new Set(arrivals.map((arrival) => arrival.id)));
  const lastAt = useRef(0);
  const pending = useRef<NewAlert[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const fresh = arrivals.filter((arrival) => !announced.current.has(arrival.id));
    if (fresh.length === 0) return;
    fresh.forEach((arrival) => announced.current.add(arrival.id));
    pending.current.push(...fresh);
    const flush = () => {
      const batch = pending.current;
      pending.current = [];
      lastAt.current = Date.now();
      if (batch.length === 1) {
        const [only] = batch;
        setMessage(`New notification: ${only.title}${only.lead ? `, ${only.lead}` : ""}`);
      } else if (batch.length > 1) {
        setMessage(`${batch.length} new notifications`);
      }
    };
    const wait = Math.max(0, lastAt.current + 10_000 - Date.now());
    const timer = window.setTimeout(flush, wait);
    return () => window.clearTimeout(timer);
  }, [arrivals, enabled]);

  return message;
}
