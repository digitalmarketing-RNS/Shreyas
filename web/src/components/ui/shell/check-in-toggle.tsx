"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useId, useState } from "react";
import { Card } from "@/components/ui/display/card";
import { DropdownMenuCheckboxItem } from "@/components/ui/overlays/dropdown-menu";
import { Tooltip } from "@/components/ui/overlays/tooltip";
import { cn } from "@/lib/cn";
import { useShell } from "./shell-context";

export type CheckInValue = {
  checkedIn: boolean;
  /** "9:12 am", formatted on the server in the org's zone. */
  since?: string;
  /** Set after the auto_checkout job ran: "7:00 pm". */
  autoCheckedOutAt?: string;
};

export type CheckInToggleProps = CheckInValue & {
  /**
   * header: Switch sm in the AppHeader, status line at xl and up (in the Tooltip below xl).
   * card: S04 My day, Switch md with the day's facts.
   */
  variant?: "header" | "card";
  /** POST /me/check-in or /me/check-out. The switch flips at once; a rejection flips it back. */
  onChange?: (checkedIn: boolean) => Promise<void>;
  /** card: "Leads assigned today: 6". */
  leadsToday?: number;
  /** card: "7:00 pm IST". */
  autoCheckoutTime?: string;
  attendanceHref?: string;
  /** card: the title's heading level. */
  headingLevel?: 2 | 3;
  /** Draw a phase for documentation: the saving spinner or the failure line. */
  frozen?: "saving" | "failed";
  className?: string;
};

function statusLine({ checkedIn, since, autoCheckedOutAt }: CheckInValue): string {
  if (checkedIn) return since ? `Since ${since}` : "Taking new leads";
  if (autoCheckedOutAt) return `Checked out automatically at ${autoCheckedOutAt}`;
  return "Not taking new leads";
}

function tooltipLine(value: CheckInValue): string {
  if (value.checkedIn) return value.since ? `Checked in since ${value.since}` : "Checked in";
  return "Checked out. New leads go to colleagues who are checked in.";
}

/**
 * The optimistic toggle state shared by the forms: flips at once, aria-disabled while saving, a
 * spinner on the thumb after 300 ms, flips back with an inline error when the save fails. No toast
 * on success: the switch is the confirmation. Realtime changes from another device update it.
 */
function useCheckIn(props: CheckInValue & { onChange?: (next: boolean) => Promise<void>; frozen?: "saving" | "failed" }) {
  const [value, setValue] = useState(props.checkedIn);
  const [propValue, setPropValue] = useState(props.checkedIn);
  const [saving, setSaving] = useState(false);
  const [slow, setSlow] = useState(false);
  const [failed, setFailed] = useState(false);
  if (props.checkedIn !== propValue) {
    setPropValue(props.checkedIn);
    setValue(props.checkedIn);
  }

  useEffect(() => {
    if (!saving) return;
    const timer = window.setTimeout(() => setSlow(true), 300);
    return () => {
      window.clearTimeout(timer);
      setSlow(false);
    };
  }, [saving]);

  const toggle = async () => {
    if (saving) return;
    const next = !value;
    setValue(next);
    setFailed(false);
    setSaving(true);
    try {
      await props.onChange?.(next);
    } catch {
      setValue(!next);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return {
    checked: value,
    saving: saving || props.frozen === "saving",
    spinner: slow || props.frozen === "saving",
    failed: failed || props.frozen === "failed",
    toggle,
    line: statusLine({ ...props, checkedIn: value, autoCheckedOutAt: value === props.checkedIn ? props.autoCheckedOutAt : undefined }),
    tooltip: tooltipLine({ ...props, checkedIn: value }),
  };
}

/**
 * Lets a counsellor say they are at work and taking new leads (components.md, CheckInToggle). Built
 * on the Switch pattern: a native checkbox with role="switch" whose accessible name is the constant
 * label "Checked in" (the state is never part of the name); the status line is its description.
 * Shown only to members who can receive leads by assignment; hidden for everyone else, never disabled.
 */
export function CheckInToggle({
  variant = "header",
  checkedIn,
  since,
  autoCheckedOutAt,
  onChange,
  leadsToday,
  autoCheckoutTime,
  attendanceHref = "/settings/users/me/attendance",
  headingLevel = 2,
  frozen,
  className,
}: CheckInToggleProps) {
  const statusId = useId();
  const state = useCheckIn({ checkedIn, since, autoCheckedOutAt, onChange, frozen });
  const { breakpoint } = useShell();
  const card = variant === "card";

  const status = state.failed ? (
    <span id={statusId} role="alert" className="text-xs text-danger">
      Couldn&apos;t update. Try again.
    </span>
  ) : (
    <span id={statusId} className={cn("text-xs text-muted", !card && "hidden @7xl/shell:inline")}>
      {state.line}
    </span>
  );

  const control = (
    <SwitchControl
      size={card ? "md" : "sm"}
      checked={state.checked}
      saving={state.saving}
      spinner={state.spinner}
      describedBy={statusId}
      onToggle={state.toggle}
      label={<span className={card ? "text-base font-semibold text-fg" : "text-sm font-medium text-fg"}>Checked in</span>}
      className={card ? undefined : "h-control-sm px-2"}
    />
  );

  if (card) {
    return (
      <Card variant="standalone" title="Check-in" titleLevel={headingLevel} className={className}>
        <div className="flex flex-col gap-1">
          {control}
          {status}
        </div>
        <ul className="m-0 mt-3 flex list-none flex-col gap-1 p-0 text-sm text-fg">
          {leadsToday !== undefined ? <li>Leads assigned today: {leadsToday}</li> : null}
          {autoCheckoutTime ? <li>Automatic check-out: {autoCheckoutTime}</li> : null}
        </ul>
        <Link href={attendanceHref} className="mt-3 inline-flex min-h-hit items-center rounded-sm text-sm text-accent underline underline-offset-2 hover:decoration-2">
          Attendance history
        </Link>
      </Card>
    );
  }

  const withTooltip = breakpoint === "xl" ? control : <Tooltip content={state.tooltip}>{control}</Tooltip>;
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {withTooltip}
      {status}
    </div>
  );
}

/**
 * The menu-item form: inside UserMenu and the nav drawer below md, a menuitemcheckbox "Checked in"
 * with the status line as its second line. Space toggles it without closing the menu.
 */
export function CheckInMenuItem({ checkedIn, since, autoCheckedOutAt, onChange }: Omit<CheckInToggleProps, "variant">) {
  const state = useCheckIn({ checkedIn, since, autoCheckedOutAt, onChange });
  return (
    <DropdownMenuCheckboxItem
      checked={state.checked}
      onCheckedChange={() => void state.toggle()}
      description={state.failed ? "Couldn't update. Try again." : state.line}
    >
      Checked in
    </DropdownMenuCheckboxItem>
  );
}

const SWITCH = {
  sm: { track: "h-5 w-9", thumb: "size-4", on: "translate-x-4", spinner: "size-3" },
  md: { track: "h-6 w-11", thumb: "size-5", on: "translate-x-5", spinner: "size-3.5" },
} as const;

/** The group 1 Switch look (components.md, Switch): a native checkbox with role="switch", then the track and thumb. */
function SwitchControl({
  size,
  checked,
  saving,
  spinner,
  describedBy,
  onToggle,
  label,
  className,
}: {
  size: "sm" | "md";
  checked: boolean;
  saving: boolean;
  spinner: boolean;
  describedBy: string;
  onToggle: () => void;
  label: ReactNode;
  className?: string;
}) {
  const s = SWITCH[size];
  return (
    <label className={cn("inline-flex min-h-hit cursor-pointer items-center gap-2 rounded-md select-none", className)} aria-busy={saving || undefined}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        aria-disabled={saving || undefined}
        aria-describedby={describedBy}
        onChange={(event) => {
          if (saving) {
            event.preventDefault();
            return;
          }
          onToggle();
        }}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex shrink-0 items-center rounded-pill border border-transparent p-px transition-colors duration-fast",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring peer-focus-visible:outline-solid",
          s.track,
          checked ? "bg-accent hover:bg-accent-hover forced-colors:bg-[Highlight]" : "bg-input hover:bg-muted",
        )}
      >
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-pill shadow-card motion-safe:transition-transform motion-safe:duration-fast motion-safe:ease-standard",
            s.thumb,
            checked ? cn("bg-on-accent text-accent", s.on) : "translate-x-0 bg-surface text-muted",
          )}
        >
          {spinner ? <LoaderCircle className={cn(s.spinner, "motion-safe:animate-spin")} /> : null}
        </span>
      </span>
      {label}
    </label>
  );
}
