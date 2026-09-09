"""Step 5 — build the print master catalogue (A4) as paginated HTML.

Reads  designs.json      (from step 2)
       print_raw/        (w1600 sources from print_fetch)
Writes pdf/catalogue.html + pdf/img/*.jpg, ready for Chromium's print-to-PDF.

Two things drive the layout:

Each tile is shown at its real proportions — a 600x1200 prints as a 1:2
portrait, a 600x600 as a square — so the format reads off the page without
checking the caption. That means a page can only hold one shape at a time, so
the catalogue is sectioned by body and then by format, and the column count
changes with the shape to keep roughly a page's worth in every grid.

Pagination is computed here rather than left to the browser: every `.page` is
exactly A4 and breaks after itself, so the page numbers printed in the contents
and the index are the numbers that actually come out of the printer.
"""

import collections
import json
import os
import re
import sys
from PIL import Image

EXCLUDE_SERIES = {"Draft", "Renders", "Punch Series"}   # working files, not products
SRC_DIR = "print_raw"
OUT_DIR = os.environ.get("OUT", "pdf")
IMG_DIR = f"{OUT_DIR}/img"

# Grid shape per tile proportion. Columns are chosen so a full grid nearly fills
# the page whatever the shape: tall tiles need more, narrower columns.
LAYOUT = {
    "tall":   dict(cols=7, rows=4, ratio=(1, 2), px=(290, 580)),   # 1:2  → 28/page
    "mid":    dict(cols=5, rows=4, ratio=(2, 3), px=(420, 630)),   # 2:3  → 20/page
    "square": dict(cols=6, rows=6, ratio=(1, 1), px=(350, 350)),   # 1:1  → 36/page
}

BODY_ORDER = ["PGVT", "GVT", "Wall", "Full Body", "Nano", "Carving",
              "Double Charge", "Floor", "Roof", "Parking"]
BODY_NOTE = {
    "PGVT": "Polished glazed vitrified",
    "GVT": "Glazed vitrified",
    "Wall": "Ceramic wall tile",
    "Full Body": "Through-body porcelain",
    "Nano": "Nano-polished",
    "Carving": "Textured / carved surface",
    "Double Charge": "Double-charge vitrified",
    "Floor": "Ceramic floor tile",
    "Roof": "Roofing tile",
    "Parking": "Heavy-duty exterior",
}
FORMAT_ORDER = ["300x300", "300x450", "300x600", "600x600",
                "600x1200", "800x800", "800x1600", ""]

# Print run at 300dpi by default. Set SCALE=0.5 QUALITY=68 OUT=pdf-light for a
# screen/email copy of the same document.
SCALE = float(os.environ.get("SCALE", "1"))
JPEG_QUALITY = int(os.environ.get("QUALITY", "78"))

# 4 columns x 52 rows. Set from the measured row height (4.4mm) against the
# text block left after the heading and folio, not from a guess at line height.
INDEX_PER_PAGE = 208


def shape_of(size):
    """Which grid a format belongs in, from its real proportions."""
    if not size:
        return "square"                      # format unknown — don't imply one
    w, h = (int(v) for v in size.split("x"))
    r = w / h
    if abs(r - 0.5) < 0.02:
        return "tall"
    if abs(r - 2 / 3) < 0.02:
        return "mid"
    return "square"


def fmt_size(size):
    return size.replace("x", " × ") + " mm" if size else "Size not stated"


def code_key(design):
    """Ascending numeric order, the way codes are quoted on the floor."""
    out = []
    for part in re.split(r"(\d+)", design["code"] or "zzzz"):
        if part:
            out.append((0, int(part), "") if part.isdigit() else (1, 0, part.lower()))
    return (out, design["name"])


def prepare_image(src, dst, ratio, px):
    """Centre-crop a source to the tile's proportions and write it at print size."""
    im = Image.open(src).convert("RGB")
    target = ratio[0] / ratio[1]
    w, h = im.size
    if w / h > target:                        # too wide — trim the sides
        new_w = round(h * target)
        box = ((w - new_w) // 2, 0, (w - new_w) // 2 + new_w, h)
    else:                                     # too tall — trim top and bottom
        new_h = round(w / target)
        box = (0, (h - new_h) // 2, w, (h - new_h) // 2 + new_h)
    px = (max(1, round(px[0] * SCALE)), max(1, round(px[1] * SCALE)))
    im = im.crop(box).resize(px, Image.LANCZOS)
    im.save(dst, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)


def build_sections(designs):
    """Group into (body, format) sections in catalogue order."""
    buckets = collections.defaultdict(list)
    for d in designs:
        buckets[(d["family"], d["size"])].append(d)
    sections = []
    for body in BODY_ORDER:
        for size in FORMAT_ORDER:
            items = buckets.get((body, size))
            if items:
                items.sort(key=code_key)
                sections.append({"body": body, "size": size, "items": items,
                                 "shape": shape_of(size)})
    # anything with an unexpected body still gets printed rather than dropped
    seen = {(s["body"], s["size"]) for s in sections}
    for (body, size), items in sorted(buckets.items()):
        if (body, size) not in seen:
            items.sort(key=code_key)
            sections.append({"body": body, "size": size, "items": items,
                             "shape": shape_of(size)})
    return sections


def paginate(sections, first_page):
    """Split each section into pages and record the page each design lands on."""
    page = first_page
    for s in sections:
        lay = LAYOUT[s["shape"]]
        per = lay["cols"] * lay["rows"]
        # the first page of a section gives up one row to the section heading
        first_per = per - lay["cols"]
        s["start"] = page
        s["pages"] = []
        items = s["items"]
        chunk, taken = items[:first_per], first_per
        s["pages"].append(chunk)
        page += 1
        while taken < len(items):
            s["pages"].append(items[taken:taken + per])
            taken += per
            page += 1
        s["end"] = page - 1
        for n, chunk in zip(range(s["start"], s["end"] + 1), s["pages"]):
            for d in chunk:
                d["_page"] = n
    return page


CSS = """
@page { size: A4; margin: 0; }
*{box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact}
html,body{margin:0;padding:0;background:#fff;color:#14130f}
body{font-family:"Archivo","Helvetica Neue",Arial,sans-serif;font-size:8pt;line-height:1.4}

.page{width:210mm;height:297mm;padding:14mm 13mm 11mm;position:relative;
  overflow:hidden;background:#fff;page-break-after:always;break-after:page}
.page:last-child{page-break-after:auto;break-after:auto}

/* ---------- cover ---------- */
.cover{padding:0;display:flex;flex-direction:column}
.cover-art{display:grid;grid-template-columns:repeat(3,1fr);gap:0}
/* fixed cell height, not grid stretch: the row heights were resolving from the
   images' own proportions and spilling over the title block */
.cover-art img{width:100%;height:79mm;object-fit:cover;display:block}
.cover-body{flex:1;padding:18mm 16mm 14mm;display:flex;flex-direction:column}
.cover-rule{height:1.2mm;background:#0f524b;width:34mm;margin-bottom:9mm}
.cover h1{font-family:"Instrument Serif",Georgia,serif;font-weight:400;
  font-size:54pt;line-height:.94;margin:0 0 6mm;letter-spacing:-.01em}
.cover h1 em{font-style:italic;color:#0f524b}
.cover .mark{font-size:11pt;letter-spacing:.34em;text-transform:uppercase;
  font-weight:600;margin:0 0 4mm}
.cover .blurb{font-size:9.5pt;color:#4a4640;max-width:112mm;margin:0}
.cover .foot{margin-top:auto;display:flex;justify-content:space-between;
  align-items:flex-end;font-size:8pt;letter-spacing:.14em;text-transform:uppercase;
  color:#6e695f;border-top:.3mm solid #ded9d0;padding-top:4mm}
.cover .foot b{font-family:"IBM Plex Mono",monospace;font-size:15pt;color:#14130f;
  letter-spacing:0;display:block;margin-top:1.5mm;font-weight:500}

/* ---------- running furniture ---------- */
.head{display:flex;justify-content:space-between;align-items:baseline;
  border-bottom:.3mm solid #ded9d0;padding-bottom:2.5mm;margin-bottom:5mm}
.head .l{font-size:7.5pt;letter-spacing:.2em;text-transform:uppercase;color:#6e695f}
.head .l b{color:#14130f;font-weight:600}
.head .r{font-size:7.5pt;letter-spacing:.14em;text-transform:uppercase;color:#6e695f}
.folio{position:absolute;left:13mm;right:13mm;bottom:6mm;display:flex;
  justify-content:space-between;font-size:7pt;letter-spacing:.14em;color:#8a857a;
  text-transform:uppercase}
.folio .n{font-family:"IBM Plex Mono",monospace;letter-spacing:0}

/* ---------- section opener ---------- */
.sect{display:flex;justify-content:space-between;align-items:flex-end;
  margin-bottom:5mm;padding-bottom:3mm;border-bottom:.5mm solid #14130f}
.sect h2{font-family:"Instrument Serif",Georgia,serif;font-weight:400;font-size:26pt;
  line-height:1;margin:0}
.sect .meta{text-align:right;font-size:7.5pt;letter-spacing:.16em;
  text-transform:uppercase;color:#6e695f}
.sect .meta b{display:block;font-family:"IBM Plex Mono",monospace;font-size:12pt;
  color:#0f524b;letter-spacing:0;font-weight:500}

/* ---------- tile grid ---------- */
.grid{display:grid;gap:4mm}
.cell{display:flex;flex-direction:column;min-width:0}
.chip{width:100%;aspect-ratio:var(--ar,1 / 1);border:.25mm solid #d8d3c9;
  background:#f2efea;overflow:hidden}
.chip img{width:100%;height:100%;object-fit:cover;display:block}
.chip.empty{display:flex;align-items:center;justify-content:center;
  background:repeating-linear-gradient(45deg,#f2efea 0 2mm,#fff 2mm 4mm)}
.chip.empty span{font-size:6pt;letter-spacing:.1em;text-transform:uppercase;color:#8a857a}
.cap{padding-top:1.6mm}
.cap .code{font-family:"IBM Plex Mono",monospace;font-size:7pt;color:#0f524b;
  font-weight:500;letter-spacing:.02em}
.cap .nm{font-size:6.6pt;line-height:1.25;color:#3a362f;margin-top:.4mm;
  overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}

/* ---------- contents ---------- */
.toc h1,.idx h1{font-family:"Instrument Serif",Georgia,serif;font-weight:400;
  font-size:30pt;margin:0 0 7mm;line-height:1}
.toc table{width:100%;border-collapse:collapse}
.toc td{padding:2.6mm 0;border-bottom:.25mm solid #eae6df;vertical-align:baseline}
.toc .b{font-size:10pt;font-weight:600;color:#14130f}
.toc .s{font-size:8.5pt;color:#4a4640}
.toc .c{font-family:"IBM Plex Mono",monospace;font-size:8pt;color:#6e695f;
  text-align:right;white-space:nowrap;padding-left:6mm}
.toc .p{font-family:"IBM Plex Mono",monospace;font-size:9.5pt;color:#0f524b;
  text-align:right;white-space:nowrap;padding-left:6mm;font-weight:500}
.note{margin-top:8mm;padding-top:4mm;border-top:.3mm solid #ded9d0;
  font-size:7.5pt;color:#6e695f;line-height:1.6;max-width:150mm}

/* ---------- index ---------- */
.idx .cols{column-count:4;column-gap:6mm;font-size:6.8pt}
.idx .row{display:flex;justify-content:space-between;gap:1.5mm;
  padding:.5mm 0;break-inside:avoid}
.idx .row .k{font-family:"IBM Plex Mono",monospace;color:#14130f;white-space:nowrap}
.idx .row .v{font-family:"IBM Plex Mono",monospace;color:#8a857a}
.idx .row .t{color:#6e695f;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;
  flex:1;padding-left:1.5mm}

/* ---------- closing ---------- */
.end{display:flex;flex-direction:column;justify-content:center;align-items:center;
  text-align:center;height:100%}
.end .mark{font-size:12pt;letter-spacing:.34em;text-transform:uppercase;font-weight:600}
.end .rule{height:1mm;background:#0f524b;width:26mm;margin:7mm 0}
.end p{font-size:8.5pt;color:#6e695f;max-width:112mm;line-height:1.7;margin:0 0 3mm}
"""


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def cell_html(d, has_img):
    code = esc(d["code"] or "—")
    name = esc(d["name"])
    inner = (f'<img src="img/{d["_img"]}" alt="">' if has_img
             else '<span>No image</span>')
    return (f'<div class="cell"><div class="chip{"" if has_img else " empty"}">'
            f'{inner}</div><div class="cap"><div class="code">{code}</div>'
            f'<div class="nm">{name}</div></div></div>')


def grid_html(items, lay):
    w, h = lay["ratio"]
    style = (f'grid-template-columns:repeat({lay["cols"]},1fr);'
             f'--ar:{w} / {h}')
    cells = "".join(cell_html(d, d.get("_img")) for d in items)
    return f'<div class="grid" style="{style}">{cells}</div>' 


def page(inner, cls="", folio=None, total=None, left=""):
    f = ""
    if folio:
        f = (f'<div class="folio"><span>{esc(left)}</span>'
             f'<span class="n">{folio} / {total}</span></div>')
    return f'<div class="page {cls}">{inner}{f}</div>'


def build_html(sections, designs, total_pages, gen_date, hero):
    P = []

    # --- cover -------------------------------------------------------------
    art = "".join(f'<img src="img/{h}" alt="">' for h in hero)
    P.append(page(
        f'<div class="cover-art">{art}</div>'
        f'<div class="cover-body">'
        f'<div class="cover-rule"></div>'
        f'<p class="mark">Naveen Tile</p>'
        f'<h1>Master<br><em>Catalogue</em></h1>'
        f'<p class="blurb">The complete surface library — vitrified, glazed, carved, '
        f'wall, floor and parking tiles. Every design is shown at its true '
        f'proportions, so the format reads at a glance.</p>'
        f'<div class="foot"><span>Designs<b>{len(designs):,}</b></span>'
        f'<span>Formats<b>{len({d["size"] for d in designs if d["size"]})}</b></span>'
        f'<span>Bodies<b>{len({d["family"] for d in designs})}</b></span>'
        f'<span style="text-align:right">Edition<b>{gen_date}</b></span></div>'
        f'</div>', cls="cover"))

    # --- contents ----------------------------------------------------------
    rows = []
    last_body = None
    for s in sections:
        body = s["body"] if s["body"] != last_body else ""
        last_body = s["body"]
        rows.append(
            f'<tr><td class="b">{esc(body)}</td>'
            f'<td class="s">{esc(fmt_size(s["size"]))}</td>'
            f'<td class="c">{len(s["items"])} designs</td>'
            f'<td class="p">{s["start"]}</td></tr>')
    P.append(page(
        f'<div class="toc"><h1>Contents</h1><table>{"".join(rows)}</table>'
        f'<p class="note">Tiles are printed at their real proportions and listed in '
        f'ascending code order within each format. An index of every code, with its '
        f'page, is at the back of this catalogue. Colours are reproduced as faithfully '
        f'as printing allows; ask for a physical sample before specifying.</p></div>',
        folio=2, total=total_pages, left="Contents"))

    # --- sections ----------------------------------------------------------
    for s in sections:
        lay = LAYOUT[s["shape"]]
        for n, chunk in enumerate(s["pages"]):
            pno = s["start"] + n
            if n == 0:
                head = (f'<div class="sect"><h2>{esc(s["body"])}</h2>'
                        f'<div class="meta">{esc(BODY_NOTE.get(s["body"], ""))}'
                        f'<b>{esc(fmt_size(s["size"]))}</b></div></div>')
            else:
                head = (f'<div class="head"><div class="l"><b>{esc(s["body"])}</b> '
                        f'&nbsp;{esc(fmt_size(s["size"]))}</div>'
                        f'<div class="r">continued</div></div>')
            P.append(page(head + grid_html(chunk, lay), folio=pno, total=total_pages,
                          left=f'{s["body"]} · {fmt_size(s["size"])}'))

    # --- index -------------------------------------------------------------
    ordered = sorted(designs, key=code_key)
    idx_pages = [ordered[i:i + INDEX_PER_PAGE]
                 for i in range(0, len(ordered), INDEX_PER_PAGE)]
    start = sections[-1]["end"] + 1
    for n, chunk in enumerate(idx_pages):
        rows = "".join(
            f'<div class="row"><span class="k">{esc(d["code"] or "—")}</span>'
            f'<span class="t">{esc(d["name"])}</span>'
            f'<span class="v">{d["_page"]}</span></div>' for d in chunk)
        title = "<h1>Index of codes</h1>" if n == 0 else ""
        head = "" if n == 0 else ('<div class="head"><div class="l">'
                                  '<b>Index of codes</b></div>'
                                  '<div class="r">continued</div></div>')
        P.append(page(f'<div class="idx">{title}{head}<div class="cols">{rows}</div></div>',
                      folio=start + n, total=total_pages, left="Index"))

    # --- closing -----------------------------------------------------------
    P.append(page(
        '<div class="end"><p class="mark">Naveen Tile</p><div class="rule"></div>'
        f'<p>{len(designs):,} designs · {gen_date} edition</p>'
        '<p>Designs, formats and finishes are subject to change. Shade and calibration '
        'may vary between production batches; always confirm against a current sample '
        'before ordering.</p></div>', cls="end"))

    fonts = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
             'family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&'
             'family=Instrument+Serif:ital@0;1&display=swap">')
    return (f'<!doctype html><html><head><meta charset="utf-8">{fonts}'
            f'<style>{CSS}</style></head><body>{"".join(P)}</body></html>')


def pick_hero(designs):
    """Six cover tiles spanning the tonal range rather than six of the same stone."""
    try:
        tones = {(c["source"], c["family"], c["size"], c["code"], c["name"]): c["tone"]
                 for c in json.load(open("catalog.json"))}
    except OSError:
        return [d["_img"] for d in designs if d.get("_img")][:6]
    want = ["Black", "Brown", "Blue", "Beige", "Grey", "White"]
    by_tone = collections.defaultdict(list)
    for d in designs:
        if not d.get("_img"):
            continue
        t = tones.get((d["source"], d["family"], d["size"], d["code"], d["name"]))
        if t:
            by_tone[t].append(d["_img"])
    out = [by_tone[t][len(by_tone[t]) // 2] for t in want if by_tone.get(t)]
    spare = [d["_img"] for d in designs if d.get("_img")]
    while len(out) < 6 and spare:
        out.append(spare.pop(len(spare) // 2))
    return out[:6]


def main():
    designs = [d for d in json.load(open("designs.json"))
               if d["collection"] not in EXCLUDE_SERIES]
    os.makedirs(IMG_DIR, exist_ok=True)
    index_by_id = {id(d): i for i, d in enumerate(designs)}

    # map each kept design back to the raw file that step 3 / print_fetch named
    full = json.load(open("designs.json"))
    pos = {}
    for i, d in enumerate(full):
        pos[(d["source"], d["family"], d["size"], d["code"], d["name"])] = i

    sections = build_sections(designs)
    end = paginate(sections, first_page=3)
    idx_count = -(-len(designs) // INDEX_PER_PAGE)
    # `end` is the first index page; the last numbered page is the last index page
    total_pages = end + idx_count - 1        # the closing page is unnumbered

    print(f"{len(designs)} designs, {len(sections)} sections, {total_pages} numbered pages")

    missing = 0
    for s in sections:
        lay = LAYOUT[s["shape"]]
        for d in s["items"]:
            raw = f'{SRC_DIR}/{pos[(d["source"], d["family"], d["size"], d["code"], d["name"])]:04d}.jpg'
            name = f'{pos[(d["source"], d["family"], d["size"], d["code"], d["name"])]:04d}_{s["shape"]}.jpg'
            dst = f"{IMG_DIR}/{name}"
            if not os.path.exists(dst):
                try:
                    prepare_image(raw, dst, lay["ratio"], lay["px"])
                except Exception:
                    missing += 1
                    continue
            d["_img"] = name
    print(f"images prepared; {missing} designs have no usable source")

    gen = os.environ.get("EDITION", "September 2026")
    hero = pick_hero(designs)
    html = build_html(sections, designs, total_pages, gen, hero)
    out = f"{OUT_DIR}/catalogue.html"
    open(out, "w", encoding="utf-8").write(html)
    size = sum(os.path.getsize(f"{IMG_DIR}/{f}") for f in os.listdir(IMG_DIR))
    print(f"wrote {out} — {len(html)/1e6:.1f} MB html, {size/1e6:.1f} MB images")


if __name__ == "__main__":
    main()
