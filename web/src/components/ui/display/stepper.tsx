"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/cn";

export type StepState = "done" | "current" | "upcoming" | "problem";

export type Step = {
  /** Short: "Upload", "Match columns", "Which record stays?". */
  label: string;
  state: StepState;
};

/**
 * - responsive (default): horizontal from md, vertical below md.
 * - horizontal / vertical: fixed.
 * - compact: text only, "Step 2 of 3 · Choose values" (the merge Dialog footer, narrow screens).
 */
export type StepperVariant = "responsive" | "horizontal" | "vertical" | "compact";

const STATE_WORD: Record<StepState, string> = {
  done: "done",
  current: "current",
  upcoming: "not started",
  problem: "has problems",
};

export type StepperProps = {
  /** The task, for the list's name: "Import" gives "Import steps". */
  task: string;
  steps: Step[];
  variant?: StepperVariant;
  /**
   * After the point of no return (an import that has started) every step is plain text. Before it,
   * done and problem steps are buttons that go back and keep every value.
   */
  readOnly?: boolean;
  /** Called with the step's index when a done step's button is chosen. */
  onStepSelect?: (index: number) => void;
  className?: string;
};

/**
 * The steps of a task, where the person is, and which steps are done or have a problem
 * (components.md, Stepper). <ol> with aria-current="step"; each state is an sr-only word, so it is
 * never shape, fill or colour alone. Tab reaches the done-step buttons only; Enter or Space goes
 * back to that step. When the step changes, the page moves focus to the new step's heading.
 */
export function Stepper({ task, steps, variant = "responsive", readOnly = false, onStepSelect, className }: StepperProps) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.state === "current"),
  );

  if (variant === "compact") {
    const current = steps[currentIndex];
    return (
      <p className={cn("m-0 text-sm text-muted", className)}>
        <span className="text-fg">{`Step ${currentIndex + 1} of ${steps.length}`}</span>
        {current ? ` · ${current.label}` : null}
      </p>
    );
  }

  const horizontal = variant === "horizontal";
  const vertical = variant === "vertical";
  const responsive = variant === "responsive";

  return (
    <ol
      aria-label={`${task} steps`}
      className={cn(
        "m-0 flex list-none p-0",
        horizontal && "h-14 items-center",
        vertical && "flex-col",
        responsive && "flex-col md:h-14 md:flex-row md:items-center",
        className,
      )}
    >
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const canGoBack = !readOnly && (step.state === "done" || step.state === "problem") && Boolean(onStepSelect);
        const label = (
          <>
            <span className={cn(step.state === "current" ? "font-semibold text-fg" : step.state === "upcoming" ? "text-muted" : "text-fg")}>
              {step.label}
            </span>
            <span className="sr-only">{`, ${STATE_WORD[step.state]}`}</span>
          </>
        );
        return (
          <li
            key={step.label}
            aria-current={step.state === "current" ? "step" : undefined}
            className={cn(
              "flex min-w-0 text-sm",
              horizontal && "items-center",
              horizontal && !last && "flex-1",
              vertical && "flex-col",
              responsive && "flex-col md:flex-row md:items-center",
              responsive && !last && "md:flex-1",
            )}
          >
            <span className="flex min-h-hit shrink-0 items-center gap-2">
              <Marker index={index} state={step.state} />
              {canGoBack ? (
                <button
                  type="button"
                  onClick={() => onStepSelect?.(index)}
                  aria-label={`Step ${index + 1}, ${step.label}, ${STATE_WORD[step.state]}. Go back to this step.`}
                  className="inline-flex min-h-hit items-center rounded-md px-1 text-left hover:underline hover:underline-offset-2"
                >
                  {label}
                </button>
              ) : (
                <span className="px-1">{label}</span>
              )}
            </span>
            {!last ? (
              <span
                aria-hidden="true"
                className={cn(
                  "block",
                  step.state === "done" ? "bg-accent" : "bg-strong",
                  horizontal && "mx-2 h-px min-w-4 flex-1",
                  vertical && "my-0.5 ml-3 min-h-4 w-px",
                  responsive && "my-0.5 ml-3 min-h-4 w-px md:mx-2 md:my-0 md:h-px md:min-h-0 md:w-auto md:min-w-4 md:flex-1",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function Marker({ index, state }: { index: number; state: StepState }) {
  if (state === "done") return <CircleCheck aria-hidden="true" className="size-6 shrink-0 text-accent" />;
  if (state === "problem") return <CircleAlert aria-hidden="true" className="size-6 shrink-0 text-danger" />;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-pill text-xs font-semibold",
        state === "current" ? "border border-transparent bg-accent text-on-accent" : "border-2 border-input text-muted",
      )}
    >
      {index + 1}
    </span>
  );
}
