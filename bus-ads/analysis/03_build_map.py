"""Project the shortlist + a faint BMTC network layer into SVG path data for the plan page.

Usage: python3 03_build_map.py <data_dir> <shortlist_geometry.json> <out.json>
"""
import json, math, sys
DATA, SHORT, OUT = sys.argv[1:4]
geo = json.load(open(SHORT))
PICKS = ["401-M", "215-H", "258-CC", "60-A", "410-FA", "80-A", "365-J", "MKT-5H", "176", "398-CH"]
SHOWROOMS = {"Rajajinagar": (12.9912863, 77.5579359), "Jayanagar": (12.9362412, 77.5807958),
             "Yeshwanthpur": (13.0291579, 77.5422155), "Jigani": (12.7745586, 77.6288569)}
pts = [p for r in PICKS for p in geo[r]]
lon0, lon1 = min(p[0] for p in pts) - 0.02, max(p[0] for p in pts) + 0.03
lat0, lat1 = min(p[1] for p in pts) - 0.015, max(p[1] for p in pts) + 0.015
k = math.cos(math.radians((lat0 + lat1) / 2))
W = 1000
H = round(W * (lat1 - lat0) / ((lon1 - lon0) * k))
def xy(lon, lat):
    return (round((lon - lon0) / (lon1 - lon0) * W, 1), round((lat1 - lat) / (lat1 - lat0) * H, 1))
def path(line):
    out, last = [], None
    for lon, lat in line:
        p = xy(lon, lat)
        if p != last:
            out.append(("M" if not out else "L") + f"{p[0]} {p[1]}"); last = p
    return "".join(out)

# faint network: every BMTC route, snapped to a ~4-unit grid, de-duplicated segments
seen, segs = set(), []
for f in json.load(open(f"{DATA}/routes.geojson"))["features"]:
    g = f["geometry"]
    for ln in (g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]):
        prev = None
        for lon, lat in ln:
            if not (lon0 <= lon <= lon1 and lat0 <= lat <= lat1):
                prev = None; continue
            x, y = xy(lon, lat); q = (round(x / 4) * 4, round(y / 4) * 4)
            if prev and math.hypot(q[0] - prev[0], q[1] - prev[1]) > 30:
                prev = q; continue  # skip straight-line jumps (bad shape data), ~1 km+
            if prev and q != prev:
                key = (min(prev, q), max(prev, q))
                if key not in seen:
                    seen.add(key); segs.append(f"M{prev[0]} {prev[1]}L{q[0]} {q[1]}")
            prev = q
landmarks = {"Majestic": (12.9775, 77.5713), "KR Market": (12.9634, 77.5767), "Nelamangala": (13.0985, 77.3936),
             "Kengeri": (12.9081, 77.4826), "Harohalli": (12.6806, 77.4741), "Bommasandra": (12.8169, 77.6950),
             "Banashankari": (12.9183, 77.5733), "Hebbal": (13.0358, 77.5970), "Electronic City": (12.8452, 77.6602)}
json.dump({
    "w": W, "h": H, "network": "".join(segs), "segments": len(segs),
    "routes": {r: path(geo[r]) for r in PICKS},
    "route_pts": {r: [xy(*p) for p in geo[r]] for r in PICKS},
    "showrooms": {s: xy(c[1], c[0]) for s, c in SHOWROOMS.items()},
    "landmarks": {n: xy(c[1], c[0]) for n, c in landmarks.items()},
    "scale_10km": round(10 / (111.32 * k) / (lon1 - lon0) * W, 1),
}, open(OUT, "w"))
print("viewBox", W, H, "network segments", len(segs))
