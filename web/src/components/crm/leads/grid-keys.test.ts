import { describe, expect, it } from "vitest";
import { ariaRowCount, ariaRowIndex, isGridMoveKey, moveInGrid } from "./grid-keys";

const size = { rows: 26, cols: 8 }; // header plus 25 rows

describe("moveInGrid", () => {
  it("moves one cell with the arrows and stops at the edges", () => {
    expect(moveInGrid({ row: 3, col: 2 }, "ArrowDown", size)).toEqual({ row: 4, col: 2 });
    expect(moveInGrid({ row: 3, col: 2 }, "ArrowUp", size)).toEqual({ row: 2, col: 2 });
    expect(moveInGrid({ row: 3, col: 2 }, "ArrowRight", size)).toEqual({ row: 3, col: 3 });
    expect(moveInGrid({ row: 3, col: 2 }, "ArrowLeft", size)).toEqual({ row: 3, col: 1 });
    expect(moveInGrid({ row: 0, col: 0 }, "ArrowUp", size)).toEqual({ row: 0, col: 0 });
    expect(moveInGrid({ row: 0, col: 0 }, "ArrowLeft", size)).toEqual({ row: 0, col: 0 });
    expect(moveInGrid({ row: 25, col: 7 }, "ArrowDown", size)).toEqual({ row: 25, col: 7 });
    expect(moveInGrid({ row: 25, col: 7 }, "ArrowRight", size)).toEqual({ row: 25, col: 7 });
  });

  it("goes to the ends of the row with Home and End, and of the grid with Ctrl", () => {
    expect(moveInGrid({ row: 5, col: 4 }, "Home", size)).toEqual({ row: 5, col: 0 });
    expect(moveInGrid({ row: 5, col: 4 }, "End", size)).toEqual({ row: 5, col: 7 });
    expect(moveInGrid({ row: 5, col: 4 }, "Home", size, true)).toEqual({ row: 0, col: 0 });
    expect(moveInGrid({ row: 5, col: 4 }, "End", size, true)).toEqual({ row: 25, col: 7 });
  });

  it("moves 10 rows with Page Up and Page Down, stopping at the first and last row", () => {
    expect(moveInGrid({ row: 3, col: 1 }, "PageDown", size)).toEqual({ row: 13, col: 1 });
    expect(moveInGrid({ row: 20, col: 1 }, "PageDown", size)).toEqual({ row: 25, col: 1 });
    expect(moveInGrid({ row: 13, col: 1 }, "PageUp", size)).toEqual({ row: 3, col: 1 });
    expect(moveInGrid({ row: 4, col: 1 }, "PageUp", size)).toEqual({ row: 0, col: 1 });
  });

  it("clamps a position left over from a longer page", () => {
    expect(moveInGrid({ row: 40, col: 9 }, "ArrowLeft", size)).toEqual({ row: 25, col: 6 });
  });

  it("recognises only the grid's keys", () => {
    expect(isGridMoveKey("PageDown")).toBe(true);
    expect(isGridMoveKey("Tab")).toBe(false);
    expect(isGridMoveKey("Enter")).toBe(false);
  });
});

describe("row numbers for screen readers", () => {
  it("offsets body rows by the page start, after the header row", () => {
    // Page 2 of 25 rows starts at lead 26, which is row 27 counting the header.
    expect(ariaRowIndex(26, 0)).toBe(27);
    expect(ariaRowIndex(1, 0)).toBe(2);
    expect(ariaRowCount(1284)).toBe(1285);
    expect(ariaRowCount(null)).toBe(-1);
  });
});
