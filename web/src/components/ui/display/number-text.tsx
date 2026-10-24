import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  MISSING,
  formatCompactNumber,
  formatNumber,
  formatPercent,
  formatPercentChange,
  formatPointsChange,
  formatShare,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import { ExactValueTooltip } from "./exact-value-tooltip";

type Base = { className?: string };

export type NumberTextProps = Base &
  (
    | { variant?: "count"; value: number | bigint | null; unit?: string }
    | { variant: "compact"; value: number | bigint | null; unit?: string; inFocusable?: boolean }
    | { variant: "percent"; value?: number | null; part?: number; whole?: number }
    | {
        variant: "delta";
        /** A ratio change (0.123 → "+12.3%") or a points change (−4 → "−4 pts"). */
        value: number;
        unit: "percent" | "points";
        /** Whether up is good for this metric (leads up) or down is (cost per lead). */
        goodDirection: "up" | "down";
        /** In table rows deltas are text-fg; the icon and sign carry the direction. */
        inTable?: boolean;
        comparison?: string;
      }
    | {
        variant: "score";
        score: number;
        /** "top 12%": the lead's percentile within the institution. */
        topPercent: number;
        /** Leads under 18 have no scoring: nothing shows. */
        minor?: boolean;
      }
  );

function Missing({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("text-muted", className)}>
      <span aria-hidden="true">{MISSING}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

/**
 * Counts, percentages and changes in Indian grouping, with exact values behind any short form
 * (components.md, NumberText). Formats with en-IN on the server.
 */
export function NumberText(props: NumberTextProps) {
  const { className } = props;
  const base = cn("text-fg tabular-nums", className);

  switch (props.variant) {
    case "compact": {
      if (props.value === null) return <Missing text="Not available" className={className} />;
      const exact = `${formatNumber(props.value)}${props.unit ? ` ${props.unit}` : ""}`;
      return (
        <data value={String(props.value)} className={base}>
          <ExactValueTooltip
            short={`${formatCompactNumber(props.value)}${props.unit ? ` ${props.unit}` : ""}`}
            exact={exact}
            tooltip={`Exact count ${exact}`}
            inFocusable={props.inFocusable}
          />
        </data>
      );
    }
    case "percent": {
      const text =
        props.part !== undefined && props.whole !== undefined
          ? formatShare(props.part, props.whole)
          : props.value === null || props.value === undefined
            ? MISSING
            : formatPercent(props.value);
      if (text === MISSING) return <Missing text="Not available" className={className} />;
      return <span className={base}>{text}</span>;
    }
    case "delta": {
      const { value, unit, goodDirection, inTable = false, comparison = "from last period" } = props;
      const flat = value === 0;
      const up = value > 0;
      const good = flat ? null : (up && goodDirection === "up") || (!up && goodDirection === "down");
      const signed = unit === "percent" ? formatPercentChange(value) : formatPointsChange(value);
      const unsigned = signed.replace(/^[+−]/, "");
      const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
      const colour = inTable || good === null ? "text-fg" : good ? "text-success" : "text-danger";
      return (
        <span className={cn("inline-flex items-center gap-1 text-xs tabular-nums", className)}>
          <Icon aria-hidden="true" className={cn("size-icon-sm shrink-0", colour)} />
          <span aria-hidden="true" className={colour}>
            {flat ? "No change" : signed}
          </span>
          {flat ? null : <span aria-hidden="true" className="text-muted">{comparison}</span>}
          <span className="sr-only">{flat ? `No change ${comparison}` : `${up ? "up" : "down"} ${unsigned} ${comparison}`}</span>
        </span>
      );
    }
    case "score": {
      if (props.minor) return null;
      return (
        <span className={base}>
          {formatNumber(props.score)}
          <span className="text-muted"> · top {formatPercent(props.topPercent / 100)}</span>
        </span>
      );
    }
    default: {
      if (props.value === null) return <Missing text="Not available" className={className} />;
      return (
        <data value={String(props.value)} className={base}>
          {formatNumber(props.value)}
          {props.unit ? ` ${props.unit}` : null}
        </data>
      );
    }
  }
}
