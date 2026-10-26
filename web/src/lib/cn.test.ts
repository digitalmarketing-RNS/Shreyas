import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("keeps a token type size and a token colour together", () => {
    expect(cn("text-table", "text-muted")).toBe("text-table text-muted");
  });

  it("lets the later token size win", () => {
    expect(cn("h-control-sm px-3", "h-control-md")).toBe("px-3 h-control-md");
    expect(cn("text-sm", "text-base")).toBe("text-base");
    expect(cn("rounded-md", "rounded-pill")).toBe("rounded-pill");
    expect(cn("shadow-card", "shadow-pop")).toBe("shadow-pop");
    expect(cn("duration-fast", "duration-slow")).toBe("duration-slow");
    expect(cn("max-w-form", "max-w-content")).toBe("max-w-content");
  });

  it("lets the later colour win", () => {
    expect(cn("bg-surface", "bg-surface-raised")).toBe("bg-surface-raised");
    expect(cn("border-input", "border-danger")).toBe("border-danger");
    expect(cn("border", "border-strong")).toBe("border border-strong");
  });

  it("drops falsy values", () => {
    expect(cn("p-2", false && "p-4", undefined, null, "gap-2")).toBe("p-2 gap-2");
  });
});
