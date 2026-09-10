import { log } from '../logger.js';
import { events } from '../util/events.js';
import { config } from '../config.js';
import { XaiSession } from '../xai/realtime.js';
import { calls, dnc, leads } from '../store.js';
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

/** A path segment that is not valid percent-encoding must not crash the bridge. */
function safeDecode(value) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Name of the checkpoint queued behind the agent's closing words. */
const HANGUP_CHECKPOINT = 'rns-goodbye';

/**
 * Opens the xAI session for a call that is about to connect. Safe to call more
 * than once; a session nobody claims is closed after 30 seconds so a call that
 * never connects cannot leak one.
 */
export function prewarmSession(callId, { record, lead } = {}) {
  if (!config.prewarmSessions || prewarmed.has(callId) || active.has(callId)) return;

  const session = new XaiSession({
    profile: 'telephony',
    label: `${callId} (prewarm)`,
    detailsTool: config.agentDetailsTool,
    callControl: config.agentCallControl,
    transferTo: config.transferNumber || undefined,
  });

  // The session is opened while the phone is still ringing, so the handshake
  // and the agent composing its opening line — measured at 480 ms and 571 ms
  // against the live agent — both finish before anyone picks up.
  //
  // The agent does not know it is talking to a ringing phone, though. It says
  // its opening line, gets no reply, and after a while tries again: "are you
  // still there?". Buffering that too would play the whole pile-up at once
  // the moment somebody says hello.
  //
  // The opening line is buffered and played the instant the stream attaches.
  //
  // If the agent goes further than that, this session is thrown away. It will
  // have asked something — "do you have any tile requirements?" — into a phone
  // that was still ringing, and xAI refuses conversation.item.delete on those
  // items ("Item not found"), so it cannot be taken back. Playing it would
  // dump two utterances at once; dropping it silently is worse still, because
  // the agent then waits on an answer to a question the caller never heard.
  // Measured: after a ring long enough for that, the caller's "hello?" got no
  // reply at all.
  //
  // So a session that has said more than its opening line is not used, and the
  // call gets a fresh one at answer — no faster than before, but never
  // confused. A ring short enough to beat it keeps the full saving.
  const buffered = [];
  let responses = 0;

  const bufferAudio = (chunk) => { if (responses === 0) buffered.push(chunk); };
  const countResponse = () => { responses += 1; };

  session.on('audio', bufferAudio);
  session.on('response_done', countResponse);

  // The only thing sent on open, and only facts: which number was dialled and
  // whatever the lead list carried. No greeting and no response.create — the
  // agent opens the conversation by itself about 1.6 seconds after the
  // session exists, so its first words are composed while Plivo is still
  // opening the audio stream and are waiting in this buffer by the time
  // anyone can hear them.
  session.on('open', () => {
    const facts = callFacts(record, lead);
    if (facts) session.sendCallFacts(facts);
  });
  // A prewarmed session that dies is recoverable — claimPrewarmed refuses a
  // dead one and the bridge builds a fresh session — but the reason still
  // belongs on the call. If the fresh one fails the same way, this is the
  // first place the failure was visible.
  session.on('error', (err) => {
    log.warn({ err, callId }, 'prewarmed session failed');
    calls.update(callId, { error: `Agent session failed before the call connected: ${err.message}` });
  });

  // Long enough to cover a full ring plus the answer handshake, since a
  // session opened at dial time has to survive until somebody picks up. A
  // session that expires early is worse than none: the call answers to
  // silence while a fresh session is built from scratch.
  const expiry = setTimeout(() => {
    if (prewarmed.get(callId)?.session === session) {
      prewarmed.delete(callId);
      session.close();
      log.debug({ callId }, 'prewarmed session expired unclaimed');
    }
  }, (config.ringTimeoutSeconds + 20) * 1000);
  expiry.unref?.();

  const entry = { session, expiry, buffered, bufferAudio, countResponse, spoke: () => responses };
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

  // Said more than its opening line, so its idea of the conversation and the
  // caller's no longer match. A fresh session costs about a second; a
  // mismatched one costs the call.
  if (entry.spoke() > 1) {
    log.info({ callId, utterances: entry.spoke() }, 'discarding a prewarmed session that spoke past its opening line');
    entry.session.close();
    return null;
  }
  // From here there is a person on the line: audio goes straight to Plivo, and
  // what the agent says is a real turn rather than something said to a ringing
  // phone, so none of it is pruned.
  entry.session.off('audio', entry.bufferAudio);
  entry.session.off('response_done', entry.countResponse);
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
    // Identity arrives in the handshake URL. Path segments are the primary
    // form; the query string is still read so a call already ringing when a
    // new build deploys is not dropped mid-flight.
    const { params, path } = (() => {
      try {
        const parsed = new URL(req?.url ?? '', 'http://localhost');
        const segments = parsed.pathname.split('/').filter(Boolean);
        // /plivo/stream/<callId>/<token>
        const after = segments.slice(segments.indexOf('stream') + 1);
        return {
          params: parsed.searchParams,
          path: { callId: safeDecode(after[0]), token: safeDecode(after[1]) },
        };
      } catch {
        return { params: new URLSearchParams(), path: {} };
      }
    })();
    this.urlParams = params;
    this.urlPath = path;
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

    const callId = this.urlPath.callId || this.urlParams.get('callId') || headers.callId;
    const token = this.urlPath.token || this.urlParams.get('token') || headers.token;

    if (!callId || !verifyCallToken(callId, token)) {
      log.warn(
        {
          callUuid: start.callId,
          // Which source produced an id, and whether a token came with it.
          // A call id present with no token is the signature of a URL whose
          // query string did not survive being written into XML.
          fromPath: Boolean(this.urlPath.callId),
          fromQuery: Boolean(this.urlParams.get('callId')),
          fromHeaders: Boolean(headers.callId),
          hadToken: Boolean(token),
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

    // A session opened at the answer webhook is already connected, briefed,
    // and may have the greeting waiting.
    const ready = claimPrewarmed(callId);

    this.session = ready?.session ?? new XaiSession({
      profile: 'telephony',
      label: callId,
      detailsTool: config.agentDetailsTool,
      callControl: config.agentCallControl,
      transferTo: config.transferNumber || undefined,
    });

    const lead = record.leadId ? leads.get(record.leadId) : null;
    this.wire(this.session, record, lead);

    if (ready) {
      // Play what the agent already said while the stream was still opening.
      // Nothing can arrive between claiming and wiring — that runs without
      // yielding — so ordering holds.
      for (const chunk of ready.buffered) this.playAudio(chunk);
      if (ready.buffered.length) {
        log.info({ callId, frames: ready.buffered.length }, 'greeting was ready before the caller was');
      }
    } else {
      this.session.connect();
    }

    log.info({ callId, streamId: this.streamId }, 'bridge established');
    events.emit('call:started', { callId, campaignId: record.campaignId });
  }

  /**
   * Wires a session to the phone leg. Audio, and nothing else.
   *
   * Two things used to happen here and no longer do. A briefing — the dialled
   * number and the lead's fields, injected as a conversation turn — and a
   * response.create to make the agent take the first turn. Both were this
   * service putting something into a conversation it is only supposed to
   * carry, and both changed how the agent opened the call. Neither is needed:
   * the agent starts speaking on its own about 1.6 seconds after the session
   * opens. A call is now the same session a console test is.
   */
  wire(session, record, lead) {
    const callId = this.callId;

    // Give the agent the call facts. sendCallFacts sends them once per session,
    // so a session already briefed while it was prewarming is not briefed
    // again — the old test here was whether the socket had finished opening,
    // which is not the same question and got it wrong for a session claimed
    // mid-handshake: briefed by the prewarm, then briefed a second time here.
    if (session.ready) {
      const facts = callFacts(record, lead);
      if (facts) session.sendCallFacts(facts);
    } else {
      session.on('open', () => {
        const facts = callFacts(record, lead);
        if (facts) session.sendCallFacts(facts);
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
        {
          role: turn.role,
          text: turn.text,
          at: new Date().toISOString(),
          // Carried through so the store can tell one utterance from the next.
          ...(turn.itemId ? { itemId: turn.itemId } : {}),
          ...(turn.final ? { final: true } : {}),
        },
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
        // The agent has decided the call is over. It reaches here whether it
        // used a tool of ours or, as it does by default, its own end_call
        // from the xAI console — and either way the phone leg is ours to
        // release.
        //
        // Waiting for xAI to close the socket instead costs the caller a long
        // silence: measured on a live booking, the agent called end_call at
        // 31.4 s and the socket did not close until 38.8 s. Seven seconds of
        // open line after the goodbye is what "the call doesn't cut" is.
        //
        // The result is submitted only for a tool we offered. Answering the
        // agent's own would be replying on xAI's behalf, which is what breaks
        // its connectors.
        if (config.agentCallControl) session.submitFunctionResult(toolCallId, { ending: true });
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

      // Anything else belongs to the agent, not to us — the connectors
      // configured in the xAI console surface here as `search_connected_tools`
      // and `call_connected_tool`, and xAI answers them itself.
      //
      // Replying at all breaks them. Answering `search_connected_tools` with
      // "no tool named that is available" ends the chain at its first step:
      // the agent never reaches `call_connected_tool`, says something like
      // "let me get that set up right away", and books nothing. Left alone,
      // the same request runs through to the connector and completes. So say
      // nothing, and let the tools the operator configured do their work.
      // Say nothing — but do write down what happened. A booking made through
      // a connector is otherwise invisible from this side: the agent tells the
      // caller "your appointment is confirmed" whether the connector created
      // the event or not, and xAI sends us no result either way, so "is it in
      // the calendar?" has had no answer anywhere but the calendar itself.
      // Recording the attempt does not make it succeed, but it does mean a
      // booking that never arrives can be traced to whether the agent asked
      // for it at all.
      if (name === 'call_connected_tool' || name === 'search_connected_tools') {
        const record = calls.get(callId);
        const attempts = [...(record?.details?.connectorCalls ?? [])];
        attempts.push({
          tool: name === 'call_connected_tool' ? args.tool_name ?? 'unknown' : 'search',
          arguments: name === 'call_connected_tool' ? args.arguments ?? null : args.query ?? null,
          at: new Date().toISOString(),
        });
        calls.saveDetails(callId, { connectorCalls: attempts });
        log.info(
          { callId, tool: attempts[attempts.length - 1].tool, arguments: attempts[attempts.length - 1].arguments },
          'agent used one of its connectors',
        );
        return;
      }

      log.debug({ name, callId }, "agent used one of its own tools; leaving it to xAI");
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
      // Otherwise the session ended without us asking. That is what happens
      // when the agent hangs up using its own end_call: xAI runs the tool and
      // closes the socket about a second later, with the closing words still
      // in Plivo's buffer. Cutting the leg here truncates them, so drain the
      // same way our own hangup does — the checkpoint has a timer behind it,
      // so a lost confirmation cannot hold the line open.
      //
      // Nothing to drain means xAI dropped out before speaking, and there is
      // no reason to keep the caller listening to silence.
      if (this.framesOut > 0 && this.ws.readyState === this.ws.OPEN) {
        this.pendingHangup = { reason: 'completed', action: 'hangup' };
        calls.saveDetails(this.callId, { endedByAgent: true, endReason: 'completed' });
        this.armHangupCheckpoint();
        return;
      }
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

  /**
   * Closes our side after Plivo has reported the call over.
   *
   * Only the hangup webhook calls this, and that webhook fires because the
   * call has already ended — the person hung up, or the carrier dropped it.
   * Nothing is being decided here; the leg is gone and this releases the
   * resources still pointed at it.
   *
   * It used to record itself as "ended from the dashboard", which read on the
   * call record as though this service had chosen to end a call somebody else
   * had already put down.
   */
  hangup() {
    this.teardown('call already ended; releasing the bridge');
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

    // "The call connected and there was no voice" is the hardest thing to
    // diagnose from the outside, because every part reports success: the call
    // was placed, the webhook answered, the stream opened. What separates the
    // cases is which direction audio actually moved, and that is known only
    // here. Record it on the call so the dashboard can say which leg was
    // silent instead of leaving the operator to guess.
    if (this.callId) {
      // Only describe the silence when nothing better is already recorded. An
      // error from xAI names the actual cause — a rejected key, a closed
      // session — and "the agent never spoke" is the symptom of it. Replacing
      // the cause with the symptom would throw away the useful half.
      const recorded = calls.get(this.callId)?.error;
      const diagnosis = !recorded && this.framesOut === 0
        ? (this.framesIn === 0
            ? 'No audio moved in either direction — the media stream opened but carried nothing.'
            : 'The caller was heard but the agent never sent any audio back.')
        : null;
      calls.update(this.callId, {
        media: { framesIn: this.framesIn, framesOut: this.framesOut, reason },
        ...(diagnosis ? { error: diagnosis } : {}),
      });
      events.emit('call:bridge-ended', { callId: this.callId, reason });
    }
  }
}

/**
 * What this call is, as data.
 *
 * Written as labelled values rather than a sentence, so there is no room for
 * it to read as an instruction. It carries only what the agent cannot
 * otherwise know: it has no view of the dialler, so without the number it has
 * to ask the person to read out the number it just rang them on.
 *
 * Anything the lead list carried comes along for the same reason — a name in
 * the CSV is a fact about who was called, not a rule about how to speak.
 */
function callFacts(record, lead) {
  if (!config.agentCallFacts || !record) return null;

  const facts = [
    `direction: ${record.direction ?? 'outbound'}`,
    `phone number dialled: ${record.toNumber}`,
  ];
  if (lead?.name) facts.push(`name on the list: ${lead.name}`);
  for (const [key, value] of Object.entries(lead?.attributes ?? {})) {
    facts.push(`${key}: ${value}`);
  }
  return `Call metadata. ${facts.join('. ')}.`;
}

export function handlePlivoStream(ws, req) {
  new PlivoBridge(ws, req);
}
