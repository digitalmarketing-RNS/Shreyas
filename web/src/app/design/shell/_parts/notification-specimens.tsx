"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/shell/pagination";
import { type FeedFilter, type FeedItem, NotificationFeed } from "@/components/ui/shell/notification-feed";
import { type NewAlert, NotificationBell } from "@/components/ui/shell/notification-bell";
import { SIMULATED_NOTE, Specimen, StateGrid } from "../../_gallery";
import { FEED_ITEMS } from "../_kit/feed-data";
import { GALLERY_NOW } from "../_kit/sample-data";
import { StaticPreview } from "../_kit/static-preview";

/** A working feed: filters, mark as read, mark all as read, "Show 2 new". */
export function DemoFeed({
  headingId,
  variant = "popover",
  initialFilter = "unread",
  withPending = false,
}: {
  headingId?: string;
  variant?: "popover" | "page";
  initialFilter?: FeedFilter;
  withPending?: boolean;
}) {
  const [items, setItems] = useState<FeedItem[]>(FEED_ITEMS);
  const [filter, setFilter] = useState<FeedFilter>(initialFilter);
  const [pending, setPending] = useState(withPending ? 2 : 0);
  const [more, setMore] = useState<"idle" | "loading" | "done">("idle");
  const markRead = (id: string) => setItems((current) => current.map((item) => (item.id === id ? { ...item, unread: false } : item)));
  return (
    <NotificationFeed
      variant={variant}
      headingId={headingId}
      items={items}
      filter={filter}
      onFilterChange={setFilter}
      onMarkRead={markRead}
      onOpen={markRead}
      onMarkAllRead={() => setItems((current) => current.map((item) => ({ ...item, unread: false })))}
      pendingNew={pending}
      onShowNew={() => {
        setPending(0);
        setItems((current) => [
          {
            id: `new-${current.length}`,
            event: "lead_assigned",
            title: "Lead assigned to you",
            body: "Farhan Qureshi enquired about B.Sc Nursing from a Meta lead ad.",
            lead: "Farhan Qureshi",
            href: "/leads/10490",
            time: { iso: GALLERY_NOW, absolute: "06 Oct 2026, 2:30 pm IST" },
            day: "Today",
            unread: true,
          },
          ...current,
        ]);
      }}
      now={GALLERY_NOW}
      onNavigate={() => {}}
      loadMore={
        variant === "page" ? (
          <Pagination
            variant="load-more"
            label="Show 20 more"
            state={more}
            onLoadMore={() => {
              setMore("loading");
              window.setTimeout(() => setMore("done"), 900);
            }}
          />
        ) : undefined
      }
    />
  );
}

export function BellSpecimens() {
  const [arrivals, setArrivals] = useState<NewAlert[]>([]);
  const [unread, setUnread] = useState(3);
  return (
    <StateGrid columns={3}>
      <Specimen label="no unread (no badge)">
        <NotificationBell unread={0} form="popover" feed={(id) => <DemoFeed headingId={id} initialFilter="all" />} />
      </Specimen>
      <Specimen label="unread (count badge)" note="Name: “Notifications, 3 unread”. Click to open the feed.">
        <NotificationBell unread={unread} form="popover" arrivals={arrivals} feed={(id) => <DemoFeed headingId={id} />} />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setUnread((count) => count + 1);
            setArrivals((current) => [...current, { id: `a${current.length}`, title: "Lead assigned", lead: "Ananya Rao" }]);
          }}
        >
          Simulate a new alert
        </Button>
      </Specimen>
      <Specimen label="unread above 99" note="“99+”; name “Notifications, 99+ unread”.">
        <NotificationBell unread={128} form="popover" feed={(id) => <DemoFeed headingId={id} />} />
      </Specimen>
      <Specimen label="hover and open" note={`${SIMULATED_NOTE}: data-[state=open]:bg-surface-hover.`}>
        <span className="inline-flex size-control-md items-center justify-center rounded-md bg-surface-hover">
          <StaticPreview className="w-auto">
            <NotificationBell unread={3} form="popover" announce={false} feed={() => null} />
          </StaticPreview>
        </span>
      </Specimen>
      <Specimen label="link (below md)" note="Navigates to /notifications (S24) instead of opening a popover.">
        <NotificationBell unread={3} form="link" feed={() => null} />
      </Specimen>
      <Specimen label="offline" note="The count is frozen; the feed shows its error state.">
        <NotificationBell unread={3} form="popover" feed={(id) => <ErrorFeed headingId={id} />} />
      </Specimen>
    </StateGrid>
  );
}

function ErrorFeed({ headingId }: { headingId: string }) {
  return <NotificationFeed headingId={headingId} items={[]} filter="unread" state="error" onRetry={() => {}} />;
}

export function FeedSpecimens() {
  return (
    <div className="flex flex-col gap-4">
      <StateGrid columns={2}>
        <Specimen label="popover: unread filter, live" surface="surface-raised" stack>
          <div className="w-full max-w-dialog-sm overflow-hidden rounded-lg border border-border">
            <DemoFeed />
          </div>
        </Specimen>
        <Specimen label="popover: all, with new items waiting (“Show 2 new”)" surface="surface-raised" stack>
          <div className="w-full max-w-dialog-sm overflow-hidden rounded-lg border border-border">
            <DemoFeed initialFilter="all" withPending />
          </div>
        </Specimen>
        <Specimen label="loading (3 Skeleton items)" surface="surface-raised" stack>
          <div className="w-full max-w-dialog-sm overflow-hidden rounded-lg border border-border">
            <NotificationFeed items={[]} filter="unread" state="loading" />
          </div>
        </Specimen>
        <Specimen label="error" surface="surface-raised" stack>
          <div className="w-full max-w-dialog-sm overflow-hidden rounded-lg border border-border">
            <NotificationFeed items={[]} filter="all" state="error" onRetry={() => {}} />
          </div>
        </Specimen>
        <Specimen label="empty: Unread (all caught up, all read)" surface="surface-raised" stack>
          <div className="w-full max-w-dialog-sm overflow-hidden rounded-lg border border-border">
            <NotificationFeed items={FEED_ITEMS.map((item) => ({ ...item, unread: false, missed: false }))} filter="unread" />
          </div>
        </Specimen>
        <Specimen label="empty: All and Missed" surface="surface-raised" stack>
          <div className="flex w-full max-w-dialog-sm flex-col gap-3">
            <div className="overflow-hidden rounded-lg border border-border">
              <NotificationFeed items={[]} filter="all" />
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <NotificationFeed items={[]} filter="missed" />
            </div>
          </div>
        </Specimen>
      </StateGrid>
      <Specimen label="page (S24): full width up to max-w-form, load more" surface="bg" stack>
        <DemoFeed variant="page" initialFilter="all" />
      </Specimen>
    </div>
  );
}
