"use client";

import { type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback/alert";
import { Checkbox } from "@/components/ui/forms/checkbox";
import { Link } from "@/components/ui/primitives/link";
import { Tooltip } from "@/components/ui/overlays/tooltip";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import {
  type DataTableColumn,
  type PrimaryColumn,
  type RowMarker,
  type SortState,
  type TableNoun,
  type TableStatus,
  firstDirection,
  sortWords,
} from "./data-table-types";
import { ariaRowCount, ariaRowIndex } from "./grid-keys";
import { NewLeadLegend } from "./new-lead-legend";
import { PrimaryCell } from "./primary-cell";
import { RowActionsMenu } from "./row-actions-menu";
import { SelectionBanner } from "./selection-banner";
import { SkeletonRows } from "./skeleton-rows";
import { SortHeader } from "./sort-header";
import { useGridNavigation } from "./use-grid-navigation";

export type DataTableProps<Row> = {
  /**
   * grid (S05, S26): role="grid", the keyboard model, selectable rows, sticky first columns.
   * plain (short lists): a native table, links and buttons in the normal tab order.
   * embedded (S08 tabs, S21 widgets): no selection, no sticky column, at most 10 rows, "View all".
   */
  variant?: "grid" | "plain" | "embedded";
  /** The id of the page or card title that names the table. */
  labelledBy: string;
  noun: TableNoun;
  primary: PrimaryColumn<Row>;
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;
  /** Row menu items (DropdownMenuItem…); the menu is named "More actions for {name}". */
  rowActions?: (row: Row) => ReactNode;
  /** A member preference set in ColumnChooser: 48 px or 40 px rows. */
  density?: "comfortable" | "compact";
  sort?: SortState | null;
  onSortChange?: (sort: SortState) => void;
  /** Grid only: selection survives paging and sorting; the page clears it when filters change. */
  selectedIds?: ReadonlySet<string>;
  onSelectedIdsChange?: (ids: Set<string>) => void;
  allMatchingSelected?: boolean;
  onAllMatchingSelectedChange?: (all: boolean) => void;
  /** The first record on this page (1-based) and the total, for row numbers and the banner. */
  from?: number;
  total?: number | null;
  pageSize?: number;
  status?: TableStatus;
  /** "We couldn't load leads." */
  errorMessage?: string;
  onRetry?: () => void;
  /** The EmptyState shown when there are no rows (empty, filtered-empty or search). */
  empty?: ReactNode;
  /** Left of the toolbar line (the legend sits at the right). */
  toolbar?: ReactNode;
  /** The footer bar: Pagination (combined) with BulkActionBar in its start slot. */
  footer?: ReactNode;
  /** Embedded: where "View all" goes, and its words. */
  viewAll?: { href: string; label: string };
  /** A status to say once from the page ("Selection cleared because the filters changed."). */
  announcement?: string;
  /** Classes for the scroll container (a max height, so the header sticks). */
  scrollClassName?: string;
  /** Extra row classes (the gallery draws hover and focus with them). */
  rowClassName?: (row: Row) => string | undefined;
  className?: string;
};

const BLOCKED_REASON: Record<Exclude<RowMarker, "new" | null>, string> = {
  merged: "Merged records can't be changed. Open the main record instead.",
  "on-hold": "This lead is on hold. Its details are kept only as the law requires.",
};

function kindClasses(kind: DataTableColumn<unknown>["kind"]): string {
  if (kind === "number") return "min-w-24 text-right tabular-nums";
  if (kind === "date") return "min-w-24 whitespace-nowrap tabular-nums";
  return "min-w-32";
}

/**
 * Many records as rows and columns: sort, select, page through and act on them, and move between
 * cells with the keyboard (components.md, DataTable). Page size is at most 100, so rows are never
 * virtualised. Built on a native <table> with our own roving-tabindex hook; column, sort and
 * selection state are plain props (TanStack Table is open question 1).
 *
 * Status texts go to one polite region: loading, sorting, selection. Paging is announced by
 * Pagination's own status line.
 */
export function DataTable<Row>({
  variant = "grid",
  labelledBy,
  noun,
  primary,
  columns,
  rows,
  getRowId,
  rowActions,
  density = "comfortable",
  sort = null,
  onSortChange,
  selectedIds,
  onSelectedIdsChange,
  allMatchingSelected = false,
  onAllMatchingSelectedChange,
  from = 1,
  total,
  pageSize = 25,
  status = "ready",
  errorMessage,
  onRetry,
  empty,
  toolbar,
  footer,
  viewAll,
  announcement,
  scrollClassName,
  rowClassName,
  className,
}: DataTableProps<Row>) {
  const base = useId();
  const sortDescriptionId = `${base}-sort`;
  const tableRef = useRef<HTMLTableElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const primaryHeadRef = useRef<HTMLTableCellElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [stickyWidth, setStickyWidth] = useState(0);
  const [live, setLive] = useState("");

  const grid = variant === "grid";
  const embedded = variant === "embedded";
  const selectable = grid && Boolean(onSelectedIdsChange);
  const sticky = !embedded;
  const visibleRows = embedded ? rows.slice(0, 10) : rows;
  const selected = selectedIds ?? new Set<string>();
  const markerOf = (row: Row): RowMarker => primary.marker?.(row) ?? null;
  const blockedOf = (row: Row) => {
    const marker = markerOf(row);
    return marker === "merged" || marker === "on-hold" ? marker : null;
  };
  const isSelected = (row: Row) => !blockedOf(row) && (allMatchingSelected || selected.has(getRowId(row)));

  // Say each completed change once (adjusting state during render, as Pagination does).
  const [seen, setSeen] = useState({ status, sortKey: sort ? `${sort.columnId}:${sort.direction}` : "", announcement });
  const sortKey = sort ? `${sort.columnId}:${sort.direction}` : "";
  if (seen.status !== status || seen.sortKey !== sortKey || seen.announcement !== announcement) {
    setSeen({ status, sortKey, announcement });
    if (announcement && announcement !== seen.announcement) setLive(announcement);
    else if (status === "loading" && seen.status !== "loading") setLive(`Loading ${noun.other}`);
    else if (sortKey !== seen.sortKey && sort) setLive(sortSentence(sort));
    else if (status === "error" && seen.status !== "error") setLive(errorMessage ?? `We couldn't load ${noun.other}.`);
  }

  function sortSentence(state: SortState): string {
    const column = state.columnId === "primary" ? { header: primary.header, kind: "text" as const } : columns.find((c) => c.id === state.columnId);
    return `Sorted by ${column?.header ?? state.columnId}, ${sortWords(column?.kind, state.direction)}.`;
  }

  const sortable = (column: { sortable?: boolean; masked?: boolean }) => Boolean(onSortChange) && Boolean(column.sortable) && !column.masked;
  const onSort = (columnId: string, kind: DataTableColumn<Row>["kind"]) => {
    if (!onSortChange) return;
    if (sort?.columnId === columnId) onSortChange({ columnId, direction: sort.direction === "asc" ? "desc" : "asc" });
    else onSortChange({ columnId, direction: firstDirection(kind) });
  };

  // -- selection --------------------------------------------------------------------------------
  const selectableRows = visibleRows.filter((row) => !blockedOf(row));
  const pageSelected = selectableRows.filter(isSelected);
  const allOnPage = selectableRows.length > 0 && pageSelected.length === selectableRows.length;
  const someOnPage = pageSelected.length > 0 && !allOnPage;
  const countWords = (count: number) => `${formatNumber(count)} ${count === 1 ? noun.one : noun.other}`;

  const announceSelection = (next: Set<string>, previousSize: number) => {
    if (previousSize === 0 && next.size === 1) setLive("1 selected. Actions are below the table.");
    else setLive(next.size === 0 ? "Selection cleared." : `${countWords(next.size)} selected.`);
  };

  const toggleRow = (row: Row) => {
    if (!onSelectedIdsChange || blockedOf(row)) return;
    const id = getRowId(row);
    const next = new Set(allMatchingSelected ? selectableRows.map(getRowId) : selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    if (allMatchingSelected) onAllMatchingSelectedChange?.(false);
    onSelectedIdsChange(next);
    announceSelection(next, selected.size);
  };

  const toggleAll = () => {
    if (!onSelectedIdsChange) return;
    const next = new Set(selected);
    if (allOnPage) {
      for (const row of selectableRows) next.delete(getRowId(row));
      onAllMatchingSelectedChange?.(false);
      onSelectedIdsChange(next);
      setLive(next.size === 0 ? "Selection cleared." : `${countWords(next.size)} selected.`);
      return;
    }
    for (const row of selectableRows) next.add(getRowId(row));
    onSelectedIdsChange(next);
    const merged = visibleRows.filter((row) => blockedOf(row) === "merged").length;
    const onHold = visibleRows.filter((row) => blockedOf(row) === "on-hold").length;
    const skipped = [
      merged ? `${merged} merged ${merged === 1 ? noun.one : noun.other}` : null,
      onHold ? `${onHold} ${onHold === 1 ? noun.one : noun.other} on hold` : null,
    ].filter(Boolean);
    setLive(
      skipped.length > 0
        ? `${formatNumber(next.size)} selected. ${skipped.join(" and ")} can't be selected.`
        : `${countWords(next.size)} selected.`,
    );
  };

  const clearSelection = () => {
    onAllMatchingSelectedChange?.(false);
    onSelectedIdsChange?.(new Set());
    setLive("Selection cleared.");
    selectAllRef.current?.focus();
  };

  const { onKeyDownCapture, onFocusCapture } = useGridNavigation({
    tableRef,
    enabled: grid && status !== "loading",
    onToggleRow: (index) => {
      const row = visibleRows[index];
      if (row && selectable) toggleRow(row);
    },
  });

  // -- sticky columns ---------------------------------------------------------------------------
  useLayoutEffect(() => {
    const head = primaryHeadRef.current;
    if (!sticky || !head) return;
    const measure = () => setStickyWidth(head.offsetLeft + head.offsetWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(head);
    return () => observer.disconnect();
  }, [sticky]);

  useEffect(() => {
    const node = selectAllRef.current;
    if (node) node.indeterminate = someOnPage;
  }, [someOnPage]);

  // -- layout -----------------------------------------------------------------------------------
  const rowHeight = density === "compact" ? "h-row-compact" : "h-row";
  const columnCount = (selectable ? 1 : 0) + 1 + columns.length + (rowActions ? 1 : 0);
  const busy = status === "loading" || status === "refreshing";
  const legend = visibleRows.some((row) => markerOf(row) === "new");
  const showBanner = selectable && total !== null && total !== undefined && (allMatchingSelected || (allOnPage && total > selectableRows.length));
  const headCell = cn(
    "sticky top-0 z-(--z-sticky) h-row-header border-b border-strong bg-surface-sunken px-3 text-left align-middle text-table font-medium whitespace-nowrap text-fg focus-inset",
  );
  const stickyHead = sticky ? "z-(--z-header)" : "";
  const bodyCell = "border-b border-border px-3 align-middle text-table focus-inset";
  const stickyBody = sticky ? "sticky z-(--z-raised) bg-inherit" : "";
  const lastStickyEdge = sticky ? "group-data-[scrolled]/scroller:border-r group-data-[scrolled]/scroller:border-r-strong" : "";
  const primaryLeft = selectable ? "left-10" : "left-0";

  // Grid column indices: [select] primary, data columns, [actions].
  const primaryCol = selectable ? 1 : 0;
  const dataCol = (index: number) => primaryCol + 1 + index;
  const actionsCol = primaryCol + 1 + columns.length;
  const cellAttrs = (row: number, col: number, composite = false) =>
    grid ? { "data-grid-cell": `${row}:${col}`, ...(composite ? { "data-composite": "" } : {}) } : {};

  const header = (
    <tr aria-rowindex={grid ? 1 : undefined}>
      {selectable ? (
        <th scope="col" {...cellAttrs(0, 0)} className={cn(headCell, stickyHead, "left-0 w-10 px-2")}>
          <Checkbox
            ref={selectAllRef}
            variant="table"
            aria-label={`Select all ${countWords(selectableRows.length)} on this page`}
            checked={allOnPage}
            onChange={toggleAll}
            disabled={selectableRows.length === 0 || status === "loading"}
          />
        </th>
      ) : null}
      {(() => {
        const isSorted = sort?.columnId === "primary";
        return (
          <th
            ref={primaryHeadRef}
            scope="col"
            {...cellAttrs(0, primaryCol)}
            aria-sort={isSorted ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
            className={cn(headCell, sticky && cn(stickyHead, primaryLeft, lastStickyEdge), "min-w-56", sortable(primary) && "p-0")}
          >
            {sortable(primary) ? (
              <SortHeader label={primary.header} direction={isSorted ? sort.direction : null} onSort={() => onSort("primary", "text")} />
            ) : (
              primary.header
            )}
          </th>
        );
      })()}
      {columns.map((column, index) => {
        const isSorted = sort?.columnId === column.id;
        const canSort = sortable(column);
        return (
          <th
            key={column.id}
            scope="col"
            {...cellAttrs(0, dataCol(index))}
            aria-sort={isSorted ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
            className={cn(headCell, column.kind === "number" && "text-right", canSort && "p-0")}
          >
            {canSort ? (
              <SortHeader
                label={column.header}
                direction={isSorted ? sort.direction : null}
                align={column.kind === "number" ? "end" : "start"}
                onSort={() => onSort(column.id, column.kind)}
              />
            ) : (
              column.header
            )}
          </th>
        );
      })}
      {rowActions ? (
        <th scope="col" {...cellAttrs(0, actionsCol)} className={cn(headCell, "w-12")}>
          <span className="sr-only">Actions</span>
        </th>
      ) : null}
    </tr>
  );

  let body: ReactNode;
  if (status === "loading") {
    body = <SkeletonRows rows={pageSize} columns={columnCount} rowHeight={rowHeight} />;
  } else if (status === "error" && visibleRows.length === 0) {
    body = (
      <tr>
        <td colSpan={columnCount} className="px-4 py-10 text-center">
          <p className="m-0 text-sm text-fg">{errorMessage ?? `We couldn't load ${noun.other}.`}</p>
          {onRetry ? (
            <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </td>
      </tr>
    );
  } else if (visibleRows.length === 0) {
    body = (
      <tr>
        <td colSpan={columnCount} className="px-4">
          {empty}
        </td>
      </tr>
    );
  } else {
    body = visibleRows.map((row, index) => {
      const id = getRowId(row);
      const marker = markerOf(row);
      const blocked = blockedOf(row);
      const rowSelected = selectable && isSelected(row);
      const name = primary.name(row);
      const r = index + 1;
      return (
        <tr
          key={id}
          aria-rowindex={grid ? ariaRowIndex(from, index) : undefined}
          aria-selected={selectable ? rowSelected : undefined}
          className={cn(
            rowHeight,
            "bg-surface transition-colors duration-fast",
            blocked ? "text-muted" : "text-fg",
            "hover:bg-surface-hover aria-selected:bg-accent-subtle aria-selected:hover:bg-accent-subtle",
            rowClassName?.(row),
          )}
        >
          {selectable ? (
            <td {...cellAttrs(r, 0)} className={cn(bodyCell, stickyBody, "left-0 w-10 px-2")}>
              {blocked ? (
                <BlockedCheckbox name={name} reason={BLOCKED_REASON[blocked]} />
              ) : (
                <Checkbox variant="table" aria-label={`Select ${name}`} checked={rowSelected} onChange={() => toggleRow(row)} />
              )}
            </td>
          ) : null}
          <td {...cellAttrs(r, primaryCol)} className={cn(bodyCell, sticky && cn(stickyBody, primaryLeft, lastStickyEdge), "max-w-80 min-w-56")}>
            <PrimaryCell name={name} href={primary.href(row)} marker={marker} mergedInto={primary.mergedInto?.(row)} secondary={primary.secondary?.(row)} />
          </td>
          {columns.map((column, columnIndex) => {
            const content = column.cell(row);
            const title = column.title?.(row);
            return (
              <td key={column.id} {...cellAttrs(r, dataCol(columnIndex), column.composite)} title={title} className={cn(bodyCell, kindClasses(column.kind), column.className)}>
                {column.kind === "text" || column.kind === undefined ? <div className="max-w-64 truncate pt-0.5 pb-1">{content}</div> : content}
              </td>
            );
          })}
          {rowActions ? (
            <td {...cellAttrs(r, actionsCol)} className={cn(bodyCell, "w-12 text-right")}>
              <RowActionsMenu label={`More actions for ${name}`}>{rowActions(row)}</RowActionsMenu>
            </td>
          ) : null}
        </tr>
      );
    });
  }

  const tableProps = grid
    ? {
        role: "grid",
        "aria-multiselectable": selectable || undefined,
        "aria-rowcount": ariaRowCount(status === "loading" ? null : (total ?? visibleRows.length)),
      }
    : {};

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      {status === "error" && visibleRows.length > 0 ? (
        <Alert tone="danger" layout="compact" live="polite" actions={onRetry ? <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button> : undefined}>
          {errorMessage ?? `We couldn't load ${noun.other}.`}
        </Alert>
      ) : null}
      <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        {toolbar || legend ? (
          <div className="flex min-h-control-md flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">{toolbar}</div>
            {legend ? <NewLeadLegend /> : null}
          </div>
        ) : null}
        {showBanner ? (
          <SelectionBanner
            noun={noun}
            pageCount={selectableRows.length}
            matchingTotal={total ?? 0}
            allMatchingSelected={allMatchingSelected}
            onSelectAllMatching={() => {
              onAllMatchingSelectedChange?.(true);
              setLive(`All ${formatNumber(total ?? 0)} matching ${noun.other} are selected.`);
            }}
            onClearSelection={clearSelection}
          />
        ) : null}
        <div className="relative">
          <div
            ref={scrollRef}
            data-scrolled={scrolled ? "" : undefined}
            onScroll={(event) => setScrolled(event.currentTarget.scrollLeft > 0)}
            style={sticky ? { scrollPaddingLeft: stickyWidth } : undefined}
            className={cn("group/scroller isolate overflow-auto scroll-pt-row-header", scrollClassName)}
          >
            <table
              ref={tableRef}
              {...tableProps}
              aria-labelledby={labelledBy}
              aria-describedby={grid && sort ? sortDescriptionId : undefined}
              aria-busy={busy || undefined}
              onKeyDownCapture={grid ? onKeyDownCapture : undefined}
              onFocusCapture={grid ? onFocusCapture : undefined}
              className="w-full border-separate border-spacing-0"
            >
              <thead>{header}</thead>
              <tbody>{body}</tbody>
            </table>
          </div>
          {status === "refreshing" ? (
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-row-header h-0.5 overflow-hidden">
              <span className="block h-full w-full bg-accent motion-safe:w-1/3 motion-safe:animate-indeterminate" />
            </div>
          ) : null}
        </div>
        {embedded && viewAll ? (
          <div className="flex h-table-footer items-center justify-end border-t border-border bg-surface-subtle px-4">
            <Link href={viewAll.href} variant="standalone">
              {viewAll.label}
            </Link>
          </div>
        ) : null}
        {!embedded && footer ? footer : null}
        {status === "refreshing" ? (
          <p className="m-0 hidden border-t border-border bg-surface-subtle px-4 py-2 text-xs text-muted motion-reduce:block">Updating…</p>
        ) : null}
      </div>
      {grid && sort ? (
        <span id={sortDescriptionId} hidden>
          {sortSentence(sort)}
        </span>
      ) : null}
      <p role="status" className="sr-only">
        {live}
      </p>
    </div>
  );
}

/** A merged or on-hold row's checkbox: aria-disabled, the reason linked and in a tooltip. */
function BlockedCheckbox({ name, reason }: { name: string; reason: string }) {
  const reasonId = useId();
  return (
    <>
      <Tooltip content={reason}>
        <span className="inline-flex">
          <Checkbox
            variant="table"
            aria-label={`Select ${name}`}
            aria-disabled="true"
            aria-describedby={reasonId}
            checked={false}
            onChange={() => {}}
            onClick={(event) => event.preventDefault()}
          />
        </span>
      </Tooltip>
      <span id={reasonId} hidden>
        {reason}
      </span>
    </>
  );
}
