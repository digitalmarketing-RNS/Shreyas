"use client";

import { RadioGroup } from "@/components/ui/forms/radio-group";

/** The value editor for yes or no fields in a quick filter chip: "Yes", "No", "Any". */
export function YesNoFilterEditor({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: "yes" | "no" | "any";
  onValueChange: (value: "yes" | "no" | "any") => void;
}) {
  return (
    <RadioGroup
      legend={label}
      legendHidden
      name={`yes-no-${label}`}
      variant="inline"
      value={value}
      onValueChange={(next) => onValueChange(next as "yes" | "no" | "any")}
      options={[
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "any", label: "Any" },
      ]}
    />
  );
}
