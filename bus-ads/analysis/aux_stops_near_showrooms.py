import json, math, sys
S = {"Rajajinagar": (12.9912863, 77.5579359), "Jayanagar": (12.9362412, 77.5807958),
     "Yeshwanthpur": (13.0291579, 77.5422155), "Jigani": (12.7745586, 77.6288569)}
def hav(a, b):
    la1, lo1 = map(math.radians, a); la2, lo2 = map(math.radians, b)
    h = math.sin((la2-la1)/2)**2 + math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
    return 2*6371000*math.asin(math.sqrt(h))
st = json.load(open("data/stops.geojson"))["features"]
for name, c in S.items():
    near = []
    for f in st:
        lon, lat = f["geometry"]["coordinates"][:2]
        d = hav(c, (lat, lon))
        if d <= 600:
            p = f["properties"]
            rl = p["route_list"] if isinstance(p["route_list"], list) else eval(p["route_list"])
            near.append((d, p["name"], p["trip_count"], rl))
    print(f"\n===== {name}")
    for d, n, t, rl in sorted(near):
        print(f"{d:5.0f} m  {n:<45} {t:>5} trips/day  routes({len(rl)}): {', '.join(rl[:40])}{' ...' if len(rl)>40 else ''}")
