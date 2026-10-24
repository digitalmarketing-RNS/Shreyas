import { MINUS, MISSING, type MinorUnits, formatMoney, formatMoneyCompact } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ExactValueTooltip } from "./exact-value-tooltip";

/**
 * - exact (default): always all minor digits. Payment pages, receipts, S25, refunds.
 * - compact: KPI tiles and chart axes only ("₹1.5L", "₹1.2Cr"), with the exact amount behind it.
 * - signed: refunds and reversals get a minus sign and a word ("−₹500.00 refund"). Never a minus alone.
 */
export type MoneyVariant = "exact" | "compact" | "signed";

export type MoneyProps = {
  /** Integer minor units (paise for INR) as a bigint or a digit string. Never a JS number. null → "—". */
  value: MinorUnits | null;
  currency?: string;
  variant?: MoneyVariant;
  /** signed: the word after the amount ("refund", "reversal", "discount"). */
  word?: string;
  /** compact: inside a focusable parent (a tile link), so not a tab stop of its own. */
  inFocusable?: boolean;
  /** In KPI tiles amounts are font-bold; in tables right-aligned (the cell aligns it). */
  className?: string;
};

/**
 * An amount from integer paise, exactly, in Indian grouping, with no rounding through floating
 * point (components.md, Money). Formats with en-IN on the server; renders <data value="{paise}">.
 */
export function Money({ value, currency = "INR", variant = "exact", word = "refund", inFocusable = false, className }: MoneyProps) {
  if (value === null || value === undefined) {
    return (
      <span className={cn("text-muted", className)}>
        <span aria-hidden="true">{MISSING}</span>
        <span className="sr-only">Not set</span>
      </span>
    );
  }
  const raw = typeof value === "bigint" ? value.toString() : value;

  if (variant === "compact") {
    const exact = formatMoney(value, { currency });
    return (
      <data value={raw} className={cn("text-fg tabular-nums", className)}>
        <ExactValueTooltip short={formatMoneyCompact(value, { currency })} exact={exact} tooltip={`Exact amount ${exact}`} inFocusable={inFocusable} />
      </data>
    );
  }

  if (variant === "signed") {
    const negative = BigInt(raw) > BigInt(0) ? BigInt(raw) * BigInt(-1) : BigInt(raw);
    const text = formatMoney(negative, { currency });
    return (
      <data value={negative.toString()} className={cn("text-fg tabular-nums", className)}>
        {text.startsWith(MINUS) ? text : `${MINUS}${text}`} <span className="text-muted">{word}</span>
      </data>
    );
  }

  return (
    <data value={raw} className={cn("text-fg tabular-nums", className)}>
      {formatMoney(value, { currency })}
    </data>
  );
}
