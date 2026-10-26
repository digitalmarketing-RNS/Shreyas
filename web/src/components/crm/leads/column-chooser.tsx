"use client";

import { Columns3, Lock } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/feedback/toaster";
import { Checkbox } from "@/components/ui/forms/checkbox";
import { SearchInput } from "@/components/ui/forms/search-input";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import { useDebouncedCallback } from "@/components/ui/forms/hooks";
import { matches } from "@/components/ui/forms/text-match";
import { Popover } from "@/components/ui/overlays/popover";
import { Tooltip } from "@/components/ui/overlays/tooltip";
import { cn } from "@/lib/cn";
import { MoveList } from "./move-list";

export type ChooserColumn = {
  id: string;
  label: string;
  /** Lead list: "standard" fields or the institution's own ("custom", "Your fields"). */
  group?: "standard" | "custom";
  /** Name: always shown and always first. */
  locked?: boolean;
};

export type Density = "comfortable" | "compact";

export type ColumnPrefs = { shown: string[]; density: Density };

export type ColumnChooserProps = {
  /** lead-list (S05, S26): search and the two field groups. short (S16, S25, S32, S38, S40): one hidden list. */
  variant?: "lead-list" | "short";
  columns: ChooserColumn[];
  /** Ids in table order. Changes apply at once. */
  shown: string[];
  onShownChange: (shown: string[]) => void;
  density: Density;
  onDensityChange: (density: Density) => void;
  /** "Reset to default" restores these. */
  defaultShown: string[];
  /** PATCH /me/prefs, 500 ms after the last change. A rejection shows the failure Toast. */
  onSave?: (prefs: ColumnPrefs) => Promise<void>;
  /** At most this many shown columns. */
  max?: number;
  /** Gallery and tests: start open. */
  defaultOpen?: boolean;
};

export const COLUMN_CHOOSER_TEXT = {
  limit: (max: number) => `You can show up to ${max} columns. Hide one first.`,
  locked: "Name is always shown first.",
  saveFailed: "Couldn't save your columns. They'll go back to the last saved set when you reload.",
} as const;

const HEADING = "m-0 px-2 pt-2 pb-1 text-xs font-medium text-muted";

/**
 * Choose which columns a table shows, in what order, and how dense its rows are; saved per person
 * and per table (components.md, ColumnChooser). The popover is a dialog named "Table columns".
 *
 * Keyboard: Enter, Space or Arrow Down on the trigger opens it, with focus on the search field or
 * the first checkbox. Tab moves through each row's checkbox, Move up and Move down; the drag
 * handle is not a tab stop. Alt+Arrow Up and Alt+Arrow Down on a row's checkbox move the row. Esc
 * closes and returns focus to the trigger.
 */
export function ColumnChooser({
  variant = "lead-list",
  columns,
  shown,
  onShownChange,
  density,
  onDensityChange,
  defaultShown,
  onSave,
  max = 20,
  defaultOpen,
}: ColumnChooserProps) {
  const { toast } = useToast();
  const limitId = useId();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const latest = useRef<ColumnPrefs>({ shown, density });
  useEffect(() => {
    latest.current = { shown, density };
  });

  const save = useDebouncedCallback(() => {
    if (!onSave) return;
    setSaving(true);
    onSave(latest.current)
      .catch(() => toast({ tone: "error", title: COLUMN_CHOOSER_TEXT.saveFailed }))
      .finally(() => setSaving(false));
  }, 500);

  const change = (next: string[]) => {
    onShownChange(next);
    save.run();
  };

  const byId = new Map(columns.map((column) => [column.id, column]));
  const shownItems = shown.map((id) => byId.get(id)).filter((column): column is ChooserColumn => Boolean(column));
  const hidden = columns.filter((column) => !shown.includes(column.id));
  const searchable = variant === "lead-list" && columns.length > 12;
  const term = query.trim();
  const visibleHidden = term ? hidden.filter((column) => matches(column.label, term)) : hidden;
  const atMax = shown.length >= max;

  const moveTo = (id: string, toIndex: number) => {
    const next = shown.filter((value) => value !== id);
    next.splice(toIndex, 0, id);
    change(next);
    setStatus(`${byId.get(id)?.label ?? id} moved to position ${toIndex + 1} of ${next.length}.`);
  };

  const hideColumn = (column: ChooserColumn) => {
    change(shown.filter((id) => id !== column.id));
    setStatus(`${column.label} hidden.`);
  };

  const showColumn = (column: ChooserColumn) => {
    if (atMax) return;
    const next = [...shown, column.id];
    change(next);
    setStatus(`${column.label} added at position ${next.length} of ${next.length}.`);
  };

  const hiddenRow = (column: ChooserColumn) => (
    <li key={column.id} className="flex h-menu-item items-center rounded-sm px-2 hover:bg-surface-hover">
      <Checkbox
        label={column.label}
        checked={false}
        aria-disabled={atMax || undefined}
        aria-describedby={atMax ? limitId : undefined}
        onClick={(event) => {
          if (atMax) event.preventDefault();
        }}
        onChange={() => showColumn(column)}
        className="min-w-0 flex-1"
      />
    </li>
  );

  const hiddenList = (items: ChooserColumn[], label: string) => (
    <ul aria-label={label} className="m-0 flex list-none flex-col p-0">
      {items.map(hiddenRow)}
    </ul>
  );

  return (
    <Popover
      aria-label="Table columns"
      defaultOpen={defaultOpen}
      variant="list"
      onOpenChange={(open) => {
        if (!open) setQuery("");
      }}
      trigger={
        <Button variant="secondary" size="sm" leadingIcon={<Columns3 />}>
          Columns
        </Button>
      }
      align="end"
    >
      <div className="flex flex-col">
        {searchable ? (
          <div className="px-1 pt-1 pb-2">
            <SearchInput label="Find a column" size="sm" inPopover onSearch={(text) => setQuery(text)} />
          </div>
        ) : null}
        <div className="max-h-96 overflow-auto">
          <h3 className={HEADING}>Shown in table</h3>
          <MoveList
            label="Shown in table"
            items={shownItems}
            onMove={moveTo}
            renderStart={(column) =>
              column.locked ? (
                <Tooltip content={COLUMN_CHOOSER_TEXT.locked}>
                  <span tabIndex={0} className="inline-flex size-hit items-center justify-center rounded-sm">
                    <Lock aria-hidden="true" className="size-icon-sm text-muted" />
                    <span className="sr-only">{COLUMN_CHOOSER_TEXT.locked}</span>
                  </span>
                </Tooltip>
              ) : (
                <Checkbox aria-label={`Show ${column.label}`} checked onChange={() => hideColumn(column)} />
              )
            }
          />
          <h3 className={HEADING}>Hidden</h3>
          {atMax ? (
            <p id={limitId} className="m-0 px-2 pb-1 text-xs text-muted">
              {COLUMN_CHOOSER_TEXT.limit(max)}
            </p>
          ) : null}
          {visibleHidden.length === 0 ? (
            <p className="m-0 px-2 py-1.5 text-sm text-muted">{term ? `No column called "${term}".` : "Every column is shown."}</p>
          ) : variant === "lead-list" ? (
            <>
              {visibleHidden.some((column) => column.group !== "custom") ? (
                <>
                  <h4 className={cn(HEADING, "pt-1")}>Standard fields</h4>
                  {hiddenList(visibleHidden.filter((column) => column.group !== "custom"), "Hidden standard fields")}
                </>
              ) : null}
              {visibleHidden.some((column) => column.group === "custom") ? (
                <>
                  <h4 className={cn(HEADING, "pt-1")}>Your fields</h4>
                  {hiddenList(visibleHidden.filter((column) => column.group === "custom"), "Hidden fields of your own")}
                </>
              ) : null}
            </>
          ) : (
            hiddenList(visibleHidden, "Hidden")
          )}
        </div>
        <div className="mt-2 border-t border-border px-2 pt-2">
          <SegmentedControl
            legend="Row height"
            size="sm"
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
            value={density}
            onValueChange={(next) => {
              onDensityChange(next as Density);
              save.run();
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-border px-2 pt-2 pb-1">
          <span className="text-xs text-muted tabular-nums">
            {`${shown.length} of ${columns.length} shown`}
            {saving ? " · Saving…" : ""}
          </span>
          <Button
            variant="link"
            onClick={() => {
              change(defaultShown);
              setStatus("Columns reset to the default set.");
            }}
          >
            Reset to default
          </Button>
        </div>
        <p role="status" className="sr-only">
          {status}
        </p>
      </div>
    </Popover>
  );
}
