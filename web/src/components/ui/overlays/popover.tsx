"use client";

import { Popover as RadixPopover } from "radix-ui";
import { type ReactElement, type ReactNode, useId, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { Drawer } from "./drawer";

export type PopoverSize = "sm" | "md" | "lg";

const SIZE: Record<PopoverSize, string> = {
  sm: "w-64",
  md: "w-80",
  lg: "w-[min(var(--layout-dialog-sm),calc(100vw-2rem))]",
};

/** Panel look shared with the preview and the pickers that host listboxes (components.md, Popover). */
export const popoverPanelClassName = cn(
  "z-(--z-popover) overflow-y-auto rounded-lg border border-border bg-surface-raised text-fg shadow-pop",
  "max-h-[min(480px,var(--radix-popover-content-available-height))]",
  "data-[state=open]:motion-safe:animate-pop-in data-[state=open]:motion-reduce:animate-fade-in data-[state=closed]:animate-fade-out",
);

export const popoverHeadingClassName = "text-sm font-semibold text-fg";

export type PopoverProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The control that opens it. Radix gives it aria-haspopup="dialog", aria-expanded and aria-controls. */
  trigger: ReactElement;
  /** A visible heading that names the popover (aria-labelledby). */
  title?: ReactNode;
  titleAs?: "h2" | "h3";
  /** The popover's name when it has no visible heading. */
  "aria-label"?: string;
  /** The id of an element inside that names it (a feed's own h2). */
  labelledBy?: string;
  size?: PopoverSize;
  /** list: p-1 with full-width rows (feeds, link lists, checkbox lists); default: p-3. */
  variant?: "default" | "list";
  /** Footer actions ("Clear", "Apply"). */
  footer?: ReactNode;
  children?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Below sm, open as a full-width Drawer instead (for popovers taller than half the screen). */
  drawerBelowSm?: boolean;
  contentClassName?: string;
};

const SM_QUERY = "(max-width: 39.99rem)";

function subscribeNarrow(callback: () => void) {
  const query = window.matchMedia(SM_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/**
 * Small interactive content anchored to a trigger, without blocking the page (components.md,
 * Popover). Modal: focus is trapped and loops while open and content outside is hidden from
 * assistive tech, so a portalled popover never loses keyboard users at the end of the page.
 * Enter or Space opens it and moves focus to the first control (or the panel); Esc, a click
 * outside, or a Close or Apply button closes it and returns focus to the trigger. No arrow.
 */
export function Popover({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  titleAs: Heading = "h2",
  "aria-label": ariaLabel,
  labelledBy,
  size = "md",
  variant = "default",
  footer,
  children,
  side = "bottom",
  align = "start",
  drawerBelowSm = false,
  contentClassName,
}: PopoverProps) {
  const headingId = useId();
  const narrow = useSyncExternalStore(
    drawerBelowSm ? subscribeNarrow : noopSubscribe,
    () => drawerBelowSm && window.matchMedia(SM_QUERY).matches,
    () => false,
  );

  if (narrow) {
    return (
      <Drawer
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        trigger={trigger}
        title={title ?? ariaLabel ?? ""}
        footer={footer}
        size="sm"
      >
        {children}
      </Drawer>
    );
  }

  const labelling = title ? { "aria-labelledby": headingId } : labelledBy ? { "aria-labelledby": labelledBy } : { "aria-label": ariaLabel };

  return (
    <RadixPopover.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} modal>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          {...labelling}
          side={side}
          align={align}
          sideOffset={4}
          collisionPadding={8}
          className={cn(popoverPanelClassName, SIZE[size], variant === "list" ? "p-1" : "p-3", contentClassName)}
        >
          <PopoverLayout title={title} Heading={Heading} headingId={headingId} footer={footer} variant={variant}>
            {children}
          </PopoverLayout>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

/** A button inside the popover that closes it (Radix Popover.Close asChild). */
export const PopoverClose = RadixPopover.Close;

export type PopoverPreviewProps = Pick<PopoverProps, "title" | "titleAs" | "size" | "variant" | "footer" | "children"> & {
  className?: string;
};

/**
 * The panel drawn in place, for documentation and screenshots only (the /design gallery). Wrap
 * it in an inert container. Never use it in the app.
 */
export function PopoverPreview({ title, titleAs: Heading = "h3", size = "md", variant = "default", footer, children, className }: PopoverPreviewProps) {
  const headingId = useId();
  return (
    <div
      className={cn(
        "max-w-full rounded-lg border border-border bg-surface-raised text-fg shadow-pop",
        SIZE[size],
        variant === "list" ? "p-1" : "p-3",
        className,
      )}
    >
      <PopoverLayout title={title} Heading={Heading} headingId={headingId} footer={footer} variant={variant}>
        {children}
      </PopoverLayout>
    </div>
  );
}

function PopoverLayout({
  title,
  Heading,
  headingId,
  footer,
  variant,
  children,
}: {
  title?: ReactNode;
  Heading: "h2" | "h3";
  headingId: string;
  footer?: ReactNode;
  variant: "default" | "list";
  children?: ReactNode;
}) {
  return (
    <>
      {title ? (
        <Heading id={headingId} className={cn(popoverHeadingClassName, variant === "list" ? "px-2 pt-1.5 pb-1" : "mb-2")}>
          {title}
        </Heading>
      ) : null}
      {children}
      {footer ? (
        <div className={cn("mt-3 flex items-center justify-end gap-2", variant === "list" && "px-2 pb-1.5")}>{footer}</div>
      ) : null}
    </>
  );
}

function noopSubscribe() {
  return () => {};
}
