"""Step 1 — walk the shared Drive design folder and record every file in it.

Writes tree.json: {"<folder path>": [{"id", "name", "mime"}, ...], ...}

The folder is shared with "anyone with the link", and Google renders its file
list into the folder page as a `_DRIVE_ivd` blob. We read that rather than the
Drive API, because the API's search index does not return children for a folder
that was only shared into the account — it reports the folder as empty.
"""

import codecs
import json
import re
import subprocess
import sys
import time

ROOT = "1H7h215GQqsb6-OoVDaV1oyPVdBhs0DyO"   # DESIGNS NEW FOLDER 11.08.2026
FOLDER_MIME = "application/vnd.google-apps.folder"
IVD = re.compile(r"window\['_DRIVE_ivd'\]\s*=\s*'(.*?)';", re.S)


def listing(folder_id, attempts=3):
    """Return [[id, _, name, mime, ...], ...] for one folder, or None."""
    for attempt in range(attempts):
        page = subprocess.run(
            ["curl", "-sS", "-L", "--max-time", "90",
             f"https://drive.google.com/drive/folders/{folder_id}"],
            capture_output=True,
        ).stdout.decode("utf-8", "replace")
        m = IVD.search(page)
        if m:
            try:
                return json.loads(codecs.decode(m.group(1), "unicode_escape"))[0]
            except (ValueError, IndexError):
                pass
        time.sleep(2 * (attempt + 1))
    return None


def walk(folder_id, path, tree, depth=0):
    items = listing(folder_id)
    if items is None:
        print(f"could not read {'/'.join(path) or 'root'}", file=sys.stderr)
        return
    for item in items:
        item_id, name, mime = item[0], item[2], item[3]
        if mime == FOLDER_MIME:
            print("  " * depth + f"[dir] {name}", flush=True)
            walk(item_id, path + [name], tree, depth + 1)
        else:
            tree.setdefault("/".join(path), []).append(
                {"id": item_id, "name": name, "mime": mime})


def main():
    tree = {}
    walk(ROOT, [], tree)
    json.dump(tree, open("tree.json", "w"), indent=1)
    files = sum(len(v) for v in tree.values())
    print(f"\n{files} files across {len(tree)} folders -> tree.json")


if __name__ == "__main__":
    main()
