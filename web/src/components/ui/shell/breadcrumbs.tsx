"use client";

import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";
import Link from "next/link";
import { IconButton } from "@/components/ui/icon-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/overlays/dropdown-menu";
import { Tooltip } from "@/components/ui/overlays/tooltip";
import { cn } from "@/lib/cn";

export type Crumb = {
  label: string;
  /** Ancestors link; the current page (last) is plain text. */
  href?: string;
  /** A user-entered name (a lead's): dir="auto". */
  userEntered?: boolean;
};

export type BreadcrumbsProps = {
  items: Crumb[];
  /** responsive (default): full from md, the parent as a back link below md. */
  form?: "responsive" | "full" | "back";
  onNavigate?: (href: string) => void;
  className?: string;
};

/** Labels longer than this may truncate at max-w-48 and get a Tooltip with the full text. */
const LONG_LABEL = 22;

/**
 * Where a detail or settings page sits, with a one-step way back up (components.md, Breadcrumbs).
 * <nav aria-label="Breadcrumb"> > <ol>; the last item has aria-current="page" and is not focusable.
 * More than 4 items: the middle ones collapse into an IconButton that opens a menu of the hidden
 * levels ("Show 2 more levels"). Below md only the parent shows, as "‹ Leads" with sr-only "Back to ".
 */
export function Breadcrumbs({ items, form = "responsive", onNavigate, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  const collapse = items.length > 4;
  const hidden = collapse ? items.slice(1, items.length - 2) : [];
  const visible = collapse ? [items[0], null, ...items.slice(items.length - 2)] : items;
  const parent = items.length > 1 ? items[items.length - 2] : null;

  const linkProps = (href: string) => ({
    href,
    onNavigate: onNavigate
      ? (event: { preventDefault: () => void }) => {
          event.preventDefault();
          onNavigate(href);
        }
      : undefined,
  });

  return (
    <nav aria-label="Breadcrumb" className={className}>
      {form !== "back" ? (
        <ol className={cn("m-0 flex list-none flex-wrap items-center gap-1 p-0 text-sm", form === "responsive" && "hidden md:flex")}>
          {visible.map((item, index) => {
            const last = index === visible.length - 1;
            return (
              <li key={item ? `${item.label}-${index}` : "collapsed"} className="flex min-h-hit min-w-0 items-center gap-1">
                {item === null ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <IconButton
                        icon={<Ellipsis />}
                        aria-label={`Show ${hidden.length} more ${hidden.length === 1 ? "level" : "levels"}`}
                        size="xs"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {hidden.map((crumb) => (
                        <DropdownMenuItem key={crumb.label} asChild>
                          <Link {...linkProps(crumb.href ?? "#")} dir={crumb.userEntered ? "auto" : undefined}>
                            <span className="truncate pt-0.5 pb-1">{crumb.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : last || !item.href ? (
                  <CrumbLabel crumb={item} current={last} />
                ) : (
                  <CrumbLink crumb={item} linkProps={linkProps(item.href)} />
                )}
                {!last ? <ChevronRight aria-hidden="true" className="size-icon-sm shrink-0 text-muted" /> : null}
              </li>
            );
          })}
        </ol>
      ) : null}
      {form !== "full" && parent?.href ? (
        <Link
          {...linkProps(parent.href)}
          className={cn(
            "inline-flex min-h-hit items-center gap-1 rounded-sm text-sm text-muted hover:text-fg hover:underline hover:underline-offset-2",
            form === "responsive" && "md:hidden",
          )}
        >
          <ChevronLeft aria-hidden="true" className="size-icon-sm" />
          <span className="sr-only">Back to </span>
          <span dir={parent.userEntered ? "auto" : undefined}>{parent.label}</span>
        </Link>
      ) : null}
    </nav>
  );
}

function CrumbLabel({ crumb, current }: { crumb: Crumb; current: boolean }) {
  const label = (
    <span
      aria-current={current ? "page" : undefined}
      dir={crumb.userEntered ? "auto" : undefined}
      className={cn("max-w-48 truncate pt-0.5 pb-1", current ? "font-medium text-fg" : "text-muted")}
    >
      {crumb.label}
    </span>
  );
  if (crumb.label.length <= LONG_LABEL) return label;
  return <Tooltip content={crumb.label}>{label}</Tooltip>;
}

function CrumbLink({ crumb, linkProps }: { crumb: Crumb; linkProps: { href: string; onNavigate?: (event: { preventDefault: () => void }) => void } }) {
  const link = (
    <Link
      {...linkProps}
      dir={crumb.userEntered ? "auto" : undefined}
      className="block max-w-48 truncate rounded-sm pt-0.5 pb-1 text-muted hover:text-fg hover:underline hover:underline-offset-2"
    >
      {crumb.label}
    </Link>
  );
  if (crumb.label.length <= LONG_LABEL) return link;
  return <Tooltip content={crumb.label}>{link}</Tooltip>;
}
