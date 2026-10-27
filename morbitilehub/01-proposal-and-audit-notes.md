# Morbi Tile Hub (morbitilehub.com): proposal and audit notes

Client-facing plan: **SEO Plan for Morbi Tile Hub** (Claude Doc, export to PDF or Word):
https://claude.ai/artifact/VZEsYDWFVRKZyp4uZahC3c

Price offered: **₹15,000 / month**. That's the Growth plan deliverables plus Google Business Profile work.
The eeatminds.in pricing page lists Growth at ₹12,000 with the same six items, so the
extra ₹3,000 is covered by GBP (listed at ₹4,000) and enquiry tracking.

This file keeps the evidence behind the plan, so Month 1 work can start from it.
Checks were run 27 Oct 2026 unless marked otherwise.

---

## Business facts (from the site's own metadata)

| Field | Value |
|---|---|
| Type | Tile manufacturer and supplier, ceramic and vitrified |
| Registered office | Floor 3, Shop 1 & 2, Classic Complex, Shyam Park, Canal Road, Madhapar, Morbi 363641 |
| Showroom | Near Honest Hotel, 8A National Highway, Morbi 363642 |
| Phone / email | 7567775672 / Morbitilehub@gmail.com |
| Hours | Mon–Sat, 9:00–18:00 IST |
| Stack | Custom Laravel (PHP 8.2) on Hostinger; GTM container `GTM-K4RFK8HS` |
| Other names in use | "Morbitaa": YouTube `@Morbitaa`, Instagram `morbitaa_buildmart`, Justdial "Morbitaa, Lalpar" |

## Visibility (Ubersuggest domain overview, Sept 2026)

Source label: Ubersuggest, default (US) keyword database. **Third-party estimate.** Replace with
Search Console numbers in Week 1.

| Measure | Value |
|---|---|
| Ranking keywords | 1,268 (6 in Nov 2025) |
| Positions 1–3 / 4–10 / 11–50 / 51–100 | 4 / 53 / 980 / 231 |
| Domain Authority | 9 |
| Backlinks / referring domains | 238 / 106 |

Google India spot checks (Firecrawl search, location India):

- "tiles manufacturer in morbi": not in top 10. Ahead: IndiaMART, tilesfinders.com, Neon Tile, Varmora, Marfil, Tizo, Porcious.
- "morbi tiles price list": morbitilehub.com at #6. Ahead: IndiaMART, Tizo, morbitiles.org, Glow Ceramica, Orientbell.

## Site findings (measured directly)

| # | Finding | Evidence |
|---|---|---|
| 1 | 3,460 city landing pages (346 cities × 10 categories), near-identical | `/bangalore/floor-tiles` vs `/warsaw/floor-tiles`: 98.2% line similarity. Warsaw meta still says "pan-India delivery". Includes New York, Toronto, Dubai, London, Moscow, Kingston, Bangkok, Colombo, Sydney |
| 2 | Duplicate filter combinations, all indexable and self-canonical | `/floor-tiles/bathroom-tiles` vs `/bathroom-tiles/floor-tiles`: 90% similar. H1 on both is the parent category's H1. Every sampled page (home, category, city, product, blog) links to the same 938 category × filter combos, plus 144 `/tiles/<facet>` pages. 500 of the combos are in the sitemap |
| 3 | Heavy HTML | Home 1.02 MB, `/floor-tiles` 1.45 MB, city page 1.17 MB (uncompressed). Gzip transfer 90–148 KB. Homepage has 2,521 `<a>` tags. TTFB 0.78–0.95 s |
| 4 | Weak homepage snippet | Meta description 60 chars: "MorbiTileHub - Premium quality tiles and flooring solutions." No Open Graph tags. Only one H2 |
| 5 | robots.txt / sitemap | `Disallow: *.xml$` matches `/sitemap.xml`. Sitemap: 9,614 URLs (5,505 `/product/`, 64 `/blog/`, 3,460 city pages), 9,562 dated 2026-10-19. Lists `/about` (301 to `/about-us`). `?sort=` URLs return 200 (robots-blocked) |
| 6 | Blog cannibalisation (to confirm in GSC) | `/blog/bathroom-tiles-design-ideas` vs `/blog/best-bathroom-tile-designs-2025`; `/blog/kitchen-tiles-design` vs `/blog/modern-kitchen-tile-design-ideas-2025` vs `/blog/kitchen-wall-tiles-design` |
| 7 | NAP / brand split | Site: Morbi Tile Hub, Madhapar + NH-8A. Justdial: Morbitaa, Lalpar |

Working well: Organization, LocalBusiness, FAQPage, Product, BlogPosting and BreadcrumbList schema;
named blog authors; image alt text nearly complete (1 missing on sampled category pages);
http and www both 301 to `https://morbitilehub.com/`; trailing slash 301s.

Not checked: Core Web Vitals field data (PageSpeed API quota exhausted on 27 Oct), backlink
quality (Ubersuggest backlinks endpoint returned 403), Search Console (no access yet).

## Month 1 starting list

1. Get GSC, GA4, GTM and GBP access. Reset the baseline from GSC.
2. Ask which cities and countries they actually deliver to. This decides the city-page cut.
3. Agree one brand name (Morbi Tile Hub vs Morbitaa) before any citation work.
4. Quick wins for the developer: robots.txt `*.xml$` rule, homepage meta + OG tags, drop `/about` from sitemap.
5. Pull India volumes for the keyword map and the six blog topics in the plan.
