# Can Google see the proof images inside your Wix galleries?

Checked 2026-08-18 against live server HTML of `/seo-freelancer-in-bangalore`
and `/freelance-social-media-marketing`.

**Short answer: Google can crawl the image files, and it can read your alt text.
Whether it can *index them in Google Images* is doubtful, because every gallery
item ships to the crawler inside a `display:none` container.** The client-growth
screenshots and the Search Console proof are all in that state.

One thing I could not do from here is render the page in a real browser —
Chromium in this session has no network egress, so the post-JavaScript state is
unverified. The authoritative test is yours to run and takes two minutes; it is
at the bottom.

---

## What is working

Wix server-renders the gallery. That is better than the common failure mode
where a JS widget ships an empty container and the crawler sees nothing.

| Check | Result |
|---|---|
| Images in raw HTML as real `<img src>` | ✅ 125 on the SEO page, 35 on the social page |
| Real file URLs, not placeholders | ✅ all point at `static.wixstatic.com/media/…` |
| Image files reachable | ✅ HTTP 200, `content-type: image/png` |
| `X-Robots-Tag: noindex` on images | ✅ none |
| Image host blocked by robots | ✅ no — `static.wixstatic.com/robots.txt` 403s, and Google treats a 4xx robots.txt as "no restrictions" |
| Your robots.txt blocks Googlebot from galleries | ✅ no — the `Disallow: /pro-gallery-webapp/…` lines apply only to **AdsBot and Bingbot**, not Googlebot or `*` |

So nothing is *blocking* Google. The problem is different.

---

## The problem: every gallery item is `display:none`

Measured on the raw HTML, before any JavaScript runs:

| Page | Gallery item containers | `display:none` | Not hidden |
|---|---|---|---|
| `/seo-freelancer-in-bangalore` | 90 | **90** | **0** |
| `/freelance-social-media-marketing` | 13 | **13** | **0** |

Every one carries `opacity:0; display:none` plus `aria-hidden="true"`, and every
gallery `<img>` is `loading="lazy"`. There is no `<link rel="preload" as="image">`
for any of them.

These are **slideshow** galleries — 378 slideshow markers across 14 gallery
instances on the SEO page. A slideshow shows one slide at a time by design, so
even after JavaScript hydrates and reveals the active slide, the other five stay
hidden. The 90 containers are only 14 unique images; Pro Gallery clones the set
five times for infinite-loop scrolling.

**Why this matters specifically for Google Images.** Google's image
documentation is explicit that an image has to be visible in the *rendered* page
to be eligible for Google Images. Images suppressed with CSS are routinely not
indexed. Best case here, one slide per gallery is a candidate and the rest are
not. Worst case, hydration doesn't complete inside the render budget and none
are.

This is a well-documented risk pattern, not a certainty — which is exactly why
the Search Console test below is worth running rather than taking my word.

**What is *not* at risk:** the page's own ranking. Googlebot renders JavaScript,
your alt text sits in the raw HTML either way, and the page's topical relevance
does not depend on image indexation. This affects image search visibility and
the visual credibility signal, not the blue link.

---

## These images exist nowhere else on the page

I checked whether the proof screenshots appear as ordinary Wix images anywhere
outside the galleries. They do not — all 14 unique media IDs appear only inside
gallery markup:

| Image | Alt text as shipped |
|---|---|
| `…cf16f466…` | Naveen tile search console proof of our achievement |
| `…33869a72…` | Naveen tile ranking #1 for Top Tiles Company on Google |
| `…fe9a96c5…` | Naveen tile ranking #1 for Tile Manufacture on Google |
| `…c21b0f64…` | Semrush Data Proof of our claim |
| `…a167ed36…` | Semrush Data Proof of our claim -2 |
| `…2477b61c…` | RNSIT Ranking #1 for keyword broader meaning of education |
| `…20d8d824…` | RNSIT Ranking #1 for keyword Core Branches of Engineering on Google |
| `…75f4aeed…` | RNSIT Ranking #1 for keyword top MCA college in Bangalore |
| `…afa7e649…` | Semrush volume for keyword - broader meaning of education |
| `…fab2df82…` | Registration Arena Ranking #1 for company registration in pune |
| `…eaae629d…`, `…8021eb23…` | *(empty)* |

There is no fallback copy. If the gallery doesn't render, the proof is gone.

---

## Alt text problems found while checking

**`/freelance-social-media-marketing` has no alt text on any gallery image.**
All 13 are empty. That page's entire visual social proof is invisible to Google
in every sense.

On the SEO page:

- 2 gallery images with empty alt (`…eaae629d…`, `…8021eb23…`), sitting in the
  middle of the RNSIT results sequence
- Filenames used as alt text: `Custom.avif`, `punniya.avif`,
  `Reporting & Refinement.png`
- Typo in live alt text: **"SEO Backlink budilding services"**
- Generic gallery `aria-label` values reading `image` and `video`

---

## What to do, in order

**1. Lift your three strongest proofs out of the gallery.** Place them as normal
Wix **Image** elements directly on the page — not in a gallery, not in a
slideshow. A static image element renders visible, unconditionally, for every
crawler. Suggested: the Naveen tile Search Console screenshot, one RNSIT #1
ranking, the Registration Arena #1. Keep the gallery for the rest if you like
the carousel.

**2. Put the claim in text next to each screenshot.** This is the bigger win and
it is independent of everything above. Google cannot read a Search Console
screenshot — it has no idea what the graph shows. A line of real text under each
image ("Naveen Tiles moved from position 40 to #1 for *top tiles company in
Bangalore* between March and July 2026, Search Console data") is worth more than
the image being indexed, and it feeds E-E-A-T, AI Overviews and Perplexity
citations too. Right now your strongest credibility asset is locked in pixels.

**3. Write alt text for the 13 social-page images and the 2 empty ones here.**
Describe what the screenshot proves, not what it is. "Search Console graph
showing Naveen Tiles clicks rising from 120 to 1,400 per month" beats "search
console proof".

**4. Fix the three filename alts and the "budilding" typo.** Ten minutes.

**5. Optional: switch the galleries from slideshow to grid layout.** A grid
renders every item visible at once instead of one at a time, which removes the
hidden-item problem for the whole set. Do this only if the layout still looks
right — item 1 already covers the images that matter.

Not worth doing: chasing an image sitemap. Your sitemap has zero `<image:image>`
entries because Wix does not generate them and does not let you supply your own.
It is a minor signal and there is no clean route to it on this platform.

---

## The test that settles it — run this yourself

I cannot render the live page from this session. You can, and Google will tell
you directly what it sees:

1. **Search Console → URL Inspection.** Paste
   `https://www.eeatminds.in/seo-freelancer-in-bangalore` → **Test Live URL** →
   **View Tested Page** → **Screenshot** tab. If the proof images appear in
   Google's own screenshot, they rendered. If the gallery area is blank or shows
   one slide, that is your answer.
2. Same screen, **HTML** tab — search it for `cf16f466` (the Search Console
   proof). Present means Google received the markup.
3. **Search Console → Performance → Search type: Image.** Switch the filter from
   Web to Image. If that report is empty or near-zero over 12 months, no image on
   the site is earning image-search impressions today, gallery or not.

Send me the screenshot and the Image-search numbers and I will tell you exactly
which of the five actions above you actually need.
