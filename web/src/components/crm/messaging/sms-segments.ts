/**
 * SMS parts and encoding (components.md, SmsSegmentCounter: "Counting rules"). A pure module with
 * unit tests (sms-segments.test.ts); the counter runs it on every change.
 *
 * - GSM-7 (GSM 03.38): characters of the basic table count 1; the extension table (^ { } [ ] ~ | € \
 *   and form feed) counts 2, because each is sent as ESC plus a character.
 * - Any character outside both tables makes the whole message Unicode (UCS-2). Each UTF-16 unit
 *   counts 1, so an emoji outside the basic plane counts 2.
 * - One part holds 160 GSM-7 or 70 Unicode units. A longer message is split into parts of 153 GSM-7
 *   or 67 Unicode units (the rest of each part carries the concatenation header). A two-unit GSM-7
 *   character is never split across parts, and neither is a surrogate pair, so a part can end a
 *   unit short.
 * - Merge fields count at their maximum length (open question 10: a field with no maximum counts as
 *   30 and the result is marked "estimated"), and at the preview recipient's value; when the two
 *   give different part counts the counter shows a range.
 * - DLT {#var#} slots count at the slot's length; an unfilled slot counts as 30 (estimated).
 */

const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXTENSION = "^{}\\[]~|€\f";

const BASIC = new Set(Array.from(GSM_BASIC));
const EXTENSION = new Set(Array.from(GSM_EXTENSION));

export const GSM7_SINGLE = 160;
export const GSM7_MULTI = 153;
export const UCS2_SINGLE = 70;
export const UCS2_MULTI = 67;
/** A merge field or DLT slot with no known maximum counts as this many characters (open question 10). */
export const UNKNOWN_FIELD_LENGTH = 30;
/** Within this many units of the part limit the counter says how many are left. */
export const NEAR_BOUNDARY = 10;
/** From this many parts the counter warns that each part is charged. */
export const LONG_MESSAGE_PARTS = 4;

export type SmsEncoding = "gsm7" | "ucs2";

/** One character that forced Unicode, with a plain replacement where one exists. */
export type UnicodeCause = {
  char: string;
  /** "curly apostrophe", "Devanagari letter", "U+2605". */
  name: string;
  /** A GSM-7 replacement ("'" for "’"), when there is one. */
  replacement?: string;
  /** The first word it appears in, for the details line ("Meera’s"). */
  word: string;
  /** How many times it appears. */
  count: number;
};

export type SmsCount = {
  encoding: SmsEncoding;
  /** Units as the network counts them: GSM-7 septets or UTF-16 units. */
  units: number;
  parts: number;
  /** What one part holds at this length: 160 or 153 (GSM-7), 70 or 67 (Unicode). */
  perPart: number;
  /** What the current parts hold together: 160, 306, 70, 134… ("98 / 134"). */
  capacity: number;
  /** Units left before the next part starts (0 when the message is empty: 160 left). */
  left: number;
  /** A merge field or slot was counted at an assumed length. */
  estimated: boolean;
};

export type SmsAnalysis = SmsCount & {
  /** Parts with merge fields at the preview recipient's values, when different from `parts`. */
  range: { min: number; max: number } | null;
  /** Characters that made the message Unicode, in order of first appearance. */
  unicodeCauses: UnicodeCause[];
  /** Scripts that are always Unicode ("Hindi", "Tamil", "emoji"), when present. */
  unicodeScripts: string[];
  /** Extension characters, each counting 2 ("{", "}"). */
  doubleChars: string[];
  /** Merge fields and how each was counted. */
  fields: Array<{ name: string; counted: number; estimated: boolean }>;
};

export type CountOptions = {
  /** The maximum length of each merge field, by name ("student.full_name": 40). */
  fieldMaxLengths?: Record<string, number>;
  /** The preview recipient's value for each merge field ("student.full_name": "Meera Pillai"). */
  previewValues?: Record<string, string>;
  /** The length of each DLT {#var#} slot, in order. */
  slotLengths?: readonly number[];
};

export function isGsm7Char(char: string): boolean {
  return BASIC.has(char) || EXTENSION.has(char);
}

export function isGsm7(text: string): boolean {
  for (const char of text) if (!isGsm7Char(char)) return false;
  return true;
}

/** Units of one character in an encoding. */
function charUnits(char: string, encoding: SmsEncoding): number {
  if (encoding === "gsm7") return EXTENSION.has(char) ? 2 : 1;
  return char.length; // UTF-16 units: 2 for a surrogate pair
}

/**
 * Counts already-substituted text (no merge fields left). Exported for the unit tests and for
 * callers that substitute values themselves.
 */
export function countSmsText(text: string): SmsCount {
  const encoding: SmsEncoding = isGsm7(text) ? "gsm7" : "ucs2";
  const single = encoding === "gsm7" ? GSM7_SINGLE : UCS2_SINGLE;
  const multi = encoding === "gsm7" ? GSM7_MULTI : UCS2_MULTI;
  let units = 0;
  for (const char of text) units += charUnits(char, encoding);

  if (units <= single) {
    // An empty message still reads "0 / 160 · 1 SMS".
    return { encoding, units, parts: 1, perPart: single, capacity: single, left: single - units, estimated: false };
  }

  // Split greedily, never cutting a two-unit character in half.
  let parts = 1;
  let inPart = 0;
  for (const char of text) {
    const size = charUnits(char, encoding);
    if (inPart + size > multi) {
      parts += 1;
      inPart = 0;
    }
    inPart += size;
  }
  return { encoding, units, parts, perPart: multi, capacity: parts * multi, left: multi - inPart, estimated: false };
}

/** {{student.full_name|Student}} or {{course}}: a merge field with an optional fallback. */
const FIELD = /\{\{\s*([\w.]+)\s*(?:\|([^}]*))?\}\}/g;
/** A DLT variable slot. */
const SLOT = /\{#var#\}/gi;

type Substitution = { text: string; estimated: boolean; fields: SmsAnalysis["fields"] };

/**
 * max: each field at its maximum length, in the preview value's script when there is one.
 * preview: each field at the preview recipient's value (else at its maximum).
 * explain: preview values only (fields without one are left out), to find Unicode characters.
 */
function substitute(text: string, options: CountOptions, mode: "max" | "preview" | "explain"): Substitution {
  const { fieldMaxLengths = {}, previewValues = {}, slotLengths = [] } = options;
  let estimated = false;
  const fields: SmsAnalysis["fields"] = [];
  let slotIndex = 0;
  const withSlots = text.replace(SLOT, () => {
    const length = slotLengths[slotIndex];
    slotIndex += 1;
    if (length === undefined) estimated = true;
    return mode === "explain" ? "" : "x".repeat(length ?? UNKNOWN_FIELD_LENGTH);
  });
  const result = withSlots.replace(FIELD, (_match, name: string, fallback: string | undefined) => {
    const max = fieldMaxLengths[name];
    const preview = previewValues[name] ?? (fallback !== undefined ? fallback : undefined);
    if (max === undefined) estimated = true;
    const limit = max ?? UNKNOWN_FIELD_LENGTH;
    let value: string;
    if (mode === "explain") value = preview ?? "";
    else if (mode === "preview" && preview !== undefined) value = preview;
    else if (preview !== undefined) {
      // The longest the value can be, in the preview value's script: pad it up to the maximum.
      const length = Array.from(preview).length;
      value = length >= limit ? preview : preview + "x".repeat(limit - length);
    } else value = "x".repeat(limit);
    fields.push({ name, counted: Array.from(value).length, estimated: max === undefined });
    return value;
  });
  return { text: result, estimated, fields };
}

/** Readable names for characters that commonly turn a message Unicode, and their plain stand-ins. */
const KNOWN: Record<string, { name: string; replacement?: string }> = {
  "’": { name: "curly apostrophe", replacement: "'" },
  "‘": { name: "curly opening quote", replacement: "'" },
  "“": { name: "curly opening double quote", replacement: '"' },
  "”": { name: "curly closing double quote", replacement: '"' },
  "–": { name: "en dash", replacement: "-" },
  "—": { name: "em dash", replacement: "-" },
  "…": { name: "ellipsis", replacement: "..." },
  " ": { name: "non-breaking space", replacement: " " },
  "​": { name: "zero-width space", replacement: "" },
  "•": { name: "bullet", replacement: "*" },
  "₹": { name: "rupee sign", replacement: "Rs." },
  "`": { name: "backtick", replacement: "'" },
  "´": { name: "acute accent", replacement: "'" },
  "ç": { name: "c with cedilla", replacement: "Ç" },
  "\t": { name: "tab", replacement: " " },
};

/** Scripts that always need Unicode, by Unicode block. */
const SCRIPTS: Array<{ name: string; from: number; to: number }> = [
  { name: "Hindi", from: 0x0900, to: 0x097f },
  { name: "Bengali", from: 0x0980, to: 0x09ff },
  { name: "Punjabi", from: 0x0a00, to: 0x0a7f },
  { name: "Gujarati", from: 0x0a80, to: 0x0aff },
  { name: "Odia", from: 0x0b00, to: 0x0b7f },
  { name: "Tamil", from: 0x0b80, to: 0x0bff },
  { name: "Telugu", from: 0x0c00, to: 0x0c7f },
  { name: "Kannada", from: 0x0c80, to: 0x0cff },
  { name: "Malayalam", from: 0x0d00, to: 0x0d7f },
  { name: "Urdu", from: 0x0600, to: 0x06ff },
  { name: "emoji", from: 0x1f000, to: 0x1faff },
  { name: "emoji", from: 0x2600, to: 0x27bf },
];

function scriptOf(char: string): string | null {
  const code = char.codePointAt(0) ?? 0;
  return SCRIPTS.find((script) => code >= script.from && code <= script.to)?.name ?? null;
}

function describeChar(char: string): { name: string; replacement?: string } {
  const known = KNOWN[char];
  if (known) return known;
  const script = scriptOf(char);
  if (script) return { name: script === "emoji" ? "emoji" : `${script} letter` };
  const code = (char.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0");
  return { name: `U+${code}` };
}

function wordAround(text: string, index: number): string {
  const before = text.slice(0, index).split(/\s/).pop() ?? "";
  const after = text.slice(index).split(/\s/)[0] ?? "";
  return before + after;
}

/** The characters that made a message Unicode, the scripts behind them, and the extension characters. */
export function explainEncoding(text: string): Pick<SmsAnalysis, "unicodeCauses" | "unicodeScripts" | "doubleChars"> {
  const causes = new Map<string, UnicodeCause>();
  const scripts: string[] = [];
  const doubles: string[] = [];
  let index = 0;
  for (const char of text) {
    if (!isGsm7Char(char)) {
      const script = scriptOf(char);
      if (script) {
        if (!scripts.includes(script)) scripts.push(script);
      } else {
        const existing = causes.get(char);
        if (existing) existing.count += 1;
        else causes.set(char, { char, ...describeChar(char), word: wordAround(text, index), count: 1 });
      }
    } else if (EXTENSION.has(char) && !doubles.includes(char)) doubles.push(char);
    index += char.length;
  }
  return { unicodeCauses: [...causes.values()], unicodeScripts: scripts, doubleChars: doubles };
}

/**
 * Counts an SMS body with merge fields ({{name|fallback}}) and DLT slots ({#var#}): parts at the
 * fields' maximum lengths, the range against the preview recipient's values, and why it is Unicode.
 */
export function countSms(text: string, options: CountOptions = {}): SmsAnalysis {
  const worst = substitute(text, options, "max");
  const count = countSmsText(worst.text);
  let range: SmsAnalysis["range"] = null;
  if (options.previewValues && Object.keys(options.previewValues).length > 0) {
    const preview = countSmsText(substitute(text, options, "preview").text);
    if (preview.parts !== count.parts) {
      range = { min: Math.min(preview.parts, count.parts), max: Math.max(preview.parts, count.parts) };
    }
  }
  // Explain the fixed text plus the preview values, never the "x" fillers.
  const explained = explainEncoding(substitute(text, options, "explain").text);
  return { ...count, estimated: worst.estimated, range, fields: worst.fields, ...explained };
}

/** Replaces every character that has a plain GSM-7 stand-in ("Replace all"). */
export function replaceWithGsm(text: string): string {
  let out = "";
  for (const char of text) {
    const known = KNOWN[char];
    out += known && known.replacement !== undefined ? known.replacement : char;
  }
  return out;
}

/** "GSM-7" or "Unicode": the word in the encoding pill. */
export function encodingLabel(encoding: SmsEncoding): string {
  return encoding === "gsm7" ? "GSM-7" : "Unicode";
}

/** "1 SMS", "2 SMS", "1 to 2 SMS". */
export function partsLabel(analysis: Pick<SmsAnalysis, "parts" | "range">): string {
  if (analysis.range) return `${analysis.range.min} to ${analysis.range.max} SMS`;
  return `${analysis.parts} SMS`;
}
