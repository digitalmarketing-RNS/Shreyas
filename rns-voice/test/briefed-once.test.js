import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { XaiSession } from '../src/xai/realtime.js';

/**
 * The dialled number is given to the agent once.
 *
 * A session can be briefed by whoever opened it and then again by whoever
 * picked it up. The same metadata arriving twice makes the number look like
 * something worth remarking on rather than something already known — and on a
 * live call the agent recited it back to the caller three times.
 *
 * The old guard was "has the socket finished opening", which is a different
 * question: a session claimed mid-handshake had not opened, so it was briefed
 * again on top of the briefing it already had.
 */
describe('call facts', () => {
  it('are sent once, however many times they are offered', () => {
    const session = new XaiSession({ profile: 'telephony', label: 'test' });
    const sent = [];
    session.send = (payload) => sent.push(payload);

    session.sendCallFacts('Call metadata. phone number dialled: +919902599025');
    session.sendCallFacts('Call metadata. phone number dialled: +919902599025');
    session.sendCallFacts('Call metadata. phone number dialled: +919902599025');

    assert.equal(sent.length, 1, 'the agent must be briefed exactly once');
    assert.equal(sent[0].type, 'conversation.item.create');
    assert.equal(sent[0].item.role, 'system', 'facts are context, never a turn to answer');
    assert.match(sent[0].item.content[0].text, /\+919902599025/);
  });

  it('are still sent when the session was never opened first', () => {
    // The prewarm path briefs on open; the fresh path briefs on open too. A
    // session that has not opened must not be treated as already briefed.
    const session = new XaiSession({ profile: 'telephony', label: 'test' });
    const sent = [];
    session.send = (payload) => sent.push(payload);
    assert.equal(session.factsSent, false, 'a new session starts unbriefed');
    session.sendCallFacts('Call metadata. phone number dialled: +910000000000');
    assert.equal(sent.length, 1);
  });

  it('does not brief one session because another was briefed', () => {
    const a = new XaiSession({ profile: 'telephony', label: 'a' });
    const b = new XaiSession({ profile: 'telephony', label: 'b' });
    const sentA = []; const sentB = [];
    a.send = (p) => sentA.push(p);
    b.send = (p) => sentB.push(p);
    a.sendCallFacts('for a');
    assert.equal(sentA.length, 1);
    assert.equal(sentB.length, 0, 'the flag must live on the session, not be shared');
    b.sendCallFacts('for b');
    assert.equal(sentB.length, 1);
  });
});

describe('the bridge briefs by whether it was briefed, not by socket state', () => {
  it('no longer decides from session.ready alone', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../src/plivo/bridge.js', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(
      !/if\s*\(!session\.ready\)\s*\{\s*session\.on\('open'/.test(src),
      'briefing must not be skipped merely because the socket is already open',
    );
    assert.ok(src.includes('sendCallFacts'), 'the bridge still briefs the agent');
  });
});
