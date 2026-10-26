"use client";

import { createContext, type ReactNode, useContext } from "react";

/**
 * Where portalled overlays (Dialog, ConfirmDialog, Drawer) mount. In the app this is undefined, so
 * Radix portals into <body>. A framed preview (the /design gallery's AppShell frames) provides an
 * element inside the frame, so a drawer opened in the frame stays inside it. The frame gives that
 * element a transform, which makes it the containing block for the overlay's fixed position.
 */
const PortalContainerContext = createContext<HTMLElement | null>(null);

export function PortalContainerProvider({ container, children }: { container: HTMLElement | null; children: ReactNode }) {
  return <PortalContainerContext.Provider value={container}>{children}</PortalContainerContext.Provider>;
}

/** The element overlays portal into, or undefined for <body>. */
export function usePortalContainer(): HTMLElement | undefined {
  return useContext(PortalContainerContext) ?? undefined;
}
