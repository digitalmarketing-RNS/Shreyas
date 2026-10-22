import { type LucideIcon, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { FocusOnMount } from "./focus-on-mount";
import { type ComplianceMessageKey, type MessageParams, getComplianceMessage } from "./messages";
import { TONE_ICON, TONE_ICON_TEXT, TONE_SURFACE, TONE_WORD, type Tone } from "./tone";

/**
 * - off: present when the page renders (most alerts). No live role: a live role on load is noise.
 * - polite: appears after a change the person made (picking a template): role="status".
 * - assertive: an error that appears after submit: role="alert".
 * - focused: a dialog's server error: tabindex="-1", focus moves to it, no live role, read once.
 */
export type AlertLive = "off" | "polite" | "assertive" | "focused";

export type AlertProps = {
  tone?: Tone;
  /** One line. Optional in the standard layout; the compact layout has none. */
  title?: ReactNode;
  /** One to three sentences: what happened, why, and what to do. */
  children?: ReactNode;
  /** Replaces the tone's default icon (the compliance catalogue gives per-message icons). null hides it. */
  icon?: LucideIcon | null;
  /** Buttons sm or links, shown under the body. */
  actions?: ReactNode;
  layout?: "standard" | "compact";
  live?: AlertLive;
  /** Only for advice that may be ignored. Shows the "Dismiss this tip" button. */
  onDismiss?: () => void;
  dismissLabel?: string;
  /** A message from the compliance catalogue: tone, icon, title and body come from it. */
  messageKey?: ComplianceMessageKey;
  params?: MessageParams;
  /** With messageKey: renders the catalogue's action as a secondary button that calls this. */
  onAction?: () => void;
  /** Set when the title already says the tone, so screen readers do not hear it twice. */
  toneWordInTitle?: boolean;
  id?: string;
  className?: string;
};

/**
 * A message about one region (a form, dialog, panel or table) that stays until its cause is gone
 * (components.md, Alert). Tone is carried by the icon and the words, never colour alone.
 */
export function Alert({
  tone: toneProp,
  title: titleProp,
  children,
  icon: iconProp,
  actions,
  layout = "standard",
  live = "off",
  onDismiss,
  dismissLabel = "Dismiss this tip",
  messageKey,
  params,
  onAction,
  toneWordInTitle = false,
  id,
  className,
}: AlertProps) {
  const message = messageKey ? getComplianceMessage(messageKey, params) : null;
  const tone: Tone = toneProp ?? message?.tone ?? "info";
  const Icon = iconProp === null ? null : (iconProp ?? message?.icon ?? TONE_ICON[tone]);
  const title = titleProp ?? message?.title;
  const body = children ?? message?.body;
  const compact = layout === "compact";
  const toneWord = TONE_WORD[tone];

  const role = live === "polite" ? "status" : live === "assertive" ? "alert" : undefined;
  const catalogueAction =
    message?.action && onAction ? (
      <Button variant="secondary" size="sm" onClick={onAction}>
        {message.action.label}
      </Button>
    ) : null;
  const allActions = actions ?? catalogueAction;

  return (
    <div
      id={id}
      role={role}
      tabIndex={live === "focused" ? -1 : undefined}
      className={cn(
        "relative flex rounded-md border text-sm text-fg",
        compact ? "items-start gap-2 px-3 py-2" : "items-start gap-3 p-3",
        TONE_SURFACE[tone],
        onDismiss && "pr-10",
        className,
      )}
    >
      {live === "focused" ? <FocusOnMount scrollAncestorToTop /> : null}
      {Icon ? <Icon aria-hidden="true" className={cn("size-icon-md shrink-0", compact ? "mt-px" : "mt-px", TONE_ICON_TEXT[tone])} /> : null}
      <div className="min-w-0 flex-1">
        {compact ? (
          <p className="m-0">
            {toneWord && !toneWordInTitle ? <span className="sr-only">{toneWord}: </span> : null}
            {title ? <span className="font-semibold">{title} </span> : null}
            {body}
          </p>
        ) : (
          <>
            {title ? (
              <p className="m-0 font-semibold">
                {toneWord && !toneWordInTitle ? <span className="sr-only">{toneWord}: </span> : null}
                {title}
              </p>
            ) : toneWord ? (
              <span className="sr-only">{toneWord}: </span>
            ) : null}
            {body ? <div className={cn("leading-prose", title && "mt-0.5")}>{body}</div> : null}
          </>
        )}
        {allActions ? <div className="mt-2 flex flex-wrap items-center gap-2">{allActions}</div> : null}
      </div>
      {onDismiss ? (
        <IconButton
          icon={<X />}
          aria-label={dismissLabel}
          size="xs"
          className="absolute top-2 right-2"
          onClick={onDismiss}
        />
      ) : null}
    </div>
  );
}
