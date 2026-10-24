import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type InlineAlertTone = "info" | "success" | "warning" | "danger";

const TONE: Record<InlineAlertTone, { box: string; icon: string; Icon: typeof Info; word: string }> = {
  info: { box: "border-info-subtle bg-info-subtle", icon: "text-info", Icon: Info, word: "Note" },
  success: { box: "border-success-subtle bg-success-subtle", icon: "text-success", Icon: CircleCheck, word: "Done" },
  warning: { box: "border-warning-subtle bg-warning-subtle", icon: "text-warning", Icon: TriangleAlert, word: "Warning" },
  danger: { box: "border-danger-subtle bg-danger-subtle", icon: "text-danger", Icon: CircleAlert, word: "Error" },
};

/**
 * The Alert look (components.md group 2, Alert tokens) for the messages group 1 components show
 * inside themselves: the minor-mode notice in ConsentCapture, the SecretReveal warning, the
 * DateTimePicker zone and clash notes, the CodeBlock "turned off" note and the FormLayout network
 * alert. When group 2's Alert lands, these can render through it; the classes are the same.
 *
 * - role: "alert" for errors after submit, "status" for alerts after a change, none on load.
 * - The tone word starts the screen-reader text unless the title already says it.
 */
export function InlineAlert({
  tone,
  title,
  children,
  role,
  id,
  srTone = true,
  actions,
  className,
  tabIndex,
}: {
  tone: InlineAlertTone;
  title?: ReactNode;
  children?: ReactNode;
  role?: "alert" | "status";
  id?: string;
  /** Adds the sr-only tone word ("Warning: "). Turn off when the title already says it. */
  srTone?: boolean;
  actions?: ReactNode;
  className?: string;
  tabIndex?: number;
}) {
  const { box, icon, Icon, word } = TONE[tone];
  return (
    <div id={id} role={role} tabIndex={tabIndex} className={cn("flex gap-3 rounded-md border p-3 text-sm text-fg", box, className)}>
      <Icon aria-hidden="true" className={cn("mt-0.5 size-icon-sm shrink-0", icon)} />
      <div className="flex min-w-0 flex-col gap-1">
        {title ? (
          <p className="m-0 font-semibold">
            {srTone ? <span className="sr-only">{word}: </span> : null}
            {title}
          </p>
        ) : null}
        {children ? (
          <div className="m-0">
            {srTone && !title ? <span className="sr-only">{word}: </span> : null}
            {children}
          </div>
        ) : null}
        {actions ? <div className="mt-1 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
