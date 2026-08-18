# Full SEO Audit — eeatminds.in

**Audited:** 2026-08-17 · **Method:** live crawl, 86/86 sitemap URLs (100% coverage)
**Business type:** Service-Area Business — solo-practitioner digital marketing consultancy, Bangalore, multi-city
**Platform:** Wix (Fastly CDN)

---

## SEO Health Score: **71 / 100**

| Category | Score | Weight | Contribution |
|---|---|---|---|
| Technical SEO | **90** | 22% | 22.0 |
| Content Quality | **68** | 23% | 17.4 |
| On-Page SEO | **76** | 20% | 16.9 |
| Schema / Structured Data | **45** | 10% | 5.0 |
| AI Search Readiness | **55** | 10% | 6.1 |
| Images | **72** | 5% | 4.0 |
| **Performance (CWV)** | **withheld** | 10% | — |

**Performance is deliberately unscored.** The keyless PageSpeed Insights quota was
exhausted (`429 Quota exceeded`) and CrUX requires an API key, so no LCP, INP or
CLS figures were obtainable. Rather than estimate, the category is excluded and
the score renormalised over the remaining 90%. Adding a guessed number would move
the headline figure without any evidence behind it.

---

## Executive summary

**This is a well-built site with one systemic gap.**

The technical foundation is genuinely strong — across 85 live pages there are zero
missing canonicals, zero accidental `noindex` tags, zero duplicate titles and zero
duplicate meta descriptions. Host canonicalisation is correct, `robots.txt` is
better constructed than most Wix sites, and the sitemap is valid. Technical SEO is
not what is holding this site back.

The gap is that **hand-built assets were never propagated across the site**.
Anything Wix automates is complete everywhere: all 68 blog posts carry
`BlogPosting` schema, every page has a unique title and meta description, images
are compressed and format-negotiated. Anything requiring manual work exists only
on the two or three oldest pages: structured data, FAQ markup, author attribution.

The clearest expression of this: **`/seo-freelancer-in-bangalore` — the page that
ranks — has 2,234 words and a full `ProfessionalService` + `FAQPage` entity. The
Chennai and Hyderabad city pages have comparable word counts (1,984 and 1,918) and
zero structured data.** The template exists, works, and is live on the domain. It
simply was not copied.

### Top 5 issues

1. **8 commercial pages have no structured data at all** — every geo page except
   Bangalore, every vertical page without exception. Verified with a JSON-LD parser.
2. **No author bylines or dates on any of the 68 blog posts** — on a site named
   *EEAT Minds*. Costs classic E-E-A-T and AI citability simultaneously.
3. **Four duplicate-topic page pairs live in the sitemap**, including a service
   page and a blog post on the identical Hyderabad slug where the post is 553
   words longer than the page meant to convert.
4. **Business email is `eeatminds.in@gmail.com`** — blocks Clutch and GoodFirms
   verification and gates the entire Foundation link campaign.
5. **`llms.txt` exists but lists only the homepage** — none of the 17 service
   pages or 68 articles.

### Top 5 quick wins

1. **Add an H1 to `/seo-service-for-dentists`** — one line, currently has none
2. **Alt text on `/ppc-services` (9/10 missing) and `/outsource-digital-marketing-services` (10/12)** — under an hour
3. **Trim the homepage meta description** — 247 chars, a third never displays
4. **301 the two singular/plural post pairs** into their longer versions
5. **Remove `/paidadvertising-1` from the sitemap** — it 301s away

---

## Technical SEO — 90/100

Clean across the board: 0 missing canonicals, 0 accidental `noindex`, 0 duplicate
titles or meta descriptions, correct `eeatminds.in → www` 301, valid sitemap index
with 3 children, well-built `robots.txt` (blocks PetalBot, `crawl-delay: 10` for
Ahrefs/Semrush/dotbot).

Deductions: one redirecting URL (`/paidadvertising-1`) listed in the sitemap; no
`lastmod` values anywhere; `Content-Security-Policy`, `X-Frame-Options`,
`Referrer-Policy` and `Permissions-Policy` absent — though these are hardening
rather than ranking factors and are largely outside your control on Wix.

**Operational note:** Wix returns **429 to non-browser User-Agents**. A crawler
identifying as `SEO-audit/1.0` got 429 on all 86 URLs; a Chrome UA got 200. Wix
also throttles sustained crawling — full coverage required 5s intervals. If
Screaming Frog has ever failed against this site, this is why.

→ `findings/technical.md`

## Content Quality — 68/100

Median 1,347 words across 86 pages; strong, verifiable E-E-A-T signals including a
**linked** Google Partner certification (`google.com/partners/agency?id=9715381965`),
12 named client logos, and a real named practitioner with 7 `sameAs` profiles
including two `.edu.in` author pages.

Deductions: **no visible author bylines or dates on 68 posts**; four duplicate
pairs; five thin commercial pages; two unsourced quantified claims — "ROI on SEO
alone can be 5-10x within 12 months" and a "340% higher citation rate in AI"
attributed to unpublished in-house research.

Thinnest money pages: `/freelance-web-designers-in-bangalore` (405),
`/social-media-marketing-for-doctors` (689), `/seo-service-for-dentists` (814),
`/ppc-services` (876), `/best-digital-marketer-in-india` (885) — against 2,234 for
the page that ranks.

→ `findings/content.md`

## On-Page SEO — 76/100

Zero duplicate titles and zero duplicate meta descriptions across 85 pages is
uncommon and reflects deliberate per-page authoring. 83 of 85 pages have exactly
one H1. URLs are clean and readable.

Deductions: 36 titles exceed 60 chars (42%); 25 meta descriptions exceed 160 chars
(homepage worst at 247) while 7 are under 70; `/seo-service-for-dentists` has **no
H1**; 121 of 974 images lack alt text.

→ `findings/onpage.md`

## Schema / Structured Data — 45/100

The homepage is excellent: a 4-node `@graph` with `LocalBusiness` +
`ProfessionalService`, full NAP, geo coordinates, opening hours, `contactPoint`
with 7 languages, `OfferCatalog`, and `@id` cross-referencing done properly.

But `ProfessionalService` appears on **3 pages of 85** and `FAQPage` on **1**.
Eight commercial pages have **zero** JSON-LD blocks — verified with a parser that
walks nested and array-form `@type`, after an earlier regex-based pass proved
unreliable.

Split by origin: Wix-automated markup (`BlogPosting` on all 68 posts) is complete;
hand-built markup exists only where someone added it manually.

→ `findings/schema.md`

## Performance — withheld

TTFB 0.19–0.51s (good, Fastly cache HIT). HTML compresses 1,325 KB → 194 KB.
Concerns: 388 KB of inline JS across 50 blocks; **35 of 36 images have no
width/height** (CLS risk); the above-fold logo is lazy-loaded.

**No LCP/INP/CLS obtainable.** Your Search Console Core Web Vitals report has this
data free and should be checked before acting on the CLS risk.

→ `findings/performance.md`

## AI Search Readiness — 55/100

`/llms.txt` exists (200) — ahead of most sites — but is Wix-auto-generated and
links **only the homepage**; roughly 80% of it is boilerplate Wix MCP documentation.
A Wix Site MCP endpoint at `/_api/mcp` lets agents query live content, a genuine
differentiator, though `robots.txt` disallows `/_api/*`, so the two files disagree.

All AI crawlers are permitted by default (`User-agent: * Allow: /`) — correct
posture, but implicit rather than declared.

Binding constraint: **no author attribution and no dates on 68 posts**. Assistants
preferentially cite attributed, dated content.

→ `findings/geo-ai-search.md`

## Images — 72/100

Delivery is excellent and needs no work: every sampled asset under 7 KB,
auto-resized, AVIF/WebP negotiated per request. 33 of 36 correctly lazy-loaded.

Deductions: 12.4% missing alt text (`/ppc-services` 9/10, `/outsource-digital-marketing-services`
10/12); no width/height attributes; logo lazy-loaded above the fold.

→ `findings/images.md`

## Local SEO

Well-formed local entity: complete NAP, geo coordinates matching Kalyan Nagar,
`areaServed` Bangalore/India/Worldwide, `contactPoint` in 7 languages.

Issues: **gmail.com business email** (blocks directory verification); hours
declared 00:00–23:59 seven days, rendering as "Open 24 hours" — not credible for a
solo practitioner; city pages carry no local schema.

**Google Business Profile not assessed** — requires the GBP API or DataForSEO Maps,
neither configured.

→ `findings/local.md`

## Search Experience & Intent

70% of the site is informational (60 of 85 pages), and those pages have a *higher*
median word count than the 13 that sell. Eight "best/top" listicles occupy
commercial-investigation intent alongside service pages — most notably
`/post/best-seo-freelancer-in-bangalore` (1,248 words) against
`/seo-freelancer-in-bangalore` (2,234), your primary money term.

`/contact` is 133 words — the final step before every lead, and the thinnest page
on the site.

→ `findings/sxo-intent.md`

---

## What this audit could not measure

Stated plainly rather than estimated:

| Missing | Blocker | How to unblock |
|---|---|---|
| LCP / INP / CLS | PSI keyless quota exhausted | GSC Core Web Vitals report (free), or a PSI API key |
| Impressions, clicks, positions | No GSC credentials | Service account, or paste a Performance CSV |
| Backlinks, DA, referring domains | Moz/DataForSEO reachable but keyless | Free Moz API key |
| Map-pack rank, reviews, GBP health | No GBP/Maps API | DataForSEO Maps, or manual GBP review |
| SERP page-type competition | No SERP API | Confirms the cannibalization hypotheses |
| Internal link graph | Crawl abandoned — Wix throttling made it ~25 min | Re-run at 5s intervals |
| `iswadesh.com` duplicate comparison | Not yet fetched | Direct comparison now possible |

The cannibalization findings in particular are **hypotheses derived from on-site
signals**. Confirm which URL Google actually favours in Search Console before
consolidating anything.
