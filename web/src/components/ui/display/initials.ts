/**
 * Avatar initials (components.md, Avatar content): split the name into words; skip words ending
 * in "." (Dr., Prof.); take the first grapheme (Intl.Segmenter) of the first word and of the last
 * word for Latin script, and of the first word only for other scripts; uppercase Latin only.
 * "Ananya Rao" → "AR"; "ಶ್ರೀನಿವಾಸ್" → its first grapheme. An empty name gives null (the
 * UserRound icon shows instead). `count` 1 is the sm avatar's single initial.
 */
const LATIN = /\p{Script=Latin}/u;

let segmenter: Intl.Segmenter | null = null;
function firstGrapheme(word: string): string {
  segmenter ??= new Intl.Segmenter("en-IN", { granularity: "grapheme" });
  for (const { segment } of segmenter.segment(word)) return segment;
  return "";
}

export function getInitials(name: string | null | undefined, count: 1 | 2 = 2): string | null {
  const words = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0 && !word.endsWith("."))
    // Skip leading punctuation such as quotes or brackets around a word.
    .map((word) => word.replace(/^[^\p{L}\p{N}]+/u, ""))
    .filter((word) => word.length > 0);
  if (words.length === 0) return null;

  const first = firstGrapheme(words[0]);
  if (!LATIN.test(first)) return first;

  const last = words.length > 1 && count === 2 ? firstGrapheme(words[words.length - 1]) : "";
  const initials = LATIN.test(last) ? first + last : first;
  return initials.toLocaleUpperCase("en-IN");
}
