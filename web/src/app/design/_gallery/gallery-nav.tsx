"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { GALLERY_GROUPS, GALLERY_SECTIONS } from "./sections";

/**
 * The gallery's section links. The current page has aria-current="page", a fill and a 2 px accent
 * edge, so it is not shown by fill alone. Wide screens: a column. Phones: wrapped rows.
 */
export function GalleryNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Design system sections">
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {GALLERY_GROUPS.map((group) => (
          <li key={group} className="flex flex-col gap-1">
            <span id={`nav-group-${group}`} className="px-2 text-xs font-medium text-muted">
              {group}
            </span>
            <ul aria-labelledby={`nav-group-${group}`} className="m-0 flex list-none flex-wrap gap-1 p-0 md:flex-col md:gap-0.5">
              {GALLERY_SECTIONS.filter((section) => section.group === group).map((section) => {
                const current = pathname === section.href;
                return (
                  <li key={section.href}>
                    <Link
                      href={section.href}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "flex min-h-hit items-center rounded-sm border-l-2 px-2 py-1 text-sm transition-colors duration-fast",
                        current
                          ? "border-accent bg-accent-subtle font-medium text-fg"
                          : "border-transparent text-muted hover:bg-surface-hover hover:text-fg",
                      )}
                    >
                      {section.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
