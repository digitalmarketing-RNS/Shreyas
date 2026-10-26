"use client";

import { useEffect, useRef } from "react";

/**
 * Moves focus to its parent element when it mounts, and scrolls the parent into view (and its
 * scrolling ancestor to the top when `scrollAncestorToTop`). Used by Alert's "focused" live mode:
 * a dialog's server error is read once by the focus move, with no live role.
 */
export function FocusOnMount({ scrollAncestorToTop = false }: { scrollAncestorToTop?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const target = ref.current?.parentElement;
    if (!target) return;
    if (scrollAncestorToTop) {
      let node: HTMLElement | null = target.parentElement;
      while (node && node.scrollHeight <= node.clientHeight) node = node.parentElement;
      node?.scrollTo({ top: 0 });
    }
    target.focus({ preventScroll: scrollAncestorToTop });
  }, [scrollAncestorToTop]);
  return <span ref={ref} hidden />;
}
