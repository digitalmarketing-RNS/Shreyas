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
 * Everything else is deliberately absent. The audio format is the one thing
 * that MUST be negotiated here, because it describes the phone line rather
 * than the agent. Prompt, voice, language, reasoning effort, turn-taking and
 * speech rate all belong to the agent's configuration in the xAI console, and
 * this payload stays silent about them unless an operator explicitly sets the
 * matching variable. Sending a value "just to be safe" would silently
 * overwrite the console setting with ours, which is exactly what must not
 * happen: this service connects the call, it does not configure the agent.
 */
export function buildSessionUpdate(options) {
  // JSON round-trip rather than structuredClone: the profiles are plain data,
  // and structuredClone does not exist before Node 17, which some shared hosts
  // still run.
  const audio = JSON.parse(JSON.stringify(PROFILES[options.profile]));
  const session = { audio };

  if (config.xaiReasoningEffort) session['reasoning.effort'] = config.xaiReasoningEffort;

  // Turn-taking is the agent's own setting. We send a turn_detection block
  // only for the values an operator actually set, and no block at all when
  // none are — sending one with invented numbers would replace the console's
  // VAD settings wholesale.
  const turnDetection = {};
  if (config.vadThreshold !== null) turnDetection.threshold = config.vadThreshold;
  if (config.vadSilenceMs !== null) turnDetection.silence_duration_ms = config.vadSilenceMs;
  Object.assign(turnDetection, options.turnDetection ?? {});
  if (Object.keys(turnDetection).length) {
    session.turn_detection = { type: 'server_vad', ...turnDetection };
  }

  if (config.agentSpeed !== null) {
    audio.output.speed = Math.min(1.5, Math.max(0.7, config.agentSpeed));
  }

  if (options.instructions) session.instructions = options.instructions;
  if (options.voice) session.voice = options.voice;
  // Transcription settings describe what xAI sends back to us, not how the
  // agent behaves, so they are ours to ask for. 'model' turns on the
  // live-caption event; without it the caller's words still arrive, but only
  // once each utterance is finished.
  const languageHint = options.languageHint || config.xaiLanguageHint;
  if (languageHint || options.keyterms?.length || config.xaiLiveCaptions) {
    audio.input.transcription = {
      ...(config.xaiLiveCaptions ? { model: 'grok-transcribe' } : {}),
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
