import { describeMaskedEmail, describeMaskedPhone } from "@/lib/format";
import { cn } from "@/lib/cn";

export type MaskedCellProps = {
  kind: "phone" | "email";
  /** The masked string from the server: "+91 ••••• •3210", "pr•••@gmail.com". */
  masked: string | null;
  className?: string;
};

/**
 * A masked contact inside a table cell (components.md, DataTable: "masked cells: MaskedValue in
 * text-fg tabular-nums"; Group 3 conventions: tables never offer "Show"). It renders MaskedValue's
 * masked form without the lock tab stop, so the grid cell itself takes focus and reads the
 * sentence ("Mobile number hidden, ends in 3210").
 */
export function MaskedCell({ kind, masked, className }: MaskedCellProps) {
  if (!masked) return <span className={cn("text-muted", className)}>Not given</span>;
  const description = kind === "phone" ? describeMaskedPhone(masked) : describeMaskedEmail(masked);
  return (
    <span className={cn("text-fg tabular-nums whitespace-nowrap", className)}>
      <span aria-hidden="true">{masked}</span>
      <span className="sr-only">{description}</span>
    </span>
  );
}
