# Putting this live on Hostinger

Follow these in order. Step 6 is the one that decides whether voice actually
works on your plan, so do not skip it.

---

## Before you start: two things to fix

### 1. Your xAI API key is probably wrong

The value you have is a UUID (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`). That is
the **key ID** the xAI console shows in its list — not the key itself.

A real xAI API key starts with `xai-` and is much longer. Go to
[console.x.ai](https://console.x.ai) → API Keys → **Create API Key**, and copy
the value it shows you once at creation. That is what goes in `XAI_API_KEY`.

### 2. Rotate the credentials you pasted into chat

The Plivo auth token and the xAI value were shared in a chat message, so treat
both as compromised. In the Plivo console regenerate the auth token, and in the
xAI console delete the old key. Then use the new values here.

---

## 1. Upload the files

Upload the contents of this folder to your Hostinger Node.js app directory.
Either:

- **hPanel → File Manager**: upload `rns-voice.zip` and use *Extract*, or
- **SSH/SFTP**: copy the folder across.

Do **not** upload `node_modules` — Hostinger installs it for you in step 3.

## 2. Create the Node.js application

hPanel → **Advanced → Node.js** (on some plans: *Website → Node.js*):

| Field | Value |
|---|---|
| Node.js version | 18 or newer (20+ preferred) |
| Application root | the folder you uploaded to |
| Application URL | your domain |
| Application startup file | `app.js` |

## 3. Install dependencies

Press **NPM Install** in the Node.js panel, or over SSH:

```bash
cd ~/your-app-folder
npm install --omit=dev
```

There are only three dependencies and none of them compile native code, so this
should finish in seconds. If it fails, the log will say why — send it over
rather than guessing.

## 4. Set the environment variables

In the Node.js panel's environment-variables section, add each of these. Use
your **new** keys from the section above.

```
XAI_API_KEY          xai-...your real key...
XAI_AGENT_ID         agent_CvgfdQIkeaZ1IGqg
PLIVO_AUTH_ID        ...your Plivo auth id...
PLIVO_AUTH_TOKEN     ...your regenerated token...
PLIVO_PHONE_NUMBER   +918031705594
PUBLIC_BASE_URL      https://your-domain.com
DASHBOARD_PASSWORD   ...something long you choose...
DEFAULT_COUNTRY_CODE 91
DEFAULT_TIMEZONE     Asia/Kolkata
```

`PUBLIC_BASE_URL` must be the real https address of the app, with no trailing
slash. Plivo calls back to it, so it has to be reachable from the internet.

## 5. Start it and open the dashboard

Press **Restart** in the Node.js panel, then visit your domain. You should get
the password prompt, then the dashboard.

## 6. Run the three health checks — do this before anything else

Open **Settings & Health** in the sidebar and press **Run all checks**.

| Check | What a failure means |
|---|---|
| 1. xAI agent | Your `XAI_API_KEY` is wrong or the agent id does not exist. |
| 2. Plivo account | Your Plivo auth id/token are wrong. |
| 3. WebSocket support | **Read the section below.** |

### If the WebSocket check fails

This is the one real risk on your plan, so here it is plainly.

Live voice needs a WebSocket held open for the entire call — call audio flows
Plivo → this app → xAI and back, continuously. Hostinger's **shared/web hosting
tiers generally do not proxy WebSocket connections**, and they recycle
long-running processes. The rest of the dashboard will work fine; calls will
connect and then be **silent**, with nothing obvious in the logs to explain it.

If check 3 fails, you have two options:

1. **Move to a Hostinger VPS** (their cheapest KVM plan is enough). It gives you
   persistent processes and real WebSocket support. Same files, same steps —
   plus Nginx as described below.
2. Ask Hostinger support to confirm whether WebSocket proxying is enabled on
   your specific plan. Some tiers do allow it.

If check 3 passes, you are fine — carry on.

## 7. Point Plivo at this server

In the Plivo console, **Voice → Applications → Create New Application**:

| Field | Value |
|---|---|
| Application name | RNS Voice Agent |
| Answer URL | `https://your-domain.com/plivo/answer` — **POST** |
| Hangup URL | `https://your-domain.com/plivo/hangup` — **POST** |

Then **Phone Numbers → +918031705594** and assign that application to the
number.

The dashboard prints these exact URLs under **Settings & Health → Point Plivo at
this server**, filled in with your own domain — copy them from there.

## 8. Make one test call

**Test Agent → Call a real phone**, enter your own mobile, press *Place test
call*. Your phone should ring and the agent should speak.

If it rings but you hear silence, that is the WebSocket problem from step 6.

## 9. Run a campaign

1. **Campaigns** → fill in the form → *Create campaign*
2. **Leads** → pick the campaign → upload a CSV with a `phone` column → *Import*
3. **Campaigns** → *Start*

The dialer respects your calling window in each lead's local time, retries
no-answers on your schedule, and stops at your attempt limit.

---

## Running on a VPS instead (recommended)

```bash
# as root on a fresh Ubuntu VPS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx certbot python3-certbot-nginx

adduser --system --group rns
mkdir -p /opt/rns-voice && chown rns:rns /opt/rns-voice
# copy the files into /opt/rns-voice, then:
cd /opt/rns-voice && sudo -u rns npm install --omit=dev
cp .env.example .env && nano .env        # fill in your real values

cp deploy/rns-voice.service /etc/systemd/system/
systemctl enable --now rns-voice

cp deploy/nginx.conf /etc/nginx/sites-available/rns-voice
ln -sf /etc/nginx/sites-available/rns-voice /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d your-domain.com
```

The supplied `deploy/nginx.conf` already carries the `Upgrade` and `Connection`
headers that WebSockets need, and disables proxy buffering so audio is not
delayed.

---

## Troubleshooting

**The phone rings, then silence.**
The audio socket is not getting through. Run check 3 in Settings & Health.

**Plivo webhooks return 403.**
`PUBLIC_BASE_URL` does not exactly match the URL Plivo is calling — check for a
trailing slash, or `www.` on one side only. As a last resort set
`PLIVO_VALIDATE_SIGNATURE=false`, but fix the URL properly afterwards.

**Calls are placed but never connect.**
Check the Plivo console's call logs. Usually the number needs to be verified, or
the account is out of credit, or the destination is outside your Plivo
permissions.

**The campaign says running but nothing dials.**
Almost always the calling window: it is evaluated in each lead's local time.
Widen the window, or check the lead's timezone in the Leads table.

**Everything was working, now the app is asleep.**
Shared hosting recycles idle processes. This is another reason a VPS suits an
always-on dialer better.
