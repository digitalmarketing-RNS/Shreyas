import { cn } from "@/lib/cn";

/**
 * Lets keyboard and screen-reader users jump past the header and sidebar to the page content
 * (components.md, SkipLink). The first focusable element in <body>: hidden off-screen (sr-only, so
 * it stays in the tab order), visible on focus. Its target is <main id="main" tabindex="-1">, so the
 * browser moves focus, not only the scroll position. Public pages and sign-in point it at their
 * form's first heading ("Skip to the form"); S05 adds a second link "Skip to filters".
 */
export function SkipLink({
  href = "#main",
  children = "Skip to main content",
  className,
}: {
  href?: string;
  children?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only z-(--z-skiplink) rounded-md bg-accent px-4 text-sm font-medium text-on-accent shadow-pop",
        "focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:inline-flex focus:h-control-md focus:items-center",
        className,
      )}
    >
      {children}
    </a>
  );
}
