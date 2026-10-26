"use client";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import type { TableNoun } from "./data-table-types";

export type SelectionBannerProps = {
  noun: TableNoun;
  /** Rows selected on this page (all of them, when the banner shows). */
  pageCount: number;
  /** Every record that matches the filters. */
  matchingTotal: number;
  /** Bulk actions now run on the filter, not a list of ids. */
  allMatchingSelected: boolean;
  onSelectAllMatching: () => void;
  onClearSelection: () => void;
};

/**
 * Shown above the rows after select-all on a page (components.md, DataTable anatomy): offers every
 * record that matches the filters, then "Clear selection". bg-accent-subtle with text-fg; its link
 * button is text-accent (accent on accent-subtle is a listed pair).
 */
export function SelectionBanner({
  noun,
  pageCount,
  matchingTotal,
  allMatchingSelected,
  onSelectAllMatching,
  onClearSelection,
}: SelectionBannerProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border bg-accent-subtle px-4 py-2 text-sm text-fg">
      {allMatchingSelected ? (
        <>
          <span>{`All ${formatNumber(matchingTotal)} matching ${noun.other} are selected.`}</span>
          <Button variant="link" onClick={onClearSelection}>
            Clear selection
          </Button>
        </>
      ) : (
        <>
          <span>{`All ${formatNumber(pageCount)} ${pageCount === 1 ? noun.one : noun.other} on this page are selected.`}</span>
          <Button variant="link" onClick={onSelectAllMatching}>
            {`Select all ${formatNumber(matchingTotal)} matching ${noun.other}`}
          </Button>
        </>
      )}
    </div>
  );
}
