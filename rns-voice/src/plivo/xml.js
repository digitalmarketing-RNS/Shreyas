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
 * The call id is carried in the WebSocket URL's query string. It used to ride
 * in `extraHeaders` alone, but those arrive inside the `start` event under a
 * key whose name and nesting vary, and a lookup that misses makes the bridge
 * reject the stream — which ends the Stream element and drops the call, with
 * the caller hearing a connect and then silence. The URL is chosen by us and
 * arrives intact on the handshake, so it cannot go missing. extraHeaders is
 * kept as a secondary source.
 */
export function streamXml(callId) {
  const token = signCallToken(callId);
  const query = `callId=${encodeURIComponent(callId)}&token=${encodeURIComponent(token)}`;
  const url = `${wsOrigin()}/plivo/stream?${query}`;
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

/**
 * Dials the configured colleague. `callerId` is kept as our own number so the
 * person receiving the transfer sees a number they recognise rather than the
 * lead's.
 */
export function transferXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${escapeXml(config.plivoNumber)}" timeout="30">
    <Number>${escapeXml(config.transferNumber)}</Number>
  </Dial>
</Response>`;
}
