"""Score the reel: an original 120 BPM industrial-cinematic track, SFX locked to
the edit, and the factory's own machine sound under it all.

Everything is synthesised here from scratch (no samples, no licences needed).
Timing comes from src/edit.json, so re-cutting the edit and re-running this
keeps every hit on its cut.

Writes public/audio/mix_music.wav (music + sfx + ambience) and
public/audio/mix_nomusic.wav (sfx + ambience, for adding trending IG audio in-app),
both loudness-normalised to -14 LUFS / -1 dBTP.

Usage: python3 tools/make_audio.py
"""
import json
import os
import subprocess

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDIT = json.load(open(os.path.join(ROOT, "src", "edit.json")))
FPS = EDIT["fps"]
SR = 48000
BEAT = 60.0 / EDIT["bpm"]
BAR = 4 * BEAT
TOTAL_FRAMES = sum(s["frames"] for s in EDIT["shots"])
DUR = TOTAL_FRAMES / FPS
N = int((DUR + 0.05) * SR)
rng = np.random.default_rng(7)


# ---------------------------------------------------------------- helpers
def buf():
    return np.zeros((N, 2))


def place(dst, x, t, gain=1.0, pan=0.0):
    """Mix mono or stereo x into dst at time t (s) with equal-power pan."""
    i = int(round(t * SR))
    if i >= len(dst):
        return
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * l * 1.414, x * r * 1.414], axis=1)
    n = min(len(x), len(dst) - i)
    dst[i:i + n] += x[:n] * gain


def env(n, a, d, curve=1.0):
    t = np.arange(n) / SR
    e = np.minimum(1.0, t / max(a, 1e-4)) * np.exp(-t / max(d, 1e-4))
    return e ** curve


def lp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, "low", fs=SR, output="sos"), x, axis=0)


def hp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, "high", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, hi], "band", fs=SR, output="sos"), x, axis=0)


def saw(freq, n, phase=0.0):
    t = np.arange(n) / SR
    return 2.0 * ((t * freq + phase) % 1.0) - 1.0


def note_hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def reverb_ir(seconds=2.2, decay=0.55, predelay=0.02):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-t / decay)[:, None]
    ir = lp(ir, 6000)
    ir[: int(predelay * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(axis=0))


IR = reverb_ir()


def reverb(x, mix):
    wet = np.stack([signal.fftconvolve(x[:, c], IR[:, c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - mix) + wet * mix * 3.0


def sweep_noise(n, f0, f1, width=0.35):
    """Noise through a band that glides f0 -> f1 (STFT mask)."""
    x = rng.standard_normal(n)
    f, tt, Z = signal.stft(x, SR, nperseg=1024)
    centre = np.geomspace(f0, f1, Z.shape[1])
    mask = np.exp(-((np.log(f[:, None] + 1) - np.log(centre[None, :])) ** 2) / (2 * width ** 2))
    _, y = signal.istft(Z * mask, SR, nperseg=1024)
    y = y[:n]
    return y / (np.abs(y).max() + 1e-9)


# ---------------------------------------------------------------- instruments
def kick():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 46 + 120 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    click = hp(rng.standard_normal(n), 3000) * np.exp(-t * 400) * 0.25
    return np.tanh(1.6 * (body + click))


def clap():
    n = int(0.35 * SR)
    x = np.zeros(n)
    for k, d in enumerate([0, 0.011, 0.022]):
        i = int(d * SR)
        m = n - i
        x[i:] += rng.standard_normal(m) * env(m, 0.0005, 0.012 if k < 2 else 0.11)
    return bp(x, 900, 4200) * 1.6


def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    x = hp(rng.standard_normal(n), 7500, 4) * env(n, 0.0005, 0.08 if open_ else 0.015)
    return x * 0.8


def clank(freq=520.0):
    """Metallic FM hit - the 'factory' colour."""
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    idx = 7 * np.exp(-t * 18)
    y = np.sin(2 * np.pi * freq * t + idx * np.sin(2 * np.pi * freq * 2.76 * t))
    return y * env(n, 0.001, 0.13) * 0.9


def bell(freq):
    n = int(2.5 * SR)
    t = np.arange(n) / SR
    idx = 2.2 * np.exp(-t * 3)
    y = np.sin(2 * np.pi * freq * t + idx * np.sin(2 * np.pi * freq * 3.5 * t))
    return y * env(n, 0.002, 0.7)


def bass_note(freq, length):
    n = int(length * SR)
    x = saw(freq, n) + 0.5 * np.sin(2 * np.pi * freq * np.arange(n) / SR)
    e = env(n, 0.003, length * 0.6)
    y = lp(x * e, 380, 2)
    return np.tanh(2.2 * y) * 0.8


def pluck(freq, length=0.22):
    n = int(length * SR)
    x = saw(freq, n) * 0.6 + np.sign(np.sin(2 * np.pi * freq * np.arange(n) / SR)) * 0.4
    return lp(x * env(n, 0.001, 0.07), 2600) * 0.55


def pad_chord(midis, length, bright=1400):
    n = int(length * SR)
    out = np.zeros((n, 2))
    for m in midis:
        for det, pan in [(-0.08, -0.7), (0.0, 0.0), (0.09, 0.7)]:
            f = note_hz(m + det)
            v = saw(f, n, phase=rng.random())
            out[:, 0] += v * (1 - pan) * 0.5
            out[:, 1] += v * (1 + pan) * 0.5
    t = np.arange(n) / SR
    a = np.minimum(1, t / 0.35) * np.minimum(1, (length - t) / 0.3).clip(0, 1)
    return lp(out * a[:, None], bright, 2) / (len(midis) * 1.8)


def impact():
    n = int(2.6 * SR)
    t = np.arange(n) / SR
    f = 28 + 42 * np.exp(-t * 3)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.9)
    crack = lp(rng.standard_normal(n), 3500) * np.exp(-t * 14) * 0.6
    y = np.tanh(1.8 * (sub + crack))
    return y


def whoosh(length=0.45):
    n = int(length * SR)
    x = sweep_noise(n, 350, 5000, 0.45)
    t = np.linspace(0, 1, n)
    e = np.sin(np.pi * t) ** 1.6
    y = x * e
    st = np.stack([y * (1 - t), y * t], axis=1) * 1.3
    return st


def tick():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1800 * t) * 0.6 + np.sin(2 * np.pi * 3600 * t) * 0.3) * np.exp(-t * 90)


def riser(length):
    n = int(length * SR)
    x = sweep_noise(n, 250, 9000, 0.5)
    t = np.linspace(0, 1, n)
    f = np.geomspace(110, 880, n)
    tone = lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 2500) * 0.18
    return (x * 0.8 + tone) * (t ** 2.2)


# ---------------------------------------------------------------- the score
# A minor, i - VI - III - VII (Am F C G), one chord per bar.
CHORDS = [
    (45, [57, 60, 64, 69]),  # Am
    (41, [53, 57, 60, 65]),  # F
    (48, [55, 60, 64, 67]),  # C
    (43, [55, 59, 62, 67]),  # G
]


def music():
    drums, bassb, synth, padb, fx = buf(), buf(), buf(), buf(), buf()
    K, CL, CH, OH = kick(), clap(), hat(), hat(True)
    bars = int(round(DUR / BAR))
    end_bar = int(round((DUR - 4.0) / BAR))  # last two bars = end card
    sidechain = np.ones(N)

    # Intro bar: pad swell + ticking hats + riser into the drop.
    padb_intro = pad_chord([57, 60, 64], BAR, bright=700)
    place(padb, padb_intro, 0.0, 0.55)
    for k in range(8):
        place(drums, CH, k * BEAT / 2, 0.18 + 0.03 * k, pan=0.3)
    place(fx, riser(BAR), 0.0, 0.55)

    for b in range(1, bars):
        t0 = b * BAR
        root, chord = CHORDS[b % 4]
        if b >= end_bar:
            continue
        section = 1 if b <= 4 else (2 if b <= 8 else 3)
        for beat in range(4):
            tb = t0 + beat * BEAT
            place(drums, K, tb, 0.95)
            i = int(tb * SR)
            m = min(N - i, int(0.22 * SR))
            sidechain[i:i + m] = np.minimum(sidechain[i:i + m], 0.25 + 0.75 * np.linspace(0, 1, m) ** 0.6)
            # hats
            place(drums, CH, tb + BEAT / 2, 0.42, pan=0.25)
            if section >= 2:
                place(drums, OH, tb + BEAT / 2, 0.16, pan=-0.2)
            if section >= 3:
                place(drums, CH, tb + BEAT / 4, 0.2, pan=0.35)
                place(drums, CH, tb + 3 * BEAT / 4, 0.2, pan=0.35)
            if section >= 2 and beat in (1, 3):
                place(drums, CL, tb, 0.55)
            # rolling bass on the three off-16ths of every beat
            for s in (1, 2, 3):
                place(bassb, bass_note(note_hz(root), BEAT / 4 * 0.9), tb + s * BEAT / 4, 0.55)
        # factory clank on the 'and' of 4, alternating pitch
        place(drums, clank(520 if b % 2 else 392), t0 + 3.5 * BEAT, 0.33, pan=-0.35 if b % 2 else 0.35)
        if section >= 2:
            seq = [0, 1, 2, 3, 2, 1, 2, 3]
            for k in range(16):
                m = chord[seq[k % 8]] + 12
                place(synth, pluck(note_hz(m)), t0 + k * BEAT / 4, 0.24 if k % 4 == 0 else 0.16,
                      pan=0.4 if k % 2 else -0.4)
        place(padb, pad_chord(chord, BAR + 0.1, bright=900 + 500 * (section - 1)), t0, 0.35 + 0.1 * section)
        # fill into the end card
        if b == end_bar - 1:
            for k in range(4):
                place(drums, CL, t0 + 3 * BEAT + k * BEAT / 4, 0.25 + 0.12 * k)
            place(fx, riser(BEAT * 2), t0 + 2 * BEAT, 0.4)

    # End card: impact, wide Am(add9) pad, bell motif, reverb bloom.
    te = end_bar * BAR
    place(fx, impact(), te, 0.9)
    place(padb, pad_chord([45, 57, 64, 69, 71, 76], 4.2, bright=1800), te, 0.75)
    for k, m in enumerate([76, 72, 69, 71]):
        place(synth, bell(note_hz(m)), te + 1.0 + k * BEAT, 0.22, pan=[-0.3, 0.3, -0.15, 0.15][k])
    place(drums, K, te, 0.8)

    # sidechain pump on bass/pad/synth
    sc = sidechain[:, None]
    bassb *= sc
    padb *= (0.45 + 0.55 * sc)
    synth *= (0.6 + 0.4 * sc)
    synth = reverb(synth, 0.35)
    padb = reverb(padb, 0.3)
    drums = drums + reverb(drums, 0.12) * 0.25
    fx = reverb(fx, 0.25)
    mixb = drums * 0.9 + bassb * 0.9 + synth * 0.8 + padb * 0.7 + fx * 0.8
    # tail fade on the last half second
    fade = np.ones(N)
    k = int(0.6 * SR)
    fade[-k:] = np.linspace(1, 0, k) ** 1.5
    return mixb * fade[:, None]


def cut_times():
    """(time, out-transition) for every shot boundary."""
    t, out = 0, []
    for s in EDIT["shots"]:
        t += s["frames"]
        out.append((t / FPS, s.get("out")))
    return out[:-1]


def stage_starts():
    t, seen, res = 0, set(), []
    for s in EDIT["shots"]:
        if s["stage"] not in seen:
            seen.add(s["stage"])
            res.append((s["stage"], t / FPS))
        t += s["frames"]
    return res


def sfx():
    out = buf()
    starts = dict(stage_starts())
    # hook words land on beats 1-3
    for k in range(3):
        place(out, lp(kick(), 180), k * BEAT, 0.16)
        place(out, tick(), k * BEAT, 0.27)
    place(out, impact(), starts[1], 0.75)  # the drop: rock
    for t, tr in cut_times():
        if tr and tr["type"] != "fade":
            place(out, whoosh(), t - 0.25, 0.55)
    for st, t in starts.items():
        if 1 <= st <= 13:
            place(out, tick(), t + 3 / FPS, 0.5, pan=-0.4)
    # kiln counter: digital blips while the temperature climbs
    tf = starts[10]
    for k in range(14):
        place(out, tick() * 0.5, tf + 0.1 + k * 0.07, 0.25, pan=0.2)
    # brand reveal shimmer
    te = starts[14]
    for k, m in enumerate([88, 91, 95]):
        place(out, bell(note_hz(m)) * 0.5, te + 1.0 + k * 0.06, 0.18, pan=[-0.5, 0, 0.5][k])
    return reverb(out, 0.15)


def ambience():
    out = buf()
    t = 0
    for s in EDIT["shots"]:
        path = os.path.join(ROOT, "public", "clips", s["key"] + ".wav")
        dur = s["frames"] / FPS
        if os.path.exists(path):
            sr, x = wavfile.read(path)
            x = x.astype(np.float64) / 32768.0
            x = hp(x, 90)
            n = min(len(x), int((dur + 0.04) * SR))
            x = x[:n]
            rms = np.sqrt((x ** 2).mean()) + 1e-6
            x = x / rms * 0.05  # level-match every shot
            f = int(0.03 * SR)
            ramp = np.ones(n)
            ramp[:f] = np.linspace(0, 1, f)
            ramp[-f:] = np.linspace(1, 0, f)
            gain = 0.35 if s["stage"] == 14 else 1.0
            place(out, x * ramp, t / FPS, gain)
        t += s["frames"]
    return np.tanh(out * 2.0) / 2.0


def write(path, x):
    peak = np.abs(x).max() + 1e-9
    x = np.tanh(x / peak * 1.1) * 0.9
    wavfile.write(path, SR, (x * 32767).astype(np.int16))


def loudnorm(src, dst):
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", src, "-af", "loudnorm=I=-14:TP=-1.0:LRA=9",
         "-ar", str(SR), "-c:a", "pcm_s16le", dst],
        check=True,
    )


def main():
    adir = os.path.join(ROOT, "public", "audio")
    os.makedirs(adir, exist_ok=True)
    m, fx, amb = music(), sfx(), ambience()
    tmp = os.path.join(adir, "_tmp.wav")
    write(tmp, m * 1.0 + fx * 0.55 + amb * 0.22)
    loudnorm(tmp, os.path.join(adir, "mix_music.wav"))
    write(tmp, fx * 0.7 + amb * 0.8)
    loudnorm(tmp, os.path.join(adir, "mix_nomusic.wav"))
    write(tmp, m)
    loudnorm(tmp, os.path.join(adir, "music_only.wav"))
    os.remove(tmp)
    print(f"duration {DUR:.2f}s  cuts={len(cut_times())}")


if __name__ == "__main__":
    main()
