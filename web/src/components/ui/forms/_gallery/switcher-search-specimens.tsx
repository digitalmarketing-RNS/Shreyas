"use client";

import { BarChart3, CalendarDays, LayoutList, List, Mail, MessageCircle, MessageSquare, Table2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Section, SIMULATED_NOTE, Specimen, StateGrid, simulatedFocus } from "@/app/design/_gallery";
import { cn } from "@/lib/cn";
import { ChannelTabs, channelTabClassName } from "../channel-tabs";
import { COUNT_BADGE } from "../control-styles";
import { Field } from "../field";
import { SearchInput } from "../search-input";
import { type ResolvedScope, type SearchScope, resolveScope } from "../search-scope";
import { SegmentedControl, segmentClassName, segmentTrackClassName } from "../segmented-control";
import { Textarea } from "../textarea";
import { KeyboardNote } from "./keyboard-note";
import { LEAD_DIRECTORY } from "./sample-data";

/* -------------------------------------------------------------------------------------------------
 * SegmentedControl
 * -----------------------------------------------------------------------------------------------*/

const VIEWS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

function SegmentPicture({ state }: { state: "hover" | "focus" }) {
  return (
    <span className={segmentTrackClassName("md")} role="img" aria-label={`Calendar view, Week segment ${state === "hover" ? "hovered" : "focused"}`}>
      <span aria-hidden="true" className={cn(segmentClassName("md"), "bg-accent text-on-accent")}>
        Day
      </span>
      <span aria-hidden="true" className={cn(segmentClassName("md"), state === "hover" ? "bg-surface-hover text-fg" : simulatedFocus)}>
        Week
      </span>
      <span aria-hidden="true" className={segmentClassName("md")}>
        Month
      </span>
    </span>
  );
}

export function SegmentedControlSpecimens() {
  return (
    <Section
      id="segmented-control"
      title="SegmentedControl"
      description="Two to five views of the same content, or one short value, all visible. Native radios: Tab enters on the selected segment and the arrow keys move and select. When each option shows a different panel, use Tabs."
    >
      <Section id="segmented-control-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen label="text (S12)">
            <SegmentedControl legend="Calendar view" options={VIEWS} defaultValue="week" />
          </Specimen>
          <Specimen label="icon and text (S22)">
            <SegmentedControl
              legend="Show results as"
              options={[
                { value: "table", label: "Table", icon: <Table2 /> },
                { value: "chart", label: "Chart", icon: <BarChart3 /> },
              ]}
              defaultValue="chart"
            />
          </Specimen>
          <Specimen label="icon only (sr-only label and a tooltip)">
            <SegmentedControl
              legend="Layout"
              iconOnly
              options={[
                { value: "list", label: "List", icon: <List /> },
                { value: "board", label: "Board", icon: <LayoutList /> },
                { value: "calendar", label: "Calendar", icon: <CalendarDays /> },
              ]}
              defaultValue="list"
            />
          </Specimen>
          <Specimen label="with counts">
            <SegmentedControl
              legend="Follow-ups"
              size="sm"
              options={[
                { value: "today", label: "Today", count: 12 },
                { value: "overdue", label: "Overdue", count: 4 },
              ]}
              defaultValue="overdue"
            />
          </Specimen>
          <Specimen label="full width (mobile, narrow panels)">
            <SegmentedControl
              legend="Show as"
              fullWidth
              className="w-full"
              options={[
                { value: "counts", label: "Counts" },
                { value: "percentages", label: "Percentages" },
              ]}
              defaultValue="counts"
            />
          </Specimen>
          <Specimen label="in a sentence (ConditionBuilder, sm)">
            <p className="m-0 flex flex-wrap items-center gap-2 text-sm text-fg">
              <span id="match-before">Leads that match</span>
              <SegmentedControl
                legend="Match"
                labelledBy="match-before match-after"
                size="sm"
                options={[
                  { value: "all", label: "all" },
                  { value: "any", label: "any" },
                ]}
                defaultValue="all"
              />
              <span id="match-after">of these conditions</span>
            </p>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="segmented-control-sizes" title="Sizes" level={3}>
        <StateGrid columns={2}>
          <Specimen label="sm · 32 px track, 28 px segments">
            <SegmentedControl legend="Calendar view" size="sm" options={VIEWS} defaultValue="day" />
          </Specimen>
          <Specimen label="md · 40 px track, 32 px segments">
            <SegmentedControl legend="Calendar view" options={VIEWS} defaultValue="day" />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="segmented-control-states" title="States" level={3}>
        <StateGrid columns={3}>
          <Specimen label="unselected and selected">
            <SegmentedControl legend="Group by" legendHidden options={[{ value: "people", label: "People" }, { value: "teams", label: "Teams" }]} defaultValue="people" />
          </Specimen>
          <Specimen label="hover" note={SIMULATED_NOTE}>
            <SegmentPicture state="hover" />
          </Specimen>
          <Specimen label="focus-visible" note={SIMULATED_NOTE}>
            <SegmentPicture state="focus" />
          </Specimen>
          <Specimen label="disabled segment (skipped by the arrows)">
            <SegmentedControl
              legend="Calendar view"
              legendHidden
              options={[VIEWS[0], { ...VIEWS[1], disabled: true }, VIEWS[2]]}
              defaultValue="day"
            />
          </Specimen>
          <Specimen label="disabled control">
            <SegmentedControl legend="Calendar view" legendHidden options={VIEWS} defaultValue="month" disabled />
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Tab"], action: "Enters on the selected segment; the next Tab leaves." },
          { keys: ["ArrowLeft", "ArrowRight"], action: "Move and select; disabled segments are skipped." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * ChannelTabs
 * -----------------------------------------------------------------------------------------------*/

function TabPicture({ state }: { state: "inactive" | "hover" | "active" | "focus" | "unavailable" | "draft" }) {
  const icon = state === "draft" ? <MessageCircle /> : state === "unavailable" ? <MessageSquare /> : <Mail />;
  const label = state === "draft" ? "WhatsApp" : state === "unavailable" ? "SMS" : "Email";
  return (
    <div className="flex border-b border-border">
      <span
        role="img"
        aria-label={`${label} tab, ${state}`}
        data-state={state === "active" || state === "focus" ? "active" : "inactive"}
        className={cn(
          channelTabClassName,
          "h-control-md px-3",
          state === "hover" && "bg-surface-hover text-fg",
          state === "focus" && cn(simulatedFocus, "outline-offset-(--focus-inset)"),
        )}
      >
        <span aria-hidden="true" className="inline-flex">
          {icon}
        </span>
        <span aria-hidden="true">{label}</span>
        {state === "active" || state === "focus" ? (
          <span aria-hidden="true" className={cn(COUNT_BADGE, "bg-accent-subtle text-fg")}>
            24
          </span>
        ) : null}
        {state === "unavailable" ? <TriangleAlert aria-hidden="true" className="text-warning" /> : null}
        {state === "draft" ? <span aria-hidden="true" className="size-1.5 rounded-pill bg-accent" /> : null}
      </span>
    </div>
  );
}

function Composer({ label, sms = false }: { label: string; sms?: boolean }) {
  return (
    <Field label={label}>
      <Textarea sms={sms} defaultValue={sms ? "" : undefined} />
    </Field>
  );
}

export function ChannelTabsSpecimens() {
  return (
    <Section
      id="channel-tabs"
      title="ChannelTabs"
      description="Switches a composer or a list between Email, SMS and WhatsApp, and shows when a channel can't be used. Automatic activation; every panel stays mounted, so each channel keeps its own draft. Generic icons only, never a channel's logo."
    >
      <Section id="channel-tabs-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen label="composer tabs (S10): SMS unavailable, a WhatsApp draft" className="sm:col-span-2">
            <ChannelTabs
              className="w-full"
              defaultValue="whatsapp"
              tabs={[
                { channel: "email", content: <Composer label="Email message" /> },
                {
                  channel: "sms",
                  unavailable: "Ananya opted out of SMS on 02 Oct 2026. You can't send SMS to her.",
                  content: <p className="m-0 text-sm text-muted">Choose Email or WhatsApp instead.</p>,
                },
                {
                  channel: "whatsapp",
                  draft: true,
                  unavailable: "Her last WhatsApp reply was more than 24 hours ago, so you can only send an approved template.",
                  content: <Composer label="WhatsApp message" />,
                },
              ]}
            />
          </Specimen>
          <Specimen label="list tabs with counts (S19)">
            <ChannelTabs
              className="w-full"
              tabs={[
                { channel: "email", count: 24, countNoun: "templates", content: <p className="m-0 text-sm text-fg">24 email templates</p> },
                { channel: "sms", count: 9, countNoun: "templates", content: <p className="m-0 text-sm text-fg">9 SMS templates</p> },
                { channel: "whatsapp", count: 6, countNoun: "templates", content: <p className="m-0 text-sm text-fg">6 WhatsApp templates</p> },
              ]}
            />
          </Specimen>
          <Specimen label="compact (sm, S08 messages filter); SMS not set up">
            <ChannelTabs
              size="sm"
              className="w-full"
              tabs={[
                { channel: "email", content: <p className="m-0 text-sm text-fg">3 emails</p> },
                {
                  channel: "sms",
                  unavailable: "SMS isn't set up yet. An admin can connect an SMS provider in Settings > Channels.",
                  content: null,
                },
              ]}
            />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="channel-tabs-sizes" title="Sizes" level={3} description="md: 40 px tabs (composers, lists); sm: 32 px (the compact filter above). Both at least 48 px wide.">
        <StateGrid columns={2}>
          <Specimen label="md · 40 px">
            <ChannelTabs className="w-full" tabs={[{ channel: "email", content: null }, { channel: "whatsapp", content: null }]} />
          </Specimen>
          <Specimen label="sm · 32 px">
            <ChannelTabs size="sm" className="w-full" tabs={[{ channel: "email", content: null }, { channel: "whatsapp", content: null }]} />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="channel-tabs-states" title="States" level={3} description="Still pictures of one tab each.">
        <StateGrid columns={3}>
          <Specimen label="inactive">
            <TabPicture state="inactive" />
          </Specimen>
          <Specimen label="hover" note={SIMULATED_NOTE}>
            <TabPicture state="hover" />
          </Specimen>
          <Specimen label="active (2 px accent bar, count badge)">
            <TabPicture state="active" />
          </Specimen>
          <Specimen label="focus-visible (inset ring)" note={SIMULATED_NOTE}>
            <TabPicture state="focus" />
          </Specimen>
          <Specimen label="unavailable (still selectable; the panel explains)">
            <TabPicture state="unavailable" />
          </Specimen>
          <Specimen label="with draft">
            <TabPicture state="draft" />
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Tab"], action: "Enters the tab list on the active tab; the next Tab moves into the panel." },
          { keys: ["ArrowLeft", "ArrowRight"], action: "Move and activate." },
          { keys: ["Home", "End"], action: "First and last tab." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * SearchInput
 * -----------------------------------------------------------------------------------------------*/

const SCOPE_WORDS: Record<ResolvedScope, string> = { name: "name", email: "email", mobile: "mobile", lead: "lead number", api: "API ID" };

function LiveSearchDemo() {
  const [status, setStatus] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<typeof LEAD_DIRECTORY>([]);
  const run = (query: string, scope: SearchScope) => {
    if (!query) {
      setResults([]);
      setStatus("");
      return;
    }
    setSearching(true);
    window.setTimeout(() => {
      const term = query.toLowerCase().replace(/^#/, "");
      const found = LEAD_DIRECTORY.filter((lead) => lead.label.toLowerCase().includes(term) || (lead.description ?? "").toLowerCase().includes(term));
      setResults(found.slice(0, 5));
      setSearching(false);
      setStatus(found.length === 0 ? `No leads match “${query}”.` : `${found.length} ${found.length === 1 ? "lead" : "leads"} found (searched by ${SCOPE_WORDS[resolveScope(query, scope)]})`);
    }, 700);
  };
  return (
    <div className="flex w-full flex-col gap-2">
      <SearchInput label="Search leads" withScope onSearch={run} searching={searching} className="w-full max-w-md" />
      <p role="status" className="m-0 text-xs text-muted">
        {status}
      </p>
      {results.length > 0 ? (
        <ul className="m-0 flex list-none flex-col p-0 text-sm text-fg">
          {results.map((lead) => (
            <li key={lead.value} className="flex justify-between gap-2 border-b border-border py-1 last:border-b-0">
              <span>{lead.label}</span>
              <span className="text-xs text-muted">{lead.description}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function SearchInputSpecimens() {
  return (
    <Section
      id="search-input"
      title="SearchInput"
      description="Find records as you type: 300 ms debounce, Enter searches at once. Name search starts at 2 characters; email, mobile and ID searches at any length. The list's own status region announces the count."
    >
      <Section id="search-input-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen label="page search (sm, w-72, “/” shortcut)" note="Try it: press / anywhere outside a text field">
            <SearchInput label="Search templates" shortcut className="w-72 max-w-full" />
          </Specimen>
          <Specimen label="with scope picker (S05), live" note="Try it: “Diya”, “#10412”, “98765 43210”">
            <LiveSearchDemo />
          </Specimen>
          <Specimen label="in a panel (S15, full width)">
            <SearchInput label="Search chats" size="md" className="w-full" />
          </Specimen>
          <Specimen label="in a popover (Esc on an empty field closes the popover)">
            <div className="w-full rounded-lg border border-border bg-surface-raised p-1 shadow-pop">
              <SearchInput label="Search columns" inPopover className="w-full" />
            </div>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="search-input-sizes" title="Sizes" level={3}>
        <StateGrid columns={2}>
          <Specimen label="sm · 32 px, icon 10 px from the left">
            <SearchInput label="Search people" size="sm" className="w-72 max-w-full" />
          </Specimen>
          <Specimen label="md · 40 px">
            <SearchInput label="Search people" size="md" className="w-72 max-w-full" />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="search-input-states" title="States" level={3}>
        <StateGrid columns={3}>
          <Specimen label="empty (placeholder)">
            <SearchInput label="Search leads" className="w-full" />
          </Specimen>
          <Specimen label="typing (clear button)">
            <SearchInput label="Search leads" defaultValue="kav" className="w-full" />
          </Specimen>
          <Specimen label="searching (spinner after 300 ms)">
            <SearchInput label="Search leads" defaultValue="kavya" searching className="w-full" />
          </Specimen>
          <Specimen label="results (the list announces the count)" stack>
            <SearchInput label="Search leads" defaultValue="Pune" className="w-full" />
            <p className="m-0 text-xs text-muted">24 leads found</p>
          </Specimen>
          <Specimen label="no results" stack>
            <SearchInput label="Search leads" defaultValue="kavya" className="w-full" />
            <p className="m-0 text-xs text-muted">No leads match “kavya”.</p>
          </Specimen>
          <Specimen label="error" stack>
            <SearchInput label="Search the audit log" defaultValue="refund" className="w-full" />
            <p className="m-0 text-xs text-fg">Couldn&apos;t search. Try again.</p>
          </Specimen>
          <Specimen label="disabled">
            <SearchInput label="Search leads" disabled className="w-full" />
          </Specimen>
          <Specimen label="focus-visible" note={SIMULATED_NOTE}>
            <SearchInput label="Search leads" defaultValue="Ira" className={cn("w-full", "[&>div]:outline-2 [&>div]:outline-offset-2 [&>div]:outline-focus-ring [&>div]:outline-solid")} />
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["/"], action: "Focuses the page search when focus is not in a text field (when shortcuts are on)." },
          { keys: ["Enter"], action: "Searches now." },
          { keys: ["Esc"], action: "Clears a non-empty field. On an empty field it does nothing, except in a popover, which it closes." },
          { keys: ["Tab"], action: "Moves to the clear button and the scope picker." },
        ]}
      />
    </Section>
  );
}
