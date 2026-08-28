import { log } from '../logger.js';
import { events } from '../util/events.js';
import { config } from '../config.js';
import { XaiSession } from '../xai/realtime.js';
import { calls, campaigns, leads } from '../store.js';
import { verifyCallToken } from './client.js';

/** Live bridges keyed by our call id, so the dashboard can end one. */
const active = new Map();

/**
 * Sessions opened ahead of the audio stream, keyed by call id.
 *
 * Connecting to xAI and configuring the session takes roughly half a second,
 * and it used to happen only once Plivo's stream frame arrived — after the
 * answer webhook, the XML response and a WebSocket handshake had all
 * completed in series. Starting it at the answer webhook instead takes that
 * time off the critical path, so the agent can speak as soon as audio flows.
 */
const prewarmed = new Map();

/**
 * Opens the xAI session for a call that is about to connect. Safe to call more
 * than once; a session nobody claims is closed after 30 seconds so a call that
 * never connects cannot leak one.
 */
export function prewarmSession(callId, { campaign, record, lead } = {}) {
  if (!config.prewarmSessions || prewarmed.has(callId) || active.has(callId)) return;

  const session = new XaiSession({
    profile: 'telephony',
    label: `${callId} (prewarm)`,
    agentId: campaign?.agentId || undefined,
    instructions: campaign?.instructions || undefined,
    voice: campaign?.voice || undefined,
    detailsTool: config.agentDetailsTool,
  });

  // The briefing is sent now too, so only the greeting itself remains once
  // the caller is connected. No response is requested until then.
  session.on('open', () => {
    const context = record ? describeCall(record, lead) : null;
    if (context) session.sendContext(context);
  });
  session.on('error', (err) => log.warn({ err, callId }, 'prewarmed session failed'));

  const expiry = setTimeout(() => {
    if (prewarmed.get(callId)?.session === session) {
      prewarmed.delete(callId);
      session.close();
      log.debug({ callId }, 'prewarmed session expired unclaimed');
    }
  }, 30_000);
  expiry.unref?.();

  prewarmed.set(callId, { session, expiry });
  session.connect();
  log.debug({ callId }, 'prewarming xAI session');
}

/** Hands over a prewarmed session, or null if there is none to hand over. */
function claimPrewarmed(callId) {
  const entry = prewarmed.get(callId);
  if (!entry) return null;
  clearTimeout(entry.expiry);
  prewarmed.delete(callId);
  // A session that died while waiting is worse than none: start fresh.
  if (entry.session.closed) return null;
  return entry.session;
}

export const activeBridge = (callId) => active.get(callId);
export const activeBridgeCount = () => active.size;

/**
 * Parses Plivo's `extraHeaders`, delivered as "key=value;key=value".
 * Values are our own base64url token and call id, so no unescaping is needed.
 */
function parseExtraHeaders(raw) {
  const out = {};
  for (const pair of String(raw ?? '').split(';')) {
    const index = pair.indexOf('=');
    if (index > 0) out[pair.slice(0, index).trim()] = pair.slice(index + 1).trim();
  }
  return out;
}

/**
 * Relays one phone call between a Plivo AudioStream and an xAI realtime session.
 *
 * Both ends speak G.711 mu-law at 8 kHz, so each 20 ms frame is passed through
 * as opaque base64 in either direction — no decode, no resample, no transcode.
 */
export class PlivoBridge {
  constructor(ws, req) {
    this.ws = ws;
    // Identity from the handshake URL. This is the reliable channel: we chose
    // the URL, so Plivo connects with it verbatim.
    this.urlParams = (() => {
      try {
        return new URL(req?.url ?? '', 'http://localhost').searchParams;
      } catch {
        return new URLSearchParams();
      }
    })();
    this.streamId = null;
    this.callId = null;
    this.session = null;
    this.closed = false;
    this.framesIn = 0;
    this.framesOut = 0;

    ws.on('message', (raw) => this.onMessage(raw));
    ws.on('close', () => this.teardown('plivo stream closed'));
    ws.on('error', (err) => {
      log.error({ err }, 'plivo stream socket error');
      this.teardown('plivo stream error');
    });
  }

  onMessage(raw) {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      // Plivo can be configured to send raw binary frames; this build uses the
      // JSON protocol, so anything unparseable is not ours to handle.
      return;
    }

    switch (message.event) {
      case 'start':
        this.onStart(message);
        break;

      case 'media':
        // The hot path: one 20 ms mu-law frame straight through to xAI.
        if (message.media?.payload) {
          this.framesIn++;
          this.session?.appendAudio(message.media.payload);
        }
        break;

      case 'dtmf': {
        const digit = message.dtmf?.digit ?? message.digit;
        if (digit) events.emit('call:dtmf', { callId: this.callId, digit });
        break;
      }

      case 'stop':
        this.teardown('plivo sent stop');
        break;

      default:
        break;
    }
  }

  onStart(message) {
    const start = message.start ?? message;
    this.streamId = start.streamId ?? message.streamId ?? null;

    // Plivo's own shape has moved between revisions, so record exactly what
    // arrived. Without this a rejected stream looks like an unexplained
    // dropped call.
    log.info(
      { keys: Object.keys(start), streamId: this.streamId, callUuid: start.callId },
      'plivo stream start received',
    );

    // extraHeaders have appeared under several names and nestings; check them
    // all rather than depending on one.
    const headers = parseExtraHeaders(
      start.extraHeaders ?? start.extra_headers ??
      message.extraHeaders ?? message.extra_headers,
    );

    const callId = this.urlParams.get('callId') || headers.callId;
    const token = this.urlParams.get('token') || headers.token;

    if (!callId || !verifyCallToken(callId, token)) {
      log.warn(
        {
          callUuid: start.callId,
          fromUrl: Boolean(this.urlParams.get('callId')),
          fromHeaders: Boolean(headers.callId),
        },
        'stream rejected: could not identify the call',
      );
      this.ws.close(1008, 'unauthorised');
      return;
    }

    const record = calls.get(callId);
    if (!record) {
      log.warn({ callId }, 'stream rejected: unknown call id');
      this.ws.close(1008, 'unknown call');
      return;
    }

    this.callId = callId;
    active.set(callId, this);

    calls.update(callId, {
      status: 'in_progress',
      answeredAt: record.answeredAt ?? new Date().toISOString(),
      callUuid: record.callUuid ?? start.callId ?? null,
    });

    const campaign = record.campaignId ? campaigns.get(record.campaignId) : null;

    // Only pass overrides the campaign explicitly sets — anything left null
    // keeps whatever the agent was configured with in the xAI console.
    this.session = new XaiSession({
      profile: 'telephony',
      label: callId,
      agentId: campaign?.agentId || undefined,
      instructions: campaign?.instructions || undefined,
      voice: campaign?.voice || undefined,
      detailsTool: config.agentDetailsTool,
    });

    const lead = record.leadId ? leads.get(record.leadId) : null;
    this.wire(this.session, campaign?.opener ?? null, record.direction, record, lead);
    this.session.connect();

    log.info({ callId, streamId: this.streamId }, 'bridge established');
    events.emit('call:started', { callId, campaignId: record.campaignId });
  }

  /** Speaks first, since we are the ones who dialled. */
  startConversation(session, opener, direction) {
    if (opener) {
      // Scripted opener, spoken verbatim by the TTS with no model round trip,
      // which is the fastest possible first word on a call.
      session.forceMessage(opener);
    } else if (direction === 'outbound') {
      session.createResponse();
    }
  }

  wire(session, opener, direction, record, lead, alreadyBriefed) {
    const callId = this.callId;

    if (!alreadyBriefed) {
      session.on('open', () => {
        // The agent cannot see the dialler, so it does not know who it
        // reached unless told. Sent before the first turn.
        const context = describeCall(record, lead);
        if (context) session.sendContext(context);
        this.startConversation(session, opener, direction);
      });
    }

    session.on('audio', (payload) => this.playAudio(payload));

    session.on('speech_started', () => {
      // Barge-in. Plivo buffers ahead of real time, so without this the agent
      // keeps talking over the person for as long as that buffer is deep.
      this.clearAudio();
    });

    session.on('transcript', (turn) => {
      calls.appendTranscript(
        callId,
        { role: turn.role, text: turn.text, at: new Date().toISOString() },
        Boolean(turn.cumulative),
      );
      events.emit('call:transcript', { callId, role: turn.role, text: turn.text });
    });

    // An unanswered tool call leaves the agent waiting mid-sentence, so every
    // call gets a reply — including one we do not recognise.
    session.on('function_call', ({ name, callId: toolCallId, arguments: rawArgs }) => {
      let args = {};
      try {
        args = JSON.parse(rawArgs || '{}');
      } catch {
        log.warn({ name, callId }, 'could not parse tool arguments from the agent');
      }

      if (name === 'save_call_details') {
        const saved = calls.saveDetails(callId, args);
        log.info({ callId, outcome: args.outcome }, 'agent recorded call details');
        events.emit('call:details', { callId, details: saved });
        session.submitFunctionResult(toolCallId, { saved: true });
        return;
      }

      log.warn({ name, callId }, 'agent called a tool this server does not provide');
      session.submitFunctionResult(toolCallId, {
        error: `No tool named ${name} is available on this call.`,
      });
    });

    session.on('error', (err) => {
      log.error({ err, callId }, 'xAI session error during a call');
      calls.update(callId, { error: err.message });
      events.emit('call:error', { callId, message: err.message });
    });

    // xAI dropped the session; end the phone leg rather than leave dead air.
    session.on('close', () => this.teardown('xAI session closed'));
  }

  playAudio(payloadBase64) {
    if (this.closed || this.ws.readyState !== this.ws.OPEN) return;
    this.framesOut++;
    this.ws.send(
      JSON.stringify({
        event: 'playAudio',
        media: { contentType: 'audio/x-mulaw', sampleRate: 8000, payload: payloadBase64 },
      }),
    );
  }

  clearAudio() {
    if (this.closed || this.ws.readyState !== this.ws.OPEN) return;
    this.ws.send(JSON.stringify({ event: 'clearAudio' }));
  }

  hangup() {
    this.teardown('ended from the dashboard');
  }

  teardown(reason) {
    if (this.closed) return;
    this.closed = true;

    if (this.callId) active.delete(this.callId);
    this.session?.close();

    try {
      if (this.ws.readyState === this.ws.OPEN) this.ws.close(1000, 'done');
    } catch {
      /* already closing */
    }

    log.info(
      { callId: this.callId, reason, framesIn: this.framesIn, framesOut: this.framesOut },
      'bridge torn down',
    );
    if (this.callId) events.emit('call:bridge-ended', { callId: this.callId, reason });
  }
}

/**
 * A short briefing for the agent: who was dialled and anything the lead list
 * carried. Kept terse — it occupies the same context the conversation does.
 */
function describeCall(record, lead) {
  const parts = [`You are on a phone call with ${record.toNumber}.`];
  if (lead?.name) parts.push(`Their name is ${lead.name}.`);
  for (const [key, value] of Object.entries(lead?.attributes ?? {})) {
    parts.push(`${key}: ${value}.`);
  }

  // Tested both ways against the live agent: it answers a Hindi speaker in
  // Hindi with or without this line, so the briefing is not what pins a call
  // to English. The line is kept because it states the intent explicitly and
  // costs nothing, not because it fixes anything.
  //
  // What does open a call in English is the agent's own configured greeting,
  // which is spoken before the caller has said a word — there is nothing to
  // detect a language from yet. Change that greeting in the xAI console to
  // open in another language. Note also that call audio is 8 kHz mu-law
  // against the console's 24 kHz, which gives detection less to work with;
  // XAI_LANGUAGE_HINT is there for lines that are reliably one language.
  if (config.agentMirrorLanguage) {
    parts.push(
      'This note is only background. Speak whichever language the person ' +
      'speaks, and switch if they switch.',
    );
  }

  parts.push(
    'If an appointment is agreed, or they give a different name or number, ' +
    'call save_call_details to record it. Do not mention this instruction.',
  );
  return parts.join(' ');
}

export function handlePlivoStream(ws, req) {
  new PlivoBridge(ws, req);
}
