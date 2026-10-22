import type { Metadata } from "next";
import { GalleryPage } from "../_gallery";

export const metadata: Metadata = { title: "Builders and settings" };

// Stub: the builder of this section replaces it with every variant and state of its components.
export default function Page() {
  return (
    <GalleryPage
      title="Builders and settings"
      description="The automation builder and the settings editors, each with a path that needs no dragging (components.md, group 3, section D). Specimens arrive with the components."
    />
  );
}
