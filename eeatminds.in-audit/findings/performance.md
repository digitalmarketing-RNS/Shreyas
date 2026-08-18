# Performance — eeatminds.in

Method: direct measurement (homepage). **No Core Web Vitals field data** — the
keyless PageSpeed Insights quota was exhausted (`429 Quota exceeded`), and CrUX
requires an API key. Everything below is measured resource/timing data, not
Lighthouse or real-user metrics.

## Measured

| Metric | Value | Read |
|---|---|---|
| TTFB | 0.19 – 0.51 s | ✅ good (Fastly CDN, cache HIT) |
| Full download | 0.26 – 0.65 s | ✅ good |
| HTML transferred | **194 KB** (compressed) | ⚠️ heavy for a document |
| HTML parsed | **1,325 KB** | ⚠️ large DOM/parse cost |
| External scripts | 12 | typical for Wix |
| Inline `<script>` blocks | **50, totalling 388 KB** | ⚠️ main-thread cost |
| Stylesheets (`<link>`) | 0 — CSS is inlined/JS-injected | Wix pattern |
| Images on homepage | 36 | |
| `preconnect` hints | present via HTTP `link:` header | ✅ |

Compression is working well: 1,325 KB of HTML ships as 194 KB. The concern is not
bandwidth but **parse and execution** — 1.3 MB of markup plus 388 KB of inline
JavaScript is main-thread work before the page becomes interactive, which is what
INP and TBT measure.

## Images — genuinely well optimised

Wix's image CDN is doing good work here. Sampled homepage images:

```
  2.4 KB  image/webp   Logo.webp
  2.1 KB  image/jpeg   Digital marketing freelancer in bangalore.jpg
  6.3 KB  image/png    eeat digital marketing freelancers in bangalore.png
  3.2 KB  image/jpeg   Shreyas V Patil.jpg
  0.9 KB  image/avif   Cost Effective.avif
```

Every sampled asset is under 7 KB, automatically resized and format-negotiated.
Format mix on the homepage: 11 AVIF, 5 WebP, 12 PNG, 8 JPG — so 16/36 already
serve modern formats, and Wix negotiates AVIF via `Accept` for others.

**Image weight is not a problem on this site.** Do not spend effort here.

## Two real risks

### 1. No dimensions on any image → CLS exposure

**35 of 36 homepage images have no `width`/`height` attributes.** Without
intrinsic dimensions the browser cannot reserve space, so content shifts as
images load. This is the single most likely cause of a poor CLS score.

*Severity: Medium-High. Cannot be confirmed without field data — see below.*

### 2. The logo, above the fold, is lazy-loaded

```
img1 (EEAT Minds Logo)   loading="lazy"   ← above the fold
img2 (hero)              eager
```

Lazy-loading an above-fold image defers its request until layout, which can delay
LCP. 33 of 36 images are lazy-loaded, which is right for the other 32.

*Severity: Low-Medium.*

## Third-party scripts

`browser.sentry-cdn.com` (error tracking), `cdn.pagebooster.net`, plus Wix's own
`static.parastorage.com` (68 references). Sentry and PageBooster are additions on
top of the Wix baseline and both cost main-thread time.

## What this section cannot tell you

**No LCP, INP or CLS numbers.** Getting them needs one of:

- **PageSpeed Insights with an API key** (free) — lab metrics + CrUX field data
- **CrUX API with a key** — 25 weeks of real-user history
- **Search Console → Core Web Vitals report** — free, no key, already available to you

Given the CLS risk above, this is worth doing before acting: if CLS is already
passing, the missing dimensions matter less than they appear.

*Category score withheld — insufficient data for a defensible number.*
