"use client";

import { TriangleAlert } from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type Ref,
  type TextareaHTMLAttributes,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";
import { controlBox } from "./control-styles";
import { joinIds, useFieldControl } from "./field-context";
import { useControllableState } from "./hooks";
import { countCharacters, countSms, smsSummary } from "./sms";

export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "defaultValue" | "onChange"> & {
  value?: string;
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onValueChange?: (value: string) => void;
  /** A character limit with a counter. Counted in code points, as Postgres char_length counts. */
  limit?: number;
  /** sms mode: the part count and encoding in the footer (left). */
  sms?: boolean;
  /** Maximum length of each merge token in sms mode ({ first_name: 20 }); others count as 30. */
  tokenLengths?: Record<string, number>;
  /** Grows from 3 rows to 10, then scrolls (default). false: fixed rows, resize-y. */
  autoGrow?: boolean;
  /** Staff dialogs (S09, S15, S40): Ctrl+Enter (Cmd+Enter on Mac) submits the form. */
  submitOnModEnter?: boolean;
  invalid?: boolean;
  /** staff (text-sm, 14/22) or public (text-base, 16/26); defaults to the Field's surface. */
  surface?: "staff" | "public";
  ref?: Ref<HTMLTextAreaElement>;
};

/**
 * Multi-line text: remarks, notes, replies, SMS bodies (components.md Textarea).
 *
 * - Over the limit the text is never cut: the counter turns danger, the box gets border-danger and
 *   aria-invalid at once, and the form's error summary lists it on submit.
 * - The visible counter is aria-hidden. A separate polite region says "{n} characters left" or
 *   "{n} over the limit" 800 ms after typing stops, only when 20% or less is left or the text is over.
 * - Enter adds a line; Tab is never captured.
 */
export function Textarea({
  value,
  defaultValue = "",
  onChange,
  onValueChange,
  limit,
  sms = false,
  tokenLengths,
  autoGrow = true,
  submitOnModEnter = false,
  invalid: invalidProp,
  surface: surfaceProp,
  className,
  onKeyDown,
  rows = 3,
  ref,
  id: idProp,
  required: requiredProp,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  "aria-describedby": describedByProp,
  "aria-invalid": ariaInvalid,
  ...rest
}: TextareaProps) {
  const control = useFieldControl({
    id: idProp,
    required: requiredProp,
    disabled: disabledProp,
    readOnly: readOnlyProp,
    invalid: invalidProp,
    "aria-describedby": describedByProp,
    "aria-invalid": ariaInvalid,
  });
  const surface = surfaceProp ?? control.surface;
  const isPublic = surface === "public";
  const [current, setCurrent] = useControllableState(value, defaultValue, onValueChange);
  const ownRef = useRef<HTMLTextAreaElement | null>(null);
  const composedRef = useMemo(() => mergeRefs(ref, ownRef), [ref]);
  const smsNoteId = useId();

  const count = countCharacters(current);
  const left = limit !== undefined ? limit - count : null;
  const over = left !== null && left < 0;
  const near = left !== null && !over && left <= Math.ceil(limit! * 0.1);
  const announceable = left !== null && (over || left <= Math.floor(limit! * 0.2));
  const counterText = left === null ? null : over ? `${-left} over the limit` : `${left} left`;
  const invalid = control.invalid || over;

  const info = sms ? countSms(current, tokenLengths) : null;

  // The polite count, 800 ms after typing stops.
  const [spoken, setSpoken] = useState("");
  useEffect(() => {
    if (left === null) return;
    const timer = window.setTimeout(() => {
      setSpoken(announceable ? (over ? `${-left} over the limit` : `${left} characters left`) : "");
    }, 800);
    return () => window.clearTimeout(timer);
  }, [left, over, announceable]);

  // Older browsers without field-sizing: grow with a script.
  useEffect(() => {
    const node = ownRef.current;
    if (!autoGrow || !node || typeof CSS === "undefined" || CSS.supports("field-sizing", "content")) return;
    node.style.height = "auto";
    const max = parseFloat(getComputedStyle(node).maxHeight) || Infinity;
    node.style.height = `${Math.min(node.scrollHeight + 2, max)}px`;
  }, [current, autoGrow]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (submitOnModEnter && event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const showFooter = counterText !== null || info !== null;

  return (
    <div className="flex w-full min-w-0 flex-col">
      <textarea
        {...rest}
        ref={composedRef}
        id={control.id}
        rows={rows}
        value={current}
        onChange={(event) => {
          setCurrent(event.currentTarget.value);
          onChange?.(event);
        }}
        onKeyDown={handleKeyDown}
        required={control.required}
        disabled={control.disabled}
        readOnly={control.readOnly}
        aria-invalid={invalid || undefined}
        aria-describedby={joinIds(control.describedBy, info && info.encoding === "unicode" ? smsNoteId : null)}
        dir={rest.dir ?? "auto"}
        className={cn(
          "block w-full placeholder:text-muted",
          controlBox({ invalid, disabled: control.disabled, readOnly: control.readOnly }),
          isPublic ? "min-h-26 px-4 py-3 text-base leading-prose" : "min-h-21 px-3 py-2 text-sm pointer-coarse:text-base",
          autoGrow ? cn("field-sizing-content resize-y", isPublic ? "max-h-72" : "max-h-60") : "resize-y",
          className,
        )}
      />
      {showFooter ? (
        <div className={cn("mt-1 flex flex-wrap items-start justify-between gap-x-4 gap-y-1", isPublic ? "text-sm" : "text-xs")}>
          {info ? (
            <div className="flex min-w-0 flex-col gap-1 text-muted">
              <span>{smsSummary(info)}</span>
              {info.encoding === "unicode" ? (
                <span id={smsNoteId}>Uses Unicode (Hindi, emoji and some symbols), so each part holds 70 characters.</span>
              ) : null}
              {info.parts > 3 ? (
                <span className="flex items-start gap-1 text-warning">
                  <TriangleAlert aria-hidden="true" className="mt-px size-icon-sm shrink-0" />
                  This message is {info.parts} SMS parts. Each part is charged.
                </span>
              ) : null}
            </div>
          ) : (
            <span />
          )}
          {counterText ? (
            <span
              aria-hidden="true"
              className={cn("ml-auto tabular-nums", over ? "font-medium text-danger" : near ? "text-warning" : "text-muted")}
            >
              {counterText}
            </span>
          ) : null}
        </div>
      ) : null}
      {limit !== undefined ? (
        <span role="status" aria-live="polite" className="sr-only">
          {spoken}
        </span>
      ) : null}
    </div>
  );
}
