"use client";

import { Settings2, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "@/components/ui/forms/hooks";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { QuickFilterChip } from "./quick-filter-chip";
import { type QuickFilterDef, type QuickFilterValues, isActive, rangeError } from "./quick-filters";

export type QuickFilterBarProps = {
  /** The person's chips, in their order (member prefs, set in QuickFilterManager). */
  defs: QuickFilterDef[];
  /** The applied values, from the URL. */
  values: QuickFilterValues;
  /** Called 300 ms after the last change; an invalid number range is not applied. */
  onValuesChange: (values: QuickFilterValues) => void;
  /** Advanced conditions set in the "More filters" panel (ConditionBuilder in a Drawer). */
  advancedCount?: number;
  onMoreFilters?: () => void;
  /** Opens QuickFilterManager. */
  onManage?: () => void;
  today?: string;
  /** wrap (S05, S26) or scroll (M02, phase 2: one horizontal row). */
  layout?: "wrap" | "scroll";
  /** Gallery: the chip whose popover starts open. */
  defaultOpenId?: string;
  className?: string;
};

/**
 * One-click filters on the fields a person uses most, shown as chips above a list (components.md,
 * QuickFilterBar). Values apply as they change, 300 ms after the last change; the popover stays
 * open while editing. Filters live in the URL, so Back undoes them; changing a filter clears the
 * table selection (DataTable says so) and the table's status region announces the new count once.
 * Tab moves through chips and their remove buttons.
 */
export function QuickFilterBar({
  defs,
  values,
  onValuesChange,
  advancedCount = 0,
  onMoreFilters,
  onManage,
  today,
  layout = "wrap",
  defaultOpenId,
  className,
}: QuickFilterBarProps) {
  const [draft, setDraft] = useState<QuickFilterValues>(values);
  const [seen, setSeen] = useState(values);
  // The URL changed from outside (Back, "Clear all" elsewhere): take its values.
  if (seen !== values) {
    setSeen(values);
    setDraft(values);
  }

  const apply = useDebouncedCallback((next: QuickFilterValues) => {
    const valid = Object.fromEntries(Object.entries(next).filter(([, value]) => !rangeError(value)));
    onValuesChange(valid);
  }, 300);

  const setValue = (id: string, value: QuickFilterValues[string]) => {
    const next = { ...draft, [id]: value };
    setDraft(next);
    apply.run(next);
  };

  const anyActive = Object.values(draft).some(isActive) || advancedCount > 0;

  return (
    <div
      role="group"
      aria-label="Quick filters"
      className={cn(
        "flex items-center gap-2 border-b border-border bg-surface px-gutter-sm py-3 md:px-gutter",
        layout === "wrap" ? "flex-wrap" : "flex-nowrap overflow-x-auto",
        className,
      )}
    >
      {defs.map((def) => (
        <QuickFilterChip
          key={def.id}
          def={def}
          value={draft[def.id]}
          today={today}
          defaultOpen={defaultOpenId === def.id}
          onValueChange={(value) => setValue(def.id, value)}
          onRemove={() => {
            const next = { ...draft, [def.id]: undefined };
            setDraft(next);
            apply.cancel();
            onValuesChange(next);
          }}
        />
      ))}
      {onMoreFilters ? (
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<SlidersHorizontal />}
          onClick={onMoreFilters}
          className="shrink-0"
        >
          More filters
          {advancedCount > 0 ? (
            <>
              <span
                aria-hidden="true"
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-accent px-1.5 text-xs font-medium text-on-accent tabular-nums"
              >
                {advancedCount}
              </span>
              <span className="sr-only">{`, ${advancedCount} ${advancedCount === 1 ? "condition" : "conditions"}`}</span>
            </>
          ) : null}
        </Button>
      ) : null}
      {onManage ? <IconButton icon={<Settings2 />} aria-label="Manage quick filters" variant="ghost" size="sm" onClick={onManage} className="shrink-0" /> : null}
      {anyActive ? (
        <Button
          variant="link"
          aria-label="Clear all filters"
          className="shrink-0"
          onClick={() => {
            const cleared = Object.fromEntries(defs.map((def) => [def.id, undefined]));
            setDraft(cleared);
            apply.cancel();
            onValuesChange(cleared);
          }}
        >
          Clear all
        </Button>
      ) : null}
    </div>
  );
}
