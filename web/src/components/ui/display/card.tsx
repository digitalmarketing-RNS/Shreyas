import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * - plain (default): border, no shadow, on the page canvas (bg-bg).
 * - standalone: adds shadow-card; one card alone on bg-bg (S03 sign-in, the S04 check-in card).
 * - flush: the body has no padding, for a DataTable or a list that runs edge to edge.
 * - interactive: the whole card opens one place. With a title, the title link's ::after covers
 *   the card; without one (KpiTile), the whole card is one <a> with a written-out name (`label`).
 */
export type CardVariant = "plain" | "standalone" | "flush" | "interactive";

export type CardProps = {
  variant?: CardVariant;
  /** A noun: "Follow-ups due today", "Fees collected". A real heading. */
  title?: ReactNode;
  /** h2, or h3 under a section heading. */
  titleLevel?: 2 | 3 | 4;
  description?: ReactNode;
  /** Header actions at the right (not in the interactive variant: the covering link would hide them). */
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  /** p-4 by default; p-5 for the profile header and form sections from lg; p-6 for the sign-in card. */
  padding?: 4 | 5 | 6;
  /** Interactive: where the card goes. */
  href?: string;
  /** Interactive without a title: the card link's accessible name ("Leads this week: 1,240. Open report"). */
  label?: string;
  /** Render a <section aria-labelledby> (only for the few main parts of a page). */
  asSection?: boolean;
  id?: string;
  className?: string;
};

const PADDING = { 4: "p-4", 5: "p-5", 6: "p-6" } as const;

/**
 * A bordered box that groups one piece of a page (components.md, Card). Cards are never on
 * surface-subtle and never inside another card. Never role="button": apart from the interactive
 * variant the card is not clickable as a whole.
 */
export function Card({
  variant = "plain",
  title,
  titleLevel = 2,
  description,
  actions,
  footer,
  children,
  padding = 4,
  href,
  label,
  asSection = false,
  id,
  className,
}: CardProps) {
  const Heading = `h${titleLevel}` as const;
  const titleId = id ? `${id}-title` : undefined;
  const flush = variant === "flush";
  const interactive = variant === "interactive" && href;
  const pad = PADDING[padding];

  const frame = cn(
    "relative min-w-0 rounded-lg border border-border bg-surface text-fg",
    variant === "standalone" && "shadow-card",
    flush && "overflow-hidden",
    interactive && "transition-colors duration-fast hover:border-strong",
    interactive && title && "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus-ring has-[a:focus-visible]:outline-solid",
    !flush && pad,
    className,
  );

  if (interactive && !title) {
    return (
      <Link id={id} href={href} aria-label={label} className={cn(frame, "block")}>
        {children}
      </Link>
    );
  }

  const header =
    title || description || actions ? (
      <div className={cn("flex flex-wrap items-start gap-2", flush ? cn("border-b border-border", pad) : "mb-3")}>
        <div className="min-w-0 flex-1">
          {title ? (
            <Heading id={titleId} className="m-0 text-md text-fg">
              {interactive ? (
                <Link
                  href={href}
                  className="focus-visible:outline-hidden after:absolute after:inset-0 after:rounded-lg after:content-['']"
                >
                  {title}
                </Link>
              ) : (
                title
              )}
            </Heading>
          ) : null}
          {description ? <p className="mt-0.5 mb-0 text-sm text-muted">{description}</p> : null}
        </div>
        {actions && !interactive ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    ) : null;

  const Root = asSection ? "section" : "div";
  return (
    <Root id={id} aria-labelledby={asSection && titleId ? titleId : undefined} className={frame}>
      {header}
      {children}
      {footer ? <div className={cn("border-t border-border", flush ? pad : "mt-4 pt-3")}>{footer}</div> : null}
    </Root>
  );
}
