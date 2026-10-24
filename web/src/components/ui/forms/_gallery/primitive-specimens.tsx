"use client";

import { Bold, Italic, Link2 } from "lucide-react";
import { Toolbar } from "radix-ui";
import { Section, SIMULATED_NOTE, Specimen, StateGrid, simulatedFocus } from "@/app/design/_gallery";
import { IconButton } from "../../icon-button";
import { Disclosure } from "../../primitives/disclosure";
import { Kbd } from "../../primitives/kbd";
import { Link, linkVariants } from "../../primitives/link";
import { Separator } from "../../primitives/separator";
import { SearchInput } from "../search-input";
import { KeyboardNote } from "./keyboard-note";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------------------------------
 * Link
 * -----------------------------------------------------------------------------------------------*/

export function LinkSpecimens() {
  return (
    <Section
      id="link"
      title="Link"
      description="Text that navigates. Underlined by default, so it is never shown by colour alone; the colour does not change on hover or after a visit. Something that acts like a button uses Button variant=link."
    >
      <Section id="link-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen label="inline (inside a sentence)">
            <p className="m-0 text-sm text-fg">
              This number is on lead #10482, Arjun Mehta. <Link href="/design/forms#link">Open lead</Link>
            </p>
          </Specimen>
          <Specimen label="standalone (24 px target)">
            <Link href="/design/forms#link" variant="standalone">
              View DNS records
            </Link>
          </Specimen>
          <Specimen label="standalone, public (44 px target)" surface="bg">
            <Link href="/design/forms#link" variant="standalone" surface="public" className="text-base">
              How Sahyadri College uses your data
            </Link>
          </Specimen>
          <Specimen label="external (new tab: icon and sr-only text)">
            <Link href="https://www.example.com/dlt-registration" external variant="standalone">
              Read about DLT registration
            </Link>
          </Specimen>
          <Specimen label="muted (breadcrumbs and meta lines)">
            <nav aria-label="Breadcrumb, example" className="flex items-center gap-2 text-sm">
              <Link href="/design/forms#link" variant="muted">
                Settings
              </Link>
              <span aria-hidden="true" className="text-muted">
                /
              </span>
              <Link href="/design/forms#link" variant="muted">
                Channels
              </Link>
              <span aria-hidden="true" className="text-muted">
                /
              </span>
              <Link href="/design/forms#link" current>
                SMS
              </Link>
            </nav>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="link-states" title="States" level={3}>
        <StateGrid columns={3}>
          <Specimen label="default">
            <Link href="/design/forms#link-states">Change owner</Link>
          </Specimen>
          <Specimen label="hover (the underline thickens)" note={SIMULATED_NOTE}>
            <Link href="/design/forms#link-states" className="decoration-2">
              Change owner
            </Link>
          </Specimen>
          <Specimen label="visited (no change)">
            <Link href="/design/forms">Forms</Link>
          </Specimen>
          <Specimen label="focus-visible" note={SIMULATED_NOTE}>
            <Link href="/design/forms#link-states" className={simulatedFocus}>
              Change owner
            </Link>
          </Specimen>
          <Specimen label="current page (aria-current)">
            <Link href="/design/forms#link-states" current>
              Forms
            </Link>
          </Specimen>
          <Specimen label="muted, hover" note={SIMULATED_NOTE}>
            <span className={cn(linkVariants({ variant: "muted" }), "text-fg underline")}>Channels</span>
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote items={[{ keys: ["Tab"], action: "Focuses; Enter follows." }]} />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Kbd
 * -----------------------------------------------------------------------------------------------*/

export function KbdSpecimens() {
  return (
    <Section id="kbd" title="Kbd" description="A key or a key combination inside a hint. Key names as printed on keyboards; on a Mac “Cmd” replaces “Ctrl”. Not focusable.">
      <StateGrid columns={3}>
        <Specimen label="single key">
          <Kbd>/</Kbd>
          <Kbd>Esc</Kbd>
          <Kbd>Enter</Kbd>
        </Specimen>
        <Specimen label="combination (joined by +)">
          <Kbd keys={["Ctrl", "Enter"]} />
          <Kbd keys={["Cmd", "Enter"]} />
          <Kbd keys={["Shift", "Alt", "N"]} />
        </Specimen>
        <Specimen label="in a hint line">
          <p className="m-0 flex items-center gap-1 text-xs text-muted">
            <Kbd keys={["Ctrl", "Enter"]} /> to save
          </p>
        </Specimen>
        <Specimen label="in a field (aria-hidden; the field says “Press slash to search”)">
          <SearchInput label="Search leads" shortcut={false} className="w-64 max-w-full" />
          <span className="flex items-center gap-1 text-xs text-muted">
            Page search shows <Kbd decorative>/</Kbd> at the right
          </span>
        </Specimen>
        <Specimen label="in a tooltip: plain text in brackets, no box" note="Hover or focus the button">
          <IconButton icon={<Link2 />} aria-label="Copy lead link" tooltip="Copy lead link (Ctrl + Shift + C)" />
        </Specimen>
        <Specimen label="on surface-raised" surface="surface-raised">
          <Kbd>Esc</Kbd>
        </Specimen>
      </StateGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Separator
 * -----------------------------------------------------------------------------------------------*/

export function SeparatorSpecimens() {
  return (
    <Section id="separator" title="Separator" description="A thin bg-border line between groups. The parent sets the spacing; meaning never depends on the line.">
      <StateGrid columns={3}>
        <Specimen label="horizontal (<hr>, my-4 in a card)" stack>
          <p className="m-0 text-sm text-fg">Contact details</p>
          <Separator />
          <p className="m-0 text-sm text-fg">Interest</p>
        </Specimen>
        <Specimen label="vertical (toolbar groups)">
          <Toolbar.Root aria-label="Formatting, example" className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
            <Toolbar.Button asChild>
              <IconButton icon={<Bold />} aria-label="Bold" />
            </Toolbar.Button>
            <Toolbar.Button asChild>
              <IconButton icon={<Italic />} aria-label="Italic" />
            </Toolbar.Button>
            <Toolbar.Separator className="mx-1 w-px self-stretch bg-border" />
            <Toolbar.Button asChild>
              <IconButton icon={<Link2 />} aria-label="Insert link" />
            </Toolbar.Button>
          </Toolbar.Root>
          <div className="flex h-control-sm items-center gap-3 text-sm text-fg">
            <span>Assigned</span>
            <Separator orientation="vertical" decorative />
            <span>Unassigned</span>
          </div>
        </Specimen>
        <Specimen label="labelled (S03 “or”)" stack>
          <Separator label="or" className="w-full" />
        </Specimen>
      </StateGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Disclosure
 * -----------------------------------------------------------------------------------------------*/

export function DisclosureSpecimens() {
  return (
    <Section
      id="disclosure"
      title="Disclosure"
      description="Shows or hides extra detail in place. Opening never moves focus; the content follows the trigger in the tab order. The label changes only when the action changes."
    >
      <Section id="disclosure-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen label="native (<details>, works without JavaScript)" stack>
            <Disclosure label="Details">
              <p className="m-0">Unicode messages hold 70 characters a part. This one is 3 parts, so each recipient costs 3 SMS.</p>
              <p className="m-0 text-muted">Counted at 160 or 70 characters, then 153 or 67 per part.</p>
            </Disclosure>
          </Specimen>
          <Specimen label="native, public (44 px trigger)" surface="bg" stack>
            <Disclosure label="What we keep about you" surface="public">
              <p className="m-0">Your name, mobile number, the course you asked about and when you asked.</p>
            </Disclosure>
          </Specimen>
          <Specimen label="controlled (Radix Collapsible, RecipientCheck)" stack>
            <Disclosure variant="controlled" label="14 skipped">
              <ul className="m-0 flex list-disc flex-col gap-1 pl-5">
                <li>9 opted out of WhatsApp</li>
                <li>5 have no mobile number</li>
              </ul>
            </Disclosure>
          </Specimen>
          <Specimen label="controlled, label changes with the action" stack>
            <Disclosure variant="controlled" label="Show them" openLabel="Hide them">
              <p className="m-0 text-muted">Reena Shah · Kabir Gill · Saanvi Patel</p>
            </Disclosure>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="disclosure-states" title="States" level={3}>
        <StateGrid columns={4}>
          <Specimen label="collapsed" stack>
            <Disclosure label="Details">Hidden detail</Disclosure>
          </Specimen>
          <Specimen label="expanded" stack>
            <Disclosure label="Hide task details" defaultOpen variant="controlled">
              Importing 1,240 leads from leads-oct.csv.
            </Disclosure>
          </Specimen>
          <Specimen label="hover (underline)" note={SIMULATED_NOTE} stack>
            <span className="inline-flex min-h-hit items-center gap-1 text-sm font-medium text-fg underline underline-offset-2">Details</span>
          </Specimen>
          <Specimen label="focus-visible" note={SIMULATED_NOTE} stack>
            <span className={cn("inline-flex min-h-hit items-center gap-1 rounded-sm text-sm font-medium text-fg", simulatedFocus)}>Details</span>
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote items={[{ keys: ["Tab"], action: "Focuses the trigger." }, { keys: ["Enter", "Space"], action: "Toggles." }]} />
    </Section>
  );
}
