"use client";

import { TriangleAlert } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs as RadixTabs } from "radix-ui";
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/components/ui/display/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { Tooltip } from "@/components/ui/overlays/tooltip";
import { cn } from "@/lib/cn";

export type TabItem = {
  value: string;
  /** One or two words, sentence case: "Details", "Follow-ups". */
  label: string;
  /** A count of 0 is not shown. */
  count?: number;
  /** The panel needs attention: TriangleAlert and ", needs attention" in the name. */
  attention?: boolean;
  /** Avoid: hide the tab instead. If it must show but cannot open, the reason is its tooltip. */
  disabledReason?: string;
};

export type TabsProps = {
  /** The tabs the team's profile settings show, in their order; a hidden tab is not rendered at all. */
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * manual: panels that fetch (S08, S27) load on Enter, Space or click, not while arrowing past.
   * automatic: panels already in memory open as focus moves.
   */
  activation?: "manual" | "automatic";
  /** md: page tabs under a detail PageHeader (40 px). sm: panel tabs inside a card, drawer or dialog (32 px). */
  size?: "md" | "sm";
  /** The tablist's name: "Lead sections". */
  label: string;
  /** The panel for a value. Panels mount lazily: only the active one renders. */
  renderPanel: (value: string) => ReactNode;
  /**
   * Keep the active tab in ?{param}= (router.replace, no history entry per switch), so a tab can be
   * linked and a reload keeps it. A static page must wrap URL-synced Tabs in <Suspense>.
   */
  syncParam?: string;
  className?: string;
  panelClassName?: string;
};

/**
 * Switch between panels of one record or page, with overflow handling for long, team-configured
 * tab sets (components.md, Tabs). Radix Tabs: Tab enters on the active tab; Left and Right move
 * (wrapping), Home and End jump. Tabs that don't fit move, in order, into "More" (outside the
 * tablist); if the active tab would be hidden it swaps into the last visible slot. Weight never
 * changes between states, so tabs never shift sideways.
 */
export function Tabs(props: TabsProps) {
  if (props.syncParam) return <UrlSyncedTabs {...props} syncParam={props.syncParam} />;
  return <TabsView {...props} />;
}

function UrlSyncedTabs({ syncParam, ...props }: TabsProps & { syncParam: string }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const fromUrl = params.get(syncParam);
  const value = props.items.some((item) => item.value === fromUrl) ? (fromUrl as string) : (props.defaultValue ?? props.items[0]?.value ?? "");
  return (
    <TabsView
      {...props}
      value={value}
      onValueChange={(next) => {
        const query = new URLSearchParams(params.toString());
        query.set(syncParam, next);
        router.replace(`${pathname}?${query.toString()}`, { scroll: false });
        props.onValueChange?.(next);
      }}
    />
  );
}

const TRIGGER = cn(
  "relative inline-flex min-w-12 shrink-0 items-center justify-center gap-2 rounded-t-md text-sm font-medium whitespace-nowrap text-muted",
  "transition-colors duration-fast hover:bg-surface-hover hover:text-fg focus-inset data-[state=active]:text-fg",
  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:content-[''] data-[state=active]:after:bg-accent",
  "aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted",
);
const SIZE = { md: "h-control-md px-3", sm: "h-control-sm px-2" } as const;

function TabsView({
  items,
  value: valueProp,
  defaultValue,
  onValueChange,
  activation = "automatic",
  size = "md",
  label,
  renderPanel,
  className,
  panelClassName,
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value ?? "");
  const value = valueProp ?? internal;
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<number | null>(null);
  const focusAfter = useRef<string | null>(null);

  const setValue = useCallback(
    (next: string) => {
      if (valueProp === undefined) setInternal(next);
      onValueChange?.(next);
    },
    [valueProp, onValueChange],
  );

  // Measure every tab once in a hidden copy, then fit as many as the row allows.
  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;
    const compute = () => {
      const widths = Array.from(measure.querySelectorAll<HTMLElement>("[data-measure-tab]")).map((node) => node.offsetWidth + 4);
      const more = measure.querySelector<HTMLElement>("[data-measure-more]")?.offsetWidth ?? 0;
      const available = row.clientWidth;
      const total = widths.reduce((sum, width) => sum + width, 0);
      if (total <= available) {
        setFit(null);
        return;
      }
      let used = more + 8;
      let count = 0;
      for (const width of widths) {
        if (used + width > available) break;
        used += width;
        count += 1;
      }
      setFit(Math.max(1, count));
    };
    // The observer's first callback measures; later ones follow the row's width.
    const observer = new ResizeObserver(compute);
    observer.observe(row);
    return () => observer.disconnect();
  }, [items, size]);

  let visible = items;
  if (fit !== null && fit < items.length) {
    visible = items.slice(0, fit);
    const activeIndex = items.findIndex((item) => item.value === value);
    if (activeIndex >= fit) visible = [...items.slice(0, fit - 1), items[activeIndex]];
  }
  const hidden = items.filter((item) => !visible.includes(item));

  // A tab chosen from "More" swaps into view; focus moves to it.
  useEffect(() => {
    if (!focusAfter.current) return;
    const target = rowRef.current?.querySelector<HTMLElement>(`[role="tab"][data-value="${CSS.escape(focusAfter.current)}"]`);
    focusAfter.current = null;
    target?.focus();
  }, [value, fit]);

  return (
    <RadixTabs.Root value={value} onValueChange={setValue} activationMode={activation} className={className}>
      <div ref={rowRef} className="relative flex min-w-0 items-end gap-1 border-b border-border">
        <RadixTabs.List aria-label={label} className="-mb-0.5 flex min-w-0 items-end gap-1 overflow-x-clip pb-0.5">
          {visible.map((item) => (
            <TabTrigger key={item.value} item={item} size={size} active={item.value === value} />
          ))}
        </RadixTabs.List>
        {hidden.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" menu aria-label={`More tabs, ${hidden.length} hidden`} className="mb-1">
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onCloseAutoFocus={(event) => {
                if (focusAfter.current) event.preventDefault();
              }}
            >
              <DropdownMenuRadioGroup
                value={value}
                onValueChange={(next) => {
                  focusAfter.current = next;
                  setValue(next);
                }}
              >
                {hidden.map((item) => (
                  <DropdownMenuRadioItem key={item.value} value={item.value} unavailableReason={item.disabledReason}>
                    {item.count ? `${item.label} (${formatCount(item.count)})` : item.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <div ref={measureRef} aria-hidden="true" inert className="invisible absolute top-0 left-0 flex h-0 overflow-hidden">
          {items.map((item) => (
            <span key={item.value} data-measure-tab="" className={cn(TRIGGER, SIZE[size])}>
              <TabFace item={item} active={false} />
            </span>
          ))}
          <span data-measure-more="" className="inline-flex h-control-sm items-center gap-2 px-3 text-sm font-medium">
            More <span className="size-icon-sm" />
          </span>
        </div>
      </div>
      <RadixTabs.Content key={value} value={value} className={cn("pt-4", panelClassName)}>
        {renderPanel(value)}
      </RadixTabs.Content>
    </RadixTabs.Root>
  );
}

function TabFace({ item, active }: { item: TabItem; active: boolean }) {
  return (
    <>
      <span>{item.label}</span>
      {item.count || item.attention ? (
        <span className="sr-only">{`${item.count ? `, ${formatCount(item.count)}` : ""}${item.attention ? ", needs attention" : ""}`}</span>
      ) : null}
      {item.count ? (
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex h-5 min-w-5 items-center justify-center rounded-pill border border-transparent px-1.5 text-xs font-medium tabular-nums text-fg",
            active ? "bg-accent-subtle" : "bg-surface-sunken",
          )}
        >
          {formatCount(item.count)}
        </span>
      ) : null}
      {item.attention ? <TriangleAlert aria-hidden="true" className="size-icon-sm shrink-0 text-warning" /> : null}
    </>
  );
}

function TabTrigger({ item, size, active }: { item: TabItem; size: "md" | "sm"; active: boolean }) {
  const blocked = Boolean(item.disabledReason);
  const block = (event: { preventDefault: () => void }) => {
    if (blocked) event.preventDefault();
  };
  const trigger = (
    <RadixTabs.Trigger
      value={item.value}
      data-value={item.value}
      aria-disabled={blocked || undefined}
      onMouseDown={block}
      onFocus={block}
      onKeyDown={(event) => {
        if (blocked && (event.key === "Enter" || event.key === " ")) event.preventDefault();
      }}
      className={cn(TRIGGER, SIZE[size])}
    >
      <TabFace item={item} active={active} />
    </RadixTabs.Trigger>
  );
  if (!item.disabledReason) return trigger;
  return <Tooltip content={item.disabledReason}>{trigger}</Tooltip>;
}
