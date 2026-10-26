"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A framed preview at a real width (1280, 1024, 800, 390 px) scaled down with CSS zoom to fit the
 * gallery column. Zoom changes the layout size, so the frame never overflows the page, while
 * container queries inside still see the real width. The inner box has a transform, so fixed
 * layers (drawers, toasts, the task tray, the skip link) stay inside the frame. Until it has
 * measured, the frame is marked data-gallery-pending so screenshots wait for it.
 */
export function ZoomFrame({
  label,
  note,
  width,
  height,
  minZoom = 0.75,
  children,
  className,
}: {
  label: string;
  note?: ReactNode;
  /** The width the preview renders at, in CSS px. */
  width: number;
  height: number;
  /**
   * Below this the frame scrolls sideways instead of shrinking further. 0.75 keeps the shell's
   * 32 px targets at 24 px (2.5.8 Target Size), which axe measures as rendered.
   */
  minZoom?: number;
  children: ReactNode;
  className?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number | null>(null);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width;
      setZoom(Math.max(minZoom, Math.min(1, available / width)));
    });
    observer.observe(outer);
    return () => observer.disconnect();
  }, [width, minZoom]);

  return (
    <figure className={cn("m-0 flex min-w-0 flex-col gap-2", className)}>
      <figcaption className="flex flex-col">
        <span className="text-xs font-medium text-fg">{label}</span>
        {note ? <span className="text-xs text-muted">{note}</span> : null}
        <span className="text-xs text-muted">{`Rendered at ${width} px wide${zoom !== null && zoom < 1 ? `, shown at ${Math.round(zoom * 100)}%` : ""}.`}</span>
      </figcaption>
      <div
        ref={outerRef}
        data-gallery-pending={zoom === null ? "" : undefined}
        className="w-full min-w-0 overflow-x-auto rounded-lg border border-border bg-bg"
      >
        <div className="relative transform-gpu overflow-hidden" style={{ width, height, zoom: zoom ?? 1 }}>
          {children}
        </div>
      </div>
    </figure>
  );
}
