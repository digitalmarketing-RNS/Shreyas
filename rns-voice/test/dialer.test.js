import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { planNextAttempt } from '../src/campaign/dialer.js';
import { isWithinWindow } from '../src/util/windows.js';

const IST = 'Asia/Kolkata';
const WINDOW = { startMinute: 10 * 60, endMinute: 19 * 60, days: [1, 2, 3, 4, 5, 6] };
const CAMPAIGN = { maxAttempts: 3, retryDelayMinutes: 60 };
const MIDDAY = new Date('2025-06-12T06:30:00Z'); // 12:00 Thursday, IST

describe('planNextAttempt', () => {
  it('closes a lead out when the call was answered', () => {
    const plan = planNextAttempt({ attempts: 0, timezone: IST }, CAMPAIGN, 'answered', WINDOW, MIDDAY);
    assert.equal(plan.status, 'completed');
    assert.equal(plan.nextAttemptAt, null);
  });

  it('requeues a no-answer with a retry time', () => {
    const plan = planNextAttempt({ attempts: 0, timezone: IST }, CAMPAIGN, 'no_answer', WINDOW, MIDDAY);
    assert.equal(plan.status, 'pending');
    // 12:00 + 60 minutes is still inside the window, so no further shifting.
    assert.equal(plan.nextAttemptAt, new Date('2025-06-12T07:30:00Z').toISOString());
  });

  it('gives up once the attempt limit is reached', () => {
    const plan = planNextAttempt({ attempts: 2, timezone: IST }, CAMPAIGN, 'busy', WINDOW, MIDDAY);
    assert.equal(plan.status, 'exhausted');
    assert.equal(plan.nextAttemptAt, null);
  });

  it('never schedules a retry into a closed window', () => {
    // 18:30 IST + 60 minutes would land at 19:30, past close.
    const evening = new Date('2025-06-12T13:00:00Z');
    const plan = planNextAttempt({ attempts: 0, timezone: IST }, CAMPAIGN, 'no_answer', WINDOW, evening);
    assert.equal(plan.status, 'pending');
    assert.ok(isWithinWindow(new Date(plan.nextAttemptAt), IST, WINDOW));
  });

  it('treats a machine answer as retryable, not as reached', () => {
    const plan = planNextAttempt({ attempts: 0, timezone: IST }, CAMPAIGN, 'machine', WINDOW, MIDDAY);
    assert.equal(plan.status, 'pending');
  });

  it('honours a single-attempt campaign', () => {
    const once = { maxAttempts: 1, retryDelayMinutes: 60 };
    const plan = planNextAttempt({ attempts: 0, timezone: IST }, once, 'busy', WINDOW, MIDDAY);
    assert.equal(plan.status, 'exhausted');
  });
});
