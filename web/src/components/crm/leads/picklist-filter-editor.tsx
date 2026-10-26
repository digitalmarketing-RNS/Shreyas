"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/forms/checkbox";
import { SearchInput } from "@/components/ui/forms/search-input";
import { matches } from "@/components/ui/forms/text-match";
import type { QuickFilterDef } from "./quick-filters";

/**
 * The value editor for picklists, stages and owners in a quick filter chip: a checkbox list with a
 * search field (more than 7 options), "Select all" and "Clear". Owners start with "Me", "My team"
 * and "Unassigned".
 */
export function PicklistFilterEditor({
  def,
  values,
  onValuesChange,
}: {
  def: QuickFilterDef;
  values: string[];
  onValuesChange: (values: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const options = def.options ?? [];
  const visible = query ? options.filter((option) => matches(option.label, query)) : options;
  return (
    <div className="flex flex-col gap-2">
      {options.length > 7 ? (
        <SearchInput label={def.searchPlaceholder ?? `Find a ${def.label.toLowerCase()}`} size="sm" inPopover onSearch={setQuery} />
      ) : null}
      <div className="flex items-center gap-3">
        <Button variant="link" onClick={() => onValuesChange(options.map((option) => option.value))}>
          Select all
        </Button>
        <Button variant="link" onClick={() => onValuesChange([])}>
          Clear
        </Button>
      </div>
      <ul aria-label={def.label} className="m-0 flex max-h-72 list-none flex-col overflow-auto p-0">
        {visible.length === 0 ? (
          <li className="py-1.5 text-sm text-muted">{`No ${def.label.toLowerCase()} matches "${query}".`}</li>
        ) : (
          visible.map((option) => (
            <li key={option.value}>
              <Checkbox
                label={option.label}
                checked={values.includes(option.value)}
                onChange={(event) =>
                  onValuesChange(event.currentTarget.checked ? [...values, option.value] : values.filter((value) => value !== option.value))
                }
              />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
