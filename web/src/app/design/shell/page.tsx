import type { Metadata } from "next";
import { GalleryPage } from "../_gallery";

export const metadata: Metadata = { title: "Shell and navigation" };

// Stub: the builder of this section replaces it with every variant and state of its components.
export default function Page() {
  return (
    <GalleryPage
      title="Shell and navigation"
      description="AppShell, SkipLink, Sidebar, AppHeader, OrgSwitcher, UserMenu, CheckInToggle, NotificationBell, NotificationFeed, PageHeader, Breadcrumbs, Tabs and Pagination (components.md, group 2). Specimens arrive with the components."
    />
  );
}
