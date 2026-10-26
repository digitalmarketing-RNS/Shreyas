import { describe, expect, it } from "vitest";
import { contrastRatio, formatRatio, parseColor, toHex } from "./contrast";

describe("contrast", () => {
  it("parses the token colour formats", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor(" #151A20 ")).toEqual({ r: 21, g: 26, b: 32, a: 1 });
    expect(parseColor("rgba(12, 15, 20, 0.5)")).toEqual({ r: 12, g: 15, b: 20, a: 0.5 });
    expect(parseColor("rgb(1,2,3)")).toEqual({ r: 1, g: 2, b: 3, a: 1 });
    expect(parseColor("oklch(0.5 0.1 200)")).toBeNull();
  });

  it("computes WCAG ratios", () => {
    const black = parseColor("#000000")!;
    const white = parseColor("#ffffff")!;
    expect(contrastRatio(black, white)).toBeCloseTo(21, 5);
    expect(contrastRatio(white, white)).toBe(1);
    // text-muted on surface in the light theme (replica/design/contrast-report.txt: 5.99:1)
    expect(formatRatio(contrastRatio(parseColor("#5d646c")!, white))).toBe("5.99:1");
  });

  it("rounds down so a pass is never overstated", () => {
    expect(formatRatio(4.4999)).toBe("4.49:1");
    expect(toHex({ r: 21, g: 26, b: 32, a: 1 })).toBe("#151a20");
  });
});
