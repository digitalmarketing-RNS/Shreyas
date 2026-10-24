"use client";

import { X } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import {
  type FormEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
  createContext,
  useContext,
  useRef,
  useState,
} from "react";
import { Button, type LabelledButtonProps } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { ConfirmDialog, DISCARD_CHANGES } from "./confirm-dialog";
import {
  DIALOG_MAX_WIDTH,
  type DialogSize,
  dialogPositionClassName,
  dialogSheetClassName,
  focusFirstField,
  overlayBodyClassName,
  overlayDescriptionClassName,
  overlayFooterClassName,
  overlayHeaderClassName,
  overlayPanelBaseClassName,
  overlayScrimClassName,
  overlayTitleClassName,
  sheetFooterClassName,
} from "./overlay-styles";
import { usePortalContainer } from "./portal-container";

export type { DialogSize } from "./overlay-styles";

type DialogControl = {
  /** Close the way Esc, the close button and Cancel do: blocked while submitting, asks first when dirty. */
  requestClose: () => void;
  submitting: boolean;
};

const DialogControlContext = createContext<DialogControl>({ requestClose: () => {}, submitting: false });

export type DialogProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The button that opens it (Dialog.Trigger asChild). Focus returns to it on close. */
  trigger?: ReactElement;
  /** The task with its object: "Change stage for Ananya Rao". */
  title: ReactNode;
  description?: ReactNode;
  /** sm 400 px (short forms, confirmations), md 560 px (S09, S11, S28, S32), lg 800 px (S10, S13, S14). */
  size?: DialogSize;
  /** The body: fields, Alerts, previews. It scrolls on its own. */
  children?: ReactNode;
  /** Secondary Button(s) then the primary (rightmost, last in tab order). Buttons md. */
  footer?: ReactNode;
  /** The footer's left slot: a tertiary or destructive action, or the compact Stepper. */
  footerStart?: ReactNode;
  /** Wraps body and footer in a <form noValidate>, so Enter in a single-line field submits. */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  /** Unsaved input: Esc, the close button and Cancel ask "Discard your changes?"; the overlay does nothing. */
  dirty?: boolean;
  /** Saving: Esc, the overlay and the close button are ignored; close is aria-disabled with "Saving…". */
  submitting?: boolean;
  /** The body shows Skeleton fields and is aria-busy. */
  loading?: boolean;
  /** The element to focus on open. Default: the first invalid field, else the first field (never the close button). */
  initialFocus?: RefObject<HTMLElement | null>;
  className?: string;
};

/**
 * A focused task over the current page, with a form, a clear way out, and safe handling of
 * errors and unsaved input (components.md, Dialog). Radix Dialog: role="dialog", aria-modal,
 * labelled by its title; content outside is inert; body scroll is locked. A dialog never opens
 * another Dialog; only the ConfirmDialog for discarding may sit on top.
 */
export function Dialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger,
  title,
  description,
  size = "md",
  children,
  footer,
  footerStart,
  onSubmit,
  dirty = false,
  submitting = false,
  loading = false,
  initialFocus,
  className,
}: DialogProps) {
  const container = usePortalContainer();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp ?? internalOpen;
  const [discardOpen, setDiscardOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
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
          className={cn(
            overlayPanelBaseClassName,
            dialogPositionClassName,
            DIALOG_MAX_WIDTH[size],
            size !== "sm" && dialogSheetClassName,
            className,
          )}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            if (initialFocus?.current) initialFocus.current.focus({ preventScroll: true });
            else focusFirstField(bodyRef.current, footerRef.current, contentRef.current);
          }}
          onInteractOutside={(event) => {
            // An overlay click on a dirty or saving dialog does nothing: accidental clicks don't prompt.
            if (dirty || submitting) event.preventDefault();
          }}
        >
          <DialogControlContext.Provider value={{ requestClose, submitting }}>
            <DialogLayout
              live
              title={title}
              description={description}
              footer={footer}
              footerStart={footerStart}
              onSubmit={onSubmit}
              loading={loading}
              sheet={size !== "sm"}
              bodyRef={bodyRef}
              footerRef={footerRef}
            >
              {children}
            </DialogLayout>
          </DialogControlContext.Provider>
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

/**
 * The footer's Cancel: closes with the dirty check (and does nothing while submitting). Pass the
 * label for other secondary closes, such as "Close" on a read-only or result dialog.
 */
export function DialogCancel({
  children = "Cancel",
  variant = "secondary",
  ...rest
}: Omit<LabelledButtonProps, "onClick" | "children" | "asChild"> & { children?: ReactNode }) {
  const { requestClose, submitting } = useContext(DialogControlContext);
  return (
    <Button {...rest} variant={variant} size={rest.size ?? "md"} aria-disabled={submitting || undefined} onClick={requestClose}>
      {children}
    </Button>
  );
}

export type DialogPreviewProps = Omit<
  DialogProps,
  "open" | "defaultOpen" | "onOpenChange" | "trigger" | "onSubmit" | "dirty" | "initialFocus"
> & {
  /** Draw it as the full-screen sheet that md and lg dialogs become below sm. */
  sheet?: boolean;
};

/**
 * The panel drawn in place, for documentation and screenshots only (the /design gallery): not
 * modal, no overlay, no behaviour. Wrap it in an inert container. Never use it in the app.
 */
export function DialogPreview({
  title,
  description,
  size = "md",
  children,
  footer,
  footerStart,
  submitting = false,
  loading = false,
  sheet = false,
  className,
}: DialogPreviewProps) {
  return (
    <div
      className={cn(
        overlayPanelBaseClassName,
        "w-full",
        sheet ? "h-full rounded-none border-0" : cn("rounded-lg border shadow-modal", DIALOG_MAX_WIDTH[size]),
        className,
      )}
    >
      <DialogControlContext.Provider value={{ requestClose: () => {}, submitting }}>
        <DialogLayout
          live={false}
          title={title}
          description={description}
          footer={footer}
          footerStart={footerStart}
          loading={loading}
          sheet={sheet}
        >
          {children}
        </DialogLayout>
      </DialogControlContext.Provider>
    </div>
  );
}

function DialogLayout({
  live,
  title,
  description,
  children,
  footer,
  footerStart,
  onSubmit,
  loading,
  sheet,
  bodyRef,
  footerRef,
}: {
  live: boolean;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  footerStart?: ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  sheet: boolean;
  bodyRef?: RefObject<HTMLDivElement | null>;
  footerRef?: RefObject<HTMLDivElement | null>;
}) {
  const Title = live ? RadixDialog.Title : "h2";
  const header = (
    <div className={overlayHeaderClassName}>
      <div className="min-w-0 flex-1">
        <Title className={overlayTitleClassName}>{title}</Title>
        {description ? (
          live ? (
            <RadixDialog.Description asChild>
              <div className={overlayDescriptionClassName}>{description}</div>
            </RadixDialog.Description>
          ) : (
            <div className={overlayDescriptionClassName}>{description}</div>
          )
        ) : null}
      </div>
      <DialogCloseButton />
    </div>
  );

  const rest = (
    <>
      <div ref={bodyRef} aria-busy={loading || undefined} className={overlayBodyClassName}>
        {children}
      </div>
      {footer || footerStart ? (
        <div ref={footerRef} className={cn(overlayFooterClassName, sheet && sheetFooterClassName)}>
          {footerStart ? <div className="mr-auto flex min-w-0 items-center gap-2 text-sm text-muted">{footerStart}</div> : null}
          {footer}
        </div>
      ) : null}
    </>
  );

  return (
    <>
      {header}
      {onSubmit ? (
        <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          {rest}
        </form>
      ) : (
        rest
      )}
    </>
  );
}

function DialogCloseButton() {
  const { requestClose, submitting } = useContext(DialogControlContext);
  return (
    <IconButton
      icon={<X />}
      aria-label="Close"
      size="sm"
      className="-mt-1 -mr-2"
      disabledReason={submitting ? "Saving…" : undefined}
      onClick={requestClose}
    />
  );
}
