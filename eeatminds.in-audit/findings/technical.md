# Technical SEO — eeatminds.in

Method: live crawl of all 86 sitemap URLs + header/protocol inspection. 2026-08-17.

## Crawlability & indexability — clean

| Check | Result |
|---|---|
| URLs in sitemap | 86 (18 pages + 68 posts) — all retrieved, 100% coverage |
| HTTP status | 85 × 200, 1 × 301 (`/paidadvertising-1`) |
| Missing canonical | **0** |
| Accidental `noindex` | **0** |
| Duplicate `<title>` | **0** |
| Duplicate meta description | **0** |
| Multiple H1 on a page | **0** |
| hreflang | none — correct for a single-language site |

## Canonicalisation — correct

```
https://eeatminds.in/  →  301  →  https://www.eeatminds.in/
canonical:                        https://www.eeatminds.in
```

Host consolidation is properly configured. An earlier index-based report claimed a
www/non-www split; that was stale index data and is withdrawn.

## robots.txt — well built

Genuinely above average for a Wix site:

- `Allow: /` with `Disallow: /_api/*`
- Googlebot/Bingbot: `Disallow: /_partials*`, `/pro-gallery-webapp/v1/galleries/*`
- `User-agent: PetalBot` → `Disallow: /`
- `Crawl-delay: 10` for AhrefsBot, SemrushBot, dotbot
- Sitemap declared

**Gap:** no directives for AI crawlers (GPTBot, ClaudeBot, PerplexityBot,
CCBot, Google-Extended). Under `User-agent: *  Allow: /` they are all permitted,
which is the right default for AI visibility — but it is implicit, not a decision.
Worth making explicit either way.

## Sitemap

Valid index → 3 children: `pages-sitemap.xml` (18), `blog-posts-sitemap.xml` (68),
`blog-categories-sitemap.xml` (1, duplicates `/blog`).

**Issue — redirect in sitemap.** `/paidadvertising-1` is listed but 301s to
`/seo-freelancer-in-bangalore`. Sitemaps should contain only canonical 200 URLs.
The slug is a leftover Wix auto-name. *Severity: Low.*

No `lastmod` values are present, so crawlers get no recrawl priority signal.

## Security headers

| Header | Status |
|---|---|
| `strict-transport-security` | ✅ `max-age=31556952` |
| `x-content-type-options` | ✅ `nosniff` |
| HTTPS + valid cert | ✅ |
| `content-security-policy` | ❌ absent |
| `x-frame-options` | ❌ absent |
| `referrer-policy` | ❌ absent |
| `permissions-policy` | ❌ absent |

The four missing headers are **not ranking factors**; they are hardening. On Wix
they are also largely outside your control — noted for completeness, not action.
*Severity: Low / informational.*

Server: `Pepyaka` (Wix), Fastly CDN in front (`server-timing: varnish;desc=hit_hit`).

## Crawler-access quirk — important for your own tooling

**Wix returns 429 to non-browser User-Agents.** Measured directly:

| User-Agent | Result |
|---|---|
| `SEO-audit/1.0` | **429 on all 86 URLs** |
| Chrome UA | 200 |

Wix additionally throttles sustained crawling regardless of UA: at 2s intervals
44/86 URLs failed; full coverage required 5s intervals with 20s backoff.

If Screaming Frog or Sitebulb has ever returned a wall of 429s against this site,
this is the cause. Set a browser UA and throttle to ~0.2 req/s.

## Verdict

The technical foundation is **solid**. Indexability, canonicalisation and
robots.txt are all correctly configured, and the only genuine defect is one
redirecting URL in the sitemap. Technical SEO is not what is holding this site
back.
