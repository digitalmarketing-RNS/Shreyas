"use client";

import { CircleAlert } from "lucide-react";
import { useId } from "react";
import { Combobox } from "@/components/ui/forms/combobox";
import { DatePicker } from "@/components/ui/forms/date-picker";
import { DateRangePicker } from "@/components/ui/forms/date-range-picker";
import { Field } from "@/components/ui/forms/field";
import { NumberStepper } from "@/components/ui/forms/number-stepper";
import { Select } from "@/components/ui/forms/select";
import { TextInput } from "@/components/ui/forms/text-input";
import { type ActivityValue, type ConditionField, type ConditionValue, type Operator, type RangeValue, needsValue } from "./conditions";

export type ConditionValueEditorProps = {
  field: ConditionField;
  operator: Operator;
  value: ConditionValue;
  onValueChange: (value: ConditionValue) => void;
  /** Later rows keep their labels for screen readers only. */
  hiddenLabel: boolean;
  error?: string;
  today?: string;
};

const WINDOWS = [
  { value: "7", label: "the last 7 days" },
  { value: "30", label: "the last 30 days" },
  { value: "90", label: "the last 90 days" },
];

/**
 * The value part of a ConditionBuilder row, fitted to the field's type and the operator
 * (components.md, ConditionBuilder "Value editors"): text, one or two numbers, a date, a date
 * range or "in the last N days", a multi-value Combobox for picklists and owners, Yes or No, and
 * the activity sub-row "Calls [connected] [at least] [1] in [the last 7 days]".
 */
export function ConditionValueEditor({ field, operator, value, onValueChange, hiddenLabel, error, today }: ConditionValueEditorProps) {
  const base = useId();
  const errorId = `${base}-error`;
  if (!needsValue(operator)) return null;
  const layout = hiddenLabel ? "hidden-label" : "stacked";
  const text = typeof value === "string" ? value : "";
  const range: RangeValue = value && typeof value === "object" && !Array.isArray(value) && "from" in value ? value : { from: "", to: "" };

  if (field.type === "activity") {
    const activity: ActivityValue = value && typeof value === "object" && !Array.isArray(value) && "outcome" in value ? value : { outcome: "", count: "1", days: "7" };
    return (
      <div role="group" aria-label="Value" aria-describedby={error ? errorId : undefined} className="flex min-w-48 flex-1 flex-col gap-1">
        {hiddenLabel ? null : (
          <span aria-hidden="true" className="text-sm font-medium text-fg">
            Value
          </span>
        )}
        <span className="flex flex-wrap items-center gap-2">
          <Select
            id={`${base}-outcome`}
            size="sm"
            aria-label={`${field.label} outcome`}
            className="w-36"
            options={field.outcomes ?? []}
            value={activity.outcome}
            invalid={Boolean(error)}
            onValueChange={(outcome) => onValueChange({ ...activity, outcome: outcome ?? "" })}
          />
          {operator === "count_none" ? null : (
            <Field label={`Number of ${field.label.toLowerCase()}`} layout="hidden-label">
              <NumberStepper
                size="sm"
                min={0}
                max={999}
                valueName={`number of ${field.label.toLowerCase()}`}
                invalid={Boolean(error)}
                value={/^\d+$/.test(activity.count) ? Number(activity.count) : null}
                onValueChange={(_next, detail) => onValueChange({ ...activity, count: detail.text })}
              />
            </Field>
          )}
          <span className="text-sm text-muted">in</span>
          <Select
            id={`${base}-window`}
            size="sm"
            aria-label="Time window"
            className="w-40"
            options={WINDOWS}
            value={activity.days}
            onValueChange={(days) => onValueChange({ ...activity, days: days ?? "7" })}
          />
        </span>
        {error ? (
          <p id={errorId} className="m-0 flex items-start gap-1 text-xs text-danger">
            <CircleAlert aria-hidden="true" className="mt-px size-icon-sm shrink-0" />
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.type === "picklist" || field.type === "owner") {
    return (
      <Field label="Value" layout={layout} error={error} className="min-w-48 flex-1">
        <Combobox
          multiple
          dense
          size="sm"
          placeholder="Choose values"
          noun={{ one: "value", other: "values" }}
          options={(field.options ?? []).map((option) => ({ value: option.value, label: option.label, disabled: option.removed }))}
          value={Array.isArray(value) ? value : []}
          onValueChange={(next) => onValueChange(next)}
        />
      </Field>
    );
  }

  if (field.type === "yesno") {
    return (
      <Field label="Value" layout={layout} error={error} className="min-w-48 flex-1">
        <Select
          size="sm"
          placeholder="Choose"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={text}
          onValueChange={(next) => onValueChange(next ?? "")}
        />
      </Field>
    );
  }

  if (operator === "in_last" || operator === "in_next") {
    return (
      <Field label="Value" layout={layout} error={error} className="min-w-48 flex-1">
        <NumberStepper
          size="sm"
          min={1}
          max={365}
          unit="days"
          valueName="number of days"
          value={/^\d+$/.test(text) ? Number(text) : null}
          onValueChange={(_next, detail) => onValueChange(detail.text)}
        />
      </Field>
    );
  }

  if (operator === "between") {
    if (field.type === "date") {
      return (
        <Field label="Value" layout={layout} error={error} className="min-w-48 flex-1">
          <DateRangePicker
            presets={false}
            today={today}
            value={range.from && range.to ? { from: range.from, to: range.to, compare: null } : null}
            onValueChange={(next) => onValueChange(next ? { from: next.from, to: next.to } : { from: "", to: "" })}
          />
        </Field>
      );
    }
    return (
      <div className="flex min-w-48 flex-1 flex-wrap items-end gap-2">
        <Field label="Value, from" layout={layout} error={error}>
          <NumberStepper
            size="sm"
            min={-999999}
            max={999999}
            inputWidth="w-20"
            valueName="lower number"
            invalid={Boolean(error)}
            value={range.from !== "" && !Number.isNaN(Number(range.from)) ? Number(range.from) : null}
            onValueChange={(_next, detail) => onValueChange({ ...range, from: detail.text })}
          />
        </Field>
        <span className="pb-1.5 text-sm text-muted">and</span>
        <Field label="Value, to" layout={hiddenLabel ? "hidden-label" : "stacked"}>
          <NumberStepper
            size="sm"
            min={-999999}
            max={999999}
            inputWidth="w-20"
            valueName="higher number"
            invalid={Boolean(error)}
            value={range.to !== "" && !Number.isNaN(Number(range.to)) ? Number(range.to) : null}
            onValueChange={(_next, detail) => onValueChange({ ...range, to: detail.text })}
          />
        </Field>
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <Field label="Value" layout={layout} error={error} className="min-w-48 flex-1">
        <DatePicker size="sm" today={today} value={text || null} onValueChange={(iso) => onValueChange(iso ?? "")} />
      </Field>
    );
  }

  if (field.type === "number") {
    return (
      <Field label="Value" layout={layout} error={error} className="min-w-48 flex-1">
        <NumberStepper
          size="sm"
          min={-999999}
          max={999999}
          inputWidth="w-20"
          valueName={field.label.toLowerCase()}
          value={text !== "" && !Number.isNaN(Number(text)) ? Number(text) : null}
          onValueChange={(_next, detail) => onValueChange(detail.text)}
        />
      </Field>
    );
  }

  return (
    <Field label="Value" layout={layout} error={error} className="min-w-48 flex-1">
      <TextInput size="sm" value={text} dir="auto" onValueChange={(next) => onValueChange(next)} />
    </Field>
  );
}
