# Measurements: the original's UI system, from public screenshots

Date: 2026-10-06. Step: replica-design, step 1 ("measure, do not guess").
Inputs: `replica/recon.md` (Screens, Flows, Components), `replica/architecture.md` (stack), and the screenshots listed under Sources.
Output use: the token step reads this file and fills `tokens.json`. It changes the values, not the roles.

All values below are CSS pixels at a 1:1 scale unless a row says otherwise. Hex values are the original's own neutral and status colours. They are recorded so we know each role and its weight. We do not ship them. Their brand colour, its tints and shades, and their navy rail are described in words only, with their contrast numbers: the brand colour is recorded only as the role `accent`. Exact brand values are not kept in the repo; they can be re-read from the screenshots in the session scratchpad. Screen IDs (S05, S08 and so on) are the IDs from `recon.md`.

## How this was measured

- **Pages.** Each of the 8 pages below was fetched once with curl. Every response was the same 25 KB client-rendered shell with no `<img>` tags, because the article body loads later through JavaScript. So the image URLs were read from the rendered page through Firecrawl, the tool the recon step already used for these pages. That was one call per page, and all eight came from Firecrawl's cache, so no new request reached their server. There was no crawling and no link was followed.
- **Images.** 18 images came from pages P1 to P6, at most 6 per page. Twelve are listed under Sources. The other six are small crops of icons and one text link: the page fetch downloaded them, they were never used, and they are not listed. The help-centre logo and icons smaller than 26 px were skipped. Pages P7 and P8 showed no product screenshots when rendered, so nothing came from them. The images are stored only in the session scratchpad (`…/scratchpad/design/shots/`), outside the repo. No image was copied into the repo.
- **Tools.** Pillow was used for run-length scans along lines, bounding boxes, corner luma grids, per-channel ink percentiles and flat-pixel grey clustering. Each image was also viewed directly. The scripts are in the scratchpad, `design/scripts/`.
- **Text colour.** Every PNG capture uses Windows ClearType subpixel text, which adds colour fringes to stroke pixels. Text colours were therefore read as the 4th percentile of each channel over the stroke pixels. Fill colours were read only from solid areas.
- **Font size.** Size = cap height ÷ 0.711, the cap-height ratio of the font category we saw. One string was cross-checked by summing standard advance widths.
- **Departure from recon.** Measuring their screenshots departs from `recon.md` open question 5, which planned to design the look without measuring theirs. The step brief allowed their help-centre screenshots in the session scratchpad only. Some of them (p1-a, p2-b, p5-a, p6-a) show the original's logo or wordmark. They are never copied into the repo, and they are deleted when `/replica-design` closes.

### Scale of each image

| image | what it shows | natural size | scale | how the scale was set | confidence |
| --- | --- | --- | --- | --- | --- |
| p5-a (GIF, frames f000 and f066) | S05 lead list and S19 templates list, mid-2024 build | 1353 × 592 | 1.00 | The Windows mouse pointer is 12 × 19 px (its native size at 100%). The native checkbox is 13 × 13 px. A Windows activation watermark points to a 1366 px laptop | high |
| p1-a | S05 lead list, late-2024 build | 1600 × 751 | 1.00 | Six identical strings have the same pixel width as in p5-a (99, 127/126, 101, 59/58, 118 and 108 px). Native checkbox 13–14 px | high |
| p2-a, p2-b | S08 lead profile, 2025 build | 1600 × 981 | 1.00 | Same shell as p1-a: 45 px rail, 50 px header, same icon positions | high |
| p6-a | S34 teams with the hierarchy drawer open, 2022 build | 1248 × 704 | 1.00 | 41 px rail and 46 px header, both match p5-a | medium |
| p5-b | crop of the primary create button | 165 × 44 | 1.00 | 159 × 31 px, against 158 × 30 px for the same control in p5-a | medium |
| p1-b | crop of the title bar with the search-key menu open | 1600 × 223 | 1.02 | Page-title width is 130 px here and 127 px in p1-a | medium |
| p2-d | crop of the profile's section nav and field list | 885 × 673 | 1.20 | Key-value pitch is 40.9 px here and 34 px in p2-b | medium |
| p2-c | crop of the journey bar with all six steps | 1600 × 72 | 1.38 | Bar is 58 px here and 42 px in p2-b | medium |
| p4-a (GIF, frame f304) | S28 field builder in a wide modal | 854 × 406 | ~0.70 | Rail is 31 px here, against 41–45 px elsewhere. Input heights agree | low |
| p1-d, p1-e | crop of the filter bar (the two files are identical) | 1600 × 59 | ~1.07 | not used for measurements | — |
| six small crops | icons and one text link, downloaded by the page fetch | ≤ 279 px | — | never used and not listed under Sources; to be deleted from the scratchpad (icons are not ours to take) | — |

## Measurement table

| # | what | value (1:1) | method | image (scale) | source | confidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Left rail width (icon-only nav) | 45 px in the 2024–25 builds; 41 px in the mid-2024 and 2022 builds | horizontal run scan at mid-height | p1-a, p2-b (1.00); p5-a, p6-a (1.00) | [P1], [P2], [P5], [P6] | high |
| 2 | Left rail item pitch | 44 px (13 icons, centre to centre); icons about 20 px | icon centre spacing | p1-a (1.00) | [P1] | medium |
| 3 | Top header height | 49 px + 1 px border = 50 px (2024–25); 45 + 1 = 46 px (mid-2024, 2022) | vertical run scan | p1-a, p2-b, p5-a, p6-a | [P1], [P2], [P5], [P6] | high |
| 4 | Header bottom edge | 1 px #eeeeee line, then a faint 4–6 px fade (#f8f8f8 → #fdfdfd) | vertical run scan | p5-a (1.00) | [P5] | medium |
| 5 | Workspace picker in header | 300 × 34 px box, fill #f1f3f4, radius ≤ 3 px, 10 px right of the menu toggle | run scans | p1-a (1.00) | [P1] | high |
| 6 | Header icon buttons and avatar | 40 px pitch, about 20 px outline icons in the accent colour; avatar is a 29 px circle filled with the accent | run scans | p1-a (1.00) | [P1] | high |
| 7 | Page title bar | 55 px tall including its bottom shadow, white; title text 20 px | vertical run scan + cap height | p1-a, p5-a (1.00) | [P1], [P5] | high |
| 8 | Page gutter | content starts 20 px right of the rail; right gutter 13–20 px | horizontal run scan | p1-a, p2-b, p5-a | [P1], [P2], [P5] | high |
| 9 | Content width | fluid, no max width; the table fills the viewport less the rail and gutters at both 1353 and 1600 px | edge scans | p1-a, p5-a | [P1], [P5] | high |
| 10 | Gap between page sections | 16 px (title bar to table, cards to journey bar, journey bar to panel) | vertical run scans | p5-a, p2-b (1.00) | [P5], [P2] | high |
| 11 | Filter bar | white band about 56 px tall, holding 30 px inputs with about 13 px padding above and below | vertical run scan | p1-a (1.00) | [P1] | medium (the author's annotation box overlaps its edges) |
| 12 | Table header row | 42–43 px, fill #e0e3e7, 13 px medium-weight labels, sort carets | vertical run scan + cap height | p1-a, p5-a (1.00) | [P1], [P5] | high |
| 13 | Table body row pitch | 48 px (47 px row + 1 px divider); mean 47.8 px over 9 rows in p1-a, exactly 48 over 8 rows in p5-a | vertical run scan | p1-a, p5-a (1.00) | [P1], [P5] | high |
| 14 | Table row divider | 1 px, #edeeef to #f0f0f2 (very faint) | vertical run scan | p1-a, p5-a | [P1], [P5] | high |
| 15 | Row status marker | 4 px bar on the row's left edge, red (#e7483b) or green (#29a647), about 2 px radius | horizontal run scan | p1-a, p5-a | [P1], [P5] | high |
| 16 | Checkbox | 13 × 13 px (the browser's native control) | bounding box | p1-a, p5-a (1.00) | [P1], [P5] | high |
| 17 | Record-type badge in rows | 16 px circle, accent fill, white letter | bounding box | p1-a (1.00) | [P1] | medium |
| 18 | Table footer bar | 32 px tall, fill #f1f3f4; centred load-more button; record-count chip and rows-per-page select at the right | vertical run scan | p1-a, p5-a | [P1], [P5] | high |
| 19 | Table container corners | square (radius 0), no visible outer border | corner luma grid | p5-a (1.00) | [P5] | high |
| 20 | Filter input (outlined, small label sitting on the top border) | 30 px tall, 145 px wide, 10 px apart; border #cecece to #d9d9d9; radius 4 px | run scans + corner luma grid | p1-a (1.00) | [P1] | high (size), medium (radius) |
| 21 | Toolbar search field | 32 px tall, pill radius, border #e3e4e5 | vertical run scan | p5-a f066 (1.00) | [P5] | high |
| 22 | Toolbar outline button | 30 px tall, pill radius, 1 px accent border, accent text | vertical run scan | p5-a f066 (1.00) | [P5] | high |
| 23 | Primary filled button | 30–31 px tall, pill radius, one flat fill, exactly the accent (a saturated mid blue), white text with a leading icon and a trailing caret | run scans + solid fill sample | p5-b (1.00), p5-a f066 | [P5] | high |
| 24 | Small secondary button (load more) | 24 px tall, radius about 2 px, fill #f5f7f8, border #9ba1a5 | run scans + corner grid | p5-a (1.00), p1-a | [P5], [P1] | medium (bottom edge hidden by annotation in p1-a) |
| 25 | Rows-per-page select | 51 × 26 px, border #cacbc9 | run scans | p5-a (1.00) | [P5] | high |
| 26 | Record-count chip | 20 px tall, fill a pale tint of the accent, text #454b53, radius about 2 px | run scans + corner grid | p1-a, p5-a (1.00) | [P1], [P5] | high |
| 27 | Round icon button, active state | 31 px circle, fill #f3f3f3 | run scans | p1-a (1.00) | [P1] | high |
| 28 | Dropdown menu | item height 24–25 px, hover fill a near-white tint of the accent, item text #333437 | vertical run scan | p5-a f066 (1.00), p1-b (1.02) | [P5], [P1] | medium |
| 29 | Popover shadow | soft fade over 6–7 px below and to the right; darkest edge about #a9a9aa | run scans | p5-a f066 (1.00) | [P5] | medium |
| 30 | Side drawer | right-anchored, 731 px wide in a 1248 px viewport (about 58%); 46 px header with a 1–2 px light-accent rule; black scrim at 50% (white becomes #7f7f7f) | run scans | p6-a (1.00) | [P6] | medium (2022 build) |
| 31 | Form modal | wide panel from about 19% of the viewport to the right edge; sections alternate white and #f3f3f5; two-column field grid; footer bar #f9f9fa with a secondary button at left and the primary at right | run scans | p4-a (~0.70) | [P4] | low |
| 32 | Form modal controls | inputs about 28 px; buttons about 29–30 px; input border #d0d0d0 to #d7d7d7; a focused input's bottom border turns a pale blue-grey | run scans ÷ 0.70 | p4-a (~0.70) | [P4] | low |
| 33 | Profile summary strip | about 186 px tall; 1 px #ebebeb borders; square corners | vertical run scan | p2-b (1.00) | [P2] | medium |
| 34 | Journey (milestone) bar | 42 px chevron steps; current step fill a light tint of the accent, other steps #e7e7e7; 14 px step text; small grey count badge per step | run scans + solid fill | p2-b (1.00), p2-c (1.38) | [P2] | high |
| 35 | Profile section nav (left column) | 294 px wide; items 50 px pitch (57 px for a two-line item); active item has a grey fill and a 2–3 px accent bar on the left; 15–16 px text | run scans | p2-b (1.00), p2-d (1.20) | [P2] | high |
| 36 | Profile tabs | 18 px text; active tab in the accent with a 3 px underline (its core reads a shade darker than the accent); inactive about #8c8e8e | run scans + cap height | p2-b (1.00) | [P2] | medium |
| 37 | Key-value list | 34 px row pitch; label column 202 px; 14 px text; labels medium weight, values regular | ink row starts | p2-b (1.00), p2-d (1.20) | [P2] | high |
| 38 | Right action rail on the profile | 50 px wide, fill #fafafa, vertical stack of icon buttons, 20 px from the content panel | horizontal run scan | p2-b (1.00) | [P2] | high |
| 39 | Team tree blocks | 50 px tall rows, border #e3e2e6, a coloured count cell on the left of each block | vertical run scan | p6-a (1.00) | [P6] | medium |
| 40 | Font category | neo-grotesque sans: slightly narrow, fairly closed apertures, single-storey g, flagged 1, flat-sided round letters (the common Android/Material UI look) | zoomed glyphs | p1-a, p2-b (1.00) | [P1], [P2] | medium-high |
| 41 | Type sizes seen | 11–12 px (page footer), 13 px (table body and header), 14 px (labels, key-values, journey steps), 15–16 px (section nav, record name), 18 px (tabs), 20 px (page title), 24 px (secondary stat), 28–30 px (primary stat) | cap height ÷ 0.711 | p1-a, p2-b, p5-a (1.00) | [P1], [P2], [P5] | medium-high |
| 42 | Body size cross-check | a 19-character body string is 108 px wide in both builds, which works out to 13.2 px using standard neo-grotesque advance widths | advance-width sum | p1-a, p5-a (1.00) | [P1], [P5] | medium |
| 43 | Weights | regular (400) body; medium (500) for table headers, page titles and field labels; bold (700) for the record name | visual, at 6× zoom | p1-a, p2-b | [P1], [P2] | medium |
| 44 | Primary text colour | #000000 to #111111 (stroke cores reach luma 0 in the PNGs and 17 in the GIF) | luma percentiles of stroke pixels | p1-a, p2-b, p5-a | [P1], [P2], [P5] | high |
| 45 | Radius set | 0 (tables, summary cards), about 2 px (chips, small buttons, row markers), 4 px (inputs; cards in the 2022 build), pill (toolbar buttons, search field, avatars, badges) | corner luma grids | p1-a, p5-a, p6-a | [P1], [P5], [P6] | medium |
| 46 | Spacing values seen | 4 (marker), 10 (between filter inputs), 13 (filter bar padding), 16 (between sections), 20 (page gutter; content to rail) | run scans | p1-a, p2-b, p5-a | [P1], [P2], [P5] | medium |
| 47 | Dark theme | none seen in any capture | visual | all | all | high |

## Greys palette, as roles

The flat-pixel clustering pooled p1-a, p2-b and p5-a (frames f000 and f066). It counted a pixel only when it matched both neighbours in one direction, so anti-aliased text was left out. It found 10 neutral clusters above 0.05% of flat pixels. Three of those are icons, sort carets and the scroll thumb. That leaves **6 greys for fills and lines and 4 greys for text**. The canvas and the table header lean slightly cool (blue channel +3 to +7). The other greys are neutral.

| role | theirs (measured) | where it appears | contrast | note for our tokens |
| --- | --- | --- | --- | --- |
| `surface` | #ffffff | header, cards, table body, drawers | — | keep the role |
| `surface-subtle` | #f8f8f8 to #fafafa | title band, profile action rail, shadow fades | — | keep the role |
| `bg` (canvas) | #f1f3f4 | page background, table footer bar, workspace picker | — | keep the role |
| `border` (divider) | #ebebeb to #f0f0f2 | card borders, row dividers, panel edges | 1.15–1.19:1 (decorative, no AA rule) | keep it this faint for dividers |
| `surface-strong` | #e0e3e7 (cool) and #e7e7e7 (neutral) | table header fill; inactive journey steps | text on it 16.3:1 | one role is enough |
| `border-input` | #cecece to #d9d9d9 | input and select borders | **1.5:1, fails the 3:1 rule for UI parts** | ours must be at least 3:1 on `surface` |
| `text` | #000000 to #111111 | body, table cells, titles | 21:1 | ours can be a softer near-black |
| `text-strong-2` | #333437 | menu items | 12.5:1 | can merge into `text` |
| `text-secondary` | #60605e | inactive journey steps, page footer | 6.3:1 | can merge into `text-muted` |
| `text-muted` | #757575 to #8c8e8e | small labels, placeholders, inactive tabs, rows-per-page label | 4.6:1 to **3.3:1, the lighter end fails AA** | ours must reach 4.5:1 on both `surface` and `bg` |

Count: 6 fill-and-line greys (#ffffff, #f8f8f8, #f1f3f4, #ebebeb, #e0e3e7, about #d4d4d4) plus 4 text greys. They map onto 8 neutral roles: 6 for fills and lines (`bg`, `surface`, `surface-subtle`, `surface-strong`, `border`, `border-input`) and 2 for text (`text`, `text-muted`). The token template has 6 of these. `surface-subtle` and `surface-strong` are the 2 we add.

## Accent and other colour roles

| role | theirs (measured) | status | evidence | contrast |
| --- | --- | --- | --- | --- |
| `accent` | **a saturated mid blue** | **theirs, replaced by a placeholder** | exact solid fill on the primary button (p5-b) and the avatar (p1-a). Links, active tabs, header icons and rail highlights use shades of the same blue, read through ClearType | 3.56:1 with white, **fails AA for normal text both ways**. The same value is also a widely known third-party brand blue, which is one more reason not to use it |
| `accent-subtle` | light blue tints of the accent: a pale one (chip), a stronger one (current journey step) and a near-white one (menu hover) | theirs, replaced with the accent | solid fills | text on the chip tint is 6.6:1 |
| `nav-bg` (rail) | a dark navy | theirs, a brand colour, not taken | solid fill in every build. The help centre's own theme uses the same navy | rail icons #ececf2 on it 14.2:1; active icon in the accent 4.7:1 |
| `on-accent` | #ffffff | role kept | button text, badge letters | see `accent` |
| `success` | #29a647 (marker), #299347 (text), #5cb85c (progress fill) | role kept, values replaced | solid fills and ink | text 3.9:1 and progress fill 2.5:1, **both fail as text** |
| `warning` | #cc7239 | role kept, values replaced | status text | 3.5:1, **fails AA** |
| `danger` | #e7483b (marker), about #e6280d (error mark beside a contact) | role kept, values replaced | solid fill and ink | 3.9:1, **fails AA as text** |
| `scrim` | black at 50% | role kept | drawer overlay | — |

Placeholder for `accent` until `/replica-brand` picks our palette: a pure neutral grey, set in `tokens.json` (light #404040, dark #c4c4c4). Chroma is 0, so no hue from the original is carried over. In light it gives 10.37:1 with white text and 9.4:1 on the `bg` grey; in dark, 10.86:1 with its on-accent text. The slate first proposed here was dropped, because it sat at the original's hue.

## Density

**Compact**, with roomy table rows.

- Compact: 13 px table text, 30–32 px controls, 24–26 px menu items, 24 px small buttons, 20 px chips, 34 px key-value rows, a 44–45 px icon rail.
- Roomy: table body rows are 48 px. The profile uses larger type for its tabs (18 px) and section nav (15–16 px).
- Table density: 48 px rows with 1 px very faint dividers, no zebra stripes, a 42–43 px tinted header row, 10 rows per page by default.

Notes for the token step. These are suggestions, not measurements:
- Keep controls at 32 px. 30 px with a 13 px label is tight on a laptop.
- Use 14 px as the base and keep 13 px for dense table cells only.
- Rows of 44–48 px work well with a density toggle later.

## Layout facts

- **Shell.** A fixed left rail of icons only (41–45 px wide, 44 px per item), plus a white top header (46–50 px) holding a menu toggle, a workspace picker box, and at the right outline icon buttons and an avatar. There is no secondary sidebar on list screens.
- **Page title bar.** A white bar 55 px tall under the header, with the title (20 px), a saved-view picker and, at the right, a row of round icon buttons (search, columns, filter, export, more). It has a soft bottom shadow.
- **Filter bar (S05).** A white band about 56 px tall with 30 px outlined inputs, 10 px apart. An advanced-filter text button sits at the far right.
- **Content.** Fluid width, with a 20 px gutter from the rail and 16 px vertical gaps between blocks. The page canvas (#f1f3f4) shows between blocks.
- **Data tables.** Square corners, a 42–43 px tinted header with sort carets, 48 px rows, a 13 px native checkbox column, an optional 4 px coloured marker on the row's left edge, and a 32 px footer bar (load more, record count, rows per page). The templates list (S19) puts pill-shaped search, filter and create controls (30–32 px) in its title bar.
- **Detail page (S08).** A strip of three summary cards (about 186 px), a full-width 42 px chevron milestone bar, then a two-column panel: a 294 px section nav (50 px items) and a content column with 18 px tabs above a 34 px key-value list (202 px label column). A 50 px action rail runs down the right edge.
- **Overlays.** A right-side drawer (about 58% of the viewport) over a 50% black scrim for secondary views (S34). Wide form modals for configuration (S28), with sectioned bands and a sticky footer.
- **Breakpoints.** None seen. Every capture is a desktop width: 1248, 1353 or 1600 px.

## What we will not take

- **Brand colour.** Their accent blue with its tints and shades, the navy rail, and the help centre's theme colours. We keep the roles only.
- **Logo and wordmark.** Neither in the app header nor in the help-centre header. The help-centre logo was not downloaded.
- **Icons.** Not their rail icons, header icons, the coloured icons in the profile action rail, or their record-type badges. We use Lucide (ISC) instead.
- **Illustrations, photos and avatar images.** None.
- **Fonts.** We name only the category (neo-grotesque sans). The token step picks an open font that does the same job and never loads theirs.
- **Copy.** No label, message, tooltip or empty-state text. Every string in our product is written fresh. This file uses only generic words.
- **Layout signature.** This is the combination that makes their screens recognisable. We keep each function but give it our own form:
  - a dark navy icon-only rail with a white header, a grey workspace-picker box and accent outline icons at the top right;
  - the profile's three-card summary strip, with a score card that pairs a large number and a percentile;
  - the full-width chevron milestone bar with a light-blue current step and grey count badges;
  - the multi-coloured vertical action rail on the profile's right edge;
  - the pastel coloured count cells in the team tree;
  - coloured 4 px row-edge markers paired with lettered circle badges in tables.
- **Their screenshots.** They stay in the session scratchpad, outside the repo, and are used only for measuring. Some show the original's logo or wordmark. They are deleted when `/replica-design` closes.

## Sources

Pages. Each was fetched once with curl. Image URLs were read from Firecrawl's cached render, one call per page.

| ref | URL | what it gave us | images used |
| --- | --- | --- | --- |
| P1 | https://help.meritto.com/portal/en/kb/articles/lead-manager-an-overview | lead list (S05): shell, title bar, filter bar, table, footer | p1-a, p1-b, p1-d, p1-e |
| P2 | https://help.meritto.com/portal/en/kb/articles/one-view-lead-profile-27-2-2025 | lead profile (S08): summary strip, journey bar, section nav, tabs, key-value list, action rail | p2-a to p2-d |
| P3 | https://help.meritto.com/portal/en/kb/articles/configuring-lead-stages | two small crops only (an icon and a text link), never used | none |
| P4 | https://help.meritto.com/portal/en/kb/articles/create-a-custom-lead-fields | field builder (S28) in a wide modal, as an animated GIF | p4-a |
| P5 | https://help.meritto.com/portal/en/kb/articles/how-to-create-communication-templates | lead list and templates list (S05, S19) at 1:1, as an animated GIF; primary button crop | p5-a, p5-b |
| P6 | https://help.meritto.com/portal/en/kb/articles/user-management-and-team-hierarchy | teams (S34) with the hierarchy drawer, 2022 build | p6-a |
| P7 | https://help.meritto.com/portal/en/kb/articles/all-about-counsellor-allocation-automation | no product images in the rendered page | none |
| P8 | https://help.meritto.com/portal/en/kb/articles/see-what-s-new-at-meritto-october-2025-product-updates | no product images in the rendered page | none |

Image files. Natural size first, then the size shown on the page in brackets.

| file | page | size | URL |
| --- | --- | --- | --- |
| p1-a.png | P1 | 1600 × 751 (725 × 339) | https://help.meritto.com/galleryDocuments/edbsn7b873875bea91449097f09d19b0361ba7a3332f9b44064c25ce6bbc85fec4814d55f5b5ea96e62a58332c4fc815acc67c9431fc1ce7f64802c1bfc70dd192c67?inline=true |
| p1-b.png | P1 | 1600 × 223 (684 × 95) | https://help.meritto.com/galleryDocuments/edbsn7b873875bea91449097f09d19b0361ba1c272051ba8c60af2ee7270e7733b48ea9bbf786d92d8546169f861f8f342baa273b1f4e49887049ef93602542b7e74c?inline=true |
| p1-d.png | P1 | 1600 × 59 | https://help.meritto.com/galleryDocuments/edbsn7b873875bea91449097f09d19b0361ba12143b84f17d9ac9f85b5c65f15664e8242e3fc401b6d03b39419fc5e1cd1c11fd3f286798a77839c313c7de987bcaa1?inline=true |
| p1-e.png | P1 | 1600 × 59 (same bytes as p1-d) | https://help.meritto.com/galleryDocuments/edbsn7b873875bea91449097f09d19b0361ba9d96b63f4c67874f4b0739b84116d47906fa9e66a84f96fc400507eeb460f701c6bb27a5710bb44f8b214e4aa506fdab?inline=true |
| p2-a.png | P2 | 1600 × 981 (716 × 439) | https://lh7-rt.googleusercontent.com/docsz/AD_4nXfv_4UL_O7lYI09JKRlJGfoECL_wgk0521sQs7wF1cCi4JZ3I07Og6ex0NqWiD6kEY4ZSS-6zP_BsimXau6YXfS6pfaYjZe-3rhqTT0hVa6n_o787LzW9DGq06xzgJ9Gk9KYAwy_g?key=6RbHk40gKjn2uh0TuEQxpzfM |
| p2-b.png | P2 | 1600 × 981 (650 × 398) | https://lh7-rt.googleusercontent.com/docsz/AD_4nXdKhyGYaIgrTCSvRxsRl506bOzxxmLTe0gmt6NLRg1axRaa6TQTvKGwEUsGTjz9RMiQw4JceyWbyZIVPpbN3g9lMkHHwQ8G-lPUSXAqzKmmyfeRZ1L7yocJFWRyJ79w8cnV4p1HkQ?key=6RbHk40gKjn2uh0TuEQxpzfM |
| p2-c.png | P2 | 1600 × 72 (708 × 32) | https://help.meritto.com/galleryDocuments/edbsnd67d9376d725aa45dffa5f84229add55d3e32879f23caead51df1c7940c47eda5bc11a209703da652955f51d3282d00d947145378ec8a517fd0af6584cc2a089?inline=true |
| p2-d.png | P2 | 885 × 673 (371 × 281) | https://help.meritto.com/galleryDocuments/edbsnd67d9376d725aa45dffa5f84229add55c48361925c03e06d9d0a8173b30c639819447e8148df42ef85ce3c789a5ab99f1f1fd358b4d17aa0a21cfe22e6991c27?inline=true |
| p4-a.gif | P4 | 854 × 406, 608 frames | https://help.meritto.com/galleryDocuments/edbsnbe11570c6abdda3ce83b3278a7658a593027edc455c98228b5390f38fd21cef280fe73f8821c1737ff0841c8af4319485f0ebeca9ce902d5374a01d906ef2b9d?inline=true |
| p5-a.gif | P5 | 1353 × 592, 89 frames (624 × 273) | https://lh7-rt.googleusercontent.com/docsz/AD_4nXdEO7WmtHPZrZvgC9jQBczeARlFjnI1RYkvi_LG1z_dfSUP5RHEHLHoayPFyjsiffvG5J2hDwLutifWONZ6LU3w18mLFWC3y46LLAMo8GJCv47fRK9dOYaBTh1QRcLQtnLrNA9S-g?key=WYFt6Ywr415omDfcmHfcVdGM |
| p5-b.png | P5 | 165 × 44 (137 × 37) | https://lh7-rt.googleusercontent.com/docsz/AD_4nXc2d0tU2JGGo1j6_IyuSPR-OSPwhhjCm4msPrL17FU3emTwXrYqwZTpj8nt5IVDgooHEk0jGsOjqusaoikslAiuKAgZFgG7X3dIdfhpYUdilE6ZkgPksde68Ubbt8ULIHsdHSI0gw?key=WYFt6Ywr415omDfcmHfcVdGM |
| p6-a.png | P6 | 1248 × 704 (624 × 352) | https://lh7-rt.googleusercontent.com/docsz/AD_4nXeIaAh_ELVpriS4QEFsTq6Gekr4DWgjiIB1o4OSjLJ5deeGPoMH0-KQf3t8xBPJYLM7OrgMSE6Y6h9cpjqcWWRYt55AEH6Vh_0E3Yce7r8deLAFCnETUSIdJ6vjhf1zcs4nqjcb6w?key=ZL-1b1XAkOGsz822rzv_xXhS |

## Limits

- Help-doc screenshots show test accounts at desktop widths only. There are no mobile or tablet captures and no dark theme.
- Three builds (2022, mid-2024, 2024–25) differ by 4 px in rail width and header height. The table above gives both values.
- The doc author drew coloured annotation boxes (dark blue, red, green and purple) over p1-a, p2-a and p2-b. Those pixels were left out of every measurement, and edges hidden by them are marked medium.
- GIF frames use a reduced palette. GIF colours can be off by a few levels, so the PNGs are preferred for any colour that appears in both.
- Focus, hover, disabled, loading and error states were barely visible: one focused input in p4-a and one hovered menu item in p5-a. Those states are ours to design in the components step.
