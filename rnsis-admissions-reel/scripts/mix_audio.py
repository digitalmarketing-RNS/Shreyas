"""Build the reel soundtrack: original music + SFX + voice lines from the RNSIS brand film.

The VO lines are lifted from the brand film's narration. Run demucs on the film audio
first to isolate the voice:
    python -m demucs --two-stems=vocals -n htdemucs film44.wav   ->  .../vocals.wav

Usage:
    python mix_audio.py <vocals.wav> <music_dir> <out_dir>
music_dir must contain music.wav and sfx.wav from compose_music.py.
Writes soundtrack_vo.wav (main cut) and soundtrack_music.wav (no-VO variant),
both mastered to -14 LUFS integrated, -1 dBTP-ish ceiling.
"""

import os
import sys

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 44100
LENGTH = 31.5
N = int(SR * LENGTH)

# (source_in, source_out, place_at) in seconds; source times are in the brand film.
VO_LINES = [
    (83.38, 86.50, 11.40, 1.0),   # "we ensure every child discovers their unique talents."
    (110.22, 113.15, 25.35, 1.0),  # "Inspiring to learn, empowering to excel,"
    (113.55, 115.25, 29.10, 1.25),  # "RNS International School." (lands with the logo + final hit)
]


def load(path):
    y, sr = sf.read(path, always_2d=True)
    if sr != SR:
        raise SystemExit(f"{path}: expected {SR} Hz, got {sr}")
    return y


def clean_vo(seg):
    mono = seg.mean(axis=1)
    mono = sosfilt(butter(2, 90, "high", fs=SR, output="sos"), mono)
    mono = sosfilt(butter(2, 11000, "low", fs=SR, output="sos"), mono)
    # Gate out music bleed between words: 20 ms RMS envelope, soft knee.
    win = int(0.02 * SR)
    rms = np.sqrt(np.convolve(mono ** 2, np.ones(win) / win, mode="same")) + 1e-9
    db = 20 * np.log10(rms / rms.max())
    gain = np.clip((db + 42) / 10, 0, 1)  # fully open above -32 dB, closed below -42 dB
    gain = np.convolve(gain, np.ones(win * 2) / (win * 2), mode="same")
    mono = mono * gain
    # Gentle level-riding compression toward a steady speech level.
    rms = np.sqrt(np.convolve(mono ** 2, np.ones(win * 4) / (win * 4), mode="same")) + 1e-9
    target = np.percentile(rms[rms > rms.max() * 0.1], 70)
    comp = np.clip((target / rms) ** 0.35, 0.6, 1.6)
    comp = np.convolve(comp, np.ones(win * 4) / (win * 4), mode="same")
    mono = mono * np.where(rms > rms.max() * 0.05, comp, 1.0)
    fade = int(0.015 * SR)
    ramp = np.linspace(0, 1, fade)
    mono[:fade] *= ramp
    mono[-fade:] *= ramp[::-1]
    return mono


def place(buf, mono, t):
    i = int(round(t * SR))
    n = min(len(mono), len(buf) - i)
    buf[i:i + n] += mono[:n]


def master(mix, target_lufs=-14.0):
    meter = pyln.Meter(SR)
    loud = meter.integrated_loudness(mix)
    mix = mix * 10 ** ((target_lufs - loud) / 20)
    # Soft limiter: transparent below -3 dBFS, tanh knee up to a -1 dBFS ceiling.
    ceil, knee = 10 ** (-1 / 20), 10 ** (-3 / 20)
    a = np.abs(mix)
    over = a > knee
    mix[over] = np.sign(mix[over]) * (knee + (ceil - knee) * np.tanh((a[over] - knee) / (ceil - knee)))
    return mix, meter.integrated_loudness(mix)


def main(vocals_path, music_dir, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    vocals = load(vocals_path)
    music = load(os.path.join(music_dir, "music.wav"))[:N]
    sfx = load(os.path.join(music_dir, "sfx.wav"))[:N]

    vo = np.zeros(N)
    for s, e, at, g in VO_LINES:
        seg = clean_vo(vocals[int(s * SR):int(e * SR)])
        place(vo, g * seg / np.max(np.abs(seg)), at)

    # Duck music under the VO (-9 dB) with 60 ms attack / 350 ms release.
    win = int(0.02 * SR)
    active = (np.sqrt(np.convolve(vo ** 2, np.ones(win) / win, mode="same")) > 0.02).astype(float)
    att, rel = int(0.06 * SR), int(0.35 * SR)
    hold = np.convolve(active, np.ones(rel), mode="full")[:N] > 0  # extend for release
    env = np.convolve(hold.astype(float), np.ones(att) / att, mode="same")
    duck = 1 - (1 - 10 ** (-9 / 20)) * np.clip(env, 0, 1)

    music_bed = music * 0.8 + sfx * 0.35
    vo_gain = 0.62
    with_vo = music_bed * duck[:, None] + (vo * vo_gain)[:, None]
    with_vo, l1 = master(with_vo)
    music_only, l2 = master(music_bed.copy())

    sf.write(os.path.join(out_dir, "soundtrack_vo.wav"), with_vo.astype(np.float32), SR, subtype="PCM_24")
    sf.write(os.path.join(out_dir, "soundtrack_music.wav"), music_only.astype(np.float32), SR, subtype="PCM_24")
    print(f"soundtrack_vo {l1:.1f} LUFS, soundtrack_music {l2:.1f} LUFS")


if __name__ == "__main__":
    main(*sys.argv[1:4])
