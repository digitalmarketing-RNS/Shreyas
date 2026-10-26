import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * One component (or token group) on a gallery page: an h2 with an anchor id, an optional intro,
 * then its specimens. Use `level={3}` for a sub-group inside a Section (one variant's states).
 *
 *   <Section id="button" title="Button" description="Variants, sizes and states.">
 *     <StateGrid>…</StateGrid>
 *   </Section>
 */
export function Section({
  id,
  title,
  description,
  level = 2,
  children,
  className,
}: {
  /** The anchor (/design/forms#button). Unique on the page. */
  id: string;
  title: string;
  description?: ReactNode;
  level?: 2 | 3;
  children?: ReactNode;
  className?: string;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("flex scroll-mt-6 flex-col gap-4", className)}>
      <div className="flex flex-col gap-1">
        <Heading id={`${id}-title`} className={level === 2 ? "text-lg text-fg" : "text-md text-fg"}>
          {title}
        </Heading>
        {description ? <div className="max-w-form text-sm leading-prose text-muted">{description}</div> : null}
      </div>
      {children}
    </section>
  );
}
