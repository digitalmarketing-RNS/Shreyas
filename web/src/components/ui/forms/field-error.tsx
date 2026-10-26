import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { FieldSurface } from "./field-context";

/**
 * The error line under a control: CircleAlert and the message in text-danger font-medium, read as
 * "Error: …". Used by Field and FieldGroup; components that lay out their own parts use it too.
 */
export function FieldError({ id, message, surface = "staff" }: { id: string; message: ReactNode; surface?: FieldSurface }) {
  const isPublic = surface === "public";
  return (
    <p id={id} className={cn("m-0 flex items-start gap-1 font-medium text-danger", isPublic ? "mt-2 text-sm" : "mt-1 text-xs")}>
      <CircleAlert aria-hidden="true" className={cn("size-icon-sm shrink-0", isPublic ? "mt-0.5" : "mt-px")} />
      <span>
        <span className="sr-only">Error: </span>
        {message}
      </span>
    </p>
  );
}
