"use client";

import { Mail, MessageCircle, MessageSquare, TriangleAlert } from "lucide-react";
import { Tabs } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { COUNT_BADGE } from "./control-styles";
import { InlineAlert } from "./inline-alert";

export type Channel = "email" | "sms" | "whatsapp";

export type ChannelTab = {
  channel: Channel;
  /** A count badge: "Email, 24 templates". */
  count?: number;
  /** What the count counts, for the name ("templates"). */
  countNoun?: string;
  /**
   * Why the channel can't be used now; the tab stays selectable and the panel explains. A channel
   * the institution does not use at all is left out, not marked unavailable.
   */
  unavailable?: string;
  /** The person has unsent text in this channel. */
  draft?: boolean;
  /** The panel: that channel's composer, or its list. */
  content: ReactNode;
};

export type ChannelTabsProps = {
  tabs: ChannelTab[];
  /** The lead's preferred channel, or else the institution's default, opens first. */
  defaultValue?: Channel;
  value?: Channel;
  onValueChange?: (channel: Channel) => void;
  /** md: 40 px tabs (composers, lists). sm: 32 px (S08 messages filter). */
  size?: "sm" | "md";
  className?: string;
};

const LABEL: Record<Channel, string> = { email: "Email", sms: "SMS", whatsapp: "WhatsApp" };
const ICON: Record<Channel, ReactNode> = {
  email: <Mail />,
  sms: <MessageSquare />,
  whatsapp: <MessageCircle />,
};

/** The tab look in each state, shared with the gallery's still pictures. */
export const channelTabClassName = cn(
  "relative inline-flex min-w-12 items-center gap-2 rounded-t-md text-sm font-medium text-muted transition-colors duration-fast hover:bg-surface-hover hover:text-fg focus-inset",
  "data-[state=active]:text-fg data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:-bottom-0.5 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-accent",
  "[&_svg]:size-icon-sm [&_svg]:shrink-0",
);

/**
 * Switches a composer or a list between Email, SMS and WhatsApp, and shows when a channel can't be
 * used (components.md ChannelTabs). Radix Tabs with automatic activation: Left and Right move and
 * activate, Home and End jump, the next Tab moves into the panel. Each channel keeps its own draft
 * because every panel stays mounted. Generic Lucide icons, never a channel's logo.
 *
 * Unavailable, counts and drafts are part of each tab's name ("SMS, unavailable"), never colour
 * alone.
 */
export function ChannelTabs({ tabs, defaultValue, value, onValueChange, size = "md", className }: ChannelTabsProps) {
  return (
    <Tabs.Root
      defaultValue={defaultValue ?? tabs[0]?.channel}
      value={value}
      onValueChange={(next) => onValueChange?.(next as Channel)}
      activationMode="automatic"
      className={cn("flex flex-col", className)}
    >
      <Tabs.List aria-label="Channel" className="flex items-end gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => {
          const extras = [
            tab.count !== undefined ? `${tab.count} ${tab.countNoun ?? (tab.count === 1 ? "item" : "items")}` : null,
            tab.unavailable ? "unavailable" : null,
            tab.draft ? "unsent draft" : null,
          ].filter(Boolean);
          return (
            <Tabs.Trigger
              key={tab.channel}
              value={tab.channel}
              className={cn(channelTabClassName, size === "sm" ? "h-control-sm px-2" : "h-control-md px-3", "group/tab")}
            >
              <span aria-hidden="true" className="inline-flex">
                {ICON[tab.channel]}
              </span>
              <span>{LABEL[tab.channel]}</span>
              {extras.length > 0 ? <span className="sr-only">, {extras.join(", ")}</span> : null}
              {tab.count !== undefined ? (
                <span
                  aria-hidden="true"
                  className={cn(COUNT_BADGE, "bg-surface-sunken text-fg group-data-[state=active]/tab:bg-accent-subtle")}
                >
                  {tab.count}
                </span>
              ) : null}
              {tab.unavailable ? <TriangleAlert aria-hidden="true" className="text-warning" /> : null}
              {tab.draft ? <span aria-hidden="true" className="size-1.5 rounded-pill bg-accent" /> : null}
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Content key={tab.channel} value={tab.channel} forceMount className="pt-4 data-[state=inactive]:hidden">
          {tab.unavailable ? (
            <InlineAlert tone="warning" className="mb-4">
              {tab.unavailable}
            </InlineAlert>
          ) : null}
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
