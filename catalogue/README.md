# Naveen Tile — Master Catalogue

A single browsable index of every tile design in the shared Drive folder
[`DESIGNS NEW FOLDER 11.08.2026`](https://drive.google.com/drive/folders/1H7h215GQqsb6-OoVDaV1oyPVdBhs0DyO),
built so the sales team can answer "do we make 7130?" without opening Drive.

Current build: **506 designs from 1,018 source images**, first published 9 September 2026.

| Body | Designs | Formats |
|---|---:|---|
| PGVT — polished glazed vitrified | 328 | 600×600, 600×1200, 800×1600 mm |
| GVT — glazed vitrified | 98 | 600×600, 600×1200 mm |
| Carving — textured surface | 29 | 600×1200 mm |
| Parking — heavy-duty exterior | 51 | printed on each sheet |

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
an account it was only shared into — so step 1 reads the file list Google renders
into the folder page rather than querying the API.

**A design is not a file.** The same tile ships as several faces (`F1`…`F7`, or a
bare trailing number) so the pattern does not visibly repeat once laid, and it can
appear again under `RENDERS` as a room shot. Step 2 collapses all of those into
one design keyed on code + name, keeps the faces in order, and flags renders.
That is what turns 1,018 files into 506 designs.

**Codes and names come from the filenames**, which is where the shop floor already
keeps them (`7130 CLASSIC DYNA F3.jpg` → code `7130`, name `CLASSIC DYNA`, face 3).
Where a filename carries no code, the design is listed by name alone.

**Tone is measured from the tile surface, not the frame.** Many sources are studio
sheets shot on a black or blown-out white backdrop; averaging that in turns every
tile charcoal. Step 3 drops backdrop pixels before sampling, then buckets the
result into the eight tone families used by the filter.

## Known limits

- Thumbnails are compressed previews (440 px WebP) so the whole catalogue fits in
  one file. The detail panel links to the full-resolution original on Drive.
- Parking sheets print their own size and finish, and the folder does not state a
  format, so none is asserted for them — read it off the sheet.
- Anyone opening the page needs access to the Drive folder for the "open original"
  links to resolve; the catalogue itself works without it.
