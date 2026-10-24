"use client";

import { ChevronRight, X } from "lucide-react";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { useShellLayer } from "@/components/ui/shell/shell-context";
import { cn } from "@/lib/cn";
import { JobProgress, type JobProgressActions } from "./job-progress";
import { type Job, deriveJobState, isFinished, jobTitle, traySummary } from "./jobs";
import { useAvoidFocusOverlap } from "./use-avoid-focus-overlap";

export type JobTrayProps = {
  /** Jobs running or finished in this session; reloading restores the running ones. */
  jobs: Job[];
  /** Per-job actions (cancel, retry, downloads). */
  actionsFor?: (job: Job) => JobProgressActions;
  /** Removes a finished job from the tray ("Hide"). */
  onHide?: (id: string) => void;
  /** Start expanded (documentation). */
  defaultExpanded?: boolean;
  /** Stay where it is drawn instead of fixed bottom-right (documentation). */
  inline?: boolean;
  className?: string;
};

const MAX_ITEMS = 3;

/**
 * The bottom-right stack of background jobs (components.md, JobProgress: JobTray). A region named
 * "Background tasks", after main in the Tab order. Collapsed to one line ("2 tasks running") when
 * the pointer is not over it and focus is not inside; hover, focus inside, or "Show task details"
 * expands it; "Hide task details" or Esc collapses it. It sits above any sticky bottom bar and adds
 * its height and the 1rem gap to --bottom-bar, and moves to the top right while it would cover the
 * focused element.
 */
export function JobTray({ jobs, actionsFor, onHide, defaultExpanded = false, inline = false, className }: JobTrayProps) {
  const ref = useRef<HTMLElement>(null);
  const listId = useId();
  const [pinned, setPinned] = useState(defaultExpanded);
  const [hovered, setHovered] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  // "Hide task details" and Esc win over hover and focus until both have left the tray.
  const [suppressed, setSuppressed] = useState(false);
  const moved = useAvoidFocusOverlap(ref);
  useShellLayer("job-tray", ref, { edge: "bottom", gap: 16, active: !inline && jobs.length > 0 });

  if (jobs.length === 0) return null;
  const expanded = pinned || (!suppressed && (hovered || focusInside));
  const shown = jobs.slice(0, MAX_ITEMS);
  const more = jobs.length - shown.length;

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && expanded) {
      setPinned(false);
      setSuppressed(true);
      (ref.current?.querySelector<HTMLElement>("[data-tray-toggle]") ?? null)?.focus();
    }
  };

  return (
    <section
      ref={ref}
      aria-label="Background tasks"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        if (!focusInside) setSuppressed(false);
      }}
      onFocus={() => setFocusInside(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocusInside(false);
          if (!hovered) setSuppressed(false);
        }
      }}
      onKeyDown={onKeyDown}
      className={cn(
        "flex flex-col gap-2",
        inline ? "w-full max-w-90" : "fixed right-4 z-(--z-sidebar) w-[min(360px,calc(100vw-2rem))]",
        !inline && (moved ? "top-[calc(var(--layout-header)+1rem)]" : "bottom-[calc(var(--bottom-sticky,0px)+1rem)]"),
        className,
      )}
    >
      <ul id={listId} hidden={!expanded} className="m-0 flex list-none flex-col gap-2 p-0">
        {shown.map((job) => {
          const finished = isFinished(deriveJobState(job));
          return (
            <li key={job.id} className="relative rounded-lg border border-border bg-surface-raised p-3 shadow-pop">
              <JobProgress job={job} variant="tray" {...actionsFor?.(job)} className={finished && onHide ? "pr-7" : undefined} />
              {finished && onHide ? (
                <IconButton
                  icon={<X />}
                  aria-label={`Hide ${jobTitle(job).toLowerCase()}`}
                  tooltip="Hide"
                  size="xs"
                  className="absolute top-2 right-2"
                  onClick={() => onHide(job.id)}
                />
              ) : null}
            </li>
          );
        })}
        {more > 0 ? <li className="px-3 text-xs text-muted">{more === 1 ? "1 more" : `${more} more`}</li> : null}
      </ul>
      <div className="flex h-control-md items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 shadow-pop">
        <p className="m-0 min-w-0 flex-1 truncate pt-0.5 pb-1 text-sm text-fg">{traySummary(jobs)}</p>
        <button
          type="button"
          data-tray-toggle=""
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => {
            setPinned(!expanded);
            setSuppressed(expanded);
          }}
          className="inline-flex min-h-hit items-center gap-1 rounded-sm text-sm font-medium text-fg hover:underline hover:underline-offset-2"
        >
          <ChevronRight
            aria-hidden="true"
            className={cn("size-icon-sm text-muted motion-safe:transition-transform motion-safe:duration-fast", expanded && "rotate-90")}
          />
          {expanded ? "Hide task details" : "Show task details"}
        </button>
      </div>
    </section>
  );
}
