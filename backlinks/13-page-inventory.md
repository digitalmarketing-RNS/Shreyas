# EEAT Minds — Page Inventory & Index Findings

Target: `https://www.eeatminds.in/`
Method: **Firecrawl search index** (`mcp__Firecrawl__firecrawl_search`), 2026-08-17.

---

## Read this before using the data

**This is not a crawl.** Every URL, title and description below comes from a
*search index*, not from fetching your pages. Three consequences:

1. **Titles and descriptions may lag the live site.** They reflect what the index
   last saw, not what ships today.
2. **Absence is not proof of absence.** A page missing here may exist and simply
   not be indexed for the queries I ran. This is a floor on your page count, not
   a complete list.
3. **Nothing technical is verified.** No HTTP status codes, canonical tags, H1
   structure, robots directives, schema markup, or hreflang. Those require
   fetching the pages, which this session cannot do.

Per the workspace contract in `README.md`: every item below is labelled with its
source, and I have not filled gaps with estimates.

### Why no crawl

`www.eeatminds.in` is blocked by this session's egress policy at the network
layer — confirmed repeatedly, most recently `www.eeatminds.in:443:
connect_rejected`. Correcting the reachability table in `04-eeatminds-foundation.md`:

| Route | Status | Note |
|---|---|---|
| Firecrawl search (via platform connector) | ✅ **works** | Runs server-side, outside this container's egress. **New since `04`** |
| Firecrawl scrape / crawl / map | ❌ not exposed | Connector offers only `search` + 5 `research_*` tools |
| Firecrawl self-hosted | ❌ pointless | Would fetch *from* this container, inheriting the block |
| Firecrawl REST / CLI / MCP direct | ❌ blocked | `api.firecrawl.dev`, `mcp.firecrawl.dev` both denied |
| Direct fetch of the site | ❌ blocked | Egress policy |
| Google APIs (GSC, PSI, CrUX, GA4) | ⚠️ reachable | Needs credentials — see `03-data-connection.md` |

So `04`'s conclusion (no backlink score) **still holds** — Moz, Bing and
DataForSEO remain blocked. Only its "every tier unreachable" line is now stale:
the search tier works.

---

## Finding 1 — www / non-www split on the homepage

**Confidence: high.** Reproduced across four separate queries.

The homepage is indexed at the **non-www** host:

```
https://eeatminds.in/     "Hire Digital Marketer Bangalore | Shreyas V Patil"
```

Every other page is indexed at **www**:

```
https://www.eeatminds.in/seo-freelancer-in-bangalore
https://www.eeatminds.in/ppc-services
...
```

It reproduced even when I constrained the query to `includeDomains:
["www.eeatminds.in"]` — the non-www URL still came back as the homepage result.

**Compounding detail:** the homepage's own internal links all point to **www**
(`https://www.eeatminds.in/contact`, `/post/scope-of-ppc-seo`, etc.), while the
page itself is indexed as non-www. Internal linking and the indexed URL disagree.

**Why it matters.** Two hostnames serving one homepage splits link equity between
them, and inbound links to the "wrong" host don't consolidate. This directly
undercuts the Foundation link work in `01`/`10` — citations built pointing at one
host while the other ranks means the authority lands in the wrong place.

**To verify (needs page access):** the homepage's `rel=canonical` value, whether
non-www 301-redirects to www or both resolve 200, and Wix's primary-domain
setting. GSC URL Inspection answers all three and *is* reachable from here.

---

## Finding 2 — probable keyword cannibalization

**Confidence: medium.** URL pairs confirmed in the index; intent overlap inferred
from titles and descriptions, not from reading both pages in full.

Two pairs of pages appear to target the same intent:

| Intent | Page A | Page B |
|---|---|---|
| PPC services | `/ppc-services` | `/ppc-freelancers` |
| Social media marketing | `/freelance-social-media-marketing` | `/freelancer-for-social-media-marketing` |

Index copy for the PPC pair:

- `/ppc-services` — *"Top PPC Services in Bangalore \| ROI-Driven Ad Strategies"* —
  "Pay-per-click (PPC) services are essential for any business looking to gain
  immediate visibility…"
- `/ppc-freelancers` — *"PPC Freelancer services \| Paid advertising services"*

Note `/ppc-services`'s own description leads with *"Our skilled PPC
freelancers…"* — it is already optimising for the freelancer term that `/ppc-freelancers`
exists to own.

**Why it matters.** Two pages competing for one query usually means Google picks
one and neither ranks as well as a single consolidated page would. Standard fix
is to pick the stronger URL, 301 the weaker into it, and merge the copy — but
decide that with real GSC data on which URL already earns impressions, not from
index snippets.

---

## Finding 3 — cross-domain duplicate content

**Confidence: high** on duplication; **unverified** on ownership.

The same article appears on two domains under the same slug:

```
https://www.eeatminds.in/post/digital-marketing-freelancers-in-india
https://www.iswadesh.com/post/digital-marketing-freelancers-in-india
```

Both are titled *"Top10 Digital Marketing Freelancers in India 2026"* and both
open with the same sentence about Shreyas V Patil leading EEAT Minds.

`iswadesh.com` is plausibly yours — `rnsfgc.edu.in/author/shreyas/` describes
Shreyas as "Founder of Eeat Minds, iSwadesh & Digital SVP". **Confirm before
acting.** If both are yours, one needs a canonical pointing at the other, or the
copy needs differentiating. If not, it is scraped content.

---

## Finding 4 — platform constraint

**Confidence: high.** All images resolve to `static.wixstatic.com`.

The site is **Wix-hosted**. This bounds what technical fixes are available —
server-level redirects, arbitrary header control and some canonical handling work
differently than on self-hosted. Worth knowing before planning remediation.

---

## URL inventory

**47 unique URLs observed.** A floor, not a complete count.

### Inventory is a floor — demonstrated, not assumed

The first pass found 43 URLs. Two additional queries on untouched topics
(pricing/testimonials, and email/content/SEM) returned **4 more posts** that the
first pass had missed entirely. The count rose 43 → 47 purely by asking different
questions.

This is how a search index behaves: each query returns a *relevance-ranked slice*,
never the full set. There is no exhaustive enumeration available — that needs
`sitemap.xml` (unreachable) or a crawler (not exposed). **Assume more pages exist
than are listed here.**

Two related observations from the same passes:

- The homepage returned **different content on different queries** — one pass
  surfaced a "Real Results. Real Businesses. Real Growth." section with three case
  examples that earlier passes did not.
- Its indexed **title varied between queries** — `"Hire Digital Marketer Bangalore
  | Shreyas V Patil"` on some, plain `"EEAT Minds"` on others. Could be index
  variants or a genuinely changing title; **not diagnosable without page access.**

Also newly surfaced, worth noting alongside the other quantified claims:
`/post/eeat-seo-strategies-for-indian-tech-startups` asserts *"startups that
establish verifiable technical authority achieve a 340% higher citation rate in
AI"*, attributed to "our 2026 research at EEAT Minds". If that research is not
published, it is an unsourced statistic on a page about verifiable authority.

### Service and money pages (13)

| URL | Indexed title |
|---|---|
| `/` (as **non-www**) | Hire Digital Marketer Bangalore \| Shreyas V Patil |
| `/seo-freelancer-in-bangalore` | SEO Freelancer in Bangalore \| Shreyas V Patil |
| `/best-digital-marketer-in-india` | Best Digital Marketer In India - Shreyas V Patil |
| `/digital-marketing-freelancer-in-chennai` | Digital Marketing Freelancer in Chennai |
| `/digital-marketing-freelancer-in-hyderabad` | Digital Marketing Freelancer In Hyderabad |
| `/ppc-services` | Top PPC Services in Bangalore \| ROI-Driven Ad Strategies |
| `/ppc-freelancers` | PPC Freelancer services \| Paid advertising services |
| `/freelance-social-media-marketing` | Freelance Social Media Marketing In Bangalore, India |
| `/freelancer-for-social-media-marketing` | Best freelancer for social media marketing Services |
| `/freelance-web-designers-in-bangalore` | Hire Expert Freelance Web Designers in Bangalore |
| `/real-estate-seo-services` | Real Estate SEO Services \| EEAT Minds |
| `/contact` | Contact \| Eeat Minds |
| `/blog` | Blog |

**Geo coverage:** Bangalore, Chennai, Hyderabad, plus a national
`/best-digital-marketer-in-india`. `/real-estate-seo-services` is the only
vertical-specific service page.

### Legal (2)

`/privacy-policy` · `/terms-and-conditions`

### Blog posts (28, all under `/post/`)

Money-adjacent / commercial intent:
- `seo-auditing-services`
- `on-page-optimization-service`
- `off-page-seo` — *"18 Advanced Techniques"*
- `schema-markup-best-practices`
- `benefits-of-hiring-seo-expert`
- `eeat-seo-strategies-for-indian-tech-startups`
- `scope-of-ppc-seo`
- `how-can-google-ads-help-you-achieve-your-business-objectives`
- `google-ads-for-government-documents-and-services`

Freelancer-market / listicle (these overlap your service pages — see note below):
- `digital-marketing-freelancers-in-india` — *Top10 … 2026*
- `top-5-freelance-digital-marketer-bangalore`
- `top-digital-marketing-freelancers-in-chennai`
- `freelance-digital-marketing-websites` — *2026*
- `freelance-digital-marketing-salary` — *India 2026*

Educational / top-of-funnel:
- `digital-marketing-goals`
- `what-is-cpr`
- `scope-of-digital-marketing`
- `ai-in-digital-marketing`
- `why-choose-digital-marketing`
- `principles-of-digital-marketing`
- `7-cs-of-digital-marketing`
- `features-of-digital-marketing-a-comprehensive-guide`
- `how-to-grow-business-online`
- `which-industry-needs-digital-marketing`
- `benefits-of-outsourcing-digital-marketing`
- `what-is-social-media-content-writing`
- `how-digital-marketing-helps-small-business`

Vertical:
- `digital-marketing-for-doctors-india`

Found on a later pass (see "Inventory is a floor" below):
- `what-is-eeat-in-seo`
- `how-to-do-seo-for-android-app`
- `how-does-social-media-marketing-affect-small-businesses`
- `ai-insights-from-digital-marketing-experts`

**Worth a look:** `/post/top-5-freelance-digital-marketer-bangalore` and
`/post/top-digital-marketing-freelancers-in-chennai` are listicles targeting the
same city terms as `/seo-freelancer-in-bangalore` and
`/digital-marketing-freelancer-in-chennai`. A blog post outranking your own
service page for a money keyword is a third possible cannibalization axis —
lower confidence than Finding 2, and only GSC data can confirm it.

---

## Claims found on the homepage

Full homepage content was retrievable. These are the proof-points `02-tracker.csv`
flags as unverified — now at least confirmed as *what the site says*:

| Claim | As stated |
|---|---|
| Experience | 10+ years, "since 2015" |
| Team | 25+ specialists |
| Clients | "Trusted by 66+ Brands" |
| Certification | Google Partner (`google.com/partners/agency?id=9715381965`) + Meta |
| Cost claim | "40-60% lower cost than a full-service agency" |
| ROI claim | "ROI on SEO alone can be 5-10x your investment within 12 months" |

**Named client logos** (from image alt text — useful for the Foundation
submissions in `01`, which need portfolio evidence): iLaundry, Sketch Me Cartoon,
Golden Barrel Tech, Gold Intelligence, Baes Club, Supreme Auto, Naveen Tile, RNS
Institute of Technology, TASA Interior Designer, MV Propperties, Recmann Hoists
Cranes, Toni&Guy.

The last two claims are quantified marketing assertions on a page selling SEO.
The "5-10x within 12 months" line in particular is the kind of unsourced number
that an E-E-A-T-focused site is least well placed to make. Worth either sourcing
or softening.

---

## What still needs page access

Unanswerable from a search index. Each needs either scrape access or GSC:

- HTTP status codes; whether non-www 301s to www
- `rel=canonical` on every page, especially the homepage
- H1 presence and uniqueness
- Schema markup — notable given `/post/schema-markup-best-practices` exists;
  worth checking the site practises it
- `robots.txt` and `sitemap.xml` contents
- Meta robots / noindex directives
- Core Web Vitals
- Which URL actually earns impressions for each cannibalized pair

**Fastest unblock:** GSC URL Inspection, reachable from this session and
authoritative on canonical + indexing state — better than a crawl for Findings 1
and 2, since it reports Google's own verdict. See `03-data-connection.md`
(note: its `/workspace` venv paths are stale — the container was rebuilt).

**Alternative:** run Firecrawl where egress is open (your machine or claude.ai):

```bash
npx -y firecrawl-cli@latest init --all -k <your-key>
firecrawl scrape "https://www.eeatminds.in/" -o eeatminds-home.md
```

Paste the output back and the technical checks above become answerable.
