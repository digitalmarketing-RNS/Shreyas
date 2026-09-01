import { config } from '../config.js';

/**
 * Audio profiles.
 *
 * `telephony` matches Plivo's AudioStream exactly — G.711 mu-law at 8 kHz —
 * so call audio is relayed in both directions with no resampling and no
 * transcoding, which keeps added latency at effectively zero.
 *
 * `browser` uses 24 kHz linear PCM, which an AudioContext renders directly.
 */
const PROFILES = {
  telephony: {
    input: { format: { type: 'audio/pcmu', rate: 8000 }, transport: 'json' },
    output: { format: { type: 'audio/pcmu', rate: 8000 }, transport: 'json' },
  },
  browser: {
    input: { format: { type: 'audio/pcm', rate: 24000 }, transport: 'json' },
    output: { format: { type: 'audio/pcm', rate: 24000 }, transport: 'json' },
  },
};

/**
 * Builds the `session.update` payload.
 *
 * IMPORTANT: the audio format must use the nested `audio.input.format` /
 * `audio.output.format` schema below. xAI silently ignores the older flat
 * `input_audio_format` / `output_audio_format` fields that other realtime APIs
 * accept — it does not error, it just falls back to 24 kHz PCM. On a phone call
 * that yields audio played at the wrong sample rate in both directions: a
 * chipmunk agent and an unintelligible caller. It looks like a model fault but
 * is purely a config one, so do not "simplify" this back to the flat form.
 *
 * Everything else is deliberately absent, and there is no field left to add
 * it through. The audio format is the one thing that MUST be negotiated here,
 * because it describes the phone line rather than the agent — get it wrong
 * and both sides hear garbled audio. Prompt, voice, language, reasoning
 * effort, turn-taking and speech rate all belong to the agent's configuration
 * in the xAI console. Not defaults left unset: no fields at all. This service
 * connects the call; it does not configure the agent.
 *
 * Sending even this much is not free, though: xAI replaces the whole `audio`
 * object rather than merging it, so the format alone deletes the agent's own
 * settings beside it. restoreAgentAudio below puts them back.
 */
function buildAudio(options) {
  // JSON round-trip rather than structuredClone: the profiles are plain data,
  // and structuredClone does not exist before Node 17, which some shared hosts
  // still run.
  const audio = JSON.parse(JSON.stringify(PROFILES[options.profile] ?? {}));

  // Transcription settings describe what xAI sends back to us, not how the
  // agent behaves, so they are ours to ask for. 'model' turns on the
  // live-caption event; without it the caller's words still arrive, but only
  // once each utterance is finished.
  //
  // All three are unset by default, and should stay that way for an agent that
  // has its own: the agent's transcriber is tuned to the languages it actually
  // takes calls in, and this cannot improve on it without knowing them.
  const languageHint = options.languageHint || config.xaiLanguageHint;
  if (languageHint || options.keyterms?.length || config.xaiLiveCaptions) {
    audio.input.transcription = {
      ...(config.xaiLiveCaptions ? { model: 'grok-transcribe' } : {}),
      ...(languageHint ? { language_hint: languageHint } : {}),
      ...(options.keyterms?.length ? { keyterms: options.keyterms } : {}),
    };
  }
  return audio;
}

export function buildSessionUpdate(options) {
  const audio = buildAudio(options);
  const session = { audio };

  const tools = [...(options.tools ?? [])];
  if (options.detailsTool) tools.push(CALL_DETAILS_TOOL);
  if (options.callControl) tools.push(END_CALL_TOOL);
  if (options.transferTo) tools.push(TRANSFER_CALL_TOOL);
  if (tools.length) session.tools = tools;

  return { type: 'session.update', session };
}

/**
 * Realtime URL for the one configured agent.
 *
 * There is deliberately no per-call agent and no bare-model fallback. Falling
 * back to a raw model when XAI_AGENT_ID was missing meant calls still
 * connected and the caller still heard a voice — just not the agent that was
 * built, with none of its prompt or settings, and nothing anywhere saying so.
 * A missing agent id is a configuration error and now reads as one.
 */
/**
 * Hands the agent back the audio settings our format update just erased.
 *
 * xAI replaces `audio.input` and `audio.output` wholesale rather than merging
 * them key by key. Sending a format therefore deletes every sibling field the
 * agent carries from the xAI console — measured against the live agent, whose
 * `audio.input.transcription.keyterms` of ["Kannada"] and `audio.output.speed`
 * of 1.3 both vanished the instant we sent a format and nothing else. Same
 * shape of bug as sending a tools array and wiping the agent's connectors.
 *
 * The keyterms are not cosmetic. They bias the transcriber towards a language,
 * and stripped of them Kannada comes back as Telugu or Hindi — near enough
 * phonetically to fool a general model, and once the transcript says Telugu
 * the agent answers in Telugu and the call is lost. The agent had it right in
 * its own configuration; we were quietly deleting it on every call.
 *
 * So this waits until xAI echoes the agent's own audio block back, then hands
 * those exact values straight back with only the two format fields — the ones
 * that describe the phone line rather than the agent — set to ours. Nothing is
 * chosen here: every field except the format is the agent's own, copied
 * verbatim, whatever it happens to be. Fields we have never heard of are
 * carried across too, which is the point.
 *
 * Returns null when the echo holds nothing of the agent's, so a session that
 * has nothing to restore sends no extra message at all.
 */
export function restoreAgentAudio(agentAudio, options) {
  if (!PROFILES[options?.profile] || !agentAudio || typeof agentAudio !== 'object') return null;
  const audio = buildAudio(options);

  let restored = false;
  for (const side of ['input', 'output']) {
    const theirs = agentAudio[side];
    if (!theirs || typeof theirs !== 'object') continue;
    for (const [key, value] of Object.entries(theirs)) {
      // The format and transport describe the phone line, so those stay ours.
      // Every other field on this side is the agent's.
      if (key === 'format' || key === 'transport') continue;
      if (key === 'transcription' && audio[side].transcription) {
        // An operator who set a language hint here meant it, so it survives —
        // but it is added to the agent's transcriber settings rather than
        // swapped in for them, because dropping its keyterms is the whole bug
        // this exists to fix.
        audio[side].transcription = { ...value, ...audio[side].transcription };
      } else {
        audio[side][key] = value;
      }
      restored = true;
    }
  }
  // Nothing of the agent's to give back — say so, rather than sending a second
  // update that repeats the first.
  if (!restored) return null;

  return { type: 'session.update', session: { audio } };
}

export function realtimeUrl({ conversationId } = {}) {
  if (!config.xaiAgentId) {
    throw new Error('XAI_AGENT_ID is not set — there is no agent to connect the call to.');
  }
  const url = new URL(config.xaiRealtimeUrl);
  url.searchParams.set('agent_id', config.xaiAgentId);
  if (conversationId) url.searchParams.set('conversation_id', conversationId);
  return url.toString();
}

/**
 * Writes structured data onto the call record.
 *
 * Tool descriptions here state what the tool does and nothing about when to
 * use it: whether a call is worth saving details from is the agent's
 * judgement, made from its own configuration, not something this service
 * should be steering from a description string.
 *
 * Every field is optional. A tool that demands complete arguments makes the
 * agent stall chasing values the caller never gave.
 */
export const CALL_DETAILS_TOOL = {
  type: 'function',
  name: 'save_call_details',
  description:
    'Saves details onto this call\'s record in the dashboard. The number, ' +
    'duration and full transcript are already saved without this; it stores ' +
    'the fields below as structured data. May be called more than once — a ' +
    'later call replaces the fields it sets.',
  parameters: {
    type: 'object',
    properties: {
      outcome: {
        type: 'string',
        enum: ['booked', 'callback_requested', 'not_interested', 'wrong_number', 'other'],
        description: 'Outcome recorded against the lead.',
      },
      appointment_time: {
        type: 'string',
        description: 'Appointment time, stored as free text, e.g. "Tuesday 3pm".',
      },
      contact_name: { type: 'string', description: 'Contact name, stored against the lead.' },
      callback_number: { type: 'string', description: 'Alternative number, stored against the lead.' },
      notes: { type: 'string', description: 'Free-text note stored on the call record.' },
    },
  },
};

/**
 * Ends the phone call.
 *
 * The description tells the agent what happens, not when to do it — deciding
 * a conversation is over is exactly the kind of judgement that belongs to the
 * agent's own configuration.
 *
 * The bridge does not cut audio the moment this is called: it waits for
 * whatever is still queued to finish playing, so a closing sentence is heard
 * in full rather than clipped into a click.
 */
export const END_CALL_TOOL = {
  type: 'function',
  name: 'end_call',
  description:
    'Ends the phone call. Anything already spoken in this turn finishes ' +
    'playing before the line is released, so speech in the same turn is not ' +
    'cut off. The call cannot be resumed afterwards.',
  parameters: {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        enum: ['completed', 'not_interested', 'wrong_number', 'do_not_call', 'voicemail', 'other'],
        description: 'Recorded as the call disposition, and decides whether the lead is retried.',
      },
    },
    required: ['reason'],
  },
};

/**
 * Hands the call to a person. The destination is fixed by configuration
 * rather than chosen by the agent, so a call can only ever be sent to a
 * number the operator nominated.
 */
export const TRANSFER_CALL_TOOL = {
  type: 'function',
  name: 'transfer_to_human',
  description:
    'Transfers this call to the operator\'s configured number. The ' +
    'destination is set in this service and cannot be chosen here. Transfer ' +
    'happens immediately once called, ending this conversation.',
  parameters: {
    type: 'object',
    properties: {
      reason: { type: 'string', description: 'Recorded on the call record.' },
    },
  },
};
