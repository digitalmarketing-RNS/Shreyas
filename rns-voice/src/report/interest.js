/**
 * Did the caller say they have a tile requirement?
 *
 * The agent asks one qualifying question — "do you have any tile requirements
 * for your project?" — and everything after it depends on the answer. That
 * answer is in the transcript on every call, and until now reading it meant
 * opening each call one at a time.
 *
 * This reads it back out. It decides nothing about the call and changes
 * nothing about it: the conversation has already happened, the agent made its
 * own judgement at the time, and this only reports what the person said.
 *
 * Two rules govern the whole file:
 *
 *   1. Never guess. A call whose transcript does not clearly answer comes back
 *      unanswered, and shows as "—". A wrong Yes is worse than a blank,
 *      because a blank prompts someone to read the transcript and a wrong Yes
 *      does not.
 *   2. Always show the words it matched. Every answer carries the caller's own
 *      sentence, so the operator can check it against the transcript in one
 *      glance rather than trusting this code.
 */

/**
 * Tokens, Unicode-aware, so Kannada and Devanagari split the same as Latin.
 *
 * Marks (\p{M}) are kept alongside letters, and that is the whole trick: in
 * every Indic script the vowel signs are combining marks, so splitting on
 * letters alone tears ಹೌದು into three pieces and no Kannada word can ever
 * match. Zero-width joiners are dropped rather than split on, for the same
 * reason — they sit inside words, not between them.
 */
function tokenize(text) {
  return String(text ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .split(/[^\p{L}\p{N}\p{M}]+/u)
    .filter(Boolean);
}

/**
 * An unambiguous yes, in the languages this agent takes calls in.
 *
 * Roman spellings are here beside the native scripts because the transcriber
 * returns whichever it heard — a Kannada caller can come back as "haudu" or as
 * ಹೌದು depending on the line.
 */
const YES = [
  // English
  ['yes'], ['yeah'], ['yep'], ['yup'], ['yes', 'please'], ['sure'], ['definitely'],
  ['absolutely'], ['of', 'course'], ['correct'], ['i', 'do'], ['we', 'do'],
  // Hindi
  ['हाँ'], ['हां'], ['जी', 'हाँ'], ['बिल्कुल'], ['haan'], ['haa'], ['han'], ['haanji'], ['bilkul'],
  // Kannada — ಹೌದು haudu (yes), ಇದೆ ide (there is)
  ['ಹೌದು'], ['ಇದೆ'], ['haudu'], ['houdu'], ['ide'],
  // Telugu — అవును avunu (yes), ఉంది undi (there is)
  ['అవును'], ['ఉంది'], ['avunu'], ['undi'],
  // Tamil — ஆம் aam (yes), இருக்கு irukku (there is)
  ['ஆம்'], ['ஆமாம்'], ['இருக்கு'], ['aamaam'], ['irukku'],
  // Marathi
  ['होय'], ['हो'], ['hoy'],
];

/** An unambiguous no, same languages. */
const NO = [
  // English
  ['no'], ['nope'], ['nah'], ['not', 'interested'], ['no', 'need'], ['not', 'right', 'now'],
  ['not', 'at', 'the', 'moment'], ['no', 'thanks'], ['no', 'thank', 'you'], ['not', 'now'],
  // Hindi
  ['नहीं'], ['नही'], ['nahi'], ['nahin'], ['nahee'], ['nai'],
  // Kannada — ಇಲ್ಲ illa (no / there is not), ಬೇಡ beda (don't want)
  ['ಇಲ್ಲ'], ['ಬೇಡ'], ['illa'], ['beda'],
  // Telugu — లేదు ledu (no), వద్దు vaddu (don't want)
  ['లేదు'], ['వద్దు'], ['ledu'], ['vaddu'],
  // Tamil — இல்லை illai (no), வேண்டாம் vendam (don't want)
  ['இல்லை'], ['வேண்டாம்'], ['illai'], ['vendam'],
  // Marathi
  ['नाही'],
];

/**
 * Leaning yes, and only consulted when nothing above matched.
 *
 * "I might have" is the reply a real caller gave to this question, and the
 * agent went on to book them. It is not a flat yes, but it is not a no either,
 * and reporting it as unanswered would hide a live lead. The quote goes on
 * screen beside it, so a soft answer never reads as a firm one.
 */
const SOFT_YES = [
  ['might', 'have'], ['maybe'], ['possibly'], ['probably'], ['thinking'], ['planning'],
  ['looking'], ['need'], ['needed'], ['want'], ['interested'], ['requirement'],
  ['requirements'], ['ಬೇಕು'], ['beku'], ['kavali'], ['चाहिए'], ['chahiye'],
];

/** Words that turn a leaning yes into a no: "not looking", "no requirement". */
const NEGATORS = new Set([
  'no', 'not', 'dont', 'don', 'doesnt', 'doesn', 'never', 'without',
  'nahi', 'nahin', 'नहीं', 'नही', 'illa', 'ಇಲ್ಲ', 'ledu', 'లేదు', 'illai', 'இல்லை', 'नाही',
]);

/** Earliest token index at which any of these phrases appears, or -1. */
function firstMatch(tokens, phrases) {
  let best = -1;
  for (const phrase of phrases) {
    for (let i = 0; i + phrase.length <= tokens.length; i += 1) {
      if (phrase.every((word, k) => tokens[i + k] === word)) {
        if (best === -1 || i < best) best = i;
        break;
      }
    }
  }
  return best;
}

/**
 * Reads one caller sentence. Returns 'yes', 'no', or null for "does not say".
 *
 * With both a yes and a no present, the earlier one wins: people lead with
 * their answer and qualify it afterwards — "no, we finished that job last
 * month" is a no, whatever follows.
 */
export function readAnswer(text) {
  const tokens = tokenize(text);
  if (!tokens.length) return null;

  const yes = firstMatch(tokens, YES);
  const no = firstMatch(tokens, NO);
  if (yes !== -1 && no !== -1) return yes < no ? 'yes' : 'no';
  if (yes !== -1) return 'yes';
  if (no !== -1) return 'no';

  const soft = firstMatch(tokens, SOFT_YES);
  if (soft === -1) return null;
  // "I am not looking for any" is a no, and reads as a soft yes without this.
  const before = tokens.slice(Math.max(0, soft - 3), soft);
  return before.some((word) => NEGATORS.has(word)) ? 'no' : 'yes';
}

const CALLER_ROLES = new Set(['caller', 'user', 'person', 'customer']);
const isCaller = (turn) => CALLER_ROLES.has(String(turn?.role ?? '').toLowerCase());

/**
 * Whether an agent turn is the qualifying question.
 *
 * Matched loosely, and only used to decide where to start reading. When the
 * call was in Kannada or Hindi the question was asked in that language and
 * none of this matches — which is why not finding it is not a failure, just a
 * wider search below.
 */
function looksLikeTheQuestion(text) {
  const t = String(text ?? '').toLowerCase();
  return /requirement|looking for tiles|any tiles|need tiles|tile needs/.test(t);
}

/**
 * The caller's answer to the tile-requirement question.
 *
 * Returns { answer: 'yes' | 'no' | null, quote, index }. `quote` is the
 * caller's sentence the answer was read from, so the report can show its own
 * evidence; `index` is its position in the transcript.
 */
export function tileInterest(transcript) {
  const turns = Array.isArray(transcript) ? transcript : [];
  const none = { answer: null, quote: null, index: -1 };

  // Where to start reading. The qualifying question if it can be found;
  // otherwise the agent's first question of any kind, because the opening
  // "hello?" exchange is full of yeses that answer nothing.
  let start = turns.findIndex((t) => !isCaller(t) && looksLikeTheQuestion(t.text));
  if (start === -1) start = turns.findIndex((t) => !isCaller(t) && String(t.text ?? '').includes('?'));
  if (start === -1) return none;

  for (let i = start + 1; i < turns.length; i += 1) {
    if (!isCaller(turns[i])) continue;
    const answer = readAnswer(turns[i].text);
    if (answer) return { answer, quote: String(turns[i].text).trim(), index: i };
  }
  return none;
}
