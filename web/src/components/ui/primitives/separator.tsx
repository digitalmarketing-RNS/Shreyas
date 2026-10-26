import { Separator as RadixSeparator } from "radix-ui";
import { cn } from "@/lib/cn";

export type SeparatorProps = {
  /** horizontal (default, <hr>) or vertical (toolbar groups: w-px self-stretch). */
  orientation?: "horizontal" | "vertical";
  /** A centred word between two lines: "or" on the sign-in page. */
  label?: string;
  /** A line that only decorates one group is hidden from assistive tech. */
  decorative?: boolean;
  className?: string;
};

/**
 * A thin line between groups (components.md Separator): bg-border, h-px or w-px, no border
 * utility. The parent sets the spacing (my-1 in menus, my-4 in cards). Meaning never depends on a
 * line. Menus and toolbars use Radix's own Separator parts, which set role="separator".
 */
export function Separator({ orientation = "horizontal", label, decorative = false, className }: SeparatorProps) {
  if (label) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted">{label}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
    );
  }
  if (orientation === "horizontal" && !decorative) {
    return <hr className={cn("m-0 h-px w-full shrink-0 border-0 bg-border", className)} />;
  }
  return (
    <RadixSeparator.Root
      orientation={orientation}
      decorative={decorative}
      className={cn("shrink-0 bg-border", orientation === "vertical" ? "w-px self-stretch" : "h-px w-full", className)}
    />
  );
}
