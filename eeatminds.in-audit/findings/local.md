# Local SEO — eeatminds.in

**Business type detected:** Service-Area Business (SAB) / hybrid — a named
individual practitioner operating from a Bangalore address, serving multiple
Indian cities plus "Worldwide".

## NAP — consistent and complete in schema

Extracted from the homepage `LocalBusiness` + `ProfessionalService` entity:

| Field | Value |
|---|---|
| Name | EEAT Minds |
| Street | Kalyan Nagar |
| Locality | Bangalore |
| Region | Karnataka |
| Postal code | 560043 |
| Country | IN |
| Phone | +91 74831 75339 |
| Email | **eeatminds.in@gmail.com** |
| Geo | 13.0239923, 77.643294 |
| Hours | 00:00–23:59, all seven days |
| Founded | 2015 |

The geo coordinates resolve to Kalyan Nagar, Bangalore — consistent with the
stated address. `areaServed` is declared as Bangalore / India / Worldwide, and
`contactPoint` lists seven languages (English, Hindi, Kannada, Tamil, Telugu,
Malayalam, Marathi). This is a well-formed local entity.

## Three issues

### 1. Gmail address, not a branded domain email — blocks directory verification

`eeatminds.in@gmail.com` is the published business email. This is the single item
already flagged as `move 0` / priority 1 in `../../backlinks/02-tracker.csv`, and
the live site confirms it:

> "BLOCKS Clutch + GoodFirms verification — do this first"

Clutch, GoodFirms and several other high-authority directories require a
domain-matched email to verify a listing. A `@gmail.com` address on a business
that owns `eeatminds.in` also reads as less established to prospects.

*Severity: High — it gates the entire Foundation link campaign.
Fix: `shreyas@eeatminds.in`, then update the schema, contact page and footer.*

### 2. Opening hours declared as 00:00–23:59, seven days

Technically valid, and Google will render it as "Open 24 hours". For a
one-practitioner consultancy this is not credible and does not match how the
business actually operates. Real hours are a trust signal; 24/7 availability from
a solo freelancer reads as boilerplate.

*Severity: Low-Medium. Fix: declare genuine working hours.*

### 3. Geo/vertical pages carry no local schema

`/digital-marketing-freelancer-in-chennai` and
`/digital-marketing-freelancer-in-hyderabad` are full city-targeted landing pages
(1,984 and 1,918 words) — and both are reported as carrying **no structured data
at all**.

For city pages, `LocalBusiness`/`ProfessionalService` with a city-specific
`areaServed` is the mechanism that connects the page to local intent. Without it,
these pages compete on text alone.

> **Verification note:** the schema-absence figure comes from a regex that missed
> array-form `@type` declarations (e.g. `"@type": ["LocalBusiness", …]`). A
> re-verification pass with a proper JSON-LD parser is required before acting on
> this specific point — see `schema.md`.

## Google Business Profile

**Not assessed.** GBP data requires the Google Business Profile API or a
DataForSEO Maps query; neither is configured. The following remain unmeasured:

- GBP claim and verification status
- Review count, average rating, review velocity
- Photo count and posting cadence
- Category selection
- Map-pack ranking for "digital marketing freelancer in Bangalore" and variants
- NAP consistency across Google / Bing / Apple Maps / OSM

`../../backlinks/02-tracker.csv` already lists Google Business Profile as the
highest-leverage Foundation target, describing it as "highest leverage — local
intent query wins the map pack". That assessment stands and nothing here changes it.

## Citations

`sameAs` declares Facebook, YouTube and Instagram for the organisation. No
directory citations (Justdial, Sulekha, IndiaMART, Clutch, GoodFirms) appear in
the markup — consistent with the Foundation campaign not yet having been executed.
