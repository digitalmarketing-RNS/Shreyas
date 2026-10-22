"use client";

import { Check, ChevronDown } from "lucide-react";
import { Select as RadixSelect } from "radix-ui";
import { cn } from "@/lib/cn";
import {
  CONTROL_HEIGHT,
  CONTROL_PADDING_X,
  CONTROL_TEXT,
  type ControlSize,
  GROUP_HEADING,
  POPOVER_PANEL,
  TRUNCATE,
  controlBox,
} from "./control-styles";
import { useFieldControl } from "./field-context";

export type SelectOption = {
  value: string;
  label: string;
  /** A second line. On a disabled option it is the reason: "Turned off in Settings". */
  description?: string;
  disabled?: boolean;
  /** A decorative colour dot before the label (stage colour); the label carries the meaning. */
  dotClassName?: string;
};

export type SelectOptionGroup = { label: string; options: SelectOption[] };

/** Radix Select reads "" as "nothing chosen", so "None" uses this sentinel; map it to null on submit. */
export const SELECT_NONE = "__none";

/** Classes of the open list, shared with the gallery's still picture of it. */
export const selectContentClassName = cn(
  POPOVER_PANEL,
  "max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-(--radix-select-trigger-width) overflow-hidden",
);
export const selectItemClassName = cn(
  "relative flex min-h-menu-item w-full cursor-default items-center gap-2 rounded-sm py-1 pr-8 pl-2 text-sm text-fg select-none focus-inset",
  "data-[highlighted]:bg-surface-hover data-[state=checked]:font-medium",
  "data-[disabled]:cursor-not-allowed data-[disabled]:text-muted",
);

export type SelectProps = {
  options: Array<SelectOption | SelectOptionGroup>;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string | null) => void;
  /** "Choose a stage". */
  placeholder?: string;
  /** Adds a "None" option for optional fields (its value is SELECT_NONE). Pass a string to rename it. */
  none?: boolean | string;
  size?: ControlSize;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  /** Shown as text, not as a control. */
  readOnly?: boolean;
  invalid?: boolean;
  /** Options are loading: the trigger says "Loading…" and is disabled. */
  loading?: boolean;
  /** What the open list says when there is nothing to choose: "This stage has no sub-stages." */
  emptyText?: string;
  /** Inline variant (rows per page): no visible label, so the name goes here. */
  "aria-label"?: string;
  id?: string;
  className?: string;
};

function isGroup(item: SelectOption | SelectOptionGroup): item is SelectOptionGroup {
  return "options" in item;
}

/**
 * Pick one value from a short fixed list where search is not needed (components.md Select): Radix
 * Select with position="popper", opening below the trigger. Public pages use NativeSelect. Longer
 * lists, or lists that need search, use Combobox.
 *
 * Keyboard (Radix): closed, Enter, Space or the arrows open it and typed letters jump; open, the
 * arrows move, Home and End jump, Enter or Space chooses, Esc closes without a change. Radix renders
 * a hidden native select, so Server Actions receive the value.
 */
export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  none = false,
  size = "md",
  name,
  required: requiredProp,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  invalid: invalidProp,
  loading = false,
  emptyText = "Nothing to choose yet.",
  "aria-label": ariaLabel,
  id: idProp,
  className,
}: SelectProps) {
  const control = useFieldControl({
    id: idProp,
    required: requiredProp,
    disabled: disabledProp,
    readOnly: readOnlyProp,
    invalid: invalidProp,
  });
  const flat = options.flatMap((item) => (isGroup(item) ? item.options : [item]));
  const noneLabel = typeof none === "string" ? none : "None";

  if (control.readOnly) {
    const chosen = flat.find((option) => option.value === (value ?? defaultValue));
    return (
      <p id={control.id} aria-describedby={control.describedBy} className={cn("m-0 text-sm text-fg", TRUNCATE)}>
        {chosen?.label ?? noneLabel}
      </p>
    );
  }

  const isEmpty = flat.length === 0;
  const disabled = control.disabled || loading;

  return (
    <RadixSelect.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(next === SELECT_NONE ? null : next)}
      name={name}
      required={control.required}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        id={control.id}
        aria-label={ariaLabel}
        aria-describedby={control.describedBy}
        aria-invalid={control.invalid || undefined}
        className={cn(
          "group inline-flex w-full items-center justify-between gap-2 text-left",
          CONTROL_HEIGHT[size],
          CONTROL_TEXT[size],
          CONTROL_PADDING_X[size],
          size !== "lg" && "pr-2",
          controlBox({ invalid: control.invalid, disabled }),
          className,
        )}
      >
        <span className={cn("flex min-w-0 flex-1 items-center", TRUNCATE)}>
          {loading ? <span className="text-muted">Loading…</span> : <RadixSelect.Value placeholder={<span className="text-muted">{placeholder}</span>} />}
        </span>
        <RadixSelect.Icon asChild>
          <ChevronDown aria-hidden="true" className="size-icon-sm shrink-0 text-muted" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content position="popper" sideOffset={4} collisionPadding={8} className={selectContentClassName}>
          <RadixSelect.Viewport className="p-1">
            {isEmpty ? (
              <p className="m-0 px-2 py-1.5 text-sm text-muted">{emptyText}</p>
            ) : (
              <>
                {none ? <SelectItem option={{ value: SELECT_NONE, label: noneLabel }} /> : null}
                {options.map((item) =>
                  isGroup(item) ? (
                    <RadixSelect.Group key={item.label}>
                      <RadixSelect.Label className={GROUP_HEADING}>{item.label}</RadixSelect.Label>
                      {item.options.map((option) => (
                        <SelectItem key={option.value} option={option} />
                      ))}
                    </RadixSelect.Group>
                  ) : (
                    <SelectItem key={item.value} option={item} />
                  ),
                )}
              </>
            )}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

function SelectItem({ option }: { option: SelectOption }) {
  return (
    <RadixSelect.Item value={option.value} disabled={option.disabled} className={cn(selectItemClassName, option.description && "min-h-12 py-1.5")}>
      <span className="flex min-w-0 flex-col">
        {/* ItemText is what the closed trigger shows, so the dot travels with the label. */}
        <RadixSelect.ItemText asChild>
          <span className="flex min-w-0 items-center gap-2">
            {option.dotClassName ? <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-pill", option.dotClassName)} /> : null}
            <span className={TRUNCATE}>{option.label}</span>
          </span>
        </RadixSelect.ItemText>
        {option.description ? <span className="text-xs font-normal text-muted">{option.description}</span> : null}
      </span>
      <RadixSelect.ItemIndicator className="absolute right-2 inline-flex">
        <Check aria-hidden="true" className="size-icon-sm text-accent" />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
}
