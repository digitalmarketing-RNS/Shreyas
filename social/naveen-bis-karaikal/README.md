# Naveen Tile — "Now BIS Certified" social post (Karaikal plant)

Announcement creatives for naveentile.com. The BIS product inclusion for the Karaikal plant was completed on 27 Oct 2026.

## Files to post (`export/`)

| File | Size | Use for |
|---|---|---|
| `naveen-bis-single-1080x1350.png` | 1080×1350 (4:5) | Single-image post: Facebook, LinkedIn, Instagram, WhatsApp |
| `naveen-bis-carousel-1-of-3.png` | 1080×1350 | Instagram/LinkedIn carousel, slide 1 (hero) |
| `naveen-bis-carousel-2-of-3.png` | 1080×1350 | Carousel slide 2: the certified varieties |
| `naveen-bis-carousel-3-of-3.png` | 1080×1350 | Carousel slide 3: licence detail + call to action |
| `naveen-bis-story-1080x1920.png` | 1080×1920 (9:16) | Instagram/Facebook/WhatsApp story. Content stays inside the safe zones. |

Captions, hashtags and alt text are in [`captions.md`](captions.md).

## Editing

All five artboards live in one file, `posts.html`, so the type, colours and components stay the same across them.

- Brand colours come from naveentile.com: orange `#F26522` and blue `#4279B7`, on navy.
- Fonts are the site's own: Raleway for headings and Poppins for body text. They're self-hosted in `fonts/`.
- The logo (`assets/naveen-logo.png`) was extracted from the Diamondtile catalogue PDF. It's about 4× sharper than the website copy.
- The ISI mark (`assets/isi-mark.png`) is the one shown on naveentile.com.
- The tile faces are drawn in SVG (marble, stone, satin, salt-and-pepper, geometric décor), so they stay sharp at any size.

To re-export after editing:

```bash
node render.js            # writes export/*.png at exact platform sizes
```

Open `posts.html` in a browser to preview all artboards together.
