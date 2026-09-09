"""Step 1 — walk the shared Drive design folder and record every file in it.

Writes tree.json: {"<folder path>": [{"id", "name"}, ...], ...}

The folder is shared "anyone with the link", but Drive's search index reports it
as empty for an account it was only shared into, so the API is not an option
here. We read Drive's own `embeddedfolderview` listing instead.

Do NOT go back to scraping the normal folder page's `_DRIVE_ivd` blob: that
carries only the first page of each folder (50 items), which silently truncated
the first build of this catalogue to about half the library. `embeddedfolderview`
returns a folder's full contents in one response. The count check at the end of
this script exists to catch any future cap of the same kind.
"""

import json
import re
import subprocess
import sys
import time

ROOT = "1H7h215GQqsb6-OoVDaV1oyPVdBhs0DyO"   # DESIGNS NEW FOLDER 11.08.2026

# Each row carries the id on the wrapper div, then a link that reveals whether
# the row is a folder (/drive/folders/) or a file (/file/d/), then the title.
ENTRY = re.compile(
    r'<div class="flip-entry" id="entry-(?P<id>[A-Za-z0-9_-]+)".*?'
    r'<a href="(?P<href>[^"]+)".*?'
    r'<div class="flip-entry-title">(?P<name>.*?)</div>',
    re.S,
)
ENTITIES = (("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"), ("&quot;", '"'), ("&#39;", "'"))


def unescape(s):
    for a, b in ENTITIES:
        s = s.replace(a, b)
    return s


def listing(folder_id, attempts=4):
    """Return [{id, name, folder}] for one folder, or None if it could not be read."""
    for attempt in range(attempts):
        page = subprocess.run(
            ["curl", "-sS", "-L", "--max-time", "120",
             f"https://drive.google.com/embeddedfolderview?id={folder_id}#list"],
            capture_output=True,
        ).stdout.decode("utf-8", "replace")
        if "flip-entries" in page:
            return [
                {"id": m.group("id"),
                 "name": unescape(m.group("name")),
                 "folder": "/drive/folders/" in m.group("href")}
                for m in ENTRY.finditer(page)
            ]
        time.sleep(2 * (attempt + 1))
    return None


def walk(folder_id, path, tree, stats, depth=0):
    items = listing(folder_id)
    if items is None:
        stats["failed"].append("/".join(path))
        print(f"!! could not read {'/'.join(path) or 'root'}", file=sys.stderr)
        return
    files = [i for i in items if not i["folder"]]
    if files:
        tree.setdefault("/".join(path), []).extend(
            {"id": f["id"], "name": f["name"]} for f in files)
        print("  " * depth + f"{len(files):5d}  {'/'.join(path) or '(root)'}", flush=True)
    for sub in (i for i in items if i["folder"]):
        stats["folders"] += 1
        walk(sub["id"], path + [sub["name"]], tree, stats, depth + 1)


def main():
    tree, stats = {}, {"folders": 0, "failed": []}
    walk(ROOT, [], tree, stats)
    json.dump(tree, open("tree.json", "w"), indent=1)

    total = sum(len(v) for v in tree.values())
    print(f"\n{total} files / {len(tree)} leaf folders / {stats['folders']} subfolders")
    if stats["failed"]:
        print(f"FAILED to read {len(stats['failed'])} folders: {stats['failed']}",
              file=sys.stderr)

    # A folder landing on a round number is the signature of a paging cap.
    suspect = [(k, len(v)) for k, v in tree.items() if len(v) in (50, 100, 200, 500, 1000)]
    if suspect:
        print("WARNING: these folders sit exactly on a round count — check for truncation:",
              file=sys.stderr)
        for k, n in suspect:
            print(f"  {n}  {k}", file=sys.stderr)


if __name__ == "__main__":
    main()
