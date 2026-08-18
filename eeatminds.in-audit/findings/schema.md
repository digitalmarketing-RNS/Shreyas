# Structured Data — eeatminds.in

**Method note.** An earlier pass used a regex (`"@type"\s*:\s*"..."`) that cannot
match array-form declarations such as `"@type": ["LocalBusiness","ProfessionalService"]`,
and so under-reported coverage. Every figure below comes from a **JSON-LD parser
that walks nested objects and array types**, plus a microdata check. The
conclusion did not change — the affected pages have **zero JSON-LD blocks**, not
schema in a form the regex missed.

## Coverage — three tiers

### Tier 1: rich and correct (3 pages)

**Homepage** — a well-built 4-node `@graph`:

| Node | Contents |
|---|---|
| `LocalBusiness` + `ProfessionalService` | full NAP, geo (13.0239923, 77.643294), `openingHoursSpecification`, `contactPoint` with 7 languages, `foundingDate: 2015`, `areaServed`, `hasOfferCatalog` with 6 services, 3 `sameAs` |
| `Person` (Shreyas V Patil) | `jobTitle`, `image`, **7 `sameAs`** profiles, `worksFor` → org |
| `WebSite` | `inLanguage: en-IN`, `publisher` → org |
| `WebPage` | `isPartOf`, `about`, `author`, `mainEntityOfPage` |

Entities are linked by `@id` rather than duplicated — this is how it should be done.

**`/seo-freelancer-in-bangalore`** — `ProfessionalService`, `FAQPage` (+`Question`/`Answer`),
`Person`, `PostalAddress`, `City`, `Country`, `BreadcrumbList`.

**`/freelance-social-media-marketing`** — `ProfessionalService`, `Person`,
`PostalAddress`, `OpeningHoursSpecification`, `BreadcrumbList`.

### Tier 2: breadcrumbs only (2 pages)

| Page | Types |
|---|---|
| `/ppc-services` | `BreadcrumbList`, `ListItem` |
| `/freelance-web-designers-in-bangalore` | `BreadcrumbList`, `ListItem` |

Navigational markup only. No entity describing the service being sold.

### Tier 3: no structured data at all (8 money pages) — verified

| Page | Words | JSON-LD blocks |
|---|---|---|
| `/digital-marketing-freelancer-in-chennai` | 1,984 | **0** |
| `/digital-marketing-freelancer-in-hyderabad` | 1,918 | **0** |
| `/real-estate-seo-services` | 1,588 | **0** |
| `/outsource-digital-marketing-services` | 1,275 | **0** |
| `/seo-services-for-doctors` | 1,224 | **0** |
| `/best-digital-marketer-in-india` | 885 | **0** |
| `/seo-service-for-dentists` | 814 | **0** |
| `/social-media-marketing-for-doctors` | 689 | **0** |

No JSON-LD, no microdata. `/privacy-policy` and `/terms-and-conditions` also have
none, which is fine and excluded from the count.

## The pattern

**Every one of the 68 blog posts** carries `BlogPosting` + `Organization` +
`ImageObject` + `Person` + `itemPage` — applied automatically by the Wix blog
engine.

**Only 2 of 13 service pages** carry a service-level entity, and those were
clearly hand-built.

So structured data is comprehensive exactly where it was automated, and absent
exactly where it had to be added by hand. Every geo page bar Bangalore, and every
vertical page without exception, is missing it.

`ProfessionalService` appears on 3 pages of 85. `FAQPage` on **1**.

## Why this is the audit's top finding

For a local service business, `LocalBusiness`/`ProfessionalService` with a
city-specific `areaServed` is the mechanism that ties a page to local intent and
makes it eligible for rich results. The Chennai and Hyderabad pages are
substantial documents — 1,984 and 1,918 words — competing on text alone while the
Bangalore page has the full entity treatment.

The gap is not knowledge. The template exists, works, and is already live on this
domain. It has simply not been propagated.

Worth noting: `/post/schema-markup-best-practices` and `/post/what-is-eeat-in-seo`
are both published here. The site advises on schema more thoroughly than it
applies it to its own commercial pages.

## Validation

No parse errors in any block found. Existing markup is syntactically valid and
correctly cross-referenced. **This is an application gap, not a correctness bug.**

## Recommendation

1. **Clone the `/seo-freelancer-in-bangalore` block onto the 8 empty pages**,
   changing `areaServed`, `name`, `description` and service type per page.
   Highest value, lowest effort in this audit.
2. **Add `Service` entities to `/ppc-services` and `/freelance-web-designers-in-bangalore`** —
   they already have breadcrumbs, so only the service node is missing.
3. **Extend `FAQPage`** beyond the single page that has it. Several pages already
   have visible FAQ blocks with no corresponding markup — the content exists, only
   the JSON-LD is missing.
4. Add `datePublished` / `dateModified` / visible `author` to `BlogPosting` (see
   `content.md` and `geo-ai-search.md` — the same fix serves three categories).
