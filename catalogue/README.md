# Naveen Tile — Master Catalogue

A single browsable index of every tile design in the shared Drive folder
[`DESIGNS NEW FOLDER 11.08.2026`](https://drive.google.com/drive/folders/1H7h215GQqsb6-OoVDaV1oyPVdBhs0DyO),
built so the sales team can answer "do we make 7130?" without opening Drive.

Current build: **1,329 designs from 1,993 source images**, 9 September 2026.

| Body | Designs | Formats |
|---|---:|---|
| PGVT — polished glazed vitrified | 724 | 600×600, 600×1200, 800×1600 mm |
| GVT — glazed vitrified | 396 | 600×600, 600×1200 mm |
| Parking — heavy-duty exterior | 180 | printed on each sheet |
| Carving — textured surface | 29 | 600×1200 mm |

The page filters by body, format, tone and series, searches on code or name, and
links every design back to its original full-resolution files on Drive.

## Regenerating after new designs are added

```
cd catalogue/pipeline
python3 1_crawl_drive.py        # -> tree.json      (walks the Drive folder)
python3 2_build_index.py        # -> designs.json   (files -> designs)
python3 3_encode_thumbnails.py  # -> catalog.json   (fetches + encodes images)
python3 4_build_page.py         # -> naveen-tile-master-catalogue.html
```

Requires `python3`, `curl` and Pillow (`pip install pillow`). Step 3 caches
downloads in `raw/`, so a re-run after adding designs only fetches what is new.
The finished HTML is a single self-contained file — it can be published as an
artifact, hosted anywhere, or emailed as-is.

`designs.json` here is the committed index (codes, names, formats, series and
Drive file IDs). It carries no image data, so it stays diffable: after a rebuild,
the diff shows exactly which designs were added or renamed.

## How the data is read

The folder is shared link-only, and Drive's search index reports it as empty for
an account it was only shared into — so step 1 reads Drive's `embeddedfolderview`
listing rather than querying the API.

**Read the whole folder, not the first page.** The first build of this catalogue
scraped the `_DRIVE_ivd` blob out of the normal folder page, which carries only
the first 50 items per folder. Four folders sat on exactly 50 and the build
silently lost about half the library — `GVT 60X120` alone has 243 files, not 50.
`embeddedfolderview` returns a folder in full. Step 1 now warns whenever a folder
lands on a round count, which is what that bug looked like from the outside.

**A design is not a file.** The same tile ships as several faces (`F1`…`F7`, or a
bare trailing number) so the pattern does not visibly repeat once laid, and it can
appear again under `RENDERS` as a room shot. Step 2 collapses all of those into
one design keyed on code + name, keeps the faces in order, and flags renders.
That is what turns 1,993 files into 1,329 designs.

**Codes and names come from the filenames**, which is where the shop floor already
keeps them (`7130 CLASSIC DYNA F3.jpg` → code `7130`, name `CLASSIC DYNA`, face 3).
Where a filename carries no code, the design is listed by name alone.

**Tone is measured from the tile surface, not the frame.** Many sources are studio
sheets shot on a black or blown-out white backdrop; averaging that in turns every
tile charcoal. Step 3 drops backdrop pixels before sampling, then buckets the
result into the eight tone families used by the filter.

## Known limits

- Thumbnails are compressed previews (300 px WebP) so all 1,329 fit in one file
  under the artifact size limit. The detail panel links to the full-resolution
  original on Drive. Step 3 prints the inlined total and warns if it exceeds
  `BUDGET_MB`; raising `THUMB_W` past ~300 px overflows the limit at this count.
- This folder holds only 4-digit design codes. The `1000`–`1099` and `11xxx`–`13xxx`
  series live in a separate `ALL DESIGNS` folder, which is not part of this build:
  the two folders share no files and only 23 of their codes overlap.
- Parking sheets print their own size and finish, and the folder does not state a
  format, so none is asserted for them — read it off the sheet.
- Anyone opening the page needs access to the Drive folder for the "open original"
  links to resolve; the catalogue itself works without it.
