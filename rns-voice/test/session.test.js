import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { buildSessionUpdate, realtimeUrl } from '../src/xai/session.js';
import { config } from '../src/config.js';
import { dispositionFor } from '../src/plivo/routes.js';

describe('buildSessionUpdate', () => {
  it('asks for mu-law at 8 kHz on a phone call, matching Plivo exactly', () => {
    const { session } = buildSessionUpdate({ profile: 'telephony' });
    assert.deepEqual(session.audio.input.format, { type: 'audio/pcmu', rate: 8000 });
    assert.deepEqual(session.audio.output.format, { type: 'audio/pcmu', rate: 8000 });
  });

  it('uses the nested audio schema and never the flat one', () => {
    // Regression guard. xAI silently IGNORES flat input_audio_format /
    // output_audio_format and falls back to 24 kHz PCM, which on a phone call
    // produces garbled audio in both directions with no error anywhere.
    const { session } = buildSessionUpdate({ profile: 'telephony' });
    assert.equal(session.input_audio_format, undefined);
    assert.equal(session.output_audio_format, undefined);
    assert.ok(session.audio.input.format, 'nested input format must be present');
  });

  it('uses 24 kHz PCM in the browser console', () => {
    const { session } = buildSessionUpdate({ profile: 'browser' });
    assert.deepEqual(session.audio.output.format, { type: 'audio/pcm', rate: 24000 });
  });

  it('has no way to send a prompt or a voice, even when asked to', () => {
    // Not "unset by default" — unsettable. These options used to be honoured
    // as per-campaign overrides, which silently replaced the prompt and voice
    // the operator built in the xAI console.
    const { session } = buildSessionUpdate({
      profile: 'telephony', instructions: 'Be brief.', voice: 'eve', speed: 1.4,
    });
    assert.equal(session.instructions, undefined);
    assert.equal(session.voice, undefined);
    assert.equal(session.audio.output.speed, undefined);
  });

  it('sends nothing but the codec when nothing is configured', () => {
    // The invariant this whole service rests on: we connect the call, the xAI
    // console configures the agent. The audio format is the sole exception,
    // because it describes the phone line and not the agent. Anything else
    // appearing here silently overrides a setting the operator made in the
    // console, with no error and no way to see it happened.
    const { session } = buildSessionUpdate({ profile: 'telephony' });
    assert.deepEqual(Object.keys(session), ['audio']);
  });

  it('stays out of turn-taking, reasoning and speech rate unless told', () => {
    const { session } = buildSessionUpdate({ profile: 'telephony' });
    assert.equal(session.turn_detection, undefined, 'turn-taking is the agent\'s setting');
    assert.equal(session['reasoning.effort'], undefined, 'reasoning effort is the agent\'s setting');
    assert.equal(session.audio.output.speed, undefined, 'speech rate is the agent\'s setting');
  });

  it('offers no transfer tool unless a destination is configured', () => {
    // Handing a caller to a person is not something to enable by default.
    const { session } = buildSessionUpdate({ profile: 'telephony', detailsTool: true, callControl: true });
    const names = (session.tools ?? []).map((t) => t.name);
    assert.ok(!names.includes('transfer_to_human'));
  });

  it('describes what each tool does without saying when to use it', () => {
    // The agent decides when to hang up, when to save details and when to
    // transfer. A description that says "use this once the conversation has
    // finished" is a rule of ours competing with the console prompt.
    const { session } = buildSessionUpdate({
      profile: 'telephony', detailsTool: true, callControl: true, transferTo: '911234',
    });
    const directives = /\b(use it|use this|call this|do not|don't|say goodbye|tell the person|first,)\b/i;
    for (const tool of session.tools) {
      assert.ok(
        !directives.test(tool.description),
        `${tool.name} description instructs the agent: ${tool.description}`,
      );
    }
  });

  it('connects to the one configured agent and never to a bare model', () => {
    // A bare-model fallback meant a missing XAI_AGENT_ID still connected the
    // call: the caller heard a voice, just not the agent that was built, and
    // nothing said so. Both halves of that are asserted here, because which
    // one applies depends on the environment the suite runs in.
    if (config.xaiAgentId) {
      const url = new URL(realtimeUrl());
      assert.equal(url.searchParams.get('agent_id'), config.xaiAgentId);
      assert.equal(url.searchParams.get('model'), null, 'must never fall back to a raw model');
    } else {
      assert.throws(() => realtimeUrl(), /XAI_AGENT_ID is not set/);
    }
  });
});

describe('dispositionFor', () => {
  it('maps Plivo call statuses onto retry decisions', () => {
    assert.equal(dispositionFor('completed'), 'answered');
    assert.equal(dispositionFor('busy'), 'busy');
    assert.equal(dispositionFor('no-answer'), 'no_answer');
    assert.equal(dispositionFor('timeout'), 'no_answer');
    assert.equal(dispositionFor('failed'), 'failed');
  });

  it('reports a machine answer regardless of call status', () => {
    assert.equal(dispositionFor('completed', null, 'machine'), 'machine');
  });

  it('treats a human AMD verdict as a normal answer', () => {
    assert.equal(dispositionFor('completed', null, 'human'), 'answered');
  });

  it('treats an unknown status as retryable rather than reached', () => {
    // Closing a lead out on an unrecognised status would silently lose it.
    assert.equal(dispositionFor('something-new'), 'failed');
  });
});
