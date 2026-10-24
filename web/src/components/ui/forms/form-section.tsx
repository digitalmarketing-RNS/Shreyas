import { type ReactNode, useId } from "react";
import { cn } from "@/lib/cn";

export type FormSectionProps = {
  /** "Contact details". A text-md heading; the page's h1 sits above it. */
  title: ReactNode;
  description?: ReactNode;
  /** h2 on a page, h3 inside a section of a page. */
  headingLevel?: 2 | 3;
  surface?: "staff" | "public";
  className?: string;
  children: ReactNode;
};

/**
 * One section of a form (components.md FormLayout): <section aria-labelledby> with a text-md
 * heading, 16 px to the first field, fields 16 px apart (24 px on public pages). Sections sit 32 px
 * apart. When the fields answer one question, use FieldGroup (fieldset and legend) instead.
 * Two columns only from md up and only for short paired fields: wrap the pair in
 * <div className="grid gap-4 md:grid-cols-2">.
 */
export function FormSection({ title, description, headingLevel = 2, surface = "staff", className, children }: FormSectionProps) {
  const id = useId();
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section aria-labelledby={id} className={cn("flex flex-col", className)}>
      <Heading id={id} className="m-0 text-md text-fg">
        {title}
      </Heading>
      {description ? <p className={cn("m-0 mt-1 text-muted", surface === "public" ? "text-base" : "text-sm")}>{description}</p> : null}
      <div className={cn("mt-4 flex flex-col", surface === "public" ? "gap-6" : "gap-4")}>{children}</div>
    </section>
  );
}
