import crypto from 'node:crypto';
import { config, plivoReady } from '../config.js';
import { log } from '../logger.js';
import { forPlivo } from '../util/phone.js';

const API = 'https://api.plivo.com/v1';

function authHeader() {
  return `Basic ${Buffer.from(`${config.plivoAuthId}:${config.plivoAuthToken}`).toString('base64')}`;
}

export function requirePlivo() {
  if (!plivoReady) {
    throw new Error(
      'Plivo is not configured. Set PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN, PLIVO_PHONE_NUMBER and PUBLIC_BASE_URL.',
    );
  }
}

async function request(method, path, body) {
  requirePlivo();
  const res = await fetch(`${API}/Account/${config.plivoAuthId}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!res.ok) {
    const detail = payload?.error ?? payload?.message ?? text ?? res.statusText;
    throw new Error(`Plivo ${method} ${path} failed (${res.status}): ${detail}`);
  }
  return payload;
}

// ---------------------------------------------------------------------------
// Outbound calls
// ---------------------------------------------------------------------------

/**
 * Places one outbound call.
 *
 * `callId` is our own record id; it rides along in the answer and hangup URLs
 * so every webhook can be matched back without depending on Plivo's own ids,
 * which arrive at different times (request_uuid immediately, call_uuid later).
 */
export async function placeCall({ to, from, callId, ringTimeout, detectMachine }) {
  const base = config.publicBaseUrl;
  const token = signCallToken(callId);
  const query = `callId=${encodeURIComponent(callId)}&token=${encodeURIComponent(token)}`;

  const body = {
    from: forPlivo(from),
    to: forPlivo(to),
    answer_url: `${base}/plivo/answer?${query}`,
    answer_method: 'POST',
    hangup_url: `${base}/plivo/hangup?${query}`,
    hangup_method: 'POST',
    ring_timeout: ringTimeout ?? 30,
  };

  if (detectMachine) {
    // Plivo ends the call itself the moment it decides a machine answered, so
    // the agent never talks to a voicemail greeting.
    body.machine_detection = 'hangup';
    body.machine_detection_time = 5000;
  }

  const result = await request('POST', '/Call/', body);
  log.info({ callId, requestUuid: result?.request_uuid }, 'outbound call fired');
  return { requestUuid: result?.request_uuid ?? null, apiId: result?.api_id ?? null };
}

export async function hangupCall(callUuid) {
  if (!callUuid) return;
  try {
    await request('DELETE', `/Call/${callUuid}/`);
  } catch (err) {
    // A call that already ended returns 404; that is the expected outcome here.
    log.debug({ err, callUuid }, 'hangup returned an error (call had likely ended)');
  }
}

export async function getCall(callUuid) {
  return request('GET', `/Call/${callUuid}/`);
}

// ---------------------------------------------------------------------------
// Account and numbers
// ---------------------------------------------------------------------------

export async function listNumbers() {
  const result = await request('GET', '/Number/?limit=20');
  return (result?.objects ?? []).map((n) => ({
    number: n.number,
    alias: n.alias ?? null,
    application: n.application ?? null,
    type: n.number_type ?? null,
    region: n.region ?? null,
  }));
}

/** Confirms the credentials work and reports the balance for the dashboard. */
export async function accountInfo() {
  const result = await request('GET', '/');
  return {
    name: result?.name ?? null,
    balance: result?.cash_credits ?? null,
    currency: result?.currency ?? null,
    accountType: result?.account_type ?? null,
  };
}

// ---------------------------------------------------------------------------
// Call-scoped tokens
// ---------------------------------------------------------------------------

/**
 * Plivo does not sign the WebSocket upgrade for an AudioStream, and the answer
 * URL is a public endpoint. Each call therefore carries a short HMAC over its
 * id, so a stranger who guesses the URL cannot open a billable xAI session.
 */
function tokenSecret() {
  return config.plivoAuthToken || config.xaiApiKey || 'insecure-development-secret';
}

export function signCallToken(callId) {
  return crypto.createHmac('sha256', tokenSecret()).update(String(callId)).digest('base64url');
}

export function verifyCallToken(callId, token) {
  const expected = Buffer.from(signCallToken(callId));
  const supplied = Buffer.from(String(token ?? ''));
  return expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied);
}

// ---------------------------------------------------------------------------
// Webhook signature validation
// ---------------------------------------------------------------------------

/**
 * Plivo signature V3.
 *
 * The signature covers the request URL with, for POST, every form field
 * appended in sorted key order, followed by the nonce. The URL must be the one
 * Plivo actually called, which is why it is rebuilt from PUBLIC_BASE_URL rather
 * than from a proxied Host header.
 */
export function validatePlivoSignature(req) {
  if (!config.plivoValidateSignature) return true;
  if (!config.plivoAuthToken || !config.publicBaseUrl) return false;

  const signature = req.header('X-Plivo-Signature-V3');
  const nonce = req.header('X-Plivo-Signature-V3-Nonce');
  if (!signature || !nonce) return false;

  let uri = `${config.publicBaseUrl}${req.originalUrl}`;
  if (req.method === 'POST') {
    // Query string is not part of the signed payload for POST.
    uri = uri.split('?')[0];
    const params = req.body ?? {};
    for (const key of Object.keys(params).sort()) {
      uri += key + params[key];
    }
  }

  const expected = crypto
    .createHmac('sha256', config.plivoAuthToken)
    .update(uri + nonce)
    .digest('base64');

  // Plivo may send several comma-separated signatures during key rotation.
  const candidates = String(signature).split(',').map((s) => s.trim());
  const ok = candidates.some((candidate) => {
    const a = Buffer.from(candidate);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });

  if (!ok) log.warn({ url: req.originalUrl }, 'rejected a webhook with an invalid Plivo signature');
  return ok;
}
