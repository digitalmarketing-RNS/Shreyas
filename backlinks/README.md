# Backlinks From Zero — campaign workspace

Working setup for the "Backlinks From Zero" playbook (Vibha, `vibha-ramprakash.github.io/seo-geo-tracker`).
Runs on the `seo-backlinks` skill (AgriciDaniel/claude-seo) + `humanizer`.

**Status: staged, awaiting target domain.**

---

## Operating contract

Adopted from the guide's Project Instructions, unchanged in substance:

- Start from zero. Claim **Foundation** links first, then earn **editorial** ones.
- Every link tagged **do-follow / no-follow**, ranked by authority.
- I **find, score, draft and track**. I **never auto-send**. You get paste-ready
  drafts; you submit and send them yourself, from your own accounts.
- Free route first (Source of Sources, Search Console, Bing, Moz free tier).
  DataForSEO only on request, for depth.
- Never buy links. Never auto-blast. Both are what gets a domain de-ranked.

Two additions from the `seo-backlinks` skill that the guide implies but doesn't spell out:

- **Every metric carries a source label and confidence.** No number gets stated
  as fact without naming where it came from.
- **Data-sufficiency gate.** If fewer than 4 of the 7 health-score factors have
  a real source, report `INSUFFICIENT DATA` rather than a misleading number.

---

## Environment reality (verified, not assumed)

This is a Claude Code remote session with a restricted egress policy. The guide
assumes claude.ai + connectors. Measured differences:

| Capability | Status | Consequence |
|---|---|---|
| `seo-backlinks` skill | ✅ available | Scoring + framework ready |
| `humanizer` skill | ✅ available | Pitch drafting ready |
| `WebSearch` | ✅ works | Prospecting, roundup discovery, directory research all viable |
| **Direct HTTPS / crawling** | ✅ **works** | Environment network access changed Trusted → allows the domain. Full 86-URL crawl done — see `13-page-inventory.md` |
| Firecrawl **search** (platform connector) | ✅ works | Runs server-side; `scrape`/`crawl`/`map` not exposed by the connector |
| Moz Links API | ⚠️ **reachable** | `api.moz.com` no longer blocked — needs only a key |
| DataForSEO | ⚠️ **reachable** | `api.dataforseo.com` returns 401 — needs only a key |
| `github.com` | ✅ reachable | Step 4 (host the board on Pages) is viable from here |
| Google Search Console | ⚠️ **connectable** | API hosts reachable; venv built and verified. Needs credentials — see `03-data-connection.md` |
| GA4 / PSI / CrUX / Indexing | ⚠️ **connectable** | Same Google auth path |
| Bing Webmaster | ❌ `ssl.bing.com` blocked | Export from UI and paste; cannot connect |

**What this means practically — updated 2026-08-17.** The egress restriction that
shaped this workspace has been lifted for the target domain and the SEO APIs.
Crawling works: a full 86/86-URL audit is in `13-page-inventory.md`. Moz and
DataForSEO are now reachable, so the DA ranking and link-gap work is blocked
**only by missing API keys**, not by network policy. Bing remains blocked.

**Consequence for the guide's Move 1:** the "rank by Moz DA" step is no longer
impossible here — add a free Moz key and it runs. Same for DataForSEO depth.

I'll still flag any number I couldn't verify rather than filling the gap with a
guess, and every metric keeps its source label per the operating contract above.

---

## Division of labour — guide Step 1

Things only you can do (account creation, verification, billing):

| # | Task | Unblocks | Link |
|---|---|---|---|
| 3 | Sign up for Source of Sources | Move 2 (journalist links) | sourceofsources.com |
| 4 | Verify site in Google Search Console | Move 3 (tracking) | search.google.com/search-console |
| 5 | Bing Webmaster Tools account | Move 3 (links Google misses) | bing.com/webmasters |
| 6 | Connect GSC (GSC MCP / Windsor.ai / Composio) | Move 3 live board | github.com/AminForou/mcp-gsc |
| 7 | Moz Links API key (free tier) | DA ranking in Move 1 | moz.com/products/api |
| 8 | *Optional* DataForSEO MCP + top-up | Competitor gap depth | github.com/dataforseo/mcp-server-typescript |

Items 1–2 (add skills, create project) are already satisfied in this session —
both skills are loaded and this file is the project instruction set.

**None of these block Move 1 drafting.** They block *verification and tracking*.
We can produce every Foundation submission before a single one is set up.

---

## What I need from you to fire Move 1

The guide's Foundation prompt needs four inputs. Send these with the domain:

1. **Domain** — the live URL
2. **One-liner** — what you do, one sentence, how you'd say it out loud
3. **Best proof point** — a real, quotable result. A number, a named customer, a
   shipped outcome. This is what separates a submission that converts from
   boilerplate. If there genuinely isn't one yet, say so — we work around it
   rather than inventing one.
4. **Business type** — SaaS / dev tool / agency / local service / ecommerce /
   publisher. Determines which Foundation branch applies (see `01-foundation-targets.md`)

Nice to have, not blocking: 3 competitor domains (for the Move 3 link-gap), and
your logo + 2–3 screenshots (most directories require them at submission).

---

## The three moves

| Move | What it does | State |
|---|---|---|
| **1 · Foundation** | Claim the 10–15 profiles/directories every real business should hold | Targets pre-staged → `01-foundation-targets.md` |
| **2 · Pitch** | Earn editorial links: roundups + journalist requests. The ones that actually climb | Blocked on Source of Sources + domain |
| **3 · Track** | Live board on GSC + Bing, weekly autopilot check | Blocked on GSC connection |

Foundation links are the floor, not the climb — the guide is explicit about this
and it's correct. They make you findable. Move 2 is what moves rankings.

---

## Files

- `01-foundation-targets.md` — pre-staged Foundation universe + submission asset checklist
- `02-tracker.csv` — link tracker, one row per target
- `13-page-inventory.md` — **verified technical audit** from a live 86/86-URL crawl.
  7 findings ranked by severity; withdraws 3 incorrect findings from the earlier
  index-based version. Priority fix list at the end.
- `14-crawl-data.csv` — per-page crawl data: status, title + length, meta length,
  H1 count, words, images, missing-alt count, schema types. One row per URL.
