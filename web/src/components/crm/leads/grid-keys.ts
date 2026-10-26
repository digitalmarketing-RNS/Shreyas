/**
 * Cell moves for DataTable's grid variant (components.md, DataTable keyboard; the APG data grid).
 * Row 0 is the header row; body rows follow. A pure function, unit tested in grid-keys.test.ts.
 */

export type GridPosition = { row: number; col: number };

export type GridSize = { rows: number; cols: number };

/** Page Up and Page Down move this many rows. */
export const GRID_PAGE_ROWS = 10;

export type GridMoveKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Home" | "End" | "PageUp" | "PageDown";

const MOVE_KEYS = new Set<string>(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"]);

export function isGridMoveKey(key: string): key is GridMoveKey {
  return MOVE_KEYS.has(key);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Where focus goes for a key:
 * - arrows move one cell and stop at the edges (no wrapping);
 * - Home and End go to the first and last cell of the row; with Ctrl (or Cmd), to the first and
 *   last cell of the grid;
 * - Page Up and Page Down move 10 rows, stopping at the first and last row.
 */
export function moveInGrid(from: GridPosition, key: GridMoveKey, size: GridSize, ctrl = false): GridPosition {
  const lastRow = Math.max(size.rows - 1, 0);
  const lastCol = Math.max(size.cols - 1, 0);
  const row = clamp(from.row, 0, lastRow);
  const col = clamp(from.col, 0, lastCol);
  switch (key) {
    case "ArrowUp":
      return { row: Math.max(row - 1, 0), col };
    case "ArrowDown":
      return { row: Math.min(row + 1, lastRow), col };
    case "ArrowLeft":
      return { row, col: Math.max(col - 1, 0) };
    case "ArrowRight":
      return { row, col: Math.min(col + 1, lastCol) };
    case "Home":
      return ctrl ? { row: 0, col: 0 } : { row, col: 0 };
    case "End":
      return ctrl ? { row: lastRow, col: lastCol } : { row, col: lastCol };
    case "PageUp":
      return { row: Math.max(row - GRID_PAGE_ROWS, 0), col };
    case "PageDown":
      return { row: Math.min(row + GRID_PAGE_ROWS, lastRow), col };
  }
}

/** The 1-based aria-rowindex of a body row on a page that starts at record `from` (header is 1). */
export function ariaRowIndex(from: number, indexOnPage: number): number {
  return from + indexOnPage + 1;
}

/** aria-rowcount: the total plus the header row, or -1 while the total is unknown. */
export function ariaRowCount(total: number | null | undefined): number {
  return total === null || total === undefined ? -1 : total + 1;
}
