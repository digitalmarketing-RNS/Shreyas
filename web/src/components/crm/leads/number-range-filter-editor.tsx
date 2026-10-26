"use client";

import { CircleAlert } from "lucide-react";
import { useId } from "react";
import { Field } from "@/components/ui/forms/field";
import { NumberStepper } from "@/components/ui/forms/number-stepper";

/**
 * The value editor for number fields in a quick filter chip: "From" and "To". When "from" is above
 * "to" an inline error shows and that range is not applied.
 */
export function NumberRangeFilterEditor({
  label,
  from,
  to,
  min = 0,
  max = 100,
  error,
  onChange,
}: {
  label: string;
  from: number | null;
  to: number | null;
  min?: number;
  max?: number;
  error: string | null;
  onChange: (range: { from: number | null; to: number | null }) => void;
}) {
  const errorId = useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="From">
          <NumberStepper size="sm" min={min} max={max} valueName={`lowest ${label.toLowerCase()}`} value={from} onValueChange={(next) => onChange({ from: next, to })} invalid={Boolean(error)} />
        </Field>
        <Field label="To">
          <NumberStepper size="sm" min={min} max={max} valueName={`highest ${label.toLowerCase()}`} value={to} onValueChange={(next) => onChange({ from, to: next })} invalid={Boolean(error)} />
        </Field>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="m-0 flex items-start gap-1 text-xs text-danger">
          <CircleAlert aria-hidden="true" className="mt-px size-icon-sm shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
