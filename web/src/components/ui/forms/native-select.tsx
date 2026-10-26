"use client";

import { ChevronDown } from "lucide-react";
import type { Ref, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { CONTROL_HEIGHT, CONTROL_TEXT, type ControlSize, controlBox } from "./control-styles";
import { useFieldControl } from "./field-context";

export type NativeSelectOption = { value: string; label: string; disabled?: boolean; lang?: string };
export type NativeSelectGroup = { label: string; options: NativeSelectOption[] };

export type NativeSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  options: Array<NativeSelectOption | NativeSelectGroup>;
  /** A first, empty option: "Choose a course". */
  placeholder?: string;
  size?: ControlSize;
  invalid?: boolean;
  /** Classes for the wrapper (width). */
  className?: string;
  selectClassName?: string;
  ref?: Ref<HTMLSelectElement>;
};

/**
 * The public-page Select (components.md Select, public variant; decisions.md section 4): a native
 * <select> styled as the TextInput box, with a ChevronDown overlay. It costs no JavaScript, works
 * before scripts load, and Android shows its own picker. Also used for the phone country code.
 */
export function NativeSelect({
  options,
  placeholder,
  size = "lg",
  invalid: invalidProp,
  className,
  selectClassName,
  id: idProp,
  required: requiredProp,
  disabled: disabledProp,
  "aria-describedby": describedByProp,
  "aria-invalid": ariaInvalid,
  ref,
  ...rest
}: NativeSelectProps) {
  const control = useFieldControl({
    id: idProp,
    required: requiredProp,
    disabled: disabledProp,
    invalid: invalidProp,
    "aria-describedby": describedByProp,
    "aria-invalid": ariaInvalid,
  });
  return (
    <div className={cn("relative w-full", className)}>
      <select
        {...rest}
        ref={ref}
        id={control.id}
        required={control.required}
        disabled={control.disabled}
        aria-invalid={control.invalid || undefined}
        aria-describedby={control.describedBy}
        className={cn(
          "w-full appearance-none truncate pr-10 pl-3",
          size === "lg" && "pl-4",
          CONTROL_HEIGHT[size],
          CONTROL_TEXT[size],
          controlBox({ invalid: control.invalid, disabled: control.disabled }),
          selectClassName,
        )}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((item) =>
          "options" in item ? (
            <optgroup key={item.label} label={item.label}>
              {item.options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled} lang={option.lang}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ) : (
            <option key={item.value} value={item.value} disabled={item.disabled} lang={item.lang}>
              {item.label}
            </option>
          ),
        )}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-icon-sm -translate-y-1/2 text-muted"
      />
    </div>
  );
}
