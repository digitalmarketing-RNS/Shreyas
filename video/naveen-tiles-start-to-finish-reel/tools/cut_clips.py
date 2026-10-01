"""Cut the shots listed in src/edit.json out of the raw Drive footage.

For every shot this writes:
  public/clips/<key>.mp4   1080x1920 @30fps, rotated upright, graded, speed baked in
  public/clips/<key>.wav   the shot's natural factory sound at real speed (ambience layer)
and records how many padding frames sit before the shot's in-point in
src/clips.generated.json, so transitions have handles to overlap into.

Usage: python3 tools/cut_clips.py /path/to/raw/videos
"""
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDIT = json.load(open(os.path.join(ROOT, "src", "edit.json")))
FPS = EDIT["fps"]
PAD = 0.4  # seconds of handle on each side, in output time

# Phone footage was shot vertical but stored landscape without a rotate flag:
# transpose=2 turns it upright. Grade: a touch more contrast/colour, warm highs.
GRADE = (
    "eq=contrast=1.07:saturation=1.16:gamma=0.98,"
    "colorbalance=rs=0.015:bs=-0.02:rh=0.03:bh=-0.035,"
    "unsharp=5:5:0.45:5:5:0.0"
)


def probe_duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True,
    ).stdout
    return float(out)


def find_source(raw_dir, shot):
    """raw/<src>.mp4 (as fetch_footage.py saves it) or any file tagged with the Drive id."""
    direct = os.path.join(raw_dir, shot["src"] + ".mp4")
    if os.path.exists(direct):
        return direct
    tag = "__" + shot["driveId"][:6] + ".mp4"
    for name in os.listdir(raw_dir):
        if name.endswith(tag):
            return os.path.join(raw_dir, name)
    raise FileNotFoundError(shot["src"])


def cut(raw_dir, shot):
    path = find_source(raw_dir, shot)
    dur = probe_duration(path)
    speed = shot["speed"]
    slot = shot["frames"] / FPS
    # Source window, expressed in source seconds.
    pre = min(PAD * speed, shot["start"])
    src_in = shot["start"] - pre
    src_len = min((slot + PAD) * speed + pre, dur - src_in)
    out_mp4 = os.path.join(ROOT, "public", "clips", shot["key"] + ".mp4")
    vf = (
        f"transpose=2,scale=1080:1920,setpts=(PTS-STARTPTS)/{speed},fps={FPS},"
        f"{GRADE},format=yuv420p"
    )
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", f"{src_in:.3f}", "-t", f"{src_len:.3f}", "-i", path,
         "-vf", vf, "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "15",
         "-movflags", "+faststart", out_mp4],
        check=True,
    )
    out_wav = os.path.join(ROOT, "public", "clips", shot["key"] + ".wav")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", f"{shot['start']:.3f}", "-t", f"{slot + 0.5:.3f}", "-i", path,
         "-vn", "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", out_wav],
        check=True,
    )
    out_frames = int(round(probe_duration(out_mp4) * FPS))
    pad_frames = int(round(pre / speed * FPS))
    return shot["key"], {"file": f"clips/{shot['key']}.mp4", "padFrames": pad_frames, "totalFrames": out_frames}


def main():
    raw_dir = sys.argv[1]
    os.makedirs(os.path.join(ROOT, "public", "clips"), exist_ok=True)
    with ThreadPoolExecutor(4) as ex:
        results = dict(ex.map(lambda s: cut(raw_dir, s), EDIT["shots"]))
    for s in EDIT["shots"]:
        r = results[s["key"]]
        need = r["padFrames"] + s["frames"]
        flag = "" if r["totalFrames"] >= need + 6 else "  <-- SHORT"
        print(f"{s['key']:20s} pad={r['padFrames']:3d} total={r['totalFrames']:4d} need>={need}{flag}")
    json.dump(results, open(os.path.join(ROOT, "src", "clips.generated.json"), "w"), indent=2)


if __name__ == "__main__":
    main()
