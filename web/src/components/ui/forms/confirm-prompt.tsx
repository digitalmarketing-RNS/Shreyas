"use client";

import { AlertDialog } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { buttonVariants } from "../button";

/**
 * The yes-or-no question some group 1 controls ask before they act: Switch "with confirmation",
 * SecretReveal "Close without copying?" and Combobox "clear all" above 10 values. It follows the
 * ConfirmDialog spec (group 2): Radix AlertDialog, max-w-dialog-sm, focus starts on the cancel
 * button so Enter alone never destroys, Esc cancels, the overlay does not close it. When group 2's
 * ConfirmDialog lands, these controls can use it instead.
 */
export function ConfirmPrompt({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-(--z-overlay) bg-overlay data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <AlertDialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-(--z-modal) flex w-[calc(100vw-2rem)] max-w-dialog-sm -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-border bg-surface-raised text-fg shadow-modal",
            "data-[state=closed]:animate-fade-out data-[state=open]:motion-safe:animate-rise-in data-[state=open]:motion-reduce:animate-fade-in",
          )}
        >
          <div className="flex flex-col gap-1 px-5 pt-5 pb-3">
            <AlertDialog.Title className="m-0 text-md text-fg">{title}</AlertDialog.Title>
            <AlertDialog.Description className="m-0 text-sm text-muted">{description}</AlertDialog.Description>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">
            <AlertDialog.Cancel className={buttonVariants({ variant: "secondary", size: "md" })}>{cancelLabel}</AlertDialog.Cancel>
            <AlertDialog.Action
              className={buttonVariants({ variant: destructive ? "danger" : "primary", size: "md" })}
              onClick={onConfirm}
            >
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
