"use client";

import { type FocusEvent, type KeyboardEvent, type RefObject, useCallback, useLayoutEffect, useRef } from "react";
import { type GridPosition, isGridMoveKey, moveInGrid } from "./grid-keys";

const FOCUSABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]';

/** Focusable controls inside a cell (not the cell itself). */
function controlsIn(cell: HTMLElement): HTMLElement[] {
  return Array.from(cell.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element !== cell && !element.hasAttribute("disabled") && !element.closest("[hidden],[inert]"),
  );
}

function positionOf(cell: Element): GridPosition | null {
  const value = cell.getAttribute("data-grid-cell");
  if (!value) return null;
  const [row, col] = value.split(":").map(Number);
  return { row, col };
}

/**
 * The roving-tabindex hook behind DataTable's grid variant (components.md, DataTable keyboard; the
 * APG data grid pattern). Cells carry data-grid-cell="row:col" (row 0 is the header) and, when
 * they hold several controls, data-composite. Exactly one element in the grid is a tab stop: the
 * last focused cell's target (first visit: the first header cell).
 *
 * - A cell with one control focuses that control (checkbox, name link, sort button, row actions);
 *   other cells take focus themselves.
 * - Arrows move one cell; Home and End go to the ends of the row; Ctrl+Home and Ctrl+End to the
 *   ends of the grid; Page Up and Page Down move 10 rows.
 * - Shift+Space toggles the row from any cell (onToggleRow).
 * - A composite cell: Enter or F2 moves into it, Tab cycles inside, Esc goes back to the cell.
 *
 * Move keys are handled in the capture phase, so a menu trigger in a cell (which opens on Arrow
 * Down) never steals them; Enter and Space still reach the control.
 */
export function useGridNavigation({
  tableRef,
  enabled,
  onToggleRow,
}: {
  tableRef: RefObject<HTMLTableElement | null>;
  enabled: boolean;
  /** Body row index (0-based on this page). */
  onToggleRow?: (rowIndex: number) => void;
}) {
  const active = useRef<GridPosition>({ row: 0, col: 0 });
  /** The composite cell focus has moved into, if any. */
  const inside = useRef<string | null>(null);

  const cellAt = useCallback(
    (position: GridPosition) => tableRef.current?.querySelector<HTMLElement>(`[data-grid-cell="${position.row}:${position.col}"]`) ?? null,
    [tableRef],
  );

  const size = useCallback(() => {
    const cells = Array.from(tableRef.current?.querySelectorAll("[data-grid-cell]") ?? []);
    let rows = 0;
    let cols = 0;
    for (const cell of cells) {
      const position = positionOf(cell);
      if (!position) continue;
      rows = Math.max(rows, position.row + 1);
      cols = Math.max(cols, position.col + 1);
    }
    return { rows, cols };
  }, [tableRef]);

  const targetOf = useCallback((cell: HTMLElement) => {
    if (cell.hasAttribute("data-composite")) return cell;
    const controls = controlsIn(cell);
    return controls.length === 1 ? controls[0] : cell;
  }, []);

  /** One tab stop: every cell and control gets tabindex -1 except the active cell's target. */
  const sync = useCallback(() => {
    const table = tableRef.current;
    if (!table) return;
    const { rows, cols } = size();
    if (rows === 0) return;
    const current = active.current;
    if (current.row >= rows || current.col >= cols) active.current = { row: Math.min(current.row, rows - 1), col: Math.min(current.col, cols - 1) };
    for (const cell of Array.from(table.querySelectorAll<HTMLElement>("[data-grid-cell]"))) {
      const position = positionOf(cell);
      const target = targetOf(cell);
      const isActive = position?.row === active.current.row && position?.col === active.current.col;
      const isInside = inside.current === cell.getAttribute("data-grid-cell");
      if (target === cell) cell.tabIndex = isActive && !isInside ? 0 : -1;
      else cell.removeAttribute("tabindex");
      for (const control of controlsIn(cell)) control.tabIndex = isInside ? 0 : control === target && isActive ? 0 : -1;
    }
  }, [size, tableRef, targetOf]);

  // Re-apply after every render: rows, columns and controls change with sorting and paging.
  useLayoutEffect(() => {
    if (enabled) sync();
  });

  const focusCell = useCallback(
    (position: GridPosition) => {
      const cell = cellAt(position);
      if (!cell) return;
      active.current = position;
      inside.current = null;
      sync();
      targetOf(cell).focus();
    },
    [cellAt, sync, targetOf],
  );

  const onKeyDownCapture = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (!enabled) return;
      const target = event.target as HTMLElement;
      if (!tableRef.current?.contains(target)) return; // a portalled menu bubbling through React
      const cell = target.closest<HTMLElement>("[data-grid-cell]");
      if (!cell) return;
      const position = positionOf(cell);
      if (!position) return;
      const cellKey = cell.getAttribute("data-grid-cell");

      // Inside a composite cell: Tab cycles, Esc goes back to the cell.
      if (inside.current === cellKey && target !== cell) {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          inside.current = null;
          sync();
          cell.focus();
        } else if (event.key === "Tab") {
          const controls = controlsIn(cell);
          const index = controls.indexOf(target);
          const next = controls[(index + (event.shiftKey ? controls.length - 1 : 1)) % controls.length];
          if (next) {
            event.preventDefault();
            event.stopPropagation();
            next.focus();
          }
        }
        return;
      }

      if (isGridMoveKey(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        focusCell(moveInGrid(position, event.key, size(), event.ctrlKey || event.metaKey));
        return;
      }
      if (event.key === " " && event.shiftKey && position.row > 0) {
        event.preventDefault();
        event.stopPropagation();
        onToggleRow?.(position.row - 1);
        return;
      }
      if ((event.key === "Enter" || event.key === "F2") && target === cell && cell.hasAttribute("data-composite")) {
        const first = controlsIn(cell)[0];
        if (!first) return;
        event.preventDefault();
        event.stopPropagation();
        inside.current = cellKey;
        sync();
        first.focus();
      }
    },
    [enabled, focusCell, onToggleRow, size, sync, tableRef],
  );

  /** A click or programmatic focus inside a cell makes it the active cell. */
  const onFocusCapture = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      if (!enabled) return;
      const cell = (event.target as HTMLElement).closest<HTMLElement>("[data-grid-cell]");
      const position = cell ? positionOf(cell) : null;
      if (!cell || !position) return;
      const key = cell.getAttribute("data-grid-cell");
      if (inside.current && inside.current !== key) inside.current = null;
      if (position.row !== active.current.row || position.col !== active.current.col) {
        active.current = position;
        // A control focused by click inside a composite cell counts as being inside it.
        if (cell.hasAttribute("data-composite") && event.target !== cell) inside.current = key;
        sync();
      }
    },
    [enabled, sync],
  );

  return { onKeyDownCapture, onFocusCapture };
}
