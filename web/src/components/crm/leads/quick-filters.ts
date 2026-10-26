/**
 * Quick filter fields and values (components.md, QuickFilterBar and QuickFilterManager). Filters
 * live in the URL, so Back undoes them and links can be shared; these types are what the page
 * reads from and writes to it.
 */

export type QuickFilterType = "picklist" | "owner" | "date" | "yesno" | "number";

export type QuickFilterOption = { value: string; label: string };

export type QuickFilterDef = {
  id: string;
  /** "Stage", "Owner", "Created". */
  label: string;
  type: QuickFilterType;
  /** Picklists, stages, owners (owners start with "Me", "My team", "Unassigned"). */
  options?: QuickFilterOption[];
  /** "Find a stage", "Find a person". */
  searchPlaceholder?: string;
  /** An admin removed the field: the chip says "Field removed" and offers only remove. */
  removed?: boolean;
  /** QuickFilterManager's groups. */
  group?: "Standard fields" | "Your fields" | "Activity";
};

export type DatePreset = "today" | "last7" | "thisMonth" | "custom";

export const DATE_PRESETS: ReadonlyArray<{ value: DatePreset; label: string }> = [
  { value: "today", label: "Today" },
  { value: "last7", label: "Last 7 days" },
  { value: "thisMonth", label: "This month" },
  { value: "custom", label: "Custom" },
];

export type QuickFilterValue =
  | { type: "list"; values: string[] }
  | { type: "date"; preset: DatePreset; from?: string; to?: string; label?: string }
  | { type: "yesno"; value: "yes" | "no" | "any" }
  | { type: "number"; from: number | null; to: number | null };

export type QuickFilterValues = Record<string, QuickFilterValue | undefined>;

export function isActive(value: QuickFilterValue | undefined): value is QuickFilterValue {
  if (!value) return false;
  switch (value.type) {
    case "list":
      return value.values.length > 0;
    case "date":
      return value.preset !== "custom" || Boolean(value.from && value.to);
    case "yesno":
      return value.value !== "any";
    case "number":
      return value.from !== null || value.to !== null;
  }
}

/** The number "from" above "to" is not applied. */
export function rangeError(value: QuickFilterValue | undefined): string | null {
  if (value?.type === "number" && value.from !== null && value.to !== null && value.from > value.to) {
    return 'The "from" number is bigger than the "to" number.';
  }
  return null;
}

/** The value summary after the label: "Interested, Applied", "Interested +2", "Last 7 days", "Yes". */
export function summarise(def: QuickFilterDef, value: QuickFilterValue | undefined): string | null {
  if (!isActive(value)) return null;
  switch (value.type) {
    case "list": {
      const labels = value.values.map((choice) => def.options?.find((option) => option.value === choice)?.label ?? choice);
      return labels.length <= 2 ? labels.join(", ") : `${labels[0]} +${labels.length - 1}`;
    }
    case "date":
      return value.preset === "custom" ? (value.label ?? `${value.from} to ${value.to}`) : (DATE_PRESETS.find((preset) => preset.value === value.preset)?.label ?? null);
    case "yesno":
      return value.value === "yes" ? "Yes" : "No";
    case "number":
      if (value.from !== null && value.to !== null) return `${value.from} to ${value.to}`;
      return value.from !== null ? `${value.from} or more` : `${value.to} or less`;
  }
}

/** At most 8 quick filters (QuickFilterManager enforces it). */
export const MAX_QUICK_FILTERS = 8;
