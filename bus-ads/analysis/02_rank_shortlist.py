"""Metrics for the shortlisted BMTC routes + simplified geometry for the map.

Usage: python3 02_rank_shortlist.py <data_dir> <out_dir>
<data_dir> holds routes.geojson, stops.csv, near_routes.json, route_depots.json
(see README in bus-ads/ for how to fetch them).
"""
import csv, json, math, sys
csv.field_size_limit(10**9)
DATA, OUT = sys.argv[1], sys.argv[2]

SHOWROOMS = {
    "Rajajinagar": (12.9912863, 77.5579359),
    "Jayanagar": (12.9362412, 77.5807958),
    "Yeshwanthpur": (13.0291579, 77.5422155),
    "Jigani": (12.7745586, 77.6288569),
}
KM_PER_BUS_DAY = 200  # rough BMTC average distance one bus covers in a day

PICKS = [  # (route, primary showroom, role)
    ("401-M", "Yeshwanthpur", "pick"), ("410-FA", "Yeshwanthpur", "pick"),
    ("258-CC", "Rajajinagar", "pick"), ("80-A", "Rajajinagar", "pick"),
    ("176", "Rajajinagar", "pick"), ("215-H", "Jayanagar", "pick"),
    ("60-A", "Jayanagar", "pick"), ("MKT-5H", "Jayanagar", "pick"),
    ("365-J", "Jigani", "pick"), ("398-CH", "Jigani", "pick"),
    ("258-C", "Yeshwanthpur", "reserve"), ("253-HE", "Yeshwanthpur", "reserve"),
    ("501-C", "Yeshwanthpur", "reserve"), ("215-K", "Jayanagar", "reserve"),
    ("369", "Jayanagar", "reserve"), ("365-N", "Jigani", "reserve"),
]

def dist_m(c, lat, lon):
    return math.hypot((lon - c[1]) * 111320 * math.cos(math.radians(c[0])), (lat - c[0]) * 110540)

stop_busy = {}
for r in csv.DictReader(open(f"{DATA}/stops.csv")):
    stop_busy[r["name"]] = max(int(r["trip_count"]), stop_busy.get(r["name"], 0))
depots = json.load(open(f"{DATA}/route_depots.json"))
routes = [f for f in json.load(open(f"{DATA}/routes.geojson"))["features"]]

rows, geo = [], {}
for name, primary, role in PICKS:
    dirs = [f for f in routes if f["properties"]["name"] == name]
    trips = sum(f["properties"]["trip_count"] for f in dirs)
    f0 = next(f for f in dirs if f["properties"]["direction_id"] == 0)
    g = f0["geometry"]
    line = g["coordinates"] if g["type"] == "LineString" else [p for l in g["coordinates"] for p in l]
    km = sum(dist_m((line[i][1], line[i][0]), line[i+1][1], line[i+1][0]) for i in range(len(line)-1)) / 1000
    near = {}
    for s, c in SHOWROOMS.items():
        d = min(dist_m(c, p[1], p[0]) for f in dirs for p in
                (f["geometry"]["coordinates"] if f["geometry"]["type"] == "LineString"
                 else [q for l in f["geometry"]["coordinates"] for q in l]))
        near[s] = round(d)
    passed = [s for s, d in near.items() if d <= 400]
    stops = f0["properties"]["stop_list"]
    stops = stops if isinstance(stops, list) else eval(stops)
    busy = sum(stop_busy.get(s, 0) for s in stops) / len(stops)
    one_way_trips = KM_PER_BUS_DAY / km
    rows.append({
        "route": name, "role": role, "primary_showroom": primary,
        "from_to": f0["properties"]["full_name"],
        "trips_per_day_both_dirs": trips, "route_km": round(km, 1),
        "showrooms_within_400m": "+".join(passed) or "none",
        "nearest_showroom_m": near[primary],
        "est_showroom_passes_per_bus_day": round(one_way_trips * max(1, len(passed))),
        "avg_stop_busyness": round(busy),
        "depot_hint": ",".join(f"D{k}" for k in sorted(depots.get(name, {}), key=lambda k: -depots[name][k])) or "confirm",
        "stops": " > ".join(stops),
    })
    geo[name] = [[round(p[0], 4), round(p[1], 4)] for p in line[::max(1, len(line)//120)]] + [[round(line[-1][0],4), round(line[-1][1],4)]]

with open(f"{OUT}/shortlist_metrics.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
json.dump(geo, open(f"{OUT}/shortlist_geometry.json", "w"))
for r in rows:
    print({k: v for k, v in r.items() if k != "stops"})
