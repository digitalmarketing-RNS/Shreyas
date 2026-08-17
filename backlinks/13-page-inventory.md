# EEAT Minds — Verified Technical Audit

Target: `https://www.eeatminds.in/`
Method: **live crawl**, all 86 sitemap URLs fetched and parsed. 2026-08-17.
Per-page data: `14-crawl-data.csv`

**Coverage: 86/86 URLs retrieved (100%).** 85 returned 200; 1 is a redirect.

---

## Status of this document

This **replaces** an earlier version of this file that was built from search-index
data because the site was unreachable. The environment's network access was
changed from **Trusted** to allow the domain, so everything below is now measured
from live HTTP responses rather than inferred from a cache.

### Three findings from the index-based version are withdrawn

Recording these because they were wrong in an instructive way — every one looked
like a real defect and none was.

| Withdrawn claim | What the live data shows |
|---|---|
| "www/non-www split leaking link equity" | `eeatminds.in` **301s** to `https://www.eeatminds.in/`, canonical `https://www.eeatminds.in`. **Correct.** The non-www URL in the index was stale. |
| "`/ppc-freelancers` cannibalizes `/ppc-services`" | `/ppc-freelancers` **301s** to `/ppc-services`. **Already consolidated.** |
| "`/freelancer-for-social-media-marketing` cannibalizes" | **301s** to `/freelance-social-media-marketing`. **Already consolidated.** |

A fourth near-miss: analysis initially flagged a duplicate title and canonical
mismatch on `/paidadvertising-1`. Both were artifacts of the crawler *following*
its 301 and measuring the destination twice. Not defects.

**The lesson worth keeping:** search-index data reports URLs that no longer serve
content. It cannot distinguish "this is broken" from "this was fixed and the index
hasn't caught up." Never diagnose canonicalization or duplication from it.

### Reachability, corrected

| Route | Status |
|---|---|
| Direct fetch of the site | ✅ **works** (was blocked) |
| `api.firecrawl.dev` | ✅ 200 |
| `api.dataforseo.com` | ✅ reachable (401 — needs key) |
| `api.moz.com` | ✅ reachable (404 on root — needs key) |
| Firecrawl connector (search only) | ✅ works, no scrape tool |

This supersedes the "every tier unreachable" line in `04-eeatminds-foundation.md`.
The backlink health score is still unscored, but now for a different reason: the
APIs are reachable and **only the keys are missing**.

### Crawling this site — operational note

Wix rejects non-browser User-Agents. A crawler identifying as `SEO-audit/1.0` got
**429 on all 86 URLs**; the identical request with a Chrome UA got 200. Wix also
throttles sustained crawling regardless of UA — 2s intervals lost 44/86, and full
coverage needed 5s intervals with 20s for the stragglers.

**If Screaming Frog or Sitebulb has ever returned a wall of 429s on this site,
this is why.** Set a browser UA and throttle to ~0.2 req/s.

---

## What is clean

Measured across all 85 live pages. This is a genuinely well-maintained site:

| Check | Result |
|---|---|
| Missing canonical | **0** |
| Accidental `noindex` | **0** |
| Duplicate `<title>` | **0** |
| Duplicate meta description | **0** |
| Missing `<title>` | **0** |
| Missing meta description | **0** |
| Multiple H1 on one page | **0** |
| Non-www → www redirect | correct 301 |
| `robots.txt` | well-built: blocks PetalBot, `crawl-delay: 10` for Ahrefs/Semrush/dotbot, `Disallow: /_api/*` |
| `sitemap.xml` | valid index → 3 child sitemaps |

Zero duplicate titles across 85 pages is unusual and worth noting.

---

## Finding 1 — 10 pages carry no structured data, and 8 are money pages

**Severity: high. This is the most valuable fix on the list.**

Schema is present on the homepage and `/seo-freelancer-in-bangalore`, and on all
64 blog posts (`BlogPosting` + `Organization` + `ImageObject`). It is **absent
entirely** from almost every service page:

| Page | Words | Schema |
|---|---|---|
| `/best-digital-marketer-in-india` | 885 | **none** |
| `/digital-marketing-freelancer-in-chennai` | 1,984 | **none** |
| `/digital-marketing-freelancer-in-hyderabad` | 1,918 | **none** |
| `/real-estate-seo-services` | 1,588 | **none** |
| `/seo-services-for-doctors` | 1,224 | **none** |
| `/seo-service-for-dentists` | 814 | **none** |
| `/social-media-marketing-for-doctors` | 689 | **none** |
| `/outsource-digital-marketing-services` | 1,275 | **none** |
| `/privacy-policy`, `/terms-and-conditions` | — | none (fine, ignore) |

`ProfessionalService` appears on exactly **2 pages** of 85. `FAQPage` on **1**.

For a local service business, `LocalBusiness`/`ProfessionalService` with
`areaServed` is what feeds map-pack and rich-result eligibility. Every geo page
you have — Chennai, Hyderabad — and every vertical page — doctors, dentists, real
estate — is invisible to that.

The template exists and works: `/seo-freelancer-in-bangalore` carries
`ProfessionalService` + `FAQPage` + `BreadcrumbList` + `City` + `Country` +
`PostalAddress`. **The fix is applying it to the other eight**, not authoring
anything new.

Worth noting: the site publishes `/post/schema-markup-best-practices` and
`/post/what-is-eeat-in-seo`. These pages don't follow either.

---

## Finding 2 — four duplicate-topic page pairs, all live and all in the sitemap

**Severity: high.** Unlike the withdrawn claims, these are confirmed live 200s
with real content on both sides.

**a) Singular/plural twins — same topic, both indexable**

| URL | Words | Title |
|---|---|---|
| `/post/on-page-optimization-service` | 1,100 | On-Page Optimization Services \| Boost Your Website's SEO |
| `/post/on-page-optimization-service**s**` | **2,336** | Expert On Page Optimization Services \| Eeat Minds |

Near-identical slugs (0.99 similarity), same subject, and the titles overlap.
Keep the 2,336-word version, 301 the shorter one into it.

**b) Second singular/plural pair**

| URL | Words |
|---|---|
| `/post/which-on-page-element-carrie**s**-the-most-weight-for-seo` | **1,572** |
| `/post/which-on-page-element**s**-carry-the-most-weight-for-seo` | 1,117 |

Same question, two spellings, both live. Consolidate into the 1,572-word one.

**c) A service page and a blog post on the identical slug — worst of the four**

| URL | Type | Words |
|---|---|---|
| `/digital-marketing-freelancer-in-hyderabad` | **service page** | 1,918 |
| `/post/digital-marketing-freelancer-in-hyderabad` | blog post | **2,471** |

Same slug, same money keyword, and **the blog post is 553 words longer than the
service page it competes with**. Google is being asked to choose between them, and
the blog post is the stronger document — so the page that converts is likely
losing to the page that doesn't. Also note the service page has **no schema**
while the post has `BlogPosting`.

This one is worth checking in GSC before acting: see which URL actually earns the
Hyderabad impressions, then consolidate toward the service page (add the post's
depth to it, 301 the post).

**d) Overlapping India-freelancer posts**

`/post/digital-marketing-freelancers-in-india` (1,132) and
`/post/hire-digital-marketing-freelancer-in-india` (788). Lower confidence —
"top 10 list" vs "why hire" are defensibly different intents. Review rather than
merge blindly.

---

## Finding 3 — thin money pages

**Severity: medium-high.** Service pages ranked by word count, thinnest first:

| Page | Words | Note |
|---|---|---|
| `/contact` | 133 | fine — contact pages should be short |
| **`/freelance-web-designers-in-bangalore`** | **405** | money page, dangerously thin |
| `/social-media-marketing-for-doctors` | 689 | + no schema |
| `/seo-service-for-dentists` | 814 | + no schema + **no H1** |
| **`/ppc-services`** | **876** | flagship service page, + 9/10 images lack alt |
| `/best-digital-marketer-in-india` | 885 | + no schema + 24/44 images lack alt |

For comparison, `/seo-freelancer-in-bangalore` — the page that actually ranks — is
**2,234 words** with full schema. That is the internal benchmark, and it shows what
the pattern looks like when done properly.

`/ppc-services` and `/freelance-web-designers-in-bangalore` stand out: both are
core commercial offerings sitting at under 900 words.

**Thinnest blog posts:** `/post/how-to-improve-your-website-google-ranking-in-bangalore`
(511), `/post/what-is-directory-submission-in-seo` (785),
`/post/hire-digital-marketing-freelancer-in-india` (788),
`/post/what-is-eeat-in-seo` (790).

That last one is awkward — the site is named EEAT Minds and its explainer on
E-E-A-T is one of its thinnest pages.

---

## Finding 4 — missing H1

**Severity: medium.** Two pages have no `<h1>`:

- **`/seo-service-for-dentists`** — a money page with no H1, no schema, and 814 words
- `/blog` — listing page; lower priority but still a gap

The other 83 pages each have exactly one H1, so this is an oversight on two pages,
not a template fault.

---

## Finding 5 — alt text gaps

**Severity: medium.** **121 of 974 images (12.4%) have no alt attribute.**

Worst offenders:

| Page | Missing alt |
|---|---|
| `/best-digital-marketer-in-india` | **24 / 44** |
| `/freelance-social-media-marketing` | **14 / 35** |
| `/seo-freelancer-in-bangalore` | 12 / 125 |
| `/outsource-digital-marketing-services` | **10 / 12** |
| `/ppc-services` | **9 / 10** |

`/ppc-services` and `/outsource-digital-marketing-services` are nearly
alt-text-free. Accessibility issue first, image-search loss second.

---

## Finding 6 — 36 of 85 titles exceed 60 characters

**Severity: low.** 42% will truncate in SERPs. Longest:

| Chars | Page |
|---|---|
| 81 | `/post/consumer-behaviour-in-digital-marketing` |
| 75 | `/post/features-of-online-marketing` |
| 73 | `/post/digital-marketing-freelancer-in-hyderabad` |
| 71 | `/post/digital-marketing-strategies-business-owners` |
| 70 | `/post/digital-marketing-services` |

Cosmetic relative to Findings 1–3. Worth a pass when touching these pages anyway.

---

## Finding 7 — a redirect listed in the sitemap

**Severity: low.** `/paidadvertising-1` is in `pages-sitemap.xml` but 301s to
`/seo-freelancer-in-bangalore`. Sitemaps should list only canonical 200 URLs.
The slug looks like a leftover Wix auto-name; remove it from the sitemap.

---

## Site shape

**86 URLs:** 18 pages + 68 blog posts (+1 blog-categories entry duplicating `/blog`).

**Service pages (17 live + 1 redirect):** home, `/seo-freelancer-in-bangalore`,
`/best-digital-marketer-in-india`, `/digital-marketing-freelancer-in-chennai`,
`/digital-marketing-freelancer-in-hyderabad`, `/ppc-services`,
`/freelance-social-media-marketing`, `/freelance-web-designers-in-bangalore`,
`/real-estate-seo-services`, `/seo-services-for-doctors`,
`/seo-service-for-dentists`, `/social-media-marketing-for-doctors`,
`/outsource-digital-marketing-services`, `/contact`, `/blog`, `/privacy-policy`,
`/terms-and-conditions`, and `/paidadvertising-1` (301).

**Geo coverage:** Bangalore, Chennai, Hyderabad, plus national India.
**Verticals:** doctors (SEO + social), dentists, real estate.

The medical vertical is the newest-looking cluster and also the weakest on every
measure — no schema, thinnest copy, missing H1. It reads like pages shipped
without the template the older pages use.

---

## Priority order

1. **Add `ProfessionalService` + `FAQPage` schema to the 8 money pages** — clone
   the `/seo-freelancer-in-bangalore` block, swap `areaServed` and service names.
   Biggest gain, lowest effort, template already proven on-site.
2. **Consolidate the two singular/plural post pairs** — 301 shorter into longer.
3. **Resolve the Hyderabad service-page vs blog-post conflict** — check GSC first.
4. **Add an H1 to `/seo-service-for-dentists`.** One line.
5. **Expand `/ppc-services` and `/freelance-web-designers-in-bangalore`** toward the
   2,000+ word depth of the page that already ranks.
6. **Fix alt text** — start with `/ppc-services` (9/10) and
   `/outsource-digital-marketing-services` (10/12).
7. Trim the 36 long titles; drop `/paidadvertising-1` from the sitemap.

Items 1–4 are mechanical and could be done in a session. Item 5 is real writing.

---

## Still not measured

The crawl covers on-page HTML. Not covered:

- **Core Web Vitals / field data** — needs PageSpeed or CrUX API (reachable, needs key)
- **Impressions, clicks, positions** — needs GSC. **Required** to resolve Finding 2c properly
- **Backlinks / domain authority** — Moz and DataForSEO now reachable, keys missing.
  `04-eeatminds-foundation.md`'s blocked health score is unblocked by a key
- **Rendered-DOM differences** — this crawl parsed served HTML. Wix hydrates client-side,
  so a headless-browser pass could differ. Schema and canonical were found in the
  served HTML, so the main conclusions hold
- **`iswadesh.com` cross-domain duplicate** — the domain is now reachable; not yet compared
