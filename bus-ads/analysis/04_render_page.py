import json
M = json.load(open("map.json"))
for k in ("segments",): M.pop(k, None)
ROUTES = [
 dict(rank=1, no="401-M", cluster="nw", showroom="Yeshwanthpur", ends="Kengeri ↔ Yeshwanthpur", via="Kengeri, Nagarbhavi, Kottigepalya, Summanahalli, Laggere, Nandini Layout, Goraguntepalya", trips=328, dist="138 m", passes=10, busy=984, depot="Kengeri D12 / Kottigepalya D31",
      why="The busiest route past the Yeshwanthpur showroom. It runs the west Outer Ring Road through Kengeri, Nagarbhavi and Laggere, a large belt of new and rebuilt independent houses."),
 dict(rank=2, no="215-H", cluster="jay", showroom="Jayanagar", ends="Majestic ↔ Jambusavari Dinne", via="Lalbagh, South End Circle, Jayanagar, JP Nagar, Puttenahalli, Kothnur", trips=129, dist="50 m", passes=10, busy=874, depot="Kothnur D34",
      why="Stops at South End Circle, 50 m from the showroom. Then covers Jayanagar and JP Nagar homeowners and the new builds of JP Nagar 7th–9th Phase and Kothnur."),
 dict(rank=3, no="258-CC", cluster="nw", showroom="Rajajinagar + Yeshwanthpur", ends="Majestic ↔ Nelamangala", via="Dr. Rajkumar Road, Navarang, Yeshwanthpur, Peenya, Dasarahalli, Madavara, Makali, Nelamangala", trips=17, dist="31 m / 138 m", passes=15, busy=740, depot="Dasanapura D40 (258 family)",
      why="The only route that passes two showrooms on every trip. It stops right outside Rajajinagar (Navarang Bar stop), then runs the Tumkur Road growth corridor to Nelamangala. Few buses run it, so the vendor must lock the bus to this route. The fallback is 258-C."),
 dict(rank=4, no="60-A", cluster="jay", showroom="Jayanagar", ends="Vijayanagar ↔ Jayanagar 9th Block", via="Attiguppe, Mysore Road, Chamarajpet, Basavanagudi, South End Circle, Jayanagar 4th Block", trips=175, dist="58 m", passes=15, busy=566, depot="Confirm",
      why="Old-Bengaluru homeowners from Vijayanagar through Chamarajpet and Basavanagudi to Jayanagar, the renovation market. Passes 60 m from the showroom about 15 times a day per bus."),
 dict(rank=5, no="410-FA", cluster="nw", showroom="Yeshwanthpur", ends="Yeshwanthpur ↔ Banashankari", via="Goraguntepalya, Nandini Layout, Kottigepalya, Nagarbhavi, Hosakerehalli, Banashankari", trips=316, dist="166 m", passes=10, busy=884, depot="Confirm (passes Depot 31)",
      why="The second-busiest route in the set. It links the Yeshwanthpur showroom with the south-west and ends at Banashankari, 2 km from the Jayanagar showroom."),
 dict(rank=6, no="80-A", cluster="nw", showroom="Rajajinagar", ends="Majestic ↔ Nandini Layout", via="Okalipuram, Rajajinagar (10 stops), Navarang, Mahalakshmi Layout, Nandini Layout", trips=134, dist="254 m", passes=28, busy=651, depot="Kottigepalya D31",
      why="A short loop through the heart of Rajajinagar, one block from the showroom. Each bus passes about 28 times a day, the most of any pick."),
 dict(rank=7, no="365-J", cluster="jig", showroom="Jigani", ends="Majestic ↔ Jigani APC Circle", via="Wilson Garden, Dairy Circle, Bilekahalli, Arekere, Hulimavu, Gottigere, Bannerghatta, Jigani", trips=96, dist="1.5 km", passes=7, busy=1031, depot="Jigani D27",
      why="The main bus line into Jigani. It runs all of Bannerghatta Road, which has the busiest stops of any pick. It ends at Jigani APC Circle, 1.5 km from the showroom, so put directions to the showroom on the ad."),
 dict(rank=8, no="MKT-5H", cluster="jay", showroom="Jayanagar", ends="KR Market ↔ Harohalli", via="Basavanagudi, Jayanagar 6th Block, Konanakunte, Vajarahalli, Thalaghattapura, NICE Road junction, Harohalli", trips=77, dist="77 m", passes=5, busy=369, depot="Confirm",
      why="Starts at KR Market, a daily stop for masons and contractors. It passes the Jayanagar showroom and runs the whole Kanakapura Road new-housing corridor."),
 dict(rank=9, no="176", cluster="nw", showroom="Rajajinagar", ends="Hampinagar ↔ Kaval Byrasandra", via="Vijayanagar, Bashyam Circle, Rajajinagar, Malleswaram, Palace Ground, RT Nagar", trips=197, dist="254 m", passes=11, busy=669, depot="Confirm",
      why="The most frequent route through Rajajinagar. It crosses the affluent west and north: Vijayanagar, Malleswaram and RT Nagar."),
 dict(rank=10, no="398-CH", cluster="jig", showroom="Jigani", ends="Bommasandra ↔ Harohalli", via="Bommasandra industrial area, Jigani, Kallubalu, Tattekere, Harohalli", trips=22, dist="24 m", passes=6, busy=107, depot="Jigani D27",
      why="Passes the Jigani showroom door on every trip, linking Bommasandra and Harohalli through Anekal villages where new houses are going up. Traffic is light, so this bus is for the door pass, not for reach."),
]
RESERVES = [
 dict(no="258-C", cluster="nw", showroom="Yeshwanthpur", ends="Majestic ↔ Nelamangala", via="Malleswaram, Yeshwanthpur, Peenya, Dasarahalli, Makali", trips=168, dist="138 m", passes=7, busy=1017, depot="Dasanapura D40",
      why="Swap in for 258-CC if that route can't be locked. Same Tumkur Road corridor, ten times the trips, but it skips the Rajajinagar showroom."),
 dict(no="253-HE", cluster="nw", showroom="Yeshwanthpur", ends="Yeshwanthpur ↔ Hesaraghatta", via="Jalahalli Cross, Dasarahalli, Bagalagunte, Chikkabanavara", trips=86, dist="138 m", passes=10, busy=814, depot="Confirm",
      why="Hesaraghatta Road growth belt, starting at the Yeshwanthpur showroom."),
 dict(no="501-C", cluster="nw", showroom="Yeshwanthpur", ends="Hebbal ↔ Kengeri", via="Outer Ring Road west: Goraguntepalya, Nagarbhavi, Mallathahalli", trips=115, dist="225 m", passes=8, busy=897, depot="Hebbal D14 / Kengeri D12",
      why="Outer Ring Road from Hebbal to Kengeri. Overlaps 401-M west of Goraguntepalya and adds the Hebbal side."),
 dict(no="215-K", cluster="jay", showroom="Jayanagar", ends="KR Market ↔ Anjanapura", via="South End Circle, Banashankari, JP Nagar, Konanakunte, Anjanapura", trips=81, dist="77 m", passes=15, busy=549, depot="D44",
      why="Anjanapura's BDA layouts are full of plots under construction. Short route, so more passes per bus."),
 dict(no="369", cluster="jay", showroom="Jayanagar", ends="KR Market ↔ Hulimavu", via="Jayanagar, MICO Layout, Bilekahalli, Arekere, Hulimavu", trips=27, dist="50 m", passes=10, busy=615, depot="Kothnur D34",
      why="Links the Jayanagar showroom with Bannerghatta Road. Same depot as 215-H."),
 dict(no="365-N", cluster="jig", showroom="Jigani", ends="Majestic ↔ Giddenahalli", via="Bannerghatta Road, Jigani, Kallubalu", trips=8, dist="22 m", passes=6, busy=926, depot="Confirm",
      why="Like 365-J, but it continues past the Jigani showroom door. Only 8 trips a day, so it's hard to lock."),
]
LABEL_AT = {"401-M": 0.3, "215-H": 0.9, "258-CC": 0.82, "60-A": 0.08, "410-FA": 0.3, "80-A": 0.9, "365-J": 0.62, "MKT-5H": 0.55, "176": 0.93, "398-CH": 0.6}
t = open("page_template.html").read()
for k, v in {"__MAP__": M, "__ROUTES__": ROUTES, "__RESERVES__": RESERVES, "__LABELAT__": LABEL_AT}.items():
    t = t.replace(k, json.dumps(v, ensure_ascii=False))
open("naveen-bus-routes.html", "w").write(t)
print(len(t)//1024, "KB")
