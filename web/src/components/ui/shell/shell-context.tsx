"use client";

import { type ReactNode, type RefObject, createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Shared state of the staff shell (components.md, AppShell):
 * - breakpoint: the shell's own width class (base < md 768 < lg 1024 < xl 1280), measured from
 *   the shell root, or null before the first measurement. CSS decides layout with container
 *   queries (@3xl/shell, @5xl/shell, @7xl/shell), so nothing shifts on load; the value here is for
 *   behaviour only (tooltips on the collapsed rail, aria-expanded, what "Expand menu" does).
 * - layers: every sticky or fixed layer registers its height; the shell sums them into
 *   --bottom-bar, --bottom-sticky and --sticky-extra (2.4.11 Focus not obscured).
 * - announce: the shell's one sr-only polite status region.
 */
export type ShellBreakpoint = "base" | "md" | "lg" | "xl";

export type ShellLayer = {
  edge: "top" | "bottom";
  /** Height in px, including any gap the layer keeps (the JobTray's 1rem). */
  height: number;
  /** Sticky bottom bars (FormLayout footer, BulkActionBar) also count towards --bottom-sticky. */
  sticky?: boolean;
};

/** Sums the registered layers and writes the totals as custom properties on one element. */
export class LayerRegistry {
  private layers = new Map<string, ShellLayer>();
  constructor(private readonly getTarget: () => HTMLElement | null) {}

  set(id: string, layer: ShellLayer) {
    this.layers.set(id, layer);
    this.write();
  }

  remove(id: string) {
    this.layers.delete(id);
    this.write();
  }

  totals() {
    let top = 0;
    let bottom = 0;
    let sticky = 0;
    for (const layer of this.layers.values()) {
      if (layer.edge === "top") top += layer.height;
      else {
        bottom += layer.height;
        if (layer.sticky) sticky += layer.height;
      }
    }
    return { top, bottom, sticky };
  }

  private write() {
    const target = this.getTarget();
    if (!target) return;
    const { top, bottom, sticky } = this.totals();
    target.style.setProperty("--sticky-extra", `${top}px`);
    target.style.setProperty("--bottom-bar", `${bottom}px`);
    target.style.setProperty("--bottom-sticky", `${sticky}px`);
  }
}

export type ShellContextValue = {
  breakpoint: ShellBreakpoint | null;
  /** True inside a framed preview (the /design gallery): landmarks are renamed, no global side effects. */
  preview: boolean;
  layers: LayerRegistry;
  announce: (message: string) => void;
  /** A Link inside the shell reports a pending client navigation (useLinkStatus). */
  setNavigating: (pending: boolean) => void;
  /** Opens the navigation drawer (the header's menu button, the rail's "Expand menu" from md to lg). */
  openNav: () => void;
};

const htmlLayers = new LayerRegistry(() => (typeof document === "undefined" ? null : document.documentElement));

const DEFAULT_CONTEXT: ShellContextValue = {
  breakpoint: null,
  preview: false,
  layers: htmlLayers,
  announce: () => {},
  setNavigating: () => {},
  openNav: () => {},
};

const ShellContext = createContext<ShellContextValue>(DEFAULT_CONTEXT);

export function ShellContextProvider({ value, children }: { value: ShellContextValue; children: ReactNode }) {
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellContextValue {
  return useContext(ShellContext);
}

/** Widths in px at which the shell's container breakpoints start (the token breakpoints). */
export const SHELL_BREAKPOINTS = { md: 768, lg: 1024, xl: 1280 } as const;

export function breakpointForWidth(width: number): ShellBreakpoint {
  if (width >= SHELL_BREAKPOINTS.xl) return "xl";
  if (width >= SHELL_BREAKPOINTS.lg) return "lg";
  if (width >= SHELL_BREAKPOINTS.md) return "md";
  return "base";
}

/** The breakpoint of an element's width, measured with a ResizeObserver; null until measured. */
export function useElementBreakpoint(ref: RefObject<HTMLElement | null>): ShellBreakpoint | null {
  const [breakpoint, setBreakpoint] = useState<ShellBreakpoint | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setBreakpoint(breakpointForWidth(entry.contentRect.width));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return breakpoint;
}

/**
 * Registers a fixed or sticky layer's measured height with the shell while `active`, so scroll
 * padding, main's bottom padding and the toast viewport clear it. `gap` is added to the height
 * (the JobTray keeps 1rem under it).
 */
export function useShellLayer(
  id: string,
  ref: RefObject<HTMLElement | null>,
  { edge, sticky = false, gap = 0, active = true }: { edge: "top" | "bottom"; sticky?: boolean; gap?: number; active?: boolean },
) {
  const { layers } = useShell();
  useEffect(() => {
    const node = ref.current;
    if (!node || !active) return;
    const observer = new ResizeObserver(([entry]) => {
      const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      layers.set(id, { edge, height: height > 0 ? height + gap : 0, sticky });
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      layers.remove(id);
    };
  }, [id, ref, edge, sticky, gap, active, layers]);
}

/** A stable LayerRegistry that writes to the element a ref points at (a preview frame's root). */
export function useLayerRegistry(target: RefObject<HTMLElement | null>, enabled: boolean): LayerRegistry {
  return useMemo(() => (enabled ? new LayerRegistry(() => target.current) : htmlLayers), [enabled, target]);
}
