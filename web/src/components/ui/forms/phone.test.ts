import { describe, expect, it } from "vitest";
import { formatNational, normalisePhone, orderedCountries, phoneDigitError, toE164 } from "./phone";

describe("normalisePhone", () => {
  it("accepts spaces, dashes, brackets and a leading 0", () => {
    expect(normalisePhone("098765-43210", "IN")).toEqual({ iso: "IN", national: "9876543210" });
    expect(normalisePhone("(98765) 43210", "IN")).toEqual({ iso: "IN", national: "9876543210" });
  });
  it("reads pasted Indian numbers", () => {
    expect(normalisePhone("+91 98765 43210", "IN")).toEqual({ iso: "IN", national: "9876543210" });
    expect(normalisePhone("0091 98765 43210", "IN")).toEqual({ iso: "IN", national: "9876543210" });
    expect(normalisePhone("919876543210", "IN")).toEqual({ iso: "IN", national: "9876543210" });
  });
  it("switches the country for a pasted international number", () => {
    expect(normalisePhone("+971 50 123 4567", "IN")).toEqual({ iso: "AE", national: "501234567" });
    expect(normalisePhone("+1 415 555 0100", "CA")).toEqual({ iso: "CA", national: "4155550100" });
    expect(normalisePhone("+1 415 555 0100", "IN")).toEqual({ iso: "US", national: "4155550100" });
    expect(normalisePhone("+44 7911 123456", "IN")).toEqual({ iso: "GB", national: "7911123456" });
  });
});

describe("checks and display", () => {
  it("checks the digit count only", () => {
    expect(phoneDigitError("98765", "IN")).toBe("Enter a 10-digit mobile number.");
    expect(phoneDigitError("9876543210", "IN")).toBeNull();
    expect(phoneDigitError("123", "AE")).toBe("This doesn't look like a valid number for the United Arab Emirates.");
  });
  it("formats on blur", () => {
    expect(formatNational("9876543210", "IN")).toBe("98765 43210");
    expect(formatNational("501234567", "AE")).toBe("501234567");
    expect(formatNational("501234567", "AE", { staff: true })).toBe("50 123 4567");
    expect(toE164("IN", "9876543210")).toBe("+919876543210");
  });
  it("orders India first, then pinned countries, then A to Z", () => {
    const list = orderedCountries(["AE", "SG"]);
    expect(list.slice(0, 3).map((c) => c.iso)).toEqual(["IN", "AE", "SG"]);
    expect(list[3].iso).toBe("AF");
    expect(list.filter((c) => c.iso === "IN")).toHaveLength(1);
  });
});
