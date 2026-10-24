import { describe, expect, it } from "vitest";
import { getInitials } from "./initials";

describe("getInitials", () => {
  it("takes the first and last word for Latin names", () => {
    expect(getInitials("Ananya Rao")).toBe("AR");
    expect(getInitials("Priya Lakshmi Nair")).toBe("PN");
    expect(getInitials("vikram shah")).toBe("VS");
  });

  it("gives one initial for the sm size and single names", () => {
    expect(getInitials("Ananya Rao", 1)).toBe("A");
    expect(getInitials("Farhan")).toBe("F");
  });

  it("skips honorifics that end in a full stop", () => {
    expect(getInitials("Dr. Meera Iyer")).toBe("MI");
    expect(getInitials("Prof. S. Raghavan")).toBe("R");
  });

  it("takes the first grapheme of the first word in other scripts", () => {
    expect(getInitials("अदिति शर्मा")).toBe("अ");
    expect(getInitials("زینب خان")).toBe("ز");
    const kannada = getInitials("ಶ್ರೀನಿವಾಸ್");
    expect(kannada).not.toBeNull();
    expect("ಶ್ರೀನಿವಾಸ್".startsWith(kannada ?? "?")).toBe(true);
  });

  it("returns null for an empty name", () => {
    expect(getInitials("")).toBeNull();
    expect(getInitials("   ")).toBeNull();
    expect(getInitials(undefined)).toBeNull();
  });
});
