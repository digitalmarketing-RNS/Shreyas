"use client";

import { useLayoutEffect } from "react";
import { THEME_LOCK_ATTRIBUTE } from "@/lib/theme";
import { holdLightTheme } from "./theme-store";

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
 * - Client navigation: a layout effect takes a hold (holdLightTheme) before the browser paints.
 * - Leaving, whether the page unmounts or Activity hides it: the layout effect's cleanup releases
 *   the hold. Once no ForceLightTheme is mounted, the lock comes off and the saved theme comes
 *   back, including after a full load, where the inline script set the lock first.
 * While it is mounted, data-theme-lock on <html> stops ThemeSwitch from changing the page.
 */
export function ForceLightTheme({ surface }: ForceLightThemeProps) {
  useLayoutEffect(() => holdLightTheme(surface), [surface]);

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
