"use client";

import { UserRound } from "lucide-react";
import { Avatar as RadixAvatar } from "radix-ui";
import { Tooltip } from "@/components/ui/overlays/tooltip";
import { cn } from "@/lib/cn";
import { getInitials } from "./initials";

export type AvatarSize = "sm" | "md" | "lg";

/**
 * - person: neutral colours. you: the signed-in person, accent-subtle colours.
 * - inactive: initials in text-muted (the name shows "(inactive)").
 * - unassigned: a dashed outline with the UserRound icon, for leads with no owner.
 * - institution: a rounded square with initials (OrgSwitcher).
 * No per-person colours: colour would need its own pairs and could look like a status.
 */
export type AvatarVariant = "person" | "you" | "inactive" | "unassigned" | "institution";

const SIZE: Record<AvatarSize, { box: string; text: string; icon: string }> = {
  sm: { box: "size-avatar-sm", text: "text-xs font-semibold", icon: "size-3.5" },
  md: { box: "size-avatar-md", text: "text-xs font-semibold", icon: "size-icon-sm" },
  lg: { box: "size-avatar-lg", text: "text-sm font-semibold", icon: "size-icon-md" },
};

const VARIANT: Record<AvatarVariant, string> = {
  person: "rounded-pill bg-surface-sunken text-fg",
  you: "rounded-pill bg-accent-subtle text-accent",
  inactive: "rounded-pill bg-surface-sunken text-muted",
  unassigned: "rounded-pill border border-dashed border-input bg-transparent text-muted",
  institution: "rounded-md bg-surface-sunken text-fg",
};

export type AvatarProps = {
  name?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  /** The person is checked in (shown where check-in matters: S13 target list, S32, S34). */
  presence?: boolean;
  /**
   * Alone, with no visible name next to it: role="img" with the full name (plus ", checked in")
   * and a Tooltip with the same text. Next to a visible name (the default) it is aria-hidden.
   */
  standalone?: boolean;
  /** The colour of the ring around the presence dot follows the row: surface, hovered, selected. */
  ringClassName?: string;
  className?: string;
};

/**
 * A small marker for a person or an institution (components.md, Avatar). Radix Avatar with the
 * fallback only (the schema stores no photos in v1). Not focusable on its own.
 */
export function Avatar({
  name,
  size = "md",
  variant = "person",
  presence = false,
  standalone = false,
  ringClassName,
  className,
}: AvatarProps) {
  const styles = SIZE[size];
  const initials = variant === "unassigned" ? null : getInitials(name, size === "sm" ? 1 : 2);
  const fullName = variant === "unassigned" ? "Unassigned" : (name ?? "");
  const accessibleName = presence ? `${fullName}, checked in` : fullName;

  const avatar = (
    <RadixAvatar.Root
      role={standalone ? "img" : undefined}
      aria-label={standalone ? accessibleName : undefined}
      aria-hidden={standalone ? undefined : true}
      className={cn("relative inline-flex shrink-0 items-center justify-center select-none", styles.box, className)}
    >
      <RadixAvatar.Fallback
        className={cn("inline-flex size-full items-center justify-center overflow-hidden leading-none", styles.text, VARIANT[variant])}
      >
        {initials ?? <UserRound aria-hidden="true" className={styles.icon} />}
      </RadixAvatar.Fallback>
      {presence ? (
        <span
          aria-hidden="true"
          className={cn("absolute -right-0.5 -bottom-0.5 size-2.5 rounded-pill bg-success ring-2 ring-surface", ringClassName)}
        />
      ) : null}
    </RadixAvatar.Root>
  );

  if (!standalone) return avatar;
  return <Tooltip content={accessibleName}>{avatar}</Tooltip>;
}
