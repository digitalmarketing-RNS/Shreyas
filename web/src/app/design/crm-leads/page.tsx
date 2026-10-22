import type { Metadata } from "next";
import { GalleryPage } from "../_gallery";

export const metadata: Metadata = { title: "Leads and profile" };

// Stub: the builder of this section replaces it with every variant and state of its components.
export default function Page() {
  return (
    <GalleryPage
      title="Leads and profile"
      description="The lead table and its tools, stages, the admission journey, the lead profile and the timeline (components.md, group 3, sections A and B). Specimens arrive with the components."
    />
  );
}
