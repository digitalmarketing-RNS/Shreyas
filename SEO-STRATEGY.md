# Ranking strategy: "SEO Freelancer in Bangalore"

Target keyword: **seo freelancer in bangalore**
Entity: **Shreyas V Patil** (personal brand — deliberately not EEAT Minds)
Money page: the **homepage**
SERP data collected: 15 September 2026, Bangalore-localised

---

## 1. What the SERP actually looks like

Every result competing for this term is a **named individual**, not an agency
brand. That is the single most important structural fact about this SERP: Google
has decided the query means "find me a person", and it rewards pages that read
as one person's practice.

A few marketplaces (Upwork, Twine, Freelancer, Toptal) and two Reddit threads
also rank. Indeed and Naukri appear on adjacent variants, which means the
keyword carries **split intent** — some searchers want to hire a freelancer,
some want to become one. That split matters and is handled in §5.

### Top competitors analysed

| # | Site | Words | Exp. | Price shown | FAQs | Named case studies | Named testimonials | Verifiable credentials |
|---|---|---|---|---|---|---|---|---|
| 1 | `seofreelancerbangalore.in` (Sathees) | 4,500–5,200 | 13+ yrs | No | 18 | No | No | No |
| 2 | `anandkjha.com` | 9,500–10,500 | 13+ yrs | ₹19,499 | 3 | Vague | Yes | Google + HubSpot, press |
| 3 | `iravisharma.com` | 2,800–3,200 | 10+ yrs | ₹4,999–14,999 | 6 | 3 named | 3 | No |
| 4 | `suryaseo.in` | 2,400–2,600 | 4 yrs | No | 11 | Anonymous | No | No |
| 5 | `vijayseo.in` | ~2,200 | 8+ yrs | No | 0 | Portfolio only | No | No |

Also ranking: `seofreelancerbangalore.com` (Kokila), `krishnaseo.com`,
`jijojosephseo.in`, `nextgendigitalseo.in`, `gileaddigital.in`.

### The content pattern they all share

Ranking pages in this SERP are long, single-page, do-everything documents. In
order of how consistently they appear:

1. Personal introduction with a years-of-experience claim in the H1 or first H2
2. Why-a-freelancer-not-an-agency section
3. Service list (6–8 items)
4. A numbered process or roadmap
5. Results or portfolio
6. A large FAQ block — 6 to 18 questions
7. Areas / locations served
8. Tools used

### Where every one of them is weak

| Gap | Who has it | Opportunity |
|---|---|---|
| **Verifiable credentials** | Only Anandkjha | Google Partner status is listed in Google's *public* directory. It cannot be self-declared. Nobody else in the top 5 has anything a visitor can independently check. |
| **Named clients with named keywords** | Nobody, properly | Every case study in this SERP is either anonymous, unquantified, or missing the keyword. Naming the client, the keyword *and* the verification source is unmatched here. |
| **Named testimonials with designations** | Only iravisharma | Real name + real company + real job title. |
| **Published pricing** | 2 of 5 | Cost questions appear in People Also Ask on every variant of this keyword, and almost nobody answers them on-page. |
| **Honest limitations** | Nobody | Every page claims to be the best at everything. Saying when to hire an agency instead is differentiating and it is what an experienced consultant would actually say. |

---

## 2. The positioning wedge

> **Every claim on this page is checkable.**

This is the strategy, not a tagline. It exploits the exact weakness shared by
the entire top 5 — unverifiable superlatives — and it happens to be the
strongest possible E-E-A-T signal. It is also honest, which is why it holds up
under a manual quality review.

Applied consistently:

- Google Partner → linked to Google's public Partners Directory
- Client results → client named, keyword named, tool named (Search Console,
  Semrush, GBP Insights)
- Testimonials → full name, company and designation
- Pricing → published, no form gate
- A "what I don't claim" block, and a page-level offer to connect prospects
  directly with existing clients
- **No `aggregateRating` in schema**, because no review count has actually been
  collected. Inventing one is a Google policy violation and would undercut the
  entire premise

---

## 3. E-E-A-T mapping

Google's quality rater guidelines weight **Experience** and **Trust** most
heavily for this kind of page. Each signal has a specific home on the site:

| Signal | Where it lives |
|---|---|
| **Experience** — first-hand, did-the-work | Case studies naming clients and keywords; `/about/` describing a decade of specific Indian-SERP situations; the multilingual-Bangalore-search detail that only a local would know |
| **Expertise** — demonstrated skill | `/services/` going deep enough to be useful rather than listing buzzwords; blog posts diagnosing real problems |
| **Authoritativeness** — recognised by others | Google Partner, Meta Business Partner, named client references, `sameAs` entity graph across LinkedIn |
| **Trust** — the decisive one | Published pricing, no lock-in, "what I don't claim", stated limitations, "when to hire an agency instead", a verification methodology section teaching visitors how to audit *any* SEO's case studies |

The "how to read any SEO case study" section on `/case-studies/` is deliberate:
it invites the visitor to apply six tests to the page they are reading. Pages
that survive that invitation are rare.

---

## 4. Site architecture

One page per intent. No two pages compete for the same query — cannibalisation
is what caps most personal-brand SEO sites.

| URL | Primary intent | Target query cluster |
|---|---|---|
| `/` | **Hiring** — the money page | seo freelancer in bangalore, freelance seo bangalore, seo expert bangalore |
| `/services/` | Scope evaluation | seo services bangalore, technical seo, link building |
| `/local-seo-bangalore/` | Local sub-intent | local seo bangalore, google map pack, google business profile |
| `/case-studies/` | Evidence | seo case study india, seo results proof |
| `/pricing/` | **Cost** — PAA opportunity | seo cost bangalore, seo freelancer charges, seo price india |
| `/about/` | Entity / author | shreyas v patil |
| `/contact/` | Conversion | free seo audit bangalore |
| `/blog/` + 2 posts | Topical authority | problem-aware and AI-search queries |

Blog topics were chosen specifically **not** to cannibalise the money page:
"traffic but no enquiries" is problem-intent, "AI Overviews" is
technology-intent. Neither competes with a hiring query.

---

## 5. Two deliberate decisions

**Job-seeker intent is not chased.** "How to become a digital marketing
freelancer" and "how to earn 1 lakh in digital marketing" appear in PAA for
these keywords. That traffic never converts and it muddies what Google thinks
the page is about. The FAQ answers hiring questions only.

**FAQ content is kept, FAQ rich results are not expected.** Google retired
FAQPage rich results for most sites in May 2026. The markup is still emitted
because Bing and AI answer engines consume it, but no SERP feature is assumed.
The FAQ earns its place through People Also Ask coverage and on-page usefulness.

---

## 6. Technical implementation

- **Static HTML.** No framework, no hydration, no render-blocking JS. Core Web
  Vitals are a ranking factor and most Bangalore traffic is mobile.
- **Schema graph**: `Person` (the central entity, `@id`-referenced from every
  page), `ProfessionalService`, `Service`, `WebSite`, `WebPage`, `BlogPosting`
  with a real credentialed author, `BreadcrumbList`, `OfferCatalog` with real
  prices, `FAQPage` generated *from the rendered Q&A* so markup and visible
  content can never drift apart.
- **`llms.txt`** with the key facts, verified results and named references, for
  AI answer engines.
- **`robots.txt` explicitly allows** GPTBot, OAI-SearchBot, PerplexityBot,
  ClaudeBot, Google-Extended and Applebot-Extended. Being cited is the point.
- **Accessibility**: skip link, one H1 per page, semantic landmarks, visible
  focus rings, `prefers-reduced-motion` honoured, native `<details>` FAQs
  (content is in the DOM, no JS needed to crawl it).
- **No-JS safe**: all reveal animations are scoped behind `html.js`, set by an
  inline head script. With JavaScript disabled nothing is ever hidden.

---

## 7. Design rationale

Built against Anthropic's frontend-aesthetics guidance, which warns against
converging on generic defaults.

| Dimension | Decision | Default that was avoided |
|---|---|---|
| Typography | **Fraunces** (variable serif, `WONK`/`SOFT` axes) for display, **Schibsted Grotesk** for UI, **JetBrains Mono** for every number | Inter, Roboto, Arial, system fonts, Space Grotesk |
| Colour | Deep ink ground, one sharp saffron accent, a semantic green used *only* on independently verifiable claims | Purple gradients on white |
| Background | Layered graph-paper grid, two radial blooms, SVG grain — atmosphere with a reason | Flat solid colour |
| Motion | One orchestrated page load with staggered `animation-delay`, then scroll reveals; CSS-only | Scattered micro-interactions |
| Layout | Ledger rows for case studies, a numbered index for services, an instrument rail for process, a live rank-tracker readout in the hero | Three-column card grids |

The concept is an **analyst's instrument panel**: the numbers are the product,
so they are set in monospace and given the visual weight of readouts. The green
is reserved for "this is verifiable" and used nowhere else, so the signal never
degrades into decoration.

---

## 8. What still has to happen off-page

The page is now competitive on content and E-E-A-T. Two things outside the
codebase decide the outcome:

1. **Google Business Profile.** A map pack sits above the organic results on
   local variants of this keyword. Claim it, choose the primary category
   deliberately, complete every field, and get to ~20 reviews. Incumbents in
   most Bangalore service categories hold their slots with 15–40 reviews, so
   this is one quarter's work and it outranks every on-page gain available.
2. **Links.** The top-5 pages are not heavily linked; this is a winnable SERP
   on content quality. Reclaim the existing unlinked mentions first — they are
   the cheapest links available.

---

## 9. Placeholders to replace before launch

Three values are assumed and must be confirmed. Each is a single
find-and-replace across the `site/` directory.

| Value | Currently | Appears in |
|---|---|---|
| Domain | `https://www.shreyasvpatil.com` | canonicals, OG tags, schema, `sitemap.xml`, `robots.txt`, `llms.txt` |
| WhatsApp | `https://wa.link/j34pjs` (Shreyas's existing public link) | header/footer CTAs, contact page |
| Contact form action | `#` — needs a real endpoint (Formspree, Netlify Forms, or a backend) | `/contact/` |

**Deliberately omitted**: telephone number and street address. Both are required
for `LocalBusiness` schema and for the map pack, but inventing them would break
NAP consistency and actively damage local rankings. Supply the real values and
they slot into the `ProfessionalService` block on the homepage.

**Also missing**: a real photograph at `/assets/img/shreyas-v-patil.jpg`, which
the `Person` schema references. A face on an E-E-A-T page measurably helps.
