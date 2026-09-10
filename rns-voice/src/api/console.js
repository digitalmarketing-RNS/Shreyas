import { XaiSession } from '../xai/realtime.js';
import { log } from '../logger.js';

/**
 * Browser test console.
 *
 * The browser talks to this server and this server talks to xAI, rather than
 * the browser dialling xAI directly. That keeps the API key server-side and
 * lets someone hear exactly what a lead would hear, without spending a call.
 *
 * Audio is 24 kHz mono PCM16, base64 over JSON, in both directions.
 */
export function handleConsoleSocket(ws) {
  let session = null;

  const send = (payload) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
  };

  const start = () => {
    if (session) return;

    // The same agent a real call reaches, with nothing layered on top. A test
    // that could be configured differently from a call would not be a test of
    // anything an operator is about to run.
    session = new XaiSession({ profile: 'browser', label: 'console' });

    // Nothing sent on open, exactly as on a call: the agent opens the
    // conversation itself. Triggering a turn here would make this test differ
    // from the thing it is meant to be a test of.
    session.on('open', () => send({ type: 'ready' }));
    session.on('audio', (audio) => send({ type: 'audio', audio }));
    session.on('speech_started', () => send({ type: 'speech_started' }));
    session.on('transcript', (turn) => send({ type: 'transcript', ...turn }));
    session.on('error', (err) => send({ type: 'error', message: err.message }));
    session.on('close', () => {
      send({ type: 'closed' });
      session = null;
    });

    session.connect();
  };

  ws.on('message', (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }
    switch (message.type) {
      case 'start': start(); break;
      case 'audio': if (message.audio) session?.appendAudio(message.audio); break;
      case 'text': if (message.text) session?.sendText(String(message.text)); break;
      case 'stop': session?.close(); session = null; break;
      default: break;
    }
  });

  ws.on('close', () => {
    session?.close();
    session = null;
  });
  ws.on('error', (err) => log.warn({ err }, 'console socket error'));
}
