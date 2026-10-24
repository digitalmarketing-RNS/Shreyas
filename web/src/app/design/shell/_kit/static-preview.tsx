import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A still drawing of an open overlay or a held state: inert, so it is not focusable and not in
 * the accessibility tree. The live version sits next to it.
 */
export function StaticPreview({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div inert className={cn("w-full min-w-0", className)}>
      {children}
    </div>
  );
}
