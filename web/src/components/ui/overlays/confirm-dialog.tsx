"use client";

import { AlertDialog } from "radix-ui";
import { type ReactElement, type ReactNode, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback/alert";
import { cn } from "@/lib/cn";
import {
  dialogPositionClassName,
  overlayBodyClassName,
  overlayDescriptionClassName,
  overlayFooterClassName,
  overlayHeaderClassName,
  overlayPanelBaseClassName,
  overlayScrimClassName,
  overlayTitleClassName,
} from "./overlay-styles";
import { usePortalContainer } from "./portal-container";

/** The one discard prompt for forms, dialogs and drawers (components.md, ConfirmDialog). */
export const DISCARD_CHANGES = {
  title: "Discard your changes?",
  description: "You'll lose what you've typed.",
  confirmLabel: "Discard",
  cancelLabel: "Keep editing",
} as const;

const GENERIC_ERROR = "Something went wrong on our side. Nothing was changed. Try again in a moment.";

export type ConfirmTone = "danger" | "primary";

export type ConfirmDialogProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The button that opens it (rendered with AlertDialog.Trigger asChild). */
  trigger?: ReactElement;
  /** A question that names the object and the count: "Delete 312 leads?" */
  title: string;
  /** What will happen and what will not, in words. The danger colour is never the only warning. */
  description: ReactNode;
  /** Repeats the verb and object: "Delete 312 leads", "Revoke key". Never "OK" or "Yes". */
  confirmLabel: string;
  /** Shown on the confirm button while it runs: "Deleting…". */
  confirmingLabel?: string;
  cancelLabel?: string;
  /** danger for destructive actions; primary for "Send now", "Publish", "Go live". */
  tone?: ConfirmTone;
  /**
   * Runs the action. A promise puts the dialog in its confirming state (Cancel and Esc ignored);
   * it closes when the promise resolves and shows the error Alert when it rejects.
   */
  onConfirm: () => void | Promise<void>;
  /** An error from outside (the panel stays open and shows it). */
  error?: ReactNode;
  /**
   * Typed confirmation (bulk deletes over 100 leads, erasure requests): the exact text to type,
   * e.g. "312". The confirm stays aria-disabled with the reason "Type 312 to confirm" until it matches.
   */
  typedConfirmation?: string;
};

/**
 * A clear yes or no before an action that deletes, stops, overwrites or is hard to undo
 * (components.md, ConfirmDialog). Radix AlertDialog: focus starts on Cancel, so Enter alone never
 * destroys; the overlay does not close it; Esc cancels.
 */
export function ConfirmDialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger,
  title,
  description,
  confirmLabel,
  confirmingLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  error,
  typedConfirmation,
}: ConfirmDialogProps) {
  const container = usePortalContainer();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp ?? internalOpen;
  const [confirming, setConfirming] = useState(false);
  const [ownError, setOwnError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  // A fresh start each time it opens: no old error, nothing typed.
  useEffect(() => {
    if (!open) return;
    setOwnError(null);
    setTyped("");
  }, [open]);

  const matches = !typedConfirmation || typed.trim() === typedConfirmation;

  const confirm = async () => {
    if (confirming || !matches) return;
    setOwnError(null);
    try {
      const result = onConfirm();
      if (result instanceof Promise) {
        setConfirming(true);
        await result;
      }
      setOpen(false);
    } catch (reason) {
      setOwnError(reason instanceof Error && reason.message ? reason.message : GENERIC_ERROR);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && confirming) return;
        setOpen(next);
      }}
    >
      {trigger ? <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger> : null}
      <AlertDialog.Portal container={container}>
        <AlertDialog.Overlay className={overlayScrimClassName} />
        <AlertDialog.Content
          className={cn(overlayPanelBaseClassName, dialogPositionClassName, "max-w-dialog-sm")}
          onEscapeKeyDown={(event) => {
            if (confirming) event.preventDefault();
          }}
        >
          <ConfirmLayout
            mode="live"
            title={title}
            description={description}
            confirmLabel={confirmLabel}
            confirmingLabel={confirmingLabel}
            cancelLabel={cancelLabel}
            tone={tone}
            confirming={confirming}
            error={error ?? ownError}
            typedConfirmation={typedConfirmation}
            typed={typed}
            onTypedChange={setTyped}
            matches={matches}
            onConfirm={confirm}
          />
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export type ConfirmDialogPreviewProps = Pick<
  ConfirmDialogProps,
  "title" | "description" | "confirmLabel" | "confirmingLabel" | "cancelLabel" | "tone" | "typedConfirmation"
> & {
  confirming?: boolean;
  error?: ReactNode;
  typed?: string;
  className?: string;
};

/**
 * The panel drawn in place, for documentation and screenshots only (the /design gallery). It is
 * not modal, has no overlay and does nothing; wrap it in an inert container. Never use it in the app.
 */
export function ConfirmDialogPreview({
  title,
  description,
  confirmLabel,
  confirmingLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  typedConfirmation,
  confirming = false,
  error,
  typed = "",
  className,
}: ConfirmDialogPreviewProps) {
  const matches = !typedConfirmation || typed.trim() === typedConfirmation;
  return (
    <div className={cn(overlayPanelBaseClassName, "w-full max-w-dialog-sm rounded-lg border shadow-modal", className)}>
      <ConfirmLayout
        mode="static"
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        confirmingLabel={confirmingLabel}
        cancelLabel={cancelLabel}
        tone={tone}
        confirming={confirming}
        error={error}
        typedConfirmation={typedConfirmation}
        typed={typed}
        matches={matches}
      />
    </div>
  );
}

function ConfirmLayout({
  mode,
  title,
  description,
  confirmLabel,
  confirmingLabel,
  cancelLabel,
  tone,
  confirming,
  error,
  typedConfirmation,
  typed,
  onTypedChange,
  matches,
  onConfirm,
}: {
  mode: "live" | "static";
  title: string;
  description: ReactNode;
  confirmLabel: string;
  confirmingLabel?: string;
  cancelLabel: string;
  tone: ConfirmTone;
  confirming: boolean;
  error?: ReactNode;
  typedConfirmation?: string;
  typed: string;
  onTypedChange?: (value: string) => void;
  matches: boolean;
  onConfirm?: () => void;
}) {
  const inputId = useId();
  const live = mode === "live";
  const Title = live ? AlertDialog.Title : "h2";
  const typedReason = typedConfirmation ? `Type ${typedConfirmation} to confirm` : undefined;

  const cancel = (
    <Button variant="secondary" size="md" aria-disabled={confirming || undefined}>
      {cancelLabel}
    </Button>
  );

  return (
    <>
      <div className={overlayHeaderClassName}>
        <div className="min-w-0 flex-1">
          <Title className={overlayTitleClassName}>{title}</Title>
          {live ? (
            <AlertDialog.Description asChild>
              <div className={overlayDescriptionClassName}>{description}</div>
            </AlertDialog.Description>
          ) : (
            <div className={overlayDescriptionClassName}>{description}</div>
          )}
        </div>
      </div>
      {typedConfirmation || error ? (
        <div className={cn(overlayBodyClassName, "flex flex-col gap-3 pt-1")}>
          {error ? (
            <Alert tone="danger" live={live ? "assertive" : "off"} title="That didn't work">
              {error}
            </Alert>
          ) : null}
          {typedConfirmation ? (
            <div className="flex flex-col gap-1">
              <label htmlFor={inputId} className="text-sm font-medium text-fg">
                {typedReason}
              </label>
              <input
                id={inputId}
                value={typed}
                onChange={(event) => onTypedChange?.(event.target.value)}
                readOnly={!live}
                autoComplete="off"
                spellCheck={false}
                inputMode="numeric"
                className="h-control-md w-full rounded-md border border-input bg-surface px-3 text-sm text-fg transition-colors duration-fast hover:border-muted"
              />
            </div>
          ) : null}
        </div>
      ) : null}
      <div className={overlayFooterClassName}>
        {live ? <AlertDialog.Cancel asChild>{cancel}</AlertDialog.Cancel> : cancel}
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          size="md"
          loading={confirming}
          loadingLabel={confirmingLabel}
          disabledReason={matches ? undefined : typedReason}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </>
  );
}
