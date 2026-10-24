import json, re, collections
R = json.load(open("data/near_routes.json"))
def base(n):
    n = n.strip()
    return n.split(" ")[0]          # "211 KBS-VLS" -> "211"; keeps "258-CC"
skip = lambda n: n.startswith(("V-KSRTC", "KSRTC", "VV-EXP", "V-DIVYA", "C BUS", "CS-"))
fam = collections.defaultdict(lambda: {"trips":0, "hits":collections.Counter(), "dist":{}, "km":[], "names":set(), "ends":set()})
for r in R:
    if skip(r["name"]): continue
    b = base(r["name"]); f = fam[b]
    f["trips"] += r["trips"]; f["names"].add(r["name"]); f["km"].append(r["km"])
    f["ends"].add(r["full_name"])
    for s, d in r["hits"].items():
        f["hits"][s] += r["trips"]; f["dist"][s] = min(d, f["dist"].get(s, 9999))
multi = {k: v for k, v in fam.items() if len(v["dist"]) > 1}
print("=== Routes passing 2+ showrooms (within 400 m)")
for k, v in sorted(multi.items(), key=lambda kv: -kv[1]["trips"]):
    print(f"{k:<14} {v['trips']:>4} trips/day  {dict(v['dist'])}  {max(v['km'])} km | {sorted(v['ends'])[:2]}")
for s in ["Rajajinagar", "Jayanagar", "Yeshwanthpur", "Jigani"]:
    print(f"\n=== {s}: top route numbers by trips/day passing (both directions, all variants)")
    rows = [(k, v) for k, v in fam.items() if s in v["dist"]]
    for k, v in sorted(rows, key=lambda kv: -kv[1]["hits"][s])[:30]:
        print(f"{k:<12} {v['hits'][s]:>4} trips  {v['dist'][s]:>4} m  {max(v['km']):>5} km | {sorted(v['ends'])[0]}")
