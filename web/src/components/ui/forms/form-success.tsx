"use client";

import { CircleCheck } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * The public form's success message (components.md FormLayout): it replaces the form, has
 * tabindex="-1" and takes focus, so it is read once. The default S01 words, used when the
 * institution sets none: "Thank you. {Institution} has your enquiry and will contact you soon."
 */
export function FormSuccess({
  institution,
  children,
  focusOnMount = true,
  className,
}: {
  institution: string;
  /** The institution's own success message, when it set one. */
  children?: ReactNode;
  focusOnMount?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (focusOnMount) ref.current?.focus();
  }, [focusOnMount]);
  return (
    <div ref={ref} tabIndex={-1} className={cn("flex items-start gap-3 rounded-md text-base text-fg", className)}>
      <CircleCheck aria-hidden="true" className="mt-0.5 size-icon-lg shrink-0 text-success" />
      <div className="flex flex-col gap-1">{children ?? <p className="m-0">Thank you. {institution} has your enquiry and will contact you soon.</p>}</div>
    </div>
  );
}
