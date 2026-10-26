"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback/alert";
import { Combobox } from "@/components/ui/forms/combobox";
import { Field } from "@/components/ui/forms/field";
import { IconButton } from "@/components/ui/icon-button";
import { Dialog, DialogCancel } from "@/components/ui/overlays/dialog";
import { MoveList } from "./move-list";
import { MAX_QUICK_FILTERS, type QuickFilterDef } from "./quick-filters";

export type QuickFilterManagerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Every filterable field, grouped "Standard fields", "Your fields", "Activity". */
  fields: QuickFilterDef[];
  /** The person's chips now, in order. */
  shown: string[];
  defaultShown: string[];
  /** Saves member prefs; on success the dialog closes and focus returns to "Manage". */
  onSave: (shown: string[]) => Promise<void>;
};

export const QUICK_FILTER_MANAGER_TEXT = {
  title: "Quick filters",
  description: `Pick up to ${MAX_QUICK_FILTERS} filters to keep above your list. Only you see this change.`,
  limit: `You have ${MAX_QUICK_FILTERS} quick filters. Remove one to add another.`,
  saveFailed: "Couldn't save your filters. Try again.",
} as const;

/**
 * Lets each person choose which fields appear as quick filters, and in what order (components.md,
 * QuickFilterManager). Dialog md. Focus starts on the first row's Move up button; Tab goes through
 * the rows (Move up, Move down, Remove), the "Add a filter" Combobox, then the footer. Alt+Arrow Up
 * and Alt+Arrow Down move the focused row. Enter in the Combobox adds the field to the end. Esc or
 * Cancel with changes asks "Discard your changes?".
 */
export function QuickFilterManager({ open, onOpenChange, fields, shown, defaultShown, onSave }: QuickFilterManagerProps) {
  const [draft, setDraft] = useState<string[]>(shown);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  // Each opening starts from the saved set.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(shown);
      setFailed(false);
      setStatus("");
    }
  }

  const byId = new Map(fields.map((field) => [field.id, field]));
  const labelOf = (id: string) => byId.get(id)?.label ?? id;
  const dirty = draft.join() !== shown.join();
  const atMax = draft.length >= MAX_QUICK_FILTERS;
  const items = draft.map((id) => ({ id, label: labelOf(id), removed: byId.get(id)?.removed ?? !byId.has(id) }));

  const save = async () => {
    setSaving(true);
    setFailed(false);
    try {
      await onSave(draft);
      onOpenChange(false);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={QUICK_FILTER_MANAGER_TEXT.title}
      description={QUICK_FILTER_MANAGER_TEXT.description}
      size="md"
      dirty={dirty}
      submitting={saving}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      footerStart={
        <Button
          variant="link"
          onClick={() => {
            setDraft(defaultShown);
            setStatus("Quick filters reset to the default set.");
          }}
        >
          Reset to default
        </Button>
      }
      footer={
        <>
          <DialogCancel />
          <Button type="submit" size="md" loading={saving} loadingLabel="Saving…">
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {failed ? (
          <Alert tone="danger" layout="compact" live="assertive">
            {QUICK_FILTER_MANAGER_TEXT.saveFailed}
          </Alert>
        ) : null}
        <div className="flex flex-col gap-1">
          <h3 className="m-0 text-xs font-medium text-muted">Shown</h3>
          <MoveList
            label="Shown quick filters"
            autoFocusFirst
            items={items.map((item) => ({ ...item, locked: item.removed }))}
            onMove={(id, toIndex) => {
              const next = draft.filter((value) => value !== id);
              next.splice(toIndex, 0, id);
              setDraft(next);
              setStatus(`${labelOf(id)} moved to position ${toIndex + 1} of ${next.length}.`);
            }}
            renderLabel={(item) =>
              item.locked ? (
                <>
                  {item.label} <span className="text-muted">· Removed field</span>
                </>
              ) : (
                item.label
              )
            }
            renderEnd={(item) => (
              <IconButton
                icon={<X />}
                size="xs"
                variant="danger-ghost"
                aria-label={`Remove ${item.label}`}
                onClick={() => {
                  setDraft(draft.filter((id) => id !== item.id));
                  setStatus(`${item.label} removed.`);
                }}
              />
            )}
          />
        </div>
        <Field label="Add a filter" hint={atMax ? QUICK_FILTER_MANAGER_TEXT.limit : undefined}>
          <Combobox
            placeholder="Choose a field"
            noun={{ one: "field", other: "fields" }}
            value={null}
            options={fields
              .filter((field) => !field.removed && !draft.includes(field.id))
              .map((field) => ({ value: field.id, label: field.label, group: field.group ?? "Standard fields", disabled: atMax }))}
            onValueChange={(id) => {
              if (!id || atMax) return;
              const next = [...draft, id];
              setDraft(next);
              setStatus(`${labelOf(id)} added at position ${next.length} of ${MAX_QUICK_FILTERS}.`);
            }}
          />
        </Field>
        <p role="status" className="sr-only">
          {status}
        </p>
      </div>
    </Dialog>
  );
}
