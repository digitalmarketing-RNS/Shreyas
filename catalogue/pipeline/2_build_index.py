"""Step 2 — turn the raw file tree into one record per tile design.

Reads  tree.json     (from step 1)
Writes designs.json  — [{code, name, family, size, collection, source, faces}, ...]

A design is not a file. The same tile ships as several faces (F1..F7, DK/LT/HL/FL,
or a bare trailing number) so the pattern does not visibly repeat when it is laid,
and the same design can appear again under RENDERS as a room shot. All of those
collapse into one record, keyed on code + name, with the faces listed in order and
room renders flagged so the page can label them.

The two source folders are organised differently — the newer one names its top
folders by body and format (`PGVT 60X60`), the older one by product line
(`KKL WALL TILES/300X450`) — so body and format are resolved from the whole path
rather than from a fixed table of top-level names.
"""

import collections
import json
import os
import re

# Anything that is not obviously junk or a non-image is treated as a tile image:
# some files in the older library carry no extension at all (`C002DK`, `14103`)
# or an odd one (`.tif`), and Drive's thumbnail endpoint renders them all as JPEG.
SKIP_EXT = {".zip", ".xlsx", ".xls", ".pdf", ".db", ".ini", ".txt", ".doc", ".docx"}
SKIP_NAME = {"thumbs.db", ".ds_store", "desktop.ini"}

# Top-level folders of the newer library, which names body and format directly.
CATEGORY = {
    "CARVING-60X120": ("Carving", "600x1200"),
    "GVT 60X60":      ("GVT", "600x600"),
    "GVT 60X120":     ("GVT", "600x1200"),
    "Parking":        ("Parking", ""),        # size is printed on the sheet itself
    "PARKING DESIGN": ("Parking", ""),
    "PGVT 60X60":     ("PGVT", "600x600"),
    "PGVT 80X160":    ("PGVT", "800x1600"),
    "PGVT-60X120":    ("PGVT", "600x1200"),
}

# Body types recognised anywhere in a path, most specific first.
BODY_RULES = [
    (r"PARKING|PARKIGN|PARKGIN",     "Parking"),
    (r"DOUBLE\s*CHARGE|(?:^|/)DC$",  "Double Charge"),
    (r"NANO",                        "Nano"),
    (r"FULL\s*BODY",                 "Full Body"),
    (r"FLOOR",                       "Floor"),
    (r"ROOF",                        "Roof"),
    (r"WALL\s*TILES",                "Wall"),
]

# Folders that group other folders rather than naming a series.
CONTAINERS = {"NEW DEVALOP MORBI", "800X1600 CATTALOGUE DESIGN"}

# Series labels as they should read in the catalogue.
SERIES = {
    "DC TO PGVT": "DC to PGVT", "DRAFT": "Draft", "GLOSSY": "Glossy",
    "MATT": "Matt", "CARVING": "Carving", "GVT": "GVT", "POLISH": "Polish",
    "TERRAZZO": "Terrazzo", "RENDERS": "Renders", "PUNCH SERIES": "Punch Series",
    "SEAMLESS": "Seamless", "DARK & LIGHT": "Dark & Light",
}

# A bare number in a folder name is centimetres or inches depending on the value;
# these are the sizes this catalogue actually uses, so a lookup beats a guess.
CM   = {30: 300, 40: 400, 45: 450, 60: 600, 80: 800, 120: 1200}
INCH = {8: 200, 12: 300, 16: 400, 18: 450, 24: 600, 32: 800, 48: 1200}

SIZE_TOKEN = re.compile(r"(?<!\d)(\d{2,4})\s*[xX]\s*(\d{2,4})(?!\d)")
FACE = re.compile(r"^(?P<base>.*?)[\s_-]*(?:F\s?(?P<f>\d+)|(?<=[A-Za-z])\s(?P<n>[2-9]))$")
RENDER = re.compile(r"RENDER|RENDOR|CONCEPT", re.I)
# macOS writes an AppleDouble stub beside each real file on a FAT/SMB copy.
APPLEDOUBLE = re.compile(r"^\._")


def is_image(name):
    """False for AppleDouble stubs, OS clutter and non-image attachments."""
    if APPLEDOUBLE.match(name) or name.lower() in SKIP_NAME:
        return False
    return os.path.splitext(name)[1].lower() not in SKIP_EXT


def to_mm(a, b):
    """Normalise a size token to millimetres, or None if it is not a tile size."""
    out = []
    for v in (a, b):
        if v >= 200:
            out.append(v)            # already millimetres
        elif v in CM and v in INCH:
            return None              # genuinely ambiguous — don't guess
        elif v in CM:
            out.append(CM[v])
        elif v in INCH:
            out.append(INCH[v])
        else:
            return None
    return f"{out[0]}x{out[1]}"


def size_from_path(parts):
    """Deepest size token wins: '.../300X450/1001 - ROUGH BROWN' -> 300x450."""
    for seg in reversed(parts):
        m = SIZE_TOKEN.search(seg)
        if m:
            mm = to_mm(int(m.group(1)), int(m.group(2)))
            if mm:
                return mm
    return ""


def body_from_path(path):
    for pattern, body in BODY_RULES:
        if re.search(pattern, path, re.I):
            return body
    return ""


def split_face(stem):
    """'7130 CLASSIC DYNA F3' -> ('7130 CLASSIC DYNA', 3)."""
    m = FACE.match(stem)
    if m and m.group("base").strip():
        return m.group("base").strip(), int(m.group("f") or m.group("n"))
    return stem.strip(), 1


def parse_id(label, body):
    """Split a design label into (code, name)."""
    s = re.sub(r"\s+", " ", label).strip(" -_")
    s = re.sub(r"[\s_-]*(?:F|P)\s?\d+$", "", s, flags=re.I).strip(" -_")

    if body == "Parking":
        # '1-Plain Punch-014' -> code 014, name PLAIN PUNCH
        m = re.match(r"^\d+[\s-]*(.*)$", s)
        rest = (m.group(1) if m else s).strip(" -_")
        num = re.search(r"([A-Z0-9_]*\d{2,})\s*$", rest, re.I)
        if not num:
            return "", (rest.upper() or "PARKING")
        name = re.sub(r"[\s-]*" + re.escape(num.group(1)) + r"\s*$", "", rest)
        return num.group(1).upper(), (name.strip(" -_").upper() or "PARKING")

    s = re.sub(r"^SPL[\s-]*", "", s, flags=re.I).strip()
    m = re.search(r"\b(\d{3,6}[A-Za-z]?)\b", s)
    if not m:
        return "", s.upper()
    name = re.sub(r"\s+", " ", (s[:m.start()] + " " + s[m.end():])).strip(" -_")
    return m.group(1), (name.upper() or m.group(1))


def key(code, name):
    return re.sub(r"[^A-Z0-9]", "", (code + name).upper())


def resolve(source, parts):
    """Return (family, size, series) for one leaf folder."""
    top = parts[0] if parts else ""
    full = "/".join(parts)

    if top in CATEGORY:                       # newer library names both directly
        family, size = CATEGORY[top]
        body = body_from_path(full)
        # A parking sheet inside a PGVT folder is still parking.
        if body == "Parking" and family != "Parking":
            family, size = "Parking", ""
        sub = [p for p in parts[1:] if p not in CONTAINERS]
    else:
        family = body_from_path(full) or "Wall"
        size = "" if family == "Parking" else size_from_path(parts)
        sub = [p for p in parts if p not in CONTAINERS]

    series = ""
    for seg in sub:
        cleaned = re.sub(r"^\d+\.?\s*", "", seg).strip().upper()
        if cleaned in SERIES:
            series = SERIES[cleaned]
            break
    return family, size, series


def main():
    tree = json.load(open("tree.json"))
    designs = {}

    for full_key, files in tree.items():
        source, _, path = full_key.partition("|")
        parts = path.split("/") if path else []
        images = [f for f in files if is_image(f["name"])]
        if not images:
            continue

        family, size, series = resolve(source, parts)
        is_render = bool(RENDER.search(path))

        # A numbered leaf folder *is* one design; its files are that design's faces.
        leaf = parts[-1] if parts else ""
        if len(parts) > 1 and re.match(r"^\s*(?:SPL\s*)?\d{3,6}\b", leaf):
            groups = {leaf: images}
        else:
            groups = collections.defaultdict(list)
            for f in images:
                base, face_no = split_face(os.path.splitext(f["name"])[0])
                f["_face"] = face_no
                groups[base].append(f)

        for base, faces in groups.items():
            faces.sort(key=lambda f: (f.get("_face", 1), f["name"]))
            code, name = parse_id(base, family)
            k = (source, family, size, key(code, name) or key("", base))
            d = designs.get(k)
            if d is None:
                d = designs[k] = {
                    "code": code, "name": name, "family": family, "size": size,
                    "collection": series, "source": source, "folders": [], "faces": [],
                }
            if series and not d["collection"]:
                d["collection"] = series
            if path not in d["folders"]:
                d["folders"].append(path)
            seen = {f["id"] for f in d["faces"]}
            for f in faces:
                if f["id"] not in seen:
                    d["faces"].append({"id": f["id"], "name": f["name"], "render": is_render})

    out = list(designs.values())
    for d in out:
        d["faces"].sort(key=lambda f: (f["render"], f["name"]))   # swatch first, render last
    out.sort(key=lambda d: (d["family"], d["size"], d["code"] or "zzzz", d["name"]))

    json.dump(out, open("designs.json", "w"), indent=1)
    mapped = sum(len(d["faces"]) for d in out)
    print(f"{len(out)} designs from {mapped} images -> designs.json")
    for k, v in sorted(collections.Counter((d["family"], d["size"]) for d in out).items()):
        print(f"  {v:5d}  {k[0]} {k[1] or '(size on sheet)'}")
    print()
    for k, v in collections.Counter(d["source"] for d in out).most_common():
        print(f"  {v:5d}  {k}")


if __name__ == "__main__":
    main()
