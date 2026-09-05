import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { replyGaps, replyPace } from '../src/report/pace.js';

/**
 * Reply pace.
 *
 * The number exists so a change made in the xAI console can be judged against
 * the call before it. That only works if it measures the same thing every
 * time, and reports nothing when there is nothing to measure.
 */
const at = (seconds) => new Date(Date.UTC(2026, 8, 5, 6, 0, seconds)).toISOString();
const caller = (s) => ({ role: 'caller', text: 'yes', at: at(s) });
const agent = (s) => ({ role: 'agent', text: 'right', at: at(s) });

describe('measuring the gap before each reply', () => {
  it('measures from the caller turn to the agent reply', () => {
    const gaps = replyGaps([caller(10), agent(14)]);
    assert.deepEqual(gaps.map((g) => g.ms), [4000]);
  });

  it('ignores the agent continuing its own turn', () => {
    // Two agent turns in a row is one thought, not a second reply.
    assert.deepEqual(replyGaps([caller(10), agent(14), agent(16)]).map((g) => g.ms), [4000]);
  });

  it('ignores a caller speaking twice with no reply between', () => {
    // This is the failure being investigated — it must not read as a reply.
    assert.deepEqual(replyGaps([caller(10), caller(13), agent(15)]).map((g) => g.ms), [2000]);
  });

  it('ignores the agent opening the call', () => {
    assert.deepEqual(replyGaps([agent(1), caller(3)]).map((g) => g.ms), []);
  });
});

describe('summarising a call', () => {
  it('reports the median and the slowest', () => {
    const pace = replyPace([
      caller(10), agent(11),   // 1s
      caller(20), agent(24),   // 4s
      caller(30), agent(33),   // 3s
    ]);
    assert.equal(pace.samples, 3);
    assert.equal(pace.medianMs, 3000);
    assert.equal(pace.slowestMs, 4000);
  });

  it('takes the middle of an even number of replies', () => {
    const pace = replyPace([caller(10), agent(11), caller(20), agent(23)]);
    assert.equal(pace.medianMs, 2000);
  });

  it('is not dragged by one long pause', () => {
    // The agent pausing to reach its calendar should not become the number
    // that describes the whole conversation.
    const pace = replyPace([
      caller(10), agent(11), caller(20), agent(21), caller(30), agent(45),
    ]);
    assert.equal(pace.medianMs, 1000, 'median holds; the mean would say 5.7s');
    assert.equal(pace.slowestMs, 15000, 'and the outlier is still reported');
  });

  it('reports nothing when there is nothing to measure', () => {
    assert.equal(replyPace([]), null);
    assert.equal(replyPace(null), null);
    assert.equal(replyPace([agent(1)]), null);
    assert.equal(replyPace([caller(1)]), null);
  });

  it('drops turns it cannot measure rather than inventing a number', () => {
    const pace = replyPace([
      { role: 'caller', text: 'yes' },            // no timestamp at all
      { role: 'agent', text: 'right', at: at(5) },
      caller(20), { role: 'agent', text: 'ok', at: 'not a date' },
      caller(30), agent(28),                      // clock ran backwards
      caller(40), agent(42),                      // the one real measurement
    ]);
    assert.equal(pace.samples, 1);
    assert.equal(pace.medianMs, 2000);
  });
});
