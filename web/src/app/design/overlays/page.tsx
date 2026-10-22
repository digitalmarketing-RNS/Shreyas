import type { Metadata } from "next";
import { GalleryPage } from "../_gallery";

export const metadata: Metadata = { title: "Overlays" };

// Stub: the builder of this section replaces it with every variant and state of its components.
export default function Page() {
  return (
    <GalleryPage
      title="Overlays"
      description="Dialog, ConfirmDialog, Drawer, Popover, DropdownMenu and Tooltip (components.md, group 2). Specimens arrive with the components."
    />
  );
}
