"use client";

import { CircleCheck, Eye, X } from "lucide-react";
import {
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type Ref,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";
import { ControlSpinner, IconButton } from "../icon-button";
import {
  BARE_INPUT,
  CONTROL_HEIGHT,
  CONTROL_PADDING_X,
  CONTROL_TEXT,
  type ControlSize,
  RING_FROM_INPUT,
  controlBox,
} from "./control-styles";
import { useFieldControl } from "./field-context";
import { useControllableState } from "./hooks";

export type TextInputType = "text" | "email" | "url" | "password";

export type TextInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "prefix" | "type" | "value" | "defaultValue" | "onChange"
> & {
  /** Search uses SearchInput, small numbers NumberStepper, phone numbers PhoneInput, stored secrets SecretReveal. */
  type?: TextInputType;
  /** sm 32 (filters, toolbars, inline edit), md 40 (staff forms, default), lg 48 (public pages). */
  size?: ControlSize;
  value?: string;
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
  /** Text before the value: "₹", "https://". */
  prefix?: string;
  /** Text after the value: "days", "%". */
  suffix?: string;
  /** A Lucide icon before the value, 16 px, 12 px from the left edge. */
  leadingIcon?: ReactElement;
  /** Shows a clear button (the next tab stop) when there is a value; clearing returns focus here. */
  clearable?: boolean;
  /** The clear button's name: "Clear amount". */
  clearLabel?: string;
  /** An async check is running ("is this email already a lead?"), or the value is confirmed (verified email). */
  status?: "checking" | "confirmed";
  /**
   * Outer spaces are trimmed on blur. On by default for email and URL; pass "code" behaviour with
   * trim. Passwords are never trimmed; names keep their inner spaces.
   */
  trim?: boolean;
  /** Inline edit (S08 key-value rows): Enter saves, Esc cancels. */
  onSave?: (value: string) => void;
  onCancel?: () => void;
  invalid?: boolean;
  /** Classes for the box (width: w-24 for a PIN code, w-40 for an amount). */
  className?: string;
  inputClassName?: string;
  ref?: Ref<HTMLInputElement>;
};

/**
 * Single-line text: names, email addresses, URLs, codes, amounts, passwords (components.md
 * TextInput). Put it inside a Field for its label, hint and error.
 *
 * - The box draws the focus ring for the input inside it, so adornments sit within the ring.
 * - Free text has no maxlength (it silently cuts pasted text); fixed formats may set one.
 * - Email, URL and code values: spellcheck and autocapitalize off. Names and free text: dir="auto".
 * - When staff type a lead's details, pass autoComplete="off" so the browser does not offer the
 *   counsellor's own.
 */
export function TextInput({
  type = "text",
  size = "md",
  value,
  defaultValue = "",
  onChange,
  onValueChange,
  prefix,
  suffix,
  leadingIcon,
  clearable = false,
  clearLabel = "Clear",
  status,
  trim,
  onSave,
  onCancel,
  invalid: invalidProp,
  className,
  inputClassName,
  onBlur,
  onKeyDown,
  ref,
  id: idProp,
  required: requiredProp,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  "aria-describedby": describedByProp,
  "aria-invalid": ariaInvalid,
  ...rest
}: TextInputProps) {
  const control = useFieldControl({
    id: idProp,
    required: requiredProp,
    disabled: disabledProp,
    readOnly: readOnlyProp,
    invalid: invalidProp,
    "aria-describedby": describedByProp,
    "aria-invalid": ariaInvalid,
  });
  const [current, setCurrent] = useControllableState(value, defaultValue, onValueChange);
  const [revealed, setRevealed] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const composedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);

  const isPassword = type === "password";
  const isCode = type === "email" || type === "url";
  const shouldTrim = !isPassword && (trim ?? isCode);
  const interactive = !control.disabled && !control.readOnly;
  const showClear = clearable && interactive && current.length > 0;

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (shouldTrim) {
      const trimmed = event.currentTarget.value.trim();
      if (trimmed !== event.currentTarget.value) setCurrent(trimmed);
    }
    onBlur?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (onSave && event.key === "Enter") {
      event.preventDefault();
      onSave(shouldTrim ? current.trim() : current);
    } else if (onCancel && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
  };

  // Clicks on the box's padding or adornments focus the input, as a plain input would.
  const focusInput = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget || (event.target as HTMLElement).dataset.adornment !== undefined) {
      event.preventDefault();
      inputRef.current?.focus();
    }
  };

  const hasLeading = Boolean(leadingIcon || prefix);

  return (
    <div
      onMouseDown={focusInput}
      className={cn(
        "relative flex w-full items-center gap-2",
        CONTROL_HEIGHT[size],
        CONTROL_TEXT[size],
        hasLeading ? "pl-3" : CONTROL_PADDING_X[size],
        showClear || isPassword || status ? "pr-1" : CONTROL_PADDING_X[size],
        controlBox({ invalid: control.invalid, disabled: control.disabled, readOnly: control.readOnly }),
        RING_FROM_INPUT,
        className,
      )}
    >
      {leadingIcon ? (
        <span data-adornment="" aria-hidden="true" className="inline-flex shrink-0 text-muted [&_svg]:size-icon-sm">
          {leadingIcon}
        </span>
      ) : null}
      {prefix ? (
        <span data-adornment="" aria-hidden="true" className="shrink-0 text-muted">
          {prefix}
        </span>
      ) : null}
      <input
        {...rest}
        ref={composedRef}
        id={control.id}
        type={isPassword && revealed ? "text" : type}
        value={current}
        onChange={(event) => {
          setCurrent(event.currentTarget.value);
          onChange?.(event);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        required={control.required}
        disabled={control.disabled}
        readOnly={control.readOnly}
        aria-invalid={control.invalid || undefined}
        aria-describedby={control.describedBy}
        spellCheck={isCode || isPassword ? false : rest.spellCheck}
        autoCapitalize={isCode || isPassword ? "off" : rest.autoCapitalize}
        dir={rest.dir ?? (isCode || isPassword ? undefined : "auto")}
        className={cn(BARE_INPUT, inputClassName)}
      />
      {suffix ? (
        <span data-adornment="" aria-hidden="true" className="shrink-0 text-muted">
          {suffix}
        </span>
      ) : null}
      {status === "checking" ? (
        <span data-adornment="" aria-hidden="true" className="inline-flex size-control-xs shrink-0 items-center justify-center text-muted [&_svg]:size-icon-sm">
          <ControlSpinner />
        </span>
      ) : null}
      {status === "confirmed" ? (
        <span data-adornment="" aria-hidden="true" className="inline-flex size-control-xs shrink-0 items-center justify-center text-success">
          <CircleCheck className="size-icon-sm" />
        </span>
      ) : null}
      {showClear ? (
        <IconButton
          variant="in-field"
          icon={<X />}
          aria-label={clearLabel}
          onClick={() => {
            setCurrent("");
            inputRef.current?.focus();
          }}
        />
      ) : null}
      {isPassword && !control.disabled ? (
        <IconButton
          variant="toggle"
          size="xs"
          icon={<Eye />}
          aria-label="Show password"
          pressed={revealed}
          onPressedChange={setRevealed}
        />
      ) : null}
    </div>
  );
}
