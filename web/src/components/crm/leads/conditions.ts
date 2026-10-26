import { formatList } from "@/lib/format";

/**
 * The model behind ConditionBuilder (components.md, ConditionBuilder): fields, operators by type,
 * validation and the plain-language summary. Pure functions, unit tested in conditions.test.ts.
 * Groups nest one level only; at most 30 conditions in all.
 */

export const MAX_CONDITIONS = 30;
/** A value list shows this many values, then "+N". */
export const VALUE_PREVIEW_COUNT = 3;

export type Match = "all" | "any";

export type ConditionFieldType = "text" | "number" | "date" | "picklist" | "owner" | "yesno" | "activity";

export type ConditionFieldGroup = "Standard fields" | "Your fields" | "Activity" | "This change";

export type FieldOption = { value: string; label: string; removed?: boolean };

export type ConditionField = {
  id: string;
  label: string;
  group: ConditionFieldGroup;
  type: ConditionFieldType;
  /** Picklist, stage, course, campus and owner values. */
  options?: FieldOption[];
  /** An admin removed the field; conditions on it are invalid. */
  removed?: boolean;
  /** Email or mobile: for roles that see contacts masked, only empty and verified checks. */
  contact?: "email" | "mobile";
  /** Activity fields: the outcomes to count ("connected", "no answer"). */
  outcomes?: FieldOption[];
};

export type Operator =
  | "is"
  | "is_not"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "is_empty"
  | "is_not_empty"
  | "is_verified"
  | "more_than"
  | "less_than"
  | "at_least"
  | "at_most"
  | "between"
  | "on"
  | "before"
  | "after"
  | "in_last"
  | "in_next"
  | "today"
  | "any_of"
  | "none_of"
  | "unassigned"
  | "count_at_least"
  | "count_at_most"
  | "count_none";

export const OPERATOR_LABELS: Record<Operator, string> = {
  is: "is",
  is_not: "is not",
  contains: "contains",
  not_contains: "doesn't contain",
  starts_with: "starts with",
  is_empty: "is empty",
  is_not_empty: "isn't empty",
  is_verified: "is verified",
  more_than: "is more than",
  less_than: "is less than",
  at_least: "is at least",
  at_most: "is at most",
  between: "is between",
  on: "is on",
  before: "is before",
  after: "is after",
  in_last: "in the last",
  in_next: "in the next",
  today: "is today",
  any_of: "is any of",
  none_of: "is none of",
  unassigned: "is unassigned",
  count_at_least: "at least",
  count_at_most: "at most",
  count_none: "none",
};

export const OPERATORS_BY_TYPE: Record<ConditionFieldType, readonly Operator[]> = {
  text: ["is", "is_not", "contains", "not_contains", "starts_with", "is_empty", "is_not_empty"],
  number: ["is", "is_not", "more_than", "less_than", "at_least", "at_most", "between", "is_empty"],
  date: ["on", "before", "after", "between", "in_last", "in_next", "today", "is_empty"],
  picklist: ["any_of", "none_of", "is_empty", "is_not_empty"],
  owner: ["any_of", "none_of", "unassigned"],
  yesno: ["is"],
  activity: ["count_at_least", "count_at_most", "count_none"],
};

/** Operators for a field, with the masked-role rule for contact fields. */
export function operatorsFor(field: ConditionField, { masked = false }: { masked?: boolean } = {}): readonly Operator[] {
  if (field.contact && masked) return ["is_empty", "is_not_empty", "is_verified"];
  if (field.contact) return [...OPERATORS_BY_TYPE.text, "is_verified"];
  return OPERATORS_BY_TYPE[field.type];
}

const NO_VALUE = new Set<Operator>(["is_empty", "is_not_empty", "is_verified", "today", "unassigned", "count_none"]);

export function needsValue(operator: Operator | null): boolean {
  return operator !== null && !NO_VALUE.has(operator);
}

export type RangeValue = { from: string; to: string };
export type ActivityValue = { outcome: string; count: string; days: string };

/**
 * Values: text and numbers as the typed text (so "12a" can be reported), dates as ISO dates, "in
 * the last" as a number of days, lists as option values, yes or no as "yes" | "no".
 */
export type ConditionValue = string | string[] | RangeValue | ActivityValue | null;

export type Condition = {
  kind: "condition";
  id: string;
  fieldId: string | null;
  operator: Operator | null;
  value: ConditionValue;
};

export type ConditionGroup = { kind: "group"; id: string; match: Match; conditions: Condition[] };

export type ConditionTree = { match: Match; items: Array<Condition | ConditionGroup> };

export const EMPTY_TREE: ConditionTree = { match: "all", items: [] };

/* ------------------------------------------------------------------------------------- editing */

let nextId = 0;
export function newId(prefix: string): string {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

export function blankCondition(id = newId("c"), fieldId: string | null = null): Condition {
  return { kind: "condition", id, fieldId, operator: null, value: null };
}

export function countConditions(tree: ConditionTree): number {
  return tree.items.reduce((sum, item) => sum + (item.kind === "group" ? item.conditions.length : 1), 0);
}

export function atLimit(tree: ConditionTree): boolean {
  return countConditions(tree) >= MAX_CONDITIONS;
}

/** Adds a blank condition at the end of the root, or of a group. */
export function addCondition(tree: ConditionTree, groupId: string | null = null, condition = blankCondition()): ConditionTree {
  if (atLimit(tree)) return tree;
  if (groupId === null) return { ...tree, items: [...tree.items, condition] };
  return {
    ...tree,
    items: tree.items.map((item) => (item.kind === "group" && item.id === groupId ? { ...item, conditions: [...item.conditions, condition] } : item)),
  };
}

/** Adds a nested group ("Match any of:") holding one blank condition. */
export function addGroup(tree: ConditionTree, id = newId("g"), condition = blankCondition()): ConditionTree {
  if (atLimit(tree)) return tree;
  return { ...tree, items: [...tree.items, { kind: "group", id, match: "any", conditions: [condition] }] };
}

export function removeItem(tree: ConditionTree, id: string): ConditionTree {
  return {
    ...tree,
    items: tree.items
      .filter((item) => item.id !== id)
      .map((item) => (item.kind === "group" ? { ...item, conditions: item.conditions.filter((condition) => condition.id !== id) } : item)),
  };
}

export function updateCondition(tree: ConditionTree, id: string, patch: Partial<Omit<Condition, "kind" | "id">>): ConditionTree {
  const apply = (condition: Condition) => (condition.id === id ? { ...condition, ...patch } : condition);
  return {
    ...tree,
    items: tree.items.map((item) => (item.kind === "group" ? { ...item, conditions: item.conditions.map(apply) } : apply(item))),
  };
}

export function setMatch(tree: ConditionTree, groupId: string | null, match: Match): ConditionTree {
  if (groupId === null) return { ...tree, match };
  return { ...tree, items: tree.items.map((item) => (item.kind === "group" && item.id === groupId ? { ...item, match } : item)) };
}

/** Every condition in order, with its place: "Condition 2 of 4". */
export function flatConditions(tree: ConditionTree): Condition[] {
  return tree.items.flatMap((item) => (item.kind === "group" ? item.conditions : [item]));
}

/** The default value when the operator changes. */
export function defaultValue(field: ConditionField, operator: Operator): ConditionValue {
  if (!needsValue(operator)) return null;
  if (operator === "between") return { from: "", to: "" };
  if (field.type === "activity") return { outcome: field.outcomes?.[0]?.value ?? "", count: "1", days: "7" };
  if (field.type === "picklist" || field.type === "owner") return [];
  if (operator === "in_last" || operator === "in_next") return "7";
  return "";
}

/* ---------------------------------------------------------------------------------- validation */

export const CONDITION_ERRORS = {
  field: "Choose a field.",
  operator: "Choose how to compare.",
  value: "Enter a value.",
  number: "Enter a number.",
  order: "The first number must be smaller than the second.",
  dateOrder: "The first date must be before the second.",
  removedField: "This field was removed. Pick another field or delete this condition.",
  emptyGroup: "Add a condition to this group, or remove the group.",
  limit: `You can add up to ${MAX_CONDITIONS} conditions.`,
} as const;

export function removedValueError(label: string): string {
  return `"${label}" is no longer on the list. Pick another value.`;
}

const NUMBER = /^-?\d+(\.\d+)?$/;

function isRange(value: ConditionValue): value is RangeValue {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "from" in value;
}

function isActivity(value: ConditionValue): value is ActivityValue {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "outcome" in value;
}

/** True when the person has started on the row but it is not finished (not yet an error). */
export function isBlank(condition: Condition): boolean {
  return condition.fieldId === null && condition.operator === null;
}

/** The error for one condition, or null when it is valid. */
export function validateCondition(condition: Condition, fields: readonly ConditionField[]): string | null {
  if (!condition.fieldId) return CONDITION_ERRORS.field;
  const field = fields.find((candidate) => candidate.id === condition.fieldId);
  if (!field || field.removed) return CONDITION_ERRORS.removedField;
  if (!condition.operator) return CONDITION_ERRORS.operator;
  if (!needsValue(condition.operator)) return null;
  const value = condition.value;
  if (field.type === "activity") {
    if (!isActivity(value) || !value.outcome || !value.count) return CONDITION_ERRORS.value;
    return /^\d+$/.test(value.count) ? null : CONDITION_ERRORS.number;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return CONDITION_ERRORS.value;
    const removed = value.map((choice) => field.options?.find((option) => option.value === choice)).find((option) => option?.removed);
    return removed ? removedValueError(removed.label) : null;
  }
  if (isRange(value)) {
    if (!value.from.trim() || !value.to.trim()) return CONDITION_ERRORS.value;
    if (field.type === "number") {
      if (!NUMBER.test(value.from.trim()) || !NUMBER.test(value.to.trim())) return CONDITION_ERRORS.number;
      return Number(value.from) < Number(value.to) ? null : CONDITION_ERRORS.order;
    }
    return value.from < value.to ? null : CONDITION_ERRORS.dateOrder;
  }
  if (value === null || (typeof value === "string" && !value.trim())) return CONDITION_ERRORS.value;
  const numeric = field.type === "number" || condition.operator === "in_last" || condition.operator === "in_next";
  if (numeric && typeof value === "string" && !NUMBER.test(value.trim())) return CONDITION_ERRORS.number;
  return null;
}

export type TreeErrors = { conditions: Record<string, string>; groups: Record<string, string> };

export function validateTree(tree: ConditionTree, fields: readonly ConditionField[]): TreeErrors {
  const errors: TreeErrors = { conditions: {}, groups: {} };
  for (const item of tree.items) {
    if (item.kind === "group") {
      if (item.conditions.length === 0) errors.groups[item.id] = CONDITION_ERRORS.emptyGroup;
      for (const condition of item.conditions) {
        const error = validateCondition(condition, fields);
        if (error) errors.conditions[condition.id] = error;
      }
    } else {
      const error = validateCondition(item, fields);
      if (error) errors.conditions[item.id] = error;
    }
  }
  return errors;
}

export function errorCount(errors: TreeErrors): number {
  return Object.keys(errors.conditions).length + Object.keys(errors.groups).length;
}

/* ------------------------------------------------------------------------------------- summary */

function optionLabel(field: ConditionField, value: string): string {
  return field.options?.find((option) => option.value === value)?.label ?? value;
}

function listText(labels: string[]): string {
  if (labels.length <= VALUE_PREVIEW_COUNT) return formatList(labels, "disjunction");
  return `${labels.slice(0, VALUE_PREVIEW_COUNT).join(", ")} or ${labels.length - VALUE_PREVIEW_COUNT} more`;
}

/** One condition in words ("Stage is Interested or Applied"), or null while it is incomplete or invalid. */
export function describeCondition(condition: Condition, fields: readonly ConditionField[], dateLabel: (iso: string) => string = (iso) => iso): string | null {
  if (validateCondition(condition, fields)) return null;
  const field = fields.find((candidate) => candidate.id === condition.fieldId)!;
  const operator = condition.operator!;
  const value = condition.value;
  const subject = field.label;
  if (!needsValue(operator)) {
    return operator === "count_none" ? `No ${subject.toLowerCase()}` : `${subject} ${OPERATOR_LABELS[operator]}`;
  }
  if (field.type === "activity" && isActivity(value)) {
    const outcome = field.outcomes?.find((option) => option.value === value.outcome)?.label.toLowerCase() ?? value.outcome;
    return `${subject} ${outcome} ${OPERATOR_LABELS[operator]} ${value.count} in the last ${value.days} days`;
  }
  if (Array.isArray(value)) {
    const labels = value.map((choice) => optionLabel(field, choice));
    return `${subject} ${operator === "none_of" ? "is not" : "is"} ${listText(labels)}`;
  }
  if (isRange(value)) {
    const show = field.type === "date" ? dateLabel : (text: string) => text;
    return `${subject} is between ${show(value.from)} and ${show(value.to)}`;
  }
  const text = typeof value === "string" ? value.trim() : "";
  if (operator === "in_last" || operator === "in_next") return `${subject} ${OPERATOR_LABELS[operator]} ${text} days`;
  if (field.type === "yesno") return `${subject} is ${text === "yes" ? "Yes" : "No"}`;
  if (field.type === "date") return `${subject} ${OPERATOR_LABELS[operator]} ${dateLabel(text)}`;
  if (field.type === "text") return `${subject} ${OPERATOR_LABELS[operator]} ${operator === "is" || operator === "is_not" ? text : `"${text}"`}`;
  return `${subject} ${OPERATOR_LABELS[operator]} ${text}`;
}

/**
 * The whole tree in plain language: "Stage is Interested or Applied, and Source is Google Ads, and
 * (City is Pune or City is Nashik)". Incomplete rows are left out.
 */
export function summarise(tree: ConditionTree, fields: readonly ConditionField[], dateLabel?: (iso: string) => string): string {
  const join = (match: Match) => (match === "all" ? ", and " : ", or ");
  const parts = tree.items
    .map((item) => {
      if (item.kind === "condition") return describeCondition(item, fields, dateLabel);
      const inner = item.conditions.map((condition) => describeCondition(condition, fields, dateLabel)).filter((text): text is string => Boolean(text));
      if (inner.length === 0) return null;
      const joined = inner.join(item.match === "all" ? " and " : " or ");
      return inner.length > 1 ? `(${joined})` : joined;
    })
    .filter((text): text is string => Boolean(text));
  return parts.join(join(tree.match));
}
