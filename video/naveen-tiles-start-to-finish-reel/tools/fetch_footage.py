"""Download just the source clips this edit uses from the shared Drive folder
("Naveen Tile-Factory Sept" / videos). The folder is link-shared, so no login
is needed. Files land in raw/ as <src>.mp4, which is what cut_clips.py expects.

Usage: python3 tools/fetch_footage.py [raw_dir]
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDIT = json.load(open(os.path.join(ROOT, "src", "edit.json")))


def main():
    raw_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "raw")
    os.makedirs(raw_dir, exist_ok=True)
    for shot in EDIT["shots"]:
        out = os.path.join(raw_dir, shot["src"] + ".mp4")
        if os.path.exists(out) and os.path.getsize(out) > 1_000_000:
            continue
        url = f"https://drive.usercontent.google.com/download?id={shot['driveId']}&export=download&confirm=t"
        subprocess.run(["curl", "-sSL", "--retry", "4", "-o", out, url], check=True)
        with open(out, "rb") as f:
            if f.read(64).lstrip().startswith(b"<"):
                sys.exit(f"{shot['src']}: Drive returned a sign-in page - is the folder still link-shared?")
        print(f"{shot['src']}  {os.path.getsize(out) / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
