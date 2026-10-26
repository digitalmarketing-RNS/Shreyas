import { describe, expect, it } from "vitest";
import {
  canonicalZone,
  formatOffset,
  formatTime12,
  listZones,
  nextQuarterHour,
  parseTypedTime,
  utcToZoned,
  zoneLabel,
  zoneOffsetMinutes,
  zonedToUtc,
} from "./times";

const t = (text: string) => {
  const time = parseTypedTime(text);
  return time ? formatTime12(time) : null;
};

describe("parseTypedTime", () => {
  it("reads every accepted form", () => {
    expect(t("4:30 pm")).toBe("4:30 pm");
    expect(t("4.30pm")).toBe("4:30 pm");
    expect(t("16:30")).toBe("4:30 pm");
    expect(t("1630")).toBe("4:30 pm");
    expect(t("430p")).toBe("4:30 pm");
    expect(t("4")).toBe("4:00 pm");
  });
  it("reads times without am or pm: 1-7 pm, 8-11 am, 12 noon", () => {
    expect(t("7:59")).toBe("7:59 pm");
    expect(t("8")).toBe("8:00 am");
    expect(t("11:45")).toBe("11:45 am");
    expect(t("12")).toBe("12:00 pm");
    expect(t("0:15")).toBe("12:15 am");
    expect(t("12am")).toBe("12:00 am");
  });
  it("rejects what it cannot read", () => {
    expect(t("25:00")).toBeNull();
    expect(t("4:75")).toBeNull();
    expect(t("13pm")).toBeNull();
    expect(t("soon")).toBeNull();
  });
  it("rounds up to the next quarter hour", () => {
    expect(nextQuarterHour({ hour: 9, minute: 1 })).toEqual({ hour: 9, minute: 15 });
    expect(nextQuarterHour({ hour: 23, minute: 59 })).toEqual({ hour: 23, minute: 45 });
  });
});

describe("zones", () => {
  it("lists current names only and includes Kolkata", () => {
    const zones = listZones();
    expect(zones).toContain("Asia/Kolkata");
    expect(zones).not.toContain("Asia/Calcutta");
    expect(canonicalZone("Asia/Saigon")).toBe("Asia/Ho_Chi_Minh");
  });
  it("labels zones with name, offset and city", () => {
    const instant = Date.UTC(2026, 9, 6, 11, 0);
    expect(zoneOffsetMinutes("Asia/Kolkata", instant)).toBe(330);
    expect(formatOffset(-240)).toBe("UTC−04:00");
    expect(zoneLabel("Asia/Kolkata", instant)).toBe("India Standard Time (UTC+05:30) · Kolkata");
  });
  it("turns wall-clock time into an instant", () => {
    const result = zonedToUtc({ year: 2026, month: 10, day: 6 }, { hour: 16, minute: 30 }, "Asia/Kolkata");
    expect(result).toEqual({ status: "ok", utcMs: Date.UTC(2026, 9, 6, 11, 0) });
    expect(utcToZoned(Date.UTC(2026, 9, 6, 11, 0), "Asia/Dubai").time).toEqual({ hour: 15, minute: 0 });
  });
  it("reports a time skipped by clocks going forward, and takes the first of a repeated time", () => {
    expect(zonedToUtc({ year: 2026, month: 3, day: 29 }, { hour: 1, minute: 30 }, "Europe/London").status).toBe("gap");
    const repeated = zonedToUtc({ year: 2026, month: 10, day: 25 }, { hour: 1, minute: 30 }, "Europe/London");
    expect(repeated.status).toBe("ambiguous");
    expect(repeated.utcMs).toBe(Date.UTC(2026, 9, 25, 0, 30));
  });
});
