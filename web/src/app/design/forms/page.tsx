import type { Metadata } from "next";
import { GalleryPage } from "../_gallery";
import { ButtonSpecimens, IconButtonSpecimens } from "../_gallery/button-specimens";

export const metadata: Metadata = { title: "Forms" };

// The forms builder adds the other group 1 components below; keep the Button and IconButton
// specimens (they come from the setup step).
export default function Page() {
  return (
    <GalleryPage
      title="Forms"
      description="Buttons, form controls, the field wrapper, form layout, consent capture, copy and secret patterns, and the small primitives (components.md, group 1)."
    >
      <ButtonSpecimens />
      <IconButtonSpecimens />
    </GalleryPage>
  );
}
