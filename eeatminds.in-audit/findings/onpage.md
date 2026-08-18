# On-Page SEO — eeatminds.in

Measured across 85 live pages.

## Clean

| Check | Result |
|---|---|
| Missing `<title>` | 0 |
| Missing meta description | 0 |
| Duplicate `<title>` | **0** |
| Duplicate meta description | **0** |
| Pages with >1 H1 | 0 |

Zero duplicate titles and zero duplicate meta descriptions across 85 pages is
uncommon and indicates deliberate per-page authoring. Credit where due.

## Title tags

```
min 17   median 59   max 82 characters
<30 chars:    3 pages
30-60 chars: 46 pages   ← the healthy band
>60 chars:   36 pages   (42%)
```

**36 titles will truncate in SERPs.** Longest offenders:

| Chars | Page |
|---|---|
| 82 | `/post/consumer-behaviour-in-digital-marketing` |
| 75 | `/post/features-of-online-marketing` |
| 73 | `/post/digital-marketing-freelancer-in-hyderabad` |
| 71 | `/post/digital-marketing-strategies-business-owners` |
| 70 | `/post/digital-marketing-services` |

*Severity: Low. Truncation costs click-through, not ranking. Batch-fix when
touching these pages for other reasons.*

## Meta descriptions

**25 exceed 160 characters** and will be cut off. The homepage is the worst:

| Chars | Page |
|---|---|
| **247** | `/` — the homepage |
| 243 | `/digital-marketing-freelancer-in-hyderabad` |
| 241 | `/digital-marketing-freelancer-in-chennai` |
| 196 | `/post/eeat-seo-strategies-for-indian-tech-startups` |
| 185 | `/real-estate-seo-services` |

A 247-character homepage description means roughly a third of your most important
snippet never appears. *Severity: Low-Medium — trivial to fix, directly affects CTR.*

**7 are under 70 characters** and waste available space:

| Chars | Page |
|---|---|
| 17 | `/post/which-seo-plugin-is-best-for-wordpress` |
| 20 | `/post/on-page-optimization-service` |
| 28 | `/seo-service-for-dentists` |

## Heading structure

83 of 85 pages have exactly one H1. Two do not:

- **`/seo-service-for-dentists` — no H1 at all.** A commercial vertical page with
  no H1, no schema, and 814 words. Weakest page on the site by combined measure.
  *Severity: Medium-High. One-line fix.*
- `/blog` — no H1 on the listing page. *Severity: Low.*

## Images and alt text

**121 of 974 images (12.4%) have no alt attribute.**

| Page | Missing | Total |
|---|---|---|
| `/best-digital-marketer-in-india` | **24** | 44 |
| `/freelance-social-media-marketing` | **14** | 35 |
| `/seo-freelancer-in-bangalore` | 12 | 125 |
| `/outsource-digital-marketing-services` | **10** | 12 |
| `/ppc-services` | **9** | 10 |

`/ppc-services` and `/outsource-digital-marketing-services` are effectively
alt-text-free. Accessibility obligation first; image-search visibility second.

Where alt text *is* present it is well written — homepage examples include
"EEAT-focused digital marketing freelancer in Bangalore" and named client logos.
The gap is coverage, not quality.

*Severity: Medium.*

## URL structure

Clean, readable, keyword-relevant, lowercase, hyphenated. Blog posts sit under
`/post/`, service pages at root. No parameters, no session IDs, no deep nesting.

One exception: **`/paidadvertising-1`** — a Wix auto-generated slug, now 301'd to
`/seo-freelancer-in-bangalore` but still listed in the sitemap.

## Slug collisions

`/digital-marketing-freelancer-in-hyderabad` exists as **both** a service page and
a blog post at `/post/digital-marketing-freelancer-in-hyderabad`. Identical slug,
identical target keyword. See `content.md` for the full duplicate-pair analysis.
