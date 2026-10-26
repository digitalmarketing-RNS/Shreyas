"use client";

import { DateRangePicker } from "@/components/ui/forms/date-range-picker";
import { RadioGroup } from "@/components/ui/forms/radio-group";
import { formatDateRange } from "@/lib/format";
import { DATE_PRESETS, type DatePreset, type QuickFilterValue } from "./quick-filters";

type DateValue = Extract<QuickFilterValue, { type: "date" }>;

/**
 * The value editor for date fields in a quick filter chip: the presets "Today", "Last 7 days",
 * "This month" and "Custom"; Custom reveals a date range (calendar only, as list filters use it).
 */
export function DateFilterEditor({
  label,
  value,
  onValueChange,
  today,
}: {
  label: string;
  value: DateValue | undefined;
  onValueChange: (value: DateValue | undefined) => void;
  /** Today in the institution's zone (ISO). */
  today?: string;
}) {
  return (
    <RadioGroup
      legend={label}
      legendHidden
      name={`date-${label}`}
      value={value?.preset ?? ""}
      onValueChange={(preset) => onValueChange({ type: "date", preset: preset as DatePreset })}
      options={DATE_PRESETS.map((preset) => ({
        value: preset.value,
        label: preset.label,
        reveal:
          preset.value === "custom" ? (
            <DateRangePicker
              presets={false}
              today={today}
              value={value?.from && value.to ? { from: value.from, to: value.to, compare: null } : null}
              onValueChange={(range) =>
                onValueChange(range
                  ? { type: "date", preset: "custom", from: range.from, to: range.to, label: formatDateRange(range.from, range.to) }
                  : { type: "date", preset: "custom" })
              }
            />
          ) : undefined,
      }))}
    />
  );
}
