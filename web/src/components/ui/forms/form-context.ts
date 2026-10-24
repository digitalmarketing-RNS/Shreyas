"use client";

import { createContext, useContext } from "react";
import type { FieldSurface } from "./field-context";

/**
 * Shared by Form (FormLayout) and every Field inside it: the surface (staff or public), the
 * current errors by field name, whether the form is submitting, and where each named field's
 * control lives, so the error summary can link to it.
 */
export type FormErrors = Record<string, string>;

export type FormContextValue = {
  surface: FieldSurface;
  errors: FormErrors;
  pending: boolean;
  /** Submit is waiting for file uploads that are still running ("Uploading…"). */
  uploading: boolean;
  /** Called by a Field with a name: the control id its error-summary link points at. */
  registerField: (name: string, controlId: string) => () => void;
};

export const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext(): FormContextValue | null {
  return useContext(FormContext);
}
