#!/usr/bin/env python3
"""Build the Naveen Tile hero background video from free Pexels footage.

    python3 build_video.py

Downloads six 4K clips from Pexels (cached in .cache/src), trims the best
few seconds of each, slows the 60fps and 25fps clips for smooth slow motion,
joins them with short dissolves, and dissolves the end back into the start
so the video loops with no jump. Writes clean web files (no text) to media/:
a 16:9 desktop version, a light 720p version and a 9:16 phone version.
Needs ffmpeg with libx264 and libvpx-vp9.
"""

import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / ".cache" / "src"
MEDIA = HERE / "media"
FPS = 30
FADE = 0.6  # dissolve length between shots, seconds
GRADE = "eq=contrast=1.04:saturation=1.05"  # light touch: keep tile colours true

# start/end are seconds in the source clip. speed < 1 is slow motion (only
# used on 60fps/25fps sources, so no frames are invented). wide/tall say how
# to crop for 16:9 and 9:16: a fraction 0-1 places the crop window.
SHOTS = [
    dict(id="5744429", file="5744429-uhd_3840_2160_30fps.mp4", start=5.5, end=9.5, speed=1.0, tall_x=0.62,
         what="Palm leaves part to reveal a sunlit villa lounge"),
    dict(id="18531410", file="18531410-uhd_3840_2160_60fps.mp4", start=0.0, end=1.6, speed=0.5, tall_x=0.62,
         wide_keep=0.92,  # trims the right edge, where a TV starts to slide in
         what="High, slow glide over a living room with a glossy tiled floor and pool"),
    dict(id="9166288", file="9166288-uhd_2160_4096_25fps.mp4", start=3.0, end=5.5, speed=25 / 30,
         vertical=True, wide_y=0.62, tall_y=0.55,
         what="Water running over a black marble block"),
    dict(id="5744421", file="5744421-uhd_3840_2160_30fps.mp4", start=0.5, end=4.3, speed=1.0, tall_x=0.50,
         what="Sunlight falling across a tiled floor, seen from above"),
    dict(id="39024338", file="16605516_3840_2160_30fps.mp4", start=4.6, end=8.0, speed=1.0, tall_x=0.42,
         what="Marble-clad bathroom"),
    dict(id="11630727", file="11630727-uhd_3840_2160_25fps.mp4", start=0.3, end=3.4, speed=25 / 30, tall_x=0.50,
         what="Glide across a glossy marble floor into the dining area"),
]


def run(cmd):
    print("$", " ".join(str(c) for c in cmd[:4]), "…")
    subprocess.run([str(c) for c in cmd], check=True)


def crop_for(shot, aspect):
    """ffmpeg crop expression for one shot at 'wide' (16:9) or 'tall' (9:16)."""
    if aspect == "wide":
        if shot.get("vertical"):
            return f"crop=iw:iw*9/16:0:(ih-iw*9/16)*{shot['wide_y']}"
        if "wide_keep" in shot:  # keep the left part of the frame, same 16:9 shape
            k = shot["wide_keep"]
            return f"crop=iw*{k}:ih*{k}:0:(ih-ih*{k})/2"
        return "null"
    if shot.get("vertical"):
        return f"crop=iw:iw*16/9:0:(ih-iw*16/9)*{shot['tall_y']}"
    return f"crop=ih*9/16:ih:(iw-ih*9/16)*{shot['tall_x']}:0"


def build_master(aspect, w, h, out):
    inputs, chains, durations = [], [], []
    for i, s in enumerate(SHOTS):
        inputs += ["-ss", f"{s['start']:.3f}", "-t", f"{s['end'] - s['start']:.3f}", "-i", SRC / s["file"]]
        chains.append(
            f"[{i}:v]setpts=(PTS-STARTPTS)/{s['speed']:.6f},fps={FPS},{crop_for(s, aspect)},"
            f"scale={w}:{h}:flags=lanczos,setsar=1,{GRADE},format=yuv420p,settb=1/{FPS}[s{i}]"
        )
        durations.append((s["end"] - s["start"]) / s["speed"])

    prev, t = "s0", durations[0]
    for i in range(1, len(SHOTS)):
        chains.append(f"[{prev}][s{i}]xfade=transition=fade:duration={FADE}:offset={t - FADE:.3f}[x{i}]")
        prev, t = f"x{i}", t + durations[i] - FADE

    # seamless loop: drop the first FADE seconds, dissolve the tail into them
    chains += [
        f"[{prev}]split[pa][pb]",
        f"[pa]trim=0:{FADE},setpts=PTS-STARTPTS[head]",
        f"[pb]trim={FADE},setpts=PTS-STARTPTS[body]",
        f"[body][head]xfade=transition=fade:duration={FADE}:offset={t - 2 * FADE:.3f}[loop]",
    ]
    run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(chains),
         "-map", "[loop]", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "14", out])
    print(f"  {aspect}: loop is {t - FADE:.2f}s")


def web(master, name, vf, crf, maxrate, webm_crf=None):
    run(["ffmpeg", "-y", "-v", "error", "-i", master, "-vf", vf, "-an",
         "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-crf", crf,
         "-maxrate", maxrate, "-bufsize", "8M", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
         MEDIA / f"{name}.mp4"])
    if webm_crf:
        run(["ffmpeg", "-y", "-v", "error", "-i", master, "-vf", vf, "-an",
             "-c:v", "libvpx-vp9", "-crf", webm_crf, "-b:v", "0", "-row-mt", "1",
             "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p", MEDIA / f"{name}.webm"])
    for ext, q in (("jpg", ["-q:v", "3"]), ("webp", ["-quality", "82"])):
        run(["ffmpeg", "-y", "-v", "error", "-i", master, "-vf", vf, "-frames:v", "1", *q,
             MEDIA / f"{name}-poster.{ext}"])


def main():
    SRC.mkdir(parents=True, exist_ok=True)
    MEDIA.mkdir(exist_ok=True)
    for s in SHOTS:
        f = SRC / s["file"]
        if not f.exists():
            run(["curl", "-fsSL", "-o", f, f"https://videos.pexels.com/video-files/{s['id']}/{s['file']}"])

    wide = HERE / ".cache" / "master-wide.mp4"
    tall = HERE / ".cache" / "master-tall.mp4"
    build_master("wide", 1920, 1080, wide)
    build_master("tall", 1080, 1920, tall)

    web(wide, "naveen-hero-1920x1080", "null", "26", "3.5M", webm_crf="36")
    web(wide, "naveen-hero-1280x720", "scale=1280:720:flags=lanczos", "26", "2M")
    web(tall, "naveen-hero-1080x1920", "null", "26", "3.5M", webm_crf="36")

    for f in sorted(MEDIA.iterdir()):
        print(f"  {f.name:40} {f.stat().st_size / 1024:8.0f} KB")


if __name__ == "__main__":
    main()
