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

- `single.html` holds the single post. Its scene is a glazed navy tile wall of 600 mm modules meeting a glossy floor, with the certified tiles standing where they meet.
- `posts.html` holds the 3-slide carousel and the story.
- Brand colours come from naveentile.com: orange `#F26522` and blue `#4279B7`, on navy.
- Fonts are the site's own: Raleway for headings and Poppins for body text. They're self-hosted in `fonts/`.
- The logo (`assets/naveen-logo.png`) was extracted from the Diamondtile catalogue PDF. It's about 4× sharper than the website copy.
  `assets/naveen-logo-reversed.png` is the dark-background version: white wordmark, dove and tagline, with the brand-orange swoosh and E dots unchanged. It sits straight on the design with no white box.
- The ISI mark (`assets/isi-mark.png`) is the one shown on naveentile.com. `assets/isi-mark-white.png` is the same mark cleaned up as white line art so it sits straight on the navy.
- The tile faces are real Naveen designs. Each one is a single, whole tile, cropped exactly at its edges into `assets/tiles/` from the product photos and catalogue PDFs on naveentile.com. They are shown at true proportions (1 px = 2.5 mm) with square corners:

  | Certified variety | Tile shown | Source |
  |---|---|---|
  | 600×600 polished glazed floor (BIb) | 4254 Mizar, full face | `full-body-vitrified-tile.pdf`, "PGVT Tiles 600×600" page. Also sold on the website as a 600×600 floor tile. |
  | 400×400 glazed floor (BIIa) | 14500 | Website product photo. The sharp centre tile is cut out exactly; it's from the 405×405 outdoor floor series. |
  | 450×300 glazed wall (BIII) | 1115 L | `WALL-TILES-FINAL.pdf` (300×450 wall tiles). Shown landscape, as in the catalogue. |
  | 300×300 glazed floor & wall (BIII) | 1009 FL | `WALL-TILES-FINAL.pdf` (300×300 floor tiles) |
  | Unglazed vitrified, all sizes (BIa) | Full-body grey, 9051 Royal Brown, 5091 Grand Crema | `full-body-vitrified-tile.pdf`, from the "Full Body (unglazed)" and "Double Charged Tiles 600×600" pages |

  To swap in a different design, replace the matching file in `assets/tiles/`, keep its shape (square, or 3:2 landscape for the wall tile), and run `node render.js`.

To re-export after editing:

```bash
node render.js               # renders single.html and posts.html to export/*.png
node render.js single.html   # just the single post
```

Open `single.html` or `posts.html` in a browser to preview the artboards.
