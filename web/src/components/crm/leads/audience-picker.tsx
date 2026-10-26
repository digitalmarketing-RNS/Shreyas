"use client";

import { Combobox } from "@/components/ui/forms/combobox";
import { Field } from "@/components/ui/forms/field";
import type { SavedView } from "./saved-views";

/**
 * SavedViewPicker's audience variant (S16): a Combobox of saved filters with each one's match count,
 * used to choose a broadcast audience. It does not save or edit views.
 */
export function AudiencePicker({
  views,
  value,
  onValueChange,
  error,
}: {
  views: SavedView[];
  value: string | null;
  onValueChange: (id: string | null) => void;
  error?: string;
}) {
  return (
    <Field label="Audience" required error={error} hint="Each person sees only the leads their role allows; counts are for you.">
      <Combobox
        placeholder="Choose a saved filter"
        noun={{ one: "saved filter", other: "saved filters" }}
        value={value}
        onValueChange={onValueChange}
        options={views.map((view) => ({
          value: view.id,
          label: view.name,
          description: [view.matchCount, view.ownerName && !view.mine ? `Shared by ${view.ownerName}` : null].filter(Boolean).join(" · ") || undefined,
          group: view.builtIn ? "Built in" : view.mine ? "My views" : "Shared",
        }))}
      />
    </Field>
  );
}
