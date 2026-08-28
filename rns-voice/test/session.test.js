import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { buildSessionUpdate } from '../src/xai/session.js';
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

  it('leaves prompt and voice alone so the xAI console config wins', () => {
    const { session } = buildSessionUpdate({ profile: 'telephony' });
    assert.equal(session.instructions, undefined);
    assert.equal(session.voice, undefined);
  });

  it('applies a campaign override when one is given', () => {
    const { session } = buildSessionUpdate({
      profile: 'telephony', instructions: 'Be brief.', voice: 'eve',
    });
    assert.equal(session.instructions, 'Be brief.');
    assert.equal(session.voice, 'eve');
  });

  it('allows a longer silence window on the phone than in the browser', () => {
    // Phone lines carry noise; cutting in early makes the agent feel rude.
    const phone = buildSessionUpdate({ profile: 'telephony' }).session;
    const browser = buildSessionUpdate({ profile: 'browser' }).session;
    assert.ok(phone.turn_detection.silence_duration_ms > browser.turn_detection.silence_duration_ms);
  });

  it('clamps speech speed to the supported range', () => {
    const { session } = buildSessionUpdate({ profile: 'browser', speed: 9 });
    assert.equal(session.audio.output.speed, 1.5);
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
