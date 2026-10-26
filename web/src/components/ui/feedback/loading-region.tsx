"use client";

import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ProgressBar } from "./progress-bar";

export type LoadingRegionProps = {
  /** First load: the skeleton replaces the content. */
  loading?: boolean;
  /** Refetch (filter, sort, page change): the content stays, a 2 px bar runs along the top. */
  refetching?: boolean;
  /** What is loading, for the status line: "leads" gives "Loading leads…". */
  thing: string;
  /** The page's or region's Skeleton, in the final layout's sizes. */
  skeleton: ReactNode;
  /** Shown after `failAfter` ms, usually EmptyState (error) with "Try again". */
  timeoutFallback?: ReactNode;
  children?: ReactNode;
  /** Wait before the skeleton fades in, so fast loads never flash (300 ms). */
  delay?: number;
  /** "Still loading…" appears after 10 s. */
  stillLoadingAfter?: number;
  /** The error state after 30 s. */
  failAfter?: number;
  /** Freeze the region in one loading phase (documentation only). */
  phase?: "waiting" | "shown" | "still-loading" | "failed";
  className?: string;
};

type Phase = "waiting" | "shown" | "still-loading" | "failed";

/**
 * The loading rules (components.md, Skeleton: "Loading rules") in one wrapper: aria-busy on the
 * region, the skeleton after 300 ms (never a full-page spinner, never a spinner and a skeleton
 * together), one polite "Loading {thing}…" when it appears, "Still loading…" after 10 s, the error
 * state after 30 s. Refetching keeps the content (not dimmed) under a 2 px indeterminate bar.
 * One region failing never blanks the page.
 */
export function LoadingRegion({
  loading = false,
  refetching = false,
  thing,
  skeleton,
  timeoutFallback,
  children,
  delay = 300,
  stillLoadingAfter = 10_000,
  failAfter = 30_000,
  phase: frozenPhase,
  className,
}: LoadingRegionProps) {
  const [livePhase, setLivePhase] = useState<Phase>("waiting");
  const [wasLoading, setWasLoading] = useState(loading);
  // A new load starts from "waiting" (adjusting state during render, not in an effect).
  if (loading !== wasLoading) {
    setWasLoading(loading);
    if (loading) setLivePhase("waiting");
  }
  const phase = frozenPhase ?? livePhase;

  useEffect(() => {
    if (!loading || frozenPhase) return;
    const timers = [
      window.setTimeout(() => setLivePhase("shown"), delay),
      window.setTimeout(() => setLivePhase("still-loading"), stillLoadingAfter),
      window.setTimeout(() => setLivePhase("failed"), failAfter),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [loading, frozenPhase, delay, stillLoadingAfter, failAfter]);

  const busy = loading || refetching;
  const failed = loading && phase === "failed" && timeoutFallback;

  return (
    <div aria-busy={busy || undefined} className={cn("relative min-w-0", className)}>
      {refetching && !loading ? (
        <ProgressBar
          size="sm"
          hideLabel
          label={`Loading ${thing}`}
          value={null}
          className="absolute inset-x-0 top-0 z-(--z-raised)"
          trackClassName="h-0.5 rounded-none"
        />
      ) : null}
      <span role="status" className="sr-only">
        {loading && phase !== "waiting" && !failed ? `Loading ${thing}…` : ""}
      </span>
      {failed ? (
        timeoutFallback
      ) : loading ? (
        <>
          <div className={cn("transition-opacity duration-base", phase === "waiting" ? "opacity-0" : "opacity-100")}>{skeleton}</div>
          {phase === "still-loading" ? <p className="mt-2 mb-0 text-sm text-muted">Still loading…</p> : null}
        </>
      ) : (
        children
      )}
    </div>
  );
}
