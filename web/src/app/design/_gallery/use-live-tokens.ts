"use client";

import { useSyncExternalStore } from "react";

/**
 * Re-renders when the theme changes: a data-theme / data-motion change on <html>, or the OS
 * colour scheme while the theme is System. Returns null on the server and during hydration, so
 * values read from the browser appear only after mount (no hydration mismatch).
 */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-motion"] });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

function getSnapshot(): string {
  const root = document.documentElement;
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return `${root.getAttribute("data-theme") ?? "system"}|${dark ? "dark" : "light"}|${root.getAttribute("data-motion") ?? ""}`;
}

export function useThemeKey(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/** Reads custom properties from :root as written in tokens.css ("#f2f4f5", "0.875rem", "150ms"). */
export function readTokens(names: readonly string[]): Record<string, string> {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(`--${name}`).trim()]));
}

/** The resolved theme for labels: "light" or "dark". */
export function resolvedTheme(themeKey: string | null): "light" | "dark" | null {
  if (!themeKey) return null;
  const [choice, os] = themeKey.split("|");
  if (choice === "light" || choice === "dark") return choice;
  return os === "dark" ? "dark" : "light";
}
