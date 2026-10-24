"use client";

import { CircleAlert } from "lucide-react";
import { type MouseEvent, type Ref, useEffect, useId, useMemo, useRef } from "react";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";

export type ErrorSummaryItem = { message: string; /** The control's id; the link moves focus there. */ targetId?: string };

/**
 * The one error summary of the app (components.md FormLayout): a danger box at the top of a longer
 * form, "2 fields need changes", with one link per error that repeats the field's error and moves
 * focus to the field. It has tabindex="-1", is named by its heading and takes focus when it
 * appears, so it is read once; it has no role="alert", which would read it twice (role="group" only
 * lets the heading name it).
 */
export function ErrorSummary({
  items,
  surface = "staff",
  focusOnMount = true,
  headingLevel = 2,
  className,
  ref,
}: {
  items: ErrorSummaryItem[];
  surface?: "staff" | "public";
  focusOnMount?: boolean;
  /** The summary's heading level, under the page's h1 (2) or a section's heading (3). */
  headingLevel?: 2 | 3 | 4;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}) {
  const headingId = useId();
  const own = useRef<HTMLDivElement | null>(null);
  const composedRef = useMemo(() => mergeRefs(ref, own), [ref]);
  const Heading = `h${headingLevel}` as const;
  const isPublic = surface === "public";

  useEffect(() => {
    if (focusOnMount) own.current?.focus();
  }, [focusOnMount]);

  if (items.length === 0) return null;
  const heading = items.length === 1 ? "1 field needs a change" : `${items.length} fields need changes`;

  const follow = (targetId: string | undefined) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (!target) return;
    event.preventDefault();
    // A fieldset or group focuses its first control.
    const focusable = target.matches("input, select, textarea, button, [tabindex]")
      ? target
      : target.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea, button, [tabindex]");
    focusable?.focus();
    focusable?.scrollIntoView({ block: "center" });
  };

  return (
    <div
      ref={composedRef}
      role="group"
      tabIndex={-1}
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-2 rounded-md border border-danger bg-danger-subtle p-4 text-fg", className)}
    >
      <Heading id={headingId} className="m-0 flex items-center gap-2 text-sm font-semibold text-fg">
        <CircleAlert aria-hidden="true" className="size-icon-sm shrink-0 text-danger" />
        {heading}
      </Heading>
      <ul className="m-0 flex list-none flex-col p-0">
        {items.map((item, index) => (
          <li key={`${item.targetId ?? "error"}-${index}`}>
            <a
              href={item.targetId ? `#${item.targetId}` : undefined}
              onClick={follow(item.targetId)}
              className={cn(
                "flex items-center rounded-xs text-sm text-fg underline underline-offset-2 hover:decoration-2",
                isPublic ? "min-h-hit-public" : "min-h-hit",
              )}
            >
              {item.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
