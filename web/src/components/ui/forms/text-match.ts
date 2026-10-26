/**
 * The "contains" match that Combobox and the long Checkbox group filter use: case-insensitive and
 * accent-insensitive for Latin letters ("Jose" finds "José"). Indic vowel signs are combining marks
 * too, so only the Latin combining range is removed; "रा" never matches "र".
 */

const LATIN_MARKS = /[̀-ͯ]/g;

function foldChar(char: string): string {
  return char.normalize("NFD").replace(LATIN_MARKS, "").toLowerCase();
}

export function foldText(text: string): string {
  return foldChar(text);
}

/**
 * Where `query` first occurs in `text`, as [start, end) indices into the original string, or null.
 * An empty query matches nothing.
 */
export function findMatch(text: string, query: string): [number, number] | null {
  const needle = foldText(query.trim());
  if (!needle) return null;
  // Fold one UTF-16 unit at a time and remember which original index each folded unit came from.
  let folded = "";
  const origin: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const piece = foldChar(text[index]);
    for (let k = 0; k < piece.length; k += 1) {
      folded += piece[k];
      origin.push(index);
    }
  }
  const at = folded.indexOf(needle);
  if (at < 0) return null;
  const start = origin[at];
  const end = origin[at + needle.length - 1] + 1;
  return [start, end];
}

export function matches(text: string, query: string): boolean {
  return foldText(text).includes(foldText(query.trim()));
}

export type MatchSegment = { text: string; match: boolean };

/** The text split around its first match, for showing the matched part in font-semibold. */
export function matchSegments(text: string, query: string): MatchSegment[] {
  const range = findMatch(text, query);
  if (!range) return [{ text, match: false }];
  const [start, end] = range;
  return [
    { text: text.slice(0, start), match: false },
    { text: text.slice(start, end), match: true },
    { text: text.slice(end), match: false },
  ].filter((segment) => segment.text.length > 0);
}
