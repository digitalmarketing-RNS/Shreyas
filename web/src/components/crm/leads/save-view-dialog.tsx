"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/forms/field";
import { RadioGroup } from "@/components/ui/forms/radio-group";
import { TextInput } from "@/components/ui/forms/text-input";
import { Dialog, DialogCancel } from "@/components/ui/overlays/dialog";
import { SAVED_VIEW_TEXT } from "./saved-views";

export type SaveViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The tenant's name, for "Everyone at {Institution}". */
  institution: string;
  /** Names of the person's own views, to catch a taken name before saving. */
  takenNames: string[];
  /** Saves; resolve "taken" when the server finds the name in use. */
  onSave: (view: { name: string; shared: boolean }) => Promise<void | "taken">;
  defaultName?: string;
};

/**
 * "Save view" (dialog-sm, components.md SavedViewPicker): Name (required, at most 60 characters) and
 * "Who can use it". Errors show under the field and focus moves to it (FormLayout).
 */
export function SaveViewDialog({ open, onOpenChange, institution, takenNames, onSave, defaultName = "" }: SaveViewDialogProps) {
  const [name, setName] = useState(defaultName);
  const [audience, setAudience] = useState("me");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fail = (message: string) => {
    setError(message);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return fail(SAVED_VIEW_TEXT.nameMissing);
    if (takenNames.some((taken) => taken.toLowerCase() === trimmed.toLowerCase())) return fail(SAVED_VIEW_TEXT.nameTaken(trimmed));
    setSaving(true);
    try {
      const result = await onSave({ name: trimmed, shared: audience === "everyone" });
      if (result === "taken") fail(SAVED_VIEW_TEXT.nameTaken(trimmed));
      else onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Save view"
      size="sm"
      dirty={name.trim() !== defaultName.trim()}
      submitting={saving}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      footer={
        <>
          <DialogCancel />
          <Button type="submit" size="md" loading={saving} loadingLabel="Saving…">
            Save view
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name" required error={error ?? undefined}>
          <TextInput
            ref={inputRef}
            value={name}
            maxLength={60}
            onValueChange={(next) => {
              setName(next);
              if (error) setError(null);
            }}
          />
        </Field>
        <RadioGroup
          legend="Who can use it"
          name="view-audience"
          value={audience}
          onValueChange={setAudience}
          hint={SAVED_VIEW_TEXT.shareNote}
          options={[
            { value: "me", label: "Only me" },
            { value: "everyone", label: `Everyone at ${institution}` },
          ]}
        />
      </div>
    </Dialog>
  );
}
