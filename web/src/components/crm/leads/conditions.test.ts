import { describe, expect, it } from "vitest";
import {
  CONDITION_ERRORS,
  MAX_CONDITIONS,
  addCondition,
  addGroup,
  blankCondition,
  type Condition,
  type ConditionField,
  type ConditionTree,
  countConditions,
  operatorsFor,
  removeItem,
  removedValueError,
  summarise,
  updateCondition,
  validateCondition,
  validateTree,
} from "./conditions";

const FIELDS: ConditionField[] = [
  {
    id: "stage",
    label: "Stage",
    group: "Standard fields",
    type: "picklist",
    options: [
      { value: "interested", label: "Interested" },
      { value: "applied", label: "Applied" },
      { value: "visit", label: "Campus visit" },
      { value: "enrolled", label: "Enrolled" },
    ],
  },
  { id: "source", label: "Source", group: "Standard fields", type: "picklist", options: [{ value: "google", label: "Google Ads" }] },
  { id: "city", label: "City", group: "Standard fields", type: "text" },
  { id: "score", label: "Score", group: "Standard fields", type: "number" },
  { id: "mobile", label: "Mobile", group: "Standard fields", type: "text", contact: "mobile" },
  {
    id: "language",
    label: "Language",
    group: "Your fields",
    type: "picklist",
    options: [
      { value: "hi", label: "Hindi", removed: true },
      { value: "mr", label: "Marathi" },
    ],
  },
  { id: "old", label: "Hostel needed", group: "Your fields", type: "yesno", removed: true },
  { id: "calls", label: "Calls", group: "Activity", type: "activity", outcomes: [{ value: "connected", label: "Connected" }] },
];

const condition = (id: string, fieldId: string | null, operator: Condition["operator"], value: Condition["value"]): Condition => ({
  kind: "condition",
  id,
  fieldId,
  operator,
  value,
});

describe("operators", () => {
  it("offers masked roles only empty and verified checks on contact fields", () => {
    const mobile = FIELDS.find((field) => field.id === "mobile")!;
    expect(operatorsFor(mobile, { masked: true })).toEqual(["is_empty", "is_not_empty", "is_verified"]);
    expect(operatorsFor(mobile)).toContain("starts_with");
  });
});

describe("validateCondition", () => {
  it("asks for the field, the comparison and the value in turn", () => {
    expect(validateCondition(condition("1", null, null, null), FIELDS)).toBe(CONDITION_ERRORS.field);
    expect(validateCondition(condition("1", "city", null, null), FIELDS)).toBe(CONDITION_ERRORS.operator);
    expect(validateCondition(condition("1", "city", "is", ""), FIELDS)).toBe(CONDITION_ERRORS.value);
    expect(validateCondition(condition("1", "city", "is_empty", null), FIELDS)).toBeNull();
  });
  it("checks numbers and the order of a range", () => {
    expect(validateCondition(condition("1", "score", "more_than", "12a"), FIELDS)).toBe(CONDITION_ERRORS.number);
    expect(validateCondition(condition("1", "score", "between", { from: "50", to: "20" }), FIELDS)).toBe(CONDITION_ERRORS.order);
    expect(validateCondition(condition("1", "score", "between", { from: "20", to: "50" }), FIELDS)).toBeNull();
  });
  it("flags removed fields and removed picklist values", () => {
    expect(validateCondition(condition("1", "old", "is", "yes"), FIELDS)).toBe(CONDITION_ERRORS.removedField);
    expect(validateCondition(condition("1", "language", "any_of", ["hi"]), FIELDS)).toBe(removedValueError("Hindi"));
  });
  it("flags an empty group", () => {
    const tree: ConditionTree = { match: "all", items: [{ kind: "group", id: "g", match: "any", conditions: [] }] };
    expect(validateTree(tree, FIELDS).groups).toEqual({ g: CONDITION_ERRORS.emptyGroup });
  });
});

describe("editing", () => {
  it("adds, updates and removes conditions and groups", () => {
    let tree: ConditionTree = { match: "all", items: [] };
    tree = addCondition(tree, null, blankCondition("a"));
    tree = addGroup(tree, "g", blankCondition("b"));
    tree = addCondition(tree, "g", blankCondition("c"));
    expect(countConditions(tree)).toBe(3);
    tree = updateCondition(tree, "c", { fieldId: "city" });
    expect(tree.items[1].kind === "group" && tree.items[1].conditions[1].fieldId).toBe("city");
    tree = removeItem(tree, "b");
    expect(countConditions(tree)).toBe(2);
    tree = removeItem(tree, "g");
    expect(countConditions(tree)).toBe(1);
  });
  it("stops at 30 conditions", () => {
    let tree: ConditionTree = { match: "all", items: [] };
    for (let index = 0; index < MAX_CONDITIONS + 5; index += 1) tree = addCondition(tree, null, blankCondition(`x${index}`));
    expect(countConditions(tree)).toBe(MAX_CONDITIONS);
  });
});

describe("summarise", () => {
  it("writes the tree in plain language, groups in brackets", () => {
    const tree: ConditionTree = {
      match: "all",
      items: [
        condition("1", "stage", "any_of", ["interested", "applied"]),
        condition("2", "source", "any_of", ["google"]),
        {
          kind: "group",
          id: "g",
          match: "any",
          conditions: [condition("3", "city", "is", "Pune"), condition("4", "city", "is", "Nashik")],
        },
      ],
    };
    expect(summarise(tree, FIELDS)).toBe("Stage is Interested or Applied, and Source is Google Ads, and (City is Pune or City is Nashik)");
  });
  it("leaves out incomplete rows and shortens long value lists", () => {
    const tree: ConditionTree = {
      match: "any",
      items: [condition("1", "stage", "none_of", ["interested", "applied", "visit", "enrolled"]), condition("2", "city", null, null)],
    };
    expect(summarise(tree, FIELDS)).toBe("Stage is not Interested, Applied, Campus visit or 1 more");
  });
  it("describes activity counts", () => {
    const tree: ConditionTree = { match: "all", items: [condition("1", "calls", "count_at_least", { outcome: "connected", count: "1", days: "7" })] };
    expect(summarise(tree, FIELDS)).toBe("Calls connected at least 1 in the last 7 days");
  });
});
