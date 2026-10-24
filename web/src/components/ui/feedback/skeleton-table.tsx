import { cn } from "@/lib/cn";
import { Skeleton, type SkeletonWidth } from "./skeleton";

export type SkeletonTableColumn = {
  /** The real header text: the header row stays real while the body loads. */
  header: string;
  /** How much of its cell the placeholder covers. */
  width?: SkeletonWidth;
  /** A pill-shaped placeholder (status columns). */
  pill?: boolean;
  align?: "start" | "end";
};

/**
 * The table form of Skeleton: the header row is real, then 8 body rows at the current row height
 * (h-row 48 px or h-row-compact 40 px), one block per column. The table itself is aria-hidden
 * while it loads; the region's status line says "Loading leads…".
 */
export function SkeletonTable({
  columns,
  rows = 8,
  density = "default",
  caption,
}: {
  columns: SkeletonTableColumn[];
  rows?: number;
  density?: "default" | "compact";
  /** The table's name, for the header row that stays real. */
  caption: string;
}) {
  return (
    <div className="overflow-hidden">
      <table className="w-full table-fixed border-collapse text-left text-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="h-row-header border-b border-border">
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                className={cn("px-3 text-xs font-medium text-muted", column.align === "end" && "text-right")}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody aria-hidden="true">
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row} className={cn("border-b border-border last:border-b-0", density === "compact" ? "h-row-compact" : "h-row")}>
              {columns.map((column, index) => (
                <td key={column.header} className="px-3">
                  {column.pill ? (
                    <Skeleton shape="pill" />
                  ) : (
                    <Skeleton
                      text="table"
                      width={column.width ?? (["70%", "50%", "80%", "60%"] as const)[(row + index) % 4]}
                      className={column.align === "end" ? "ml-auto" : undefined}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
