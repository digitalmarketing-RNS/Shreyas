"""Step 2 — turn the raw file tree into one record per tile design.

Reads  tree.json     (from step 1)
Writes designs.json  — [{code, name, family, size, collection, faces:[...]}, ...]

A design is not a file. The same tile ships as several faces (F1..F7, or a bare
trailing number) so the pattern does not visibly repeat when it is laid, and the
same design can appear again under RENDERS as a room shot. All of those collapse
into one record, keyed on code + name, with the faces listed in order and room
renders flagged so the page can label them.
"""

import collections
import json
import os
import re

IMAGE_EXT = (".jpg", ".jpeg", ".png", ".webp")

# Top-level folder -> (body type, nominal format in mm)
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

# Folders that group other folders rather than naming a series.
CONTAINERS = {"NEW DEVALOP MORBI", "800X1600 CATTALOGUE DESIGN"}

# Series labels as they should read in the catalogue.
SERIES = {
    "DC TO PGVT": "DC to PGVT", "DRAFT": "Draft", "GLOSSY": "Glossy",
    "MATT": "Matt", "CARVING": "Carving", "GVT": "GVT", "POLISH": "Polish",
    "TERRAZZO": "Terrazzo", "RENDERS": "Renders", "PUNCH SERIES": "Punch Series",
    "SEAMLESS": "Seamless", "DARK & LIGHT": "Dark & Light",
}

FACE = re.compile(r"^(?P<base>.*?)[\s_-]*(?:F\s?(?P<f>\d+)|(?<=[A-Za-z])\s(?P<n>[2-9]))$")
RENDER = re.compile(r"RENDER|RENDOR|CONCEPT", re.I)


def split_face(stem):
    """'7130 CLASSIC DYNA F3' -> ('7130 CLASSIC DYNA', 3)."""
    m = FACE.match(stem)
    if m and m.group("base").strip():
        return m.group("base").strip(), int(m.group("f") or m.group("n"))
    return stem.strip(), 1


def parse_id(label, top):
    """Split a design label into (code, name)."""
    s = re.sub(r"\s+", " ", label).strip(" -_")
    s = re.sub(r"[\s_-]*(?:F|P)\s?\d+$", "", s, flags=re.I).strip(" -_")

    if top in ("Parking", "PARKING DESIGN"):
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


def main():
    tree = json.load(open("tree.json"))
    designs = {}

    for path, files in tree.items():
        parts = path.split("/")
        top = parts[0]
        if top not in CATEGORY:
            continue
        family, size = CATEGORY[top]
        images = [f for f in files if f["name"].lower().endswith(IMAGE_EXT)]
        if not images:
            continue
        is_render = bool(RENDER.search(path))

        # Under PGVT-60X120 a numbered folder *is* one design; its files are faces.
        leaf = parts[-1]
        if top == "PGVT-60X120" and len(parts) > 1 and re.match(r"^\s*\d{3,6}\b", leaf):
            groups = {leaf: images}
            sub = [p for p in parts[1:-1] if p not in CONTAINERS]
        else:
            groups = collections.defaultdict(list)
            for f in images:
                base, face_no = split_face(os.path.splitext(f["name"])[0])
                f["_face"] = face_no
                groups[base].append(f)
            sub = [p for p in parts[1:] if p not in CONTAINERS]

        series = SERIES.get(sub[0].strip().upper(), "") if sub else ""

        for base, faces in groups.items():
            faces.sort(key=lambda f: (f.get("_face", 1), f["name"]))
            code, name = parse_id(base, top)
            k = (top, key(code, name) or key("", base))
            d = designs.get(k)
            if d is None:
                d = designs[k] = {
                    "code": code, "name": name, "family": family, "size": size,
                    "collection": series, "top": top, "folders": [], "faces": [],
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
        print(f"  {v:4d}  {k[0]} {k[1] or '(size on sheet)'}")


if __name__ == "__main__":
    main()
