import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { buildSessionUpdate, realtimeUrl } from '../src/xai/session.js';
import { config } from '../src/config.js';

/**
 * "The test agent works, so the campaign must be configured differently."
 *
 * It is not, and these assert why. A browser test and a phone call reach the
 * same agent with the same settings; only the codec differs, because a phone
 * line carries 8 kHz mu-law and a browser does not. And a test call and a
 * campaign call are placed by the same function with the same arguments.
 *
 * When a phone call fails and a browser test does not, the difference is the
 * phone network, not this service.
 */
describe('test agent and campaign are the same agent', () => {
  it('sends no behaviour settings on either path', () => {
    const browser = buildSessionUpdate({ profile: 'browser' }).session;
    const phone = buildSessionUpdate({ profile: 'telephony', detailsTool: true, callControl: true }).session;

    for (const [name, session] of [['browser', browser], ['telephony', phone]]) {
      for (const field of ['instructions', 'voice', 'turn_detection', 'reasoning.effort']) {
        assert.equal(session[field], undefined, `${name} must not send ${field}`);
      }
      assert.equal(session.audio.output.speed, undefined, `${name} must not set speech rate`);
    }
  });

  it('differs only by codec, and by the tools a call can use', () => {
    const browser = buildSessionUpdate({ profile: 'browser' }).session;
    const phone = buildSessionUpdate({ profile: 'telephony', detailsTool: true, callControl: true }).session;

    assert.deepEqual(Object.keys(browser), ['audio']);
    assert.deepEqual(Object.keys(phone).sort(), ['audio', 'tools']);

    // The one difference that must exist: Plivo streams mu-law at 8 kHz, and
    // asking for anything else yields audio at the wrong rate in both
    // directions with no error anywhere.
    assert.deepEqual(phone.audio.input.format, { type: 'audio/pcmu', rate: 8000 });
    assert.deepEqual(browser.audio.input.format, { type: 'audio/pcm', rate: 24000 });
  });

  it('reaches one agent, whichever path asked', () => {
    if (!config.xaiAgentId) return; // nothing configured in this environment
    const url = new URL(realtimeUrl());
    assert.equal(url.searchParams.get('agent_id'), config.xaiAgentId);
  });

  it('places a test call and a campaign call through the same function', () => {
    // Read rather than mock: the claim is about these two call sites, and a
    // mock would only prove the mock agrees with itself.
    const testCall = readFileSync(new URL('../src/api/routes.js', import.meta.url), 'utf8');
    const dialer = readFileSync(new URL('../src/campaign/dialer.js', import.meta.url), 'utf8');

    for (const [name, source] of [['test call', testCall], ['campaign dialer', dialer]]) {
      assert.match(source, /await placeCall\(\{/, `${name} must dial through placeCall`);
      assert.match(source, /from: config\.plivoNumber/, `${name} must use the configured caller id`);
      assert.match(source, /ringTimeout: config\.ringTimeoutSeconds/, `${name} must use the same ring timeout`);
    }
  });
});
