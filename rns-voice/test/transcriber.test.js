import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { buildSessionUpdate, restoreAgentAudio } from '../src/xai/session.js';

/**
 * The agent's transcriber is the agent's.
 *
 * The one thing this service must negotiate is the audio format, because that
 * describes the phone line rather than the agent. But xAI replaces
 * `audio.input` and `audio.output` wholesale instead of merging them, so
 * sending a format silently deleted everything the agent kept beside it: its
 * transcription keyterms and its playback speed. Measured against the live
 * agent — keyterms ["Kannada"] and speed 1.3 both gone the moment a format
 * went up on its own.
 *
 * A caller speaking Kannada then came back from a transcriber with no reason
 * to expect it, as Telugu or as Hindi, and the agent answered in the language
 * the transcript named. That was ours, not the agent's.
 */
const TELEPHONY = { type: 'audio/pcmu', rate: 8000 };

/** What the live agent echoes back before we send anything. */
function agentEcho() {
  return {
    input: { transport: 'json', transcription: { keyterms: ['Kannada'] } },
    output: { transport: 'json', speed: 1.3 },
  };
}

describe('the agent keeps its own transcriber', () => {
  it('sends no transcription settings of its own', () => {
    const { session } = buildSessionUpdate({ profile: 'telephony' });
    assert.equal(session.audio.input.transcription, undefined);
    assert.equal(session.audio.output.speed, undefined);
    assert.equal(session.instructions, undefined);
  });

  it('hands the agent back its keyterms after the format update', () => {
    const restore = restoreAgentAudio(agentEcho(), { profile: 'telephony' });
    assert.ok(restore, 'an echo carrying the agent settings must produce a restore');
    assert.equal(restore.type, 'session.update');
    assert.deepEqual(restore.session.audio.input.transcription, { keyterms: ['Kannada'] });
    assert.equal(restore.session.audio.output.speed, 1.3);
  });

  it('keeps the telephony format on both sides while restoring', () => {
    const { session: audio } = restoreAgentAudio(agentEcho(), { profile: 'telephony' });
    assert.deepEqual(audio.audio.input.format, TELEPHONY);
    assert.deepEqual(audio.audio.output.format, TELEPHONY);
    assert.equal(audio.audio.input.transport, 'json');
    assert.equal(audio.audio.output.transport, 'json');
  });

  it('carries across settings it has never heard of', () => {
    const echo = agentEcho();
    echo.input.noise_reduction = { type: 'far_field' };
    echo.output.something_new = 42;
    const restore = restoreAgentAudio(echo, { profile: 'telephony' });
    assert.deepEqual(restore.session.audio.input.noise_reduction, { type: 'far_field' });
    assert.equal(restore.session.audio.output.something_new, 42);
  });

  it('invents nothing when the agent set nothing', () => {
    assert.equal(restoreAgentAudio({ input: { transport: 'json' }, output: {} }, { profile: 'telephony' }), null);
    assert.equal(restoreAgentAudio(null, { profile: 'telephony' }), null);
    assert.equal(restoreAgentAudio(undefined, { profile: 'telephony' }), null);
    assert.equal(restoreAgentAudio(agentEcho(), { profile: 'nonexistent-profile' }), null);
  });

  it('names both sides, so restoring one never clears the other', () => {
    // Only the input side carries an agent setting here; the output side must
    // still be sent, or naming input alone would replace output with nothing.
    const restore = restoreAgentAudio({ input: { transcription: { keyterms: ['Kannada'] } } }, { profile: 'telephony' });
    assert.deepEqual(restore.session.audio.output.format, TELEPHONY);
  });
  it('adds an operator language hint to the agent settings rather than over them', () => {
    const restore = restoreAgentAudio(agentEcho(), { profile: 'telephony', languageHint: 'kn-IN' });
    assert.deepEqual(restore.session.audio.input.transcription, {
      keyterms: ['Kannada'],
      language_hint: 'kn-IN',
    });
  });
});

describe('the restore runs once and then stops', () => {
  it('does not re-restore from the echo of its own update', async () => {
    const { XaiSession } = await import('../src/xai/realtime.js');
    const session = new XaiSession({ profile: 'telephony', label: 'test' });
    const sent = [];
    session.send = (payload) => sent.push(payload);

    // The agent's own config arrives.
    session.onMessage(JSON.stringify({ type: 'session.updated', session: { audio: agentEcho() } }));
    assert.equal(sent.length, 1, 'the agent settings must be handed back once');

    // xAI acknowledges that, echoing the very settings we just restored. A
    // restore triggered by this one would loop for the life of the call.
    session.onMessage(JSON.stringify({
      type: 'session.updated',
      session: { audio: sent[0].session.audio },
    }));
    assert.equal(sent.length, 1, 'the acknowledgement must not trigger another restore');
  });
});
