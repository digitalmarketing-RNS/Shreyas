"use client";

import { Dialog } from "radix-ui";
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

/**
 * Session expired (components.md, AppShell states): a Dialog that cannot be dismissed sits over the
 * page without unmounting it. "Sign in again" opens sign-in in a new tab; when this tab regains
 * focus with a valid session, the shell closes the dialog and what the person typed is still there.
 * Nothing is written to browser storage (staff share college PCs).
 */
export function SessionExpiredDialog({ open, signInHref = "/login" }: { open: boolean; signInHref?: string }) {
  const container = usePortalContainer();
  return (
    <Dialog.Root open={open}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className={overlayScrimClassName} />
        <Dialog.Content
          className={`${overlayPanelBaseClassName} ${dialogPositionClassName} max-w-dialog-sm`}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className={overlayHeaderClassName}>
            <div className="min-w-0 flex-1">
              <Dialog.Title className={overlayTitleClassName}>You&apos;ve been signed out</Dialog.Title>
              <Dialog.Description className={overlayDescriptionClassName}>
                For your security we sign you out after a period without activity. Sign in again in the new tab, then come back
                here. What you typed is kept.
              </Dialog.Description>
            </div>
          </div>
          <div className={overlayFooterClassName}>
            <Button asChild variant="primary" size="md" external>
              <a href={signInHref} target="_blank" rel="noreferrer">
                Sign in again
              </a>
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
