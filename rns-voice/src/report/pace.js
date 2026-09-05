/**
 * How long the agent took to answer, measured from the transcript.
 *
 * A caller who waits too long assumes the line is dead and says "hello?" — and
 * then both sides are talking at once. That happened on a real call: the agent
 * took about four seconds, the caller gave up waiting and spoke again.
 *
 * Nothing here changes a call. It reads timestamps this service already writes
 * and puts a number on what otherwise gets reported as "it felt slow", so a
 * setting changed in the xAI console can be judged against the call before it.
 *
 * WHAT THE NUMBER IS, EXACTLY. Each turn is stamped when this service received
 * it, so a gap is measured from the caller's transcript arriving to the agent's
 * first words arriving. Transcription finishes some time after the caller
 * actually stops talking, so the silence the caller sat through is LONGER than
 * this — never shorter. Read it as a floor, and as something to compare
 * against itself between calls, not as a stopwatch held at the caller's ear.
 */

const CALLER_ROLES = new Set(['caller', 'user', 'person', 'customer']);
const isCaller = (turn) => CALLER_ROLES.has(String(turn?.role ?? '').toLowerCase());

/**
 * Gaps between a caller turn and the agent's reply to it, in milliseconds.
 *
 * Only a caller turn immediately followed by an agent turn counts. Two agent
 * turns in a row are one thought continuing, and two caller turns in a row mean
 * the agent never answered the first — neither is a reply time.
 */
export function replyGaps(transcript) {
  const turns = Array.isArray(transcript) ? transcript : [];
  const gaps = [];
  for (let i = 1; i < turns.length; i += 1) {
    const before = turns[i - 1];
    const reply = turns[i];
    if (!isCaller(before) || isCaller(reply)) continue;
    const from = Date.parse(before.at);
    const to = Date.parse(reply.at);
    // A clock that went backwards, or a turn with no timestamp, is not a
    // measurement — dropping it beats reporting a negative or a NaN.
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) continue;
    gaps.push({ ms: to - from, index: i });
  }
  return gaps;
}

/**
 * Summary of one call's pace: { medianMs, slowestMs, samples }, or null when
 * the call had no reply to measure.
 *
 * Median rather than mean, because one long pause while the agent talks to its
 * calendar should not become the number that describes the conversation.
 */
export function replyPace(transcript) {
  const gaps = replyGaps(transcript).map((g) => g.ms);
  if (!gaps.length) return null;
  const sorted = [...gaps].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianMs = sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  return { medianMs, slowestMs: sorted[sorted.length - 1], samples: sorted.length };
}
