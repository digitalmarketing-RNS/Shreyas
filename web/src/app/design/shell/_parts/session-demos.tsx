"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { IdleWarningDialog } from "@/components/ui/shell/idle-warning-dialog";
import { OrgChangedDialog } from "@/components/ui/shell/org-changed-dialog";
import { SessionExpiredDialog } from "@/components/ui/shell/session-expired-dialog";

/** Live triggers for the three session dialogs; in the app a session hook opens them. */
export function SessionDialogDemos() {
  const [open, setOpen] = useState<"idle" | "expired" | "org" | null>(null);

  // The session-expired dialog closes when this tab regains focus with a valid session; the demo
  // treats any return to the tab as valid, and closes on its own after 8 s.
  useEffect(() => {
    if (open !== "expired") return;
    const close = () => setOpen(null);
    window.addEventListener("focus", close);
    const timer = window.setTimeout(close, 8000);
    return () => {
      window.removeEventListener("focus", close);
      window.clearTimeout(timer);
    };
  }, [open]);

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => setOpen("idle")}>
        Show the idle warning
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setOpen("expired")}>
        Show “signed out” (closes after 8 s)
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setOpen("org")}>
        Show the other-tab switch
      </Button>
      <IdleWarningDialog open={open === "idle"} idleMinutes={30} signOutAt="4:32 pm" onStay={() => setOpen(null)} onSignOut={() => setOpen(null)} />
      <SessionExpiredDialog open={open === "expired"} />
      <OrgChangedDialog open={open === "org"} shownOrg="Lakeview College" sessionOrg="Lakeview Public School" onReload={() => setOpen(null)} />
    </div>
  );
}
