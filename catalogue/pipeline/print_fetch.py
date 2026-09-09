"""Fetch print-resolution sources (w1600) for the designs going into the PDF."""
import json, os, subprocess, sys

EX = {"Draft", "Renders", "Punch Series"}
OUT = "print_raw"
MAGIC = (b"\xff\xd8", b"\x89PNG", b"RIFF", b"GIF8")

def ok(p):
    try:
        with open(p, "rb") as f: return f.read(4)[:4].startswith(MAGIC)
    except OSError: return False

def main():
    d = json.load(open("designs.json"))
    keep = [(i, x) for i, x in enumerate(d) if x["collection"] not in EX]
    json.dump([i for i, _ in keep], open("print_ids.json", "w"))
    os.makedirs(OUT, exist_ok=True)
    script = ('for a in 1 2 3; do '
              'c=$(curl -sS -L --max-time 120 '
              '"https://drive.google.com/thumbnail?id=$1&sz=w1600" -o "$2" -w "%{http_code}"); '
              '[ "$c" = 200 ] && [ -s "$2" ] && exit 0; sleep $((a*2)); done')
    for rnd in range(3):
        jobs = []
        for i, x in keep:
            p = f"{OUT}/{i:04d}.jpg"
            if not ok(p):
                if os.path.exists(p): os.remove(p)
                jobs.append((x["faces"][0]["id"], p))
        if not jobs: break
        print(f"round {rnd+1}: fetching {len(jobs)}", flush=True)
        subprocess.run(["xargs","-P","12","-n","2","sh","-c",script,"sh"],
                       input="\n".join(f"{a} {b}" for a,b in jobs).encode(),
                       stderr=subprocess.DEVNULL)
    missing = [i for i,_ in keep if not ok(f"{OUT}/{i:04d}.jpg")]
    print(f"done: {len(keep)-len(missing)}/{len(keep)} fetched, {len(missing)} unavailable")
    json.dump(missing, open("print_missing.json","w"))

main()
