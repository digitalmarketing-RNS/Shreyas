"use client";

import { createContext, useContext } from "react";

/**
 * What a Field (or FieldGroup) hands to the control inside it: the ids that link label, hint and
 * error, and the states the control must reflect (components.md Field: "the control, which
 * receives id, aria-describedby, aria-invalid and required"). Consumers never pass ids by hand.
 */
export type FieldSurface = "staff" | "public";

export type FieldContextValue = {
  /** The control's id; the <label for> points at it. */
  controlId: string;
  /** The visible label's id, for controls named by aria-labelledby (PhoneInput's group). */
  labelId: string;
  /** "error-id hint-id": the error first, then the hint, only those that exist. */
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  surface: FieldSurface;
  /**
   * A control's own check (an unreadable date, a short phone number) reports its message here and
   * the Field shows it as the error. Pass null to clear it.
   */
  reportError: (message: string | null) => void;
};

export const FieldContext = createContext<FieldContextValue | null>(null);

export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}

export function joinIds(...ids: Array<string | false | null | undefined>): string | undefined {
  const joined = ids.filter(Boolean).join(" ");
  return joined || undefined;
}

export type OwnControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
};

/**
 * Merges a control's own props with its Field's. Explicit props win; aria-describedby keeps the
 * Field's ids first (error, then hint) and adds the control's own after them.
 */
export function useFieldControl(own: OwnControlProps) {
  const field = useFieldContext();
  const invalid = own.invalid ?? (own["aria-invalid"] === true || own["aria-invalid"] === "true" || Boolean(field?.invalid));
  return {
    field,
    id: own.id ?? field?.controlId,
    describedBy: joinIds(field?.describedBy, own["aria-describedby"]),
    invalid,
    required: own.required ?? field?.required ?? false,
    disabled: own.disabled ?? field?.disabled ?? false,
    readOnly: own.readOnly ?? field?.readOnly ?? false,
    surface: field?.surface ?? "staff",
    reportError: field?.reportError ?? noop,
  };
}

function noop() {}
