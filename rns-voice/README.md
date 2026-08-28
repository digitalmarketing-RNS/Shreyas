# RNS Voice Agent

Connects an **xAI voice agent** to a **Plivo phone number** and adds the two
things neither platform provides: outbound **campaign dialling** and a dashboard
to run it from.

xAI gives you a realtime WebSocket and nothing else — no numbers, no dialler.
Plivo gives you numbers and a dialler API but no AI. This app is the piece in
between.

```
                 ┌──────────────────────────────────────────┐
   lead list ──► │  campaign dialer                         │
                 │  windows · retries · opt-out · pacing    │
                 └───────────────┬──────────────────────────┘
                                 │ REST: place call
                                 ▼
   +91 80317 05594  ◄──────  Plivo  ──────► AudioStream (WebSocket)
                                                   │
                                    mu-law 8 kHz, passed straight through
                                                   ▼
                                        xAI realtime (agent_…)
```

## What it does

- **Campaigns** — upload a CSV, set a calling window, press Start.
- **Calling windows in the lead's own timezone**, not the server's.
- **Retries** with a configurable delay and attempt cap; a retry is never
  scheduled into a closed window.
- **Opt-out list** that suppresses a number across every campaign immediately.
- **Voicemail detection** — hangs up instead of talking to an answering machine.
- **Live transcripts** of every call, stored and viewable per call.
- **Browser test console** — talk to the agent through your microphone without
  spending a call.
- **Health checks** for xAI, Plivo, and whether your host actually supports
  WebSockets.

## Deploying

See **[DEPLOY-HOSTINGER.md](DEPLOY-HOSTINGER.md)**. Read the WebSocket section
before you start — it is the one thing that can stop this working on shared
hosting.

## Running locally

```bash
npm install
cp .env.example .env     # fill in your keys
npm start                # http://localhost:3000
npm test
```

## Two implementation details worth knowing

**1. The audio format must use the nested schema.**

xAI *silently ignores* the flat `input_audio_format` / `output_audio_format`
fields that other realtime APIs accept, and falls back to 24 kHz PCM without
raising an error. On a phone call that means audio played at the wrong sample
rate in both directions — it sounds like a broken model but is purely a config
mistake. `src/xai/session.js` uses the nested `audio.input.format` form, and
`test/session.test.js` guards against anyone "simplifying" it back.

**2. Nothing transcodes the audio.**

Plivo streams G.711 mu-law at 8 kHz, and the xAI session is configured for
`audio/pcmu` at 8 kHz. Each 20 ms frame is relayed as opaque base64 in both
directions — no decode, no resample. That is the whole reason latency stays low
enough to feel like a conversation.

## Layout

```
app.js                  entry point; HTTP + WebSocket routing
src/config.js           environment variables and startup warnings
src/store.js            JSON persistence (no native modules, for shared hosting)
src/xai/session.js      session.update builder — the nested audio schema
src/xai/realtime.js     xAI WebSocket client
src/plivo/client.js     Plivo REST, signature validation, call tokens
src/plivo/xml.js        Plivo answer XML
src/plivo/bridge.js     Plivo AudioStream ↔ xAI relay
src/plivo/routes.js     answer / hangup webhooks, disposition mapping
src/campaign/dialer.js  pacing, retries, calling windows
src/campaign/import.js  CSV lead import
src/api/routes.js       dashboard REST API
public/                 dashboard
deploy/                 systemd unit and Nginx config for a VPS
```

## Scale

Storage is a single JSON file, chosen so `npm install` cannot fail on shared
hosting. Comfortable to roughly 50,000 leads. Past that, move `src/store.js` to
Postgres — nothing else needs to change.

## Security

- The dashboard and API are behind `DASHBOARD_PASSWORD`.
- Plivo webhooks are verified with signature V3.
- Each call carries an HMAC so a stranger who finds the stream URL cannot open a
  billable xAI session.
- Credentials and audio payloads are redacted from logs.
- `.env` and `data/` are gitignored. Keep them out of version control.
