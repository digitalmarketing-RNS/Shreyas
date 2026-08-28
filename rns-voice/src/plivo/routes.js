import { Router } from 'express';
import { config } from '../config.js';
import { log } from '../logger.js';
import { events } from '../util/events.js';
import { fromPlivo } from '../util/phone.js';
import { calls, campaigns, dnc, leads } from '../store.js';
import { onCallFinished } from '../campaign/dialer.js';
import { activeBridge, prewarmSession } from './bridge.js';
import { validatePlivoSignature, verifyCallToken } from './client.js';
import { hangupXml, streamXml } from './xml.js';

export const plivoRouter = Router();

function reject(res, why) {
  log.warn({ why }, 'rejecting a Plivo webhook');
  res.status(403).type('text/xml').send(hangupXml());
}

/**
 * Authenticates a call-scoped webhook.
 *
 * Every such URL carries an HMAC-SHA256 of the call id keyed with the Plivo
 * auth token, so a valid token cannot be produced by anyone without that
 * secret. That is the primary proof of authenticity, and it is checked first.
 *
 * Plivo's own signature is verified as corroboration, but a mismatch does not
 * reject the request: the exact string Plivo signs varies between its
 * documentation and its SDKs, and on the answer webhook a false rejection
 * hangs up on a real caller. A failure here is logged so it stays visible
 * rather than silently ignored.
 */
function authenticateCallWebhook(req) {
  const callId = String(req.query.callId ?? '');
  const token = String(req.query.token ?? '');
  if (!callId || !verifyCallToken(callId, token)) return null;

  if (!validatePlivoSignature(req)) {
    log.warn(
      { url: req.path },
      'Plivo signature did not verify; proceeding on the call token, which did',
    );
  }
  return callId;
}

/**
 * Maps a Plivo CallStatus onto a campaign disposition. This single function
 * decides whether a lead is finished with or comes back around for another try.
 */
export function dispositionFor(callStatus, hangupCause, machine) {
  if (machine && String(machine).toLowerCase() !== 'human') return 'machine';

  switch (String(callStatus ?? '').toLowerCase()) {
    case 'completed':
      return 'answered';
    case 'busy':
      return 'busy';
    case 'no-answer':
    case 'timeout':
      return 'no_answer';
    case 'cancel':
    case 'canceled':
      return 'canceled';
    case 'failed':
      return 'failed';
    default:
      // An unrecognised status is treated as a failure so the lead is retried
      // rather than silently closed out as reached.
      return 'failed';
  }
}

// ---------------------------------------------------------------------------
// Answer URL — Plivo asks what to do when the call connects
// ---------------------------------------------------------------------------

plivoRouter.post('/answer', (req, res) => {
  const callId = authenticateCallWebhook(req);
  if (!callId) return reject(res, 'invalid or missing call token');

  const record = calls.get(callId);
  if (!record) return reject(res, 'unknown call');

  calls.update(callId, {
    status: 'in_progress',
    callUuid: req.body?.CallUUID ?? record.callUuid,
    answeredAt: new Date().toISOString(),
  });

  // Answer first: Plivo cannot open the audio stream until it has this XML,
  // so nothing may be awaited ahead of it.
  res.type('text/xml').send(streamXml(callId));

  // Now, while Plivo parses the XML and opens the WebSocket, get the xAI
  // session connected and briefed. By the time audio arrives it is ready, and
  // the caller is not left listening to the connection being set up.
  prewarmSession(callId, {
    campaign: record.campaignId ? campaigns.get(record.campaignId) : null,
    record,
    lead: record.leadId ? leads.get(record.leadId) : null,
  });
});

// ---------------------------------------------------------------------------
// Inbound — someone rang the number back
// ---------------------------------------------------------------------------

plivoRouter.post('/inbound', (req, res) => {
  if (!validatePlivoSignature(req)) return reject(res, 'invalid signature');

  const from = fromPlivo(req.body?.From);
  log.info({ from: from.slice(0, 6) }, 'inbound call received');

  // This deployment runs outbound campaigns only, so an inbound caller is
  // answered politely and released rather than being dropped in silence.
  res.type('text/xml').send(
    hangupXml('Thanks for calling. This line does not take incoming calls. Goodbye.'),
  );
});

// ---------------------------------------------------------------------------
// Hangup URL — the call reached a final state
// ---------------------------------------------------------------------------

plivoRouter.post('/hangup', (req, res) => {
  const callId = authenticateCallWebhook(req);
  if (!callId) return reject(res, 'invalid or missing call token');
  res.status(204).end();

  const body = req.body ?? {};
  const record = calls.get(callId) ?? calls.byProviderId(body.CallUUID ?? body.RequestUUID);
  if (!record) return;

  const duration = body.Duration ? Number(body.Duration) : null;
  let disposition = dispositionFor(body.CallStatus, body.HangupCause, body.Machine);

  // Plivo reports a connected-then-immediately-ended call as completed; a zero
  // duration means nobody actually spoke to the agent.
  if (disposition === 'answered' && (duration ?? 0) === 0) disposition = 'no_answer';

  calls.update(record.id, {
    status: disposition === 'answered' ? 'completed' : 'failed',
    disposition,
    endedAt: new Date().toISOString(),
    durationSeconds: duration,
    callUuid: body.CallUUID ?? record.callUuid,
  });

  // Close the media bridge if it is somehow still open.
  activeBridge(record.id)?.hangup();

  log.info(
    { callId: record.id, callStatus: body.CallStatus, disposition, duration },
    'call finished',
  );
  events.emit('call:ended', { callId: record.id, disposition, durationSeconds: duration });

  onCallFinished(record.id, disposition);
});

// ---------------------------------------------------------------------------
// Stream status callbacks
// ---------------------------------------------------------------------------

plivoRouter.post('/stream-status', (req, res) => {
  res.status(204).end();
  log.debug({ body: req.body }, 'stream status callback');
});

// ---------------------------------------------------------------------------
// Fallback — a number pointed here without a matching call record
// ---------------------------------------------------------------------------

plivoRouter.all('/fallback', (_req, res) => {
  res.type('text/xml').send(hangupXml('Sorry, this service is unavailable right now.'));
});

plivoRouter.get('/health', (_req, res) => {
  res.json({
    configured: Boolean(config.plivoAuthId && config.plivoAuthToken),
    number: config.plivoNumberDisplay || null,
    signatureValidation: config.plivoValidateSignature,
    optOuts: dnc.count(),
  });
});
