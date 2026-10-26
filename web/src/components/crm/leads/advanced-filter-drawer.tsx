"use client";

import { type KeyboardEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorSummary } from "@/components/ui/forms/error-summary";
import { Drawer } from "@/components/ui/overlays/drawer";
import { type ConditionCount, ConditionBuilder } from "./condition-builder";
import { type ConditionField, type ConditionTree, EMPTY_TREE, countConditions, errorCount, validateTree } from "./conditions";

export type AdvancedFilterDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: ConditionField[];
  /** The conditions applied now. */
  applied: ConditionTree;
  onApply: (tree: ConditionTree) => void;
  onSaveAsView?: (tree: ConditionTree) => void;
  /** Counts the draft, 500 ms after the last valid change (the page runs it under the person's scope). */
  count?: ConditionCount;
  onDraftChange?: (tree: ConditionTree) => void;
  masked?: boolean;
  today?: string;
};

/**
 * The advanced filter (S06): ConditionBuilder in a Drawer with "Clear all", "Save as view" and
 * "Apply" (components.md, ConditionBuilder, advanced filter variant). Ctrl+Enter (Cmd+Enter)
 * applies; Esc closes and asks first when there are unapplied changes. Apply checks every row and,
 * when some are wrong, shows the error summary and keeps the drawer open.
 */
export function AdvancedFilterDrawer({
  open,
  onOpenChange,
  fields,
  applied,
  onApply,
  onSaveAsView,
  count,
  onDraftChange,
  masked,
  today,
}: AdvancedFilterDrawerProps) {
  const [draft, setDraft] = useState<ConditionTree>(applied);
  const [showErrors, setShowErrors] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(applied);
      setShowErrors(false);
    }
  }
  const dirty = JSON.stringify(draft) !== JSON.stringify(applied);
  const errors = validateTree(draft, fields);
  const problems = errorCount(errors);
  const pending = dirty ? countConditions(draft) : 0;

  const change = (tree: ConditionTree) => {
    setDraft(tree);
    onDraftChange?.(tree);
  };

  const apply = () => {
    if (problems > 0) {
      setShowErrors(true);
      return;
    }
    onApply(draft);
    onOpenChange(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      apply();
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="More filters"
      size="lg"
      dirty={dirty}
      pendingNote={dirty ? `${pending} ${pending === 1 ? "condition" : "conditions"} not applied` : undefined}
      footerStart={
        <Button variant="ghost" size="md" onClick={() => change(EMPTY_TREE)}>
          Clear all
        </Button>
      }
      footer={
        <>
          {onSaveAsView ? (
            <Button variant="secondary" size="md" onClick={() => onSaveAsView(draft)}>
              Save as view
            </Button>
          ) : null}
          <Button size="md" onClick={apply}>
            Apply
          </Button>
        </>
      }
    >
      <div onKeyDown={onKeyDown} className="flex flex-col gap-4">
        {showErrors && problems > 0 ? (
          <ErrorSummary
            headingLevel={3}
            items={[
              ...Object.values(errors.conditions).map((message) => ({ message })),
              ...Object.values(errors.groups).map((message) => ({ message })),
            ]}
          />
        ) : null}
        <ConditionBuilder variant="filter" legendHidden fields={fields} value={draft} onValueChange={change} count={count} masked={masked} showErrors={showErrors} today={today} />
      </div>
    </Drawer>
  );
}
