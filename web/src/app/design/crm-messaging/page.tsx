import type { Metadata } from "next";
import { GalleryPage } from "../_gallery";

export const metadata: Metadata = { title: "Calls and messaging" };

// Stub: the builder of this section replaces it with every variant and state of its components.
export default function Page() {
  return (
    <GalleryPage
      title="Calls and messaging"
      description="Calls, the message composer, templates, the WhatsApp inbox and its checks (components.md, group 3, section C). Specimens arrive with the components."
    />
  );
}
