import { detectScope } from "@/components/ui/forms/search-scope";

/**
 * LeadSearch's keys and matching rules (components.md, LeadSearch). Auto uses group 1's rule
 * (search-scope.ts). Pure functions, unit tested in lead-search-keys.test.ts.
 */

export type LeadSearchKey = "auto" | "name" | "email" | "mobile" | "lead" | "api" | "opportunity";
export type ResolvedLeadSearchKey = Exclude<LeadSearchKey, "auto">;

export type LeadSearchKeyInfo = {
  value: LeadSearchKey;
  /** The option in the picker. */
  label: string;
  /** The short form in the trigger ("Lead no."), and after "Auto: " when guessed. */
  short: string;
  /** In the input's name: "Search leads by mobile". */
  noun: string;
  placeholder: string;
  inputMode: "text" | "email" | "tel" | "numeric";
};

export const LEAD_SEARCH_KEYS: readonly LeadSearchKeyInfo[] = [
  { value: "auto", label: "Auto (best guess)", short: "Auto", noun: "best guess", placeholder: "Search leads", inputMode: "text" },
  { value: "name", label: "Name", short: "Name", noun: "name", placeholder: "Name", inputMode: "text" },
  { value: "email", label: "Email", short: "Email", noun: "email", placeholder: "name@example.com", inputMode: "email" },
  { value: "mobile", label: "Mobile", short: "Mobile", noun: "mobile", placeholder: "Mobile number", inputMode: "tel" },
  { value: "lead", label: "Lead no.", short: "Lead no.", noun: "lead number", placeholder: "Lead no., like 10234", inputMode: "numeric" },
  { value: "api", label: "API ID", short: "API ID", noun: "API ID", placeholder: "API ID (UUID)", inputMode: "text" },
  {
    value: "opportunity",
    label: "Opportunity ID",
    short: "Opp. ID",
    noun: "opportunity ID",
    placeholder: "Opportunity ID (UUID)",
    inputMode: "text",
  },
];

export function keyInfo(key: LeadSearchKey): LeadSearchKeyInfo {
  return LEAD_SEARCH_KEYS.find((info) => info.value === key) ?? LEAD_SEARCH_KEYS[0];
}

/** The keys a list offers: S05 leads all six; S26 opportunities adds "Opportunity ID". */
export function keysFor(list: "leads" | "opportunities"): readonly LeadSearchKeyInfo[] {
  return LEAD_SEARCH_KEYS.filter((info) => list === "opportunities" || info.value !== "opportunity");
}

export function resolveKey(query: string, key: LeadSearchKey): ResolvedLeadSearchKey {
  return key === "auto" ? detectScope(query) : key;
}

const UUID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

/** The hyphenated, lower-case form of a UUID typed with or without hyphens; null when it is not one. */
export function normaliseUuid(value: string): string | null {
  const compact = value.trim().toLowerCase();
  if (!UUID.test(compact)) return null;
  const hex = compact.replace(/-/g, "");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Mobile search: spaces, dashes, brackets, a leading 0 and "+91" go; other country codes stay. */
export function normaliseMobile(value: string): string {
  let digits = value.trim().replace(/[\s().-]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  return digits;
}

/** The text sent to the server for a key. */
export function normaliseQuery(query: string, key: ResolvedLeadSearchKey): string {
  const value = query.trim();
  switch (key) {
    case "email":
      return value.toLowerCase();
    case "mobile":
      return normaliseMobile(value);
    case "lead":
      return value.replace(/^#/, "");
    case "api":
    case "opportunity":
      return normaliseUuid(value) ?? value;
    case "name":
      return value.replace(/\s+/g, " ");
  }
}

const FULL_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isFullMobile(normalised: string): boolean {
  if (normalised.startsWith("+")) return /^\+[1-9]\d{6,14}$/.test(normalised);
  return /^[6-9]\d{9}$/.test(normalised);
}

export const LEAD_SEARCH_HINTS = {
  fullMobile: "Enter the full mobile number. Contacts are hidden for your role, so partial matches are off.",
  fullEmail: "Enter the full email address. Contacts are hidden for your role, so partial matches are off.",
  apiFormat: "An API ID looks like 0192f3a1-7c2e-7b4d-9f10-2c5e8a1b3d4f. Check you copied all of it.",
  opportunityFormat: "An opportunity ID looks like 0192f3a1-7c2e-7b4d-9f10-2c5e8a1b3d4f. Check you copied all of it.",
  shortName: "Type at least 2 letters of the name.",
  leadDigits: "Lead numbers have digits only, like 10234.",
} as const;

export type LeadSearchCheck =
  | { send: true; key: ResolvedLeadSearchKey; query: string }
  | { send: false; key: ResolvedLeadSearchKey | null; hint: string | null };

/**
 * Whether a query can be sent, and if not, the hint to show under the field. An empty query clears
 * the search (send with ""). Masked roles must type a whole email or mobile number: prefix matches
 * would let them find hidden digits by trying.
 */
export function checkLeadQuery(query: string, key: LeadSearchKey, { masked = false }: { masked?: boolean } = {}): LeadSearchCheck {
  const value = query.trim();
  if (!value) return { send: true, key: key === "auto" ? "name" : key, query: "" };
  const resolved = resolveKey(value, key);
  const normalised = normaliseQuery(value, resolved);
  switch (resolved) {
    case "name":
      return Array.from(normalised).length >= 2 ? { send: true, key: resolved, query: normalised } : { send: false, key: resolved, hint: LEAD_SEARCH_HINTS.shortName };
    case "email":
      if (masked && !FULL_EMAIL.test(normalised)) return { send: false, key: resolved, hint: LEAD_SEARCH_HINTS.fullEmail };
      return { send: true, key: resolved, query: normalised };
    case "mobile":
      if (masked && !isFullMobile(normalised)) return { send: false, key: resolved, hint: LEAD_SEARCH_HINTS.fullMobile };
      return { send: true, key: resolved, query: normalised };
    case "lead":
      return /^\d+$/.test(normalised) ? { send: true, key: resolved, query: normalised } : { send: false, key: resolved, hint: LEAD_SEARCH_HINTS.leadDigits };
    case "api":
    case "opportunity":
      return normaliseUuid(value)
        ? { send: true, key: resolved, query: normalised }
        : { send: false, key: resolved, hint: resolved === "api" ? LEAD_SEARCH_HINTS.apiFormat : LEAD_SEARCH_HINTS.opportunityFormat };
  }
}

/** The input's accessible name: "Search leads by mobile", "Search leads (best guess: mobile)". */
export function searchInputName(key: LeadSearchKey, query: string, list: "leads" | "opportunities" = "leads"): string {
  if (key !== "auto") return `Search ${list} by ${keyInfo(key).noun}`;
  if (!query.trim()) return `Search ${list}`;
  return `Search ${list} (best guess: ${keyInfo(resolveKey(query, key)).noun})`;
}

/** The picker trigger's text: "Mobile", or "Auto: Mobile" when guessed. */
export function triggerText(key: LeadSearchKey, query: string): { key: string; guessed: string | null } {
  if (key !== "auto") return { key: keyInfo(key).short, guessed: null };
  if (!query.trim()) return { key: "Auto", guessed: null };
  return { key: "Auto", guessed: keyInfo(resolveKey(query, key)).short };
}
