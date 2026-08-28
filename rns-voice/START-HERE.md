# Start here

The application is finished and verified working against your live accounts:

| Check | Result |
|---|---|
| xAI key and agent | connects to `agent_CvgfdQIkeaZ1IGqg` |
| Plivo credentials | authenticates as **Digital RNSIT**, balance $9.53 |
| Plivo number | `+918031705594` present and voice-enabled |
| App boot with your config | starts clean, no warnings |
| Tests | 41 passing |

The one unsolved problem is **where to run it**.

---

## Why Hostinger shared hosting is the wrong home for this

A voice call needs a WebSocket held open for its whole duration: audio flows
Plivo → this app → xAI and back, continuously, for minutes at a time.

Hostinger's shared and web tiers do not reliably proxy WebSockets, and they
recycle idle processes. That produces a specific, confusing failure: the
dashboard loads, calls connect, and then there is **silence** — with nothing in
any log to explain it, because nothing errored.

So even after the 503 is solved, shared hosting is likely to leave you with
silent calls. Two options avoid that.

---

## Option A — Render free tier (recommended, ~10 minutes)

Render proxies WebSockets on every tier including the free one.

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. **New → Web Service**, choose the repository `digitalmarketing-RNS/Shreyas`,
   branch `claude/xai-voice-agent-campaign-up41z3`.
3. Set:
   - **Root Directory**: `rns-voice`
   - **Build Command**: `npm install --omit=dev`
   - **Start Command**: `node app.js`
   - **Instance Type**: Free
4. Add the environment variables from the `.env` file you were sent.
   Leave `PUBLIC_BASE_URL` out for now.
5. Deploy. Render gives you a URL such as
   `https://rns-voice-agent.onrender.com`.
6. Add `PUBLIC_BASE_URL` with that exact URL — **no trailing slash** — and
   redeploy.
7. Open the URL, log in, then **Settings & Health → Run all checks**. All three
   should pass, including the WebSocket check.

The free tier sleeps after inactivity and takes ~30 seconds to wake. Fine for
testing; take the $7/month tier before running real campaigns, so a lead never
waits on a cold start.

## Option B — Hostinger VPS

Keeps everything at Hostinger. Their cheapest KVM plan is enough.
`DEPLOY-HOSTINGER.md` has the commands, and `deploy/` holds the systemd unit
and an Nginx config with the WebSocket headers already set.

## Option C — carry on with shared hosting

The `build` script that was missing is now present, which was the most likely
cause of the 503. Redeploy with the current files and see. Even if the
dashboard comes up, run the WebSocket check before trusting it with a campaign.

---

## Once it is running

1. **Settings & Health → Run all checks.** Do not skip this.
2. **Test Agent → Call a real phone.** Use your own mobile. This proves the
   whole chain in one call.
3. **Campaigns → create one.** Opening line, calling window, attempts.
4. **Leads → upload a CSV** with a `phone` column.
5. **Campaigns → Start.**

## About your Plivo number

`+918031705594` is currently attached to a **Zentrunk SIP trunk**, and your
"Default" application points at Contacto rather than at this app.

Outbound campaigns are unaffected — each call carries its own answer URL — so
nothing needs changing for what you asked for.

If you later want people to be able to **call the number back** and reach the
agent, create a Plivo application with the answer and hangup URLs shown on the
Settings page, and assign the number to it instead of the trunk.

## Security

Your xAI key and Plivo token were shared in chat, so rotate both once this is
running, and change `DASHBOARD_PASSWORD` from `Shreyas123` to something long.
The dashboard can spend money on calls.
