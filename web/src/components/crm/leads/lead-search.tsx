"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { Select as RadixSelect } from "radix-ui";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { ControlSpinner, IconButton } from "@/components/ui/icon-button";
import { BARE_INPUT, RING_FROM_INPUT, controlBox } from "@/components/ui/forms/control-styles";
import { useDebouncedCallback, useDelayedFlag } from "@/components/ui/forms/hooks";
import { selectContentClassName, selectItemClassName } from "@/components/ui/forms/select";
import { Kbd } from "@/components/ui/primitives/kbd";
import { cn } from "@/lib/cn";
import {
  type LeadSearchKey,
  type ResolvedLeadSearchKey,
  checkLeadQuery,
  keyInfo,
  keysFor,
  resolveKey,
  searchInputName,
  triggerText,
} from "./lead-search-keys";

export type LeadSearchProps = {
  /** S05 leads; S26 opportunities adds "Opportunity ID". */
  list?: "leads" | "opportunities";
  /** The query and key, kept in the URL (?q=…&by=mobile). */
  defaultQuery?: string;
  defaultKey?: LeadSearchKey;
  /** Runs 300 ms after typing stops, or at once on Enter, when the query can be sent. "" clears. */
  onSearch?: (query: string, key: ResolvedLeadSearchKey) => void;
  /** The table is fetching: a spinner replaces the search icon after 300 ms. */
  searching?: boolean;
  /** Contacts are hidden for this role: email and mobile need the whole value. */
  masked?: boolean;
  /** "/" focuses the field (only when single-key shortcuts are on, 2.1.4). */
  shortcut?: boolean;
  /** Keep ?q= and ?by= in the URL. */
  syncUrl?: boolean;
  /** A server error: shown as the hint, the query is kept. */
  error?: string | null;
  className?: string;
};

/**
 * Find one lead fast by name, email, mobile, lead number or API ID; the person picks the key or
 * lets the field guess it (components.md, LeadSearch). Results filter the table; there is no
 * results popover, and the result count goes through the table's status region.
 *
 * Keyboard: "/" focuses the input (when shortcuts are on). Shift+Tab from the input reaches the
 * picker. Enter, Space or Alt+Arrow Down opens the picker; arrows choose; Enter picks and returns
 * focus to the input. Esc clears the input.
 */
export function LeadSearch({
  list = "leads",
  defaultQuery = "",
  defaultKey = "auto",
  onSearch,
  searching = false,
  masked = false,
  shortcut = false,
  syncUrl = false,
  error,
  className,
}: LeadSearchProps) {
  const base = useId();
  const hintId = `${base}-hint`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(defaultQuery);
  const [key, setKey] = useState<LeadSearchKey>(defaultKey);
  const [hint, setHint] = useState<string | null>(null);
  const spinning = useDelayedFlag(searching, 300);
  const keys = keysFor(list);
  const info = keyInfo(key);
  const trigger = triggerText(key, query);
  const shownHint = error ?? hint;

  const fire = (text: string, nextKey: LeadSearchKey = key) => {
    const check = checkLeadQuery(text, nextKey, { masked });
    if (!check.send) {
      setHint(check.hint);
      return;
    }
    setHint(null);
    if (syncUrl) {
      const url = new URL(window.location.href);
      if (check.query) {
        url.searchParams.set("q", text.trim());
        url.searchParams.set("by", nextKey);
      } else {
        url.searchParams.delete("q");
        url.searchParams.delete("by");
      }
      window.history.replaceState(window.history.state, "", url);
    }
    onSearch?.(check.query, check.key);
  };
  const debounced = useDebouncedCallback(fire, 300);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && (active.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName))) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      debounced.cancel();
      fire(query);
    } else if (event.key === "Escape" && query) {
      event.preventDefault();
      setQuery("");
      debounced.cancel();
      fire("");
    }
  };

  const guessed: ResolvedLeadSearchKey | null = key === "auto" && query.trim() ? resolveKey(query, key) : null;
  const inputMode = guessed ? keyInfo(guessed).inputMode : info.inputMode;

  return (
    <search className={cn("flex w-full min-w-0 flex-col gap-1 sm:w-auto", className)}>
      <div className="flex h-control-sm min-w-0 items-stretch">
        <RadixSelect.Root
          value={key}
          onValueChange={(next) => {
            const chosen = next as LeadSearchKey;
            setKey(chosen);
            if (query.trim()) fire(query, chosen);
            // Enter picks and returns focus to the input.
            window.requestAnimationFrame(() => inputRef.current?.focus());
          }}
        >
          <RadixSelect.Trigger
            aria-label="Search field"
            className={cn(
              "inline-flex h-full w-auto shrink-0 items-center justify-between gap-1 rounded-r-none px-2 text-sm sm:w-32",
              controlBox(),
            )}
          >
            <span className="flex min-w-0 items-center gap-1 truncate">
              <Search aria-hidden="true" className="size-icon-sm shrink-0 text-muted sm:hidden" />
              <span className={cn("truncate", trigger.guessed && "max-sm:hidden")}>{trigger.key}</span>
              {trigger.guessed ? (
                <span className="truncate text-muted">
                  <span className="max-sm:hidden">: </span>
                  {trigger.guessed}
                </span>
              ) : null}
            </span>
            <ChevronDown aria-hidden="true" className="size-icon-sm shrink-0 text-muted" />
          </RadixSelect.Trigger>
          <RadixSelect.Portal>
            <RadixSelect.Content position="popper" sideOffset={4} collisionPadding={8} className={selectContentClassName}>
              <RadixSelect.Viewport className="p-1">
                {keys.map((option) => (
                  <RadixSelect.Item key={option.value} value={option.value} className={selectItemClassName}>
                    <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                    <RadixSelect.ItemIndicator className="absolute right-2 inline-flex">
                      <Check aria-hidden="true" className="size-icon-sm text-accent" />
                    </RadixSelect.ItemIndicator>
                  </RadixSelect.Item>
                ))}
              </RadixSelect.Viewport>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </RadixSelect.Root>
        <div
          className={cn(
            "relative -ml-px flex min-w-0 flex-1 items-center gap-2 rounded-l-none pr-1 pl-2.5 text-sm sm:w-72 sm:flex-none pointer-coarse:text-base",
            controlBox(),
            RING_FROM_INPUT,
          )}
        >
          <span aria-hidden="true" className="inline-flex shrink-0 text-muted [&_svg]:size-icon-sm">
            {spinning ? <ControlSpinner /> : <Search />}
          </span>
          <input
            ref={inputRef}
            type="search"
            aria-label={searchInputName(key, query, list)}
            aria-describedby={shownHint ? hintId : undefined}
            placeholder={info.placeholder}
            inputMode={inputMode}
            autoComplete="off"
            spellCheck={false}
            dir="auto"
            value={query}
            onChange={(event) => {
              const text = event.currentTarget.value;
              setQuery(text);
              if (hint) setHint(null);
              debounced.run(text);
            }}
            onKeyDown={onKeyDown}
            className={cn(BARE_INPUT, "text-fg [&::-webkit-search-cancel-button]:appearance-none")}
          />
          {query ? (
            <IconButton
              variant="in-field"
              icon={<X />}
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                debounced.cancel();
                fire("");
                inputRef.current?.focus();
              }}
            />
          ) : shortcut ? (
            <span className="pr-1.5">
              <Kbd decorative>/</Kbd>
            </span>
          ) : null}
        </div>
      </div>
      {shownHint ? (
        <p id={hintId} className="m-0 max-w-104 text-xs text-muted">
          {shownHint}
        </p>
      ) : null}
    </search>
  );
}
