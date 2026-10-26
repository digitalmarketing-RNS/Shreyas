/**
 * The /design gallery's sections, in nav order. The layout's nav and the Playwright suite
 * (e2e/design.spec.ts) both read this list, so a new section is added here once.
 * `slug` names the screenshots: <slug>-<theme>-<width>.png.
 */
export type GallerySection = {
  href: string;
  slug: string;
  title: string;
  group: "Foundations" | "Components" | "CRM" | "Public";
};

export const GALLERY_SECTIONS = [
  { href: "/design", slug: "design", title: "Tokens", group: "Foundations" },
  { href: "/design/forms", slug: "design-forms", title: "Forms", group: "Components" },
  { href: "/design/shell", slug: "design-shell", title: "Shell and navigation", group: "Components" },
  { href: "/design/overlays", slug: "design-overlays", title: "Overlays", group: "Components" },
  { href: "/design/feedback", slug: "design-feedback", title: "Feedback", group: "Components" },
  { href: "/design/display", slug: "design-display", title: "Display", group: "Components" },
  { href: "/design/crm-leads", slug: "design-crm-leads", title: "Leads and profile", group: "CRM" },
  { href: "/design/crm-messaging", slug: "design-crm-messaging", title: "Calls and messaging", group: "CRM" },
  { href: "/design/crm-builders", slug: "design-crm-builders", title: "Builders and settings", group: "CRM" },
  { href: "/design/crm-reports", slug: "design-crm-reports", title: "Calendar and reports", group: "CRM" },
  { href: "/design/crm-desks", slug: "design-crm-desks", title: "Import and desks", group: "CRM" },
  { href: "/design/public", slug: "design-public", title: "Public pages", group: "Public" },
] as const satisfies readonly GallerySection[];

export const GALLERY_GROUPS = ["Foundations", "Components", "CRM", "Public"] as const;
