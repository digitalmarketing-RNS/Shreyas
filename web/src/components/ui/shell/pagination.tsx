"use client";

import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft } from "lucide-react";
import { Select } from "radix-ui";
import { type ReactNode, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

export const PAGE_SIZES = [10, 25, 50, 100] as const;

type PagerProps = {
  /**
   * pager: alone in a table footer. combined: the right part of the footer bar, with BulkActionBar
   * (group 3) in `start`. compact: narrow containers, range plus Previous and Next.
   */
  variant?: "pager" | "combined" | "compact";
  /** Names the nav ("Pagination for leads") and the status line ("Showing leads 26 to 50 …"). */
  listName: string;
  from: number;
  to: number;
  /** null while the count is loading (the range shows without a total). */
  total?: number | null;
  /** The count stopped at 10,001 rows: "of 10,000+". */
  capped?: boolean;
  pageSize: number;
  /** Changing it keeps focus on the select, resets to the first page and announces "Showing 50 rows per page". */
  onPageSizeChange?: (size: number) => void;
  isFirst: boolean;
  isLast: boolean;
  onFirst?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  /** The pressed button shows its loading state; the rows stay until the new page arrives. */
  loading?: "first" | "previous" | "next" | null;
  /** combined: the BulkActionBar. */
  start?: ReactNode;
  className?: string;
};

type LoadMoreProps = {
  variant: "load-more";
  /** "Show older activity", "Show 20 more". */
  label: string;
  state?: "idle" | "loading" | "done" | "error";
  onLoadMore?: () => void;
  doneText?: string;
  /** After loading, the page moves focus to the first new item (tabindex="-1") and may set this sr-only status. */
  status?: string;
  className?: string;
};

export type PaginationProps = PagerProps | LoadMoreProps;

/**
 * The only pager in the app, on the cursor-based list APIs (components.md, Pagination). No numbered
 * page list: cursors can't jump to page 7. The cursor lives in the URL (?after=…) so Back and reload
 * return to the same page. Buttons at the ends use aria-disabled, not disabled, so focus stays on the
 * pressed button (2.4.3). The range text is not a live region; a separate status line announces changes.
 */
export function Pagination(props: PaginationProps) {
  if (props.variant === "load-more") return <LoadMore {...props} />;
  return <Pager {...props} />;
}

function rangeText(from: number, to: number, total: number | null | undefined, capped: boolean) {
  const range = `${formatNumber(from)}–${formatNumber(to)}`;
  if (total === null || total === undefined) return { range, of: null };
  return { range, of: capped ? "10,000+" : formatNumber(total) };
}

function Pager({
  variant = "pager",
  listName,
  from,
  to,
  total,
  capped = false,
  pageSize,
  onPageSizeChange,
  isFirst,
  isLast,
  onFirst,
  onPrevious,
  onNext,
  loading = null,
  start,
  className,
}: PagerProps) {
  const selectId = useId();
  const [status, setStatus] = useState("");
  const [seen, setSeen] = useState({ from, to, pageSize });
  // Announce a page change once (adjusting state during render, not in an effect).
  if (seen.from !== from || seen.to !== to || seen.pageSize !== pageSize) {
    const sizeChanged = seen.pageSize !== pageSize;
    setSeen({ from, to, pageSize });
    if (sizeChanged) setStatus(`Showing ${pageSize} rows per page`);
    else {
      const of = total === null || total === undefined ? "" : ` of ${capped ? "10,000+" : formatNumber(total)}`;
      setStatus(`Showing ${listName} ${formatNumber(from)} to ${formatNumber(to)}${of}.${isFirst ? " First page." : isLast ? " Last page." : ""}`);
    }
  }

  const { range, of } = rangeText(from, to, total, capped);
  const compact = variant === "compact";
  const firstReason = isFirst ? "You're on the first page" : undefined;
  const lastReason = isLast ? "You're on the last page" : undefined;

  const select = compact ? null : (
    <div className="flex items-center gap-2">
      <label htmlFor={selectId} className="text-sm whitespace-nowrap text-muted">
        Rows per page
      </label>
      <Select.Root value={String(pageSize)} onValueChange={(next) => onPageSizeChange?.(Number(next))}>
        <Select.Trigger
          id={selectId}
          className="inline-flex h-control-sm w-20 items-center justify-between gap-1 rounded-md border border-input bg-surface px-2.5 text-sm text-fg tabular-nums transition-colors duration-fast hover:border-muted"
        >
          <Select.Value />
          <Select.Icon>
            <ChevronDown aria-hidden="true" className="size-icon-sm text-muted" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={4}
            className="z-(--z-popover) min-w-(--radix-select-trigger-width) rounded-lg border border-border bg-surface-raised p-1 text-fg shadow-pop data-[state=open]:motion-safe:animate-pop-in data-[state=open]:motion-reduce:animate-fade-in"
          >
            <Select.Viewport>
              {PAGE_SIZES.map((size) => (
                <Select.Item
                  key={size}
                  value={String(size)}
                  className="relative flex h-menu-item cursor-default items-center rounded-sm pr-2 pl-7 text-sm text-fg tabular-nums select-none focus-inset data-[highlighted]:bg-surface-hover data-[state=checked]:font-medium"
                >
                  <Select.ItemIndicator className="absolute left-2 inline-flex">
                    <Check aria-hidden="true" className="size-icon-sm text-accent" />
                  </Select.ItemIndicator>
                  <Select.ItemText>{size}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );

  const pager = (
    <>
      <p className="m-0 text-sm whitespace-nowrap text-muted tabular-nums">
        <span className="text-fg">{range}</span>
        {of ? (
          <>
            {" of "}
            <span className="text-fg">{of}</span>
          </>
        ) : null}
      </p>
      <div className="flex items-center gap-2">
        {compact ? null : (
          <>
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<ChevronsLeft />}
              disabledReason={firstReason}
              loading={loading === "first"}
              onClick={onFirst}
              className="hidden md:inline-flex"
            >
              First page
            </Button>
            <IconButton
              icon={<ChevronsLeft />}
              aria-label="First page"
              variant="secondary"
              size="sm"
              disabledReason={firstReason}
              loading={loading === "first"}
              onClick={onFirst}
              className="md:hidden"
            />
          </>
        )}
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<ChevronLeft />}
          disabledReason={firstReason}
          loading={loading === "previous"}
          onClick={onPrevious}
          className={cn("hidden", !compact && "md:inline-flex")}
        >
          Previous page
        </Button>
        <IconButton
          icon={<ChevronLeft />}
          aria-label="Previous page"
          variant="secondary"
          size="sm"
          disabledReason={firstReason}
          loading={loading === "previous"}
          onClick={onPrevious}
          className={cn(!compact && "md:hidden")}
        />
        <Button
          variant="secondary"
          size="sm"
          trailingIcon={<ChevronRight />}
          disabledReason={lastReason}
          loading={loading === "next"}
          onClick={onNext}
          className={cn("hidden", !compact && "md:inline-flex")}
        >
          Next page
        </Button>
        <IconButton
          icon={<ChevronRight />}
          aria-label="Next page"
          variant="secondary"
          size="sm"
          disabledReason={lastReason}
          loading={loading === "next"}
          onClick={onNext}
          className={cn(!compact && "md:hidden")}
        />
      </div>
    </>
  );

  return (
    <nav
      aria-label={`Pagination for ${listName}`}
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2",
        variant === "pager" && "min-h-table-footer justify-end border-t border-border bg-surface-subtle px-4 py-2",
        variant === "combined" && "min-h-pagebar justify-between border-t border-border bg-surface-subtle px-4 py-2",
        compact && "justify-between",
        className,
      )}
    >
      {variant === "combined" && start ? <div className="flex min-w-0 flex-1 basis-full items-center lg:basis-auto">{start}</div> : null}
      {select}
      {pager}
      <span role="status" className="sr-only">
        {status}
      </span>
    </nav>
  );
}

function LoadMore({ label, state = "idle", onLoadMore, doneText = "That's everything", status, className }: LoadMoreProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {state === "done" ? (
        <p className="m-0 text-sm text-muted">{doneText}</p>
      ) : state === "error" ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <p className="m-0 text-sm text-fg">Couldn&apos;t load more.</p>
          <Button variant="secondary" size="sm" onClick={onLoadMore}>
            Try again
          </Button>
        </div>
      ) : (
        <Button variant="secondary" size="sm" loading={state === "loading"} loadingLabel="Loading…" onClick={onLoadMore}>
          {label}
        </Button>
      )}
      <span role="status" className="sr-only">
        {status ?? ""}
      </span>
    </div>
  );
}
