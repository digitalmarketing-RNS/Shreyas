import { describe, expect, it } from "vitest";
import {
  addMonths,
  dateErrorMessage,
  formatLongDate,
  formatPlainDate,
  formatRangeLong,
  formatRangeShort,
  fromIso,
  monthGrid,
  parseDateParts,
  parseTypedDate,
  toIso,
  weekday,
} from "./dates";

const iso = (text: string) => {
  const result = parseTypedDate(text);
  return result.ok ? toIso(result.date) : result.reason;
};

describe("parseTypedDate", () => {
  it("reads every accepted form, day first", () => {
    expect(iso("06/10/2026")).toBe("2026-10-06");
    expect(iso("6/10/26")).toBe("2026-10-06");
    expect(iso("06-10-2026")).toBe("2026-10-06");
    expect(iso("06.10.2026")).toBe("2026-10-06");
    expect(iso("6 Oct 2026")).toBe("2026-10-06");
    expect(iso("6 Sept 2026")).toBe("2026-09-06");
    expect(iso("06 Oct 2026")).toBe("2026-10-06");
    expect(iso("2026-10-06")).toBe("2026-10-06");
    expect(iso("6 october 2026")).toBe("2026-10-06");
  });
  it("expands two-digit years: 00-69 are 2000s, 70-99 are 1900s", () => {
    expect(iso("1/1/69")).toBe("2069-01-01");
    expect(iso("1/1/70")).toBe("1970-01-01");
  });
  it("tells a date that does not exist from text it cannot read", () => {
    expect(iso("31/02/2026")).toBe("nonexistent");
    expect(iso("10/13/2026")).toBe("nonexistent");
    expect(iso("next tuesday")).toBe("unreadable");
    expect(iso("6 Foo 2026")).toBe("unreadable");
    expect(iso("")).toBe("unreadable");
  });
});

describe("display", () => {
  it("prints the canonical and long forms", () => {
    const date = { year: 2026, month: 10, day: 6 };
    expect(formatPlainDate(date)).toBe("06 Oct 2026");
    expect(formatLongDate(date)).toBe("Tuesday, 6 October 2026");
    expect(formatPlainDate({ year: 2026, month: 9, day: 6 })).toBe("06 Sept 2026");
  });
  it("prints ranges", () => {
    const from = { year: 2026, month: 9, day: 1 };
    const to = { year: 2026, month: 9, day: 30 };
    expect(formatRangeShort(from, to)).toBe("1 Sept - 30 Sept 2026");
    expect(formatRangeLong(from, to)).toBe("1 September to 30 September 2026");
    expect(formatRangeShort({ year: 2025, month: 12, day: 20 }, { year: 2026, month: 1, day: 5 })).toBe("20 Dec 2025 - 5 Jan 2026");
  });
});

describe("calendar math", () => {
  it("knows weekdays and month grids (weeks start on Sunday)", () => {
    expect(weekday({ year: 2026, month: 10, day: 6 })).toBe(2);
    const grid = monthGrid(2026, 10);
    expect(grid[0][0]).toEqual({ year: 2026, month: 9, day: 27 });
    expect(grid.at(-1)?.at(-1)).toEqual({ year: 2026, month: 10, day: 31 });
  });
  it("adds months without overflowing", () => {
    expect(addMonths({ year: 2026, month: 1, day: 31 }, 1)).toEqual({ year: 2026, month: 2, day: 28 });
    expect(addMonths({ year: 2026, month: 1, day: 15 }, -1)).toEqual({ year: 2025, month: 12, day: 15 });
  });
  it("round-trips ISO", () => {
    expect(fromIso("2026-02-30")).toBeNull();
    expect(toIso(fromIso("2026-10-06")!)).toBe("2026-10-06");
  });
});

describe("errors", () => {
  it("uses the spec's words", () => {
    expect(dateErrorMessage(parseTypedDate("soon"))).toBe("Enter a date like 06/10/2026.");
    expect(dateErrorMessage(parseTypedDate("31/02/2026"))).toBe("That date doesn't exist. Check the day and month.");
    expect(dateErrorMessage(parseTypedDate("01/10/2026"), { min: { year: 2026, month: 10, day: 6 } })).toBe(
      "Choose a date on or after 06 Oct 2026.",
    );
  });
  it("reads the memorable-date parts as one date", () => {
    const result = parseDateParts("27", "mar", "2008");
    expect(result.ok && toIso(result.date)).toBe("2008-03-27");
    expect(parseDateParts("30", "2", "2008")).toEqual({ ok: false, reason: "nonexistent" });
    expect(parseDateParts("3", "13", "2008")).toEqual({ ok: false, reason: "nonexistent" });
    expect(parseDateParts("3", "3", "08")).toEqual({ ok: false, reason: "unreadable" });
  });
});
