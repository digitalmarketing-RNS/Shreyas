/**
 * What a search box searches (components.md SearchInput, scope "Auto"; LeadSearch in group 3 uses
 * the same rule).
 *
 * - Text with "@": email.
 * - A UUID (36 characters with hyphens, or 32 hex characters without): API ID.
 * - Digits with an optional "#", 7 digits or fewer: lead number.
 * - 8 to 15 digits, or a leading "+": mobile.
 * - Anything else: name, from 2 characters.
 */

export const SEARCH_SCOPES = [
  { value: "auto", label: "Auto" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "mobile", label: "Mobile" },
  { value: "lead", label: "Lead no." },
  { value: "api", label: "API ID" },
] as const;

export type SearchScope = (typeof SEARCH_SCOPES)[number]["value"];
export type ResolvedScope = Exclude<SearchScope, "auto">;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX32 = /^[0-9a-f]{32}$/i;

export function detectScope(query: string): ResolvedScope {
  const value = query.trim();
  if (value.includes("@")) return "email";
  if (UUID.test(value) || HEX32.test(value)) return "api";
  if (/^#?\d{1,7}$/.test(value)) return "lead";
  const digits = value.replace(/[\s()-]/g, "");
  if (value.startsWith("+") || /^\d{8,15}$/.test(digits)) return "mobile";
  return "name";
}

export function resolveScope(query: string, scope: SearchScope): ResolvedScope {
  return scope === "auto" ? detectScope(query) : scope;
}

/** Name search starts at 2 characters; email, mobile and ID searches at any length (prefix match). */
export function isSearchable(query: string, scope: SearchScope): boolean {
  const value = query.trim();
  if (!value) return false;
  return resolveScope(value, scope) === "name" ? [...value].length >= 2 : true;
}
