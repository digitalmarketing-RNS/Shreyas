"use client";

import { CircleAlert, Plus } from "lucide-react";
import { type ReactNode, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import { Spinner } from "@/components/ui/feedback/spinner";
import { cn } from "@/lib/cn";
import { ConditionRow } from "./condition-row";
import {
  CONDITION_ERRORS,
  type Condition,
  type ConditionField,
  type ConditionGroup,
  type ConditionTree,
  type Match,
  addCondition,
  addGroup,
  atLimit,
  blankCondition,
  describeCondition,
  flatConditions,
  newId,
  removeItem,
  setMatch,
  summarise,
  updateCondition,
  validateTree,
} from "./conditions";

export type ConditionCount =
  | { state: "idle" }
  | { state: "counting" }
  /** "About 1,240 leads match." */
  | { state: "done"; text: string }
  | { state: "failed" };

export type ConditionBuilderProps = {
  /**
   * filter (S06 advanced filter) and audience (S16) show the match count; automation (S18) and
   * report (S22) have none; stage-scope (S29) is one group with the field fixed to Stage.
   */
  variant?: "filter" | "audience" | "automation" | "report" | "stage-scope";
  fields: ConditionField[];
  value: ConditionTree;
  onValueChange: (tree: ConditionTree) => void;
  /** The role sees contacts masked: email and mobile offer only empty and verified checks. */
  masked?: boolean;
  /** "Leads" in "Leads that match … of these conditions". */
  subject?: string;
  count?: ConditionCount;
  /** A shared view you don't own, or a published automation version: the conditions as text. */
  readOnly?: boolean;
  /** The legend is sr-only when a Drawer or panel title already says "Conditions". */
  legendHidden?: boolean;
  /** Show every error now (after Apply or Save). */
  showErrors?: boolean;
  today?: string;
  /** Footer extras (the Drawer's buttons live in the Drawer). */
  footer?: ReactNode;
  className?: string;
};

export const CONDITION_TEXT = {
  empty: "No conditions yet. Every lead is included.",
  countFailed: "Couldn't count the matches. Your conditions are kept.",
} as const;

/**
 * AND and OR rules on any field, with one level of nested groups (components.md, ConditionBuilder).
 * The root and each group are <fieldset>s with a plain-text legend; the "all | any" control is a
 * role="radiogroup" named by the words around it, never inside a legend. Errors show on Apply or
 * Save, or when a filled row loses focus. Removing a row moves focus to the next row's Field, or to
 * "Add condition". The match count sits in a polite status region; the summary is plain text.
 *
 * Keyboard: Tab follows the rows (Field, Comparison, Value, Remove), then the group's add buttons;
 * the arrow keys switch "all" and "any".
 */
export function ConditionBuilder({
  variant = "filter",
  fields,
  value,
  onValueChange,
  masked = false,
  subject = "Leads",
  count,
  readOnly = false,
  legendHidden = false,
  showErrors = false,
  today,
  footer,
  className,
}: ConditionBuilderProps) {
  const base = useId();
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const inputRefs = useRef(new Map<string, HTMLInputElement | null>());
  const addRef = useRef<HTMLButtonElement>(null);
  const flat = flatConditions(value);
  const errors = validateTree(value, fields);
  const limit = atLimit(value);
  const stageScope = variant === "stage-scope";

  const errorFor = (condition: Condition) => (showErrors || touched.has(condition.id) ? (errors.conditions[condition.id] ?? null) : null);

  const remove = (id: string) => {
    const index = flat.findIndex((condition) => condition.id === id);
    const next = removeItem(value, id);
    onValueChange(next);
    const following = flatConditions(next)[index];
    window.requestAnimationFrame(() => {
      const target = following ? inputRefs.current.get(following.id) : null;
      (target ?? addRef.current)?.focus();
    });
  };

  const focusNew = (id: string) => window.requestAnimationFrame(() => inputRefs.current.get(id)?.focus());

  const rowFor = (condition: Condition, connector: "and" | "or" | null, showLabels: boolean) => (
    <ConditionRow
      key={condition.id}
      condition={condition}
      index={flat.indexOf(condition)}
      total={flat.length}
      connector={connector}
      fields={fields}
      masked={masked}
      fixedField={stageScope}
      showLabels={showLabels}
      today={today}
      error={errorFor(condition)}
      onLeave={() => setTouched((previous) => new Set(previous).add(condition.id))}
      fieldInputRef={(node) => {
        inputRefs.current.set(condition.id, node);
      }}
      onChange={(patch) => onValueChange(updateCondition(value, condition.id, patch))}
      onRemove={stageScope ? undefined : () => remove(condition.id)}
    />
  );

  const sentence = (id: string, before: string, after: string, match: Match, onMatch: (match: Match) => void) => (
    <p className="m-0 flex flex-wrap items-center gap-2 text-sm text-fg">
      <span id={`${id}-pre`}>{before}</span>
      <SegmentedControl
        legend={`${before} … ${after}`}
        labelledBy={`${id}-pre ${id}-post`}
        size="sm"
        options={[
          { value: "all", label: "all" },
          { value: "any", label: "any" },
        ]}
        value={match}
        onValueChange={(next) => onMatch(next as Match)}
      />
      <span id={`${id}-post`}>{after}</span>
    </p>
  );

  if (readOnly) {
    return (
      <fieldset className={cn("m-0 flex min-w-0 flex-col gap-2 border-0 p-0", className)}>
        <legend className={cn("mb-2 p-0 text-sm font-medium text-fg", legendHidden && "sr-only")}>Conditions</legend>
        {flat.length === 0 ? (
          <p className="m-0 text-sm text-muted">{CONDITION_TEXT.empty}</p>
        ) : (
          <>
            <p className="m-0 text-sm text-fg">{`${subject} that match ${value.match} of these conditions:`}</p>
            <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-sm text-fg">
              {value.items.map((item) =>
                item.kind === "group" ? (
                  <li key={item.id}>
                    {`Match ${item.match} of: `}
                    {item.conditions.map((condition) => describeCondition(condition, fields) ?? "an unfinished condition").join(item.match === "all" ? "; and " : "; or ")}
                  </li>
                ) : (
                  <li key={item.id}>{describeCondition(item, fields) ?? "An unfinished condition"}</li>
                ),
              )}
            </ul>
          </>
        )}
      </fieldset>
    );
  }

  const connector = (match: Match) => (match === "all" ? "and" : "or");
  // The root is the first group, so nested groups are numbered from 2 ("Group 2").
  const groupIds = value.items.filter((item) => item.kind === "group").map((item) => item.id);
  const summary = summarise(value, fields);
  const withCount = variant === "filter" || variant === "audience";

  return (
    <fieldset className={cn("m-0 flex min-w-0 flex-col gap-4 border-0 bg-transparent p-0", className)}>
      <legend className={cn("mb-2 p-0 text-sm font-medium text-fg", legendHidden && "sr-only")}>Conditions</legend>
      {stageScope ? null : sentence(`${base}-root`, `${subject} that match`, "of these conditions", value.match, (match) => onValueChange(setMatch(value, null, match)))}
      {flat.length === 0 ? <p className="m-0 text-sm text-muted">{CONDITION_TEXT.empty}</p> : null}
      <div className="flex flex-col gap-3">
        {value.items.map((item, itemIndex) => {
          const rowConnector = itemIndex === 0 ? null : connector(value.match);
          if (item.kind === "condition") return rowFor(item, rowConnector, itemIndex === 0);
          return (
            <GroupBlock
              key={item.id}
              group={item}
              number={groupIds.indexOf(item.id) + 2}
              connector={rowConnector}
              renderRow={(condition, index) => rowFor(condition, index === 0 ? null : connector(item.match), index === 0 && itemIndex === 0)}
              onMatch={(match) => onValueChange(setMatch(value, item.id, match))}
              sentence={sentence}
              limit={limit}
              error={showErrors ? errors.groups[item.id] : undefined}
              onAdd={() => {
                const condition = blankCondition(newId("c"));
                onValueChange(addCondition(value, item.id, condition));
                focusNew(condition.id);
              }}
              onRemoveGroup={() => {
                onValueChange(removeItem(value, item.id));
                window.requestAnimationFrame(() => addRef.current?.focus());
              }}
            />
          );
        })}
      </div>
      {stageScope ? null : (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            ref={addRef}
            variant="secondary"
            size="sm"
            leadingIcon={<Plus />}
            disabledReason={limit ? CONDITION_ERRORS.limit : undefined}
            onClick={() => {
              const condition = blankCondition(newId("c"));
              onValueChange(addCondition(value, null, condition));
              focusNew(condition.id);
            }}
          >
            Add condition
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Plus />}
            disabledReason={limit ? CONDITION_ERRORS.limit : undefined}
            onClick={() => {
              const condition = blankCondition(newId("c"));
              onValueChange(addGroup(value, newId("g"), condition));
              focusNew(condition.id);
            }}
          >
            Add group
          </Button>
          {limit ? <span className="text-xs text-muted">{CONDITION_ERRORS.limit}</span> : null}
        </div>
      )}
      {summary ? <p className="m-0 text-sm leading-prose text-muted">{summary}</p> : null}
      {withCount ? (
        <p role="status" className="m-0 flex min-h-5 items-center gap-2 text-sm text-fg tabular-nums">
          {count?.state === "counting" ? <Spinner size="xs" label="Counting…" delay={0} /> : null}
          {count?.state === "done" ? count.text : null}
          {count?.state === "failed" ? CONDITION_TEXT.countFailed : null}
        </p>
      ) : null}
      {footer}
    </fieldset>
  );
}

function GroupBlock({
  group,
  number,
  connector,
  renderRow,
  onMatch,
  sentence,
  limit,
  error,
  onAdd,
  onRemoveGroup,
}: {
  group: ConditionGroup;
  number: number;
  connector: "and" | "or" | null;
  renderRow: (condition: Condition, index: number) => ReactNode;
  onMatch: (match: Match) => void;
  sentence: (id: string, before: string, after: string, match: Match, onMatch: (match: Match) => void) => ReactNode;
  limit: boolean;
  error?: string;
  onAdd: () => void;
  onRemoveGroup: () => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-2">
      <span aria-hidden="true" className="flex h-control-sm w-10 shrink-0 items-center justify-end text-xs font-medium text-muted">
        {connector}
      </span>
      <fieldset className="m-0 mt-1 flex min-w-0 flex-1 flex-col gap-3 rounded-lg border border-strong bg-surface p-3">
        <legend className="px-1 text-sm font-medium text-fg">{`Group ${number}`}</legend>
        {sentence(id, "Match", "of:", group.match, onMatch)}
        <div className="flex flex-col gap-3">{group.conditions.map((condition, index) => renderRow(condition, index))}</div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" leadingIcon={<Plus />} disabledReason={limit ? CONDITION_ERRORS.limit : undefined} onClick={onAdd}>
            Add condition
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemoveGroup}>
            Remove group
          </Button>
        </div>
        {error ? (
          <p className="m-0 flex items-start gap-1 text-xs text-danger">
            <CircleAlert aria-hidden="true" className="mt-px size-icon-sm shrink-0" />
            {error}
          </p>
        ) : null}
      </fieldset>
    </div>
  );
}
