"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether a media query matches, for behaviour that CSS cannot express (which actions move into a
 * menu). Layout itself stays in CSS so nothing shifts on load; `serverValue` is what the server and
 * the first client render assume.
 */
export function useMediaQuery(query: string, serverValue = true): boolean {
  return useSyncExternalStore(
    (callback) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", callback);
      return () => list.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** The token breakpoints (tailwind.css): md 48rem. */
export const MEDIA_MD = "(min-width: 48rem)";
