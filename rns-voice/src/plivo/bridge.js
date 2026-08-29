import { log } from '../logger.js';
import { events } from '../util/events.js';
import { config } from '../config.js';
import { XaiSession } from '../xai/realtime.js';
import { calls, campaigns, dnc, leads } from '../store.js';
import { hangupCall, transferCall, verifyCallToken } from './client.js';

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

/** Name of the checkpoint queued behind the agent's closing words. */
const HANGUP_CHECKPOINT = 'rns-goodbye';

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
    callControl: config.agentCallControl,
    transferTo: config.transferNumber || undefined,
  });

  // Audio produced before the phone leg exists has nowhere to go, so it is
  // held here and played the instant the stream attaches.
  const buffered = [];
  const bufferAudio = (chunk) => buffered.push(chunk);
  session.on('audio', bufferAudio);

  session.on('open', () => {
    const context = record ? describeCall(record, lead) : null;
    if (context) session.sendContext(context);

    // Generating the greeting is the slowest step and does not depend on the
    // phone leg, so it runs while Plivo is still opening the stream. The call
    // has already been answered by this point, so nothing is wasted.
    if (config.prewarmGreeting) {
      entry.greeted = true;
      if (campaign?.opener) session.forceMessage(campaign.opener);
      else session.createResponse();
    }
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

  const entry = { session, expiry, buffered, bufferAudio, greeted: false };
  prewarmed.set(callId, entry);
  session.connect();
  log.debug({ callId }, 'prewarming xAI session');
}

/**
 * Hands over a prewarmed session together with any audio it produced while
 * waiting. Returns null if there is none, or if the one waiting has died —
 * a dead session is worse than no session.
 */
function claimPrewarmed(callId) {
  const entry = prewarmed.get(callId);
  if (!entry) return null;
  clearTimeout(entry.expiry);
  prewarmed.delete(callId);
  if (entry.session.closed) return null;
  // Stop buffering; from here the bridge streams audio straight to Plivo.
  entry.session.off('audio', entry.bufferAudio);
  return entry;
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
    // Send each 20 ms frame the moment it is ready. Nagle's algorithm is on by
    // default and holds a small packet back waiting either for more data or
    // for the previous packet's ACK — up to a round trip of added delay on
    // every frame we play to the caller. The xAI leg already does this; this
    // is the leg the caller actually hears.
    ws._socket?.setNoDelay?.(true);
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
    /** Set once the agent has asked to hang up; cleared when it happens. */
    this.pendingHangup = null;

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

      // Plivo's answer to a checkpoint we queued: everything before it has
      // now been heard. It is the only honest signal that the goodbye is out.
      case 'playedStream':
        if (this.pendingHangup && message.name === HANGUP_CHECKPOINT) {
          this.completeHangup('agent finished speaking');
        }
        break;

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

    const lead = record.leadId ? leads.get(record.leadId) : null;
    const opener = campaign?.opener ?? null;

    // A session opened at the answer webhook is already connected, briefed,
    // and may have the greeting waiting.
    const ready = claimPrewarmed(callId);

    // Only pass overrides the campaign explicitly sets — anything left null
    // keeps whatever the agent was configured with in the xAI console.
    this.session = ready?.session ?? new XaiSession({
      profile: 'telephony',
      label: callId,
      agentId: campaign?.agentId || undefined,
      instructions: campaign?.instructions || undefined,
      voice: campaign?.voice || undefined,
      detailsTool: config.agentDetailsTool,
      callControl: config.agentCallControl,
      transferTo: config.transferNumber || undefined,
    });

    this.wire(this.session, opener, record.direction, record, lead, Boolean(ready));

    if (ready) {
      // Play what the agent already said while the stream was still opening.
      // Nothing can arrive between claiming and wiring — that runs without
      // yielding — so ordering holds.
      for (const chunk of ready.buffered) this.playAudio(chunk);
      if (ready.buffered.length) {
        log.info({ callId, frames: ready.buffered.length }, 'greeting was ready before the caller was');
      }
      // If it had not opened yet, its own handler still owes the greeting;
      // asking again here would produce two.
      if (!ready.greeted) this.startConversation(this.session, opener, record.direction);
    } else {
      this.session.connect();
    }

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

    // The agent has finished the turn it was speaking, so anything queued for
    // playback is now complete and the checkpoint can go behind it.
    session.on('response_done', () => {
      if (this.pendingHangup) this.armHangupCheckpoint();
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

      if (name === 'end_call') {
        // Answer the tool first, so the agent can finish its sentence; the
        // hangup is scheduled behind whatever it is still saying.
        session.submitFunctionResult(toolCallId, { ending: true });
        this.requestHangup(args.reason ?? 'completed');
        return;
      }

      if (name === 'transfer_to_human') {
        if (!config.transferNumber) {
          session.submitFunctionResult(toolCallId, {
            error: 'No transfer number is configured, so this call cannot be transferred.',
          });
          return;
        }
        session.submitFunctionResult(toolCallId, { transferring: true });
        this.requestTransfer(args.reason ?? 'caller asked for a person');
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

    session.on('close', () => {
      // When the agent has asked to hang up it often closes its own socket
      // straight after, and tearing down here would cut the phone leg before
      // the goodbye has finished playing out of Plivo's buffer. In that case
      // the hangup sequence owns the ending: it is already waiting on the
      // checkpoint, with a timer behind it, so nothing can hang.
      if (this.pendingHangup && !this.pendingHangup.done) {
        this.armHangupCheckpoint();
        return;
      }
      // Otherwise xAI dropped out unexpectedly; end the leg rather than
      // leave the caller listening to dead air.
      this.teardown('xAI session closed');
    });
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

  /**
   * Begins ending the call at the agent's request.
   *
   * Hanging up here would cut the goodbye off mid-word, so nothing happens
   * until the agent has finished the turn it is in. Once it has, a checkpoint
   * is queued behind that audio and Plivo tells us when it has played.
   */
  requestHangup(reason) {
    if (this.pendingHangup) return;
    this.pendingHangup = { reason, action: 'hangup' };
    log.info({ callId: this.callId, reason }, 'agent asked to end the call');
    calls.saveDetails(this.callId, { endedByAgent: true, endReason: reason });

    // A caller who asks not to be called again should not be called again,
    // and that has to hold whatever the campaign says.
    if (reason === 'do_not_call') {
      const record = calls.get(this.callId);
      if (record?.toNumber) {
        dnc.add(record.toNumber, 'asked the agent not to be called again');
        log.info({ callId: this.callId }, 'number added to the opt-out list at the caller request');
      }
    }
  }

  requestTransfer(reason) {
    if (this.pendingHangup) return;
    this.pendingHangup = { reason, action: 'transfer' };
    log.info({ callId: this.callId, reason }, 'agent asked to transfer the call');
    calls.saveDetails(this.callId, { transferRequested: true, transferReason: reason });
  }

  /** Queues a marker behind the agent's last words and waits for it to play. */
  armHangupCheckpoint() {
    if (!this.pendingHangup || this.pendingHangup.armed) return;
    this.pendingHangup.armed = true;

    if (this.ws.readyState === this.ws.OPEN) {
      this.ws.send(JSON.stringify({ event: 'checkpoint', name: HANGUP_CHECKPOINT }));
    }

    // Plivo may never send the confirmation — a dropped socket, an older
    // protocol revision. Waiting forever would leave the line open and
    // billing, so fall back to a timer.
    this.pendingHangup.timer = setTimeout(
      () => this.completeHangup('checkpoint not confirmed; ending anyway'),
      config.hangupGraceMs,
    );
    this.pendingHangup.timer.unref?.();
  }

  completeHangup(why) {
    const pending = this.pendingHangup;
    if (!pending || pending.done) return;
    pending.done = true;
    clearTimeout(pending.timer);

    const record = calls.get(this.callId);
    if (pending.action === 'transfer' && record?.callUuid) {
      log.info({ callId: this.callId, why }, 'transferring to a person');
      void transferCall(record.callUuid, this.callId).catch((err) =>
        log.error({ err, callId: this.callId }, 'transfer failed'),
      );
      // Plivo takes the call over from here; release our side of the audio.
      this.teardown('transferred');
      return;
    }

    log.info({ callId: this.callId, why }, 'ending the call at the agent request');
    if (record?.callUuid) void hangupCall(record.callUuid);
    this.teardown(`agent ended the call (${pending.reason})`);
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
 * The facts about this call, and nothing else.
 *
 * This used to carry instructions as well — how to handle language, when to
 * call which tool, not to mention the note. Those were rules of ours competing
 * with the prompt configured on the agent in the xAI console, written in
 * English, ahead of the caller's first word. The agent's own configuration
 * decides how it behaves; this supplies only what it has no other way to know,
 * which is who was dialled.
 *
 * Written as data rather than prose so it reads as a record and not as an
 * instruction. Keep it that way: anything resembling "you should" belongs in
 * the xAI console, not here.
 */
function describeCall(record, lead) {
  if (config.agentBriefing === 'off') return null;

  const facts = [`number: ${record.toNumber}`];
  if (lead?.name) facts.push(`name: ${lead.name}`);
  for (const [key, value] of Object.entries(lead?.attributes ?? {})) {
    facts.push(`${key}: ${value}`);
  }
  return `[call details — ${facts.join('; ')}]`;
}

export function handlePlivoStream(ws, req) {
  new PlivoBridge(ws, req);
}
