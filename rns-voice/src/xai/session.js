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
      // The wait after the caller stops before the agent replies. It is dead
      // air on every turn, so it dominates how fast the agent feels.
      silence_duration_ms: config.vadSilenceMs,
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
  if (options.languageHint || options.keyterms?.length) {
    audio.input.transcription = {
      ...(options.languageHint ? { language_hint: options.languageHint } : {}),
      ...(options.keyterms?.length ? { keyterms: options.keyterms } : {}),
    };
  }
  if (options.speed !== undefined) {
    audio.output.speed = Math.min(1.5, Math.max(0.7, options.speed));
  }
  if (options.tools?.length) session.tools = options.tools;

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
