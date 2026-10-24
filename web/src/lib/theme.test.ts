import { describe, expect, it } from "vitest";
import {
  isPublicPath,
  parseThemeChoice,
  readMotionCookie,
  readThemeCookie,
  themeCookie,
  themeInitScript,
} from "./theme";

describe("theme preference", () => {
  it("defaults to system", () => {
    expect(parseThemeChoice(undefined)).toBe("system");
    expect(parseThemeChoice("purple")).toBe("system");
    expect(readThemeCookie("")).toBe("system");
  });

  it("reads the cookie among others", () => {
    expect(readThemeCookie("a=1; theme=dark; b=2")).toBe("dark");
    expect(readThemeCookie("theme=light")).toBe("light");
    expect(readThemeCookie("xtheme=dark")).toBe("system");
    expect(readMotionCookie("motion=reduce")).toBe("reduce");
    expect(readMotionCookie("motion=fast")).toBe("system");
  });

  it("writes a long-lived first-party cookie", () => {
    expect(themeCookie("dark")).toBe("theme=dark; Path=/; Max-Age=31536000; SameSite=Lax");
    expect(themeCookie("light", { secure: true })).toContain("; Secure");
  });

  it("knows the public routes", () => {
    expect(isPublicPath("/f/abc123")).toBe(true);
    expect(isPublicPath("/pay/return/xyz")).toBe(true);
    expect(isPublicPath("/leads")).toBe(false);
    expect(isPublicPath("/design/public")).toBe(false);
  });
});

describe("themeInitScript", () => {
  type Attrs = Record<string, string>;
  function run(pathname: string, cookie: string): Attrs {
    const attrs: Attrs = {};
    const documentElement = { setAttribute: (name: string, value: string) => (attrs[name] = value) };
    new Function("document", "location", themeInitScript())({ documentElement, cookie }, { pathname });
    return attrs;
  }

  it("applies a saved light or dark theme", () => {
    expect(run("/leads", "theme=dark")).toEqual({ "data-theme": "dark" });
    expect(run("/leads", "x=1; theme=light")).toEqual({ "data-theme": "light" });
  });

  it("leaves System to the OS", () => {
    expect(run("/leads", "theme=system")).toEqual({});
    expect(run("/leads", "")).toEqual({});
  });

  it("applies reduce motion", () => {
    expect(run("/leads", "motion=reduce")).toEqual({ "data-motion": "reduce" });
  });

  it("keeps public routes light whatever the cookie says", () => {
    expect(run("/f/enquiry-2027", "theme=dark")).toEqual({
      "data-theme": "light",
      "data-surface": "public",
      "data-theme-lock": "",
    });
  });

  it("never throws", () => {
    expect(() => new Function("document", "location", themeInitScript())(undefined, undefined)).not.toThrow();
  });
});
