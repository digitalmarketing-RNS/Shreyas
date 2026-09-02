import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import { config } from '../config.js';
import { log } from '../logger.js';
import { buildSessionUpdate, realtimeUrl, restoreAgentAudio } from './session.js';

/** Barge-in signals. Deployments emit one name or the other; both mean "stop talking". */
const SPEECH_STARTED = new Set([
  'input_audio_buffer.speech_started',
  'input_audio_buffer.speech_start',
]);

/**
 * One live conversation with the xAI realtime API.
 *
 * Events emitted:
 *   open            session configured and ready
 *   audio(base64)   agent audio in the negotiated codec
 *   transcript({role, text, cumulative})
 *   speech_started  the person started talking — stop playback
 *   response_done
 *   function_call({name, callId, arguments})
 *   dtmf(digits)
 *   error(Error)
 *   close({code, reason})
 */
/**
 * Turns a refused handshake into an error that says what was refused and why.
 *
 * 'ws' reports a rejection as "Unexpected server response: 403" and discards
 * the body, which is the only part that distinguishes an expired key from an
 * account with no credit left from a genuine outage. On a phone call all three
 * present identically — the call connects and nobody speaks — so the body is
 * worth reading.
 */
export function readRejection(res) {
  return new Promise((resolve) => {
    // A rejection is a short JSON object. Cap what is kept, and cap it on the
    // way in rather than before appending — a single chunk larger than the
    // limit would otherwise pass the check and be added whole.
    const LIMIT = 2048;
    let body = '';
    res.on('data', (chunk) => {
      if (body.length >= LIMIT) return;
      body += chunk.toString().slice(0, LIMIT - body.length);
    });
    res.on('end', () => {
      let detail = body.trim();
      try {
        const parsed = JSON.parse(body);
        detail = parsed.error ?? parsed.message ?? detail;
      } catch {
        // Not JSON. The raw text is still better than nothing.
      }
      const err = new Error(
        `xAI refused the connection (HTTP ${res.statusCode})` + (detail ? `: ${detail}` : ''),
      );
      err.status = res.statusCode;
      resolve(err);
    });
    res.on('error', () => resolve(
      Object.assign(new Error(`xAI refused the connection (HTTP ${res.statusCode})`), { status: res.statusCode }),
    ));
  });
}

export class XaiSession extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.ws = null;
    this.ready = false;
    this.closed = false;
    this.conversationId = null;
    /** Audio appended before the socket opens, so nothing is lost on a slow handshake. */
    this.pending = [];
    /** Whether the agent's own audio settings have been handed back yet. */
    this.audioRestored = false;
  }

  connect() {
    if (!config.xaiApiKey) {
      this.emit('error', new Error('XAI_API_KEY is not configured'));
      return;
    }

    const url = realtimeUrl(this.options);
    const ws = new WebSocket(url, {
      headers: { Authorization: `Bearer ${config.xaiApiKey}` },
      handshakeTimeout: 12_000,
      // Audio arrives as 20 ms frames. Compressing each one costs CPU on both
      // ends and buys nothing on already-compressed mu-law, so it is pure
      // added latency on the hot path.
      perMessageDeflate: false,
    });
    // Send each frame immediately rather than letting Nagle's algorithm hold
    // small packets back waiting for company.
    ws.on('upgrade', () => ws._socket?.setNoDelay?.(true));
    this.ws = ws;

    // A refused handshake is where the useful detail lives, and 'ws' throws it
    // away: whatever xAI said arrives as "Unexpected server response: 403" and
    // nothing else. That is the same thing on screen as a network fault, an
    // expired key, or an account with no credit left — and the caller's
    // experience of all three is a call that connects to silence, which is the
    // hardest failure here to tell apart from a bug in this service.
    //
    // So read the body xAI sent and say what it said.
    ws.on('unexpected-response', (_req, res) => {
      readRejection(res).then((err) => {
        log.error(
          { status: err.status, label: this.options.label },
          'xAI refused the realtime connection',
        );
        this.emit('error', err);
      });
    });

    ws.on('open', () => {
      // Configure before anything else: audio sent ahead of session.update is
      // decoded with the default 24 kHz settings and arrives as noise.
      this.send(buildSessionUpdate(this.options));
      this.ready = true;
      for (const chunk of this.pending) this.appendAudio(chunk);
      this.pending = [];
      log.info({ label: this.options.label }, 'xAI session open');
      this.emit('open');
    });

    ws.on('message', (raw) => this.onMessage(raw));

    ws.on('error', (err) => {
      log.error({ err, label: this.options.label }, 'xAI socket error');
      this.emit('error', err);
    });

    ws.on('close', (code, reason) => {
      this.ready = false;
      this.closed = true;
      const text = reason?.toString() ?? '';
      log.info({ code, reason: text, label: this.options.label }, 'xAI session closed');
      this.emit('close', { code, reason: text });
    });
  }

  onMessage(raw) {
    let event;
    try {
      event = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (SPEECH_STARTED.has(event.type)) {
      this.emit('speech_started');
      return;
    }

    switch (event.type) {
      case 'response.output_audio.delta':
        if (event.delta) this.emit('audio', event.delta);
        break;

      // All three carry the agent's own words, depending on API revision and
      // whether the response is audio or text.
      case 'response.output_audio_transcript.delta':
      case 'response.output_text.delta':
      case 'response.text.delta':
        if (event.delta) this.emit('transcript', { role: 'agent', text: event.delta });
        break;

      // The caller's words. Two events carry them and only one is guaranteed:
      //
      //   .completed  fires once per utterance, always, with the final text.
      //   .updated    streams the cumulative transcript while they are still
      //               speaking, but xAI emits it ONLY when the session sets
      //               audio.input.transcription.model to 'grok-transcribe'.
      //
      // Listening for .updated alone — which this did — means a session that
      // has not asked for live captions records nothing the caller said, with
      // no error to show for it. Handle both: .updated fills the turn in as
      // they speak when captions are on, .completed settles it either way.
      case 'conversation.item.input_audio_transcription.updated':
      case 'conversation.item.input_audio_transcription.completed': {
        const text = event.transcript ?? event.text ?? '';
        if (text) {
          this.emit('transcript', {
            role: 'caller',
            text,
            cumulative: true,
            // Identifies the utterance, so two things the caller says in a row
            // become two turns instead of the second overwriting the first.
            itemId: event.item_id ?? null,
            final: event.type.endsWith('.completed'),
          });
        }
        break;
      }

      case 'conversation.created':
        this.conversationId = event.conversation?.id ?? null;
        break;

      // xAI's acknowledgement of session.update, echoing what it actually
      // accepted. Logged because a field it ignored or rejected is otherwise
      // invisible: the call simply behaves unlike the console says it should.
      case 'session.updated': {
        log.debug({ label: this.options.label, session: event.session }, 'xAI accepted session config');
        // This echo is also the only place the agent's own audio settings are
        // ever visible, and the format we have to send for the phone line
        // replaces them. Hand them straight back the first time we see them.
        //
        // First time only: the acknowledgement of that very message carries
        // them too, so restoring from every echo would never stop.
        if (!this.audioRestored) {
          const restore = restoreAgentAudio(event.session?.audio, this.options);
          if (restore) {
            this.audioRestored = true;
            this.send(restore);
            log.info(
              { label: this.options.label, audio: restore.session.audio },
              "kept the agent's own audio settings",
            );
          }
        }
        break;
      }

      case 'response.created':
        this.emit('response_created');
        break;

      // Carries the id of each thing the agent said, which is what makes it
      // removable again.
      case 'response.output_item.done':
        if (event.item?.id) this.emit('output_item', { id: event.item.id, role: event.item.role ?? null });
        break;

      case 'response.done':
        this.emit('response_done');
        break;

      case 'response.function_call_arguments.done':
        this.emit('function_call', {
          name: event.name ?? '',
          callId: event.call_id ?? '',
          arguments: event.arguments ?? '{}',
        });
        break;

      case 'input_audio_buffer.dtmf_event_received':
        this.emit('dtmf', event.digits ?? event.digit ?? '');
        break;

      case 'error': {
        const message =
          typeof event.error === 'string' ? event.error : (event.error?.message ?? 'unknown xAI error');
        log.error({ event }, 'xAI reported an error');
        this.emit('error', new Error(message));
        break;
      }

      default:
        break;
    }
  }

  send(payload) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(payload));
  }

  /** Appends a base64 chunk in the session's negotiated input codec. */
  appendAudio(base64) {
    if (!this.ready) {
      // Bounded, so a stalled handshake cannot grow this without limit.
      if (this.pending.length < 250) this.pending.push(base64);
      return;
    }
    this.send({ type: 'input_audio_buffer.append', audio: base64 });
  }

  /**
   * Gives the agent facts about the call it has no other way to know — which
   * number was dialled, and whatever the lead list carried.
   *
   * Sent with the `system` role, which xAI documents as system-level context.
   * That matters: as a `user` item it reads as somebody speaking, and the
   * agent answers it. As system context it is data the agent simply has.
   *
   * Not `instructions`, which would replace the console prompt outright, and
   * never phrased as one. Facts only — the agent decides what to do with
   * them, exactly as it decides everything else.
   */
  sendCallFacts(text) {
    this.send({
      type: 'conversation.item.create',
      item: { type: 'message', role: 'system', content: [{ type: 'input_text', text }] },
    });
  }

  sendText(text) {
    this.send({
      type: 'conversation.item.create',
      item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] },
    });
    this.createResponse();
  }

  createResponse() {
    this.send({ type: 'response.create' });
  }

  /**
   * Speaks an exact line with no model round-trip. Used for a campaign opener
   * so every call starts identically, and for disclosures that must be spoken
   * word for word.
   *
   * This *is* the turn — never follow it with response.create.
   */
  forceMessage(text, interruptible = true) {
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'force_message',
        role: 'assistant',
        interruptible,
        content: [{ type: 'output_text', text }],
      },
    });
  }

  submitFunctionResult(callId, output) {
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: typeof output === 'string' ? output : JSON.stringify(output),
      },
    });
    this.createResponse();
  }

  get isOpen() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try {
      this.ws?.close(1000, 'done');
    } catch {
      /* already gone */
    }
  }
}

/**
 * Verifies the API key and agent by opening a session and closing it again.
 * Surfaced in the dashboard so a bad key is obvious before a campaign runs
 * rather than as silent failures on every call.
 */
export function probeXai(timeoutMs = 12_000) {
  return new Promise((resolve) => {
    if (!config.xaiApiKey) {
      resolve({ ok: false, error: 'XAI_API_KEY is not set' });
      return;
    }
    const session = new XaiSession({ profile: 'browser', label: 'probe' });
    const done = (result) => {
      clearTimeout(timer);
      session.removeAllListeners();
      session.close();
      resolve(result);
    };
    const timer = setTimeout(() => done({ ok: false, error: 'timed out connecting to xAI' }), timeoutMs);

    session.on('open', () => done({ ok: true, agentId: config.xaiAgentId || null }));
    session.on('error', (err) => done({ ok: false, error: err.message }));
    session.connect();
  });
}
