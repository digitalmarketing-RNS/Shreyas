import type { Metadata } from "next";
import { GalleryPage } from "../_gallery";

export const metadata: Metadata = { title: "Display" };

// Stub: the builder of this section replaces it with every variant and state of its components.
export default function Page() {
  return (
    <GalleryPage
      title="Display"
      description="Card, DescriptionList, Stepper, Avatar, AvatarGroup, Badge, StatusPill, MaskedValue and the formatters Money, NumberText, DateText, RelativeTime and PhoneText (components.md, group 2). Specimens arrive with the components."
    />
  );
}
