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
 * Prompt, voice and language are intentionally left unset unless a campaign
 * overrides them, so the agent keeps whatever was configured in the xAI console.
 */
export function buildSessionUpdate(options) {
  // JSON round-trip rather than structuredClone: the profiles are plain data,
  // and structuredClone does not exist before Node 17, which some shared hosts
  // still run.
  const audio = JSON.parse(JSON.stringify(PROFILES[options.profile]));
  const session = { audio };

  // Skipping the thinking step is the largest single latency saving on a call.
  session['reasoning.effort'] = config.xaiReasoningEffort;

  if (options.turnDetection !== null) {
    session.turn_detection = {
      type: 'server_vad',
      threshold: config.vadThreshold,
      // The wait after the speaker stops before the agent replies — dead air
      // on every turn. A phone line carries constant background noise, so it
      // needs a longer window than a browser microphone before silence can be
      // trusted; tuning VAD_SILENCE_MS therefore applies to calls, while the
      // browser console stays short because its audio is clean.
      silence_duration_ms: options.profile === 'telephony' ? config.vadSilenceMs : 300,
      // Audio kept from just before speech was detected, so the first syllable
      // is not clipped. Cheap, and it does not delay the reply.
      prefix_padding_ms: 300,
      ...options.turnDetection,
    };
  }

  if (config.agentSpeed !== 1) {
    audio.output.speed = Math.min(1.5, Math.max(0.7, config.agentSpeed));
  }

  if (options.instructions) session.instructions = options.instructions;
  if (options.voice) session.voice = options.voice;
  const languageHint = options.languageHint || config.xaiLanguageHint;
  if (languageHint || options.keyterms?.length) {
    audio.input.transcription = {
      ...(languageHint ? { language_hint: languageHint } : {}),
      ...(options.keyterms?.length ? { keyterms: options.keyterms } : {}),
    };
  }
  if (options.speed !== undefined) {
    audio.output.speed = Math.min(1.5, Math.max(0.7, options.speed));
  }
  const tools = [...(options.tools ?? [])];
  if (options.detailsTool) tools.push(CALL_DETAILS_TOOL);
  if (options.callControl) tools.push(END_CALL_TOOL);
  if (options.transferTo) tools.push(TRANSFER_CALL_TOOL);
  if (tools.length) session.tools = tools;

  return { type: 'session.update', session };
}

/** Realtime URL for an agent session, or a bare model session as a fallback. */
export function realtimeUrl({ agentId, conversationId } = {}) {
  const url = new URL(config.xaiRealtimeUrl);
  const agent = agentId || config.xaiAgentId;
  if (agent) url.searchParams.set('agent_id', agent);
  else url.searchParams.set('model', config.xaiModel);
  if (conversationId) url.searchParams.set('conversation_id', conversationId);
  return url.toString();
}

/**
 * Lets the agent hand structured data back mid-call — a booking time, a
 * correction to the contact's name, a better number to reach them on.
 *
 * The call is already recorded with its number, duration and transcript, so
 * this is for what only the conversation can reveal. Every field is optional
 * because a caller rarely supplies all of them, and a tool that demands
 * complete arguments makes the agent stall chasing them.
 */
export const CALL_DETAILS_TOOL = {
  type: 'function',
  name: 'save_call_details',
  description:
    'Record what was agreed on this call: an appointment, the contact details ' +
    'given, and anything worth noting. Call this as soon as something is ' +
    'settled, and again if it changes. Do not read the arguments aloud.',
  parameters: {
    type: 'object',
    properties: {
      outcome: {
        type: 'string',
        enum: ['booked', 'callback_requested', 'not_interested', 'wrong_number', 'other'],
        description: 'How the call ended up.',
      },
      appointment_time: {
        type: 'string',
        description: 'When the meeting is, in the words the person used, e.g. "Tuesday 3pm".',
      },
      contact_name: { type: 'string', description: 'The name they gave, if it differs from the list.' },
      callback_number: { type: 'string', description: 'A different number to reach them on.' },
      notes: { type: 'string', description: 'Anything else worth keeping.' },
    },
  },
};

/**
 * Lets the agent end the call itself.
 *
 * Without this the line stays open after the conversation is finished, and
 * the person has to hang up on a silent agent. The bridge does not cut the
 * audio the moment this is called: it waits for the goodbye to finish playing
 * out first, so the last thing heard is a sentence rather than a click.
 */
export const END_CALL_TOOL = {
  type: 'function',
  name: 'end_call',
  description:
    'Hang up. Say goodbye first, in the same turn, then call this. Use it once ' +
    'the conversation has finished: the booking is made, they are not ' +
    'interested, it is the wrong number, or they ask you to stop calling. ' +
    'Do not use it while they are still asking things.',
  parameters: {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        enum: ['completed', 'not_interested', 'wrong_number', 'do_not_call', 'voicemail', 'other'],
        description: 'Why the call is ending.',
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
    'Transfer this call to a human colleague. Tell the person you are ' +
    'putting them through, then call this. Use it when they ask for a human, ' +
    'or when the question is beyond what you can answer.',
  parameters: {
    type: 'object',
    properties: {
      reason: { type: 'string', description: 'Why a human is needed.' },
    },
  },
};
