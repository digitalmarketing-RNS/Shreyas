import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SpecimenSurface = "surface" | "bg" | "surface-raised" | "surface-sunken" | "surface-subtle";

const SURFACE: Record<SpecimenSurface, string> = {
  surface: "bg-surface",
  bg: "bg-bg",
  "surface-raised": "bg-surface-raised shadow-pop",
  "surface-sunken": "bg-surface-sunken",
  "surface-subtle": "bg-surface-subtle",
};

/**
 * One rendered example, captioned with its state or variant name ("default", "hover",
 * "disabled with reason", "loading"). Every specimen on every gallery page is labelled this way,
 * so screenshots and reviews can name exactly what they look at.
 *
 * - `surface`: the fill behind the example; components are checked on the surfaces they sit on.
 * - `note`: a second caption line, e.g. "Hover is drawn with the hover classes."
 * - `stack`: lay children in a column instead of a wrapping row.
 */
export function Specimen({
  label,
  note,
  surface = "surface",
  stack = false,
  className,
  children,
}: {
  label: string;
  note?: ReactNode;
  surface?: SpecimenSurface;
  stack?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <figure className={cn("m-0 flex min-w-0 flex-col gap-2", className)}>
      <figcaption className="flex flex-col">
        <span className="text-xs font-medium text-fg">{label}</span>
        {note ? <span className="text-xs text-muted">{note}</span> : null}
      </figcaption>
      <div
        className={cn(
          "flex min-h-16 min-w-0 rounded-lg border border-border p-4",
          stack ? "flex-col items-start gap-3" : "flex-wrap items-center gap-3",
          SURFACE[surface],
        )}
      >
        {children}
      </div>
    </figure>
  );
}
