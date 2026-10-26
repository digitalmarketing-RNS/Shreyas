"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SortDirection } from "./data-table-types";

/**
 * A sortable column's header button: the label and a sort icon, filling the 40 px header cell
 * (components.md, DataTable sorting). The sorted column shows ArrowUp or ArrowDown in text-fg;
 * others show ArrowUpDown in text-muted. The <th> carries aria-sort; the button's name is the label.
 */
export function SortHeader({
  label,
  direction,
  align = "start",
  onSort,
}: {
  label: string;
  /** The direction when this column is the sorted one. */
  direction: SortDirection | null;
  align?: "start" | "end";
  onSort: () => void;
}) {
  const Icon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={onSort}
      className={cn(
        "flex h-row-header w-full items-center gap-1.5 px-3 font-medium whitespace-nowrap text-fg focus-inset hover:bg-surface-hover",
        align === "end" && "flex-row-reverse text-right",
      )}
    >
      <span>{label}</span>
      <Icon aria-hidden="true" className={cn("size-icon-sm shrink-0", direction ? "text-fg" : "text-muted")} />
    </button>
  );
}
