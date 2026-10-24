"""Map route numbers to BMTC depots from depot tags in route-variant names (e.g. '215-C D34G-KMT', 'Depot-27 Gate').

Usage: python3 aux_route_depots.py <data_dir>   -> writes <data_dir>/route_depots.json
Partial by nature: only variants that carry a depot tag are counted. Confirm depots with the ad vendor.
"""
import collections, csv, json, re, sys
csv.field_size_limit(10**9)
D = sys.argv[1]
dep = collections.defaultdict(collections.Counter)
for r in csv.DictReader(open(f"{D}/routes.csv")):
    b = r["name"].strip().split(" ")[0]
    for m in re.findall(r"D(\d{1,2})G\b", r["name"]) + re.findall(r"Depot-(\d{1,2}) Gate", r["full_name"]):
        dep[b][int(m)] += int(r["trip_count"])
json.dump({k: dict(v) for k, v in dep.items()}, open(f"{D}/route_depots.json", "w"))
print(len(dep), "route numbers with a depot tag")
