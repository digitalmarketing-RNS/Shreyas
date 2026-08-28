import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function bool(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return /^(1|true|yes|on)$/i.test(String(value));
}

function int(value, fallback) {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
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
  return warnings;
}
