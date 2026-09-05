import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { streamXml } from '../src/plivo/xml.js';
import { signCallToken } from '../src/plivo/client.js';

describe('stream XML', () => {
  it('carries the call id and token without an ampersand', () => {
    // The regression this guards. Two query parameters must be joined by '&',
    // which XML requires be written '&amp;'. The whole call then depends on
    // Plivo's parser turning that back into '&' before dialling the socket. If
    // it does not, the token arrives under a parameter called "amp;token", the
    // bridge cannot authenticate the stream and closes it, and the caller
    // hears a call that connects and then says nothing — with every other part
    // of the system reporting success. A path has nothing to decode.
    const xml = streamXml('cal_abc123');
    assert.ok(!xml.includes('&'), 'the stream URL must contain nothing needing XML escaping');
  });

  it('puts the id and token in the path where the bridge looks for them', () => {
    const callId = 'cal_abc123';
    // Parsed relative to a base, so the test does not depend on
    // PUBLIC_BASE_URL being set in the environment the suite runs in.
    const raw = streamXml(callId).match(/>([^<]+)<\/Stream>/)[1];
    const url = new URL(raw, 'wss://placeholder.invalid');
    const after = url.pathname.split('/').filter(Boolean);
    const at = after.indexOf('stream');

    assert.equal(decodeURIComponent(after[at + 1]), callId);
    assert.equal(decodeURIComponent(after[at + 2]), signCallToken(callId));
    assert.equal(url.search, '', 'nothing should be left in the query string');
  });

  it('sends no extraHeaders', () => {
    // Duplicated an identity the URL already carries, and Plivo documents the
    // attribute as alphanumeric while a base64url token contains '-' and '_'.
    assert.ok(!streamXml('cal_abc123').includes('extraHeaders'));
  });

  it('asks for the codec the bridge relays without transcoding', () => {
    assert.ok(streamXml('cal_abc123').includes('contentType="audio/x-mulaw;rate=8000"'));
  });
});
