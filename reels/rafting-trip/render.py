"""Render the rafting reel from edl.py.

Pipeline: per-shot 1080x1920 clips (cropped on Shreyas, graded, exact frame counts)
+ per-shot natural sound -> concat. finish.py then mixes the song and adds the text.

Face tracking: track=True shots follow the face that best matches the reference
embeddings in ref_feats.npy (built from photos of Shreyas with face.py). Tracks are
cached in tracks/ so re-renders are fast.
"""
import json, os, subprocess, sys
import numpy as np
import soundfile as sf
import cv2
from PIL import Image, ImageOps

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from edl import SHOTS, FPS

W, H = 1080, 1920
SR = 48000
RAW = "raw"
OUT = "shots"
os.makedirs(OUT, exist_ok=True)
os.makedirs("tracks", exist_ok=True)

# Light travel grade: a touch of contrast and vibrance, warm highlights, cool shadows.
GRADE = ("eq=contrast=1.08:saturation=1.14:gamma=0.98,"
         "colorbalance=rs=-0.02:bs=0.03:rh=0.03:gh=0.01:bh=-0.03,vignette=angle=PI/5")
FLASH = [0.85, 0.45, 0.15]  # white blend on the first frames of a photo cut (camera shutter)
SHARPEN = "unsharp=5:5:0.6:3:3:0.0"
FACE_ROW = 0.38   # where his face sits in a zoomed video crop (fraction from the top)

# Ambient bed under the photo shots so the sound never drops to dead silence.
PHOTO_AMB = {
    "B2": ("GX019678", 12.0, 0.35), "B4": ("GX019678", 16.0, 0.40),
    "D2": ("GX019694", 15.0, 0.70), "D3": ("GX019694", 24.0, 0.65), "D3b": ("GX019694", 24.5, 0.65),
    "D3c": ("GX019694", 25.0, 0.65), "N2": ("GX019694", 27.0, 0.60),
    "N5": ("GX019678", 20.0, 0.40), "N6": ("GX019678", 20.5, 0.40), "N8": ("GX019678", 22.0, 0.40),
}


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(" ".join(cmd)); print(r.stderr[-3000:]); sys.exit(1)


def frames_of(a, b):
    return round(b * FPS) - round(a * FPS)


# --- face track --------------------------------------------------------------
def face_track(src, t0, t1, step=0.2, thr=0.42):
    key = f"tracks/{src}_{t0:.2f}_{t1:.2f}.json"
    if os.path.exists(key):
        return json.load(open(key))
    from face import faces
    R = np.load("ref_feats.npy"); M = R.mean(0); M /= np.linalg.norm(M)
    cap = cv2.VideoCapture(f"{RAW}/{src}.MP4")
    pts, t = [], t0
    while t <= t1 + 1e-6:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, fr = cap.read()
        if not ok:
            break
        best = None
        for r, f, _ in faces(fr):
            s = float(f @ M)
            if s > thr and (best is None or s > best[0]):
                best = (s, r)
        if best:
            x, y, w, h = [float(v) for v in best[1][:4]]
            pts.append([round(t, 3), (x + w / 2) / 1920, (y + h / 2) / 1080])
        t += step
    json.dump(pts, open(key, "w"))
    return pts


def smooth_path(pts, fallback, t0, t1, win=0.8):
    """Gap-filled, moving-average (t -> (cx, cy)) sampled every 1/FPS."""
    ts = np.arange(t0, t1 + 1e-6, 1 / FPS)
    if len(pts) < 2:
        fy = pts[0][2] if pts else 0.45
        fx = pts[0][1] if pts else fallback
        return ts, np.full_like(ts, fx), np.full_like(ts, fy)
    P = np.array(pts)
    cx = np.interp(ts, P[:, 0], P[:, 1]); cy = np.interp(ts, P[:, 0], P[:, 2])
    k = max(1, int(win * FPS)); ker = np.ones(k) / k
    pad = lambda a: np.pad(a, (k // 2, k - 1 - k // 2), mode="edge")
    return ts, np.convolve(pad(cx), ker, "valid"), np.convolve(pad(cy), ker, "valid")


def keyframe_path(cx, t0, t1):
    ts = np.arange(t0, t1 + 1e-6, 1 / FPS)
    if not isinstance(cx, list):
        return ts, np.full_like(ts, cx), np.full_like(ts, 0.5)
    kt, kv = zip(*cx)
    return ts, np.interp(ts, kt, kv), np.full_like(ts, 0.5)


# --- audio -------------------------------------------------------------------
def extract_audio(src, t0, dur, speed=1.0):
    tmp = f"{OUT}/_a.wav"
    af = "aresample=48000" + (f",atempo={speed}" if speed != 1.0 else "")
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


def encoder(out):
    return subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS),
         "-i", "-", "-vf", f"{SHARPEN},{GRADE},format=yuv420p", "-c:v", "libx264", "-crf", "13",
         "-preset", "medium", out], stdin=subprocess.PIPE)


# --- shots -------------------------------------------------------------------
def render_video(name, a, b, src, p):
    nf = frames_of(a, b)
    segs = p.get("ramp") or [(p["src_in"], p["src_in"] + (b - a) + 0.2, 1.0)]
    span0, span1 = segs[0][0], segs[-1][1]
    if p.get("track"):
        ts, pcx, pcy = smooth_path(face_track(src, span0, span1), p.get("cx", 0.5), span0, span1)
    else:
        ts, pcx, pcy = keyframe_path(p.get("cx", 0.5), span0, span1)
    zoom = p.get("zoom", 1.0)
    ch = 1080 / zoom; cw = ch * 9 / 16
    enc = encoder(f"{OUT}/{name}.mp4")
    audio, done = [], 0
    for i, (s0, s1, speed) in enumerate(segs):
        last = i == len(segs) - 1
        seg_frames = nf - done if last else round((s1 - s0) / speed * FPS)
        done += seg_frames
        dec = subprocess.Popen(
            ["ffmpeg", "-v", "error", "-ss", f"{s0:.4f}", "-t", f"{(s1 - s0) + 0.5:.4f}", "-i", f"{RAW}/{src}.MP4",
             "-vf", f"setpts=(PTS-STARTPTS)/{speed},fps={FPS}", "-frames:v", str(seg_frames),
             "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
        for j in range(seg_frames):
            buf = dec.stdout.read(1920 * 1080 * 3)
            if len(buf) < 1920 * 1080 * 3:
                break
            fr = np.frombuffer(buf, np.uint8).reshape(1080, 1920, 3)
            st = s0 + j / FPS * speed
            cx = np.interp(st, ts, pcx) * 1920
            cy = np.interp(st, ts, pcy) * 1080 + (0.5 - FACE_ROW) * ch if p.get("track") else 540
            x0 = min(max(cx - cw / 2, 0), 1920 - cw); y0 = min(max(cy - ch / 2, 0), 1080 - ch)
            # sub-pixel crop + resize in one affine warp
            sx = cw / W
            M = np.float32([[sx, 0, x0], [0, sx, y0]])
            out = cv2.warpAffine(fr, M, (W, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
            enc.stdin.write(out.tobytes())
        dec.stdout.close(); dec.wait()
        audio.append(extract_audio(src, s0, seg_frames / FPS * speed, speed))
    enc.stdin.close(); enc.wait()
    return fit(np.concatenate(audio), int(round(nf / FPS * SR))) * p.get("nat", 0.6)


def ease(x):
    return x * x * (3 - 2 * x)  # smoothstep


def render_photo(name, a, b, src, p):
    nf = frames_of(a, b)
    im = ImageOps.exif_transpose(Image.open(f"{RAW}/{src}.JPG")).convert("RGB")
    IW, IH = im.size
    pos = json.load(open("photo_pos.json")).get(src, {})
    fx, fy = p.get("face") or (pos["fx"], pos["fy"])  # "face" overrides when his face is hidden
    enc = encoder(f"{OUT}/{name}.mp4")
    for i in range(nf):
        k = ease(i / max(nf - 1, 1))
        z = p["z0"] + (p["z1"] - p["z0"]) * k
        ch = IH / z; cw = ch * 9 / 16
        cx = min(max(fx * IW, cw / 2), IW - cw / 2)
        cy = min(max(fy * IH + p.get("lift", 0.12) * ch, ch / 2), IH - ch / 2)
        fr = im.transform((W, H), Image.EXTENT, (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2), Image.BICUBIC)
        px = np.asarray(fr)[:, :, ::-1]
        if p.get("flash") and i < len(FLASH):
            px = (px * (1 - FLASH[i]) + 255 * FLASH[i]).astype(np.uint8)
        enc.stdin.write(px.tobytes())
    enc.stdin.close(); enc.wait()
    amb_src, amb_t, g = PHOTO_AMB.get(name, ("GX019678", 10.0, 0.3))
    return fit(extract_audio(amb_src, amb_t, nf / FPS), int(round(nf / FPS * SR))) * g


def main():
    only = sys.argv[1:]
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
