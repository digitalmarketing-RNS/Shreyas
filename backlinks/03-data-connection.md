# Connecting live data to this session

Corrects an earlier bad test. I originally probed `search.google.com` and
`bing.com` — the **web UIs**. The APIs live on different hostnames and sit under
different egress policy. Re-tested against the hosts that actually matter:

| Host | Purpose | Status |
|---|---|---|
| `searchconsole.googleapis.com` | GSC Search Analytics, URL Inspection, Sitemaps | ✅ reachable |
| `www.googleapis.com` | Discovery + PSI | ✅ reachable |
| `oauth2.googleapis.com` | Service-account token exchange | ✅ reachable |
| `accounts.google.com` | Auth | ✅ reachable |
| `indexing.googleapis.com` | Indexing API v3 | ✅ reachable |
| `analyticsdata.googleapis.com` | GA4 Data API | ✅ reachable |
| `ssl.bing.com` | Bing Webmaster API | ❌ **blocked** |
| `api.moz.com` / `lsapi.seomoz.com` | Moz Links API (DA) | ❌ **blocked** |
| `api.dataforseo.com` | DataForSEO | ❌ **blocked** |

**Verdict: Google data is connectable from this session. Bing, Moz and
DataForSEO are not** — that block is at the network layer, so an API key does
not fix it. Those three have to run somewhere else (claude.ai, or your own
machine) and the output gets pasted here.

Practical consequence for the guide: **Move 1's "rank by Moz DA" cannot be done
from this session.** Either run it in claude.ai, or accept a provisional
ordering here that gets re-ranked later. I will not silently substitute a
guessed authority figure.

---

## Runtime status — already built and verified

```
/workspace/gscenv          venv with google-api-python-client, google-auth,
                           google-auth-httplib2, requests
/workspace/agricidaniel/claude-seo/scripts/   gsc_query.py, gsc_inspect.py,
                           google_auth.py, ga4_report.py, pagespeed_check.py
```

Verified working — `google_auth.py --check` runs and correctly reports
`Tier -1 — No credentials configured`. It is waiting on credentials, nothing else.

> Deliberately a minimal install: skipped `weasyprint` and `playwright` (PDF
> reports and headless rendering), which are heavy and not needed for GSC data.

---

## Option A — service account (full live access here)

Gives me direct GSC data: clicks, impressions, CTR, position, and landed links.

1. **GCP project** — [console.cloud.google.com](https://console.cloud.google.com) → new project
2. **Enable APIs** — APIs & Services → Library → enable **Google Search Console API**.
   Add **Chrome UX Report API** + **PageSpeed Insights API** if you also want CWV,
   and **Google Analytics Data API** for GA4.
3. **Create service account** — IAM & Admin → Service Accounts → Create.
   No project roles needed; the grant happens inside GSC, not in IAM.
4. **Key** — open the service account → Keys → Add Key → Create new key → **JSON** → download
5. **Grant in GSC** — Search Console → your property → Settings → Users and
   permissions → Add user → paste the service account's `client_email`
   - Try **Restricted** first — enough for Search Analytics, which is what the
     tracker needs, and it is the tighter grant
   - Upgrade to **Full** only if you hit a 403 or need URL Inspection / Sitemaps
   - **Owner** only if you want the Indexing API. Do not grant it otherwise
6. **Optional API key** — Credentials → Create Credentials → API key, then
   restrict it to CrUX + PSI only
7. Hand over the JSON. Config goes to `~/.config/claude-seo/google-api.json`:

```json
{
  "service_account_path": "/root/.config/claude-seo/service_account.json",
  "api_key": "<optional, for CrUX/PSI only>",
  "default_property": "sc-domain:yourdomain.com",
  "ga4_property_id": "properties/123456789"
}
```

Property format: use `sc-domain:example.com` for a domain property (recommended,
covers everything), or `https://example.com/` **with trailing slash** for a
URL-prefix property. Wrong format returns 404, not a permission error.

### Before you do this — read

Handing me a service account key is a real credential transfer. Being straight
about it:

- **Pasting the JSON into chat puts a private key in the conversation transcript.**
  That is the part to weigh.
- Mitigation that makes it reasonable: create a **dedicated** service account for
  this, in a **throwaway GCP project**, granted **read-only on one property**, and
  **delete the key in GCP when we're done**. Blast radius is then "someone can
  read your Search Console stats", and it ends when you revoke.
- This container is **ephemeral** — the key dies with the session regardless.
- The key must never be committed. Add to `.gitignore` before it touches disk.
- Revoke anytime: GCP Console → Service Accounts → Keys → delete.

## Option B — no credentials at all (recommended first)

Skip the handover entirely. You run the GSC queries where you're already
authenticated and paste me the output.

- Search Console UI → Performance → Export → CSV, or the Links report → Export
- Or run the guide's connector route in claude.ai (GSC MCP / Windsor.ai / Composio)
  and paste the result

I can read, analyse, diff against baselines and build the board from pasted data
just as well as from a live call. What's lost is only **autonomous refresh** —
I can't pull the numbers myself on a schedule.

**Given the tracker only needs a weekly read, Option B costs you very little and
costs you no credential exposure.** I'd start there and only move to Option A if
the manual step becomes annoying.

## Bing — neither option works here

`ssl.bing.com` is blocked outright. Bing Webmaster data has to be exported from
the Bing UI and pasted, or handled in a different environment. Worth doing at
some point regardless: Bing's index feeds ChatGPT and Copilot, so it catches
links Google misses and matters for AI-search visibility.
