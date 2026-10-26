"use client";

import { Eye } from "lucide-react";
import { Dialog } from "radix-ui";
import { type ReactNode, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "../button";
import { IconButton } from "../icon-button";
import { ConfirmPrompt } from "./confirm-prompt";
import { CONTROL_HEIGHT, controlBox } from "./control-styles";
import { CopyButton } from "./copy-button";
import { InlineAlert } from "./inline-alert";

export type SecretRevealProps = {
  open: boolean;
  /** Called with false once the person is done (after the "Close without copying?" check). */
  onOpenChange: (open: boolean) => void;
  /** "Your new API key". */
  title: string;
  /** "API key". */
  label: string;
  /** The secret from the create response. It lives in component state only and is dropped on close. */
  secret: string;
  /** The show toggle's name, which never changes: "Show key". */
  toggleLabel?: string;
  warning?: string;
  /** "Name: Website forms · Access: create and update leads · Created 06 Oct 2026, 2:30 pm IST". */
  details?: ReactNode;
};

/**
 * Shows a new secret exactly once, inside a dialog (components.md SecretReveal, shown once). The
 * warning is part of the dialog's description, so it is read on open; focus starts on Copy. The
 * value is a read-only password input while masked (copy still works) and text when shown. "Done"
 * (or Esc) before any Copy or Show asks "Close without copying?". The secret never goes into a URL,
 * a log, analytics, storage or a query cache.
 */
export function SecretReveal({
  open,
  onOpenChange,
  title,
  label,
  secret,
  toggleLabel = "Show key",
  warning = "Copy this key now. We only show it once. If you lose it, revoke it and create a new one.",
  details,
}: SecretRevealProps) {
  const base = useId();
  const inputId = `${base}-secret`;
  const warningId = `${base}-warning`;
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [asking, setAsking] = useState(false);
  const copyRef = useRef<HTMLSpanElement | null>(null);

  const finish = () => {
    setShown(false);
    setCopied(false);
    onOpenChange(false);
  };

  const done = () => {
    if (!copied && !shown) setAsking(true);
    else finish();
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(next) => (next ? onOpenChange(true) : done())}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-(--z-overlay) bg-overlay data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
          <Dialog.Content
            aria-describedby={warningId}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              copyRef.current?.querySelector("button")?.focus();
            }}
            onPointerDownOutside={(event) => event.preventDefault()}
            className={cn(
              "fixed z-(--z-modal) flex flex-col border border-border bg-surface-raised text-fg shadow-modal",
              "inset-0 h-dvh sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:w-[calc(100vw-2rem)] sm:max-w-dialog-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg",
              "data-[state=closed]:animate-fade-out data-[state=open]:motion-safe:animate-rise-in data-[state=open]:motion-reduce:animate-fade-in",
            )}
          >
            <div className="px-5 pt-5 pb-3">
              <Dialog.Title className="m-0 text-md text-fg">{title}</Dialog.Title>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
              <InlineAlert tone="warning" id={warningId}>
                {warning}
              </InlineAlert>
              <div className="flex flex-col gap-2">
                <label htmlFor={inputId} className="text-sm font-medium text-fg">
                  {label}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id={inputId}
                    type={shown ? "text" : "password"}
                    readOnly
                    value={secret}
                    autoComplete="off"
                    spellCheck={false}
                    autoCapitalize="off"
                    dir="ltr"
                    className={cn("min-w-0 flex-1 px-3 font-mono text-sm", CONTROL_HEIGHT.md, controlBox({ readOnly: true }))}
                  />
                  <IconButton
                    variant="secondary"
                    size="md"
                    icon={<Eye />}
                    aria-label={toggleLabel}
                    pressed={shown}
                    onPressedChange={setShown}
                    className="aria-pressed:border-accent aria-pressed:bg-accent-subtle aria-pressed:text-accent"
                  />
                  <span ref={copyRef} className="inline-flex">
                    <CopyButton
                      variant="labelled"
                      size="md"
                      text="Copy"
                      label={`Copy ${label}`}
                      thing={label}
                      value={secret}
                      sourceId={inputId}
                      onCopied={() => setCopied(true)}
                    />
                  </span>
                </div>
              </div>
              {details ? <p className="m-0 text-sm text-muted">{details}</p> : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-border bg-surface-raised px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button size="md" onClick={done}>
                Done
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <ConfirmPrompt
        open={asking}
        onOpenChange={setAsking}
        title="Close without copying?"
        description="You won't be able to see this key again."
        cancelLabel="Go back"
        confirmLabel="Close anyway"
        destructive
        onConfirm={finish}
      />
    </>
  );
}
