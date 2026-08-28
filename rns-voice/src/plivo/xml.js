import { config, wsOrigin } from '../config.js';
import { signCallToken } from './client.js';

function escapeXml(value) {
  return String(value ?? '').replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);
}

/**
 * Hands the call to a bidirectional audio stream.
 *
 * contentType is mu-law at 8 kHz, which is exactly what the xAI session is
 * configured for, so audio crosses this bridge without being resampled.
 *
 * `keepCallAlive` keeps the leg up while the agent thinks; without it Plivo
 * would hang up the moment the stream element finished.
 *
 * The call id travels in `extraHeaders` because Plivo delivers those in the
 * stream's `start` event, which is how the bridge learns which call it is on.
 */
export function streamXml(callId) {
  const url = `${wsOrigin()}/plivo/stream`;
  const token = signCallToken(callId);
  const extra = `callId=${callId};token=${token}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Stream bidirectional="true"
          keepCallAlive="true"
          contentType="audio/x-mulaw;rate=8000"
          audioTrack="inbound"
          statusCallbackUrl="${escapeXml(`${config.publicBaseUrl}/plivo/stream-status`)}"
          statusCallbackMethod="POST"
          extraHeaders="${escapeXml(extra)}">${escapeXml(url)}</Stream>
</Response>`;
}

export function hangupXml(message) {
  const spoken = message ? `\n  <Speak>${escapeXml(message)}</Speak>` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>${spoken}
  <Hangup/>
</Response>`;
}
