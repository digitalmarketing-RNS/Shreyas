"use client";

import {
  ArrowDownAZ,
  CalendarPlus,
  Copy,
  Ellipsis,
  ExternalLink,
  Filter,
  Info,
  Link2,
  MessageSquare,
  Pencil,
  Send,
  Trash2,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/display/avatar";
import { DescriptionList } from "@/components/ui/display/description-list";
import { StatusPill } from "@/components/ui/display/status-pill";
import { Alert } from "@/components/ui/feedback/alert";
import { EmptyState } from "@/components/ui/feedback/empty-state";
import { EMPTY_STATE_COPY } from "@/components/ui/feedback/empty-state-copy";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { IconButton } from "@/components/ui/icon-button";
import { ConfirmDialog } from "@/components/ui/overlays/confirm-dialog";
import { Drawer, DrawerPreview } from "@/components/ui/overlays/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPreview,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { Popover, PopoverClose, PopoverPreview } from "@/components/ui/overlays/popover";
import { Tooltip, TooltipPreview } from "@/components/ui/overlays/tooltip";
import { navItemActiveClassName, navItemClassName } from "@/components/ui/shell/sidebar";
import { cn } from "@/lib/cn";
import { SIMULATED_NOTE, Specimen, StateGrid } from "../../_gallery";
import { StaticPreview } from "../../shell/_kit/static-preview";
import { FieldDraw, GalleryCheckbox, GalleryInput } from "./gallery-fields";

const STAGE_OPTIONS = ["New enquiry", "Interested", "Counselling done", "Applied"] as const;

/* -------------------------------------------------------------------------------------------- Drawer */

function FiltersDrawer() {
  const [applied, setApplied] = useState<string[]>(["Interested"]);
  const [draft, setDraft] = useState<string[]>(["Interested"]);
  const [city, setCity] = useState("");
  const [applying, setApplying] = useState(false);
  const [open, setOpen] = useState(false);
  const pending = draft.filter((value) => !applied.includes(value)).length + applied.filter((value) => !draft.includes(value)).length + (city ? 1 : 0);
  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraft(applied);
          setCity("");
        }
      }}
      trigger={<Button variant="secondary" size="sm" leadingIcon={<Filter />}>Filters (right, sm)</Button>}
      title="Filters"
      size="sm"
      dirty={pending > 0}
      submitting={applying}
      pendingNote={pending > 0 ? `${pending} ${pending === 1 ? "change" : "changes"} not applied` : undefined}
      footerStart={
        <Button variant="ghost" size="md" onClick={() => setDraft([])}>
          Clear all
        </Button>
      }
      footer={
        <Button
          variant="primary"
          size="md"
          loading={applying}
          loadingLabel="Applying…"
          onClick={() => {
            setApplying(true);
            window.setTimeout(() => {
              setApplied(draft);
              setApplying(false);
              setOpen(false);
            }, 800);
          }}
        >
          Apply
        </Button>
      }
    >
      <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
        <legend className="mb-1 text-sm font-medium text-fg">Stage is</legend>
        {STAGE_OPTIONS.map((stage) => (
          <GalleryCheckbox
            key={stage}
            label={stage}
            checked={draft.includes(stage)}
            onChange={(checked) => setDraft((current) => (checked ? [...current, stage] : current.filter((value) => value !== stage)))}
          />
        ))}
      </fieldset>
      <div className="mt-4">
        <GalleryInput label="City" value={city} onChange={setCity} placeholder="Pune" />
      </div>
    </Drawer>
  );
}

function DetailDrawer() {
  return (
    <Drawer
      trigger={<Button variant="secondary" size="sm">Event detail (md)</Button>}
      title="Follow-up with Ananya Rao"
      description="Call · Owner Priya Nair"
      size="md"
      initialFocus="title"
      footer={
        <>
          <Button variant="secondary" size="md">
            Reschedule
          </Button>
          <Button variant="primary" size="md">
            Mark as done
          </Button>
        </>
      }
    >
      <DescriptionList
        variant="side-by-side"
        items={[
          { label: "When", value: "07 Oct 2026, 10:00 am IST" },
          { label: "Status", value: <StatusPill domain="follow_ups.status" value="upcoming" /> },
          { label: "Note", value: "Ask about the hostel and the scholarship test date.", userEntered: true },
        ]}
      />
    </Drawer>
  );
}

function AuditDrawer() {
  return (
    <Drawer trigger={<Button variant="secondary" size="sm">Audit entry (lg)</Button>} title="Change to Ananya Rao's stage" size="lg" initialFocus="title">
      <DescriptionList
        variant="side-by-side"
        items={[
          { label: "Actor", value: "Vikram Shah" },
          { label: "When", value: "05 Oct 2026, 5:00 pm IST" },
          { label: "Before", value: "Interested" },
          { label: "After", value: "Applied" },
        ]}
      />
    </Drawer>
  );
}

function LeftDrawer() {
  return (
    <Drawer trigger={<Button variant="secondary" size="sm">Navigation (left)</Button>} title="Menu" closeLabel="Close menu" side="left" size="nav" bodyClassName="px-0 py-2">
      <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
        {["My day", "Leads", "Calendar", "Inbox"].map((label, index) => (
          <li key={label} className="flex">
            <Link href="#drawer" aria-current={index === 1 ? "page" : undefined} className={cn(navItemClassName, "min-w-0 flex-1 px-2", index === 1 && navItemActiveClassName)}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </Drawer>
  );
}

export function DrawerLiveSpecimens() {
  return (
    <Specimen label="live" note="Filters: change a stage, then press Esc (discard prompt) or Apply. Detail drawers open with focus on the title." stack>
      <div className="flex flex-wrap gap-2">
        <FiltersDrawer />
        <DetailDrawer />
        <AuditDrawer />
        <LeftDrawer />
      </div>
    </Specimen>
  );
}

export function DrawerStaticSpecimens() {
  return (
    <StateGrid columns={3}>
      <Specimen label="right: filters with pending changes" surface="bg">
        <StaticPreview>
          <DrawerPreview
            title="Filters"
            pendingNote="3 changes not applied"
            footerStart={<Button variant="ghost" size="md">Clear all</Button>}
            footer={<Button variant="primary" size="md">Apply</Button>}
          >
            <div className="flex flex-col gap-3">
              <FieldDraw label="Stage is" value="Interested, Applied" />
              <FieldDraw label="City" value="Pune" />
              <FieldDraw label="Owner" value="Priya Nair" />
            </div>
          </DrawerPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="right: detail" surface="bg">
        <StaticPreview>
          <DrawerPreview title="Admissions team" description="Pune campus · 6 members">
            <DescriptionList
              variant="side-by-side"
              items={[
                { label: "Lead", value: "Asha Menon" },
                { label: "Round robin", value: "On" },
                { label: "Checked in now", value: "4 of 6" },
              ]}
            />
          </DrawerPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="applying" note="Apply loads; Esc, the overlay and close are ignored." surface="bg">
        <StaticPreview>
          <DrawerPreview title="Filters" footer={<Button variant="primary" size="md" loading loadingLabel="Applying…">Apply</Button>}>
            <FieldDraw label="Stage is" value="Interested" />
          </DrawerPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="loading" surface="bg">
        <StaticPreview>
          <DrawerPreview title="Follow-up with Ananya Rao" loading>
            <div className="flex flex-col gap-3">
              <Skeleton width="60%" />
              <Skeleton width="80%" />
              <Skeleton width="40%" />
            </div>
          </DrawerPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="error" note="An Alert at the top of the body." surface="bg">
        <StaticPreview>
          <DrawerPreview title="Change to Ananya Rao's stage">
            <Alert tone="danger" title="Couldn't load this entry">
              Check your connection and try again. Ref: 2HD8-77
            </Alert>
          </DrawerPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="empty" note="EmptyState (compact) in the body." surface="bg">
        <StaticPreview>
          <DrawerPreview title="Admissions team">
            <EmptyState size="compact" variant="first-use" title="No members yet" body="Add counsellors so leads can be assigned to this team." headingLevel={3} />
          </DrawerPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="left: navigation" surface="bg">
        <StaticPreview>
          <DrawerPreview title="Menu" closeLabel="Close menu" side="left" className="max-w-60">
            <ul className="-mx-5 my-0 flex list-none flex-col gap-0.5 p-0">
              {["My day", "Leads", "Calendar"].map((label, index) => (
                <li key={label} className={cn(navItemClassName, "px-2", index === 1 && navItemActiveClassName)}>
                  {label}
                </li>
              ))}
            </ul>
          </DrawerPreview>
        </StaticPreview>
      </Specimen>
    </StateGrid>
  );
}

/* ------------------------------------------------------------------------------------------- Popover */

export function PopoverLiveSpecimens() {
  const [stages, setStages] = useState<string[]>(["Interested"]);
  return (
    <Specimen label="live" note="Focus moves into the popover; Tab cycles inside; Esc, a click outside, Close or Apply returns focus to the trigger." stack>
      <div className="flex flex-wrap gap-2">
        <Popover
          trigger={<Button variant="secondary" size="sm" menu>Stage</Button>}
          title="Stage is"
          size="sm"
          footer={
            <>
              <PopoverClose asChild>
                <Button variant="ghost" size="sm" onClick={() => setStages([])}>
                  Clear
                </Button>
              </PopoverClose>
              <PopoverClose asChild>
                <Button variant="primary" size="sm">
                  Apply
                </Button>
              </PopoverClose>
            </>
          }
        >
          <div className="flex flex-col">
            {STAGE_OPTIONS.map((stage) => (
              <GalleryCheckbox
                key={stage}
                label={stage}
                checked={stages.includes(stage)}
                onChange={(checked) => setStages((current) => (checked ? [...current, stage] : current.filter((value) => value !== stage)))}
              />
            ))}
          </div>
        </Popover>
        <Popover trigger={<Button variant="link" leadingIcon={<Info />}>Why can&apos;t I send this?</Button>} title="WhatsApp can't be used here" size="md" titleAs="h3">
          <p className="m-0 text-sm text-fg">
            WhatsApp can&apos;t be used here. Ravi hasn&apos;t written in the last 24 hours, so only approved templates can be sent.
          </p>
          <Button asChild variant="link" className="mt-2">
            <Link href="#templates">Choose a template</Link>
          </Button>
        </Popover>
        <Popover trigger={<Button variant="secondary" size="sm">Owners</Button>} title="Owners" size="sm" variant="list" titleAs="h3">
          <OwnerList />
        </Popover>
        <Popover trigger={<Button variant="secondary" size="sm" menu>Settings section</Button>} aria-label="Settings sections" size="sm" variant="list">
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {["Lead fields", "Stages", "Channels", "Payments"].map((label) => (
              <li key={label} className="flex">
                <Link href="#settings" aria-current={label === "Channels" ? "page" : undefined} className={cn(navItemClassName, "mx-0 min-w-0 flex-1 px-2", label === "Channels" && navItemActiveClassName)}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </Popover>
        <Popover trigger={<Button variant="secondary" size="sm">Lead details (lg, drawer below sm)</Button>} title="Ananya Rao" size="lg" drawerBelowSm titleAs="h3">
          <DescriptionList columns={1} items={[{ label: "Course", value: "B.Tech Computer Science" }, { label: "City", value: "Pune" }]} />
        </Popover>
      </div>
    </Specimen>
  );
}

function OwnerList() {
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {[
        ["Priya Nair", "Primary owner"],
        ["Vikram Shah", "Checked in"],
        ["Asha Menon", ""],
      ].map(([name, detail]) => (
        <li key={name} className="flex min-h-menu-item items-center gap-2 px-2 py-1.5">
          <Avatar name={name} size="sm" />
          <span className="flex flex-col">
            <span className="text-sm text-fg">{name}</span>
            {detail ? <span className="text-xs text-muted">{detail}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PopoverStaticSpecimens() {
  return (
    <StateGrid columns={3}>
      <Specimen label="mini form (sm): open" surface="bg">
        <StaticPreview>
          <PopoverPreview title="Stage is" size="sm" footer={<><Button variant="ghost" size="sm">Clear</Button><Button variant="primary" size="sm">Apply</Button></>}>
            <div className="flex flex-col text-sm text-fg">
              {STAGE_OPTIONS.map((stage) => (
                <span key={stage} className="flex min-h-hit items-center gap-2">
                  <span className={cn("inline-flex size-checkbox rounded-xs border", stage === "Interested" ? "border-accent bg-accent" : "border-input bg-surface")} />
                  {stage}
                </span>
              ))}
            </div>
          </PopoverPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="explainer (md)" surface="bg">
        <StaticPreview>
          <PopoverPreview title="WhatsApp can't be used here" size="md">
            <p className="m-0 text-sm text-fg">Ravi hasn&apos;t written in the last 24 hours, so only approved templates can be sent.</p>
            <span className="mt-2 inline-block text-sm text-accent underline underline-offset-2">Choose a template</span>
          </PopoverPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="list (p-1, full-width rows)" surface="bg">
        <StaticPreview>
          <PopoverPreview title="Owners" size="sm" variant="list">
            <OwnerList />
          </PopoverPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="loading" note="Skeleton rows." surface="bg">
        <StaticPreview>
          <PopoverPreview title="Owners" size="sm" variant="list">
            <div className="flex flex-col gap-1 px-2 py-1">
              {[0, 1, 2].map((row) => (
                <span key={row} className="flex items-center gap-2">
                  <Skeleton shape="circle" size="sm" />
                  <Skeleton width="60%" />
                </span>
              ))}
            </div>
          </PopoverPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="empty" note="One line of text-muted." surface="bg">
        <StaticPreview>
          <PopoverPreview title="Columns" size="sm">
            <p className="m-0 text-sm text-muted">{EMPTY_STATE_COPY.popoverList.title}</p>
          </PopoverPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="error" note="One line and “Try again”." surface="bg">
        <StaticPreview>
          <PopoverPreview title="Owners" size="sm">
            <p className="m-0 text-sm text-fg">Couldn&apos;t load the owners.</p>
            <Button variant="secondary" size="sm" className="mt-2">
              Try again
            </Button>
          </PopoverPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="applying" note="The footer primary loads." surface="bg">
        <StaticPreview>
          <PopoverPreview title="Stage is" size="sm" footer={<Button variant="primary" size="sm" loading loadingLabel="Applying…">Apply</Button>}>
            <FieldDraw label="Stage" value="Interested" />
          </PopoverPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="lg (400 px)" surface="bg">
        <StaticPreview>
          <PopoverPreview title="Metric definition" size="lg">
            <p className="m-0 text-sm text-fg">Cost per lead is the amount spent on a publisher this period divided by the leads it sent, including duplicates it later merged.</p>
          </PopoverPreview>
        </StaticPreview>
      </Specimen>
    </StateGrid>
  );
}

/* ------------------------------------------------------------------------------------- DropdownMenu */

export function MenuLiveSpecimens() {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sort, setSort] = useState("newest");
  const [columns, setColumns] = useState({ owner: true, city: true, source: false });
  return (
    <Specimen label="live" note="Arrows move (wrapping), Home and End jump, typing jumps by label; Right opens a submenu; Space toggles a checkbox item without closing." stack>
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton icon={<Ellipsis />} aria-label="More actions for Ananya Rao" variant="secondary" size="sm" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem icon={<ExternalLink />}>Open</DropdownMenuItem>
            <DropdownMenuItem icon={<ExternalLink />}>Open in new tab</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger icon={<Pencil />}>Change stage</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {STAGE_OPTIONS.map((stage) => (
                  <DropdownMenuItem key={stage}>{stage}</DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem icon={<CalendarPlus />}>Add follow-up</DropdownMenuItem>
            <DropdownMenuItem icon={<Send />} unavailableReason="Ravi opted out of WhatsApp.">
              Send message
            </DropdownMenuItem>
            <DropdownMenuItem icon={<UserRoundPlus />}>Reassign</DropdownMenuItem>
            <DropdownMenuItem icon={<Link2 />}>Copy lead link</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem icon={<Trash2 />} destructive onSelect={() => setConfirmDelete(true)}>
              Delete lead
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Delete 1 lead?"
          description="They'll be hidden from every list and report. Their payments and consent records are kept. You can't undo this."
          confirmLabel="Delete 1 lead"
          onConfirm={() => {}}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" menu leadingIcon={<ArrowDownAZ />}>
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Sort leads by</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
              <DropdownMenuRadioItem value="newest">Newest first</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="oldest">Oldest first</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="engaged">Last engaged</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" menu>
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={columns.owner} onCheckedChange={(owner) => setColumns((current) => ({ ...current, owner }))}>
              Owner
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={columns.city} onCheckedChange={(city) => setColumns((current) => ({ ...current, city }))}>
              City
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={columns.source} onCheckedChange={(source) => setColumns((current) => ({ ...current, source }))}>
              Source
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" menu aria-label="More actions for selected leads">
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem icon={<Pencil />}>Update a field</DropdownMenuItem>
            <DropdownMenuItem icon={<UserRoundPlus />}>Unassign</DropdownMenuItem>
            <DropdownMenuItem icon={<Copy />}>Send to a webhook</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem icon={<Trash2 />} destructive>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Specimen>
  );
}

export function MenuStaticSpecimens() {
  return (
    <StateGrid columns={3}>
      <Specimen label="row menu: open" note="Item states: highlighted (hover or keyboard: the same look), unavailable (reason as the second line), destructive last after a separator." surface="bg">
        <StaticPreview>
          <DropdownMenuPreview>
            <DropdownMenuItem icon={<ExternalLink />}>Open</DropdownMenuItem>
            <DropdownMenuItem icon={<Pencil />} highlighted>
              Change stage
            </DropdownMenuItem>
            <DropdownMenuItem icon={<CalendarPlus />}>Add follow-up</DropdownMenuItem>
            <DropdownMenuItem icon={<MessageSquare />} unavailableReason="Ravi opted out of WhatsApp.">
              Send message
            </DropdownMenuItem>
            <DropdownMenuItem icon={<Link2 />} shortcut="Ctrl+L">
              Copy lead link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem icon={<Trash2 />} destructive>
              Delete lead
            </DropdownMenuItem>
          </DropdownMenuPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="item: focus-visible and destructive highlighted" note={`${SIMULATED_NOTE}: the global outline, inset.`} surface="bg">
        <StaticPreview>
          <DropdownMenuPreview>
            <DropdownMenuItem icon={<Pencil />} highlighted className="outline-2 -outline-offset-2 outline-focus-ring outline-solid">
              Change stage
            </DropdownMenuItem>
            <DropdownMenuItem icon={<Trash2 />} destructive highlighted>
              Delete lead
            </DropdownMenuItem>
          </DropdownMenuPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="selection, toggles and submenu open" surface="bg">
        <StaticPreview className="flex flex-wrap items-start gap-2">
          <DropdownMenuPreview>
            <DropdownMenuLabel>Sort leads by</DropdownMenuLabel>
            <DropdownMenuRadioGroup value="newest">
              <DropdownMenuRadioItem value="newest">Newest first</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="oldest">Oldest first</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked>Owner</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={false}>Source</DropdownMenuCheckboxItem>
            <DropdownMenuSubTrigger icon={<Pencil />} className="bg-surface-hover">
              Change stage
            </DropdownMenuSubTrigger>
          </DropdownMenuPreview>
          <DropdownMenuPreview>
            {STAGE_OPTIONS.map((stage, index) => (
              <DropdownMenuItem key={stage} highlighted={index === 2}>
                {stage}
              </DropdownMenuItem>
            ))}
          </DropdownMenuPreview>
        </StaticPreview>
      </Specimen>
    </StateGrid>
  );
}

/* ------------------------------------------------------------------------------------------ Tooltip */

export function TooltipSpecimens() {
  return (
    <StateGrid columns={3}>
      <Specimen label="label (icon button)" note="Hover for 400 ms, or focus with the keyboard (at once). Esc closes it and keeps focus.">
        <IconButton icon={<Copy />} aria-label="Copy lead link" />
        <IconButton icon={<Filter />} aria-label="Filters" tooltip="Filters (F)" />
      </Specimen>
      <Specimen label="detail" note="The absolute time behind a relative one; the exact amount behind a compact one.">
        <Tooltip content="06 Oct 2026, 2:30 pm IST">
          <span tabIndex={0} className="rounded-sm text-sm text-muted">
            5 min ago
          </span>
        </Tooltip>
        <Tooltip content="Exact amount ₹12,34,567.89">
          <span tabIndex={0} className="rounded-sm text-sm text-fg tabular-nums">
            ₹12.3L
          </span>
        </Tooltip>
      </Specimen>
      <Specimen label="truncation" note="The full text of a truncated label.">
        <Tooltip content="Brahmaputra Institute of Technology, Guwahati">
          <a href="#tooltip" className="block max-w-48 truncate rounded-sm pt-0.5 pb-1 text-sm text-accent underline underline-offset-2">
            Brahmaputra Institute of Technology, Guwahati
          </a>
        </Tooltip>
      </Specimen>
      <Specimen label="open (label)" note="bg-inverse, text-xs, no arrow, 6 px from the trigger.">
        <StaticPreview className="flex w-auto flex-col items-start gap-1.5">
          <TooltipPreview>Copy lead link</TooltipPreview>
          <IconButton icon={<Copy />} aria-label="Copy lead link" tooltip={false} />
        </StaticPreview>
      </Specimen>
      <Specimen label="open (detail, two lines)" note="Under 80 characters; max-w-64.">
        <StaticPreview className="w-auto">
          <TooltipPreview>Checked out. New leads go to colleagues who are checked in.</TooltipPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="closed, dismissed, touch" note="Dismissed with Esc it stays closed until the pointer leaves or focus moves. On touch tooltips don't show, except RelativeTime, which toggles on tap.">
        <span className="text-sm text-muted">Nothing shows.</span>
      </Specimen>
    </StateGrid>
  );
}
