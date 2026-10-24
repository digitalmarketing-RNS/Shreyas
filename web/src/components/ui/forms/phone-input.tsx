"use client";

import { ChevronDown } from "lucide-react";
import { type ClipboardEvent, useId, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatPhone } from "@/lib/format";
import { Link } from "../primitives/link";
import { CONTROL_HEIGHT, CONTROL_TEXT, type ControlSize, controlBox } from "./control-styles";
import { joinIds, useFieldControl } from "./field-context";
import { useIsClient } from "./hooks";
import {
  countryOptionLabel,
  formatNational,
  normalisePhone,
  orderedCountries,
  phoneDigitError,
  splitE164,
  toE164,
} from "./phone";

export type PhoneDuplicate =
  /** A lead the person can see: "This number is on lead #10482, Arjun Mehta." with "Open lead". */
  | { visible: true; leadNumber: string; leadName: string; href: string }
  /** A lead outside their data scope: no name, no number, no link. */
  | { visible: false };

export type PhoneInputProps = {
  /** The E.164 value leaves under this name; the parts go as `{name}_country` and `{name}_national`. */
  name?: string;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (e164: string | null, detail: { iso: string; national: string; valid: boolean }) => void;
  /** public (48 px, the default on public pages), staff (40 px) or inline (32 px, S08 alternate numbers). */
  variant?: "public" | "staff" | "inline";
  /** The institution's pinned countries, after India (S30). */
  pinned?: string[];
  /**
   * The person types their own number (public pages, their own profile): tel-country-code and
   * tel-national. Otherwise both parts are autocomplete="off" (a lead's number, a guardian's mobile).
   */
  ownNumber?: boolean;
  /** Which part a server error points at; aria-invalid goes there (both when it cannot tell). */
  invalidPart?: "number" | "country" | "both";
  duplicate?: PhoneDuplicate;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  className?: string;
};

const SIZE: Record<NonNullable<PhoneInputProps["variant"]>, ControlSize> = { public: "lg", staff: "md", inline: "sm" };

/**
 * A phone number with its country code (components.md PhoneInput). The value leaves as E.164
 * (+919876543210). A native country-code <select> (India first, then pinned countries, then A to Z;
 * typing "+97" jumps by code) and a national-number input sharing one outer border.
 *
 * - Spaces, dashes, brackets, a leading 0 and pasted "+91…", "0091…" or "91…" numbers are fine and
 *   are normalised on blur; a pasted "+971 50 123 4567" switches the country.
 * - The browser checks the digit count only (10 for India, 4 to 14 elsewhere); the server
 *   validates with libphonenumber-js. On blur India shows "98765 43210"; staff screens group other
 *   countries the shared formatter knows (libphonenumber-js AsYouType once it is installed).
 * - dir="ltr" on the number, so digits stay left to right on Urdu pages.
 */
export function PhoneInput({
  name,
  value,
  defaultValue = null,
  onValueChange,
  variant = "staff",
  pinned = [],
  ownNumber = false,
  invalidPart = "number",
  duplicate,
  required: requiredProp,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  invalid: invalidProp,
  className,
}: PhoneInputProps) {
  const control = useFieldControl({ required: requiredProp, disabled: disabledProp, readOnly: readOnlyProp, invalid: invalidProp });
  const size = SIZE[variant];
  const staff = variant !== "public";
  const isClient = useIsClient();
  const base = useId();
  const duplicateId = `${base}-duplicate`;
  const initial = splitE164(value !== undefined ? value : defaultValue);
  const [iso, setIso] = useState(initial.iso);
  const [text, setText] = useState(formatNational(initial.national, initial.iso, { staff }));
  const [errorShown, setErrorShown] = useState(false);
  const countries = useMemo(() => orderedCountries(pinned), [pinned]);
  const reportError = control.reportError;

  const national = normalisePhone(text, iso).national;
  const e164 = toE164(iso, national);

  const emit = (nextIso: string, nextText: string) => {
    const parts = normalisePhone(nextText, nextIso);
    const problem = phoneDigitError(parts.national, parts.iso);
    onValueChange?.(toE164(parts.iso, parts.national), { ...parts, valid: problem === null });
    if (errorShown) {
      reportError(problem);
      if (!problem) setErrorShown(false);
    }
    return { parts, problem };
  };

  if (control.readOnly) {
    return (
      <p id={control.field?.controlId} className="m-0 text-sm text-fg" dir="ltr">
        {e164 ? formatPhone(e164) : "Not added"}
      </p>
    );
  }

  const autoCountry = ownNumber ? "tel-country-code" : "off";
  const autoNumber = ownNumber ? "tel-national" : "off";
  const groupInvalid = control.invalid;

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-2", className)}>
      <div role="group" aria-labelledby={control.field?.labelId} className={cn("flex w-full", CONTROL_HEIGHT[size], CONTROL_TEXT[size])}>
        <div className="relative w-28 shrink-0">
          <select
            aria-label="Country code"
            name={name ? `${name}_country` : undefined}
            autoComplete={autoCountry}
            value={iso}
            disabled={control.disabled}
            aria-invalid={groupInvalid && invalidPart !== "number" ? true : undefined}
            onChange={(event) => {
              const next = event.currentTarget.value;
              setIso(next);
              emit(next, text);
            }}
            className={cn(
              "relative h-full w-full appearance-none truncate rounded-r-none pr-8 focus-visible:z-10",
              size === "lg" ? "pl-4" : "pl-3",
              controlBox({ invalid: groupInvalid, disabled: control.disabled }),
            )}
          >
            {countries.map((country) => (
              <option key={country.iso} value={country.iso}>
                {countryOptionLabel(country)}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2.5 z-10 size-icon-sm -translate-y-1/2 text-muted" />
        </div>
        <input
          id={control.id}
          type="tel"
          name={name ? `${name}_national` : undefined}
          autoComplete={autoNumber}
          dir="ltr"
          value={text}
          disabled={control.disabled}
          required={control.required}
          aria-invalid={groupInvalid && invalidPart !== "country" ? true : undefined}
          aria-describedby={joinIds(control.describedBy, duplicate ? duplicateId : null)}
          onChange={(event) => {
            setText(event.currentTarget.value);
            emit(iso, event.currentTarget.value);
          }}
          onPaste={(event: ClipboardEvent<HTMLInputElement>) => {
            const pasted = event.clipboardData.getData("text");
            if (!/^\s*(\+|00)/.test(pasted)) return;
            event.preventDefault();
            const parts = normalisePhone(pasted, iso);
            setIso(parts.iso);
            setText(parts.national);
            emit(parts.iso, parts.national);
          }}
          onBlur={() => {
            const { parts, problem } = emit(iso, text);
            setIso(parts.iso);
            setText(formatNational(parts.national, parts.iso, { staff }));
            if (problem) {
              setErrorShown(true);
              reportError(problem);
            }
          }}
          className={cn(
            "relative -ml-px h-full min-w-0 flex-1 rounded-l-none placeholder:text-muted focus-visible:z-10 disabled:cursor-not-allowed",
            "autofill:shadow-[inset_0_0_0_1000px_var(--surface)] autofill:[-webkit-text-fill-color:var(--text)]",
            size === "lg" ? "px-4" : size === "md" ? "px-3" : "px-2.5",
            controlBox({ invalid: groupInvalid, disabled: control.disabled }),
          )}
        />
      </div>
      {name && isClient ? <input type="hidden" name={name} value={e164 ?? ""} /> : null}
      {duplicate ? (
        <p id={duplicateId} className="m-0 text-sm text-fg">
          {duplicate.visible ? (
            <>
              This number is on lead #{duplicate.leadNumber}, {duplicate.leadName}.{" "}
              <Link href={duplicate.href}>Open lead</Link>
            </>
          ) : (
            "This number is already on a lead you can't see. Saving adds this enquiry to that lead; ask your manager if you need to work on it."
          )}
        </p>
      ) : null}
    </div>
  );
}

