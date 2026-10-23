#!/usr/bin/env python3
"""Cut the hero background loop from Naveen's own showroom walkthrough video.

    python3 build_video.py

Downloads the 98-second, 25 MB banner-video.mp4 from naveentile.com (cached in
.cache/), picks five clean shots, slows them to 80%, joins them with
dissolves, makes the end dissolve back into the start so it loops with no
jump, and writes small web files to media/. Needs ffmpeg with libx264 and
libvpx-vp9.
"""

import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC_URL = "https://naveentile.com/wp-content/themes/Naveentile/video/banner-video.mp4"
SRC = HERE / ".cache" / "banner-video.mp4"
MEDIA = HERE / "media"
MASTER = HERE / ".cache" / "master.mp4"

SPEED = 0.8  # calmer camera moves
FADE = 0.6   # dissolve length, seconds (output time)
FPS = 30

# (start, end) in the source, checked frame by frame so no shot includes
# the source video's own dissolves.
SHOTS = [
    (23.00, 26.60),  # dark marble corridor (also the poster frame)
    (37.25, 39.90),  # marble slab gallery
    (56.20, 59.45),  # tile rack corridor
    (60.15, 61.85),  # close-up of tile samples
    (86.60, 90.50),  # glossy marble corridor
]

# Very light grade: tile colour has to stay true, so only a touch of contrast.
GRADE = "eq=contrast=1.04:saturation=1.04"


def run(cmd):
    print("$", " ".join(str(c) for c in cmd[:6]), "…")
    subprocess.run([str(c) for c in cmd], check=True)


def build_master():
    """Join the shots at source resolution (2256x916) into one seamless loop."""
    inputs, chains = [], []
    durations = []
    for i, (a, b) in enumerate(SHOTS):
        inputs += ["-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", SRC]
        chains.append(
            f"[{i}:v]setpts=(PTS-STARTPTS)/{SPEED},fps={FPS},{GRADE},format=yuv420p,settb=1/{FPS}[s{i}]"
        )
        durations.append((b - a) / SPEED)

    # chain the dissolves
    prev, t = "s0", durations[0]
    for i in range(1, len(SHOTS)):
        out = f"x{i}"
        chains.append(f"[{prev}][s{i}]xfade=transition=fade:duration={FADE}:offset={t - FADE:.3f}[{out}]")
        prev, t = out, t + durations[i] - FADE

    # seamless loop: drop the first FADE seconds and dissolve the tail into them
    total = t
    chains.append(f"[{prev}]split[pa][pb]")
    chains.append(f"[pa]trim=0:{FADE},setpts=PTS-STARTPTS[head]")
    chains.append(f"[pb]trim={FADE},setpts=PTS-STARTPTS[body]")
    chains.append(f"[body][head]xfade=transition=fade:duration={FADE}:offset={total - 2 * FADE:.3f}[loop]")

    run(["ffmpeg", "-y", "-v", "error", *inputs,
         "-filter_complex", ";".join(chains), "-map", "[loop]",
         "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-an", MASTER])
    print(f"  loop length: {total - FADE:.2f}s")


def encode(name, vf, mp4_crf, webm_crf, maxrate):
    run(["ffmpeg", "-y", "-v", "error", "-i", MASTER, "-vf", vf, "-an",
         "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-crf", mp4_crf,
         "-maxrate", maxrate, "-bufsize", "6M", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", MEDIA / f"{name}.mp4"])
    run(["ffmpeg", "-y", "-v", "error", "-i", MASTER, "-vf", vf, "-an",
         "-c:v", "libvpx-vp9", "-crf", webm_crf, "-b:v", "0", "-row-mt", "1",
         "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p", MEDIA / f"{name}.webm"])
    # poster = first frame, so the page shows the same picture before the video starts
    for ext, q in (("webp", ["-quality", "80"]), ("jpg", ["-q:v", "3"])):
        run(["ffmpeg", "-y", "-v", "error", "-i", MASTER, "-vf", vf, "-frames:v", "1", *q,
             MEDIA / f"{name}-poster.{ext}"])


def main():
    SRC.parent.mkdir(exist_ok=True)
    MEDIA.mkdir(exist_ok=True)
    if not SRC.exists():
        run(["curl", "-fsSL", "-o", SRC, SRC_URL])
    build_master()
    # desktop: same 2.46:1 shape as the current slider, 1920 wide
    encode("naveen-hero-loop-1920x780", "scale=1920:780:flags=lanczos", "27", "37", "2.4M")
    # phone: 4:5 centre crop (the corridors' vanishing points sit mid-frame)
    encode("naveen-hero-loop-720x900", "crop=733:916,scale=720:900:flags=lanczos", "27", "37", "1.4M")
    for f in sorted(MEDIA.iterdir()):
        print(f"  {f.name:44} {f.stat().st_size / 1024:8.0f} KB")


if __name__ == "__main__":
    main()
