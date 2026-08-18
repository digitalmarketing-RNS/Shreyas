# Content Quality & E-E-A-T — eeatminds.in

Method: full-text extraction from all 86 crawled pages + homepage signal analysis.

## Scale

| Metric | Value |
|---|---|
| Pages | 86 (18 pages, 68 posts) |
| Median word count | **1,347** |
| Mean | 1,502 |
| Longest | 5,708 words |
| Under 800 words | 8 pages |
| Under 500 words | 3 pages |

Median 1,347 words is healthy. This is not a thin-content site overall — the
problem is *where* the thin pages sit.

## E-E-A-T signals — strong, with two structural gaps

Present and clearly stated on the homepage:

| Signal | Status |
|---|---|
| Experience ("10+ years", "since 2015") | ✅ stated 6× |
| Credentials (Google Partner, Meta) | ✅ with a **verifiable link** to `google.com/partners/agency?id=9715381965` |
| Client proof ("66+ brands") | ✅ 12 named client logos |
| Team ("25+ specialists") | ✅ stated 16× |
| NAP (address, phone, locality) | ✅ 44 references |
| Named, real author identity | ✅ Shreyas V Patil, with 7 `sameAs` profiles |

The linked Google Partner verification is a genuine authority signal — most
competitors assert certification without a checkable link.

### Gap 1 — no author bylines or dates on 68 blog posts

Zero matches for "written by / author / reviewed on" and zero for "updated / last
modified" in page text. All 68 posts carry `BlogPosting` schema, but the visible
page shows no byline and no date.

For a site whose entire positioning is **E-E-A-T**, having no visible author
attribution on its content is the most incongruent finding in this audit.
Experience and Expertise are person-level signals; anonymous articles forfeit them.

*Severity: High. Fix: visible byline + published/updated date on every post,
linked to an author page, with `author` and `datePublished`/`dateModified` in the
`BlogPosting` schema.*

### Gap 2 — unsourced quantified claims

Two marketing statistics are stated as fact with no citation:

1. **"The ROI on SEO alone can be 5-10x your investment within 12 months."** (homepage)
2. **"…a 340% higher citation rate in AI"**, attributed to "our 2026 research at
   EEAT Minds" (`/post/eeat-seo-strategies-for-indian-tech-startups`)

The second is the sharper problem: it cites in-house research that does not appear
to be published. On a page arguing for *verifiable* technical authority, an
uncheckable statistic undercuts the argument.

Also unsourced: "typically 40-60% lower cost than a full-service agency."

*Severity: Medium. Fix: publish the research, cite a third-party source, or soften
to a range you can defend.*

## Thin pages that matter

Ranked by commercial importance, not word count:

| Page | Words | Why it matters |
|---|---|---|
| `/freelance-web-designers-in-bangalore` | **405** | Core service, thinnest money page on the site |
| `/social-media-marketing-for-doctors` | 689 | Vertical landing page |
| `/seo-service-for-dentists` | 814 | Vertical landing page, also missing H1 |
| `/ppc-services` | 876 | **Flagship service page** |
| `/best-digital-marketer-in-india` | 885 | National head term |

Benchmark: `/seo-freelancer-in-bangalore`, the page that actually ranks, is
**2,234 words** with full schema. That is the internal standard, and it works.

`/contact` (133 words) and `/terms-and-conditions` (445) are appropriately short —
ignore them.

### Thinnest posts

`/post/how-to-improve-your-website-google-ranking-in-bangalore` (511),
`/post/what-is-directory-submission-in-seo` (785),
`/post/hire-digital-marketing-freelancer-in-india` (788),
**`/post/what-is-eeat-in-seo` (790)**.

That last one is awkward: the site is named EEAT Minds and its own explainer of
E-E-A-T is among its thinnest articles.

## Duplicate-topic pairs — four confirmed

All live 200s with real content on both sides.

| Pair | Words | Recommendation |
|---|---|---|
| `/post/on-page-optimization-service` | 1,100 | 301 → the longer one |
| `/post/on-page-optimization-service**s**` | **2,336** | keep |
| `/post/which-on-page-element-carries…` | **1,572** | keep |
| `/post/which-on-page-element**s**-carry…` | 1,117 | 301 → the longer one |
| `/digital-marketing-freelancer-in-hyderabad` (service) | 1,918 | **check GSC first** |
| `/post/digital-marketing-freelancer-in-hyderabad` (post) | **2,471** | |
| `/post/digital-marketing-freelancers-in-india` | 1,132 | review, may be distinct intent |
| `/post/hire-digital-marketing-freelancer-in-india` | 788 | |

The Hyderabad pair is the serious one: a **service page and a blog post on the
identical slug**, and the post is 553 words longer than the page meant to convert.

## Readability

Homepage: 2,446 visible words, 133 sentences, **avg 18.0 words/sentence** — a
comfortable, scannable register appropriate for a business audience. No issue.

## Cross-domain duplication

`/post/digital-marketing-freelancers-in-india` also appears on `iswadesh.com`
under the same slug with the same opening. `rnsfgc.edu.in` lists Shreyas as
founder of both EEAT Minds and iSwadesh, so this is likely self-syndication.
If both are yours, one needs a cross-domain canonical. **Not yet verified against
the live iswadesh.com page.**
