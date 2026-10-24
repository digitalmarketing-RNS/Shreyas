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
 * Switched institution in another tab (components.md, AppShell states): on window focus the shell
 * compares the org in the session cookie with the org this page was rendered for; if they differ,
 * this blocking Dialog explains and offers "Reload". No request is sent with the wrong
 * institution's screen showing.
 */
export function OrgChangedDialog({
  open,
  shownOrg,
  sessionOrg,
  onReload,
}: {
  open: boolean;
  /** The institution this tab shows. */
  shownOrg: string;
  /** The institution the session is now in. */
  sessionOrg: string;
  onReload: () => void;
}) {
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
              <Dialog.Title className={overlayTitleClassName}>You switched institution in another tab</Dialog.Title>
              <Dialog.Description className={overlayDescriptionClassName}>
                {`This tab still shows ${shownOrg}. Reload to continue in ${sessionOrg}.`}
              </Dialog.Description>
            </div>
          </div>
          <div className={overlayFooterClassName}>
            <Button variant="primary" size="md" onClick={onReload}>
              Reload
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
