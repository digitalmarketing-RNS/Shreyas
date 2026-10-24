"use client";

import { useId, useRef, useState } from "react";
import { Button } from "../button";
import { Field } from "./field";
import { TextInput } from "./text-input";

export type WriteOnlySecretResult = { ok: true; savedOn: string } | { ok: false; error: "invalid" | "failed" };

export type WriteOnlySecretProps = {
  /** "Key secret". */
  label: string;
  /** The noun in the buttons: "key secret" → "Replace key secret", "Add key secret". */
  noun?: string;
  name?: string;
  /** When the latest version was saved ("06 Oct 2026"), or null when none is saved. */
  savedOn?: string | null;
  hint?: string;
  /** A format check per provider; return the error, or null. */
  validate?: (value: string) => string | null;
  onSave?: (value: string) => Promise<WriteOnlySecretResult>;
  /** Start in the replacing state (a screen that opens straight into it, and the gallery). */
  initialReplacing?: boolean;
  initialError?: "invalid" | "failed";
  className?: string;
};

const INVALID = "This doesn't look like a key secret for this gateway. Check you copied all of it.";
const FAILED = "Couldn't save. Try again.";

/**
 * A secret the institution pastes in and never sees again (components.md SecretReveal, write-only:
 * S35 SMS and telephony keys, S36 gateway keys). The server never sends the stored value; the field
 * shows only that one is saved and when. "Replace" opens a password input with Save and Cancel;
 * password managers neither fill nor offer to save it (new-password, data-1p-ignore,
 * data-lpignore).
 */
export function WriteOnlySecret({
  label,
  noun = "key secret",
  name,
  savedOn = null,
  hint = "Paste the new secret from your gateway's dashboard. We store it encrypted and can't show it again.",
  validate,
  onSave,
  initialReplacing = false,
  initialError,
  className,
}: WriteOnlySecretProps) {
  const base = useId();
  const labelId = `${base}-label`;
  const [stored, setStored] = useState<string | null>(savedOn);
  const [replacing, setReplacing] = useState(initialReplacing);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(initialError === "invalid" ? INVALID : initialError === "failed" ? FAILED : null);
  const openerRef = useRef<HTMLDivElement | null>(null);

  const cancel = () => {
    setReplacing(false);
    setDraft("");
    setError(null);
    window.requestAnimationFrame(() => openerRef.current?.querySelector("button")?.focus());
  };

  const save = async () => {
    const problem = validate?.(draft.trim()) ?? (draft.trim() ? null : `Paste the ${noun}.`);
    if (problem) {
      setError(problem);
      return;
    }
    if (!onSave) return;
    setSaving(true);
    const result = await onSave(draft.trim());
    setSaving(false);
    if (result.ok) {
      setStored(result.savedOn);
      cancel();
    } else {
      setError(result.error === "invalid" ? INVALID : FAILED);
    }
  };

  if (replacing) {
    return (
      <div className={className}>
        <Field label={label} hint={hint} error={error ?? undefined}>
          <TextInput
            type="password"
            name={name}
            autoComplete="new-password"
            data-1p-ignore=""
            data-lpignore="true"
            value={draft}
            onValueChange={(next) => {
              setDraft(next);
              if (error) setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void save();
              } else if (event.key === "Escape") {
                event.preventDefault();
                cancel();
              }
            }}
          />
        </Field>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="md" loading={saving} loadingLabel="Saving…" onClick={() => void save()}>
            Save
          </Button>
          <Button size="md" variant="secondary" onClick={cancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div role="group" aria-labelledby={labelId} className={className}>
      <span id={labelId} className="text-sm font-medium text-fg">
        {label}
      </span>
      <div ref={openerRef} className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="m-0 text-sm text-fg">
          {stored ? (
            <>
              Saved <span className="text-muted">· updated {stored}</span>
            </>
          ) : (
            "Not added yet"
          )}
        </p>
        <Button variant="secondary" size="md" onClick={() => setReplacing(true)}>
          {stored ? `Replace ${noun}` : `Add ${noun}`}
        </Button>
      </div>
    </div>
  );
}
