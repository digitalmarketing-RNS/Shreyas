"""Build the reel soundtrack: original score + SFX + the full voiceover.

Usage:
    python mix_audio.py <vo_dir> <music_dir> <out_dir>
vo_dir holds the per-line WAVs from make_vo.py; music_dir holds music.wav and sfx.wav from
compose_music.py. Writes soundtrack_vo.wav (main cut) and soundtrack_music.wav (no VO),
both mastered to -14 LUFS integrated with a -1 dBFS ceiling, plus vo_placements.json
(where each line landed, for syncing on-screen text).
"""

import json
import os
import sys

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfilt

SR = 44100
LENGTH = 35.0
N = int(SR * LENGTH)

# (line id, target start in seconds). Lines land on their edit point; if the previous
# line is still talking, the next one waits for it (up to a 60 ms tail overlap).
VO_PLACEMENT = [
    ("hook", 0.30),                 # 0-4    Every child holds a universe of possibilities.
    ("id_explorer", 4.02),          # 4-11   one identity per 1 s cut
    ("id_artist", 5.02),
    ("id_scientist", 6.02),
    ("id_innovator", 7.02),
    ("id_athlete", 8.02),
    ("id_performer", 9.02),
    ("id_leader", 10.02),
    ("get_to_be", 10.85),           # 11-12  Here, they get to be...
    ("all_of_it", 12.02),           # 12     ...all of it!  (lands on the slam)
    ("attention", 13.00),           # 12-16  With individual attention for every child.
    ("cbse", 15.95),                # 16-18  CBSE, since 2013.
    ("stages", 18.30),              # 18-20  Nursery to Grade 10.
    ("facilities", 20.08),          # 20-24  World-class labs, library, and sports.
    ("start", 24.35),               # 24-28  Give your child the start they deserve.
    ("cta", 28.35),                 # 28-32  Book your campus visit today.
    ("name", 32.05),                # 32     RNS International School. (final hit)
]


def load(path):
    y, sr = sf.read(path, always_2d=True)
    if sr != SR:
        raise SystemExit(f"{path}: expected {SR} Hz, got {sr}")
    return y


def load_vo(path):
    y, sr = sf.read(path)
    if y.ndim > 1:
        y = y.mean(axis=1)
    if sr != SR:
        g = np.gcd(sr, SR)
        y = resample_poly(y, SR // g, sr // g)
    y = sosfilt(butter(2, 80, "high", fs=SR, output="sos"), y)
    # Level every line to the same active-speech RMS so the read sounds even.
    win = int(0.02 * SR)
    rms = np.sqrt(np.convolve(y ** 2, np.ones(win) / win, mode="same"))
    active = rms > rms.max() * 0.15
    y = y * (0.12 / np.sqrt(np.mean(y[active] ** 2)))
    fade = int(0.01 * SR)
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade:] *= np.linspace(1, 0, fade)
    return y


def master(mix, target_lufs=-14.0):
    meter = pyln.Meter(SR)
    mix = mix * 10 ** ((target_lufs - meter.integrated_loudness(mix)) / 20)
    ceil, knee = 10 ** (-1 / 20), 10 ** (-3 / 20)
    a = np.abs(mix)
    over = a > knee
    mix[over] = np.sign(mix[over]) * (knee + (ceil - knee) * np.tanh((a[over] - knee) / (ceil - knee)))
    return mix, meter.integrated_loudness(mix)


def main(vo_dir, music_dir, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    music = load(os.path.join(music_dir, "music.wav"))[:N]
    sfx = load(os.path.join(music_dir, "sfx.wav"))[:N]

    vo = np.zeros(N)
    placements, prev_end = [], 0.0
    for line_id, target in VO_PLACEMENT:
        y = load_vo(os.path.join(vo_dir, f"{line_id}.wav"))
        start = max(target, prev_end - 0.06)
        i = int(round(start * SR))
        n = min(len(y), N - i)
        vo[i:i + n] += y[:n]
        prev_end = start + len(y) / SR
        placements.append({"id": line_id, "start": round(start, 3), "end": round(prev_end, 3)})
        print(f"{line_id:13s} {start:6.2f} -> {prev_end:6.2f}")

    # Duck the bed under speech (-7 dB, 60 ms attack, 300 ms release) so it swells in the gaps.
    win = int(0.02 * SR)
    speaking = (np.sqrt(np.convolve(vo ** 2, np.ones(win) / win, mode="same")) > 0.01).astype(float)
    held = np.convolve(speaking, np.ones(int(0.3 * SR)), mode="full")[:N] > 0
    att = int(0.06 * SR)
    env = np.clip(np.convolve(held.astype(float), np.ones(att) / att, mode="same"), 0, 1)
    duck = 1 - (1 - 10 ** (-7 / 20)) * env

    bed = music * 0.55 + sfx * 0.3
    with_vo, l1 = master(bed * duck[:, None] + vo[:, None] * 1.0)
    music_only, l2 = master(bed.copy())

    sf.write(os.path.join(out_dir, "soundtrack_vo.wav"), with_vo.astype(np.float32), SR, subtype="PCM_24")
    sf.write(os.path.join(out_dir, "soundtrack_music.wav"), music_only.astype(np.float32), SR, subtype="PCM_24")
    with open(os.path.join(out_dir, "vo_placements.json"), "w") as f:
        json.dump(placements, f, indent=1)
    print(f"soundtrack_vo {l1:.1f} LUFS, soundtrack_music {l2:.1f} LUFS")


if __name__ == "__main__":
    main(*sys.argv[1:4])
