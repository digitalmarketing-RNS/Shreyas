import { describe, expect, it } from "vitest";
import {
  LEAD_SEARCH_HINTS,
  checkLeadQuery,
  keysFor,
  normaliseMobile,
  normaliseQuery,
  normaliseUuid,
  resolveKey,
  searchInputName,
  triggerText,
} from "./lead-search-keys";

describe("resolveKey (Auto)", () => {
  it("guesses the key from the text", () => {
    expect(resolveKey("meera@example.com", "auto")).toBe("email");
    expect(resolveKey("#10234", "auto")).toBe("lead");
    expect(resolveKey("10234", "auto")).toBe("lead");
    expect(resolveKey("98765 43210", "auto")).toBe("mobile");
    expect(resolveKey("+91 98765 43210", "auto")).toBe("mobile");
    expect(resolveKey("0192f3a1-7c2e-7b4d-9f10-2c5e8a1b3d4f", "auto")).toBe("api");
    expect(resolveKey("Meera", "auto")).toBe("name");
    expect(resolveKey("मीरा", "auto")).toBe("name");
  });
  it("keeps an explicit key", () => {
    expect(resolveKey("10234", "name")).toBe("name");
  });
});

describe("normalising", () => {
  it("strips spaces, dashes, a leading 0 and +91 from mobiles", () => {
    expect(normaliseMobile("+91 98765-43210")).toBe("9876543210");
    expect(normaliseMobile("098765 43210")).toBe("9876543210");
    expect(normaliseMobile("+971 50 123 4567")).toBe("+971501234567");
  });
  it("lower-cases emails, drops # from lead numbers and hyphenates UUIDs", () => {
    expect(normaliseQuery(" Meera.Pillai@Example.com ", "email")).toBe("meera.pillai@example.com");
    expect(normaliseQuery("#10234", "lead")).toBe("10234");
    expect(normaliseUuid("0192F3A17C2E7B4D9F102C5E8A1B3D4F")).toBe("0192f3a1-7c2e-7b4d-9f10-2c5e8a1b3d4f");
    expect(normaliseUuid("not-a-uuid")).toBeNull();
  });
});

describe("checkLeadQuery", () => {
  it("needs 2 letters for a name", () => {
    expect(checkLeadQuery("M", "name")).toEqual({ send: false, key: "name", hint: LEAD_SEARCH_HINTS.shortName });
    expect(checkLeadQuery("Me", "name")).toMatchObject({ send: true, query: "Me" });
  });
  it("lets full-view roles match on a prefix", () => {
    expect(checkLeadQuery("98765", "mobile")).toMatchObject({ send: true, query: "98765" });
    expect(checkLeadQuery("meera@", "email")).toMatchObject({ send: true });
  });
  it("asks masked roles for the whole email or mobile", () => {
    expect(checkLeadQuery("98765", "mobile", { masked: true })).toEqual({ send: false, key: "mobile", hint: LEAD_SEARCH_HINTS.fullMobile });
    expect(checkLeadQuery("+91 98765 43210", "auto", { masked: true })).toMatchObject({ send: true, query: "9876543210" });
    expect(checkLeadQuery("meera@", "email", { masked: true })).toMatchObject({ send: false, hint: LEAD_SEARCH_HINTS.fullEmail });
    expect(checkLeadQuery("meera@example.com", "auto", { masked: true })).toMatchObject({ send: true });
  });
  it("rejects an API ID that is not a UUID", () => {
    expect(checkLeadQuery("0192f3a1-7c2e", "api")).toEqual({ send: false, key: "api", hint: LEAD_SEARCH_HINTS.apiFormat });
    expect(checkLeadQuery("0192f3a17c2e7b4d9f102c5e8a1b3d4f", "api")).toMatchObject({ send: true, query: "0192f3a1-7c2e-7b4d-9f10-2c5e8a1b3d4f" });
  });
  it("sends an empty query to clear the search", () => {
    expect(checkLeadQuery("   ", "auto")).toMatchObject({ send: true, query: "" });
  });
});

describe("names and labels", () => {
  it("names the input after the key", () => {
    expect(searchInputName("mobile", "98765")).toBe("Search leads by mobile");
    expect(searchInputName("auto", "")).toBe("Search leads");
    expect(searchInputName("auto", "98765 43210")).toBe("Search leads (best guess: mobile)");
  });
  it("shows the guessed key on the trigger", () => {
    expect(triggerText("auto", "98765 43210")).toEqual({ key: "Auto", guessed: "Mobile" });
    expect(triggerText("email", "x")).toEqual({ key: "Email", guessed: null });
  });
  it("adds Opportunity ID only on opportunities", () => {
    expect(keysFor("leads").map((key) => key.value)).not.toContain("opportunity");
    expect(keysFor("opportunities").map((key) => key.value)).toContain("opportunity");
  });
});
