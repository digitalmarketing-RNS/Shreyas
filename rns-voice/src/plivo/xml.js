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

  // Path segments, not a query string. Two values joined by `&` have to be
  // written `&amp;` inside XML, and the whole call then rests on Plivo's
  // parser turning that back into `&` before it dials the socket. If it does
  // not, the token arrives as part of a parameter named "amp;token", the
  // bridge cannot authenticate the stream and closes it — and the caller
  // hears a call that connects and then says nothing. A path carries no
  // ampersand and nothing to decode, so that failure cannot happen. The token
  // is base64url, which is already path-safe.
  const url = `${wsOrigin()}/plivo/stream/${encodeURIComponent(callId)}/${encodeURIComponent(token)}`;

  // extraHeaders is deliberately absent. It duplicated an identity the URL
  // already carries, and Plivo documents the attribute as alphanumeric while
  // a base64url token contains '-' and '_' — a needless way for the element
  // to be rejected, for no information gained.
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Stream bidirectional="true"
          keepCallAlive="true"
          contentType="audio/x-mulaw;rate=8000"
          audioTrack="inbound"
          statusCallbackUrl="${escapeXml(`${config.publicBaseUrl}/plivo/stream-status`)}"
          statusCallbackMethod="POST">${escapeXml(url)}</Stream>
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
