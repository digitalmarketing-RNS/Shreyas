import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const COLUMNS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  6: "sm:grid-cols-3 xl:grid-cols-6",
} as const;

/**
 * A grid of <Specimen>s: one column on phones, up to `columns` on wide screens. Put one
 * component's variants or states side by side in the same order everywhere:
 * default, hover, active, focus-visible, selected/pressed, disabled, disabled with reason,
 * loading, error, empty.
 */
export function StateGrid({
  columns = 3,
  label,
  className,
  children,
}: {
  columns?: keyof typeof COLUMNS;
  /** Names the group for screen readers when it has no heading of its own. */
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      className={cn("grid grid-cols-1 gap-4", COLUMNS[columns], className)}
    >
      {children}
    </div>
  );
}
