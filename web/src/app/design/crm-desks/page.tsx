import type { Metadata } from "next";
import { GalleryPage } from "../_gallery";

export const metadata: Metadata = { title: "Import and desks" };

// Stub: the builder of this section replaces it with every variant and state of its components.
export default function Page() {
  return (
    <GalleryPage
      title="Import and desks"
      description="Import and merge, and the payment and privacy desks (components.md, group 3, sections F and H). Specimens arrive with the components."
    />
  );
}
