/**
 * Class recipes shared by Dialog, ConfirmDialog and Drawer (components.md, Overlays). Each overlay
 * file imports these, so the live overlay and its documentation preview use the same strings.
 */

/** The scrim behind modal overlays. */
export const overlayScrimClassName =
  "fixed inset-0 z-(--z-overlay) bg-overlay data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out";

/** The raised panel every dialog and drawer shares. */
export const overlayPanelBaseClassName = "flex flex-col bg-surface-raised text-fg border-border";

export type DialogSize = "sm" | "md" | "lg";

export const DIALOG_MAX_WIDTH: Record<DialogSize, string> = {
  sm: "max-w-dialog-sm",
  md: "max-w-dialog-md",
  lg: "max-w-dialog-lg",
};

/** Centred dialog panel position and motion (rise-in on open, fade-out on close). */
export const dialogPositionClassName = [
  "fixed top-1/2 left-1/2 z-(--z-modal) -translate-x-1/2 -translate-y-1/2",
  "w-[calc(100vw-2rem)] max-h-[calc(100dvh-4rem)] rounded-lg border shadow-modal",
  "data-[state=open]:motion-safe:animate-rise-in data-[state=open]:motion-reduce:animate-fade-in data-[state=closed]:animate-fade-out",
].join(" ");

/** md and lg dialogs become a full-screen sheet below sm (640 px); sm dialogs stay a card. */
export const dialogSheetClassName =
  "max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0";

export const overlayHeaderClassName = "flex items-start gap-3 px-5 pt-5 pb-3";
export const overlayTitleClassName = "text-md text-fg";
export const overlayDescriptionClassName = "mt-1 text-sm text-muted";
export const overlayBodyClassName = "min-h-0 flex-1 overflow-y-auto px-5 py-4";
export const overlayFooterClassName = "flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4";
/** A full-screen sheet keeps the footer clear of the home indicator. */
export const sheetFooterClassName = "max-sm:pb-[calc(1rem+env(safe-area-inset-bottom))]";

/** The elements that receive focus when a dialog opens on a form: the first field, invalid ones first. */
export const FIELD_SELECTOR = 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"]';
export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Focus for a dialog or drawer that just opened (components.md, Dialog keyboard): the element
 * marked data-autofocus, else the first invalid field, else the first field, else the first
 * focusable element in the body, else the footer's last button (the primary). Never the close button.
 */
export function focusFirstField(body: HTMLElement | null, footer: HTMLElement | null, fallback: HTMLElement | null) {
  const target =
    body?.querySelector<HTMLElement>("[data-autofocus]") ??
    body?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
    body?.querySelector<HTMLElement>(FIELD_SELECTOR) ??
    body?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
    lastOf(footer?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]")) ??
    fallback;
  target?.focus({ preventScroll: true });
}

function lastOf<T>(list: NodeListOf<T & Element> | undefined): T | null {
  if (!list || list.length === 0) return null;
  return list[list.length - 1];
}
