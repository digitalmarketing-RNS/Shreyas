# Images — eeatminds.in

## Delivery and optimisation — strong, no action needed

Wix's image CDN handles this well. Sampled homepage assets:

| Size | Format | File |
|---|---|---|
| 2.4 KB | WebP | Logo.webp |
| 2.1 KB | JPEG | Digital marketing freelancer in bangalore.jpg |
| 6.3 KB | PNG | eeat digital marketing freelancers in bangalore.png |
| 3.2 KB | JPEG | Shreyas V Patil.jpg |
| 1.5 KB | JPEG | 37f1b4_42a918b26125458d9595c22773a07473f000.jpg |
| 0.9 KB | AVIF | Cost Effective.avif |

Every sampled asset is **under 7 KB**, automatically resized to the rendered
dimensions, with format negotiated per request (`enc_avif`, `quality_auto` in the
URL parameters).

Homepage format mix: **11 AVIF, 5 WebP, 12 PNG, 8 JPG**. The PNG/JPG entries are
still served as AVIF to browsers that accept it — the extension in the URL is not
the delivered format.

**Do not spend effort on image compression or format conversion.** This is the
best-performing part of the site and Wix handles it automatically.

## Lazy loading

33 of 36 homepage images use `loading="lazy"` — correct for below-fold content.

**One error:** the site logo (first image in the DOM, above the fold) is
lazy-loaded. Above-fold images should load eagerly; deferring the logo delays its
paint and can affect LCP if it is the largest above-fold element.

*Severity: Low-Medium. Fix: `loading="eager"` on the logo and any hero image.*

## Missing dimensions — the real issue

**35 of 36 homepage images have no `width`/`height` attributes.**

Without intrinsic dimensions the browser cannot reserve layout space, so content
reflows as each image arrives. This is the classic cause of Cumulative Layout
Shift, and it applies site-wide, not just to the homepage.

Wix normally emits dimensions; their absence here suggests images placed in
containers that size them via CSS instead.

*Severity: Medium-High — but unconfirmed. Without CLS field data this is a known
risk factor, not a measured failure. Check Search Console's Core Web Vitals report
before rebuilding anything.*

## Alt text — 12.4% gap

**121 of 974 images across 85 pages have no `alt` attribute.**

| Page | Missing | Total | Share |
|---|---|---|---|
| `/best-digital-marketer-in-india` | 24 | 44 | 55% |
| `/freelance-social-media-marketing` | 14 | 35 | 40% |
| `/seo-freelancer-in-bangalore` | 12 | 125 | 10% |
| `/outsource-digital-marketing-services` | 10 | 12 | **83%** |
| `/ppc-services` | 9 | 10 | **90%** |

`/ppc-services` and `/outsource-digital-marketing-services` are effectively
alt-text-free.

**Quality where present is good** — homepage examples include "EEAT-focused
digital marketing freelancer in Bangalore", "Shreyas V Patil", and named client
logos ("iLaundry client logo - EEAT Minds"). Descriptive, keyword-relevant,
not stuffed. The gap is coverage, not writing.

*Severity: Medium. Accessibility obligation first — screen-reader users get
nothing from 121 images — with image-search visibility as the secondary gain.*

## Priority

1. Alt text on `/ppc-services` (9/10) and `/outsource-digital-marketing-services` (10/12) — under an hour
2. Alt text on `/best-digital-marketer-in-india` (24 missing) and `/freelance-social-media-marketing` (14)
3. Set `loading="eager"` on the logo
4. Add width/height site-wide — **only after confirming CLS is actually failing**
