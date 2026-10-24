/**
 * SMS length and parts (components.md Textarea, sms mode; SmsSegmentCounter uses the same rules).
 *
 * - Encoding: GSM-7 when every character is in the GSM 03.38 basic or extension set, otherwise
 *   Unicode (UCS-2). Extension characters (^ { } \ [ ] ~ | €, and form feed) count as 2.
 * - Parts: GSM-7 holds 160 characters in one part, or 153 per part when longer. Unicode holds 70 in
 *   one part, or 67 per part, counted in UTF-16 units.
 * - Merge tokens ({{name}}) count at the maximum length set for them in S19; a token with no length
 *   counts as 30 characters and the count is marked "about" (open question 10).
 */

const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXTENSION = "^{}\\[]~|€\f";

const BASIC = new Set([...GSM_BASIC]);
const EXTENSION = new Set([...GSM_EXTENSION]);

export const UNKNOWN_TOKEN_LENGTH = 30;
const TOKEN = /\{\{\s*([\w.]+)\s*\}\}/g;

export type SmsEncoding = "gsm7" | "unicode";

export type SmsInfo = {
  encoding: SmsEncoding;
  /** Characters as the network counts them: GSM-7 septets or UTF-16 units. */
  length: number;
  parts: number;
  /** Characters one part holds at this length (160 or 153; 70 or 67). */
  perPart: number;
  /** True when merge tokens were counted at an assumed length. */
  estimated: boolean;
};

export function isGsm7(text: string): boolean {
  for (const char of text) {
    if (!BASIC.has(char) && !EXTENSION.has(char)) return false;
  }
  return true;
}

function gsmLength(text: string): number {
  let length = 0;
  for (const char of text) length += EXTENSION.has(char) ? 2 : 1;
  return length;
}

/**
 * Counts an SMS body. `tokenLengths` maps a merge token's name to its maximum length; tokens are
 * replaced by that many characters ("x" for GSM-7) before counting.
 */
export function countSms(text: string, tokenLengths: Record<string, number> = {}): SmsInfo {
  let estimated = false;
  let tokens = false;
  const body = text.replace(TOKEN, (_match, name: string) => {
    tokens = true;
    const known = tokenLengths[name];
    if (known === undefined) estimated = true;
    return "x".repeat(known ?? UNKNOWN_TOKEN_LENGTH);
  });
  // Any merge token makes the count an estimate: the real value may be shorter.
  estimated = estimated || tokens;
  const encoding: SmsEncoding = isGsm7(body) ? "gsm7" : "unicode";
  const length = encoding === "gsm7" ? gsmLength(body) : body.length;
  const single = encoding === "gsm7" ? 160 : 70;
  const multi = encoding === "gsm7" ? 153 : 67;
  const parts = length === 0 ? 0 : length <= single ? 1 : Math.ceil(length / multi);
  return { encoding, length, parts, perPart: parts > 1 ? multi : single, estimated };
}

/** "148 characters · 1 SMS", "172 characters · 2 SMS parts", "about 182 characters · 2 SMS parts". */
export function smsSummary(info: SmsInfo): string {
  const about = info.estimated ? "about " : "";
  const characters = `${about}${info.length} ${info.length === 1 ? "character" : "characters"}`;
  if (info.parts <= 1) return `${characters} · ${info.parts === 0 ? "0 SMS" : "1 SMS"}`;
  return `${characters} · ${info.parts} SMS parts`;
}

/** Code points, which matches Postgres char_length (the Textarea character limit). */
export function countCharacters(text: string): number {
  return [...text].length;
}
