import type { Metadata } from "next";
import Link from "next/link";
import { ThemeSwitch } from "@/components/theme/theme-switch";
import { GalleryNav } from "./_gallery/gallery-nav";

export const metadata: Metadata = {
  title: { default: "Design system", template: "%s · Design system" },
  description: "Tokens and components of the admissions CRM, with every variant and state.",
};

export default function DesignLayout({ children }: LayoutProps<"/design">) {
  return (
    <div className="min-h-dvh bg-bg md:flex">
      <a
        href="#main"
        className="sr-only z-(--z-skiplink) rounded-md bg-accent px-4 text-sm font-medium text-on-accent shadow-pop focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:inline-flex focus:h-control-md focus:items-center"
      >
        Skip to main content
      </a>
      <aside className="border-b border-border bg-surface md:sticky md:top-0 md:h-dvh md:w-sidebar md:shrink-0 md:overflow-y-auto md:border-r md:border-b-0">
        <div className="flex flex-col gap-4 px-gutter-sm py-4 md:px-3">
          <Link
            href="/design"
            className="inline-flex min-h-hit items-center self-start rounded-sm px-2 text-md text-fg"
          >
            Design system
          </Link>
          <GalleryNav />
          <ThemeSwitch className="px-2" />
        </div>
      </aside>
      <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-gutter-sm py-6 md:px-gutter md:py-8">
        <div className="mx-auto flex max-w-content flex-col gap-8">{children}</div>
      </main>
    </div>
  );
}
