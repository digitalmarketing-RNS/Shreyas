"use client";

import { type ReactNode, useEffect, useId, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { FieldError } from "./field-error";
import { FieldContext, type FieldContextValue, type FieldSurface, joinIds } from "./field-context";
import { useFormContext } from "./form-context";

export type FieldLayout = "stacked" | "inline" | "key-value" | "hidden-label";

export type FieldProps = {
  /** A noun: "Email address", "Stage". Always visible, except in the hidden-label layout. */
  label: ReactNode;
  /** What helps, said once: "We'll use this to send the fee receipt." */
  hint?: ReactNode;
  /** Shown as a success line ("Verified") instead of the muted hint colour. */
  hintTone?: "muted" | "success";
  /**
   * What to do: "Enter an email address like name@example.com." Inside a Form, the error for
   * `name` comes from the form unless this is set.
   */
  error?: ReactNode;
  /** The control's name; inside a Form it picks up the field's error and its summary link. */
  name?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /**
   * stacked (default, label above); inline (label beside the control); key-value (S08: a 200 px
   * label column once the row has room for it); hidden-label (table cells and toolbars: the label
   * is sr-only).
   */
  layout?: FieldLayout;
  /** staff (default, or the Form's) or public: public labels are text-base, hints and errors text-sm. */
  surface?: FieldSurface;
  className?: string;
  children: ReactNode;
};

/**
 * Wraps one control with its label, required marker, hint and error, and the ids that link them
 * (components.md Field). The control reads the ids from context (useFieldControl), so nobody passes
 * ids by hand. aria-describedby lists the error first, then the hint; aria-invalid is set only
 * while an error shows.
 *
 * Required marker: staff forms put "*" after the label (aria-hidden; the form says "* required"
 * once); public forms mark nothing on required fields and "(optional)" on optional ones.
 */
export function Field({
  label,
  hint,
  hintTone = "muted",
  error,
  name,
  required = false,
  disabled = false,
  readOnly = false,
  layout = "stacked",
  surface,
  className,
  children,
}: FieldProps) {
  const base = useId();
  const controlId = `${base}-control`;
  const labelId = `${base}-label`;
  const hintId = `${base}-hint`;
  const errorId = `${base}-error`;
  const form = useFormContext();
  const [controlError, setControlError] = useState<string | null>(null);
  const resolvedSurface: FieldSurface = surface ?? form?.surface ?? "staff";
  const isPublic = resolvedSurface === "public";

  const registerField = form?.registerField;
  useEffect(() => {
    if (!name || !registerField) return;
    return registerField(name, controlId);
  }, [name, registerField, controlId]);

  const shownError = error ?? (name ? form?.errors[name] : undefined) ?? controlError ?? undefined;
  const hasError = shownError !== undefined && shownError !== null && shownError !== false && shownError !== "";
  const describedBy = joinIds(hasError && errorId, hint ? hintId : null);

  const context = useMemo<FieldContextValue>(
    () => ({
      controlId,
      labelId,
      describedBy,
      invalid: hasError,
      required,
      disabled,
      readOnly,
      surface: resolvedSurface,
      reportError: setControlError,
    }),
    [controlId, labelId, describedBy, hasError, required, disabled, readOnly, resolvedSurface],
  );

  const labelNode = (
    <label
      id={labelId}
      htmlFor={controlId}
      className={cn(
        "font-medium",
        isPublic ? "text-base" : "text-sm",
        disabled ? "text-muted" : "text-fg",
        layout === "hidden-label" && "sr-only",
      )}
    >
      {label}
      {required && !isPublic ? (
        <span aria-hidden="true" className="text-danger">
          {" "}
          *
        </span>
      ) : null}
      {!required && isPublic ? <span className="font-normal text-muted"> (optional)</span> : null}
    </label>
  );

  const hintNode = hint ? (
    <p
      id={hintId}
      className={cn(
        "m-0 mt-0.5",
        isPublic ? "text-sm" : "text-xs",
        disabled ? "text-muted" : hintTone === "success" ? "text-success" : "text-muted",
      )}
    >
      {hint}
    </p>
  ) : null;

  const errorNode = hasError ? <FieldError id={errorId} surface={resolvedSurface} message={shownError} /> : null;

  if (layout === "inline") {
    return (
      <FieldContext.Provider value={context}>
        <div className={cn("flex items-start gap-2", className)}>
          {children}
          <div className="flex min-w-0 flex-col">
            {labelNode}
            {hintNode}
            {errorNode}
          </div>
        </div>
      </FieldContext.Provider>
    );
  }

  if (layout === "key-value") {
    // The 200 px label column appears when the row has room for it (a container query), so rows in
    // a narrow panel stack instead of overflowing; on a full-width page that is from md up.
    return (
      <FieldContext.Provider value={context}>
        <div className={cn("w-full @container", className)}>
          <div className="flex flex-col @min-[26rem]:grid @min-[26rem]:grid-cols-[var(--layout-kv-label)_minmax(0,1fr)] @min-[26rem]:gap-x-4">
            <div className="flex flex-col @min-[26rem]:pt-1.5">
              {labelNode}
              {hintNode}
            </div>
            <div className="mt-2 flex min-w-0 flex-col @min-[26rem]:mt-0">
              {children}
              {errorNode}
            </div>
          </div>
        </div>
      </FieldContext.Provider>
    );
  }

  return (
    <FieldContext.Provider value={context}>
      <div className={cn("flex min-w-0 flex-col", className)}>
        {labelNode}
        {hintNode}
        <div className={cn("flex min-w-0 flex-col", layout === "hidden-label" ? "" : "mt-2")}>{children}</div>
        {errorNode}
      </div>
    </FieldContext.Provider>
  );
}
