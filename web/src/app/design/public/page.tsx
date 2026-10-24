import type { Metadata } from "next";
import { ForceLightTheme } from "@/components/theme/force-light-theme";
import { GalleryPage } from "../_gallery";

export const metadata: Metadata = { title: "Public pages" };

// Stub: the builder of this section replaces it with framed previews of the public pages.
export default function Page() {
  return (
    <>
      {/* Public pages are light only (decisions.md sections 4 and 6), so this section stays light too. */}
      <ForceLightTheme />
      <GalleryPage
        title="Public pages"
        description="The enquiry form, payment page, guardian consent, privacy requests and sign-in (components.md, group 3, section G). They use system fonts, 16 px text, 48 px controls and the light theme only. Specimens arrive with the components."
      />
    </>
  );
}
