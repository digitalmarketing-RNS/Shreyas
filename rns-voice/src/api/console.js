import { XaiSession } from '../xai/realtime.js';
import { campaigns } from '../store.js';
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

  const start = ({ campaignId } = {}) => {
    if (session) return;
    const campaign = campaignId ? campaigns.get(campaignId) : null;

    session = new XaiSession({
      profile: 'browser',
      label: 'console',
      agentId: campaign?.agentId || undefined,
      instructions: campaign?.instructions || undefined,
      voice: campaign?.voice || undefined,
    });

    session.on('open', () => {
      send({ type: 'ready', campaign: campaign?.name ?? null });
      // Mirror a real outbound call: open with the scripted line if there is one.
      if (campaign?.opener) session.forceMessage(campaign.opener);
      else session.createResponse();
    });
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
      case 'start': start({ campaignId: message.campaignId }); break;
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
