import { type LucideIcon, X } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { type ComplianceMessageKey, type MessageParams, getComplianceMessage } from "./messages";
import { TONE_ICON, TONE_ICON_TEXT, TONE_SURFACE, TONE_WORD, type Tone } from "./tone";

/**
 * - blocking: danger, not dismissible; something cannot be done at all until an admin acts.
 * - attention: warning, dismissible for 24 hours, then it returns while the cause remains.
 * - info: dismissible until the cause changes.
 * - session: offline, other-tab switch, new version; not dismissible, goes when resolved.
 */
export type BannerKind = "blocking" | "attention" | "info" | "session";

const DEFAULT_TONE: Record<BannerKind, Tone> = {
  blocking: "danger",
  attention: "warning",
  info: "info",
  session: "warning",
};

export type BannerProps = {
  kind?: BannerKind;
  /** Defaults by kind; the catalogue message's tone wins when messageKey is given. */
  tone?: Exclude<Tone, "neutral">;
  title?: ReactNode;
  /** One sentence. */
  children?: ReactNode;
  icon?: LucideIcon;
  /** One action: a Button sm or a link. */
  action?: ReactNode;
  /** attention and info kinds only. */
  onDismiss?: () => void;
  /**
   * Offline and the other-tab switch announce once (role="status") when they appear during a
   * session. Other banners are not live regions.
   */
  announce?: boolean;
  messageKey?: ComplianceMessageKey;
  params?: MessageParams;
  className?: string;
};

/**
 * A condition that affects the whole institution or session, shown at the top of every page
 * until it is fixed (components.md, Banner). Full width of the content column, not sticky. Tones
 * as Alert, with square corners and a bottom border only.
 */
export function Banner({
  kind = "attention",
  tone: toneProp,
  title: titleProp,
  children,
  icon,
  action,
  onDismiss,
  announce = false,
  messageKey,
  params,
  className,
}: BannerProps) {
  const message = messageKey ? getComplianceMessage(messageKey, params) : null;
  const tone: Tone = toneProp ?? message?.tone ?? DEFAULT_TONE[kind];
  const Icon = icon ?? message?.icon ?? TONE_ICON[tone];
  const title = titleProp ?? message?.title;
  const body = children ?? message?.body;
  const dismissible = Boolean(onDismiss) && (kind === "attention" || kind === "info");

  return (
    <div
      role={announce ? "status" : undefined}
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-gutter-sm py-2 text-sm text-fg @3xl/shell:px-gutter",
        TONE_SURFACE[tone],
        className,
      )}
    >
      <Icon aria-hidden="true" className={cn("size-icon-md shrink-0", TONE_ICON_TEXT[tone])} />
      <p className="m-0 min-w-0 flex-1 basis-60 leading-prose">
        {TONE_WORD[tone] ? <span className="sr-only">{TONE_WORD[tone]}: </span> : null}
        {title ? <span className="font-semibold">{title}</span> : null}
        {title && body ? " " : null}
        {body}
      </p>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      {dismissible ? (
        <IconButton
          icon={<X />}
          aria-label={kind === "info" ? "Hide this notice" : "Hide this notice for today"}
          size="sm"
          onClick={onDismiss}
        />
      ) : null}
    </div>
  );
}
