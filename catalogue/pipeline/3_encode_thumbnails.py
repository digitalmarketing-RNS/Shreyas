"""Step 3 — fetch a hero image per design and encode it for the catalogue page.

Reads  designs.json  (from step 2)
Writes catalog.json  (same records + thumbnail data URI, colour and tone)

Originals in Drive run to several MB each, so we pull Drive's own resized
preview (`/thumbnail?sz=w800`) rather than the full file. Those previews are
re-encoded to WebP at THUMB_W and inlined as data URIs, because the published
page may not load images from external hosts.

Tone is read from the tile surface, not the whole frame: many source images are
studio sheets shot on a black or blown-out white backdrop, and averaging that in
turns every tile charcoal. BACKDROP pixels are dropped before averaging.
"""

from PIL import Image
import base64
import colorsys
import io
import json
import os
import subprocess
import sys

THUMB_W = 300          # px — sized so the whole set inlines under the artifact limit
QUALITY = 68           # starting WebP quality
MAX_BYTES = 23_000     # per-image ceiling; quality steps down until it fits
RAW_DIR = "raw"
WORKERS = 16

# The published page carries every thumbnail inline, so the whole set has to fit
# inside the artifact size limit once base64 adds its ~33%.
BUDGET_MB = 13.5


def fetch_all(designs):
    """Download one hero image per design into RAW_DIR (parallel, resumable)."""
    os.makedirs(RAW_DIR, exist_ok=True)
    jobs = []
    for i, d in enumerate(designs):
        out = f"{RAW_DIR}/{i:04d}.jpg"
        if not os.path.exists(out) or os.path.getsize(out) == 0:
            jobs.append((d["faces"][0]["id"], out))
    if not jobs:
        print(f"all {len(designs)} hero images already cached")
        return
    print(f"fetching {len(jobs)} hero images…")
    script = (
        'for a in 1 2 3; do '
        'c=$(curl -sS -L --max-time 90 '
        '"https://drive.google.com/thumbnail?id=$1&sz=w800" -o "$2" -w "%{http_code}"); '
        '[ "$c" = 200 ] && [ -s "$2" ] && exit 0; sleep $((a*2)); done; '
        'echo "FAILED $1" >&2'
    )
    # The trailing "sh" is the $0 placeholder, so the two words xargs feeds each
    # invocation land as $1 (file id) and $2 (output path).
    proc = subprocess.run(
        ["xargs", "-P", str(WORKERS), "-n", "2", "sh", "-c", script, "sh"],
        input="\n".join(f"{i} {o}" for i, o in jobs).encode(),
        stderr=subprocess.PIPE,
    )
    fails = proc.stderr.decode().strip()
    if fails:
        print(fails, file=sys.stderr)


def is_surface(px):
    """False for studio-backdrop pixels that would skew the tile's colour."""
    hi, lo = max(px), min(px)
    if hi < 26:                      # near-black backdrop
        return False
    if lo > 247 and hi - lo < 6:     # blown-out white backdrop
        return False
    return True


def tone_of(r, g, b):
    """Bucket an RGB triple into the showroom tone families used by the filters."""
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    hue = h * 360
    if v < 0.32:
        return "Black"               # darkness wins over hue: charcoals read as black
    if s < 0.10:
        return "White" if v > 0.80 else "Grey"
    if s < 0.20 and v > 0.72:
        return "Ivory"
    if hue < 16 or hue >= 345:
        return "Accent"
    if hue < 42:
        return "Beige" if v > 0.62 and s < 0.42 else "Brown"
    if hue < 165:
        return "Accent"
    if hue < 205:
        return "Blue" if s > 0.18 else "Grey"
    if hue < 265:
        return "Blue"
    return "Accent"


def colour_stats(im):
    """Average colour, dominant colour, luminance and tone from the tile surface."""
    w, h = im.size
    crop = im.crop((int(w * .08), int(h * .08), int(w * .92), int(h * .92)))
    px = list(crop.resize((64, 64), Image.LANCZOS).getdata())
    surface = [p for p in px if is_surface(p)]
    if len(surface) < len(px) * 0.15:   # an image that really is all one dark tone
        surface = px
    n = len(surface)
    avg = tuple(sum(p[i] for p in surface) // n for i in range(3))

    strip = Image.new("RGB", (n, 1))
    strip.putdata(surface)
    q = strip.quantize(colors=6, method=Image.MEDIANCUT)
    pal = q.getpalette()
    idx = sorted(q.getcolors(), reverse=True)[0][1]
    dom = (pal[idx * 3], pal[idx * 3 + 1], pal[idx * 3 + 2])

    lum = round((0.2126 * avg[0] + 0.7152 * avg[1] + 0.0722 * avg[2]) / 255, 4)
    return avg, "#%02x%02x%02x" % dom, lum, tone_of(*dom)


def encode(im):
    """WebP bytes at THUMB_W, stepping quality down until under MAX_BYTES."""
    ratio = THUMB_W / im.width
    thumb = im.resize((THUMB_W, max(1, round(im.height * ratio))), Image.LANCZOS)
    q = QUALITY
    while True:
        buf = io.BytesIO()
        thumb.save(buf, "WEBP", quality=q, method=5)
        if buf.tell() <= MAX_BYTES or q <= 48:
            return buf.getvalue()
        q -= 8


def main():
    designs = json.load(open("designs.json"))
    fetch_all(designs)

    out, total = [], 0
    for i, d in enumerate(designs):
        im = Image.open(f"{RAW_DIR}/{i:04d}.jpg").convert("RGB")
        avg, dom, lum, tone = colour_stats(im)
        data = encode(im)
        total += len(data)

        rec = dict(d)
        rec.pop("folders", None)
        rec.update(
            aspect=round(im.width / im.height, 4),
            rgb=list(avg), dom=dom, lum=lum, tone=tone,
            n_faces=len(d["faces"]),
            img="data:image/webp;base64," + base64.b64encode(data).decode(),
        )
        # Parking sheets print their own size and finish, so don't assert one.
        if rec["family"] == "Parking":
            rec["size"] = ""
        out.append(rec)

    json.dump(out, open("catalog.json", "w"))
    inline = total * 4 / 3 / 1e6
    print(f"encoded {len(out)} designs — {total/1e6:.2f} MB binary, ~{inline:.2f} MB inlined")
    if inline > BUDGET_MB:
        print(f"WARNING: over the {BUDGET_MB} MB budget — lower THUMB_W or QUALITY",
              file=sys.stderr)


if __name__ == "__main__":
    main()
