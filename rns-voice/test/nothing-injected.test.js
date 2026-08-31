import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';

/**
 * A call must be the same session a console test is.
 *
 * Everything this service has ever added to a conversation — a scripted
 * opener, a prompt override, an instruction, a briefing naming the dialled
 * number, a response.create to make the agent speak first — changed how the
 * agent opened the call, which is the operator's to decide in the xAI
 * console. The agent greets by itself about 1.6 seconds after the session
 * opens; nothing needs to ask it to.
 */
const bridge = readFileSync(new URL('../src/plivo/bridge.js', import.meta.url), 'utf8');
const consoleApi = readFileSync(new URL('../src/api/console.js', import.meta.url), 'utf8');

/** Source with comments removed, so prose about a call does not read as one. */
function code(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('nothing is put into the conversation', () => {
  for (const [name, source] of [['the call bridge', bridge], ['the browser console', consoleApi]]) {
    it(`${name} never speaks for the agent`, () => {
      const src = code(source);
      for (const injection of ['forceMessage(', 'sendContext(']) {
        assert.ok(!src.includes(injection), `${name} must not call ${injection}`);
      }
    });

    it(`${name} never takes the agent's turn for it`, () => {
      // response.create makes the agent speak on our schedule rather than its
      // own, which is the difference between a call and a console test.
      assert.ok(!code(source).includes('createResponse('), `${name} must not call createResponse()`);
    });
  }

  it('puts nothing of its own into a call', () => {
    // sendText is the operator typing in the browser test box — a person
    // talking, which is the point of that page. On a call there is no
    // operator, so any text at all there would be ours.
    assert.ok(!code(bridge).includes('sendText('), 'the call bridge must send no text');
    assert.ok(code(consoleApi).includes('sendText('), 'the console must still relay what a person types');
  });

  it('sends the agent no facts about the call', () => {
    // The dialled number and the lead's fields used to be injected as a
    // conversation turn. The agent asks for what it needs.
    const src = code(bridge);
    assert.ok(!src.includes('describeCall'), 'the call briefing must be gone');
    assert.ok(!/leads\./.test(src), 'lead data must not reach the agent path');
  });
});
