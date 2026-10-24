import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { cn } from "@/lib/cn";

export type DescriptionItem = {
  /** A noun, sentence case, no colon: "Mobile number", "Course", "Owner". */
  label: ReactNode;
  /** Text, Money, DateText, StatusPill, PhoneText, MaskedValue or a Link; an array for several values. Empty → "—". */
  value?: ReactNode | ReactNode[];
  /** User-entered text gets dir="auto". */
  userEntered?: boolean;
  /** Read for an empty value instead of "Not given". */
  emptyText?: string;
  /** Extra classes on the value (the Failed count's text-danger). */
  valueClassName?: string;
  key?: string;
};

/**
 * - stacked (default): label above value, 1 to 3 columns (grid-cols-1 md:grid-cols-2 xl:grid-cols-3).
 * - side-by-side: from md the label column is w-kv-label (200 px), the same column as Field's
 *   key-value row, so read-only and editable rows line up on S08; stacked below md.
 * - counts: JobProgress and import results; values in text-md tabular-nums.
 */
export type DescriptionListVariant = "stacked" | "side-by-side" | "counts";

const COLUMNS = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
} as const;

function isEmpty(value: DescriptionItem["value"]): boolean {
  if (value === null || value === undefined || value === "") return true;
  return Array.isArray(value) && value.every((part) => part === null || part === undefined || part === "");
}

/**
 * Read-only facts as label and value pairs (components.md, DescriptionList). Native <dl>, <dt>,
 * <dd> with a <div> per pair. Long values wrap and are never truncated. Not focusable.
 */
export function DescriptionList({
  items,
  variant = "stacked",
  columns = 3,
  loading = false,
  className,
}: {
  items: DescriptionItem[];
  variant?: DescriptionListVariant;
  columns?: 1 | 2 | 3;
  /** A Skeleton line per value; the labels stay real. */
  loading?: boolean;
  className?: string;
}) {
  const sideBySide = variant === "side-by-side";
  return (
    <dl
      className={cn(
        "m-0",
        sideBySide ? "flex flex-col" : variant === "counts" ? "grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 md:grid-cols-5" : cn("grid gap-x-6 gap-y-3", COLUMNS[columns]),
        className,
      )}
    >
      {items.map((item, index) => {
        const values = Array.isArray(item.value) ? item.value : [item.value];
        return (
          <div
            key={item.key ?? index}
            className={cn("min-w-0", sideBySide && "min-h-kv-row border-b border-border py-2 last:border-b-0 md:flex md:gap-4")}
          >
            <dt className={cn("text-xs font-medium text-muted", sideBySide && "md:w-kv-label md:shrink-0 md:pt-0.5")}>{item.label}</dt>
            {loading ? (
              <dd className="m-0 mt-0.5">
                <Skeleton width="60%" />
              </dd>
            ) : isEmpty(item.value) ? (
              <dd className={cn("m-0 text-sm text-muted", !sideBySide && "mt-0.5")}>
                <span aria-hidden="true">—</span>
                <span className="sr-only">{item.emptyText ?? "Not given"}</span>
              </dd>
            ) : (
              values.map((value, valueIndex) => (
                <dd
                  key={valueIndex}
                  dir={item.userEntered ? "auto" : undefined}
                  className={cn(
                    "m-0 min-w-0 break-words text-fg",
                    variant === "counts" ? "text-md tabular-nums" : "text-sm",
                    !sideBySide && "mt-0.5",
                    item.valueClassName,
                  )}
                >
                  {value}
                </dd>
              ))
            )}
          </div>
        );
      })}
    </dl>
  );
}
