"""Beat-synced transitions on the assembled cut: video.mp4 -> video_fx.mp4.

Every transition works on the frames either side of a hard cut, so no overlap or
extra handles are needed. The outgoing shot accelerates into the effect and the
incoming shot settles out of it, and the cut hides inside the blur.
"""
import os, subprocess, sys
import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from edl import SHOTS, FPS, TRANSITIONS, SHAKES

W, H = 1080, 1920
N_OUT, N_IN = 4, 6  # frames before / after the cut


def affine(img, scale=1.0, angle=0.0, dx=0.0, dy=0.0):
    M = cv2.getRotationMatrix2D((W / 2, H / 2), angle, scale)
    M[0, 2] += dx; M[1, 2] += dy
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT101)


def zoom_blur(img, scale, amount, n=8):
    if amount < 0.004:
        return affine(img, scale)
    acc = np.zeros(img.shape, np.float32)
    for k in range(n):
        acc += affine(img, scale * (1 + amount * k / (n - 1)))
    return (acc / n).astype(np.uint8)


def spin_blur(img, angle, scale, spread, n=8):
    acc = np.zeros(img.shape, np.float32)
    for k in range(n):
        acc += affine(img, scale, angle + spread * k / (n - 1))
    return (acc / n).astype(np.uint8)


def whip(img, dx, blur):
    out = affine(img, 1.0, 0, dx, 0)
    k = int(blur) | 1
    return cv2.blur(out, (k, 1)) if k >= 3 else out


def rgb_split(img, px):
    px = int(px)
    if px < 1:
        return img
    b, g, r = cv2.split(img)
    b = np.roll(b, -px, axis=1); r = np.roll(r, px, axis=1)
    return cv2.merge([b, g, r])


def shake(img, i, amp):
    rng = np.random.default_rng(1000 + i)
    dx, dy = rng.uniform(-1, 1, 2) * amp
    return affine(img, 1.0 + amp / 600, rng.uniform(-1, 1) * amp / 20, dx, dy)


def transition(kind, img, side, p):
    """side: 'out' (before the cut) or 'in' (after); p: 0 = far from the cut, 1 = at the cut."""
    e = p * p
    if kind == "zoom":
        return zoom_blur(img, 1 + (0.55 if side == "out" else 0.35) * e, 0.22 * p)
    if kind in ("whip_l", "whip_r"):
        sgn = -1 if kind == "whip_l" else 1
        dx = sgn * W * 0.85 * e * (1 if side == "out" else -1)
        return whip(img, dx, 260 * p)
    if kind == "spin":
        ang = 28 * e * (1 if side == "out" else -1)
        return spin_blur(img, ang, 1 + 0.35 * e, 14 * p * (1 if side == "out" else -1))
    if kind == "drop":
        if side == "out":
            return zoom_blur(img, 1 + 0.9 * e, 0.3 * p)
        return rgb_split(zoom_blur(img, 1 + 0.22 * e, 0.08 * p), 22 * e)
    if kind == "flash":
        return img if side == "out" else affine(img, 1 + 0.10 * e)
    return img


def main():
    nframes = round(SHOTS[-1][2] * FPS)
    plan = {}  # frame -> list of (kind, side, p)
    for name, a, *_ in SHOTS:
        kind = TRANSITIONS.get(name)
        if not kind:
            continue
        cut = round(a * FPS)
        for i in range(N_OUT):
            plan.setdefault(cut - N_OUT + i, []).append((kind, "out", (i + 1) / N_OUT))
        for j in range(N_IN):
            plan.setdefault(cut + j, []).append((kind, "in", 1 - j / N_IN))
        if kind == "drop":  # shake the first beats after the drop
            for j in range(12):
                plan.setdefault(cut + j, []).append(("shake", "in", 22 * (1 - j / 12) ** 1.5))
    for t, dur, amp in SHAKES:
        f0 = round(t * FPS)
        for j in range(round(dur * FPS)):
            plan.setdefault(f0 + j, []).append(("shake", "in", amp * (1 - j / (dur * FPS)) ** 1.5))

    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", "video.mp4", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
                           stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "13", "-preset", "medium",
                            "-pix_fmt", "yuv420p", "video_fx.mp4"], stdin=subprocess.PIPE)
    for f in range(nframes):
        buf = dec.stdout.read(W * H * 3)
        if len(buf) < W * H * 3:
            break
        img = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        for kind, side, p in plan.get(f, []):
            img = shake(img, f, p) if kind == "shake" else transition(kind, img, side, p)
        enc.stdin.write(np.ascontiguousarray(img).tobytes())
    dec.stdout.close(); dec.wait(); enc.stdin.close(); enc.wait()
    print("done: video_fx.mp4")


if __name__ == "__main__":
    main()
