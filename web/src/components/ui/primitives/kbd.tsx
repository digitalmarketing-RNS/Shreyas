import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type KbdProps = {
  /** One key ("/") as children, or a combination as keys={["Ctrl", "Enter"]}. */
  children?: ReactNode;
  keys?: string[];
  /** Inside a field the hint is decorative: the field's description says the shortcut in words. */
  decorative?: boolean;
  className?: string;
};

const KEY = "inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-border bg-surface px-1 font-sans text-xs text-muted";

/**
 * A key or a key combination inside a hint (components.md Kbd). Key names as printed on keyboards:
 * "/", "Esc", "Enter", "Ctrl", "Alt", "Shift"; on a Mac "Cmd" replaces "Ctrl" (the caller decides).
 * A combination is several <kbd> elements joined by " + ". In a tooltip, write the key as plain
 * text in brackets instead: "Search (/)". Not focusable.
 */
export function Kbd({ children, keys, decorative = false, className }: KbdProps) {
  if (keys && keys.length > 0) {
    return (
      <span aria-hidden={decorative || undefined} className={cn("inline-flex items-center gap-1 text-xs text-muted", className)}>
        {keys.map((key, index) => (
          <Fragment key={`${key}-${index}`}>
            {index > 0 ? <span>+</span> : null}
            <kbd className={KEY}>{key}</kbd>
          </Fragment>
        ))}
      </span>
    );
  }
  return (
    <kbd aria-hidden={decorative || undefined} className={cn(KEY, className)}>
      {children}
    </kbd>
  );
}
