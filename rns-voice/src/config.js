import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Loads a .env file sitting beside the application.
 *
 * Managed panels inject configuration as real environment variables, but
 * editing a .env file is what most people reach for first, and silently
 * ignoring that file makes a correctly-filled-in deployment look broken.
 * Panel variables still win: this only fills in what is not already set.
 */
function loadDotEnv() {
  const file = join(ROOT, '.env');
  if (!existsSync(file)) return;
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip one layer of matching quotes, which people add out of habit.
    if (value.length > 1 && /^(".*"|'.*')$/.test(value)) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv();

function bool(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return /^(1|true|yes|on)$/i.test(String(value));
}

function int(value, fallback) {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * A number that stays unset when nobody set it.
 *
 * Used for the agent-behaviour knobs: null means "say nothing to xAI about
 * this", which is different from any numeric default we could invent.
 */
function num(value) {
  if (value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const env = process.env;

/** Strips the leading + — Plivo expects bare digits on the wire. */
function digitsOnly(value) {
  return String(value ?? '').replace(/[^\d]/g, '');
}

export const config = {
  root: ROOT,
  port: int(env.PORT, 3000),
  nodeEnv: env.NODE_ENV ?? 'production',
  logLevel: env.LOG_LEVEL ?? 'info',

  // ---- xAI ---------------------------------------------------------------
  xaiApiKey: env.XAI_API_KEY ?? '',
  xaiRealtimeUrl: env.XAI_REALTIME_URL ?? 'wss://api.x.ai/v1/realtime',
  // The agent already carries its prompt, voice and language from the xAI
  // console, so this service connects to it and does not override any of that
  // unless a campaign explicitly asks.
  xaiAgentId: env.XAI_AGENT_ID ?? '',
  xaiModel: env.XAI_MODEL ?? 'grok-voice-latest',

  // ---- Agent behaviour: NOT ours to decide -------------------------------
  // Everything in this block is unset by default and is sent to xAI only if
  // you set it here. The agent's own configuration in the xAI console decides
  // how it thinks, when it takes its turn and how fast it speaks; this service
  // must not quietly override any of that. Leaving a value blank is not a
  // missing default — it is the point. Set one only to deliberately override
  // the console for this deployment.
  //
  // XAI_REASONING_EFFORT: 'none' skips the thinking step before replying.
  // Measured over 8 sessions it made no difference to time-to-first-audio
  // (medians 644 ms for 'none' against 536 ms for 'high', overlapping ranges),
  // so it is not a speed fix.
  xaiReasoningEffort: env.XAI_REASONING_EFFORT || null,
  // VAD_SILENCE_MS: how long the caller must be silent before the agent takes
  // its turn. This is a fixed wait on every single turn, so it is the one knob
  // that reliably changes how quickly replies come back. 400-600 ms is the
  // usable band on a phone line; below that the agent cuts people off.
  vadSilenceMs: num(env.VAD_SILENCE_MS),
  // VAD_THRESHOLD: raise on a noisy line if the agent talks over background
  // sound.
  vadThreshold: num(env.VAD_THRESHOLD),
  // AGENT_SPEED: playback rate, 0.7-1.5. Changes how brisk the agent sounds,
  // not how quickly it starts.
  agentSpeed: num(env.AGENT_SPEED),
  // Offers the agent save_call_details, end_call and transfer_to_human as
  // functions it may call. It decides whether and when to use them; the
  // descriptions state only what each one does. Turn off if the agent defines
  // its own tools in the xAI console, since sending a tools list may replace
  // what is configured there.
  agentDetailsTool: bool(env.AGENT_DETAILS_TOOL, true),
  // 'facts' passes the dialled number and lead fields to the agent as data;
  // 'off' passes nothing at all. Either way no instructions are sent — how the
  // agent behaves is decided entirely by its configuration in the xAI console.
  agentBriefing: (env.AGENT_BRIEFING ?? 'facts').toLowerCase(),
  // Streams the caller's words as they speak, rather than once each sentence
  // finishes. Sets audio.input.transcription.model, which xAI's event docs
  // require for the live-caption event but which its published session schema
  // does not list — so this is off until a test call confirms your account
  // accepts it. The finished transcript of every utterance is recorded either
  // way; this only decides whether it also arrives mid-sentence.
  xaiLiveCaptions: bool(env.XAI_LIVE_CAPTIONS, false),
  // Optional BCP-47 hint for the transcriber, e.g. hi-IN. Leave unset for
  // automatic detection, which is what a multilingual agent wants.
  xaiLanguageHint: env.XAI_LANGUAGE_HINT ?? '',
  // Opens the xAI session while the call is still being answered, so the
  // connection and configuration are not on the critical path.
  prewarmSessions: bool(env.PREWARM_SESSIONS, true),
  // Generates the opening line while Plivo is still opening the audio stream,
  // so it is ready to play rather than starting to be composed once the
  // caller is already listening.
  prewarmGreeting: bool(env.PREWARM_GREETING, true),
  // Lets the agent hang up when the conversation is done, rather than leaving
  // the person to hang up on a silent line.
  agentCallControl: bool(env.AGENT_CALL_CONTROL, true),
  // A number to hand callers to when they ask for a person. The agent cannot
  // choose the destination — only whether to transfer — so a call can never be
  // sent anywhere but here. Unset means no transfer tool is offered.
  transferNumber: digitsOnly(env.TRANSFER_NUMBER),
  transferNumberDisplay: env.TRANSFER_NUMBER ?? '',
  // How long to wait for Plivo to confirm the goodbye finished playing before
  // hanging up regardless. Long enough for a closing sentence, short enough
  // that a lost confirmation does not hold the line open.
  hangupGraceMs: int(env.HANGUP_GRACE_MS, 8000),

  // ---- Plivo -------------------------------------------------------------
  plivoAuthId: env.PLIVO_AUTH_ID ?? '',
  plivoAuthToken: env.PLIVO_AUTH_TOKEN ?? '',
  plivoNumber: digitsOnly(env.PLIVO_PHONE_NUMBER),
  plivoNumberDisplay: env.PLIVO_PHONE_NUMBER ?? '',
  // Plivo signs webhooks over the exact URL it requested. Behind a rewriting
  // proxy that URL cannot always be reconstructed, so this can be turned off.
  plivoValidateSignature: bool(env.PLIVO_VALIDATE_SIGNATURE, true),

  // ---- Deployment --------------------------------------------------------
  publicBaseUrl: (env.PUBLIC_BASE_URL ?? '').replace(/\/$/, ''),
  dataDir: env.DATA_DIR ? resolve(env.DATA_DIR) : join(ROOT, 'data'),
  dashboardPassword: env.DASHBOARD_PASSWORD ?? '',

  // ---- Dialer ------------------------------------------------------------
  maxConcurrentCalls: int(env.MAX_CONCURRENT_CALLS, 5),
  dialerTickMs: int(env.DIALER_TICK_MS, 3000),
  ringTimeoutSeconds: int(env.RING_TIMEOUT_SECONDS, 30),
  defaultCountryCode: env.DEFAULT_COUNTRY_CODE ?? '91',
  defaultTimezone: env.DEFAULT_TIMEZONE ?? 'Asia/Kolkata',

  brand: env.BRAND_NAME ?? 'RNS',
};

export const plivoReady = Boolean(
  config.plivoAuthId && config.plivoAuthToken && config.plivoNumber && config.publicBaseUrl,
);

export const xaiReady = Boolean(config.xaiApiKey);

/** wss:// origin for this deployment, derived from PUBLIC_BASE_URL. */
export function wsOrigin() {
  return config.publicBaseUrl.replace(/^http/, 'ws');
}

/**
 * Startup problems worth showing on the dashboard rather than only in a log
 * file the user may never open on shared hosting.
 */
export function configWarnings() {
  const warnings = [];

  // A leftover placeholder is worse than a blank: it looks configured and
  // fails only when a call is already in flight.
  for (const [name, value] of [
    ['XAI_API_KEY', config.xaiApiKey],
    ['PLIVO_AUTH_ID', config.plivoAuthId],
    ['PLIVO_AUTH_TOKEN', config.plivoAuthToken],
  ]) {
    if (value && value.includes('REPLACE_ME')) {
      warnings.push(
        `${name} still contains "REPLACE_ME". Replace the whole value, do not paste alongside it.`,
      );
    }
  }

  if (!config.xaiApiKey) {
    warnings.push('XAI_API_KEY is not set — the agent cannot connect.');
  } else if (!config.xaiApiKey.startsWith('xai-')) {
    warnings.push(
      'XAI_API_KEY does not start with "xai-". You may have copied the key ID from the xAI console instead of the key itself.',
    );
  }
  if (!config.xaiAgentId) warnings.push('XAI_AGENT_ID is not set — falling back to a bare model session.');
  if (!config.plivoAuthId || !config.plivoAuthToken) warnings.push('Plivo credentials are missing — no calls can be placed.');
  if (!config.plivoNumber) warnings.push('PLIVO_PHONE_NUMBER is not set — there is no caller ID to dial from.');
  if (!config.publicBaseUrl) {
    warnings.push('PUBLIC_BASE_URL is not set — Plivo cannot reach this server for call audio.');
  } else if (!config.publicBaseUrl.startsWith('https://')) {
    warnings.push('PUBLIC_BASE_URL must be https:// — Plivo refuses to stream audio to an insecure origin.');
  }
  if (!config.dashboardPassword) warnings.push('DASHBOARD_PASSWORD is not set — anyone who finds this URL can place calls.');

  // An override set here beats the xAI console for every call, and the console
  // still displays its own value, so the two disagree with nothing to say why.
  // Anyone debugging "the agent ignores my settings" needs to see this.
  for (const [name, value] of [
    ['VAD_SILENCE_MS', config.vadSilenceMs],
    ['VAD_THRESHOLD', config.vadThreshold],
    ['AGENT_SPEED', config.agentSpeed],
    ['XAI_REASONING_EFFORT', config.xaiReasoningEffort],
  ]) {
    if (value !== null) {
      warnings.push(
        `${name} is set to ${value}, which overrides the xAI console for every call. Clear it to let the agent's own configuration decide.`,
      );
    }
  }
  return warnings;
}
