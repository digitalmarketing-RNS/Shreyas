"use client";

import { type RefObject, useEffect, useState } from "react";

function overlaps(a: DOMRect, b: DOMRect): boolean {
  return a.width > 0 && b.width > 0 && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/**
 * Focus not obscured (2.4.11): when an element that gets focus sits under a fixed layer (the
 * toast viewport, the JobTray), the layer reports `moved` so it can move to the top right, and
 * returns once focus leaves that element.
 */
export function useAvoidFocusOverlap(ref: RefObject<HTMLElement | null>): boolean {
  const [moved, setMoved] = useState(false);
  useEffect(() => {
    let release: (() => void) | null = null;
    const onFocusIn = (event: FocusEvent) => {
      const layer = ref.current;
      const target = event.target;
      if (!layer || !(target instanceof HTMLElement) || layer.contains(target) || release) return;
      if (!overlaps(layer.getBoundingClientRect(), target.getBoundingClientRect())) return;
      setMoved(true);
      const onFocusOut = () => {
        setMoved(false);
        target.removeEventListener("focusout", onFocusOut);
        release = null;
      };
      target.addEventListener("focusout", onFocusOut);
      release = () => target.removeEventListener("focusout", onFocusOut);
    };
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      release?.();
    };
  }, [ref]);
  return moved;
}
