import { describe, expect, it } from "vitest";
import {
  MASK_CHAR,
  MINUS,
  MISSING,
  calendarDate,
  currencyDigits,
  describeMaskedEmail,
  describeMaskedPhone,
  formatCompactNumber,
  formatDate,
  formatDateRange,
  formatDateShort,
  formatDateTime,
  formatDateTimeWithZone,
  formatDue,
  formatList,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
  formatPercentChange,
  formatPhone,
  formatPointsChange,
  formatRelativeTime,
  formatShare,
  formatTime,
  formatTimeWithZone,
  lastDigits,
  maskEmail,
  maskPhone,
  minorUnitsToDecimal,
  toDateTimeAttribute,
} from "./format";

// Outputs measured on Node 22.22 (ICU 77.1, CLDR 47). Browsers ship their own ICU data, which is
// why the app formats on the server; a change here means the server's ICU changed.

/** 06 Oct 2026, 2:30 pm in Asia/Kolkata. */
const AT = "2026-10-06T09:00:00Z";

describe("numbers", () => {
  it("groups counts the Indian way", () => {
    expect(formatNumber(12345678)).toBe("1,23,45,678");
    expect(formatNumber(BigInt("1234567890123"))).toBe("12,34,56,78,90,123");
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(-1500)).toBe(`${MINUS}1,500`);
  });

  it("shortens counts with lakh and crore", () => {
    expect(formatCompactNumber(1200000)).toBe("12L");
    expect(formatCompactNumber(12000000)).toBe("1.2Cr");
    expect(formatCompactNumber(12480)).toBe("12.5K");
    expect(formatCompactNumber(999)).toBe("999");
  });

  it("formats percentages with at most one decimal", () => {
    expect(formatPercent(0.1234)).toBe("12.3%");
    expect(formatPercent(1)).toBe("100%");
    expect(formatPercent(Number.NaN)).toBe(MISSING);
    expect(formatShare(640, 1240)).toBe("51.6%");
    expect(formatShare(3, 0)).toBe(MISSING);
  });

  it("signs changes with a real minus sign", () => {
    expect(formatPercentChange(0.123)).toBe("+12.3%");
    expect(formatPercentChange(-0.041)).toBe(`${MINUS}4.1%`);
    expect(formatPercentChange(0)).toBe("0%");
    expect(formatPointsChange(-4)).toBe(`${MINUS}4 pts`);
    expect(formatPointsChange(1)).toBe("+1 pt");
    expect(formatPointsChange(0)).toBe("0 pts");
  });
});

describe("money from integer paise", () => {
  it("splits rupees and paise without floating point", () => {
    expect(minorUnitsToDecimal(BigInt(123456789))).toBe("1234567.89");
    expect(minorUnitsToDecimal("5")).toBe("0.05");
    expect(minorUnitsToDecimal(BigInt(-50000))).toBe("-500.00");
    expect(minorUnitsToDecimal("1200", "JPY")).toBe("1200");
    expect(currencyDigits("INR")).toBe(2);
    expect(currencyDigits("JPY")).toBe(0);
  });

  it("formats exact amounts with two decimals", () => {
    expect(formatMoney(BigInt(123456789))).toBe("₹12,34,567.89");
    expect(formatMoney("100000")).toBe("₹1,000.00");
    expect(formatMoney(BigInt(0))).toBe("₹0.00");
    expect(formatMoney("1")).toBe("₹0.01");
    expect(formatMoney(BigInt(-50000))).toBe(`${MINUS}₹500.00`);
  });

  it("keeps every digit of very large amounts", () => {
    // 18 digits of rupees: a JS number would round this.
    expect(formatMoney("12345678901234567891")).toBe("₹1,23,45,67,89,01,23,45,678.91");
  });

  it("shows other currencies with their ISO code", () => {
    expect(formatMoney("12000", { currency: "USD" })).toBe("USD 120.00");
  });

  it("rejects floats and junk", () => {
    expect(() => formatMoney("12.50")).toThrow(RangeError);
    expect(() => formatMoney("abc")).toThrow(RangeError);
    // @ts-expect-error: a JS number is not accepted for money
    expect(() => formatMoney(1250)).toThrow(RangeError);
  });

  it("shortens summary amounts with lakh and crore", () => {
    expect(formatMoneyCompact("15000000")).toBe("₹1.5L");
    expect(formatMoneyCompact("1200000000")).toBe("₹1.2Cr");
    expect(formatMoneyCompact("123000000")).toBe("₹12.3L");
    expect(formatMoneyCompact("10000000")).toBe("₹1L");
    expect(formatMoneyCompact("5000000")).toBe("₹50K");
    expect(formatMoneyCompact(BigInt(-15000000))).toBe(`${MINUS}₹1.5L`);
  });
});

describe("dates and times in the org's zone", () => {
  it("formats dates as dd Mon yyyy", () => {
    expect(formatDate(AT)).toBe("06 Oct 2026");
    expect(formatDate(new Date("2026-09-06T09:00:00Z"))).toBe("06 Sept 2026");
    // 11 pm UTC on 5 Oct is already 6 Oct in India.
    expect(formatDate("2026-10-05T23:00:00Z")).toBe("06 Oct 2026");
    expect(formatDate("2026-10-05T23:00:00Z", { timeZone: "UTC" })).toBe("05 Oct 2026");
  });

  it("drops the year only within the current year", () => {
    expect(formatDateShort(AT, { now: "2026-12-31T10:00:00Z" })).toBe("06 Oct");
    expect(formatDateShort(AT, { now: "2027-01-02T10:00:00Z" })).toBe("06 Oct 2026");
  });

  it("formats times in 12-hour form with lower-case am and pm", () => {
    expect(formatTime(AT)).toBe("2:30 pm");
    expect(formatTime("2026-10-05T18:30:00Z")).toBe("12:00 am");
    expect(formatTime("2026-10-06T06:30:00Z")).toBe("12:00 pm");
  });

  it("names the zone where a time drives an action", () => {
    expect(formatDateTime(AT)).toBe("06 Oct 2026, 2:30 pm");
    expect(formatDateTimeWithZone(AT)).toBe("06 Oct 2026, 2:30 pm IST");
    expect(formatTimeWithZone(AT)).toBe("2:30 pm IST");
    expect(formatTimeWithZone(AT, { timeZone: "Asia/Dubai" })).toBe("1:00 pm GST");
  });

  it("formats ranges with ICU's range pattern", () => {
    expect(formatDateRange("2026-10-06T09:00:00Z", "2026-10-12T09:00:00Z")).toBe("6–12 Oct 2026");
    expect(formatDateRange("2026-09-30T09:00:00Z", "2026-10-04T09:00:00Z")).toBe("30 Sept – 4 Oct 2026");
  });

  it("gives the machine value for <time>", () => {
    expect(toDateTimeAttribute(AT)).toBe("2026-10-06T09:00:00.000Z");
    expect(calendarDate("2026-10-05T20:00:00Z")).toEqual({ year: 2026, month: 10, day: 6 });
  });

  it("rejects invalid dates", () => {
    expect(() => formatDate("not a date")).toThrow(RangeError);
  });
});

describe("relative times for feeds", () => {
  const now = "2026-10-06T09:00:00Z"; // 2:30 pm IST
  const ago = (ms: number) => new Date(new Date(now).getTime() - ms);
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  it("says just now under a minute", () => {
    expect(formatRelativeTime(ago(30_000), { now })).toBe("just now");
    expect(formatRelativeTime(now, { now })).toBe("just now");
  });

  it("counts minutes and hours", () => {
    expect(formatRelativeTime(ago(5 * MIN), { now })).toBe("5 min ago");
    expect(formatRelativeTime(ago(3 * HOUR), { now })).toBe("3 hr ago");
    expect(formatRelativeTime(ago(23 * HOUR), { now })).toBe("23 hr ago");
  });

  it("counts calendar days in the org's zone", () => {
    expect(formatRelativeTime(ago(DAY + HOUR), { now })).toBe("yesterday");
    expect(formatRelativeTime(ago(3 * DAY), { now })).toBe("3 days ago");
    expect(formatRelativeTime(ago(6 * DAY), { now })).toBe("6 days ago");
  });

  it("switches to the absolute date from 7 days on", () => {
    expect(formatRelativeTime(ago(7 * DAY), { now })).toBe("29 Sept 2026");
  });

  it("never shows a future time as relative", () => {
    expect(formatRelativeTime("2026-10-07T09:00:00Z", { now })).toBe("07 Oct 2026, 2:30 pm");
  });
});

describe("due times", () => {
  const now = "2026-10-06T06:30:00Z"; // 12:00 pm IST, 06 Oct

  it("marks overdue and still shows when it was due", () => {
    expect(formatDue("2026-10-05T10:30:00Z", { now })).toEqual({
      state: "overdue",
      text: "Overdue · due 05 Oct, 4:00 pm IST",
    });
  });

  it("says today and tomorrow with the time", () => {
    expect(formatDue("2026-10-06T10:30:00Z", { now })).toEqual({ state: "today", text: "Due today · 4:00 pm IST" });
    expect(formatDue("2026-10-07T04:30:00Z", { now })).toEqual({
      state: "tomorrow",
      text: "Due tomorrow · 10:00 am IST",
    });
  });

  it("gives the date for later days", () => {
    expect(formatDue("2026-10-09T04:30:00Z", { now })).toEqual({
      state: "upcoming",
      text: "Due 09 Oct, 10:00 am IST",
    });
  });
});

describe("lists", () => {
  it("joins with and", () => {
    expect(formatList(["Email", "SMS", "WhatsApp"])).toBe("Email, SMS and WhatsApp");
    expect(formatList(["Email", "SMS"], "disjunction")).toBe("Email or SMS");
  });
});

describe("phone display", () => {
  it("groups Indian mobiles 5 + 5", () => {
    expect(formatPhone("+919876543210")).toBe("+91 98765 43210");
    expect(formatPhone("+916123456789")).toBe("+91 61234 56789");
  });

  it("groups Indian landlines by STD code", () => {
    expect(formatPhone("+918026123456", { kind: "landline" })).toBe("+91 80 2612 3456");
    expect(formatPhone("+911123456789")).toBe("+91 11 2345 6789");
    expect(formatPhone("+914222456789")).toBe("+91 422 245 6789");
  });

  it("groups a few other countries", () => {
    expect(formatPhone("+971501234567")).toBe("+971 50 123 4567");
    expect(formatPhone("+6581234567")).toBe("+65 8123 4567");
    expect(formatPhone("+14155550132")).toBe("+1 415 555 0132");
    expect(formatPhone("+447700900123")).toBe("+44 7700 900123");
    expect(formatPhone("+61412345678")).toBe("+61 412 345 678");
  });

  it("returns anything else unchanged", () => {
    expect(formatPhone("+4930123456")).toBe("+4930123456");
    expect(formatPhone("98765 43210")).toBe("98765 43210");
    expect(formatPhone("+9198765")).toBe("+9198765");
  });
});

describe("masking for display", () => {
  const dots = (n: number) => MASK_CHAR.repeat(n);

  it("keeps the country code and the last four digits of a phone", () => {
    expect(maskPhone("+919876543210")).toBe(`+91 ${dots(5)} ${dots(1)}3210`);
    expect(maskPhone("+971501234567")).toBe(`+971 ${dots(2)} ${dots(3)} 4567`);
    expect(maskPhone("+4930123456")).toBe(`+${dots(6)}3456`);
    expect(lastDigits("+919876543210")).toBe("3210");
    expect(describeMaskedPhone("+919876543210")).toBe("Mobile number hidden, ends in 3210");
    expect(describeMaskedPhone("+919876543210", "Guardian's mobile")).toBe("Guardian's mobile hidden, ends in 3210");
  });

  it("keeps the first two characters and the domain of an email", () => {
    expect(maskEmail("priya.nair@gmail.com")).toBe(`pr${dots(3)}@gmail.com`);
    expect(maskEmail("ab@college.ac.in")).toBe(`a${dots(3)}@college.ac.in`);
    expect(maskEmail("not-an-email")).toBe(dots(3));
    expect(describeMaskedEmail("priya.nair@gmail.com")).toBe("Email hidden, starts pr, at gmail.com");
  });
});
