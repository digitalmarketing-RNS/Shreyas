# Action Plan — eeatminds.in

Ordered by impact ÷ effort. Every item traces to verified evidence in `findings/`.

**Before starting:** open Search Console. Three items below (P1.5, P2.1, P3.1)
depend on knowing which URL Google currently favours, and guessing wrong means
301-ing away the page that was winning.

---

## Phase 1 — Quick wins (Week 1, ~3 hours total)

| # | Action | Page(s) | Effort | Evidence |
|---|---|---|---|---|
| 1.1 | **Add an H1** | `/seo-service-for-dentists` | 5 min | Only page of 85 with none |
| 1.2 | **Add alt text** | `/ppc-services` (9 of 10 images), `/outsource-digital-marketing-services` (10 of 12) | 45 min | 121/974 missing site-wide |
| 1.3 | **Trim meta description to ~155 chars** | `/` (247), `/digital-marketing-freelancer-in-hyderabad` (243), `/digital-marketing-freelancer-in-chennai` (241) | 20 min | A third of the homepage snippet never displays |
| 1.4 | **Remove `/paidadvertising-1` from the sitemap** | `pages-sitemap.xml` | 5 min | Listed but 301s away |
| 1.5 | **301 the singular/plural twins** | `/post/on-page-optimization-service` → `-services` (1,100→2,336 words); `/post/which-on-page-element-carries…` ← `-elements-carry…` (keep 1,572) | 20 min | Confirmed live duplicates |
| 1.6 | **Set `loading="eager"` on the logo** | site-wide header | 10 min | Above-fold image is lazy-loaded |
| 1.7 | **Fix declared opening hours** | homepage schema | 10 min | 00:00–23:59 × 7 renders as "Open 24 hours" |

> 1.5 assumes the longer page is the stronger one. **Check GSC impressions first** —
> if the shorter URL earns the traffic, redirect the other way.

## Phase 2 — Highest-impact fix (Weeks 2–3)

### 2.1 Propagate structured data to the 8 empty commercial pages ★ top priority

Clone the `@graph` from `/seo-freelancer-in-bangalore`, changing `name`,
`description`, `areaServed` and service type per page:

| Page | Words | Needs |
|---|---|---|
| `/digital-marketing-freelancer-in-chennai` | 1,984 | `ProfessionalService`, `areaServed: Chennai`, `FAQPage` |
| `/digital-marketing-freelancer-in-hyderabad` | 1,918 | `ProfessionalService`, `areaServed: Hyderabad`, `FAQPage` |
| `/real-estate-seo-services` | 1,588 | `Service`, `FAQPage` |
| `/outsource-digital-marketing-services` | 1,275 | `Service`, `FAQPage` |
| `/seo-services-for-doctors` | 1,224 | `Service`, `FAQPage` |
| `/best-digital-marketer-in-india` | 885 | `ProfessionalService`, `areaServed: India` |
| `/seo-service-for-dentists` | 814 | `Service`, `FAQPage` |
| `/social-media-marketing-for-doctors` | 689 | `Service`, `FAQPage` |

Plus `Service` nodes on `/ppc-services` and `/freelance-web-designers-in-bangalore`,
which currently carry breadcrumbs only.

**Why first:** highest impact, lowest effort, zero authoring risk. The template is
already live and proven on this domain. Two substantial city pages are competing
on text alone while Bangalore has the full entity treatment.

*Effort: ~4 hours. Validate each with Google's Rich Results Test.*

### 2.2 Add visible bylines and dates to all 68 posts

Byline linking to an author page, plus published and updated dates, with
`author` / `datePublished` / `dateModified` in the existing `BlogPosting` schema.

**Why:** this single change serves three scored categories — Content (E-E-A-T),
AI Search Readiness (citability), and Schema completeness. On a site named
*EEAT Minds*, anonymous undated articles are the most incongruent finding in the
audit.

*Effort: template change + backfill dates.*

### 2.3 Author a real `llms.txt`

Replace the Wix default (which links only the homepage) with a hand-written file
listing all 17 service pages and your best articles, each with a one-line
description. Reconcile `Disallow: /_api/*` against the MCP endpoint the file
advertises.

*Effort: 1 hour. Single file, disproportionate GEO return.*

### 2.4 Switch to a branded email

`eeatminds.in@gmail.com` → `shreyas@eeatminds.in`, then update the homepage schema,
contact page and footer.

**Why:** gates Clutch and GoodFirms verification, and therefore the whole Foundation
link campaign already staged in `../backlinks/`. Your own tracker flags this as
`move 0, priority 1`.

## Phase 3 — Content depth (Month 2)

### 3.1 Resolve the geo-commercial conflicts — GSC data required first

| Money page | Competing post | Words |
|---|---|---|
| `/digital-marketing-freelancer-in-hyderabad` (1,918) | `/post/digital-marketing-freelancer-in-hyderabad` (**2,471**) | identical slug |
| `/digital-marketing-freelancer-in-chennai` (1,984) | `/post/top-digital-marketing-freelancers-in-chennai` (1,040) | shares chennai+digital+marketing |
| `/seo-freelancer-in-bangalore` (2,234) | `/post/best-seo-freelancer-in-bangalore` (1,248) | **primary money term** |

Pull impressions per URL per query. Where a post wins a commercial query, either
merge it into the service page or de-optimise its title away from the money term.

### 3.2 Expand the thin money pages

Target the 2,234-word depth of the page that ranks:

`/freelance-web-designers-in-bangalore` (405) · `/social-media-marketing-for-doctors`
(689) · `/seo-service-for-dentists` (814) · `/ppc-services` (876) ·
`/best-digital-marketer-in-india` (885)

`/ppc-services` and `/freelance-web-designers-in-bangalore` first — both are core
offerings.

### 3.3 Strengthen `/contact`

133 words, bare form. Add testimonials, a response-time commitment, pricing
context and a credential restatement. It is the last step before every lead.

### 3.4 Source or soften the unsupported claims

- "ROI on SEO alone can be 5-10x your investment within 12 months" (homepage)
- "340% higher citation rate in AI", attributed to unpublished in-house research
- "40-60% lower cost than a full-service agency"

Publish the research, cite a third party, or soften to a defensible range. On a
site selling E-E-A-T, uncheckable statistics work against the pitch.

### 3.5 Fix remaining alt text and long titles

97 remaining missing alts (start `/best-digital-marketer-in-india`, 24); 36 titles
over 60 chars. Batch these while editing pages for other reasons.

## Phase 4 — Measurement (ongoing)

| # | Action | Unblocks |
|---|---|---|
| 4.1 | Check **GSC Core Web Vitals** report | The only unscored category. Free, no key. Tells you whether the missing image dimensions actually cost anything |
| 4.2 | Add a **free Moz API key** | Backlink health score — `../backlinks/04-eeatminds-foundation.md` is blocked only by this now |
| 4.3 | Connect **GSC** properly | Everything in Phase 3.1 |
| 4.4 | Audit **Google Business Profile** | Entirely unmeasured; your tracker calls it the highest-leverage local asset |
| 4.5 | Compare `iswadesh.com` duplicate | Decide canonical or differentiate |
| 4.6 | Re-run the internal link crawl | Abandoned — Wix throttling. Use 5s intervals and a browser UA |

---

## If you only do three things

1. **Phase 2.1** — schema on the 8 empty commercial pages. Four hours, template already exists.
2. **Phase 2.2** — bylines and dates on 68 posts. Fixes three categories at once.
3. **Phase 4.1** — open the GSC Core Web Vitals report. Free, and it closes the one gap this audit could not measure.
