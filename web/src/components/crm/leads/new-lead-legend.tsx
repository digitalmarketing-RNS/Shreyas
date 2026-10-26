import { NewLeadDot } from "./new-lead-dot";

/** The table toolbar's legend while any row on the page has the New dot: the dot, then "New lead". */
export function NewLeadLegend() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <NewLeadDot withTooltip={false} />
      New lead
    </span>
  );
}
