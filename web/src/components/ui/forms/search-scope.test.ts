import { describe, expect, it } from "vitest";
import { detectScope, isSearchable } from "./search-scope";

describe("detectScope", () => {
  it("follows the Auto rule", () => {
    expect(detectScope("kavya@example.com")).toBe("email");
    expect(detectScope("#10482")).toBe("lead");
    expect(detectScope("10482")).toBe("lead");
    expect(detectScope("98765 43210")).toBe("mobile");
    expect(detectScope("+971")).toBe("mobile");
    expect(detectScope("3f9a1c7e5b2d4086a1e9c3b7d5f20a64")).toBe("api");
    expect(detectScope("3f9a1c7e-5b2d-4086-a1e9-c3b7d5f20a64")).toBe("api");
    expect(detectScope("Kavya")).toBe("name");
  });
  it("starts name search at 2 characters", () => {
    expect(isSearchable("k", "auto")).toBe(false);
    expect(isSearchable("ka", "auto")).toBe(true);
    expect(isSearchable("9", "auto")).toBe(true);
  });
});
