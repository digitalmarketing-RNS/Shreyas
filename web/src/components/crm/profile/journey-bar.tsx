import { CircleCheck, CircleDashed } from "lucide-react";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { cn } from "@/lib/cn";
import { JOURNEY_STEPS, type JourneyMilestones, type JourneyStep, journeySteps, journeySummary } from "./journey";

export type JourneyBarProps = {
  milestones?: JourneyMilestones;
  /**
   * responsive (default): horizontal from md, vertical below. horizontal and vertical force one
   * (vertical in the S15 side panel). compact: six dots and "3 of 6 · Form started" (S05 column).
   */
  variant?: "responsive" | "horizontal" | "vertical" | "compact";
  loading?: boolean;
  className?: string;
};

/**
 * How far a lead has come through the six admission milestones and when each was reached
 * (components.md, JourneyBar). Our form: round markers joined by thin lines, not chevron blocks.
 * An ordered list, so the count and order are read; each step starts with "Step 3 of 6: " and says
 * its state in words (the date, "Not yet" or "Not recorded"). No controls, so merged and on-hold
 * leads look the same.
 */
export function JourneyBar({ milestones, variant = "responsive", loading = false, className }: JourneyBarProps) {
  if (variant === "compact") {
    if (loading || !milestones) return <Skeleton text="table" width="60%" />;
    const steps = journeySteps(milestones);
    return (
      <span className={cn("inline-flex items-center gap-2 text-table whitespace-nowrap text-fg", className)}>
        <span aria-hidden="true" className="inline-flex items-center gap-1">
          {steps.map((step) => (
            <span
              key={step.index}
              className={cn("size-2 rounded-pill", step.state === "reached" || step.state === "current" ? "bg-accent" : "border border-input")}
            />
          ))}
        </span>
        <span>{journeySummary(steps)}</span>
      </span>
    );
  }

  const horizontal = variant === "horizontal";
  const vertical = variant === "vertical";
  // Layout classes for each part, by variant (responsive switches at md).
  const listClass = horizontal ? "flex" : vertical ? "flex flex-col" : "flex flex-col md:flex-row";
  const itemClass = horizontal
    ? "flex-1 flex-col items-center text-center"
    : vertical
      ? "flex-row gap-3 pb-4 last:pb-0"
      : "flex-row gap-3 pb-4 last:pb-0 md:flex-1 md:flex-col md:items-center md:gap-0 md:pb-0 md:text-center";
  const textClass = horizontal ? "mt-2 px-1" : vertical ? "" : "md:mt-2 md:px-1";

  if (loading || !milestones) {
    return (
      <div aria-busy="true" className={cn(listClass, "min-h-18", className)}>
        <span className="sr-only">Loading the admission journey</span>
        {JOURNEY_STEPS.map((step) => (
          <div key={step.key} aria-hidden="true" className={cn("flex min-w-28", itemClass)}>
            <Skeleton shape="circle" size="sm" className="size-6" />
            <span className={cn("flex w-full flex-col items-center gap-1", textClass, !horizontal && "items-start md:items-center")}>
              <Skeleton width="70%" />
              <Skeleton text="xs" width="50%" />
            </span>
          </div>
        ))}
      </div>
    );
  }

  const steps = journeySteps(milestones);
  return (
    <ol aria-label="Admission journey" className={cn("m-0 list-none p-0", listClass, className)}>
      {steps.map((step) => {
        const next = steps[step.index + 1];
        // The segment before a reached step is accent; the others are the strong border colour.
        const nextReached = next ? next.state === "reached" || next.state === "current" : false;
        const connector = nextReached ? "bg-accent" : "bg-strong";
        return (
          <li
            key={step.index}
            aria-current={step.state === "current" ? "step" : undefined}
            className={cn("relative flex min-w-28", itemClass)}
          >
            {next ? (
              <>
                {/* Vertical connector: down the left, from under this marker to the next step. */}
                {!horizontal ? (
                  <span aria-hidden="true" className={cn("absolute top-6 bottom-0 left-2.75 w-0.5", connector, !vertical && "md:hidden")} />
                ) : null}
                {/* Horizontal connector: from this marker's centre to the next one's. */}
                {!vertical ? (
                  <span aria-hidden="true" className={cn("absolute top-2.75 left-1/2 h-0.5 w-full", connector, !horizontal && "hidden md:block")} />
                ) : null}
              </>
            ) : null}
            <Marker step={step} />
            <span className={cn("relative flex min-w-0 flex-col", textClass)}>
              <span className="sr-only">{`Step ${step.index + 1} of ${steps.length}: `}</span>
              <span
                className={cn(
                  "text-sm",
                  step.state === "current" ? "font-semibold text-fg" : step.state === "reached" ? "text-fg" : "text-muted",
                )}
              >
                {step.label}
              </span>
              <span className="text-xs text-muted">{step.dateText}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Marker({ step }: { step: JourneyStep }) {
  const box = "relative z-(--z-raised) inline-flex size-6 shrink-0 items-center justify-center rounded-pill bg-surface";
  switch (step.state) {
    case "reached":
      return (
        <span aria-hidden="true" className={box}>
          <CircleCheck className="size-icon-sm text-accent" />
        </span>
      );
    case "current":
      return (
        <span aria-hidden="true" className={cn(box, "bg-accent text-xs font-semibold text-on-accent tabular-nums")}>
          {step.index + 1}
        </span>
      );
    case "not-recorded":
      return (
        <span aria-hidden="true" className={box}>
          <CircleDashed className="size-icon-sm text-muted" />
        </span>
      );
    default:
      return (
        <span aria-hidden="true" className={box}>
          <span className="size-4 rounded-pill border-2 border-input" />
        </span>
      );
  }
}
