# The `emptystate.85a4add5.svg` 404 — traced

Checked 2026-08-18 against live HTML. **The site is reachable from this session
now**, unlike when `12-site-audit.md` was written, so everything below is
measured from rendered source rather than inferred from search.

Short version: this is a Wix platform bug, not a fault in your site, and it
costs you nothing. Ignore it or suppress it in the crawler. Don't spend an
afternoon on it.

---

## What the crawler reported

| Field | Value |
|---|---|
| URL | `https://www.eeatminds.in/media/emptystate.85a4add5.svg` |
| Result | 404 Not Found |
| Link type | CSS `url()` |
| Depth | 2 |
| Linked from | 5 pages, all service pages |

---

## What it actually is

The reference lives inside a `<style>` block that Wix inlines into the page
HTML. It belongs to **Pro Gallery**, the gallery component Wix uses for image
grids. The rule:

```css
.pro-gallery-empty .pro-gallery-empty-image {
  margin: 66px auto 35px;
  width: 262px;
  height: 132px;
  background-image: url(media/emptystate.85a4add5.svg);
  background-size: contain;
}
```

That is the placeholder graphic Wix shows *inside the editor* when a gallery has
no images in it yet.

**The path is relative.** `url(media/…)` with no leading slash and no protocol.
Relative URLs in CSS resolve against the stylesheet's own location. Wix wrote
this CSS to be served from `static.parastorage.com/services/pro-gallery/…/`,
where a `media/` folder sits next to it and the file exists. But Wix then
**inlines the same CSS into your page HTML** to save a request. Inlined, the
stylesheet's location is your page, so the browser resolves it against
`https://www.eeatminds.in/…` instead — a path that has never existed on your
domain. Hence the 404.

You did not author this CSS, you cannot edit it, and no Wix setting exposes it.

---

## Evidence

```
$ curl -sSI https://www.eeatminds.in/media/emptystate.85a4add5.svg
HTTP/2 404
server: Pepyaka                       ← Wix's edge server
x-wix-request-id: 1787052974.7846954…  ← confirms Wix serves the 404
```

Both live pages in the "linked from" list carry it, and it is the **only**
broken relative `url()` on either:

| Page | `pro-gallery` refs | relative `url()` refs found |
|---|---|---|
| `/seo-freelancer-in-bangalore` | 2,386 | `media/emptystate.85a4add5.svg` — nothing else |
| `/freelance-social-media-marketing` | 1,632 | `media/emptystate.85a4add5.svg` — nothing else |

The class never appears in the markup, only in the stylesheet:

```
pro-gallery-empty inside <style> blocks : 27
pro-gallery-empty anywhere in the DOM   : 0
```

That last line is the whole impact assessment. **No element on your pages
matches the selector, so no browser ever requests the file.** A browser fetches
a `background-image` only when something on the page actually uses that class.
Nothing does. Only a crawler sees it, because crawlers parse every `url()` in
every stylesheet statically and fetch them all regardless of whether the rule
ever matches.

---

## What it costs you

**Effectively nothing.** Being specific, because "ignore it" is easier to accept
with the reasoning attached:

- **Ranking: no effect.** Google does not demote a page for a missing
  sub-resource. It demotes for missing resources that break *rendering* — a
  blocked CSS or JS file that stops Googlebot seeing your content. This is a
  decorative background on a hidden element.
- **Rendering: no effect.** Nothing visible is missing. The graphic is a
  placeholder for an empty gallery; your galleries have images.
- **Crawl budget: negligible.** Eleven indexed pages. Crawl budget is a concern
  above roughly 10,000 URLs.
- **Index pollution: none.** Wix's 404 page carries `<meta name="robots"
  content="noindex">`, verified in the response body.
- **Real cost:** it clutters your crawl reports, and it is one wasted request in
  a synthetic audit tool's waterfall.

Set against `12-site-audit.md`'s order of work, this sits below every one of the
ten items. It is not item 11 — it is not on the list.

---

## If you want it gone anyway

Three routes, best first.

**1. Suppress it in the crawler.** Add `/media/emptystate.85a4add5.svg` to the
tool's ignore or exclusion list. Correct answer for a third-party bug you don't
control — the report goes clean and stays honest, because there is nothing on
your side left to fix.

**2. Redirect the path.** Wix dashboard → **Marketing & SEO → SEO Tools → URL
Redirect Manager**. Old URL `/media/emptystate.85a4add5.svg`, new URL any real
image on the site. The crawler follows the 301 and stops reporting a 404. This
is cosmetic — it changes what the report says, not what your visitors get.
Bear in mind the filename hash changes whenever Wix rebuilds Pro Gallery, so the
redirect will silently go stale and a new hash will appear in a future crawl.

**3. Remove Pro Gallery from pages that don't need it.** The CSS is inlined only
because a gallery component exists on the page. Delete unused galleries and the
rule goes with them — plus you drop a meaningful chunk of the ~2.5 MB of HTML
those pages currently ship, which *does* help Core Web Vitals. Do this if the
galleries are decorative. Don't strip a gallery that is doing work just to
silence one line in a crawl report.

Not viable: hosting the file yourself. Wix Media Manager serves from
`static.wixstatic.com` and gives you no way to place a file at a literal
`/media/…` path on your own domain.

Worth one message to Wix support so it gets logged upstream. Don't wait on a
reply.

---

## Two things the same check confirmed

**The duplicate-page 301s are live and correct.** Item 2 in the audit's order of
work is done. Verified:

| URL | Status | Target |
|---|---|---|
| `/seo-expert-in-bangalore` | **301** | `/seo-freelancer-in-bangalore` |
| `/seo-freelancers-in-bangalore` | **301** | `/seo-freelancer-in-bangalore` |
| `/freelancer-for-social-media-marketing` | **301** | `/freelance-social-media-marketing` |
| `/seo-freelancer-in-bangalore` | 200 | — |
| `/freelance-social-media-marketing` | 200 | — |

Single hop each, straight to the winner, no chains. That was the largest
structural fault in the audit and it is closed.

It also explains the crawler's "linked from" list. Three of those five URLs no
longer serve pages — the crawl passed through them into the redirect targets and
attributed the asset to both. Nothing to fix there either.

**The audit's blocked list is now unblocked.** `12-site-audit.md` ends with
eight items that needed you to paste the page `<head>`. The site responds to
this session now, so those can be answered directly from live HTML — H1s, JSON-LD,
canonicals, Open Graph, meta robots, internal anchors, word counts, image alt
text. No paste needed. Say the word and that gets appended to the audit.
