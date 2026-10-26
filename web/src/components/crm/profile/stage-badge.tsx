"use client";

import { ChevronDown, CircleDot, Lock } from "lucide-react";
import { type Ref, useId } from "react";
import { ControlSpinner, ControlTooltip, IconButton, blockWhenUnavailable } from "@/components/ui/icon-button";
import { Popover } from "@/components/ui/overlays/popover";
import { cn } from "@/lib/cn";

export type StageBadgeProps = {
  /** The stage name, in the institution's own words: "Interested". */
  stage: string;
  /** "Campus visit planned". */
  subStage?: string | null;
  /** The built-in first stage, "New": the vocabulary's CircleDot icon. */
  isNew?: boolean;
  /** A stage turned off in settings that older leads still carry: "(turned off)" follows the name. */
  turnedOff?: boolean;
  /**
   * A stage rule ("lock" or "only_users") blocks this viewer: the reason. Static badges show the
   * Lock icon; interactive ones add a "Why is this locked?" button that opens the reason.
   */
  lockedReason?: string | null;
  /** static (tables, timeline, inbox side panel) or interactive (profile header: opens Change stage). */
  variant?: "static" | "interactive";
  /** Interactive: opens the Change stage dialog (S09). */
  onChange?: () => void;
  /** Interactive: the role can see stages but not change them ("Your role can see stages but not change them."). */
  disabledReason?: string | null;
  /** Interactive: a change is waiting for the server; a spinner replaces the chevron. */
  saving?: boolean;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
};

const STATIC = "inline-flex h-chip max-w-64 min-w-0 items-center gap-1 rounded-sm bg-surface-sunken px-2 text-xs font-medium text-fg";
const INTERACTIVE = cn(
  "inline-flex h-control-sm max-w-64 min-w-0 items-center gap-1.5 rounded-md border border-input bg-surface px-3 text-sm text-fg",
  "transition-colors duration-fast ease-standard hover:bg-surface-hover [&_svg]:size-icon-sm [&_svg]:shrink-0",
);

/** The words inside the badge: name, then an aria-hidden "·" and the sub-stage (read as ", sub-stage "). */
function StageText({ stage, subStage, turnedOff }: Pick<StageBadgeProps, "stage" | "subStage" | "turnedOff">) {
  return (
    <span className="truncate pt-0.5 pb-1" dir="auto">
      {stage}
      {turnedOff ? <span className="font-normal text-muted"> (turned off)</span> : null}
      {subStage ? (
        <>
          <span aria-hidden="true" className="text-muted">
            {" · "}
          </span>
          <span className="sr-only">, sub-stage </span>
          <span className="font-normal text-muted">{subStage}</span>
        </>
      ) : null}
    </span>
  );
}

/**
 * A lead's stage and sub-stage in one compact label, and whether a rule locks it for the viewer
 * (components.md, StageBadge). Stages have no colours: they are each institution's own words. The
 * name is always text, never colour or icon alone.
 *
 * Keyboard: the static badge is not focusable. Interactive: Tab, then Enter or Space opens the
 * Change stage dialog. The lock button is a toggletip: Enter opens the reason, Esc closes it and
 * returns focus.
 */
export function StageBadge({
  stage,
  subStage,
  isNew = false,
  turnedOff = false,
  lockedReason,
  variant = "static",
  onChange,
  disabledReason,
  saving = false,
  className,
  ref,
}: StageBadgeProps) {
  const reasonId = useId();

  if (variant === "static") {
    return (
      <span className={cn(STATIC, className)}>
        {lockedReason ? <Lock aria-hidden="true" className="size-3 shrink-0 text-muted" /> : null}
        {isNew && !lockedReason ? <CircleDot aria-hidden="true" className="size-3 shrink-0 text-muted" /> : null}
        <StageText stage={stage} subStage={subStage} turnedOff={turnedOff} />
        {lockedReason ? <span className="sr-only">, locked</span> : null}
      </span>
    );
  }

  // A locked stage stays visible with aria-disabled and the reason, so people learn why.
  const reason = disabledReason ?? lockedReason ?? null;
  const unavailable = Boolean(reason) || saving;
  const name = `Stage: ${stage}${turnedOff ? " (turned off)" : ""}${subStage ? `, ${subStage}` : ""}${lockedReason ? ", locked" : ""}. Change stage`;
  const button = (
    <button
      ref={ref}
      type="button"
      aria-label={name}
      aria-disabled={unavailable || undefined}
      aria-busy={saving || undefined}
      aria-describedby={reason ? reasonId : undefined}
      onClick={blockWhenUnavailable<HTMLButtonElement>(unavailable, () => onChange?.())}
      className={cn(INTERACTIVE, reason && "cursor-not-allowed", saving && "cursor-progress", className)}
    >
      {isNew ? <CircleDot aria-hidden="true" className="text-muted" /> : null}
      {lockedReason ? <Lock aria-hidden="true" className="text-muted" /> : null}
      <StageText stage={stage} subStage={subStage} turnedOff={turnedOff} />
      {saving ? <ControlSpinner className="size-icon-sm text-muted" /> : <ChevronDown aria-hidden="true" className="text-muted" />}
    </button>
  );

  return (
    <span className="inline-flex items-center gap-1">
      {reason ? <ControlTooltip content={reason}>{button}</ControlTooltip> : button}
      {reason ? (
        <span id={reasonId} hidden>
          {reason}
        </span>
      ) : null}
      {lockedReason ? (
        <Popover
          aria-label="Why is this locked?"
          size="sm"
          trigger={<IconButton icon={<Lock />} aria-label="Why is this locked?" size="xs" tooltip={false} />}
        >
          <p className="m-0 text-sm leading-prose text-fg">{lockedReason}</p>
        </Popover>
      ) : null}
    </span>
  );
}
