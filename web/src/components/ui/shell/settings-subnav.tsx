"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/overlays/popover";
import { cn } from "@/lib/cn";
import { SETTINGS_SECTIONS, type SettingsSection, activeNavState } from "./nav-items";
import { navItemActiveClassName, navItemClassName } from "./sidebar";

export type SettingsSubnavProps = {
  sections?: SettingsSection[];
  currentPath: string;
  /**
   * column: the second column (w-subnav, 240 px) inside the Settings layout at lg and up.
   * popover: below lg, a "Settings section" button above the page header that opens the same links.
   */
  form: "column" | "popover";
  onNavigate?: (href: string) => void;
  prefetch?: boolean;
  /** Visibility follows the shell's width; "always" shows the form at any width (documentation). */
  visibility?: "responsive" | "always";
};

/**
 * The Settings area's second-level navigation (components.md, Sidebar: settings subnav). Same item
 * style as the Sidebar, no icons, aria-label="Settings"; the current section has
 * aria-current="page". In the popover form nothing navigates until a link is chosen (3.2.2).
 */
export function SettingsSubnav({
  sections = SETTINGS_SECTIONS,
  currentPath,
  form,
  onNavigate,
  prefetch,
  visibility = "responsive",
}: SettingsSubnavProps) {
  const hrefs = sections.map((section) => section.href);
  const links = (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {sections.map((section) => {
        const current = activeNavState(section.href, currentPath, hrefs);
        return (
          <li key={section.href} className="flex">
            <Link
              href={section.href}
              prefetch={prefetch}
              aria-current={current}
              onNavigate={
                onNavigate
                  ? (event) => {
                      event.preventDefault();
                      onNavigate(section.href);
                    }
                  : undefined
              }
              className={cn(navItemClassName, "min-w-0 flex-1 px-2", form === "popover" && "mx-0", current && navItemActiveClassName)}
            >
              <span className="min-w-0 flex-1 truncate pt-0.5 pb-1">{section.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  if (form === "column") {
    return (
      <nav
        aria-label="Settings"
        className={cn(
          "sticky top-header h-[calc(var(--shell-vh,100dvh)-var(--layout-header))] w-subnav shrink-0 flex-col self-start overflow-y-auto border-r border-border bg-surface py-2",
          visibility === "always" ? "flex" : "hidden @5xl/shell:flex",
        )}
      >
        {links}
      </nav>
    );
  }

  return (
    <div className={visibility === "always" ? undefined : "@5xl/shell:hidden"}>
      <Popover
        size="sm"
        variant="list"
        aria-label="Settings sections"
        trigger={
          <Button variant="secondary" size="sm" menu>
            Settings section
          </Button>
        }
      >
        {links}
      </Popover>
    </div>
  );
}
