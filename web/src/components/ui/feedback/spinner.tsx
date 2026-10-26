"use client";

import { useEffect, useState } from "react";
import { ControlSpinner } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";

const SIZE = { xs: "size-icon-sm", sm: "size-icon-md", md: "size-icon-lg" } as const;

export type SpinnerProps = {
  /** xs 16 px, sm 20 px, md 24 px. */
  size?: keyof typeof SIZE;
  /** Visible text next to it: "Saving…", "Checking payment status…". */
  label?: string;
  /** Wraps icon and label in a role="status" element (a popover body, the S02 return page). */
  standalone?: boolean;
  /** Hidden for the first part of a wait, so fast work never flashes a spinner. Default 300 ms. */
  delay?: number;
  className?: string;
};

/**
 * A small "working" sign for short waits inside a control or a line (components.md, Spinner).
 * LoaderCircle spins; under reduced motion the static Loader shows with visible "Loading…" text.
 * Not focusable; icons are aria-hidden. Inside a control the control's own loading text is the
 * announcement, so pass no label there.
 */
export function Spinner({ size = "sm", label, standalone = false, delay = 300, className }: SpinnerProps) {
  const [visible, setVisible] = useState(delay <= 0);
  useEffect(() => {
    if (delay <= 0) return;
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  const content = (
    <>
      <ControlSpinner className={SIZE[size]} />
      {label ? (
        <span className="text-sm">{label}</span>
      ) : (
        <>
          <span className="hidden text-sm motion-reduce:inline">Loading…</span>
          {standalone ? <span className="sr-only motion-reduce:hidden">Loading</span> : null}
        </>
      )}
    </>
  );

  return (
    <span
      role={standalone ? "status" : undefined}
      className={cn("inline-flex items-center gap-2", label || standalone ? "text-muted" : "text-current", className)}
    >
      <span className={cn("inline-flex items-center gap-2", !visible && "invisible")}>{content}</span>
    </span>
  );
}
