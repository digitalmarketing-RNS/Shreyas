"use client";

import { ChevronDown, X } from "lucide-react";
import { Popover } from "radix-ui";
import {
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";
import { Button } from "../button";
import { ControlSpinner, IconButton } from "../icon-button";
import { ConfirmPrompt } from "./confirm-prompt";
import { CONTROL_TEXT, GROUP_HEADING, OPTION_ACTIVE, OPTION_ROW, POPOVER_PANEL, TRUNCATE, controlBox } from "./control-styles";
import { useFieldControl } from "./field-context";
import { ComboboxOptionContent } from "./combobox-option";
import { useDebouncedCallback } from "./hooks";
import { matches } from "./text-match";

export type ComboboxOption = {
  value: string;
  label: string;
  /** A second line (role, campus, offset). Searched as well as the label. */
  description?: string;
  /** Group heading the option sits under. */
  group?: string;
  disabled?: boolean;
  /** A decorative avatar or icon before the label. */
  leading?: ReactNode;
};

/** The noun in messages: "No counsellor matches …", "Clear all counsellors". */
export type ComboboxNoun = { one: string; other: string };

type CommonProps = {
  /** Static options, filtered in the browser. */
  options?: ComboboxOption[];
  /** Server search: called 250 ms after typing stops, with a signal that cancels stale requests. */
  loadOptions?: (query: string, signal: AbortSignal) => Promise<ComboboxOption[]>;
  /** Async search starts at this many characters (1; use 2 for name search across more than 1,000 rows). */
  minQueryLength?: number;
  /** Labels for values chosen before the list loaded (async). */
  selectedOptions?: ComboboxOption[];
  /** "Search counsellors". */
  placeholder?: string;
  noun?: ComboboxNoun;
  size?: "sm" | "md";
  /** Hidden inputs carry the values to a form under this name. */
  name?: string;
  required?: boolean;
  disabled?: boolean;
  /** Chips without remove buttons, no input. */
  readOnly?: boolean;
  invalid?: boolean;
  /** Without a Field: the accessible name of the input and the list. */
  "aria-label"?: string;
  id?: string;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
};

export type ComboboxSingleProps = CommonProps & {
  multiple?: false;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  max?: never;
  dense?: never;
};

export type ComboboxMultiProps = CommonProps & {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** The most values that may be chosen; further options become aria-disabled. */
  max?: number;
  /** Filter bars (sm): the first chip and a "+3" summary chip. */
  dense?: boolean;
};

export type ComboboxProps = ComboboxSingleProps | ComboboxMultiProps;

const DEFAULT_NOUN: ComboboxNoun = { one: "option", other: "options" };

/** Classes for a still picture of the open list (the gallery draws states with them). */
export const comboboxPopoverClassName = cn(POPOVER_PANEL, "flex flex-col overflow-hidden");
export const comboboxStatusLineClassName = "border-b border-border px-2 py-1.5 text-xs text-muted";

/**
 * Pick one or many values from a long or searchable list (components.md Combobox): counsellors,
 * programmes, time zones, templates. The ARIA 1.2 combobox pattern with aria-activedescendant:
 * focus stays in the input; Radix Popover places the list under the control box.
 *
 * Keyboard. Input: typing filters and opens; ArrowDown/ArrowUp open and move; Alt+ArrowDown opens
 * without moving; Enter chooses (multi: toggles, the list stays open); Esc closes, a second Esc
 * clears the query; Tab closes without choosing. Chips (multi): Backspace in an empty input moves
 * to the last chip; ArrowLeft and ArrowRight move between chips and back to the input; Backspace or
 * Delete removes the focused chip. The toggle button is pointer-only; Clear all is a tab stop.
 *
 * Built on React state rather than Downshift, which is not installed yet (open question 1); the
 * ARIA and keys follow the same pattern.
 */
export function Combobox(props: ComboboxProps) {
  const {
    options = [],
    loadOptions,
    minQueryLength = 1,
    selectedOptions = [],
    placeholder,
    noun = DEFAULT_NOUN,
    size = "md",
    name,
    "aria-label": ariaLabel,
    className,
    inputRef,
  } = props;
  const multiple = props.multiple === true;
  const max = props.multiple ? props.max : undefined;
  const dense = props.multiple ? Boolean(props.dense) : false;

  const control = useFieldControl({
    id: props.id,
    required: props.required,
    disabled: props.disabled,
    readOnly: props.readOnly,
    invalid: props.invalid,
  });
  const base = useId();
  const listboxId = `${base}-listbox`;
  const optionId = (index: number) => `${base}-option-${index}`;
  const inputId = control.id ?? `${base}-input`;

  // -- value ---------------------------------------------------------------------------------------
  const toArray = (value: string | string[] | null | undefined): string[] =>
    value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];
  const [innerValue, setInnerValue] = useState<string[]>(() => toArray(props.defaultValue));
  const controlled = props.value !== undefined;
  const selected = controlled ? toArray(props.value) : innerValue;
  const onValueChangeRef = useRef(props.onValueChange);
  useEffect(() => {
    onValueChangeRef.current = props.onValueChange;
  });
  const setSelected = useCallback(
    (next: string[]) => {
      if (!controlled) setInnerValue(next);
      const callback = onValueChangeRef.current as ((value: string[] | string | null) => void) | undefined;
      callback?.(multiple ? next : (next[0] ?? null));
    },
    [controlled, multiple],
  );

  // Every option seen so far, so chips keep their labels when an async list changes.
  const [known, setKnown] = useState<Record<string, ComboboxOption>>(() =>
    Object.fromEntries([...options, ...selectedOptions].map((option) => [option.value, option])),
  );
  // The current options win, so a label that changes (a zone's offset on another date) stays fresh.
  const lookup = (value: string): ComboboxOption => options.find((o) => o.value === value) ?? known[value] ?? { value, label: value };
  const chosenLabel = !multiple && selected[0] !== undefined ? lookup(selected[0]).label : "";

  // -- input and list state ------------------------------------------------------------------------
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(chosenLabel);
  const [filtering, setFiltering] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const ownInputRef = useRef<HTMLInputElement | null>(null);
  const composedInputRef = useMemo(() => mergeRefs(inputRef, ownInputRef), [inputRef]);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  // The input shows the chosen label in single mode until the person types over it.
  const shownText = !multiple && !filtering ? chosenLabel : text;
  const query = filtering ? text : "";

  // -- async ---------------------------------------------------------------------------------------
  const [asyncState, setAsyncState] = useState<{ results: ComboboxOption[]; loading: boolean; error: boolean; searched: string | null }>({
    results: [],
    loading: false,
    error: false,
    searched: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const runSearch = useCallback(
    (term: string) => {
      if (!loadOptions) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setAsyncState((state) => ({ ...state, loading: true, error: false }));
      setAnnouncement("Searching…");
      loadOptions(term, controller.signal).then(
        (results) => {
          if (controller.signal.aborted) return;
          setKnown((previous) => ({ ...previous, ...Object.fromEntries(results.map((option) => [option.value, option])) }));
          setAsyncState({ results, loading: false, error: false, searched: term });
          setActiveIndex(results.length > 0 ? 0 : -1);
          setAnnouncement(results.length === 0 ? noMatchText(noun, term) : resultCountText(results.length));
        },
        () => {
          if (controller.signal.aborted) return;
          setAsyncState((state) => ({ ...state, loading: false, error: true }));
          setAnnouncement("Couldn't load the list.");
        },
      );
    },
    [loadOptions, noun],
  );
  const debouncedSearch = useDebouncedCallback(runSearch, 250);
  useEffect(() => () => abortRef.current?.abort(), []);

  // -- visible options -----------------------------------------------------------------------------
  const visible = useMemo(() => {
    if (loadOptions) return asyncState.results;
    if (!query.trim()) return options;
    return options.filter((option) => matches(option.label, query) || (option.description ? matches(option.description, query) : false));
  }, [loadOptions, asyncState.results, options, query]);

  const atLimit = max !== undefined && selected.length >= max;
  const isBlocked = (option: ComboboxOption) => Boolean(option.disabled) || (atLimit && !selected.includes(option.value));

  // Count announcements, a moment after the list settles.
  const announceCount = useDebouncedCallback((count: number, term: string) => {
    setAnnouncement(count === 0 ? noMatchText(noun, term) : resultCountText(count));
  }, 500);

  // Keep the active option in view.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: "nearest" });
    // optionId is derived from base, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex]);

  // -- actions -------------------------------------------------------------------------------------
  const openList = (moveTo: "first" | "last" | "chosen" | "none") => {
    setOpen(true);
    if (moveTo === "none") return setActiveIndex(-1);
    if (moveTo === "last") return setActiveIndex(visible.length - 1);
    if (moveTo === "chosen" && selected.length > 0) {
      const index = visible.findIndex((option) => option.value === selected[selected.length - 1]);
      if (index >= 0) return setActiveIndex(index);
    }
    setActiveIndex(visible.length > 0 ? 0 : -1);
  };

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const choose = (option: ComboboxOption) => {
    if (isBlocked(option)) {
      if (!option.disabled && max !== undefined) {
        // The same words again: a no-break space makes the region read them once more.
        const message = limitText(max, noun);
        setAnnouncement((previous) => (previous === message ? `${message}\u00a0` : message));
      }
      return;
    }
    setKnown((previous) => ({ ...previous, [option.value]: option }));
    if (!multiple) {
      setSelected([option.value]);
      setText(option.label);
      setFiltering(false);
      close();
      return;
    }
    const isChosen = selected.includes(option.value);
    const next = isChosen ? selected.filter((value) => value !== option.value) : [...selected, option.value];
    setSelected(next);
    setAnnouncement(`${option.label} ${isChosen ? "removed" : "added"}.`);
  };

  const removeAt = (index: number) => {
    const value = selected[index];
    if (value === undefined) return;
    const next = selected.filter((_, i) => i !== index);
    setSelected(next);
    setAnnouncement(`${lookup(value).label} removed.`);
    // Focus the chip that took its place, or the input.
    window.requestAnimationFrame(() => {
      const target = chipRefs.current[index] ?? null;
      if (target && index < next.length) target.focus();
      else ownInputRef.current?.focus();
    });
  };

  const clearAll = () => {
    setSelected([]);
    setText("");
    setFiltering(false);
    setAnnouncement(multiple ? `All ${noun.other} removed.` : `${noun.one[0].toUpperCase()}${noun.one.slice(1)} cleared.`);
    ownInputRef.current?.focus();
  };

  const onTextChange = (next: string) => {
    setText(next);
    setFiltering(true);
    setOpen(true);
    if (loadOptions) {
      if (next.trim().length >= minQueryLength) debouncedSearch.run(next.trim());
      else {
        debouncedSearch.cancel();
        abortRef.current?.abort();
        setAsyncState({ results: [], loading: false, error: false, searched: null });
      }
      return;
    }
    const count = next.trim()
      ? options.filter((option) => matches(option.label, next) || (option.description ? matches(option.description, next) : false)).length
      : options.length;
    setActiveIndex(count > 0 ? 0 : -1);
    announceCount.run(count, next.trim());
  };

  const restoreText = () => {
    if (!multiple) {
      setText(chosenLabel);
      setFiltering(false);
    }
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openList(event.altKey ? "none" : "chosen");
        else if (!event.altKey) setActiveIndex((index) => (visible.length === 0 ? -1 : (index + 1) % visible.length));
        return;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openList("last");
        else setActiveIndex((index) => (visible.length === 0 ? -1 : index <= 0 ? visible.length - 1 : index - 1));
        return;
      case "Enter":
        if (open && activeIndex >= 0 && visible[activeIndex]) {
          event.preventDefault();
          choose(visible[activeIndex]);
        }
        return;
      case "Escape":
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          close();
          return;
        }
        if (multiple ? text !== "" : filtering) {
          event.preventDefault();
          event.stopPropagation();
          if (multiple) setText("");
          else restoreText();
          setFiltering(false);
        }
        return;
      case "Tab":
        if (open) close();
        return;
      case "Backspace":
        if (multiple && input.value === "" && selected.length > 0 && !dense) {
          event.preventDefault();
          chipRefs.current[selected.length - 1]?.focus();
        }
        return;
      case "ArrowLeft":
        if (multiple && input.selectionStart === 0 && input.selectionEnd === 0 && selected.length > 0 && !dense) {
          event.preventDefault();
          chipRefs.current[selected.length - 1]?.focus();
        }
        return;
      default:
        return;
    }
  };

  const onChipKeyDown = (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        chipRefs.current[Math.max(0, index - 1)]?.focus();
        return;
      case "ArrowRight":
        event.preventDefault();
        if (index + 1 < selected.length) chipRefs.current[index + 1]?.focus();
        else ownInputRef.current?.focus();
        return;
      case "Backspace":
      case "Delete":
        event.preventDefault();
        removeAt(index);
        return;
      default:
        return;
    }
  };

  // -- status line (visible, aria-hidden) -----------------------------------------------------------
  const term = query.trim();
  let statusLine: { text: string; strong?: boolean } | null = null;
  if (loadOptions && asyncState.loading && asyncState.results.length === 0) statusLine = { text: "Searching…" };
  else if (loadOptions && !asyncState.error && term.length < minQueryLength && asyncState.results.length === 0) {
    statusLine = { text: minQueryLength > 1 ? `Type at least ${minQueryLength} characters to search.` : "Type to search." };
  } else if (!asyncState.error && visible.length === 0 && term) statusLine = { text: noMatchText(noun, term) };
  else if (multiple && max !== undefined) {
    statusLine = atLimit
      ? { text: `${selected.length} of ${max} chosen. Remove one to add another.`, strong: true }
      : { text: `${selected.length} of ${max} chosen` };
  } else if (loadOptions && asyncState.loading) statusLine = { text: "Searching…" };

  // -- render ----------------------------------------------------------------------------------------
  const interactive = !control.disabled && !control.readOnly;
  const chips = multiple ? selected.map(lookup) : [];
  const shownChips = dense ? chips.slice(0, 1) : chips;
  const hiddenCount = chips.length - shownChips.length;
  const listLabelledBy = ariaLabel ? undefined : control.field?.labelId;
  const clearName = multiple ? `Clear all ${noun.other}` : `Clear ${noun.one}`;

  const hiddenInputs = name
    ? selected.map((value) => <input key={value} type="hidden" name={name} value={value} disabled={control.disabled} />)
    : null;

  if (control.readOnly) {
    return (
      <div id={inputId} aria-describedby={control.describedBy} className={cn("flex flex-wrap gap-1 text-sm", className)}>
        {multiple ? (
          chips.length > 0 ? (
            chips.map((option) => <Chip key={option.value} label={option.label} />)
          ) : (
            <span className="text-muted">None</span>
          )
        ) : (
          <span className={cn("text-fg", TRUNCATE)}>{chosenLabel || "None"}</span>
        )}
        {hiddenInputs}
      </div>
    );
  }

  return (
    <div className={cn("flex w-full min-w-0 flex-col", className)}>
      <Popover.Root open={open && interactive} onOpenChange={(next) => (next ? setOpen(true) : close())} modal={false}>
        <Popover.Anchor asChild>
          <div
            ref={anchorRef}
            className={cn(
              "flex w-full items-start gap-1 py-0.5 pr-1 pl-1",
              size === "sm" ? "min-h-control-sm" : "min-h-control-md",
              CONTROL_TEXT[size],
              controlBox({ invalid: control.invalid, disabled: control.disabled }),
              "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus-ring has-[input:focus-visible]:outline-solid",
            )}
          >
            <div className={cn("flex min-w-0 flex-1 flex-wrap items-center gap-1", multiple && "max-h-24 overflow-y-auto")}>
              {shownChips.map((option, index) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  removeButton={
                    interactive ? (
                      <button
                        ref={(node) => {
                          chipRefs.current[index] = node;
                        }}
                        type="button"
                        tabIndex={-1}
                        aria-label={`Remove ${option.label}`}
                        onClick={() => removeAt(index)}
                        onKeyDown={onChipKeyDown(index)}
                        className="inline-flex size-hit shrink-0 items-center justify-center rounded-sm text-muted transition-colors duration-fast hover:bg-surface-hover hover:text-fg"
                      >
                        <X aria-hidden="true" className="size-icon-sm" />
                      </button>
                    ) : null
                  }
                />
              ))}
              {hiddenCount > 0 ? (
                <span className="inline-flex h-chip shrink-0 items-center rounded-sm bg-accent-subtle px-2 text-xs font-medium text-fg tabular-nums">
                  <span aria-hidden="true">+{hiddenCount}</span>
                  <span className="sr-only">and {hiddenCount} more</span>
                </span>
              ) : null}
              <input
                ref={composedInputRef}
                id={inputId}
                type="text"
                role="combobox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={open && activeIndex >= 0 && visible[activeIndex] ? optionId(activeIndex) : undefined}
                aria-describedby={control.describedBy}
                aria-invalid={control.invalid || undefined}
                aria-required={control.required || undefined}
                aria-label={ariaLabel}
                autoComplete="off"
                spellCheck={false}
                dir="auto"
                disabled={control.disabled}
                placeholder={chips.length === 0 ? placeholder : undefined}
                value={shownText}
                onChange={(event) => onTextChange(event.currentTarget.value)}
                onKeyDown={onInputKeyDown}
                onClick={() => {
                  if (!open) openList("chosen");
                }}
                onBlur={(event) => {
                  const next = event.relatedTarget as Node | null;
                  if (next && anchorRef.current?.contains(next)) return;
                  if (next && listRef.current?.contains(next)) return;
                  restoreText();
                }}
                className={cn(
                  "min-w-20 flex-1 bg-transparent text-fg placeholder:text-muted focus-visible:outline-none disabled:cursor-not-allowed",
                  size === "sm" ? "h-7 px-1.5" : "h-8.5 px-2",
                )}
              />
            </div>
            <div className="flex h-full shrink-0 items-center self-center">
              {loadOptions && asyncState.loading ? (
                <span aria-hidden="true" className="inline-flex size-control-xs items-center justify-center text-muted [&_svg]:size-icon-sm">
                  <ControlSpinner />
                </span>
              ) : null}
              {interactive && selected.length > 0 ? (
                <IconButton
                  variant="in-field"
                  icon={<X />}
                  aria-label={clearName}
                  onClick={() => {
                    if (multiple && selected.length > 10) setConfirmClear(true);
                    else clearAll();
                  }}
                />
              ) : null}
              <button
                type="button"
                tabIndex={-1}
                aria-label={`Show ${noun.other}`}
                disabled={control.disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (open) close();
                  else openList("chosen");
                  ownInputRef.current?.focus();
                }}
                className="inline-flex size-control-xs items-center justify-center rounded-sm text-muted hover:bg-surface-hover hover:text-fg disabled:cursor-not-allowed"
              >
                <ChevronDown aria-hidden="true" className="size-icon-sm" />
              </button>
            </div>
          </div>
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            role="presentation"
            align="start"
            sideOffset={4}
            collisionPadding={8}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            onInteractOutside={(event) => {
              if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
            }}
            className={cn(comboboxPopoverClassName, "max-h-[min(20rem,var(--radix-popover-content-available-height))] w-(--radix-popover-trigger-width)")}
          >
            {statusLine ? (
              <div aria-hidden="true" className={cn(comboboxStatusLineClassName, statusLine.strong && "font-medium text-fg")}>
                {statusLine.text}
              </div>
            ) : null}
            {asyncState.error ? (
              <div className="flex flex-wrap items-center gap-x-2 border-b border-border px-2 py-1.5 text-xs text-fg">
                <span>Couldn&apos;t load the list.</span>
                <Button variant="link" onMouseDown={(event) => event.preventDefault()} onClick={() => runSearch(term)}>
                  Retry
                </Button>
              </div>
            ) : null}
            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-labelledby={listLabelledBy}
              aria-label={ariaLabel}
              aria-multiselectable={multiple || undefined}
              className="min-h-0 flex-1 overflow-y-auto p-1"
            >
              <OptionList
                options={visible}
                query={query}
                multiple={multiple}
                selected={selected}
                activeIndex={activeIndex}
                optionId={optionId}
                isBlocked={isBlocked}
                onHover={setActiveIndex}
                onChoose={choose}
              />
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <span role="status" className="sr-only">
        {announcement}
      </span>
      {hiddenInputs}
      <ConfirmPrompt
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title={`Clear all ${selected.length} ${noun.other}?`}
        description={`You'll need to choose the ${noun.other} again.`}
        confirmLabel="Clear all"
        onConfirm={clearAll}
      />
    </div>
  );
}

function OptionList({
  options,
  query,
  multiple,
  selected,
  activeIndex,
  optionId,
  isBlocked,
  onHover,
  onChoose,
}: {
  options: ComboboxOption[];
  query: string;
  multiple: boolean;
  selected: string[];
  activeIndex: number;
  optionId: (index: number) => string;
  isBlocked: (option: ComboboxOption) => boolean;
  onHover: (index: number) => void;
  onChoose: (option: ComboboxOption) => void;
}) {
  // Options keep their order; a heading starts each run of a new group.
  const runs: Array<{ group?: string; items: Array<{ option: ComboboxOption; index: number }> }> = [];
  options.forEach((option, index) => {
    const last = runs[runs.length - 1];
    if (last && last.group === option.group) last.items.push({ option, index });
    else runs.push({ group: option.group, items: [{ option, index }] });
  });

  const renderOption = ({ option, index }: { option: ComboboxOption; index: number }) => {
    const chosen = selected.includes(option.value);
    const blocked = isBlocked(option);
    return (
      <div
        key={option.value}
        id={optionId(index)}
        role="option"
        aria-selected={index === activeIndex}
        aria-checked={multiple ? chosen : undefined}
        aria-disabled={blocked || undefined}
        onMouseDown={(event) => event.preventDefault()}
        onMouseMove={() => {
          if (index !== activeIndex) onHover(index);
        }}
        onClick={() => onChoose(option)}
        className={cn(
          OPTION_ROW,
          option.description && "min-h-12 py-1.5",
          index === activeIndex && OPTION_ACTIVE,
          blocked && "cursor-not-allowed text-muted",
        )}
      >
        <ComboboxOptionContent option={option} query={query} multiple={multiple} chosen={chosen} />
      </div>
    );
  };

  return (
    <>
      {runs.map((run, runIndex) =>
        run.group ? (
          <div key={`${run.group}-${runIndex}`} role="group" aria-labelledby={`${optionId(run.items[0].index)}-group`}>
            <div id={`${optionId(run.items[0].index)}-group`} role="presentation" className={GROUP_HEADING}>
              {run.group}
            </div>
            {run.items.map(renderOption)}
          </div>
        ) : (
          run.items.map(renderOption)
        ),
      )}
    </>
  );
}

function Chip({ label, removeButton }: { label: string; removeButton?: ReactNode }) {
  return (
    <span className={cn("inline-flex h-chip max-w-full min-w-0 shrink-0 items-center rounded-sm bg-accent-subtle text-xs text-fg", removeButton ? "pl-2" : "px-2")}>
      <span dir="auto" className={TRUNCATE}>
        {label}
      </span>
      {removeButton}
    </span>
  );
}

function noMatchText(noun: ComboboxNoun, term: string): string {
  return `No ${noun.one} matches “${term}”.`;
}

function resultCountText(count: number): string {
  return `${count} ${count === 1 ? "result" : "results"}`;
}

function limitText(max: number, noun: ComboboxNoun): string {
  return `${max} of ${max} chosen. Remove one to add another ${noun.one}.`;
}
