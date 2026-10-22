"use client";

import { type MouseEvent, type ReactNode, useId, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Checkbox } from "./checkbox";
import { FieldGroup } from "./field-group";
import { useControllableState, useIsClient } from "./hooks";
import { TextInput } from "./text-input";
import { matches } from "./text-match";

export type CheckboxGroupOption = {
  value: string;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
  /** Parent heading in a long list (S01 programme lists are grouped under their picklist parents). */
  group?: string;
  lang?: string;
};

export type CheckboxGroupProps = {
  legend: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  name?: string;
  options: CheckboxGroupOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** At most this many: a counter shows, and the unchecked boxes become aria-disabled at the max. */
  max?: number;
  required?: boolean;
  disabled?: boolean;
  /** vertical (default) or horizontal (3 or fewer short labels). */
  orientation?: "vertical" | "horizontal";
  surface?: "staff" | "public";
  /** The noun of the long-list filter: "Filter programmes", "8 of 40 programmes shown". */
  noun?: { one: string; other: string };
  className?: string;
};

const FILTER_FROM = 13; // more than 12 options

/**
 * Choose any number of options from a visible list (components.md Checkbox, group variants):
 * fieldset > legend > hint > counter (with max) > rows > error.
 *
 * - With max: the counter ("2 of 3 chosen", role="status") updates as boxes change; at the max the
 *   unchecked boxes get aria-disabled and point at the limit note, and a click on one is prevented
 *   while the status says why. Without JavaScript the boxes stay enabled and the server returns the
 *   same words as a field error.
 * - Long lists (more than 12): without JavaScript every row shows, grouped under its parent
 *   heading. With JavaScript a "Filter programmes" input hides rows that do not match; ticked rows
 *   always stay visible. The rows stay native checkboxes.
 */
export function CheckboxGroup({
  legend,
  hint,
  error,
  name,
  options,
  value,
  defaultValue = [],
  onValueChange,
  max,
  required = false,
  disabled = false,
  orientation = "vertical",
  surface,
  noun = { one: "option", other: "options" },
  className,
}: CheckboxGroupProps) {
  const [chosen, setChosen] = useControllableState(value, defaultValue, onValueChange);
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState("");
  const isClient = useIsClient();
  const limitNoteId = useId();
  const isPublic = surface === "public";

  const atMax = max !== undefined && chosen.length >= max;
  const filterable = options.length >= FILTER_FROM;
  const term = filter.trim();
  const isShown = (option: CheckboxGroupOption) => !term || chosen.includes(option.value) || matches(option.label, term);
  const shownCount = options.filter(isShown).length;

  const limitNote = max !== undefined ? `You can choose up to ${max}. Untick one to choose another.` : "";
  const counterText = max !== undefined ? `${chosen.length} of ${max} chosen` : null;

  const toggle = (option: CheckboxGroupOption, checked: boolean) => {
    const next = checked ? [...chosen, option.value] : chosen.filter((v) => v !== option.value);
    setChosen(next);
    setStatus("");
  };

  const blockAtMax = (option: CheckboxGroupOption) => (event: MouseEvent<HTMLInputElement>) => {
    if (atMax && !chosen.includes(option.value)) {
      event.preventDefault();
      setStatus((previous) => (previous === limitNote ? `${limitNote} ` : limitNote));
    }
  };

  // Rows in their groups; a group heading becomes a nested fieldset (it works without JavaScript).
  const groups = useMemo(() => {
    const map = new Map<string, CheckboxGroupOption[]>();
    for (const option of options) {
      const key = option.group ?? "";
      map.set(key, [...(map.get(key) ?? []), option]);
    }
    return [...map.entries()];
  }, [options]);

  const renderRows = (rows: CheckboxGroupOption[]) => (
    <div
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row flex-wrap gap-x-6 gap-y-1" : "flex-col",
        orientation === "vertical" && (isPublic ? "gap-1" : "gap-1"),
      )}
    >
      {rows.map((option) => {
        const blocked = atMax && !chosen.includes(option.value);
        return (
          <div key={option.value} hidden={isClient && filterable && !isShown(option)}>
            <Checkbox
              name={name}
              value={option.value}
              label={<span lang={option.lang}>{option.label}</span>}
              description={option.description}
              surface={surface}
              checked={chosen.includes(option.value)}
              disabled={option.disabled}
              aria-disabled={blocked || undefined}
              aria-describedby={blocked ? limitNoteId : undefined}
              required={required && chosen.length === 0 ? undefined : undefined}
              onClick={blockAtMax(option)}
              onChange={(event) => toggle(option, event.currentTarget.checked)}
            />
          </div>
        );
      })}
    </div>
  );

  const counter =
    counterText !== null || (isClient && filterable) ? (
      <div className="flex flex-col gap-2">
        {isClient && filterable ? (
          <FilterBox noun={noun} value={filter} onChange={setFilter} surface={surface} shown={shownCount} total={options.length} />
        ) : null}
        {counterText !== null ? (
          <p role="status" className={cn("m-0", isPublic ? "text-base" : "text-sm", atMax ? "font-medium text-fg" : "text-muted")}>
            {status ? `${counterText}. ${status}` : counterText}
          </p>
        ) : null}
      </div>
    ) : null;

  return (
    <FieldGroup
      legend={legend}
      hint={hint}
      error={error}
      name={name}
      required={required}
      disabled={disabled}
      surface={surface}
      meta={counter}
      className={className}
    >
      {max !== undefined ? (
        <span id={limitNoteId} hidden>
          {limitNote}
        </span>
      ) : null}
      {groups.length === 1 && groups[0][0] === ""
        ? renderRows(groups[0][1])
        : groups.map(([heading, rows]) =>
            heading ? (
              <fieldset
                key={heading}
                hidden={isClient && filterable && !rows.some(isShown)}
                className="m-0 mt-3 min-w-0 border-0 p-0 first:mt-0"
              >
                <legend className={cn("p-0 font-medium text-muted", isPublic ? "text-sm" : "text-xs")}>{heading}</legend>
                <div className="mt-1">{renderRows(rows)}</div>
              </fieldset>
            ) : (
              <div key="ungrouped">{renderRows(rows)}</div>
            ),
          )}
      {isClient && filterable && term && shownCount === 0 ? (
        <p className={cn("m-0 text-muted", isPublic ? "text-base" : "text-sm")}>
          No {noun.one} matches “{term}”.
        </p>
      ) : null}
    </FieldGroup>
  );
}

function FilterBox({
  noun,
  value,
  onChange,
  surface,
  shown,
  total,
}: {
  noun: { one: string; other: string };
  value: string;
  onChange: (value: string) => void;
  surface?: "staff" | "public";
  shown: number;
  total: number;
}) {
  const id = useId();
  const isPublic = surface === "public";
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={cn("font-medium text-fg", isPublic ? "text-sm" : "text-xs")}>
        Filter {noun.other}
      </label>
      <TextInput
        id={id}
        size={isPublic ? "lg" : "sm"}
        value={value}
        onValueChange={onChange}
        clearable
        clearLabel="Clear filter"
        autoComplete="off"
        className="max-w-80"
      />
      <span role="status" className="sr-only">
        {value.trim() ? `${shown} of ${total} ${noun.other} shown.` : ""}
      </span>
    </div>
  );
}
