import { ExternalLink } from "lucide-react";
import NextLink from "next/link";
import type { AnchorHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/cn";

export type LinkVariant = "inline" | "standalone" | "muted";

export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  /** inline (inside a sentence, default); standalone (its own line, 24 px target); muted (breadcrumbs and meta lines). */
  variant?: LinkVariant;
  /** Opens in a new tab: the ExternalLink icon and sr-only " (opens in a new tab)". */
  external?: boolean;
  /** The current page: aria-current="page", text-fg, no underline. */
  current?: boolean;
  /** Public pages: standalone links get a 44 px target. */
  surface?: "staff" | "public";
  children: ReactNode;
  ref?: Ref<HTMLAnchorElement>;
};

/** The link look, for elements that cannot use <Link> (a summary, a Radix Slot). */
export function linkVariants({
  variant = "inline",
  current = false,
  surface = "staff",
}: { variant?: LinkVariant; current?: boolean; surface?: "staff" | "public" } = {}): string {
  return cn(
    "rounded-xs",
    current
      ? "text-fg no-underline"
      : variant === "muted"
        ? "text-muted underline-offset-2 hover:text-fg hover:underline"
        : // The colour does not change on hover, so a link works on every surface with an accent pair.
          "text-accent underline decoration-1 underline-offset-2 hover:decoration-2",
    variant === "standalone" && cn("inline-flex items-center gap-1", surface === "public" ? "min-h-hit-public" : "min-h-hit"),
  );
}

/**
 * Text that navigates (components.md Link): inside a sentence, on its own line, or to another site.
 * App routes ("/…") render through Next <Link>; everything else is a plain <a href>. Underlined by
 * default, so a link is never shown by colour alone. Visited links do not change. Something that
 * acts like a button but looks like a link is Button variant="link", never an <a> without href.
 */
export function Link({
  href,
  variant = "inline",
  external = false,
  current = false,
  surface = "staff",
  className,
  children,
  ref,
  ...rest
}: LinkProps) {
  const classes = cn(linkVariants({ variant, current, surface }), external && "inline-flex items-center gap-1", className);
  const content = (
    <>
      {children}
      {external ? (
        <>
          <ExternalLink aria-hidden="true" className="size-icon-sm shrink-0" />
          <span className="sr-only"> (opens in a new tab)</span>
        </>
      ) : null}
    </>
  );
  const shared = {
    ...rest,
    ref,
    className: classes,
    "aria-current": current ? ("page" as const) : rest["aria-current"],
  };
  if (external) {
    return (
      <a {...shared} href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  if (href.startsWith("/")) {
    return (
      <NextLink {...shared} href={href}>
        {content}
      </NextLink>
    );
  }
  return (
    <a {...shared} href={href}>
      {content}
    </a>
  );
}
