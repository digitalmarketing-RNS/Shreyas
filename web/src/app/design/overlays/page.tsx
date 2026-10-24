import type { Metadata } from "next";
import { Toaster } from "@/components/ui/feedback/toaster";
import { GalleryPage, Section } from "../_gallery";
import { KeyboardNotes } from "../shell/_kit/keyboard-notes";
import { ConfirmLiveSpecimens, ConfirmStaticSpecimens, DialogLiveSpecimens, DialogStaticSpecimens } from "./_parts/dialog-specimens";
import {
  DrawerLiveSpecimens,
  DrawerStaticSpecimens,
  MenuLiveSpecimens,
  MenuStaticSpecimens,
  PopoverLiveSpecimens,
  PopoverStaticSpecimens,
  TooltipSpecimens,
} from "./_parts/panel-specimens";

export const metadata: Metadata = { title: "Overlays" };

export default function Page() {
  return (
    <GalleryPage
      title="Overlays"
      description="Dialogs, drawers, popovers, menus and tooltips (components.md, group 2: Overlays). Each block has live examples to open, and still drawings of every state (drawn in place, inert)."
    >
      <Toaster>
        <div className="flex flex-col gap-8">
          <div className="max-w-form rounded-lg border border-border bg-surface p-4 text-sm leading-prose text-muted">
            <p className="m-0 font-semibold text-fg">Which overlay to use</p>
            <ul className="m-0 mt-1 list-disc pl-5">
              <li>Tooltip: a short, non-interactive hint for something already labelled. Never the only place for information a task needs.</li>
              <li>Popover: small interactive content tied to a trigger that does not block the page.</li>
              <li>DropdownMenu: a list of actions or choices. No forms inside.</li>
              <li>Dialog: a focused task with a form or a decision. Blocks the page.</li>
              <li>ConfirmDialog: a yes-or-no before something destructive or hard to undo.</li>
              <li>Drawer: a side panel for secondary detail or filters that benefits from height.</li>
            </ul>
          </div>

          <Section id="dialog" title="Dialog" description="A focused task over the page, with a form, a clear way out, and safe handling of errors and unsaved input. Sizes sm 400, md 560, lg 800 px; md and lg become a full-screen sheet below sm.">
            <DialogLiveSpecimens />
            <DialogStaticSpecimens />
            <KeyboardNotes
              items={[
                ["Open", "Focus moves to the first field (or the first invalid one), never to the close button."],
                ["Tab / Shift+Tab", "Cycle inside the panel."],
                ["Esc", "Closes, with the dirty check (“Discard your changes?”)."],
                ["Enter", "In a single-line field, submits."],
                ["Close", "Focus returns to the trigger."],
              ]}
            />
          </Section>

          <Section id="confirm-dialog" title="ConfirmDialog" description="A clear yes or no before an action that deletes, stops, overwrites or is hard to undo. Confirm labels repeat the verb and object, never “OK”.">
            <ConfirmLiveSpecimens />
            <ConfirmStaticSpecimens />
            <KeyboardNotes
              items={[
                ["Open", "Focus starts on Cancel (Radix AlertDialog), so Enter alone never destroys."],
                ["Tab", "Moves to the confirm button."],
                ["Esc", "Cancels. The overlay does not close it."],
              ]}
            />
          </Section>

          <Section id="drawer" title="Drawer" description="A side panel for filters, secondary detail or a tree. Always modal; sm 400, md 560, lg 720 px; full width below sm; square edges.">
            <DrawerLiveSpecimens />
            <DrawerStaticSpecimens />
            <KeyboardNotes
              items={[
                ["Open", "Focus goes to the first control (filters) or the title container (detail)."],
                ["Tab", "Is trapped inside."],
                ["Esc", "Closes, with the dirty check."],
                ["Close", "Focus returns to the trigger."],
              ]}
            />
          </Section>

          <Section id="popover" title="Popover" description="Small interactive content anchored to a trigger: lists, a few fields, a short explanation with a link. Modal, so focus never escapes to the end of the page. No arrow.">
            <PopoverLiveSpecimens />
            <PopoverStaticSpecimens />
            <KeyboardNotes
              items={[
                ["Enter or Space", "On the trigger: opens and moves focus to the first control (or the heading container)."],
                ["Tab / Shift+Tab", "Cycle inside the popover."],
                ["Esc, click outside, Close, Apply", "Close it and return focus to the trigger."],
              ]}
            />
          </Section>

          <Section id="dropdown-menu" title="DropdownMenu" description="A short list of actions or choices. Destructive items sit last after a separator and always open a ConfirmDialog. Unavailable items stay reachable and give their reason.">
            <MenuLiveSpecimens />
            <MenuStaticSpecimens />
            <KeyboardNotes
              items={[
                ["Enter, Space or Down", "Opens on the first item; Up opens on the last."],
                ["Up / Down", "Move, wrapping; Home and End jump; typing jumps by label."],
                ["Enter or Space", "Activates; Space toggles a checkbox item without closing."],
                ["Right / Left", "Open and close a submenu."],
                ["Esc", "Closes and returns focus to the trigger. Tab closes the menu and moves on."],
              ]}
            />
          </Section>

          <Section id="tooltip" title="Tooltip" description="A short text hint on hover and keyboard focus. It stays while the pointer is over it, until dismissed (1.4.13).">
            <TooltipSpecimens />
            <KeyboardNotes
              items={[
                ["Focus", "Opens at once when its trigger gets keyboard focus; closes on blur."],
                ["Esc", "Closes it and keeps focus on the trigger."],
              ]}
            />
          </Section>
        </div>
      </Toaster>
    </GalleryPage>
  );
}
