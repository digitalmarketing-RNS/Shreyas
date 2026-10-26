"use client";

import { X } from "lucide-react";
import type { FocusEvent, Ref } from "react";
import { Combobox } from "@/components/ui/forms/combobox";
import { Field } from "@/components/ui/forms/field";
import { Select } from "@/components/ui/forms/select";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { ConditionValueEditor } from "./condition-value-editor";
import {
  CONDITION_ERRORS,
  type Condition,
  type ConditionField,
  OPERATOR_LABELS,
  type Operator,
  defaultValue,
  describeCondition,
  operatorsFor,
} from "./conditions";

export type ConditionRowProps = {
  condition: Condition;
  /** 0-based place among all conditions, and the total: "Condition 2 of 4". */
  index: number;
  total: number;
  /** "and" or "or" before every row but the first of its list. */
  connector: "and" | "or" | null;
  fields: readonly ConditionField[];
  masked?: boolean;
  /** The field is fixed (stage-rule scope: Stage, "is any of"). */
  fixedField?: boolean;
  onChange: (patch: Partial<Omit<Condition, "kind" | "id">>) => void;
  onRemove?: () => void;
  /** The row's error, when errors show (on Apply, or when a filled row loses focus). */
  error?: string | null;
  /** Focus left a row that has a field chosen. */
  onLeave?: () => void;
  /** The first row shows its labels; later rows keep them for screen readers. */
  showLabels: boolean;
  fieldInputRef?: Ref<HTMLInputElement>;
  today?: string;
};

function errorTarget(error: string | null | undefined): "field" | "operator" | "value" | null {
  if (!error) return null;
  if (error === CONDITION_ERRORS.field || error === CONDITION_ERRORS.removedField) return "field";
  if (error === CONDITION_ERRORS.operator) return "operator";
  return "value";
}

/**
 * One ConditionBuilder row: connector, Field, Comparison, Value and Remove (components.md,
 * ConditionBuilder). The row is role="group" named with its place and connector ("Condition 2 of
 * 4, and"); each control has its own label, visible on the first row and sr-only on later ones.
 * Errors sit under the control they are about and are linked with aria-describedby.
 */
export function ConditionRow({
  condition,
  index,
  total,
  connector,
  fields,
  masked = false,
  fixedField = false,
  onChange,
  onRemove,
  error,
  onLeave,
  showLabels,
  fieldInputRef,
  today,
}: ConditionRowProps) {
  const field = fields.find((candidate) => candidate.id === condition.fieldId) ?? null;
  const target = errorTarget(error);
  const layout = showLabels ? "stacked" : "hidden-label";
  const operators: readonly Operator[] = field ? operatorsFor(field, { masked }) : [];
  const description = describeCondition(condition, fields);
  const removeName = `Remove condition ${index + 1}${description ? `: ${description}` : field ? `: ${field.label}` : ""}`;
  const offset = showLabels ? "mt-7" : "";

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    if (condition.fieldId) onLeave?.();
  };

  return (
    <div
      role="group"
      aria-label={`Condition ${index + 1} of ${total}${connector ? `, ${connector}` : ""}`}
      onBlur={onBlur}
      className="flex flex-wrap items-start gap-2"
    >
      <span aria-hidden="true" className={cn("flex h-control-sm w-10 shrink-0 items-center justify-end text-xs font-medium text-muted", offset)}>
        {connector}
      </span>
      <Field label="Field" layout={layout} error={target === "field" ? (error ?? undefined) : undefined} className="w-48 shrink-0">
        {fixedField ? (
          <p className="m-0 flex h-control-sm items-center text-sm text-fg">{field?.label}</p>
        ) : (
          <Combobox
            size="sm"
            inputRef={fieldInputRef}
            placeholder="Choose a field"
            noun={{ one: "field", other: "fields" }}
            options={fields
              .filter((candidate) => !candidate.removed || candidate.id === condition.fieldId)
              .map((candidate) => ({ value: candidate.id, label: candidate.label, group: candidate.group }))}
            value={condition.fieldId}
            onValueChange={(fieldId) => onChange({ fieldId, operator: null, value: null })}
          />
        )}
      </Field>
      <Field label="Comparison" layout={layout} error={target === "operator" ? (error ?? undefined) : undefined} className="w-40 shrink-0">
        {fixedField ? (
          <p className="m-0 flex h-control-sm items-center text-sm text-fg">{condition.operator ? OPERATOR_LABELS[condition.operator] : ""}</p>
        ) : (
          <Select
            size="sm"
            placeholder="Choose how to compare"
            disabled={!field || Boolean(field.removed)}
            options={operators.map((operator) => ({ value: operator, label: OPERATOR_LABELS[operator] }))}
            value={condition.operator ?? ""}
            onValueChange={(next) => {
              const operator = next as Operator | null;
              onChange({ operator, value: field && operator ? defaultValue(field, operator) : null });
            }}
          />
        )}
      </Field>
      {field && condition.operator ? (
        <ConditionValueEditor
          field={field}
          operator={condition.operator}
          value={condition.value}
          onValueChange={(value) => onChange({ value })}
          hiddenLabel={!showLabels}
          error={target === "value" ? (error ?? undefined) : undefined}
          today={today}
        />
      ) : (
        <span className="min-w-48 flex-1" />
      )}
      {onRemove ? <IconButton icon={<X />} size="sm" aria-label={removeName} onClick={onRemove} className={offset} /> : null}
    </div>
  );
}
