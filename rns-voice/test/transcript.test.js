import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { EventEmitter } from 'node:events';
import { XaiSession } from '../src/xai/realtime.js';

/** Feeds raw xAI server events through the real message handler. */
function collect(events) {
  const session = new XaiSession({ profile: 'telephony', label: 'test' });
  const seen = [];
  session.on('transcript', (t) => seen.push(t));
  for (const event of events) session.onMessage(JSON.stringify(event));
  return seen;
}

describe('caller transcription', () => {
  it('records the caller from the .completed event alone', () => {
    // The regression that started this. xAI emits .updated ONLY when the
    // session asks for live captions, so a session that did not ask recorded
    // nothing the caller said — and reported no error, because nothing had
    // gone wrong as far as either side was concerned.
    const seen = collect([
      {
        type: 'conversation.item.input_audio_transcription.completed',
        item_id: 'msg_003',
        transcript: 'Hello, how are you?',
      },
    ]);
    assert.equal(seen.length, 1);
    assert.equal(seen[0].role, 'caller');
    assert.equal(seen[0].text, 'Hello, how are you?');
    assert.equal(seen[0].final, true);
  });

  it('still takes live captions when they are switched on', () => {
    const seen = collect([
      { type: 'conversation.item.input_audio_transcription.updated', item_id: 'm1', transcript: 'Hello, how' },
      { type: 'conversation.item.input_audio_transcription.completed', item_id: 'm1', transcript: 'Hello, how are you?' },
    ]);
    assert.equal(seen.length, 2);
    assert.equal(seen[0].final, false);
    assert.equal(seen[1].final, true);
    // Cumulative, not deltas — the second restates the whole utterance.
    assert.ok(seen.every((t) => t.cumulative));
  });

  it('reads the agent transcript under every event name the API uses', () => {
    const seen = collect([
      { type: 'response.output_audio_transcript.delta', delta: 'Good ' },
      { type: 'response.output_text.delta', delta: 'morning' },
      { type: 'response.text.delta', delta: '.' },
    ]);
    assert.equal(seen.length, 3);
    assert.ok(seen.every((t) => t.role === 'agent'));
    assert.equal(seen.map((t) => t.text).join(''), 'Good morning.');
  });
});

describe('transcript assembly', () => {
  // A miniature of the store's merge rule, exercised through the real one.
  it('keeps two consecutive caller utterances apart', async () => {
    const { calls } = await import('../src/store.js');
    const call = calls.create({ toNumber: '919999999999', direction: 'outbound' });

    calls.appendTranscript(call.id, { role: 'caller', text: 'Yes hello', itemId: 'a', final: true }, true);
    calls.appendTranscript(call.id, { role: 'caller', text: 'Can you hear me', itemId: 'b', final: true }, true);

    const turns = calls.get(call.id).transcript;
    assert.equal(turns.length, 2, 'the second utterance must not overwrite the first');
    assert.deepEqual(turns.map((t) => t.text), ['Yes hello', 'Can you hear me']);
  });

  it('replaces rather than appends within one utterance', () => {
    return import('../src/store.js').then(({ calls }) => {
      const call = calls.create({ toNumber: '919999999999', direction: 'outbound' });
      calls.appendTranscript(call.id, { role: 'caller', text: 'Hello, how', itemId: 'a' }, true);
      calls.appendTranscript(call.id, { role: 'caller', text: 'Hello, how are you?', itemId: 'a', final: true }, true);

      const turns = calls.get(call.id).transcript;
      assert.equal(turns.length, 1);
      assert.equal(turns[0].text, 'Hello, how are you?');
    });
  });

  it('appends the agent deltas that carry no id', () => {
    return import('../src/store.js').then(({ calls }) => {
      const call = calls.create({ toNumber: '919999999999', direction: 'outbound' });
      calls.appendTranscript(call.id, { role: 'agent', text: 'Good ' }, false);
      calls.appendTranscript(call.id, { role: 'agent', text: 'morning.' }, false);

      const turns = calls.get(call.id).transcript;
      assert.equal(turns.length, 1);
      assert.equal(turns[0].text, 'Good morning.');
    });
  });
});
