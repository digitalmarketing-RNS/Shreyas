import type { Metadata } from "next";
import { GalleryPage } from "../_gallery";

export const metadata: Metadata = { title: "Feedback" };

// Stub: the builder of this section replaces it with every variant and state of its components.
export default function Page() {
  return (
    <GalleryPage
      title="Feedback"
      description="Toast, Alert, Banner, EmptyState, Skeleton, ProgressBar, JobProgress and Spinner (components.md, group 2). Specimens arrive with the components."
    />
  );
}
