import { cn } from "@/lib/cn";

export type SkeletonShape = "line" | "title" | "circle" | "pill" | "button" | "tile" | "card";

/** Line widths vary from 40% to 90% so lines look natural. */
export type SkeletonWidth = "40%" | "50%" | "60%" | "70%" | "75%" | "80%" | "90%" | "full";

const WIDTH: Record<SkeletonWidth, string> = {
  "40%": "w-2/5",
  "50%": "w-1/2",
  "60%": "w-3/5",
  "70%": "w-7/10",
  "75%": "w-3/4",
  "80%": "w-4/5",
  "90%": "w-9/10",
  full: "w-full",
};

const CIRCLE = { sm: "size-avatar-sm", md: "size-avatar-md", lg: "size-avatar-lg" } as const;

/** The block itself: a sunken fill that pulses; a static block under reduced motion. */
export const skeletonBlockClassName = "block bg-surface-sunken motion-safe:animate-pulse";

export type SkeletonProps = {
  shape?: SkeletonShape;
  /** line: the share of its row it covers. */
  width?: SkeletonWidth;
  /** circle: the avatar size it stands for. */
  size?: keyof typeof CIRCLE;
  /** line: the text it stands for; a 14/22 line is an h-3 block in a 22 px box, a 12/18 line h-2.5 in 18 px. */
  text?: "sm" | "xs" | "table";
  className?: string;
};

/**
 * A placeholder in the shape of content that is loading for the first time (components.md,
 * Skeleton). Decorative: aria-hidden, no contrast requirement. The region being loaded carries
 * aria-busy and one polite "Loading {thing}…" status (LoadingRegion). Not focusable.
 */
export function Skeleton({ shape = "line", width = "75%", size = "md", text = "sm", className }: SkeletonProps) {
  if (shape === "line") {
    const box = text === "xs" ? "h-4.5" : text === "table" ? "h-5" : "h-5.5";
    const bar = text === "xs" ? "h-2.5" : "h-3";
    return (
      <span aria-hidden="true" className={cn("flex items-center", box, WIDTH[width], className)}>
        <span className={cn(skeletonBlockClassName, "w-full rounded-sm", bar)} />
      </span>
    );
  }
  const shapes: Record<Exclude<SkeletonShape, "line">, string> = {
    title: "h-5 w-48 max-w-full rounded-sm",
    circle: cn(CIRCLE[size], "shrink-0 rounded-pill"),
    pill: "h-chip w-20 rounded-pill",
    button: "h-control-sm w-24 rounded-md",
    tile: "h-28 w-full rounded-lg",
    card: "w-full rounded-lg",
  };
  return <span aria-hidden="true" className={cn(skeletonBlockClassName, shapes[shape], className)} />;
}
