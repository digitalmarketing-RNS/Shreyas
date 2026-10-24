"use client";

import {
  type FormEvent,
  type FocusEvent,
  type ReactNode,
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import { Button } from "../button";
import { ErrorSummary } from "./error-summary";
import { FormContext, type FormContextValue, type FormErrors } from "./form-context";
import { InlineAlert } from "./inline-alert";

/** What a submit handler or Server Action returns. Values are always kept by the form. */
export type FormResult = { ok: true; message?: string } | { ok: false; errors?: FormErrors; network?: boolean };

export type FormProps = {
  /** staff (default) or public: public forms put the primary full width and show "(optional)" marks. */
  surface?: "staff" | "public";
  /**
   * Client checks: every error by field name. Run in full on submit; on blur for a field that is not
   * empty (format checks); and on each input for a field that already shows an error.
   */
  validate?: (data: FormData) => FormErrors;
  /** Client submit (staff dialogs and pages). */
  onSubmit?: (data: FormData) => Promise<FormResult>;
  /**
   * A Server Action for useActionState. The form then works before JavaScript loads; the server
   * returns errors under the same field names.
   */
  action?: (previous: FormResult | null, data: FormData) => Promise<FormResult>;
  /** Errors that came with the page (a server render after a failed post). */
  initialErrors?: FormErrors;
  /** Intro under the title: "All fields are required unless marked optional." (public). */
  intro?: ReactNode;
  /** Staff forms say "* required" once at the top. */
  requiredNote?: boolean;
  /** Public: the success message that replaces the form and takes focus. */
  successMessage?: ReactNode;
  onSuccess?: () => void;
  /** Warn before leaving the page with unsaved changes. */
  guardUnsaved?: boolean;
  /** The heading level of the error summary (2 under the page's h1). */
  summaryHeadingLevel?: 2 | 3 | 4;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
  children: ReactNode;
};

function fieldValueEmpty(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return true;
  if (target instanceof HTMLInputElement && (target.type === "checkbox" || target.type === "radio")) return false;
  return target.value.trim() === "";
}

/** The field name an element belongs to: its own name, or the Field it sits in (data-field-name). */
function fieldNameOf(target: EventTarget | null): string | null {
  if (!(target instanceof HTMLElement)) return null;
  const named = target.getAttribute("name");
  if (named) return named.replace(/_(national|country|day|month|year)$/, "").replace(/\[\]$/, "");
  return null;
}

/**
 * A form laid out and behaving the same everywhere (components.md FormLayout): an optional error
 * summary, an intro, sections, fields and an actions row; a polite status region ("Saving…",
 * "Saved"); a danger alert when the network fails.
 *
 * - <form noValidate>, so our messages replace the browser's. Enter in a single-line field submits.
 * - On submit with errors: forms with 1 or 2 fields focus the first invalid field; longer forms
 *   show the error summary at the top and move focus to it.
 * - Submitting keeps every field editable; the primary shows its loading state ("Saving…", or
 *   "Uploading…" while files are still uploading). The submit button is never disabled to signal
 *   invalid fields.
 * - Network failure keeps every value and offers "Try again" with the same data (public forms reuse
 *   the same Idempotency-Key).
 */
export function Form({
  surface = "staff",
  validate,
  onSubmit,
  action,
  initialErrors = {},
  intro,
  requiredNote = false,
  successMessage,
  onSuccess,
  guardUnsaved = false,
  summaryHeadingLevel = 2,
  className,
  id,
  "aria-labelledby": labelledBy,
  children,
}: FormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const fieldIds = useRef(new Map<string, string>());
  const lastData = useRef<FormData | null>(null);
  const [errors, setErrors] = useState<FormErrors>(initialErrors);
  const [showSummary, setShowSummary] = useState(Object.keys(initialErrors).length > 2);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [networkFailed, setNetworkFailed] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [succeeded, setSucceeded] = useState(false);
  const [dirty, setDirty] = useState(false);
  // The same map as fieldIds, as state, so the summary's links render from it.
  const [fieldTargets, setFieldTargets] = useState<Record<string, string>>({});
  const successRef = useRef<HTMLDivElement | null>(null);

  const [actionResult, formAction, actionPending] = useActionState<FormResult | null, FormData>(
    action ?? (async () => null),
    null,
  );

  const registerField = useCallback((name: string, controlId: string) => {
    fieldIds.current.set(name, controlId);
    setFieldTargets((current) => ({ ...current, [name]: controlId }));
    return () => {
      if (fieldIds.current.get(name) !== controlId) return;
      fieldIds.current.delete(name);
      setFieldTargets((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    };
  }, []);

  const handleResult = useCallback(
    (result: FormResult | null) => {
      if (!result) return;
      if (result.ok) {
        setErrors({});
        setShowSummary(false);
        setNetworkFailed(false);
        setDirty(false);
        setStatusText(result.message ?? "Saved");
        if (successMessage) setSucceeded(true);
        onSuccess?.();
        return;
      }
      if (result.network) {
        setNetworkFailed(true);
        setStatusText("");
        return;
      }
      const next = result.errors ?? {};
      setErrors(next);
      setStatusText("");
      revealErrors(next);
    },
    [successMessage, onSuccess],
  );

  // A Server Action's result arrives through useActionState; it is handled once, after the render
  // that delivered it (focus moves and announcements need the new DOM).
  useEffect(() => {
    if (!action || !actionResult) return;
    let live = true;
    void Promise.resolve().then(() => {
      if (live) handleResult(actionResult);
    });
    return () => {
      live = false;
    };
  }, [action, actionResult, handleResult]);

  // The success message takes focus when it replaces the form.
  useEffect(() => {
    if (succeeded) successRef.current?.focus();
  }, [succeeded]);

  // Unsaved changes: the browser asks before the page goes away.
  useEffect(() => {
    if (!guardUnsaved || !dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [guardUnsaved, dirty]);

  function revealErrors(next: FormErrors) {
    const names = Object.keys(next);
    if (names.length === 0) return;
    if (names.length <= 2 && fieldIds.current.size <= 2) {
      setShowSummary(false);
      const first = fieldIds.current.get(names[0]);
      window.requestAnimationFrame(() => focusControl(first));
    } else {
      setShowSummary(true); // the summary focuses itself when it mounts
    }
  }

  const waitForUploads = async () => {
    const form = formRef.current;
    if (!form?.querySelector('[data-uploads-pending="true"]')) return;
    setUploading(true);
    setStatusText("Uploading…");
    await new Promise<void>((resolve) => {
      const timer = window.setInterval(() => {
        if (!form.querySelector('[data-uploads-pending="true"]')) {
          window.clearInterval(timer);
          resolve();
        }
      }, 200);
    });
    setUploading(false);
  };

  const submit = async (data: FormData) => {
    lastData.current = data;
    setNetworkFailed(false);
    if (onSubmit) {
      setPending(true);
      setStatusText("Saving…");
      try {
        handleResult(await onSubmit(data));
      } catch {
        handleResult({ ok: false, network: true });
      } finally {
        setPending(false);
      }
    } else if (action) {
      setStatusText("Saving…");
      startTransition(() => formAction(data));
    }
  };

  const onFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    await waitForUploads();
    const data = new FormData(form);
    const found = validate ? validate(data) : {};
    if (Object.keys(found).length > 0) {
      setErrors(found);
      revealErrors(found);
      return;
    }
    setErrors({});
    setShowSummary(false);
    await submit(data);
  };

  // Format checks on blur, for fields that are not empty.
  const onBlurCapture = (event: FocusEvent<HTMLFormElement>) => {
    if (!validate) return;
    const target = event.target;
    const name = fieldNameOf(target);
    if (!name || fieldValueEmpty(target)) return;
    const form = event.currentTarget;
    // After the control's own blur work (trimming) has rendered.
    window.setTimeout(() => {
      const found = validate(new FormData(form));
      setErrors((current) => {
        const next = { ...current };
        if (found[name]) next[name] = found[name];
        else delete next[name];
        return next;
      });
    }, 0);
  };

  // Once a field shows an error, it is checked again on every input.
  const onInputCapture = (event: FormEvent<HTMLFormElement>) => {
    setDirty(true);
    if (!validate) return;
    const name = fieldNameOf(event.target);
    if (!name || !errors[name]) return;
    const form = event.currentTarget;
    window.setTimeout(() => {
      const found = validate(new FormData(form));
      setErrors((current) => {
        const next = { ...current };
        if (found[name]) next[name] = found[name];
        else delete next[name];
        return next;
      });
    }, 0);
  };

  const context = useMemo<FormContextValue>(
    () => ({ surface, errors, pending: pending || actionPending, uploading, registerField }),
    [surface, errors, pending, actionPending, uploading, registerField],
  );

  const summaryItems = Object.entries(errors).map(([name, message]) => ({ message, targetId: fieldTargets[name] }));
  const isPublic = surface === "public";

  if (succeeded && successMessage) {
    return (
      <div ref={successRef} tabIndex={-1} className={cn("rounded-md text-fg", isPublic ? "text-base" : "text-sm", className)}>
        {successMessage}
      </div>
    );
  }

  return (
    <FormContext.Provider value={context}>
      <form
        ref={formRef}
        id={id}
        noValidate
        aria-labelledby={labelledBy}
        action={action ? formAction : undefined}
        onSubmit={action && !validate ? undefined : onFormSubmit}
        onBlurCapture={onBlurCapture}
        onInputCapture={onInputCapture}
        className={cn("flex flex-col", isPublic ? "gap-6" : "gap-4", className)}
      >
        {showSummary && summaryItems.length > 0 ? (
          <ErrorSummary items={summaryItems} surface={surface} headingLevel={summaryHeadingLevel} />
        ) : null}
        {networkFailed ? (
          <InlineAlert
            tone="danger"
            role="alert"
            srTone={false}
            actions={
              <Button
                variant="secondary"
                onClick={() => {
                  if (lastData.current) void submit(lastData.current);
                }}
              >
                Try again
              </Button>
            }
          >
            Not sent. Check your connection and try again.
          </InlineAlert>
        ) : null}
        {intro ? <div className={cn("text-muted", isPublic ? "text-base" : "text-sm")}>{intro}</div> : null}
        {requiredNote && !isPublic ? (
          <p className="m-0 text-xs text-muted">
            <span className="text-danger">*</span> required
          </p>
        ) : null}
        {children}
        <p role="status" className="sr-only">
          {statusText}
        </p>
      </form>
    </FormContext.Provider>
  );
}

function focusControl(id: string | undefined) {
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  const focusable = target.matches("input, select, textarea, button, [tabindex]")
    ? target
    : target.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea, button, [tabindex]");
  focusable?.focus();
}
