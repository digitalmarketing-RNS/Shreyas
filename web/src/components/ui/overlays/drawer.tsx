"use client";

import { X } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import { type ReactElement, type ReactNode, type RefObject, useRef, useState } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { ConfirmDialog, DISCARD_CHANGES } from "./confirm-dialog";
import {
  focusFirstField,
  overlayBodyClassName,
  overlayDescriptionClassName,
  overlayFooterClassName,
  overlayPanelBaseClassName,
  overlayScrimClassName,
  overlayTitleClassName,
} from "./overlay-styles";
import { usePortalContainer } from "./portal-container";

export type DrawerSide = "right" | "left";
/** sm 400 px, md 560 px, lg 720 px; nav is the navigation drawer (w-sidebar, 240 px). */
export type DrawerSize = "sm" | "md" | "lg" | "nav";

const SIDE: Record<DrawerSide, string> = {
  right:
    "right-0 border-l data-[state=open]:motion-safe:animate-slide-in-right data-[state=closed]:motion-safe:animate-slide-out-right",
  left: "left-0 border-r data-[state=open]:motion-safe:animate-slide-in-left data-[state=closed]:motion-safe:animate-slide-out-left",
};

// Each keeps a strip of the page showing (max-w-[calc(100vw-3rem)]); full width below sm.
const SIZE: Record<DrawerSize, string> = {
  sm: "w-drawer-sm max-w-[calc(100vw-3rem)] max-sm:w-full max-sm:max-w-none",
  md: "w-drawer-md max-w-[calc(100vw-3rem)] max-sm:w-full max-sm:max-w-none",
  lg: "w-drawer-lg max-w-[calc(100vw-3rem)] max-sm:w-full max-sm:max-w-none",
  nav: "w-sidebar max-w-[calc(100vw-3rem)]",
};

const PANEL =
  "fixed inset-y-0 z-(--z-modal) rounded-none shadow-modal data-[state=open]:motion-reduce:animate-fade-in data-[state=closed]:motion-reduce:animate-fade-out";

const HEADER = "flex min-h-control-lg shrink-0 items-start gap-3 border-b border-border px-5 py-3";

export type DrawerProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactElement;
  /** "Filters", "Follow-up with Ananya Rao", "Admissions team". */
  title: ReactNode;
  description?: ReactNode;
  side?: DrawerSide;
  size?: DrawerSize;
  children?: ReactNode;
  /** Actions at the right of the footer ("Apply"). */
  footer?: ReactNode;
  /** The footer's left slot ("Clear all"). */
  footerStart?: ReactNode;
  /** Filters with unapplied changes: "3 changes not applied", shown in the footer until Apply. */
  pendingNote?: ReactNode;
  /** Unsaved input: Esc and the close button ask "Discard your changes?"; the overlay does nothing. */
  dirty?: boolean;
  /** Applying or saving: Esc, the overlay and the close button are ignored. */
  submitting?: boolean;
  loading?: boolean;
  /**
   * Where focus goes on open: the first control (filters, forms), the title container (detail
   * drawers), or a given element (the navigation drawer focuses the current page's link).
   */
  initialFocus?: "first-control" | "title" | RefObject<HTMLElement | null> | (() => HTMLElement | null);
  closeLabel?: string;
  className?: string;
  bodyClassName?: string;
};

/**
 * A side panel over the page for filters, secondary detail or a tree, where height matters more
 * than width (components.md, Drawer). Always modal (Radix Dialog): Tab is trapped, Esc closes with
 * the dirty check, focus returns to the trigger. Square edges.
 */
export function Drawer({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger,
  title,
  description,
  side = "right",
  size = "sm",
  children,
  footer,
  footerStart,
  pendingNote,
  dirty = false,
  submitting = false,
  loading = false,
  initialFocus = "first-control",
  closeLabel = "Close",
  className,
  bodyClassName,
}: DrawerProps) {
  const container = usePortalContainer();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp ?? internalOpen;
  const [discardOpen, setDiscardOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const requestClose = () => {
    if (submitting) return;
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    setOpen(false);
  };

  const describedBy = description ? {} : { "aria-describedby": undefined };

  return (
    <RadixDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setOpen(true);
        else requestClose();
      }}
    >
      {trigger ? <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger> : null}
      <RadixDialog.Portal container={container}>
        <RadixDialog.Overlay className={overlayScrimClassName} />
        <RadixDialog.Content
          ref={contentRef}
          {...describedBy}
          className={cn(overlayPanelBaseClassName, PANEL, SIDE[side], SIZE[size], className)}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            if (initialFocus === "title") titleRef.current?.focus({ preventScroll: true });
            else if (typeof initialFocus === "function") (initialFocus() ?? contentRef.current)?.focus({ preventScroll: true });
            else if (initialFocus !== "first-control" && initialFocus.current) initialFocus.current.focus({ preventScroll: true });
            else focusFirstField(bodyRef.current, footerRef.current, contentRef.current);
          }}
          onInteractOutside={(event) => {
            if (dirty || submitting) event.preventDefault();
          }}
        >
          <div className={HEADER}>
            <div ref={titleRef} tabIndex={-1} className="min-w-0 flex-1">
              <RadixDialog.Title className={overlayTitleClassName}>{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description asChild>
                  <div className={overlayDescriptionClassName}>{description}</div>
                </RadixDialog.Description>
              ) : null}
            </div>
            <IconButton
              icon={<X />}
              aria-label={closeLabel}
              size="sm"
              className="-mr-2"
              disabledReason={submitting ? "Saving…" : undefined}
              onClick={requestClose}
            />
          </div>
          <div ref={bodyRef} aria-busy={loading || undefined} className={cn(overlayBodyClassName, bodyClassName)}>
            {children}
          </div>
          {footer || footerStart || pendingNote ? (
            <div ref={footerRef} className={overlayFooterClassName}>
              {footerStart ? <div className="mr-auto flex items-center gap-2">{footerStart}</div> : null}
              {pendingNote ? <p className="m-0 text-xs text-muted">{pendingNote}</p> : null}
              {footer}
            </div>
          ) : null}
          <ConfirmDialog
            open={discardOpen}
            onOpenChange={setDiscardOpen}
            title={DISCARD_CHANGES.title}
            description={DISCARD_CHANGES.description}
            confirmLabel={DISCARD_CHANGES.confirmLabel}
            cancelLabel={DISCARD_CHANGES.cancelLabel}
            tone="danger"
            onConfirm={() => setOpen(false)}
          />
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export type DrawerPreviewProps = Pick<
  DrawerProps,
  "title" | "description" | "side" | "children" | "footer" | "footerStart" | "pendingNote" | "loading" | "closeLabel" | "className"
> & {
  /** Height of the drawn panel; the default suits a gallery specimen. */
  heightClassName?: string;
};

/**
 * The drawer panel drawn in place, for documentation and screenshots only (the /design gallery):
 * not modal, no overlay, no behaviour. Wrap it in an inert container. Never use it in the app.
 */
export function DrawerPreview({
  title,
  description,
  side = "right",
  children,
  footer,
  footerStart,
  pendingNote,
  loading = false,
  closeLabel = "Close",
  className,
  heightClassName = "h-112",
}: DrawerPreviewProps) {
  return (
    <div
      className={cn(
        overlayPanelBaseClassName,
        "w-full max-w-drawer-sm shadow-modal",
        side === "right" ? "border-l" : "border-r",
        heightClassName,
        className,
      )}
    >
      <div className={HEADER}>
        <div className="min-w-0 flex-1">
          <h2 className={overlayTitleClassName}>{title}</h2>
          {description ? <div className={overlayDescriptionClassName}>{description}</div> : null}
        </div>
        <IconButton icon={<X />} aria-label={closeLabel} size="sm" className="-mr-2" tooltip={false} />
      </div>
      <div aria-busy={loading || undefined} className={overlayBodyClassName}>
        {children}
      </div>
      {footer || footerStart || pendingNote ? (
        <div className={overlayFooterClassName}>
          {footerStart ? <div className="mr-auto flex items-center gap-2">{footerStart}</div> : null}
          {pendingNote ? <p className="m-0 text-xs text-muted">{pendingNote}</p> : null}
          {footer}
        </div>
      ) : null}
    </div>
  );
}
