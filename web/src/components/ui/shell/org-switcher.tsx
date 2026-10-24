"use client";

import { ChevronsUpDown, Search, Settings } from "lucide-react";
import Link from "next/link";
import { type KeyboardEvent, useId, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/display/avatar";
import { Badge } from "@/components/ui/display/badge";
import { StatusPill } from "@/components/ui/display/status-pill";
import { Spinner } from "@/components/ui/feedback/spinner";
import { useToast } from "@/components/ui/feedback/toaster";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { Popover } from "@/components/ui/overlays/popover";
import { cn } from "@/lib/cn";

export type Membership = {
  id: string;
  name: string;
  /** The person's role there: "Admin", "Counsellor", "Support staff". */
  role: string;
  suspended?: boolean;
  trial?: boolean;
};

export type OrgSwitcherProps = {
  current: Membership;
  /** GET /me/orgs (the person's memberships), the current one included. */
  memberships: Membership[];
  /** Our support staff also get "Manage institutions". */
  supportStaff?: boolean;
  manageHref?: string;
  /**
   * POST /me/org, which re-issues the session claims; the caller then does a full navigation to
   * "/" so no client cache from the previous institution survives. A rejection shows the error toast.
   */
  onSwitch?: (id: string) => Promise<void>;
  /** header (default) or in-drawer: full width inside the nav drawer below md. */
  variant?: "header" | "drawer";
  /** Draw the switching state (documentation). */
  switching?: boolean;
  className?: string;
};

const MAX_MENU = 8;
const SUSPENDED_REASON = "Suspended. Contact your account owner.";

/**
 * Which institution the person is working in, and a switch for people who belong to several
 * (components.md, OrgSwitcher). One membership: plain text. 2 to 8: a menu of radio items. 9 or
 * more: a Popover with a search field and a listbox. Not a grey filled box: the trigger looks like
 * the header's other ghost controls.
 */
export function OrgSwitcher({
  current,
  memberships,
  supportStaff = false,
  manageHref = "/support/institutions",
  onSwitch,
  variant = "header",
  switching: switchingProp = false,
  className,
}: OrgSwitcherProps) {
  const [switchingNow, setSwitchingNow] = useState(false);
  const { toast } = useToast();
  const switching = switchingProp || switchingNow;
  const drawer = variant === "drawer";
  const interactive = memberships.length > 1;

  const choose = async (id: string) => {
    if (switching || id === current.id) return;
    const target = memberships.find((membership) => membership.id === id);
    if (!target || target.suspended) return;
    setSwitchingNow(true);
    try {
      await onSwitch?.(id);
    } catch {
      toast({ tone: "error", title: "Couldn't switch institution. Try again.", foreground: true });
    } finally {
      setSwitchingNow(false);
    }
  };

  const face = (
    <>
      <Avatar name={current.name} size="sm" variant="institution" />
      {switching ? (
        <span className="inline-flex min-w-0 flex-1 items-center gap-2 text-left">
          <Spinner size="xs" delay={0} />
          <span className="truncate pt-0.5 pb-1">Switching…</span>
        </span>
      ) : (
        <span className="min-w-0 flex-1 truncate pt-0.5 pb-1 text-left font-medium">
          {interactive ? <span className="sr-only">Institution: </span> : null}
          <span dir="auto">{current.name}</span>
          {interactive ? <span className="sr-only">. Switch institution</span> : null}
        </span>
      )}
      {current.trial && !switching ? <Badge variant="tag">Trial</Badge> : null}
    </>
  );

  if (memberships.length <= 1) {
    return (
      <span className={cn("inline-flex h-control-sm min-w-0 items-center gap-2 px-2 text-sm text-fg", drawer ? "w-full" : "max-w-72", className)}>
        {face}
      </span>
    );
  }

  const triggerClass = cn(
    "inline-flex h-control-sm min-w-0 items-center gap-2 rounded-md px-2 text-sm text-fg transition-colors duration-fast hover:bg-surface-hover data-[state=open]:bg-surface-hover",
    drawer ? "w-full" : "max-w-72",
    className,
  );
  const trigger = (
    <button
      type="button"
      aria-disabled={switching || undefined}
      onPointerDown={(event) => {
        if (switching) event.preventDefault();
      }}
      onKeyDown={(event) => {
        if (switching && (event.key === "Enter" || event.key === " " || event.key === "ArrowDown")) event.preventDefault();
      }}
      className={triggerClass}
    >
      {face}
      <ChevronsUpDown aria-hidden="true" className="size-icon-sm shrink-0 text-muted" />
    </button>
  );

  if (memberships.length > MAX_MENU) {
    return (
      <Popover size="md" variant="list" title="Switch institution" titleAs="h2" trigger={trigger} align="start">
        <InstitutionSearch current={current} memberships={memberships} onChoose={choose} />
        {supportStaff ? (
          <div className="mt-1 border-t border-border pt-1">
            <Link href={manageHref} className="flex h-menu-item items-center gap-2 rounded-sm px-2 text-sm text-fg hover:bg-surface-hover focus-inset">
              <Settings aria-hidden="true" className="size-icon-sm text-muted" />
              Manage institutions
            </Link>
          </div>
        ) : null}
      </Popover>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel>Switch institution</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={current.id} onValueChange={(id) => void choose(id)}>
          {memberships.map((membership) => (
            <DropdownMenuRadioItem
              key={membership.id}
              value={membership.id}
              textValue={membership.name}
              icon={<Avatar name={membership.name} size="sm" variant="institution" />}
              description={membership.suspended ? undefined : membership.role}
              unavailableReason={membership.suspended ? SUSPENDED_REASON : undefined}
              badge={membership.suspended ? <StatusPill domain="orgs.status" value="suspended" className="ml-2" /> : undefined}
            >
              {membership.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {supportStaff ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={manageHref}>
                <Settings aria-hidden="true" className="size-icon-sm shrink-0 text-muted" />
                <span className="truncate pt-0.5 pb-1">Manage institutions</span>
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The searchable form (9 or more memberships): a search field that filters a listbox. Typing
 * filters; Down and Up move through the options (focus stays in the field, aria-activedescendant);
 * Enter chooses; Esc closes the popover.
 */
function InstitutionSearch({
  current,
  memberships,
  onChoose,
}: {
  current: Membership;
  memberships: Membership[];
  onChoose: (id: string) => void;
}) {
  const listId = useId();
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("en-IN");
    return needle ? memberships.filter((membership) => membership.name.toLocaleLowerCase("en-IN").includes(needle)) : memberships;
  }, [memberships, query]);
  const activeIndex = Math.min(active, Math.max(0, filtered.length - 1));
  const optionId = (index: number) => `${listId}-option-${index}`;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(filtered.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Home") {
      setActive(0);
    } else if (event.key === "End") {
      setActive(filtered.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const choice = filtered[activeIndex];
      if (choice && !choice.suspended) onChoose(choice.id);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="relative px-1 pt-1">
        <label htmlFor={inputId} className="sr-only">
          Search institutions
        </label>
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 mt-0.5 size-icon-sm -translate-y-1/2 text-muted" />
        <input
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={filtered.length ? optionId(activeIndex) : undefined}
          autoComplete="off"
          placeholder="Search institutions"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="h-control-sm w-full rounded-md border border-input bg-surface pr-2.5 pl-9 text-sm text-fg transition-colors duration-fast placeholder:text-muted hover:border-muted"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="m-0 px-2 py-3 text-sm text-muted">No matches</p>
      ) : (
        <ul id={listId} role="listbox" aria-label="Institutions" className="m-0 flex max-h-80 list-none flex-col overflow-y-auto p-0">
          {filtered.map((membership, index) => (
            <li
              key={membership.id}
              id={optionId(index)}
              role="option"
              aria-selected={membership.id === current.id}
              aria-disabled={membership.suspended || undefined}
              data-highlighted={index === activeIndex ? "" : undefined}
              onPointerMove={() => setActive(index)}
              onClick={() => {
                if (!membership.suspended) onChoose(membership.id);
              }}
              className={cn(
                "flex min-h-menu-item cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-fg data-[highlighted]:bg-surface-hover",
                membership.suspended && "cursor-not-allowed",
                index === activeIndex && "outline-2 -outline-offset-2 outline-focus-ring outline-solid",
              )}
            >
              <Avatar name={membership.name} size="sm" variant="institution" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span dir="auto" className={cn("truncate pt-0.5 pb-1", membership.id === current.id && "font-medium")}>
                  {membership.name}
                </span>
                <span className="-mt-1 text-xs text-muted">{membership.suspended ? SUSPENDED_REASON : membership.role}</span>
              </span>
              {membership.id === current.id ? <span className="text-xs text-accent">Current</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
