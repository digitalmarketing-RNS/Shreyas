import { afterEach, describe, expect, it, vi } from "vitest";
import { holdLightTheme } from "./theme-store";

/** Just enough of `document` for theme-store: <html>'s attributes and the cookie string. */
function stubDocument(attributes: Record<string, string>, cookie: string) {
  const attrs = new Map(Object.entries(attributes));
  vi.stubGlobal("document", {
    cookie,
    documentElement: {
      hasAttribute: (name: string) => attrs.has(name),
      getAttribute: (name: string) => attrs.get(name) ?? null,
      setAttribute: (name: string, value: string) => void attrs.set(name, value),
      removeAttribute: (name: string) => void attrs.delete(name),
    },
  });
  return () => Object.fromEntries(attrs);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("holdLightTheme", () => {
  it("restores the saved theme after a full load, where the inline script locked the page first", () => {
    const html = stubDocument({ "data-theme": "light", "data-theme-lock": "" }, "theme=dark");
    const release = holdLightTheme();
    expect(html()).toEqual({ "data-theme": "light", "data-theme-lock": "" });
    release();
    expect(html()).toEqual({ "data-theme": "dark" });
  });

  it("stacks holds and unlocks only when the last one is released", () => {
    const html = stubDocument({}, "motion=reduce");
    const outer = holdLightTheme();
    const inner = holdLightTheme("public");
    expect(html()).toEqual({ "data-theme": "light", "data-theme-lock": "", "data-surface": "public" });
    inner();
    inner(); // a second release changes nothing
    expect(html()).toEqual({ "data-theme": "light", "data-theme-lock": "" });
    outer();
    expect(html()).toEqual({}); // System theme: no data-theme
  });

  it("keeps a light page light when the next page takes its hold in the same commit", () => {
    const html = stubDocument({}, "theme=dark");
    const leaving = holdLightTheme("public");
    leaving();
    const arriving = holdLightTheme("public");
    expect(html()).toEqual({ "data-theme": "light", "data-theme-lock": "", "data-surface": "public" });
    arriving();
    expect(html()).toEqual({ "data-theme": "dark" });
  });
});
