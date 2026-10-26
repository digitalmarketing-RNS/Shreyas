"use client";

import { type ReactNode, useEffect, useId, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { FieldContext, type FieldContextValue, type FieldSurface, joinIds } from "./field-context";
import { FieldError } from "./field-error";
import { useFormContext } from "./form-context";

export type FieldGroupProps = {
  /** The question the controls answer: "Programmes you're interested in", "When". */
  legend: ReactNode;
  /** Keep the legend for screen readers only (a toolbar's segmented control). */
  legendHidden?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  /** Inside a Form, the group's error comes from the form under this name. */
  name?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  surface?: FieldSurface;
  /** Rendered between the hint and the controls: the "2 of 3 chosen" counter, a filter. */
  meta?: ReactNode;
  /** Extra ids for the fieldset's aria-describedby, after the error and hint. */
  describedBy?: string;
  /** The recorded language of the content (ConsentCapture puts the notice language here). */
  lang?: string;
  className?: string;
  legendClassName?: string;
  children: ReactNode;
};

/**
 * <fieldset> and <legend> for grouped controls: radios, checkboxes, the memorable-date inputs,
 * DateTimePicker's three parts (components.md Field: "Grouped controls … use <fieldset> and
 * <legend> for the same parts"). The fieldset's aria-describedby lists the error, then the hint;
 * the controls inside read `invalid` from context and set aria-invalid on themselves.
 */
export function FieldGroup({
  legend,
  legendHidden = false,
  hint,
  error,
  name,
  required = false,
  disabled = false,
  readOnly = false,
  surface,
  meta,
  describedBy,
  lang,
  className,
  legendClassName,
  children,
}: FieldGroupProps) {
  const base = useId();
  const groupId = `${base}-group`;
  const legendId = `${base}-legend`;
  const hintId = `${base}-hint`;
  const errorId = `${base}-error`;
  const form = useFormContext();
  const [controlError, setControlError] = useState<string | null>(null);
  const resolvedSurface: FieldSurface = surface ?? form?.surface ?? "staff";
  const isPublic = resolvedSurface === "public";

  const registerField = form?.registerField;
  useEffect(() => {
    if (!name || !registerField) return;
    return registerField(name, groupId);
  }, [name, registerField, groupId]);

  const shownError = error ?? (name ? form?.errors[name] : undefined) ?? controlError ?? undefined;
  const hasError = shownError !== undefined && shownError !== null && shownError !== false && shownError !== "";

  const context = useMemo<FieldContextValue>(
    () => ({
      controlId: groupId,
      labelId: legendId,
      describedBy: undefined,
      invalid: hasError,
      required,
      disabled,
      readOnly,
      surface: resolvedSurface,
      reportError: setControlError,
    }),
    [groupId, legendId, hasError, required, disabled, readOnly, resolvedSurface],
  );

  return (
    <FieldContext.Provider value={context}>
      <fieldset
        id={groupId}
        lang={lang}
        disabled={disabled}
        aria-describedby={joinIds(hasError && errorId, hint ? hintId : null, describedBy)}
        className={cn("m-0 min-w-0 border-0 p-0", className)}
      >
        <legend
          id={legendId}
          className={cn(
            "p-0 font-medium",
            isPublic ? "text-base" : "text-sm",
            disabled ? "text-muted" : "text-fg",
            legendHidden && "sr-only",
            legendClassName,
          )}
        >
          {legend}
          {required && !isPublic ? (
            <span aria-hidden="true" className="text-danger">
              {" "}
              *
            </span>
          ) : null}
          {!required && isPublic ? <span className="font-normal text-muted"> (optional)</span> : null}
        </legend>
        {hint ? (
          <p id={hintId} className={cn("m-0 mt-0.5 text-muted", isPublic ? "text-sm" : "text-xs")}>
            {hint}
          </p>
        ) : null}
        {meta ? <div className="mt-2">{meta}</div> : null}
        <div className={cn(legendHidden && !hint && !meta ? "" : "mt-2")}>{children}</div>
        {hasError ? <FieldError id={errorId} surface={resolvedSurface} message={shownError} /> : null}
      </fieldset>
    </FieldContext.Provider>
  );
}
