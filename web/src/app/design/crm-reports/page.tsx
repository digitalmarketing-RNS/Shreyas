import type { Metadata } from "next";
import { GalleryPage } from "../_gallery";

export const metadata: Metadata = { title: "Calendar and reports" };

// Stub: the builder of this section replaces it with every variant and state of its components.
export default function Page() {
  return (
    <GalleryPage
      title="Calendar and reports"
      description="The calendar, chart frame, KPI tiles, charts with table views, the pivot table and dashboards (components.md, group 3, section E). Specimens arrive with the components."
    />
  );
}
