"use client";

import { AlertDialog } from "radix-ui";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  dialogPositionClassName,
  overlayDescriptionClassName,
  overlayFooterClassName,
  overlayHeaderClassName,
  overlayPanelBaseClassName,
  overlayScrimClassName,
  overlayTitleClassName,
} from "@/components/ui/overlays/overlay-styles";
import { usePortalContainer } from "@/components/ui/overlays/portal-container";

export type IdleWarningDialogProps = {
  open: boolean;
  /** The idle limit in minutes, for the body text. */
  idleMinutes: number;
  /** Static text, not a live countdown: "4:32 pm". */
  signOutAt: string;
  /** Refreshes the session; activity in any tab also extends it and closes the warning everywhere. */
  onStay: () => void;
  onSignOut: () => void;
};

/**
 * The idle warning (components.md, AppShell states; 2.2.1 Timing Adjustable): 2 minutes before the
 * idle limit a Radix AlertDialog opens with focus on "Stay signed in", which extends the session in
 * one step. Required unless the idle limit is 20 hours or more.
 */
export function IdleWarningDialog({ open, idleMinutes, signOutAt, onStay, onSignOut }: IdleWarningDialogProps) {
  const container = usePortalContainer();
  const stayRef = useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog.Root open={open}>
      <AlertDialog.Portal container={container}>
        <AlertDialog.Overlay className={overlayScrimClassName} />
        <AlertDialog.Content
          className={`${overlayPanelBaseClassName} ${dialogPositionClassName} max-w-dialog-sm`}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            stayRef.current?.focus();
          }}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            onStay();
          }}
        >
          <div className={overlayHeaderClassName}>
            <div className="min-w-0 flex-1">
              <AlertDialog.Title className={overlayTitleClassName}>You&apos;ll be signed out soon</AlertDialog.Title>
              <AlertDialog.Description className={overlayDescriptionClassName}>
                {`For your security we sign you out after ${idleMinutes} minutes without activity. You'll be signed out at ${signOutAt}.`}
              </AlertDialog.Description>
            </div>
          </div>
          <div className={overlayFooterClassName}>
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" size="md" onClick={onSignOut}>
                Sign out now
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button ref={stayRef} variant="primary" size="md" onClick={onStay}>
                Stay signed in
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
