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

    it(`${name} sends no prompt, voice or behaviour setting`, () => {
      const src = code(source);
      for (const field of ['instructions:', 'voice:', 'turn_detection', 'reasoning.effort']) {
        assert.ok(!src.includes(field), `${name} must not send ${field}`);
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

  it('gives the agent the call facts, and only as system context', () => {
    // The one thing sent, and the reason it is not a contradiction: the agent
    // has no view of the dialler, so without the dialled number it asks the
    // person to read out the number it just rang them on.
    //
    // It goes as the `system` role, which xAI documents as system-level
    // context. As a `user` item it reads as somebody speaking and the agent
    // answers it; as system context it is data the agent simply has.
    const src = code(bridge);
    assert.ok(src.includes('sendCallFacts('), 'the call facts must be sent');
    const client = readFileSync(new URL('../src/xai/realtime.js', import.meta.url), 'utf8');
    const fn = client.slice(client.indexOf('sendCallFacts('), client.indexOf('sendText('));
    assert.match(fn, /role: 'system'/, 'call facts must use the system role, never user');
  });

  it('states facts and never tells the agent what to do with them', () => {
    // The guard that keeps this from drifting back into a briefing. Every
    // instruction this service ever sent arrived as a sentence like these.
    const builder = code(bridge);
    const body = builder.slice(builder.indexOf('function callFacts'), builder.indexOf('export function handlePlivoStream'));
    const imperative = /\b(you should|you must|do not|don't|make sure|remember to|be sure|always|never|please|your job|your task|if the caller|when the caller)\b/i;
    const strings = [...body.matchAll(/[`'"]([^`'"]{8,})[`'"]/g)].map((m) => m[1]);
    for (const text of strings) {
      assert.ok(!imperative.test(text), `call facts must not instruct: ${text}`);
    }
  });
});
