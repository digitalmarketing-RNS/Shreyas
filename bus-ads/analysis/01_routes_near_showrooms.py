"""Find BMTC routes passing Naveen Tile Bangalore showrooms and score them for bus-ad ROI."""
import json, math, sys, re, collections

DATA = sys.argv[1]

SHOWROOMS = {
    "Rajajinagar": (12.9912863, 77.5579359),   # Dr Rajkumar Rd, Prakash Nagar
    "Jayanagar":   (12.9362412, 77.5807958),   # Elephant Rock Rd, near South End Circle
    "Yeshwanthpur": (13.0291579, 77.5422155),  # Tumkur Rd, near Goraguntepalya metro
    "Jigani":      (12.7745586, 77.6288569),   # Kalabalu, Jigani 2nd phase
}
NEAR_M = 400  # route geometry must pass within this distance of the showroom


def to_xy(lat, lon, lat0):
    # local equirectangular projection in metres
    return (math.radians(lon) * 6371000 * math.cos(math.radians(lat0)),
            math.radians(lat) * 6371000)


def seg_dist(p, a, b):
    ax, ay = a; bx, by = b; px, py = p
    dx, dy = bx - ax, by - ay
    if dx == dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def line_len_km(coords):
    lat0 = coords[0][1]
    pts = [to_xy(c[1], c[0], lat0) for c in coords]
    return sum(math.hypot(pts[i+1][0]-pts[i][0], pts[i+1][1]-pts[i][1]) for i in range(len(pts)-1)) / 1000


routes = json.load(open(f"{DATA}/routes.geojson"))["features"]
out = []
for f in routes:
    p = f["properties"]
    g = f["geometry"]
    lines = g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]
    hits = {}
    for name, (lat, lon) in SHOWROOMS.items():
        P = to_xy(lat, lon, lat)
        best = 1e9
        for ln in lines:
            # quick bbox reject (~2 km)
            if not any(abs(c[1]-lat) < 0.02 and abs(c[0]-lon) < 0.02 for c in ln[::5] + [ln[-1]]):
                continue
            pts = [to_xy(c[1], c[0], lat) for c in ln]
            for i in range(len(pts) - 1):
                d = seg_dist(P, pts[i], pts[i+1])
                if d < best:
                    best = d
        if best <= NEAR_M:
            hits[name] = round(best)
    if hits:
        stops = p["stop_list"]
        if isinstance(stops, str):
            stops = eval(stops)
        out.append({
            "name": p["name"], "full_name": p["full_name"], "dir": p["direction_id"],
            "trips": p["trip_count"], "stops": stops, "stop_count": p["stop_count"],
            "km": round(sum(line_len_km(l) for l in lines), 1), "hits": hits,
        })

json.dump(out, open(f"{DATA}/near_routes.json", "w"), indent=1)
print(len(out), "route-directions pass within", NEAR_M, "m of a showroom")
for s in SHOWROOMS:
    sub = [r for r in out if s in r["hits"]]
    print(f"\n== {s}: {len(sub)} route-directions, {sum(r['trips'] for r in sub)} trips/day")
    for r in sorted(sub, key=lambda r: -r["trips"])[:25]:
        print(f"  {r['name']:<28} {r['trips']:>4} trips  {r['km']:>5} km  {r['hits'][s]:>4} m  | {r['full_name']}  | other: {[k for k in r['hits'] if k != s]}")
