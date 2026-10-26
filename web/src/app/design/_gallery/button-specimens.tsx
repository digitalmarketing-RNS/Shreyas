"use client";

import {
  ArrowRight,
  Bell,
  Bold,
  Braces,
  Copy,
  Eye,
  Italic,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  WrapText,
  X,
} from "lucide-react";
import Link from "next/link";
import { Toolbar } from "radix-ui";
import { type ReactElement, useState } from "react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { IconButton, type IconButtonSize, type IconButtonVariant } from "@/components/ui/icon-button";
import { Section } from "./section";
import { SIMULATED_NOTE, simulatedFocus } from "./simulated";
import { Specimen } from "./specimen";
import { StateGrid } from "./state-grid";

/* -------------------------------------------------------------------------------------------------
 * Button
 * -----------------------------------------------------------------------------------------------*/

type ButtonSpec = {
  variant: ButtonVariant;
  title: string;
  label: string;
  loadingLabel: string;
  reason: string;
  icon?: ReactElement;
  hover: string;
  active: string;
  use: string;
};

const BUTTON_SPECS: ButtonSpec[] = [
  {
    variant: "primary",
    title: "Primary",
    label: "Save changes",
    loadingLabel: "Saving…",
    reason: "Only admins can change this.",
    hover: "bg-accent-hover",
    active: "bg-accent-hover",
    use: "The main action of a view, card or dialog. At most one per region.",
  },
  {
    variant: "secondary",
    title: "Secondary",
    label: "Export",
    loadingLabel: "Exporting…",
    reason: "Select at least one lead first.",
    hover: "bg-surface-hover",
    active: "bg-surface-sunken",
    use: "Other actions: Cancel, Export, Import.",
  },
  {
    variant: "ghost",
    title: "Ghost",
    label: "Add note",
    loadingLabel: "Adding…",
    reason: "This lead is archived.",
    icon: <Plus />,
    hover: "bg-surface-hover [&_svg]:text-fg",
    active: "bg-surface-sunken",
    use: "Low-emphasis actions in toolbars, table rows and card headers.",
  },
  {
    variant: "danger",
    title: "Danger",
    label: "Delete 12 leads",
    loadingLabel: "Deleting…",
    reason: "Only admins can delete leads.",
    hover: "bg-danger-hover",
    active: "bg-danger-hover",
    use: "Only the final confirm of a destructive action, usually in a confirm dialog.",
  },
  {
    variant: "danger-outline",
    title: "Danger outline",
    label: "Revoke key",
    loadingLabel: "Revoking…",
    reason: "This key is already revoked.",
    hover: "bg-danger-subtle",
    active: "bg-danger-subtle",
    use: "A destructive action that opens a confirm step.",
  },
  {
    variant: "link",
    title: "Link",
    label: "Resend code",
    loadingLabel: "Sending…",
    reason: "You can ask for a new code in 30 seconds.",
    hover: "decoration-2",
    active: "decoration-2",
    use: "Looks like a link, acts as a button. The colour never changes on hover.",
  },
];

function ButtonStates({ spec }: { spec: ButtonSpec }) {
  const common = { variant: spec.variant, leadingIcon: spec.icon } as const;
  return (
    <Section id={`button-${spec.variant}`} title={spec.title} level={3} description={spec.use}>
      <StateGrid columns={4}>
        <Specimen label="default">
          <Button {...common}>{spec.label}</Button>
        </Specimen>
        <Specimen label="hover" note={SIMULATED_NOTE}>
          <Button {...common} className={spec.hover}>
            {spec.label}
          </Button>
        </Specimen>
        <Specimen label="active (pressed)" note={SIMULATED_NOTE}>
          <Button {...common} className={spec.active}>
            {spec.label}
          </Button>
        </Specimen>
        <Specimen label="focus-visible" note={SIMULATED_NOTE}>
          <Button {...common} className={simulatedFocus}>
            {spec.label}
          </Button>
        </Specimen>
        <Specimen label="disabled">
          <Button {...common} disabled>
            {spec.label}
          </Button>
        </Specimen>
        <Specimen label="disabled with reason" note={`Focusable; the reason is its description: “${spec.reason}”`}>
          <Button {...common} disabledReason={spec.reason}>
            {spec.label}
          </Button>
        </Specimen>
        <Specimen label="loading" note={`Shows “${spec.loadingLabel}”; the name stays “${spec.label}”`}>
          <Button {...common} loading loadingLabel={spec.loadingLabel}>
            {spec.label}
          </Button>
        </Specimen>
        <Specimen label="loading, label kept">
          <Button {...common} loading>
            {spec.label}
          </Button>
        </Specimen>
      </StateGrid>
    </Section>
  );
}

function LoadingDemo() {
  const [saving, setSaving] = useState(false);
  return (
    <Button
      loading={saving}
      loadingLabel="Saving…"
      onClick={() => {
        setSaving(true);
        window.setTimeout(() => setSaving(false), 2000);
      }}
    >
      Save changes
    </Button>
  );
}

export function ButtonSpecimens() {
  return (
    <Section
      id="button"
      title="Button"
      description="Starts an action or submits a form. Six variants, four sizes. Loading keeps the label as the accessible name; disabled with a reason stays focusable and explains itself."
    >
      {BUTTON_SPECS.map((spec) => (
        <ButtonStates key={spec.variant} spec={spec} />
      ))}

      <Section id="button-sizes" title="Sizes" level={3} description="xs only in dense toolbars and rows; sm is the staff default; md sits next to 40 px fields; lg is for public pages.">
        <StateGrid columns={4}>
          {(
            [
              ["xs", "xs · 24 px"],
              ["sm", "sm · 32 px"],
              ["md", "md · 40 px"],
              ["lg", "lg · 48 px (public)"],
            ] as const
          ).map(([size, label]) => (
            <Specimen key={size} label={label}>
              <Button size={size} leadingIcon={<Plus />}>
                Add lead
              </Button>
              <Button size={size} variant="secondary">
                Cancel
              </Button>
            </Specimen>
          ))}
        </StateGrid>
      </Section>

      <Section id="button-modifiers" title="Modifiers" level={3}>
        <StateGrid columns={3}>
          <Specimen label="leading icon">
            <Button leadingIcon={<Plus />}>Add lead</Button>
          </Specimen>
          <Specimen label="trailing icon">
            <Button variant="secondary" trailingIcon={<ArrowRight />}>
              Next step
            </Button>
          </Specimen>
          <Specimen label="menu trigger">
            <Button variant="secondary" menu aria-haspopup="menu" aria-expanded={false}>
              Export
            </Button>
          </Specimen>
          <Specimen label="new tab (asChild <a>)">
            <Button asChild variant="secondary" external>
              <a href="https://example.com/dns-help" target="_blank" rel="noreferrer">
                View DNS records
              </a>
            </Button>
          </Specimen>
          <Specimen label="navigation (asChild Next Link)">
            <Button asChild variant="ghost" trailingIcon={<ArrowRight />}>
              <Link href="/design/forms#icon-button">Open IconButton</Link>
            </Button>
          </Specimen>
          <Specimen label="link, standalone" note="24 px target">
            <Button variant="link">Show 3 more</Button>
          </Specimen>
          <Specimen label="link, inside a sentence" note="Inline, no minimum height">
            <p className="text-sm text-fg">
              We sent a code to +91 98765 43210.{" "}
              <Button variant="link" inline>
                Change number
              </Button>
            </p>
          </Specimen>
          <Specimen label="full width (public primary, lg)" surface="bg">
            <div className="w-full max-w-public">
              <Button size="lg" fullWidth>
                Send enquiry
              </Button>
            </div>
          </Specimen>
          <Specimen label="icon-only (renders IconButton)" note="aria-label is required by the type">
            <Button icon={<Send />} aria-label="Send message to Priya Nair" />
            <Button variant="danger-outline" icon={<Trash2 />} aria-label="Delete Hindi" />
            <Button variant="secondary" size="md" icon={<Copy />} aria-label="Copy API key" />
          </Specimen>
          <Specimen label="try it: loading" note="Click: two seconds of Saving…">
            <LoadingDemo />
          </Specimen>
        </StateGrid>
      </Section>
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * IconButton
 * -----------------------------------------------------------------------------------------------*/

type IconSpec = {
  variant: IconButtonVariant;
  title: string;
  icon: ReactElement;
  label: string;
  reason: string;
  hover: string;
  active: string;
  use: string;
};

const ICON_SPECS: IconSpec[] = [
  {
    variant: "ghost",
    title: "Ghost (default)",
    icon: <MoreHorizontal />,
    label: "More actions for Ravi Kumar",
    reason: "This lead is locked while an import runs.",
    hover: "bg-surface-hover text-fg",
    active: "bg-surface-sunken",
    use: "Toolbars, table rows, card headers.",
  },
  {
    variant: "secondary",
    title: "Secondary",
    icon: <Pencil />,
    label: "Edit stage",
    reason: "Only admins can change stages.",
    hover: "bg-surface-hover",
    active: "bg-surface-sunken",
    use: "A bordered icon action that needs to stand out from the row.",
  },
  {
    variant: "danger-ghost",
    title: "Danger ghost",
    icon: <Trash2 />,
    label: "Remove Hindi",
    reason: "A form needs at least one language.",
    hover: "bg-danger-subtle text-danger",
    active: "bg-danger-subtle text-danger",
    use: "Row-level Remove.",
  },
  {
    variant: "toggle",
    title: "Toggle",
    icon: <WrapText />,
    label: "Wrap long lines",
    reason: "Wrapping is always on for SMS.",
    hover: "bg-surface-hover text-fg",
    active: "bg-surface-sunken",
    use: "aria-pressed. Pressed adds an accent edge as well as the fill; the name never changes.",
  },
];

function IconButtonStates({ spec }: { spec: IconSpec }) {
  const common = { variant: spec.variant, icon: spec.icon, "aria-label": spec.label } as const;
  return (
    <Section id={`icon-button-${spec.variant}`} title={spec.title} level={3} description={spec.use}>
      <StateGrid columns={4}>
        <Specimen label="default">
          <IconButton {...common} />
        </Specimen>
        <Specimen label="hover" note={SIMULATED_NOTE}>
          <IconButton {...common} className={spec.hover} />
        </Specimen>
        <Specimen label="active (pressed)" note={SIMULATED_NOTE}>
          <IconButton {...common} className={spec.active} />
        </Specimen>
        <Specimen label="focus-visible" note={SIMULATED_NOTE}>
          <IconButton {...common} className={simulatedFocus} />
        </Specimen>
        {spec.variant === "toggle" ? (
          <Specimen label="pressed (aria-pressed)">
            <IconButton {...common} pressed />
          </Specimen>
        ) : null}
        <Specimen label="disabled">
          <IconButton {...common} disabled />
        </Specimen>
        <Specimen label="disabled with reason" note={`“${spec.reason}”`}>
          <IconButton {...common} disabledReason={spec.reason} />
        </Specimen>
        <Specimen label="loading" note="The icon becomes a spinner; the name is unchanged">
          <IconButton {...common} loading />
        </Specimen>
      </StateGrid>
    </Section>
  );
}

function ToggleDemo() {
  const [pressed, setPressed] = useState(false);
  return <IconButton variant="toggle" icon={<Eye />} aria-label="Show password" pressed={pressed} onPressedChange={setPressed} />;
}

function ToolbarDemo() {
  const [marks, setMarks] = useState({ bold: true, italic: false, wrap: false });
  const toggle = (key: keyof typeof marks) => (pressed: boolean) => setMarks((m) => ({ ...m, [key]: pressed }));
  return (
    <Toolbar.Root aria-label="Message formatting" className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
      <Toolbar.Button asChild>
        <IconButton variant="toggle" icon={<Bold />} aria-label="Bold" tooltip="Bold (Ctrl + B)" pressed={marks.bold} onPressedChange={toggle("bold")} />
      </Toolbar.Button>
      <Toolbar.Button asChild>
        <IconButton variant="toggle" icon={<Italic />} aria-label="Italic" tooltip="Italic (Ctrl + I)" pressed={marks.italic} onPressedChange={toggle("italic")} />
      </Toolbar.Button>
      <Toolbar.Button asChild>
        <IconButton variant="toggle" icon={<WrapText />} aria-label="Wrap long lines" pressed={marks.wrap} onPressedChange={toggle("wrap")} />
      </Toolbar.Button>
      <Toolbar.Separator className="mx-1 w-px self-stretch bg-border" />
      <Toolbar.Button asChild>
        <IconButton icon={<Braces />} aria-label="Insert merge field" />
      </Toolbar.Button>
    </Toolbar.Root>
  );
}

const ICON_SIZES: ReadonlyArray<[IconButtonSize, string, string]> = [
  ["xs", "xs · 24 px, icon 16", "Inside inputs, chips and dense rows"],
  ["sm", "sm · 32 px, icon 16", "Default"],
  ["md", "md · 40 px, icon 20", "Next to 40 px fields"],
  ["md-bar", "md-bar · 40 px, icon 24", "App header only"],
  ["lg", "lg · 48 px, icon 24", "Public pages"],
];

export function IconButtonSpecimens() {
  return (
    <Section
      id="icon-button"
      title="IconButton"
      description="An action shown only as an icon. aria-label is required and names the action and its object; the tooltip repeats it and opens at once on keyboard focus."
    >
      {ICON_SPECS.map((spec) => (
        <IconButtonStates key={spec.variant} spec={spec} />
      ))}

      <Section id="icon-button-in-field" title="In field" level={3} description="Always xs, inside the field's border.">
        <StateGrid columns={3}>
          <Specimen label="clear search">
            <div className="flex h-control-md w-full max-w-64 items-center gap-2 rounded-md border border-input bg-surface pr-1 pl-3 text-sm text-fg">
              <Search aria-hidden="true" className="size-icon-sm shrink-0 text-muted" />
              <span className="flex-1 truncate pt-0.5 pb-1">Ananya</span>
              <IconButton variant="in-field" icon={<X />} aria-label="Clear search" />
            </div>
          </Specimen>
          <Specimen label="show password (toggle)" note="Try it: aria-pressed flips">
            <div className="flex h-control-md w-full max-w-64 items-center gap-2 rounded-md border border-input bg-surface pr-1 pl-3 text-sm text-fg">
              <span className="flex-1 tracking-widest">••••••••</span>
              <ToggleDemo />
            </div>
          </Specimen>
          <Specimen label="hover" note={SIMULATED_NOTE}>
            <div className="flex h-control-md w-full max-w-64 items-center gap-2 rounded-md border border-input bg-surface pr-1 pl-3 text-sm text-fg">
              <span className="flex-1 truncate pt-0.5 pb-1">ਗੁਰਪ੍ਰੀਤ ਕੌਰ</span>
              <IconButton variant="in-field" icon={<X />} aria-label="Clear name" className="bg-surface-hover text-fg" />
            </div>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="icon-button-sizes" title="Sizes" level={3} description="Always square. Use xs only where no other target is within 24 px.">
        <StateGrid columns={5}>
          {ICON_SIZES.map(([size, label, note]) => (
            <Specimen key={size} label={label} note={note}>
              <IconButton size={size} icon={size === "md-bar" ? <Bell /> : <Pencil />} aria-label={size === "md-bar" ? "Notifications" : "Edit stage"} />
              <IconButton size={size} variant="secondary" icon={<Copy />} aria-label="Copy lead link" />
            </Specimen>
          ))}
        </StateGrid>
      </Section>

      <Section id="icon-button-badges" title="With badge" level={3} description="The count is part of the accessible name; the badge itself is hidden from screen readers.">
        <StateGrid columns={3}>
          <Specimen label="dot">
            <IconButton size="md-bar" icon={<Bell />} aria-label="Notifications, new activity" badge="dot" />
          </Specimen>
          <Specimen label="count">
            <IconButton size="md-bar" icon={<Bell />} aria-label="Notifications, 3 unread" badge={3} />
          </Specimen>
          <Specimen label="count over 99">
            <IconButton size="md-bar" icon={<Bell />} aria-label="Notifications, 120 unread" badge={120} />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="icon-button-toolbar" title="In a toolbar" level={3} description="Radix Toolbar: the group is one tab stop and the arrow keys move between buttons.">
        <StateGrid columns={2}>
          <Specimen label="toolbar with toggles">
            <ToolbarDemo />
          </Specimen>
          <Specimen label="tooltip with a shortcut" note="Hover or focus to see “Search (/)”">
            <IconButton icon={<Search />} aria-label="Search" tooltip="Search (/)" />
          </Specimen>
        </StateGrid>
      </Section>
    </Section>
  );
}
