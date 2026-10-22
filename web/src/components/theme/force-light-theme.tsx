"use client";

import { useLayoutEffect } from "react";
import { THEME_LOCK_ATTRIBUTE, readThemeCookie } from "@/lib/theme";
import { applyTheme } from "./theme-store";

export type ForceLightThemeProps = {
  /** "public" also switches <html> to the public surface: system fonts and 16 px text. */
  surface?: "public";
};

/**
 * Keeps the page light whatever the person's theme, for public pages and light-only previews.
 * Render it once in the layout (or page) that must stay light.
 *
 * - First load: an inline script sets data-theme="light" while the HTML is parsed. Routes under
 *   PUBLIC_ROUTE_PREFIXES are also handled by the <head> script, so they never paint dark.
 * - Client navigation: a layout effect sets the same attributes before the browser paints.
 * - Leaving: the attributes are restored and the saved theme comes back.
 * While it is mounted, data-theme-lock on <html> stops ThemeSwitch from changing the page.
 */
export function ForceLightTheme({ surface }: ForceLightThemeProps) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const before = {
      locked: root.hasAttribute(THEME_LOCK_ATTRIBUTE),
      surface: root.getAttribute("data-surface"),
    };
    root.setAttribute("data-theme", "light");
    root.setAttribute(THEME_LOCK_ATTRIBUTE, "");
    if (surface) root.setAttribute("data-surface", surface);
    return () => {
      if (before.surface === null) root.removeAttribute("data-surface");
      else root.setAttribute("data-surface", before.surface);
      if (!before.locked) {
        root.removeAttribute(THEME_LOCK_ATTRIBUTE);
        applyTheme(readThemeCookie(document.cookie));
      }
    };
  }, [surface]);

  const script =
    'var d=document.documentElement;d.setAttribute("data-theme","light");' +
    `d.setAttribute("${THEME_LOCK_ATTRIBUTE}","");` +
    (surface ? `d.setAttribute("data-surface",${JSON.stringify(surface)});` : "");

  // Runs during HTML parsing on a full page load. On the client the type is text/plain, so React
  // never executes or warns about it; the layout effect covers client navigations.
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
