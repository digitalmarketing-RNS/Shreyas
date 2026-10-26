import { describe, expect, it } from "vitest";
import { findMatch, matchSegments, matches } from "./text-match";

describe("text matching", () => {
  it("ignores case and Latin accents", () => {
    expect(matches("José Fernandes", "jose")).toBe(true);
    expect(findMatch("Ananya José", "jose")).toEqual([7, 11]);
  });
  it("keeps Indic vowel signs", () => {
    expect(matches("राहुल", "र")).toBe(true);
    expect(matches("र", "रा")).toBe(false);
  });
  it("splits around the match", () => {
    expect(matchSegments("Anjali Rao", "jal")).toEqual([
      { text: "An", match: false },
      { text: "jal", match: true },
      { text: "i Rao", match: false },
    ]);
  });
});
