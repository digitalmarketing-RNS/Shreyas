import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Tone } from "@/components/ui/feedback/tone";
import { Tooltip } from "@/components/ui/overlays/tooltip";
import { cn } from "@/lib/cn";
import { type StatusDomain, type StatusValue, fillStatusLabel, resolveStatus } from "./status-vocabulary";

const FILLED: Record<Tone, { pill: string; icon: string }> = {
  neutral: { pill: "bg-surface-sunken text-fg", icon: "text-muted" },
  info: { pill: "bg-info-subtle text-info", icon: "" },
  success: { pill: "bg-success-subtle text-success", icon: "" },
  warning: { pill: "bg-warning-subtle text-warning", icon: "" },
  danger: { pill: "bg-danger-subtle text-danger", icon: "" },
};

const PLAIN: Record<Tone, string> = {
  neutral: "text-fg",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

type Common = {
  /**
   * filled (default): tone fill; tables and lists, including hovered and selected rows.
   * plain: icon and label in the tone colour, no fill; only on surface, surface-raised, bg or a
   * hovered fill, never in rows that can be selected.
   */
  variant?: "filled" | "plain";
  /** Text after the pill (outside it), text-xs text-muted: "Number isn't on WhatsApp". */
  detail?: ReactNode;
  /** The time or reason behind the state: "Delivered 06 Oct, 2:31 pm IST". The pill becomes a tab stop unless `inFocusable`. */
  tooltip?: string;
  /** The pill sits inside a focusable parent (a row link), so it is not a tab stop of its own. */
  inFocusable?: boolean;
  className?: string;
};

export type StatusPillVocabularyProps<D extends StatusDomain = StatusDomain> = Common & {
  /** A domain of the Status vocabulary: "payments.status", "templates.wa_status". */
  domain: D;
  /** The raw value; unknown values show "Unknown ({raw})" and are logged, never breaking the page. */
  value: StatusValue<D> | (string & {}) | boolean | null;
  /** Values for "{name}" placeholders in the label: { timeLeft: "4 hr 10 min" }. */
  params?: Record<string, string>;
  tone?: never;
  label?: never;
  icon?: never;
};

export type StatusPillDirectProps = Common & {
  tone: Tone;
  label: string;
  icon?: LucideIcon | null;
  domain?: never;
  value?: never;
  params?: never;
};

export type StatusPillProps<D extends StatusDomain = StatusDomain> = StatusPillVocabularyProps<D> | StatusPillDirectProps;

/**
 * The state of a record with a label, an icon and a tone from the one shared vocabulary
 * (components.md, StatusPill), so the same state looks and reads the same everywhere. Read as text:
 * the label carries the meaning, the icon repeats it in shape, the tone is the third cue. No live
 * region of its own; if a status needs an action, that is a separate Button next to it.
 */
export function StatusPill<D extends StatusDomain>(props: StatusPillProps<D>) {
  const { variant = "filled", detail, tooltip, inFocusable = false, className } = props;
  let tone: Tone;
  let label: string;
  let Icon: LucideIcon | null | undefined;

  if (props.domain !== undefined) {
    const fromVocabulary = props as StatusPillVocabularyProps<D>;
    const resolved = resolveStatus(fromVocabulary.domain, fromVocabulary.value as string | boolean | null);
    if (!resolved.known && process.env.NODE_ENV !== "production") {
      console.warn(`StatusPill: unknown value ${String(fromVocabulary.value)} for ${fromVocabulary.domain}`);
    }
    tone = resolved.tone;
    label = fillStatusLabel(resolved.label, fromVocabulary.params);
    Icon = resolved.icon;
  } else {
    const direct = props as StatusPillDirectProps;
    tone = direct.tone;
    label = direct.label;
    Icon = direct.icon;
  }

  const pill = (
    <span
      tabIndex={tooltip && !inFocusable ? 0 : undefined}
      className={cn(
        "inline-flex h-chip shrink-0 items-center gap-1 rounded-pill border border-transparent text-xs font-medium whitespace-nowrap",
        variant === "filled" ? cn("px-2", FILLED[tone].pill) : cn("px-0", PLAIN[tone]),
        className,
      )}
    >
      {Icon ? <Icon aria-hidden="true" className={cn("size-icon-sm shrink-0", variant === "filled" ? FILLED[tone].icon : tone === "neutral" ? "text-muted" : undefined)} /> : null}
      {label}
    </span>
  );

  const withTooltip = tooltip ? <Tooltip content={tooltip}>{pill}</Tooltip> : pill;
  if (!detail) return withTooltip;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      {withTooltip}
      <span className="text-xs text-muted">{detail}</span>
    </span>
  );
}
