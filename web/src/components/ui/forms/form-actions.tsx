"use client";

import { type ReactNode, useEffect } from "react";
import { cn } from "@/lib/cn";

export type FormActionsProps = {
  /**
   * staff (right-aligned, primary rightmost), public (the primary full width, a secondary link
   * under it) or dialog (the dialog footer: bg-surface-raised with a top border).
   */
  layout?: "staff" | "public" | "dialog";
  /** A destructive extra action ("Delete field"), at the far left on staff forms. */
  destructive?: ReactNode;
  /**
   * Staff page forms taller than the viewport: a sticky footer bar (56 px). While it shows it adds
   * var(--layout-pagebar) to --bottom-bar on <html>, so the last field can scroll clear of it.
   */
  sticky?: boolean;
  className?: string;
  /** Secondary actions first, the primary last (rightmost, last in tab order). */
  children: ReactNode;
};

/** The actions row of a form (components.md FormLayout): buttons 8 px apart, md 40 (staff) or lg 48 (public). */
export function FormActions({ layout = "staff", destructive, sticky = false, className, children }: FormActionsProps) {
  useEffect(() => {
    if (!sticky) return;
    const root = document.documentElement;
    const before = root.style.getPropertyValue("--bottom-bar");
    root.style.setProperty("--bottom-bar", before ? `calc(${before} + var(--layout-pagebar))` : "var(--layout-pagebar)");
    return () => {
      if (before) root.style.setProperty("--bottom-bar", before);
      else root.style.removeProperty("--bottom-bar");
    };
  }, [sticky]);

  if (layout === "public") {
    return <div className={cn("flex flex-col items-stretch gap-2", className)}>{children}</div>;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        layout === "dialog" && "border-t border-border bg-surface-raised px-5 py-4",
        sticky && "sticky bottom-0 z-(--z-sticky) h-pagebar border-t border-border bg-surface px-4 shadow-bar",
        className,
      )}
    >
      {destructive ? <div className="mr-auto flex items-center gap-2">{destructive}</div> : null}
      <div className={cn("flex flex-wrap items-center gap-2", !destructive && "ml-auto")}>{children}</div>
    </div>
  );
}
