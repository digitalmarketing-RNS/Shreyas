"use client";

import { Search, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ControlSpinner, IconButton } from "../icon-button";
import { Kbd } from "../primitives/kbd";
import { CONTROL_HEIGHT, CONTROL_TEXT, RING_FROM_INPUT, controlBox } from "./control-styles";
import { joinIds } from "./field-context";
import { useDebouncedCallback, useDelayedFlag } from "./hooks";
import { Select } from "./select";
import { SEARCH_SCOPES, type SearchScope, isSearchable, resolveScope } from "./search-scope";

export type SearchInputProps = {
  /** The accessible name, also the placeholder: "Search leads". */
  label: string;
  value?: string;
  defaultValue?: string;
  /** Runs 300 ms after typing stops, or at once on Enter, when the query is long enough for its scope. */
  onSearch?: (query: string, scope: SearchScope) => void;
  /** The list is fetching: the search icon becomes a spinner after 300 ms. */
  searching?: boolean;
  size?: "sm" | "md";
  /** Page search: show the "/" hint and focus on "/" (when single-key shortcuts are on). */
  shortcut?: boolean;
  /** S05: the scope picker on the left (Auto, Name, Email, Mobile, Lead no., API ID). */
  withScope?: boolean;
  scope?: SearchScope;
  defaultScope?: SearchScope;
  onScopeChange?: (scope: SearchScope) => void;
  /** Keep the query in the URL (?q=), so Back and reload keep it. */
  syncUrl?: boolean;
  /** Inside a popover, Esc on an empty field is left to close the popover. */
  inPopover?: boolean;
  disabled?: boolean;
  className?: string;
};

function isTextField(element: Element | null): boolean {
  if (!element) return false;
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) return true;
  if (element instanceof HTMLInputElement) return !["checkbox", "radio", "button", "submit", "reset", "file", "range", "color"].includes(element.type);
  return (element as HTMLElement).isContentEditable;
}

/**
 * Finds records in a list as you type, or searches inside a picker (components.md SearchInput).
 * A <search> landmark around <input type="search">; the label is its accessible name (the
 * placeholder repeats it but never names it). The result count is announced by the list's own
 * status region, not here.
 *
 * - 300 ms debounce; Enter searches at once. Name search starts at 2 characters; email, mobile and
 *   ID searches at any length. Scope "Auto" picks email, lead number, mobile, API ID or name from
 *   what was typed.
 * - Esc clears a non-empty field; on an empty field it does nothing (inside a popover, it closes
 *   the popover).
 * - "/" focuses the page search when focus is not in a text field.
 */
export function SearchInput({
  label,
  value,
  defaultValue = "",
  onSearch,
  searching = false,
  size = "sm",
  shortcut = false,
  withScope = false,
  scope: scopeProp,
  defaultScope = "auto",
  onScopeChange,
  syncUrl = false,
  inPopover = false,
  disabled = false,
  className,
}: SearchInputProps) {
  const base = useId();
  const hintId = `${base}-shortcut`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inner, setInner] = useState(defaultValue);
  const query = value ?? inner;
  const [innerScope, setInnerScope] = useState<SearchScope>(defaultScope);
  const scope = scopeProp ?? innerScope;
  const spinning = useDelayedFlag(searching, 300);

  const fire = (text: string, nextScope: SearchScope = scope) => {
    const trimmed = text.trim();
    if (syncUrl) {
      const url = new URL(window.location.href);
      if (trimmed) url.searchParams.set("q", trimmed);
      else url.searchParams.delete("q");
      window.history.replaceState(window.history.state, "", url);
    }
    if (!trimmed || isSearchable(trimmed, nextScope)) onSearch?.(trimmed, nextScope);
  };
  const debounced = useDebouncedCallback(fire, 300);

  const setQuery = (text: string) => {
    if (value === undefined) setInner(text);
    debounced.run(text);
  };

  // "/" focuses the page search when focus is not in a text field.
  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTextField(document.activeElement)) return;
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
    } else if (event.key === "Escape") {
      if (query === "") {
        if (!inPopover) event.preventDefault();
        return; // inside a popover the Esc reaches it and closes it
      }
      event.preventDefault();
      event.stopPropagation();
      if (value === undefined) setInner("");
      debounced.cancel();
      fire("");
    }
  };

  const detected = query.trim() ? resolveScope(query, scope) : null;

  return (
    <search className={cn("flex w-full min-w-0 items-stretch", CONTROL_HEIGHT[size], className)}>
      {withScope ? (
        <div className="w-28 shrink-0 [&_button]:rounded-r-none">
          <Select
            size={size}
            aria-label="Search in"
            options={SEARCH_SCOPES.map((option) => ({ value: option.value, label: option.label }))}
            value={scope}
            disabled={disabled}
            onValueChange={(next) => {
              const chosen = (next ?? "auto") as SearchScope;
              if (scopeProp === undefined) setInnerScope(chosen);
              onScopeChange?.(chosen);
              if (query.trim()) fire(query, chosen);
            }}
          />
        </div>
      ) : null}
      <div
        className={cn(
          "relative flex min-w-0 flex-1 items-center gap-2 pr-1",
          size === "sm" ? "pl-2.5" : "pl-3",
          CONTROL_TEXT[size],
          controlBox({ disabled }),
          RING_FROM_INPUT,
          withScope && "-ml-px rounded-l-none",
        )}
      >
        <span aria-hidden="true" className="inline-flex shrink-0 text-muted [&_svg]:size-icon-sm">
          {spinning ? <ControlSpinner /> : <Search />}
        </span>
        <input
          ref={inputRef}
          type="search"
          aria-label={label}
          aria-describedby={joinIds(shortcut && hintId)}
          placeholder={label}
          autoComplete="off"
          spellCheck={false}
          dir="auto"
          disabled={disabled}
          value={query}
          data-scope={detected ?? undefined}
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-fg placeholder:text-muted focus-visible:outline-none disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query ? (
          <IconButton
            variant="in-field"
            icon={<X />}
            aria-label="Clear search"
            disabled={disabled}
            onClick={() => {
              if (value === undefined) setInner("");
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
        {shortcut ? (
          <span id={hintId} className="sr-only">
            Press slash to search
          </span>
        ) : null}
      </div>
    </search>
  );
}
