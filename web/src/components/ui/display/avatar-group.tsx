"use client";

import { Popover } from "@/components/ui/overlays/popover";
import { Tooltip } from "@/components/ui/overlays/tooltip";
import { cn } from "@/lib/cn";
import { formatList } from "@/lib/format";
import { Avatar } from "./avatar";

export type GroupPerson = {
  id: string;
  name: string;
  /** The primary owner comes first and is named "(primary)". */
  primary?: boolean;
  checkedIn?: boolean;
  /** The signed-in person (accent-subtle colours). */
  you?: boolean;
  inactive?: boolean;
};

/** owners (S05 rows, S08 header); members (S34 teams); participants (S15 assignee history). */
export type AvatarGroupKind = "owners" | "members" | "participants";

const NOUN: Record<AvatarGroupKind, { heading: string; one: string; many: string }> = {
  owners: { heading: "Owners", one: "owner", many: "owners" },
  members: { heading: "Team members", one: "member", many: "members" },
  participants: { heading: "Participants", one: "participant", many: "participants" },
};

/** The ring follows the row the group sits in, so the overlap edges match the fill. */
const RING = {
  surface: "ring-2 ring-surface",
  "hover-row": "ring-2 ring-surface group-hover:ring-surface-hover",
  "selected-row": "ring-2 ring-accent-subtle",
} as const;

export type AvatarGroupProps = {
  people: GroupPerson[];
  kind?: AvatarGroupKind;
  size?: "sm" | "md";
  /** Visible avatars before the "+N" button. */
  max?: number;
  ring?: keyof typeof RING;
  className?: string;
};

/**
 * Several people in little space, with the full list one click away (components.md, AvatarGroup).
 * role="group" with a label that lists the names, so the group is read once and in full; the
 * avatars are aria-hidden with a Tooltip each for pointer users. Only the overflow button is
 * focusable; Enter or Space opens the Popover, Esc closes it.
 */
export function AvatarGroup({ people, kind = "owners", size = "md", max = 3, ring = "surface", className }: AvatarGroupProps) {
  const noun = NOUN[kind];
  if (people.length === 0) {
    return (
      <span className={cn("inline-flex items-center gap-2 text-sm text-muted", className)}>
        <Avatar variant="unassigned" size={size} />
        Unassigned
      </span>
    );
  }

  const ordered = [...people].sort((a, b) => Number(Boolean(b.primary)) - Number(Boolean(a.primary)));
  const visible = ordered.slice(0, max);
  const hidden = ordered.length - visible.length;
  const nameOf = (person: GroupPerson) => (person.primary ? `${person.name} (primary)` : person.name);
  const listed = visible.slice(0, hidden > 0 ? Math.min(2, visible.length) : visible.length).map(nameOf);
  const rest = ordered.length - listed.length;
  const groupLabel = `${noun.heading}: ${rest > 0 ? `${listed.join(", ")} and ${rest} more` : formatList(listed)}`;

  return (
    <div role="group" aria-label={groupLabel} className={cn("inline-flex items-center", size === "sm" ? "-space-x-1.5" : "-space-x-2", className)}>
      {visible.map((person) => (
        <Tooltip key={person.id} content={person.checkedIn ? `${person.name}, checked in` : person.name}>
          <span className="inline-flex">
            <Avatar
              name={person.name}
              size={size}
              variant={person.you ? "you" : person.inactive ? "inactive" : "person"}
              className={cn("rounded-pill", RING[ring])}
            />
          </span>
        </Tooltip>
      ))}
      {hidden > 0 ? (
        <Popover
          size="sm"
          variant="list"
          title={noun.heading}
          titleAs="h3"
          trigger={
            <button
              type="button"
              className={cn(
                "relative inline-flex shrink-0 items-center justify-center rounded-pill bg-surface-sunken text-xs font-medium text-fg tabular-nums transition-colors duration-fast hover:bg-surface-hover",
                size === "sm" ? "size-avatar-sm" : "size-avatar-md",
                RING[ring],
              )}
            >
              <span aria-hidden="true">+{hidden}</span>
              <span className="sr-only">{`Show all ${ordered.length} ${noun.many}`}</span>
            </button>
          }
        >
          <ul className="m-0 flex list-none flex-col p-0">
            {ordered.map((person) => (
              <li key={person.id} className="flex min-h-menu-item items-center gap-2 rounded-sm px-2 py-1.5">
                <Avatar name={person.name} size="sm" variant={person.you ? "you" : person.inactive ? "inactive" : "person"} presence={person.checkedIn} ringClassName="ring-surface-raised" />
                <span className="flex min-w-0 flex-col">
                  <span dir="auto" className="truncate pt-0.5 pb-1 text-sm text-fg">
                    {person.name}
                    {person.inactive ? " (inactive)" : ""}
                  </span>
                  {person.primary || person.checkedIn ? (
                    <span className="-mt-1 text-xs text-muted">
                      {[person.primary ? "Primary owner" : null, person.checkedIn ? "Checked in" : null].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </Popover>
      ) : null}
    </div>
  );
}
