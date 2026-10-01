"""Render the rafting reel from edl.py.

Pipeline: per-shot 1080x1920 clips (cropped, graded, exact frame counts) + per-shot
natural sound -> concat -> mix with the song -> text overlay -> final MP4s.
"""
import os, subprocess, sys
import numpy as np
import soundfile as sf
from PIL import Image, ImageOps

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from edl import SHOTS, SONG_IN, FPS, REEL_LEN, TEXT

W, H = 1080, 1920
SR = 48000
CROP_W = 608  # 9:16 window out of a 1920x1080 frame
RAW = "raw"
OUT = "shots"
os.makedirs(OUT, exist_ok=True)

# Light travel grade: a touch of contrast and vibrance, warm highlights, cool shadows.
GRADE = ("eq=contrast=1.07:saturation=1.13:gamma=0.98,"
         "colorbalance=rs=-0.02:bs=0.03:rh=0.03:gh=0.01:bh=-0.03")
SHARPEN = "unsharp=5:5:0.55:3:3:0.0"

# Ambient bed under the photo shots so the sound never drops to dead silence.
PHOTO_AMB = {
    "B1": ("GX019678", 12.0, 0.35), "B2": ("GX019678", 16.0, 0.35),
    "D3": ("GX019694", 15.0, 0.70), "N4": ("GX019694", 24.0, 0.60),
    "N7": ("GX019678", 20.0, 0.40), "N7b": ("GX019678", 21.0, 0.40),
    "N8": ("GX019687", 3.0, 0.9), "N8b": ("GX019687", 3.5, 0.9), "N8c": ("GX019694", 26.0, 0.7),
}


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(" ".join(cmd)); print(r.stderr[-3000:]); sys.exit(1)


def frames_of(a, b):
    return round(b * FPS) - round(a * FPS)


def x_expr(cx, seg_start):
    """ffmpeg crop x expression; source time = seg_start + t."""
    def px(c):
        return min(max(c * 1920 - CROP_W / 2, 0), 1920 - CROP_W)
    if not isinstance(cx, list):
        return f"{px(cx):.1f}"
    T = f"({seg_start:.4f}+t)"
    kf = [(t, px(c)) for t, c in cx]
    expr = f"{kf[-1][1]:.1f}"
    for (t0, x0), (t1, x1) in reversed(list(zip(kf, kf[1:]))):
        lerp = f"{x0:.1f}+({x1 - x0:.1f})*({T}-{t0:.4f})/{t1 - t0:.4f}"
        expr = f"if(lt({T},{t1:.4f}),{lerp},{expr})"
    return f"if(lt({T},{kf[0][0]:.4f}),{kf[0][1]:.1f},{expr})"


def extract_audio(src, t0, dur, speed=1.0):
    tmp = f"{OUT}/_a.wav"
    af = "aresample=48000"
    if speed != 1.0:
        af += f",atempo={speed}"
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.4f}", "-t", f"{dur + 0.3:.4f}", "-i", f"{RAW}/{src}.MP4",
         "-vn", "-af", af, "-ac", "2", "-ar", str(SR), tmp])
    a, _ = sf.read(tmp, dtype="float32")
    n = int(round(dur / speed * SR))
    if len(a) < n:
        a = np.pad(a, ((0, n - len(a)), (0, 0)))
    return a[:n]


def fit(a, n):
    if len(a) < n:
        a = np.pad(a, ((0, n - len(a)), (0, 0)))
    a = a[:n].copy()
    f = min(240, n // 4)  # 5 ms de-click fades
    ramp = np.linspace(0, 1, f, dtype=np.float32)[:, None]
    a[:f] *= ramp; a[-f:] *= ramp[::-1]
    return a


def render_video(name, a, b, src, p):
    nf = frames_of(a, b)
    segs = p.get("ramp") or [(p["src_in"], p["src_in"] + (b - a) + 0.2, 1.0)]
    parts, audio, done = [], [], 0
    for i, (s0, s1, speed) in enumerate(segs):
        last = i == len(segs) - 1
        seg_frames = nf - done if last else round((s1 - s0) / speed * FPS)
        done += seg_frames
        out = f"{OUT}/{name}_{i}.mp4"
        # crop sees source time (t), then retime; 60p source gives clean 0.5x slow-mo at 30p
        vf = (f"crop={CROP_W}:1080:x='{x_expr(p['cx'], s0)}':y=0,"
              f"setpts=(PTS-STARTPTS)/{speed},fps={FPS},"
              f"scale={W}:{H}:flags=lanczos,{SHARPEN},{GRADE},format=yuv420p")
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{s0:.4f}", "-t", f"{(s1 - s0) + 0.5:.4f}",
             "-i", f"{RAW}/{src}.MP4", "-vf", vf, "-r", str(FPS), "-frames:v", str(seg_frames), "-an",
             "-c:v", "libx264", "-crf", "13", "-preset", "medium", out])
        parts.append(out)
        audio.append(extract_audio(src, s0, seg_frames / FPS * speed, speed))
    if len(parts) == 1:
        os.replace(parts[0], f"{OUT}/{name}.mp4")
    else:
        lst = f"{OUT}/{name}.txt"
        with open(lst, "w") as fh:
            fh.writelines(f"file '{os.path.basename(x)}'\n" for x in parts)
        run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", f"{OUT}/{name}.mp4"])
    nat = fit(np.concatenate(audio), int(round(nf / FPS * SR))) * p.get("nat", 0.6)
    return nat


def ease(x):
    return x * x * (3 - 2 * x)  # smoothstep


def render_photo(name, a, b, src, p):
    nf = frames_of(a, b)
    im = ImageOps.exif_transpose(Image.open(f"{RAW}/{src}.JPG")).convert("RGB")
    scale = (H * 1.3) / im.size[1]  # keep enough pixels for the push-in
    im = im.resize((round(im.size[0] * scale), round(im.size[1] * scale)), Image.LANCZOS)
    IW, IH = im.size
    out = f"{OUT}/{name}.mp4"
    proc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
         "-i", "-", "-vf", f"{GRADE},format=yuv420p", "-frames:v", str(nf),
         "-c:v", "libx264", "-crf", "13", "-preset", "medium", out], stdin=subprocess.PIPE)
    for i in range(nf):
        k = ease(i / max(nf - 1, 1))
        z = p["z0"] + (p["z1"] - p["z0"]) * k
        fx = p["f0"][0] + (p["f1"][0] - p["f0"][0]) * k
        fy = p["f0"][1] + (p["f1"][1] - p["f0"][1]) * k
        ch = IH / z; cw = ch * 9 / 16
        cx = min(max(fx * IW, cw / 2), IW - cw / 2)
        cy = min(max(fy * IH, ch / 2), IH - ch / 2)
        fr = im.transform((W, H), Image.EXTENT, (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2), Image.BICUBIC)
        proc.stdin.write(fr.tobytes())
    proc.stdin.close(); proc.wait()
    amb_src, amb_t, g = PHOTO_AMB.get(name, ("GX019678", 10.0, 0.3))
    return fit(extract_audio(amb_src, amb_t, nf / FPS), int(round(nf / FPS * SR))) * g


def main():
    only = sys.argv[1:]
    nat_parts = []
    for name, a, b, kind, src, p in SHOTS:
        if only and name not in only:
            continue
        print(f"render {name} {kind} {src} {a:.2f}-{b:.2f} ({frames_of(a, b)} frames)", flush=True)
        nat = render_video(name, a, b, src, p) if kind == "video" else render_photo(name, a, b, src, p)
        sf.write(f"{OUT}/{name}.wav", nat, SR)
    # assemble from the per-shot files on disk (lets a subset be re-rendered)
    if not all(os.path.exists(f"{OUT}/{n}.mp4") for n, *_ in SHOTS):
        return
    with open(f"{OUT}/list.txt", "w") as fh:
        fh.writelines(f"file '{n}.mp4'\n" for n, *_ in SHOTS)
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{OUT}/list.txt", "-c", "copy", "video.mp4"])
    sf.write("nat.wav", np.concatenate([sf.read(f"{OUT}/{n}.wav", dtype="float32")[0] for n, *_ in SHOTS]), SR)
    print("done: video.mp4 + nat.wav")


if __name__ == "__main__":
    main()
