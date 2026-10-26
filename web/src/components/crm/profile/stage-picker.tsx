"use client";

import { Ban, Lock } from "lucide-react";
import { useState } from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/forms/combobox";
import { Field } from "@/components/ui/forms/field";
import { Select } from "@/components/ui/forms/select";

export type StageChoice = {
  id: string;
  name: string;
  subStages?: Array<{ id: string; name: string }>;
  /** Stage flag sub_stage_required. */
  subStageRequired?: boolean;
  /** Stage flag follow_up_required. */
  followUpRequired?: boolean;
  /**
   * Why this person can't move this lead here (only_users, no_move_down): "Stages here only move
   * forward." The option stays reachable with the arrow keys so the reason is read.
   */
  blockedReason?: string | null;
  /** The rule hint for the rest of the S09 form: "Interested needs a sub-stage and a follow-up date." */
  hint?: string | null;
};

export type StagePickerValue = { stageId: string | null; subStageId: string | null };

export type StagePickerProps = {
  /**
   * single: rules checked for this lead and this person (S09). bulk: nothing blocked up front, a
   * note says blocked leads are skipped. filter: several stages, no rules, no sub-stage.
   */
  variant?: "single" | "bulk" | "filter";
  stages: StageChoice[];
  /** The lead's current stage: marked "Current", selectable to change only the sub-stage. */
  currentStageId?: string | null;
  value?: StagePickerValue;
  onValueChange?: (value: StagePickerValue) => void;
  /** filter variant. */
  filterValue?: string[];
  onFilterValueChange?: (stageIds: string[]) => void;
  /** Rule "lock": the whole picker is unavailable for everyone not listed on the rule. */
  lockedReason?: string | null;
  loading?: boolean;
  /** The Stage field's error: a server rejection, or "This stage list changed while you were working…". */
  stageError?: string | null;
  /** "Choose a sub-stage for Interested." after a submit. */
  subStageError?: string | null;
  size?: "sm" | "md";
};

export const STAGE_PICKER_TEXT = {
  bulkNote: "Leads whose stage rules block this move are skipped. You'll get a list of them.",
  stagesChanged: "This stage list changed while you were working. Choose the stage again.",
  subStageMissing: (stage: string) => `Choose a sub-stage for ${stage}.`,
} as const;

/**
 * Choose a new stage and sub-stage, and see which moves the stage rules allow for this person and
 * lead, and why the others are blocked (components.md, StagePicker). The picker only explains; the
 * server checks every rule again on POST /leads/:id/stage.
 *
 * Keyboard (Combobox): Enter or Alt+Arrow Down opens, typing filters, the arrows move (blocked
 * options included, so their reason is read), Enter picks an allowed option, Esc closes. Tab moves
 * to the sub-stage field when it shows.
 */
export function StagePicker({
  variant = "single",
  stages,
  currentStageId,
  value,
  onValueChange,
  filterValue,
  onFilterValueChange,
  lockedReason,
  loading = false,
  stageError,
  subStageError,
  size = "md",
}: StagePickerProps) {
  const [inner, setInner] = useState<StagePickerValue>({ stageId: null, subStageId: null });
  const current = value ?? inner;
  const [status, setStatus] = useState("");
  const rules = variant === "single";

  const options: ComboboxOption[] = stages.map((stage) => {
    const blocked = rules && stage.blockedReason ? stage.blockedReason : null;
    const isCurrent = stage.id === currentStageId && variant !== "filter";
    return {
      value: stage.id,
      label: stage.name,
      description: blocked ?? (isCurrent ? "Current" : undefined),
      disabled: Boolean(blocked),
      leading: blocked ? <Ban aria-hidden="true" className="size-icon-sm text-muted" /> : undefined,
    };
  });

  if (variant === "filter") {
    return (
      <Field label="Stage">
        <Combobox
          multiple
          dense={size === "sm"}
          size={size}
          options={options}
          value={filterValue}
          onValueChange={onFilterValueChange}
          placeholder="Find a stage"
          noun={{ one: "stage", other: "stages" }}
        />
      </Field>
    );
  }

  const chosen = stages.find((stage) => stage.id === current.stageId) ?? null;
  const set = (next: StagePickerValue) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Stage"
        required
        error={stageError ?? undefined}
        hint={
          lockedReason ? (
            <span className="inline-flex items-start gap-1">
              <Lock aria-hidden="true" className="mt-0.5 size-icon-sm shrink-0" />
              {lockedReason}
            </span>
          ) : variant === "bulk" ? (
            STAGE_PICKER_TEXT.bulkNote
          ) : (
            (chosen?.hint ?? undefined)
          )
        }
        disabled={Boolean(lockedReason)}
      >
        <Combobox
          size={size}
          options={options}
          value={current.stageId}
          placeholder={loading ? "Loading stages…" : "Choose a stage"}
          disabled={Boolean(lockedReason) || loading}
          noun={{ one: "stage", other: "stages" }}
          onValueChange={(stageId) => {
            const stage = stages.find((candidate) => candidate.id === stageId);
            set({ stageId, subStageId: stage && stage.id === current.stageId ? current.subStageId : null });
            // Said once, when the chosen stage makes other fields required.
            setStatus(stage?.hint && rules ? stage.hint : "");
          }}
        />
      </Field>
      {chosen && chosen.subStages && chosen.subStages.length > 0 ? (
        <Field label="Sub-stage" required={Boolean(chosen.subStageRequired)} error={subStageError ?? undefined}>
          <Select
            size={size}
            placeholder="Choose a sub-stage"
            none={chosen.subStageRequired ? false : "No sub-stage"}
            options={chosen.subStages.map((sub) => ({ value: sub.id, label: sub.name }))}
            value={current.subStageId ?? ""}
            onValueChange={(subStageId) => set({ stageId: current.stageId, subStageId })}
          />
        </Field>
      ) : null}
      <p role="status" className="sr-only">
        {status}
      </p>
    </div>
  );
}
