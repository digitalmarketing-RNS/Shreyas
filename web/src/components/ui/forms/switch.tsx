"use client";

import { CircleAlert, Loader, LoaderCircle } from "lucide-react";
import { type ReactNode, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ControlTooltip } from "../icon-button";
import { ConfirmPrompt } from "./confirm-prompt";
import { useControllableState, useDelayedFlag } from "./hooks";

export type SwitchProps = {
  /** Names the setting, not the action: "Round-robin assignment". Never changes with the state. */
  label: ReactNode;
  description?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  /**
   * Saves the change. The switch flips at once; while the promise runs the input is aria-disabled
   * (a small spinner shows on the thumb after 300 ms); if it rejects, the switch flips back and
   * "Couldn't save. Try again." appears under the row.
   */
  onCheckedChange?: (checked: boolean) => void | Promise<unknown>;
  /** sm: 36 x 20 track. md: 44 x 24 track (default). */
  size?: "sm" | "md";
  /** row (label left, switch right) or table (the label is sr-only: "Automation: Welcome series"). */
  layout?: "row" | "table";
  name?: string;
  disabled?: boolean;
  /** No permission: the switch stays focusable with aria-disabled and this reason ("Only admins can change this."). */
  disabledReason?: string;
  /** Turning it off stops something (sending): ask first. */
  confirmOff?: { title: string; description: string; confirmLabel: string };
  failureMessage?: string;
  /** Force a status: a save started elsewhere, or a still preview of "pending" and "failed". */
  status?: "pending" | "failed";
  className?: string;
};

const TRACK = {
  sm: "h-5 w-9",
  md: "h-6 w-11",
};
const THUMB = {
  sm: "size-4 peer-checked:translate-x-4",
  md: "size-5 peer-checked:translate-x-5",
};

/**
 * Turns a setting on or off with immediate effect, with no Save button (components.md Switch).
 * A native <input type="checkbox" role="switch">: screen readers say "switch, on" or "off". Inside
 * a form that has a Save button, use Checkbox instead. Space toggles; Enter does nothing.
 *
 * The thumb position and the fill both show the state; the whole row is the hit area.
 */
export function Switch({
  label,
  description,
  checked,
  defaultChecked = false,
  onCheckedChange,
  size = "md",
  layout = "row",
  name,
  disabled = false,
  disabledReason,
  confirmOff,
  failureMessage = "Couldn't save. Try again.",
  status,
  className,
}: SwitchProps) {
  const base = useId();
  const inputId = `${base}-input`;
  const labelId = `${base}-label`;
  const descriptionId = `${base}-description`;
  const reasonId = `${base}-reason`;
  const [on, setOn] = useControllableState(checked, defaultChecked);
  const [savingNow, setPending] = useState(false);
  const [failedNow, setFailed] = useState(false);
  const pending = savingNow || status === "pending";
  const failed = failedNow || status === "failed";
  const [asking, setAsking] = useState(false);
  const showSpinner = useDelayedFlag(pending, 300);
  const run = useRef(0);

  const unavailable = Boolean(disabledReason) || pending;
  const looksDisabled = disabled || Boolean(disabledReason);

  const commit = (next: boolean) => {
    const previous = on;
    setOn(next);
    setFailed(false);
    const result = onCheckedChange?.(next);
    if (!result || typeof (result as Promise<unknown>).then !== "function") return;
    const ticket = ++run.current;
    setPending(true);
    (result as Promise<unknown>).then(
      () => {
        if (ticket === run.current) setPending(false);
      },
      () => {
        if (ticket !== run.current) return;
        setPending(false);
        setOn(previous);
        setFailed(true);
      },
    );
  };

  const request = (next: boolean) => {
    if (unavailable || disabled) return;
    if (!next && confirmOff) {
      setAsking(true);
      return;
    }
    commit(next);
  };

  const input = (
    <input
      id={inputId}
      type="checkbox"
      role="switch"
      name={name}
      checked={on}
      disabled={disabled}
      aria-labelledby={labelId}
      aria-describedby={[description ? descriptionId : null, disabledReason ? reasonId : null].filter(Boolean).join(" ") || undefined}
      aria-disabled={unavailable || undefined}
      onChange={(event) => request(event.currentTarget.checked)}
      onClick={(event) => {
        // aria-disabled keeps focus but must not change the state.
        if (unavailable) event.preventDefault();
      }}
      className="peer sr-only"
    />
  );

  const track = (
    <span className={cn("relative inline-flex shrink-0 items-center", layout === "table" ? "min-h-hit min-w-11" : "")}>
      {input}
      <span
        aria-hidden="true"
        data-track=""
        className={cn(
          "block rounded-pill border border-transparent transition-colors duration-fast",
          TRACK[size],
          looksDisabled
            ? "bg-surface-sunken peer-checked:bg-accent-subtle"
            : "bg-input peer-checked:bg-accent group-hover/switch:bg-muted group-hover/switch:peer-checked:bg-accent-hover",
          "forced-colors:peer-checked:bg-[Highlight]",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring peer-focus-visible:outline-solid",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 left-0.5 inline-flex -translate-y-1/2 items-center justify-center rounded-pill bg-surface shadow-card",
          "motion-safe:transition-transform motion-safe:duration-fast motion-safe:ease-standard",
          THUMB[size],
          !looksDisabled && "peer-checked:bg-on-accent",
        )}
      >
        {showSpinner ? (
          <>
            <LoaderCircle className="size-3 text-muted motion-safe:animate-spin motion-reduce:hidden" />
            <Loader className="hidden size-3 text-muted motion-reduce:inline-block" />
          </>
        ) : null}
      </span>
    </span>
  );

  const labelText = (
    <span className="flex min-w-0 flex-col">
      <span id={labelId} className={cn("text-sm", layout === "table" ? "sr-only" : "font-medium", looksDisabled ? "text-muted" : "text-fg")}>
        {label}
      </span>
      {description && layout !== "table" ? (
        <span id={descriptionId} className="text-xs text-muted">
          {description}
        </span>
      ) : null}
    </span>
  );

  const row = (
    <label
      htmlFor={inputId}
      aria-busy={pending || undefined}
      className={cn(
        "group/switch flex min-h-hit cursor-pointer items-center",
        layout === "row" ? "justify-between gap-4" : "justify-center",
        looksDisabled && "cursor-not-allowed",
      )}
    >
      {labelText}
      {track}
    </label>
  );

  return (
    <div className={cn("flex flex-col", className)}>
      {disabledReason ? <ControlTooltip content={disabledReason}>{row}</ControlTooltip> : row}
      {disabledReason ? (
        <span id={reasonId} hidden>
          {disabledReason}
        </span>
      ) : null}
      <div role="alert">
        {failed ? (
          <p className="m-0 mt-1 flex items-center gap-1 text-xs font-medium text-danger">
            <CircleAlert aria-hidden="true" className="size-icon-sm shrink-0" />
            {failureMessage}
          </p>
        ) : null}
      </div>
      {confirmOff ? (
        <ConfirmPrompt
          open={asking}
          onOpenChange={setAsking}
          title={confirmOff.title}
          description={confirmOff.description}
          confirmLabel={confirmOff.confirmLabel}
          destructive
          onConfirm={() => commit(false)}
        />
      ) : null}
    </div>
  );
}
