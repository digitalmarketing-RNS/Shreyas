"use client";

import type { ReactNode } from "react";
import { Button, type ButtonSize } from "../button";
import { useFormContext } from "./form-context";

export type SubmitButtonProps = {
  /** Verb first: "Save changes", "Send enquiry". */
  children: ReactNode;
  /** "Saving…", "Sending…". While files upload it says "Uploading…". */
  loadingLabel?: string;
  /** md 40 on staff forms; public forms use lg 48 at full width. */
  size?: ButtonSize;
  className?: string;
};

/**
 * The primary submit of a Form. It shows loading while the request runs (and "Uploading…" while
 * files are still uploading) and is never disabled to signal invalid fields (components.md Button
 * and FormLayout).
 */
export function SubmitButton({ children, loadingLabel = "Saving…", size, className }: SubmitButtonProps) {
  const form = useFormContext();
  const isPublic = form?.surface === "public";
  const busy = Boolean(form?.pending || form?.uploading);
  return (
    <Button
      type="submit"
      size={size ?? (isPublic ? "lg" : "md")}
      fullWidth={isPublic}
      loading={busy}
      loadingLabel={form?.uploading ? "Uploading…" : loadingLabel}
      className={className}
    >
      {children}
    </Button>
  );
}
