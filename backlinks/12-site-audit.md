# eeatminds.in — site audit

Audited 2026-08-17 from the indexed page inventory plus the live SERP you
supplied. **The site is still refused by this session's network policy** (curl
returns 000 on both apex and www), so nothing below rests on rendered HTML.
Everything here is observable from search. What still needs your paste is listed
at the end and it is short.

---

## The structural problem: you have built two pages for every service

This is the headline. Not a title tweak, an architecture fault, and it is
repeated three times.

| Service | Page A | Page B |
|---|---|---|
| SEO | `/seo-freelancer-in-bangalore` | `/seo-expert-in-bangalore` |
| PPC | `/ppc-services` | `/ppc-freelancers` |
| Social | `/freelance-social-media-marketing` | `/freelancer-for-social-media-marketing` |

Each pair targets one search intent. "SEO freelancer in Bangalore" and "SEO
expert in Bangalore" return substantially the same results. So do the two PPC
phrasings and the two social phrasings. Google has to choose one page per pair,
your internal links and any external links split between them, and neither page
accumulates the authority one page would have had.

You are not competing with Lucky Suthar on these terms. You are competing with
yourself, and then with him.

**Fix, per pair:**

1. Open Search Console, Performance, Pages. Filter to each URL pair
2. Keep the URL with more impressions. If both are near zero, keep the one whose
   slug matches the phrasing people actually search, which is "freelancer" in
   all three cases given how the rest of your site is positioned
3. Merge any unique content from the loser into the winner
4. **301** the loser to the winner. Not a canonical, a redirect. You want the URL gone
5. Update every internal link that pointed at the loser
6. Resubmit the sitemap

Do this before any other on-page work. Everything else compounds on top of it.

---

## Page-by-page title audit

Current state of all eleven indexed pages:

| URL | Current title | Len | Issue |
|---|---|---|---|
| `/` | Hire Digital Marketer Bangalore \| Shreyas V Patil | 49 | **Missing target keyword** |
| `/seo-freelancer-in-bangalore` | SEO Freelancer in Bangalore, India \| Rank #1 with Shreyas | 57 | "Rank #1" is an outcome promise |
| `/seo-expert-in-bangalore` | SEO Expert in Bangalore \| SEO Freelancers \| Eeat minds | 54 | Duplicate intent, brand miscased |
| `/ppc-services` | Top PPC Services in Bangalore \| ROI-Driven Ad Strategies | 56 | No brand, no "freelancer" |
| `/ppc-freelancers` | PPC Freelancer services \| Paid advertising services | 51 | No location, no brand, duplicate intent |
| `/freelance-social-media-marketing` | Freelance Social Media Marketing In Bangalore, India \| Eeat Minds | 65 | Truncates, brand miscased |
| `/freelancer-for-social-media-marketing` | Best freelancer for social media marketing Services | 51 | No location, no brand, duplicate intent |
| `/freelance-web-developers-india` | Web development freelancers \| Freelance web developers india \| Web developers in bangalore | **90** | Three keyword phrases, badly stuffed |
| `/digital-marketing-freelancer-in-hyderabad` | Digital Marketing Freelancer In Hyderabad \| EEAT Minds | 54 | Fine |
| `/digital-marketing-freelancer-in-chennai` | Digital Marketing Freelancer in Chennai \| EEAT Minds | 52 | Fine |
| `/post/digital-marketing-freelancers-in-india` | Top10 Digital Marketing Freelancers in India 2026 | 49 | Competes with your service pages |

**Two systemic faults across that table:**

**Brand casing appears three ways** across your own titles: `EEAT Minds`,
`Eeat Minds`, `Eeat minds`. For a business whose entire strategy rests on entity
recognition, and whose name is literally the E-E-A-T acronym, this is the worst
possible detail to get wrong. Google and AI search build an entity from
consistent naming. Pick `EEAT Minds` and use it everywhere, including schema,
directory listings and social profiles.

**Seven of eleven titles carry no brand at all.** Every one of those is a missed
brand impression on a SERP where you are competing with named individuals.

---

## Replacement titles

All length-checked. Use after the redirects, not before.

| Page | New title | Len |
|---|---|---|
| `/` | `Digital Marketing Freelancer in Bangalore \| Shreyas V Patil` | 59 |
| `/seo-freelancer-in-bangalore` | `SEO Freelancer in Bangalore \| Shreyas V Patil, EEAT Minds` | 57 |
| `/ppc-services` | `PPC & Google Ads Freelancer in Bangalore \| EEAT Minds` | 53 |
| `/freelance-social-media-marketing` | `Social Media Marketing Freelancer in Bangalore \| EEAT Minds` | 59 |
| `/freelance-web-developers-india` | `Freelance Web Developer in Bangalore \| EEAT Minds` | 49 |
| `/digital-marketing-freelancer-in-hyderabad` | `Digital Marketing Freelancer in Hyderabad \| EEAT Minds` | 54 |
| `/digital-marketing-freelancer-in-chennai` | `Digital Marketing Freelancer in Chennai \| EEAT Minds` | 52 |
| New: `/digital-marketing-freelancer-in-india` | `Digital Marketing Freelancer in India \| Shreyas V Patil` | 55 |
| New: `/pricing` | `Digital Marketing Freelancer Cost in Bangalore \| EEAT Minds` | 59 |

**On "Rank #1 with Shreyas":** drop it. It is a ranking guarantee in a title tag.
Google's own third-party-tools guidance states no tool or provider can guarantee
rankings, and sophisticated buyers read it as a red flag rather than confidence.
Replace the promise with evidence: the pricing, the years, a named result.

---

## Homepage: the specific changes

**1. Title.** As above. Your current title omits the exact phrase every
competitor ranking above you includes. This is the single highest-value on-page
edit available.

**2. H1.** Should contain the primary phrase once, naturally, with your name.
Something like "Digital marketing freelancer in Bangalore" as the H1, with
"Hire" moved into the CTA button where it belongs commercially. **One H1 only.**
I cannot verify your current H1 count without the HTML.

**3. Direct-answer block in the first 60 words.** Google is already pulling a
definition from your body copy for the India query ("A digital marketing
freelancer in Bangalore is an independent expert who manages your entire online
presence..."). That means it liked a passage you wrote more than your meta
description. Formalise it: put a clean 40 to 60 word definition immediately under
the H1. That is what wins featured snippets and what AI search extracts.

**4. H2s covering the variants.** Your two secondary Bangalore keywords are
grammatical variants of the primary, not separate queries, so they belong here
rather than on new pages:

- `Why hire a freelance digital marketer in Bangalore`
- `What freelance digital marketing in Bangalore costs`
- `Areas I cover across Bengaluru`

**5. Named local proof.** Every competitor page is generic. Name Bangalore
districts you have clients in, name a local client with permission, reference
something a Delhi freelancer could not write.

---

## The pricing page you should build

Your SERP snippet shows **"Entry-Level: ₹500-₹1,000/hour"**. You are the only
result on that page exposing a rate.

People Also Ask, across all three Bangalore queries:

- What is the average cost of digital marketing in Bangalore?
- How much does a freelance digital marketer charge?

Cost questions on **every variant**, nobody answering them properly, and you
already publish the number. This is the clearest unclaimed opportunity on the
whole SERP.

Build `/pricing` with each PAA question as a question-phrased H2 followed by a
self-contained 40 to 60 word answer. Include your hourly bands, a typical
monthly retainer, what a first engagement costs, and what moves the number.
Link it from the homepage and from every service page.

Secondary benefit: it filters your inbound. You stop having discovery calls with
people whose budget was never going to work.

---

## Intent filtering: do not chase half this SERP

Indeed and Naukri rank on your target queries, and several PAA entries are
job-seeker questions: "How to earn 1 lakh per month in digital marketing",
"How do I start freelance digital marketing", "Can I earn 10 lakh per month".

A large share of this traffic wants to **become** a freelancer, not hire one.

Do not write that content. It brings traffic that never converts, and it dilutes
what Google understands your site to be about. Answer only hiring-intent
questions: who is best, what it costs, freelancer versus agency, how to vet one.

---

## City pages

You have Bangalore, Hyderabad and Chennai. Run the swap test on each: change the
city name to another city and reread. If it still makes sense, it is a doorway
page.

Three pages sits well under the 30-page warning gate so there is no emergency.
But you sell SEO. Getting demoted for doorway pages is a story you cannot afford
in a sales conversation.

Each city page needs at least one thing only writable about that city: a named
local client, city-specific pricing, a local case study, an observation about
that market. If you cannot write that for Hyderabad and Chennai, fold them into
one national page and keep Bangalore deep.

---

## The India term conflict

`/post/digital-marketing-freelancers-in-india` is a roundup listing other
freelancers. It targets the same phrase you want a **service** page to rank for.
Google reads it as a list, not an offer, and it is currently the page most
associated with that term on your domain.

Decide: either retitle the post so it stops competing (for example
"Digital Marketing Freelancers in India: How to Choose One") and build a proper
service page at `/digital-marketing-freelancer-in-india`, or accept the post owns
the term and stop targeting it commercially.

Do not leave both as they are.

---

## Technical items

**Canonical host.** Your live SERP displays `eeatminds.in` while the index holds
`www.eeatminds.in`. Pick one, 301 the other, make self-referencing canonicals
match, and update every directory listing to the chosen version. Mixed hosts
split signals the same way duplicate pages do.

**Schema.** Needs HTML to confirm. Target: `Person` for Shreyas with `jobTitle`,
`knowsAbout` and a full `sameAs` set; `ProfessionalService` with `areaServed`,
`founder`, `priceRange` matching your published rates, and `aggregateRating`
once GBP reviews exist; `Organization` with one canonical spelling;
`BreadcrumbList` on service pages.

Do **not** add `FAQPage` expecting rich results (retired for all sites 7 May
2026) or `HowTo` (removed September 2023). Keep FAQ content for users and for
the PAA opportunity, but expect no SERP feature from the markup.

**Core Web Vitals.** Cannot be assessed from HTML by anyone. Run
pagespeed.web.dev on the homepage and your top service page.

---

## Off-site, which outranks all of the above

You are absent from the map pack that appears above organic results on all three
Bangalore queries. The incumbents hold 39, 29 and 17 reviews. Seventeen reviews
is the barrier, and you claim 66+ brands served.

Claim Google Business Profile, choose the primary category deliberately, add
address and phone, set open 24 hours as all three competitors have, enable
online appointments, then ask twenty clients for reviews.

That is worth more than every on-page change in this document combined.

---

## Order of work

| # | Task | Effort |
|---|---|---|
| 1 | Google Business Profile + 20 reviews | Weeks, start today |
| 2 | 301 the three duplicate pages | One afternoon |
| 3 | Homepage title | Ten minutes |
| 4 | Remaining titles + brand casing | One hour |
| 5 | Settle www vs apex | Thirty minutes |
| 6 | `/pricing` page answering the cost PAA | One day |
| 7 | Homepage H1, answer block, variant H2s | Half a day |
| 8 | India term conflict | Half a day |
| 9 | City page uniqueness or consolidation | Varies |
| 10 | Schema | Half a day |

Items 1 through 4 are most of the available gain.

---

## What I still cannot see

Paste your homepage `<head>` and I will finish these:

- H1 count and wording per page
- Existing JSON-LD blocks and their validity
- Canonical tag target
- Open Graph and Twitter Card completeness
- Meta robots directives
- Internal link structure and anchor text
- Word count per page
- Image alt text

Fastest route: open the homepage, view source, copy everything between `<head>`
and `</head>`, paste it here. That single block resolves most of the list.
