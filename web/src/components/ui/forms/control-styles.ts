import { cn } from "@/lib/cn";

/**
 * Class strings shared by the form controls, so every box, popover and option looks the same
 * (components.md TextInput tokens, Select tokens, Combobox tokens).
 */

export type ControlSize = "sm" | "md" | "lg";

/** Heights of the text-like controls: sm 32 (filters, inline edit), md 40 (staff forms), lg 48 (public). */
export const CONTROL_HEIGHT: Record<ControlSize, string> = {
  sm: "h-control-sm",
  md: "h-control-md",
  lg: "h-control-lg",
};

/** Staff inputs use 16 px text on touch screens so iOS Safari does not zoom; public pages always do. */
export const CONTROL_TEXT: Record<ControlSize, string> = {
  sm: "text-sm pointer-coarse:text-base",
  md: "text-sm pointer-coarse:text-base",
  lg: "text-base",
};

export const CONTROL_PADDING_X: Record<ControlSize, string> = {
  sm: "px-2.5",
  md: "px-3",
  lg: "px-4",
};

export type ControlState = { invalid?: boolean; disabled?: boolean; readOnly?: boolean };

/**
 * The TextInput box: bg-surface text-fg border border-input rounded-md, a darker edge on hover.
 * invalid → border-danger; disabled → bg-surface-subtle text-muted border-border; read-only →
 * bg-surface-sunken with no edge.
 */
export function controlBox({ invalid, disabled, readOnly }: ControlState = {}): string {
  return cn(
    "rounded-md border bg-surface text-fg transition-colors duration-fast ease-standard",
    disabled
      ? "cursor-not-allowed border-border bg-surface-subtle text-muted"
      : readOnly
        ? "border-transparent bg-surface-sunken"
        : invalid
          ? "border-danger"
          : "border-input hover:border-muted",
  );
}

/**
 * A wrapper that draws the focus ring for the bare input inside it (the input carries
 * focus-visible:outline-none, which the conventions allow only because this redraws the ring).
 */
export const RING_FROM_INPUT =
  "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus-ring has-[input:focus-visible]:outline-solid";

/** The bare input inside a box: transparent, no ring of its own (the box draws it). */
export const BARE_INPUT =
  "h-full min-w-0 flex-1 bg-transparent text-inherit placeholder:text-muted focus-visible:outline-none disabled:cursor-not-allowed " +
  "autofill:shadow-[inset_0_0_0_1000px_var(--surface)] autofill:[-webkit-text-fill-color:var(--text)]";

/** Popover panels: the listbox of Select and Combobox, and the calendars (components.md Popover tokens). */
export const POPOVER_PANEL = cn(
  "z-(--z-popover) rounded-lg border border-border bg-surface-raised text-fg shadow-pop",
  "data-[state=open]:motion-safe:animate-pop-in data-[state=open]:motion-reduce:animate-fade-in data-[state=closed]:animate-fade-out",
);

/** One option row in a listbox (Select, Combobox, time list). */
export const OPTION_ROW = "flex min-h-menu-item w-full cursor-default items-center gap-2 rounded-sm px-2 text-left text-sm text-fg select-none";

/** The highlighted option of an aria-activedescendant listbox: as visible as real focus. */
export const OPTION_ACTIVE = "bg-surface-hover outline-2 outline-focus-ring outline-solid focus-inset";

/** A listbox group heading. */
export const GROUP_HEADING = "px-2 py-1 text-xs font-medium text-muted";

/** Text that truncates keeps room for deep Indic subscripts inside its clipping box. */
export const TRUNCATE = "truncate pt-0.5 pb-1";

/** The app-wide count badge (IconButton, ChannelTabs, chips). */
export const COUNT_BADGE = "inline-flex h-5 min-w-5 items-center justify-center rounded-pill px-1.5 text-xs font-medium tabular-nums";
