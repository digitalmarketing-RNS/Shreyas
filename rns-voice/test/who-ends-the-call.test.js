import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';

/**
 * Who is allowed to end a call.
 *
 * Only three things may: the agent asking, the phone leg already being gone,
 * or the agent's session dying so there is nobody left to talk. This service
 * never decides a conversation is finished — that judgement belongs to the
 * agent, from its own configuration in the xAI console.
 */
/** Comments stripped, so prose about an old reason does not read as one. */
const code = (source) => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const bridge = code(readFileSync(new URL('../src/plivo/bridge.js', import.meta.url), 'utf8'));
const client = readFileSync(new URL('../src/plivo/client.js', import.meta.url), 'utf8');

describe('who ends a call', () => {
  it('ends one only for a reason outside its own judgement', () => {
    const reasons = [...bridge.matchAll(/teardown\(\s*[`'"]([^`'"]+)/g)].map((m) => m[1]);
    assert.ok(reasons.length >= 5, 'the teardown reasons must be found');

    // Every reason is either the agent's decision or a leg that has already
    // gone. None is this service deciding a conversation should stop.
    const allowed = [
      'plivo stream closed', 'plivo stream error', 'plivo sent stop',
      'xAI session closed', 'transferred', 'call already ended; releasing the bridge',
    ];
    for (const reason of reasons) {
      const ok = allowed.includes(reason) || reason.startsWith('agent ended the call');
      assert.ok(ok, `a call may not be ended for: "${reason}"`);
    }
  });

  it('never claims the dashboard ended a call somebody else ended', () => {
    // The hangup webhook fires because the call is already over. Recording
    // that as a decision of ours is what makes a working system look like it
    // is hanging up on people.
    assert.ok(!bridge.includes('ended from the dashboard'));
  });

  it('does not ask the carrier to hang up on its own judgement', () => {
    // Plivo's answering-machine detection cut real callers off six seconds in.
    const guard = client.slice(client.indexOf('if (detectMachine)'), client.indexOf('const result ='));
    assert.match(guard, /machine_detection/, 'detection stays behind the opt-in guard');
  });
});
