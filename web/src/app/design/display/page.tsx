import type { Metadata } from "next";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/display/avatar";
import { AvatarGroup } from "@/components/ui/display/avatar-group";
import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/display/card";
import { DateText } from "@/components/ui/display/date-text";
import { DescriptionList } from "@/components/ui/display/description-list";
import { MaskedValue } from "@/components/ui/display/masked-value";
import { Money } from "@/components/ui/display/money";
import { NumberText } from "@/components/ui/display/number-text";
import { PhoneText } from "@/components/ui/display/phone-text";
import { RelativeTime } from "@/components/ui/display/relative-time";
import { StatusPill } from "@/components/ui/display/status-pill";
import {
  CATEGORY_LABELS,
  ENUM_LABELS,
  STATUS_DOMAINS,
  STATUS_SECTIONS,
  STATUS_VOCABULARY,
  type StatusDomainDefinition,
  type StatusEntry,
} from "@/components/ui/display/status-vocabulary";
import { Alert } from "@/components/ui/feedback/alert";
import { EmptyState } from "@/components/ui/feedback/empty-state";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { cn } from "@/lib/cn";
import { SIMULATED_NOTE, GalleryPage, Section, Specimen, StateGrid, simulatedFocus } from "../_gallery";
import { KeyboardNotes } from "../shell/_kit/keyboard-notes";
import { GALLERY_NOW, PEOPLE } from "../shell/_kit/sample-data";
import { StaticPreview } from "../shell/_kit/static-preview";
import { MaskedValueSpecimens, StepperSpecimens } from "./_parts/display-live";

export const metadata: Metadata = { title: "Display" };

const LABEL_PARAMS: Record<string, string> = { timeLeft: "4 hr 10 min", time: "07 Oct, 1:40 pm IST" };

function VocabularyCell({ domain, value, entry }: { domain: string; value: string; entry: StatusEntry }) {
  const display = entry.display ?? "pill";
  if (display === "none") return <span className="text-xs text-muted">(no pill)</span>;
  if (display === "badge") return <Badge variant={entry.tone === "warning" ? "tag-warning" : "tag"}>{entry.label}</Badge>;
  if (display === "dot") {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-fg">
        <Badge variant="dot" />
        {entry.label}
      </span>
    );
  }
  return <StatusPill domain={domain as "jobs.status"} value={value} params={LABEL_PARAMS} />;
}

function VocabularyTable({ section }: { section: (typeof STATUS_SECTIONS)[number] }) {
  const domains = STATUS_DOMAINS.filter((domain) => STATUS_VOCABULARY[domain].section === section);
  return (
    <div role="region" aria-label={`${section} statuses`} tabIndex={0} className="w-full overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-176 border-collapse text-left text-table">
        <caption className="sr-only">{`${section}: source, value, pill and note`}</caption>
        <thead>
          <tr className="h-row-header border-b border-border bg-surface-subtle">
            <th scope="col" className="px-3 text-xs font-medium text-muted">
              Source
            </th>
            <th scope="col" className="px-3 text-xs font-medium text-muted">
              Value
            </th>
            <th scope="col" className="px-3 text-xs font-medium text-muted">
              Filled
            </th>
            <th scope="col" className="px-3 text-xs font-medium text-muted">
              Plain
            </th>
            <th scope="col" className="px-3 text-xs font-medium text-muted">
              Note
            </th>
          </tr>
        </thead>
        <tbody>
          {domains.map((domain) => {
            const definition: StatusDomainDefinition = STATUS_VOCABULARY[domain];
            const values = Object.entries(definition.values);
            return values.map(([value, entry], index) => (
              <tr key={`${domain}-${value}`} className="border-b border-border align-top last:border-b-0">
                {index === 0 ? (
                  <th scope="row" rowSpan={values.length} className="px-3 py-2 font-mono text-xs font-normal break-words text-fg">
                    {definition.source}
                    {definition.aliases ? (
                      <span className="mt-1 block font-sans text-muted">
                        {`Also: ${Object.entries(definition.aliases)
                          .map(([alias, target]) => `${alias} → ${target}`)
                          .join(", ")}`}
                      </span>
                    ) : null}
                  </th>
                ) : null}
                <td className="px-3 py-2 font-mono text-xs text-muted">{value}</td>
                <td className="px-3 py-2">
                  <VocabularyCell domain={domain} value={value} entry={entry} />
                </td>
                <td className="px-3 py-2">
                  {(entry.display ?? "pill") === "pill" ? <StatusPill domain={domain as "jobs.status"} value={value} params={LABEL_PARAMS} variant="plain" /> : null}
                </td>
                <td className="px-3 py-2 text-xs leading-prose text-muted">{entry.note}</td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Page() {
  return (
    <GalleryPage
      title="Display"
      description="Cards, description lists, steppers, avatars, badges, status pills, masked values and the formatters for money, numbers, dates, times and phone numbers (components.md, group 2: Display and Formatters). Formatters run on the server with en-IN and Asia/Kolkata; “now” in these specimens is 06 Oct 2026, 2:30 pm IST."
    >
      <Section id="card" title="Card" description="A bordered box that groups one piece of a page. Never on surface-subtle and never inside another card.">
        <StateGrid columns={3}>
          <Card title="Follow-ups due today" titleLevel={3} description="3 calls and 1 campus visit." actions={<Button variant="secondary" size="sm">View all</Button>}>
            <p className="m-0 text-sm text-fg">The first is at 10:00 am IST with Ananya Rao.</p>
          </Card>
          <Card variant="standalone" title="Sign in to Lakeview College" titleLevel={3} padding={6}>
            <p className="m-0 text-sm text-muted">standalone: one card alone on the canvas adds shadow-card.</p>
          </Card>
          <Card variant="flush" title="Sending numbers" titleLevel={3} footer={<Button variant="link">Manage channels</Button>}>
            <ul className="m-0 list-none p-0 text-sm">
              <li className="border-b border-border px-4 py-3 text-fg">+91 80 2612 3456 · WhatsApp</li>
              <li className="px-4 py-3 text-fg">LKVIEW · SMS header</li>
            </ul>
          </Card>
          <Card variant="interactive" href="#card" title="Fees collected" titleLevel={3}>
            <p className="m-0 text-sm text-muted">interactive, heading link: the link's ::after covers the card; one tab stop.</p>
          </Card>
          <Card variant="interactive" href="#card" label="Leads this week: 1,240. Open the attribution report">
            <p className="m-0 text-xs font-medium text-muted">Leads this week</p>
            <p className="m-0 text-display text-fg">1,240</p>
            <p className="m-0 text-xs text-muted">interactive, whole card: one link with a written-out name.</p>
          </Card>
          <Specimen label="interactive: hover and focus-visible" note={SIMULATED_NOTE} surface="bg" stack>
            <StaticPreview className="flex flex-col gap-3">
              <div className="rounded-lg border border-strong bg-surface p-4 text-md text-fg">Fees collected</div>
              <div className={cn("rounded-lg border border-border bg-surface p-4 text-md text-fg", simulatedFocus)}>Fees collected</div>
            </StaticPreview>
          </Specimen>
          <Card title="Payments" titleLevel={3}>
            <div aria-busy="true" className="flex flex-col gap-1">
              <Skeleton width="80%" />
              <Skeleton width="60%" />
              <Skeleton width="70%" />
            </div>
            <p className="mt-2 mb-0 text-xs text-muted">loading: a Skeleton of the same size; the header is kept.</p>
          </Card>
          <Card title="Opportunities" titleLevel={3}>
            <EmptyState size="compact" variant="first-use" title="No other interests" body="Add one when the student is also interested in another programme or campus." headingLevel={4} />
          </Card>
          <Card title="Payments" titleLevel={3}>
            <Alert tone="danger" title="Couldn't load payments">
              Check your connection and try again. Ref: 5TG1-90
            </Alert>
          </Card>
        </StateGrid>
        <KeyboardNotes items={[["Tab", "The card is not focusable, except the whole-card link. An interactive card is one tab stop."]]} />
      </Section>

      <Section id="description-list" title="DescriptionList" description="Read-only facts as label and value pairs. Long values wrap and are never truncated.">
        <StateGrid columns={2}>
          <Specimen label="stacked grid (1 to 3 columns)" stack>
            <DescriptionList
              className="w-full"
              items={[
                { label: "Mobile number", value: <PhoneText value="+919876543210" /> },
                { label: "Course", value: "B.Tech Computer Science" },
                { label: "City", value: "Pune" },
                { label: "Created", value: <DateText value="2026-10-03T05:30:00Z" /> },
                { label: "Owner", value: "Priya Nair" },
                { label: "Amount paid", value: <Money value="100000" /> },
              ]}
            />
          </Specimen>
          <Specimen label="side by side (S08 details, S38 audit entry)" note="From md the label column is 200 px, the same as Field's key-value row." stack>
            <DescriptionList
              variant="side-by-side"
              className="w-full"
              items={[
                { label: "Name", value: "తేజస్విని రెడ్డి", userEntered: true },
                { label: "Mobile number", value: <MaskedValue kind="phone" masked="+91 ••••• •3210" hint="3210" /> },
                { label: "Alternate mobiles", value: [<PhoneText key="1" value="+919845012345" />, <PhoneText key="2" value="+914426123456" kind="landline" />] },
                { label: "Stage", value: <StatusPill domain="opportunities.status" value="open" /> },
                { label: "Guardian's email", value: null },
                {
                  label: "Address",
                  value: "Flat 402, Sai Krupa Residency, 14th Cross, Indiranagar 2nd Stage, Bengaluru, Karnataka 560038",
                  userEntered: true,
                },
              ]}
            />
          </Specimen>
          <Specimen label="counts (JobProgress, import results)" stack>
            <DescriptionList
              variant="counts"
              className="w-full"
              items={[
                { label: "Requested", value: "1,240" },
                { label: "Created", value: "1,180" },
                { label: "Updated", value: "20" },
                { label: "Failed", value: "20", valueClassName: "text-danger" },
                { label: "Skipped", value: "20" },
              ]}
            />
          </Specimen>
          <Specimen label="loading" note="A Skeleton line per value; the labels stay real." stack>
            <DescriptionList loading columns={2} className="w-full" items={[{ label: "Mobile number" }, { label: "Course" }, { label: "City" }, { label: "Owner" }]} />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="stepper" title="Stepper" description="The steps of a task, where the person is, and which steps are done or have a problem. State is an sr-only word, never shape or colour alone.">
        <StepperSpecimens />
        <KeyboardNotes
          items={[
            ["Tab", "Reaches the done-step buttons only."],
            ["Enter or Space", "Goes back to that step, keeping every value."],
            ["Step change", "The page moves focus to the new step's heading (h2, tabindex=-1)."],
          ]}
        />
      </Section>

      <Section id="avatar" title="Avatar" description="A small marker for a person or an institution. Initials only (no photos in v1); no per-person colours.">
        <StateGrid columns={4}>
          <Specimen label="person: sm, md, lg">
            <Avatar name="Ananya Rao" size="sm" />
            <Avatar name="Ananya Rao" size="md" />
            <Avatar name="Ananya Rao" size="lg" />
          </Specimen>
          <Specimen label="you (accent-subtle)">
            <Avatar name="Priya Nair" size="sm" variant="you" />
            <Avatar name="Priya Nair" size="md" variant="you" />
            <Avatar name="Priya Nair" size="lg" variant="you" />
          </Specimen>
          <Specimen label="inactive member" note="The name shows “(inactive)”.">
            <Avatar name="Rahul Verma" size="md" variant="inactive" />
            <span className="text-sm text-fg">Rahul Verma (inactive)</span>
          </Specimen>
          <Specimen label="unassigned">
            <Avatar variant="unassigned" size="sm" />
            <Avatar variant="unassigned" size="md" standalone />
            <span className="text-sm text-muted">Unassigned</span>
          </Specimen>
          <Specimen label="institution (rounded square)">
            <Avatar name="Lakeview College" size="sm" variant="institution" />
            <Avatar name="Lakeview College" size="md" variant="institution" />
            <Avatar name="Lakeview College" size="lg" variant="institution" />
          </Specimen>
          <Specimen label="with presence (checked in)" note="Alone: role=img named “Asha Menon, checked in”, with a tooltip.">
            <Avatar name="Asha Menon" size="md" presence standalone />
            <Avatar name="Asha Menon" size="lg" presence standalone />
          </Specimen>
          <Specimen label="other scripts" note="First grapheme of the first word.">
            <Avatar name={PEOPLE.aditi.name} size="md" standalone />
            <Avatar name={PEOPLE.srinivas.name} size="md" standalone />
            <Avatar name={PEOPLE.soumitra.name} size="md" standalone />
            <Avatar name={PEOPLE.zainab.name} size="md" standalone />
            <Avatar name={PEOPLE.tamilselvi.name} size="md" standalone />
          </Specimen>
          <Specimen label="as a button (hover, focus from the button)" note={SIMULATED_NOTE}>
            <StaticPreview className="flex w-auto gap-2">
              <span className="inline-flex size-control-md items-center justify-center rounded-md bg-surface-hover">
                <Avatar name="Priya Nair" variant="you" />
              </span>
              <span className={cn("inline-flex size-control-md items-center justify-center rounded-md", simulatedFocus)}>
                <Avatar name="Priya Nair" variant="you" />
              </span>
            </StaticPreview>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="avatar-group" title="AvatarGroup" description="Several people in little space, with the full list one click away. Read once and in full through the group's name.">
        <StateGrid columns={3}>
          <Specimen label="owners with overflow (md)" note="Name: “Owners: Priya Nair (primary), Vikram Shah and 2 more”. “+2” opens the list.">
            <AvatarGroup
              people={[
                { ...PEOPLE.priya, primary: true, you: true },
                { ...PEOPLE.vikram, checkedIn: true },
                PEOPLE.asha,
                { ...PEOPLE.farhan, checkedIn: true },
                PEOPLE.gurpreet,
              ]}
            />
          </Specimen>
          <Specimen label="owners (sm, table rows)">
            <AvatarGroup size="sm" people={[{ ...PEOPLE.vikram, primary: true }, PEOPLE.asha]} />
          </Specimen>
          <Specimen label="team members (S34)">
            <AvatarGroup kind="members" people={[PEOPLE.asha, PEOPLE.aditi, PEOPLE.srinivas, PEOPLE.soumitra]} />
          </Specimen>
          <Specimen label="unassigned">
            <AvatarGroup people={[]} />
          </Specimen>
          <Specimen label="in a hovered row" note="The ring follows the row fill." stack>
            <div className="group w-full rounded-md bg-surface-hover p-2">
              <AvatarGroup size="sm" ring="hover-row" people={[{ ...PEOPLE.priya, primary: true }, PEOPLE.vikram, PEOPLE.asha, PEOPLE.farhan]} />
            </div>
          </Specimen>
          <Specimen label="in a selected row" stack>
            <div className="w-full rounded-md bg-accent-subtle p-2">
              <AvatarGroup size="sm" ring="selected-row" people={[{ ...PEOPLE.priya, primary: true }, PEOPLE.vikram]} />
            </div>
          </Specimen>
        </StateGrid>
        <KeyboardNotes items={[["Tab", "Only the overflow button is focusable; Enter or Space opens the list; Esc closes it."]]} />
      </Section>

      <Section id="badge" title="Badge" description="A small label for a count or a fixed attribute. Not for lifecycle state (that is StatusPill). Counts cap at 99+; 0 is not shown.">
        <StateGrid columns={4}>
          <Specimen label="count neutral">
            <Badge variant="count" count={4} />
            <Badge variant="count" count={128} />
          </Specimen>
          <Specimen label="count accent" surface="surface">
            <Badge variant="count-accent" count={12} />
          </Specimen>
          <Specimen label="count danger (the bell)">
            <Badge variant="count-danger" count={3} />
          </Specimen>
          <Specimen label="dot" note="Never alone without a name or tooltip.">
            <Badge variant="dot" />
            <span className="text-sm text-fg">Inbox has items</span>
          </Specimen>
          <Specimen label="tag neutral">
            {["Promotional", "Transactional", "Service", "Default", "Shared", "Primary", "Required", "Imported", "Under 18", "Personal data", "Health data", "API"].map((word) => (
              <Badge key={word}>{word}</Badge>
            ))}
          </Specimen>
          <Specimen label="tag outline (dense tables, selected rows)">
            <Badge variant="tag-outline">Promotional</Badge>
            <Badge variant="tag-outline">Transactional</Badge>
            <Badge variant="tag-outline">Service</Badge>
          </Specimen>
          <Specimen label="tag warning (“Test mode” only)">
            <Badge variant="tag-warning">Test mode</Badge>
          </Specimen>
          <Specimen label="count of 0" note="Renders nothing.">
            <Badge variant="count" count={0} />
            <span className="text-sm text-muted">(nothing shows)</span>
          </Specimen>
        </StateGrid>
      </Section>

      <Section
        id="status-pill"
        title="StatusPill"
        description="A record's state with a label, an icon and a tone from one shared vocabulary. The label carries the meaning, the icon repeats it in shape, the tone is the third cue."
      >
        <StateGrid columns={3}>
          <Specimen label="filled (tables and lists)">
            <StatusPill domain="payments.status" value="success" />
            <StatusPill domain="messages.status" value="delivered" />
            <StatusPill domain="templates.wa_status" value="PENDING" />
            <StatusPill domain="messages.status" value="failed" />
            <StatusPill domain="broadcasts.status" value="draft" />
          </Specimen>
          <Specimen label="plain (surface, raised, bg or hover only)">
            <StatusPill domain="payments.status" value="success" variant="plain" />
            <StatusPill domain="refunds.status" value="requested" variant="plain" />
            <StatusPill domain="incidents.status" value="open" variant="plain" />
            <StatusPill domain="members.status" value="inactive" variant="plain" />
          </Specimen>
          <Specimen label="with detail">
            <StatusPill domain="messages.status" value="failed" detail="Number isn't on WhatsApp" />
          </Specimen>
          <Specimen label="with tooltip" note="Focusable (tabindex=0) when not inside a focusable parent.">
            <StatusPill domain="messages.status" value="delivered" tooltip="Delivered 06 Oct, 2:31 pm IST" />
            <StatusPill domain="broadcasts.status" value="scheduled" tooltip="07 Oct, 10:00 am IST" />
          </Specimen>
          <Specimen label="direct tone, label and icon">
            <StatusPill tone="neutral" label="Read-only" />
          </Specimen>
          <Specimen label="unknown value" note="Neutral, CircleQuestionMark, “Unknown ({raw})”, logged; never breaks the page.">
            <StatusPill domain="templates.wa_status" value="ARCHIVED_BY_POLICY" />
          </Specimen>
          <Specimen label="in a selected row" note="Rows that can be selected use the filled form (tone text has no accent-subtle pair)." stack>
            <div className="w-full rounded-md bg-accent-subtle p-2">
              <StatusPill domain="payments.status" value="pending" />
            </div>
          </Specimen>
          <Specimen label="in a hovered row" stack>
            <div className="flex w-full gap-3 rounded-md bg-surface-hover p-2">
              <StatusPill domain="calls.status" value="missed" />
              <StatusPill domain="calls.status" value="completed" variant="plain" />
            </div>
          </Specimen>
        </StateGrid>
        <Section id="status-vocabulary" level={3} title="Status vocabulary" description="Every domain, value, label, tone and icon, from the one typed map (status-vocabulary.ts). Derived rows are computed by the server.">
          <div className="flex flex-col gap-6">
            {STATUS_SECTIONS.map((section) => (
              <div key={section} className="flex flex-col gap-2">
                <h4 className="m-0 text-sm font-semibold text-fg">{section}</h4>
                <VocabularyTable section={section} />
              </div>
            ))}
          </div>
        </Section>
        <Section id="enum-labels" level={3} title="Labels for other enums and categories" description="Plain text, never raw keys and never pills. Categories show as Badge tags.">
          <StateGrid columns={3}>
            {Object.entries(ENUM_LABELS).map(([source, labels]) => (
              <Specimen key={source} label={source} stack>
                <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-xs">
                  {Object.entries(labels).map(([key, label]) => (
                    <Fragment key={key}>
                      <dt className="font-mono text-muted">{key}</dt>
                      <dd className="m-0 text-fg">{label}</dd>
                    </Fragment>
                  ))}
                </dl>
              </Specimen>
            ))}
            {Object.entries(CATEGORY_LABELS).map(([source, labels]) => (
              <Specimen key={source} label={`${source} (Badge tags)`}>
                {Object.values(labels).map((label) => (
                  <Badge key={label}>{label}</Badge>
                ))}
              </Specimen>
            ))}
          </StateGrid>
        </Section>
      </Section>

      <Section id="masked-value" title="MaskedValue" description="A lead's phone number or email when the role may not see it in full, with an on-purpose reveal recorded in the audit log. Masking happens on the server.">
        <MaskedValueSpecimens />
        <KeyboardNotes
          items={[
            ["Tab", "Reaches Show (then Hide and Copy after reveal)."],
            ["Enter or Space", "Reveals; focus stays on the same button, which becomes Hide."],
          ]}
        />
      </Section>

      <Section id="money" title="Money" description="Integer paise, exact, in Indian grouping, with no floating point. Formatted on the server.">
        <StateGrid columns={4}>
          <Specimen label="exact" stack>
            <Money value="123456789" />
            <Money value="100000" />
            <Money value="2500000" />
          </Specimen>
          <Specimen label="zero and missing" stack>
            <Money value="0" />
            <Money value={null} />
          </Specimen>
          <Specimen label="compact (KPI tiles, axes)" note="Focusable; the tooltip and the accessible text give the exact amount." stack>
            <Money value="15000000" variant="compact" className="text-display font-bold" />
            <Money value="1230000000" variant="compact" />
            <Money value="123456789" variant="compact" />
          </Specimen>
          <Specimen label="signed (refunds)" note="A minus sign and a word, never a minus alone." stack>
            <Money value="50000" variant="signed" />
            <span className="text-sm text-fg">
              <Money value="50000" /> of <Money value="100000" /> refunded
            </span>
          </Specimen>
          <Specimen label="other currency" stack>
            <Money value="12000" currency="USD" />
          </Specimen>
          <Specimen label="in a table (right-aligned)" stack>
            <span className="block w-full text-right text-table">
              <Money value="2500000" />
            </span>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="number-text" title="NumberText" description="Counts, percentages and changes in Indian grouping, with exact values behind any short form.">
        <StateGrid columns={4}>
          <Specimen label="count" stack>
            <NumberText value={12480} unit="leads" />
            <NumberText value={12345678} />
            <NumberText value={0} />
          </Specimen>
          <Specimen label="compact" stack>
            <NumberText variant="compact" value={1200000} className="text-display font-bold" />
            <NumberText variant="compact" value={12000000} />
          </Specimen>
          <Specimen label="percent" stack>
            <NumberText variant="percent" value={0.1234} />
            <span className="text-sm text-muted">
              <NumberText variant="percent" part={640} whole={1240} /> (640 of 1,240)
            </span>
            <NumberText variant="percent" part={0} whole={0} />
          </Specimen>
          <Specimen label="score" note="Hidden for leads under 18 (no scoring)." stack>
            <NumberText variant="score" score={42} topPercent={12} />
          </Specimen>
          <Specimen label="delta up, good" stack>
            <NumberText variant="delta" value={0.123} unit="percent" goodDirection="up" />
          </Specimen>
          <Specimen label="delta down, bad (points)" stack>
            <NumberText variant="delta" value={-4} unit="points" goodDirection="up" />
          </Specimen>
          <Specimen label="delta down, good (cost per lead)" stack>
            <NumberText variant="delta" value={-0.08} unit="percent" goodDirection="down" />
          </Specimen>
          <Specimen label="flat, and in a table row" note="In table rows deltas are text-fg; the icon and sign carry the direction." stack>
            <NumberText variant="delta" value={0} unit="percent" goodDirection="up" />
            <NumberText variant="delta" value={0.05} unit="percent" goodDirection="up" inTable />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="date-text" title="DateText" description="A date, a time, or both, in the institution's time zone, with the zone where a time drives an action.">
        <StateGrid columns={4}>
          <Specimen label="date" stack>
            <DateText value="2026-10-06T09:00:00Z" />
            <DateText value="2026-09-29T09:00:00Z" />
          </Specimen>
          <Specimen label="date-short (feeds and cards)" stack>
            <DateText value="2026-10-06T09:00:00Z" variant="date-short" now={GALLERY_NOW} />
            <DateText value="2025-12-24T09:00:00Z" variant="date-short" now={GALLERY_NOW} />
          </Specimen>
          <Specimen label="time and date-time" stack>
            <DateText value="2026-10-06T09:00:00Z" variant="time" />
            <DateText value="2026-10-06T09:00:00Z" variant="date-time" />
          </Specimen>
          <Specimen label="with zone" stack>
            <DateText value="2026-10-06T09:00:00Z" variant="with-zone" />
            <DateText value="2026-10-06T09:00:00Z" variant="with-zone" timeZone="Asia/Dubai" />
          </Specimen>
          <Specimen label="range" stack>
            <DateText value="2026-10-06T06:00:00Z" end="2026-10-12T06:00:00Z" variant="range" />
            <DateText value="2026-09-30T06:00:00Z" end="2026-10-04T06:00:00Z" variant="range" />
          </Specimen>
          <Specimen label="meta line (text-muted)" stack>
            <DateText value="2026-10-03T05:30:00Z" muted />
          </Specimen>
          <Specimen label="missing" stack>
            <DateText value={null} />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="relative-time" title="RelativeTime" description="How long ago, with the exact date and time one hover or focus away; due times that are never relative alone. Swapped in after mount; one shared 60 s timer.">
        <StateGrid columns={4}>
          <Specimen label="past" note="Focus or hover for the absolute time; a tap toggles it on touch." stack>
            <RelativeTime value="2026-10-06T08:59:40Z" absolute="06 Oct 2026, 2:29 pm IST" now={GALLERY_NOW} />
            <RelativeTime value="2026-10-06T08:55:00Z" absolute="06 Oct 2026, 2:25 pm IST" now={GALLERY_NOW} />
            <RelativeTime value="2026-10-06T06:00:00Z" absolute="06 Oct 2026, 11:30 am IST" now={GALLERY_NOW} />
          </Specimen>
          <Specimen label="days, then absolute from 7 days" stack>
            <RelativeTime value="2026-10-05T09:00:00Z" absolute="05 Oct 2026, 2:30 pm IST" now={GALLERY_NOW} />
            <RelativeTime value="2026-10-03T09:00:00Z" absolute="03 Oct 2026, 2:30 pm IST" now={GALLERY_NOW} />
            <RelativeTime value="2026-09-29T09:00:00Z" absolute="29 Sept 2026, 2:30 pm IST" now={GALLERY_NOW} />
          </Specimen>
          <Specimen label="due: upcoming, today, overdue" stack>
            <RelativeTime variant="due" value="2026-10-09T04:30:00Z" absolute="09 Oct 2026, 10:00 am IST" now={GALLERY_NOW} />
            <RelativeTime variant="due" value="2026-10-07T04:30:00Z" absolute="07 Oct 2026, 10:00 am IST" now={GALLERY_NOW} />
            <RelativeTime variant="due" value="2026-10-06T10:30:00Z" absolute="06 Oct 2026, 4:00 pm IST" now={GALLERY_NOW} />
            <RelativeTime variant="due" value="2026-10-05T10:30:00Z" absolute="05 Oct 2026, 4:00 pm IST" now={GALLERY_NOW} />
          </Specimen>
          <Specimen label="in a table (min-w-20; overdue as a pill)" stack>
            <RelativeTime value="2026-10-06T06:00:00Z" absolute="06 Oct 2026, 11:30 am IST" now={GALLERY_NOW} inTable />
            <RelativeTime variant="due" value="2026-10-05T10:30:00Z" absolute="05 Oct 2026, 4:00 pm IST" now={GALLERY_NOW} inTable />
          </Specimen>
          <Specimen label="server-rendered (absolute), before the swap" stack>
            <time dateTime="2026-10-06T08:55:00.000Z" className="text-muted tabular-nums">
              06 Oct 2026, 2:25 pm IST
            </time>
          </Specimen>
        </StateGrid>
        <KeyboardNotes items={[["Tab", "Standalone it takes tabindex=0 so the tooltip opens on focus. Inside a focusable parent it is not a second tab stop; its tooltip opens while the parent has focus."]]} />
      </Section>

      <Section id="phone-text" title="PhoneText" description="An E.164 number in the international format people read and dial, without guessing its type.">
        <StateGrid columns={4}>
          <Specimen label="mobile and landline" stack>
            <PhoneText value="+919876543210" />
            <PhoneText value="+918026123456" kind="landline" />
            <PhoneText value="+971501234567" />
          </Specimen>
          <Specimen label="link (service-call links on)" stack>
            <PhoneText value="+919876543210" link />
          </Specimen>
          <Specimen label="inside right-to-left text" note="<bdi dir=ltr> keeps the digits in order." stack>
            <span dir="rtl" className="text-sm text-fg">
              زینب خان · <PhoneText value="+919812345678" />
            </span>
          </Specimen>
          <Specimen label="unparseable and missing" stack>
            <PhoneText value="98765-43210 ext 12" />
            <PhoneText value={null} />
          </Specimen>
        </StateGrid>
      </Section>
    </GalleryPage>
  );
}
