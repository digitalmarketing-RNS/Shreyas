import { cn } from "@/lib/cn";

const WIDTHS = ["w-4/5", "w-3/5", "w-2/5", "w-7/10", "w-1/2", "w-3/4"] as const;

/**
 * DataTable's first-load body: as many Skeleton rows as the page size, up to 10, with one bar per
 * cell (h-3, widths from 40 to 80%). Decorative: the table carries aria-busy and the status says
 * "Loading leads".
 */
export function SkeletonRows({ rows, columns, rowHeight }: { rows: number; columns: number; rowHeight: string }) {
  return (
    <>
      {Array.from({ length: Math.min(rows, 10) }, (_, row) => (
        <tr key={row} aria-hidden="true" className={cn(rowHeight, "bg-surface")}>
          {Array.from({ length: columns }, (_, col) => (
            <td key={col} className="border-b border-border px-3">
              <span className={cn("block h-3 rounded-sm bg-surface-sunken motion-safe:animate-pulse", WIDTHS[(row + col) % WIDTHS.length])} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
