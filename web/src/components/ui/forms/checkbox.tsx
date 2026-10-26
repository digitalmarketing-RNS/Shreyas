"use client";

import { Check, Minus } from "lucide-react";
import { type InputHTMLAttributes, type ReactNode, type Ref, useEffect, useId, useMemo, useRef } from "react";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";
import { joinIds, useFieldContext } from "./field-context";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  /** The visible label. In the table variant pass aria-label instead ("Select Meera Pillai"). */
  label?: ReactNode;
  /** A second line under the label, linked with aria-describedby. */
  description?: ReactNode;
  /** row (default), table (a 24 px label around the box, no visible text) or card (bordered, S37 scopes). */
  variant?: "row" | "table" | "card";
  /** staff: 16 px box in a 24 px row. public: 20 px box in a 44 px row, text-base. */
  surface?: "staff" | "public";
  /** Mixed state (select-all with some rows chosen). Set through the DOM property. */
  indeterminate?: boolean;
  invalid?: boolean;
  /** Shown as the text "Yes" or "No" beside the label, not as a control. */
  readOnly?: boolean;
  className?: string;
  ref?: Ref<HTMLInputElement>;
};

/** The box: a native checkbox drawn with appearance-none, so it submits without JavaScript. */
export function checkboxBoxClassName(surface: "staff" | "public" = "staff") {
  return cn(
    "peer m-0 shrink-0 cursor-pointer appearance-none rounded-xs border border-input bg-surface transition-colors duration-fast",
    surface === "public" ? "size-5" : "size-checkbox",
    "hover:border-muted checked:border-accent checked:bg-accent indeterminate:border-accent indeterminate:bg-accent",
    "aria-invalid:border-danger",
    "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-subtle disabled:checked:bg-surface-sunken disabled:indeterminate:bg-surface-sunken",
    "aria-disabled:cursor-not-allowed",
    "forced-colors:appearance-auto",
  );
}

/**
 * Turns one option on or off inside a form (components.md Checkbox). A native
 * <input type="checkbox">, not Radix Checkbox, so public pages submit it before JavaScript loads.
 * Never pre-ticked for consent or marketing. Space toggles; clicking the label toggles.
 *
 * The focus ring keeps its 2 px offset even in table cells (never focus-inset): it would otherwise
 * sit on the checked accent fill.
 */
export function Checkbox({
  label,
  description,
  variant = "row",
  surface: surfaceProp,
  indeterminate = false,
  invalid: invalidProp,
  readOnly = false,
  className,
  ref,
  id: idProp,
  disabled,
  "aria-describedby": describedByProp,
  ...rest
}: CheckboxProps) {
  const group = useFieldContext();
  const surface = surfaceProp ?? group?.surface ?? "staff";
  const isPublic = surface === "public";
  const generated = useId();
  const id = idProp ?? generated;
  const descriptionId = `${id}-description`;
  const invalid = invalidProp ?? group?.invalid ?? false;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const composedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  if (readOnly) {
    const on = Boolean(rest.checked ?? rest.defaultChecked);
    return (
      <p className={cn("m-0 flex flex-wrap gap-x-2", isPublic ? "text-base" : "text-sm", className)}>
        <span className="text-muted">{label}</span>
        <span className="text-fg">{on ? "Yes" : "No"}</span>
      </p>
    );
  }

  const box = (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", isPublic ? "h-6" : "h-5.5")}>
      <input
        {...rest}
        ref={composedRef}
        id={id}
        type="checkbox"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={joinIds(description ? descriptionId : null, describedByProp)}
        className={checkboxBoxClassName(surface)}
      />
      <Check
        aria-hidden="true"
        strokeWidth={3}
        className={cn(
          "pointer-events-none absolute hidden text-on-accent peer-disabled:text-muted forced-colors:hidden",
          "peer-[:checked:not(:indeterminate)]:block",
          isPublic ? "size-4" : "size-3",
        )}
      />
      <Minus
        aria-hidden="true"
        strokeWidth={3}
        className={cn(
          "pointer-events-none absolute hidden text-on-accent peer-indeterminate:block peer-disabled:text-muted forced-colors:hidden",
          isPublic ? "size-4" : "size-3",
        )}
      />
    </span>
  );

  if (variant === "table") {
    return (
      <label className={cn("inline-flex size-hit cursor-pointer items-center justify-center", className)}>
        {box}
      </label>
    );
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer items-start text-fg has-[:disabled]:cursor-not-allowed has-[:disabled]:text-muted has-[input[aria-disabled=true]]:cursor-not-allowed has-[input[aria-disabled=true]]:text-muted",
        isPublic ? "min-h-hit-public gap-3 py-2.5 text-base" : "min-h-hit gap-2 py-px text-sm",
        variant === "card" &&
          "rounded-lg border border-border p-3 has-[:checked]:border-accent has-[:checked]:bg-accent-subtle",
        className,
      )}
    >
      {box}
      <span className="flex min-w-0 flex-col">
        <span>{label}</span>
        {description ? (
          <span id={descriptionId} className={cn("text-muted", isPublic ? "text-sm" : "text-xs")}>
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
