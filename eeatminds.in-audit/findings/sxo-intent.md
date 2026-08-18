# Search Experience & Intent Mapping — eeatminds.in

Method: page-type and intent classification across all 85 live pages, plus
title-keyword overlap analysis between blog posts and service pages.

**Limitation:** true SXO requires live SERP data to see what page *type* Google
rewards per query. No SERP API is configured (DataForSEO reachable but keyless),
so this section maps intent from on-site signals only. Treat the competition
findings as hypotheses to confirm in Search Console, not as measured losses.

## Intent distribution

| Intent | Pages | Median words |
|---|---|---|
| Informational | **60** | 1,355 |
| Commercial-transactional (service pages) | 13 | 1,275 |
| Commercial-investigation (listicles, "best/top") | 8 | 1,248 |
| Utility (`/blog`, legal) | 3 | 1,489 |
| Transactional (`/contact`) | 1 | 133 |

**70% of the site is informational.** That is a legitimate strategy — the blog
attracts top-of-funnel traffic that service pages cannot — but note the imbalance:
the informational pages have a *higher* median word count (1,355) than the pages
that actually sell (1,275). Editorial effort is going into the half of the site
that does not convert.

## The core problem: listicles competing with money pages

Eight "best/top" posts sit in commercial-investigation intent — the same intent
band as the service pages. Overlaps found:

### Highest concern

| Competing post | Words | Target money page | Words |
|---|---|---|---|
| **`/post/best-seo-freelancer-in-bangalore`** | 1,248 | **`/seo-freelancer-in-bangalore`** | 2,234 |

These share `seo` + `freelancer` + `bangalore` — your **primary money keyword**.
A blog post and a service page both targeting "SEO freelancer in Bangalore" means
Google chooses, and the wrong winner sends commercial traffic to an article
instead of a sales page.

The money page is stronger here (2,234 vs 1,248 words, full schema), so this may
already resolve correctly — but it must be confirmed in GSC, not assumed.

### Other overlaps

| Post | Words | Overlaps |
|---|---|---|
| `/post/top-5-freelance-digital-marketer-bangalore` | 872 | `/`, `/best-digital-marketer-in-india`, `/freelance-web-designers-in-bangalore` |
| `/post/top-digital-marketing-freelancers-in-chennai` | 1,040 | **`/digital-marketing-freelancer-in-chennai`** (shares `chennai`+`digital`+`marketing`) |
| `/post/digital-marketing-freelancers-in-india` | 1,132 | `/`, both city pages, `/outsource-digital-marketing-services` |
| `/post/freelance-digital-marketing-websites` | 2,641 | `/`, both city pages, `/freelance-social-media-marketing` |

The Chennai pair mirrors the Hyderabad problem documented in `content.md`: a
listicle and a city service page chasing the same geo-commercial query.

## Why this pattern exists

These listicles rank EEAT Minds within roundups of competitors — a common tactic
for capturing "best X" searches. It works, but it has a cost: it puts your own
content in the same SERP slot your service page needs.

**The strategic question is which page you want to own each geo-commercial term.**
That is a decision, not a defect — but it should be made deliberately per city,
with GSC impression data, rather than left to Google.

## Page-type appropriateness

| Query type | Right page type | What you have |
|---|---|---|
| "seo freelancer in bangalore" | Service page | ✅ 2,234 words, full schema |
| "digital marketing freelancer in chennai" | Service page | ⚠️ 1,984 words, **schema unverified** |
| "seo services for dentists" | Service page | ⚠️ 814 words, **no H1** |
| "what is e-e-a-t in seo" | Article | ⚠️ 790 words — thin for the site's namesake topic |
| "hire digital marketer" | Service/contact | ⚠️ `/contact` is 133 words with no supporting copy |

## Conversion path

`/contact` is 133 words — essentially a bare form. Every service page routes here.
For a consultancy selling trust-led services, the final conversion step carries no
reinforcing proof: no testimonials, no response-time commitment, no pricing
context, no credential restatement.

*Severity: Medium. This is the last step before a lead, and it is the thinnest
page on the site.*

## Recommended sequence

1. Pull GSC query data for each geo-commercial term and see **which URL Google
   currently picks** — post or service page
2. Where the post wins a commercial query, either merge it into the service page
   or de-optimise its title away from the money term
3. Strengthen `/contact` with proof elements
4. Rebalance editorial effort toward the 13 pages that convert
