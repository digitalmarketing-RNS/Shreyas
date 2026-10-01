"""Score the robots reel: an original 120 BPM electro track, HUD sound design
locked to the edit (glitch bursts on the cuts, decode ticks, lock-on beeps) and
the factory's own machine sound under it all.

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






def riser(length):
    n = int(length * SR)
    x = sweep_noise(n, 250, 9000, 0.5)
    t = np.linspace(0, 1, n)
    f = np.geomspace(110, 880, n)
    tone = lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 2500) * 0.18
    return (x * 0.8 + tone) * (t ** 2.2)


# ---------------------------------------------------------------- HUD sounds
def bitcrush(x, hold=6, levels=24):
    """Sample-and-hold + quantise: the 'digital' grit for glitches."""
    y = np.repeat(x[::hold], hold, axis=0)[: len(x)]
    return np.round(y * levels) / levels


def glitch_burst(length=0.26):
    """Crushed noise + a stuttered square blip, panned across."""
    n = int(length * SR)
    t = np.arange(n) / SR
    noise = bitcrush(bp(rng.standard_normal(n), 600, 7000), 5, 10) * np.exp(-t * 9)
    grain = np.sign(np.sin(2 * np.pi * 880 * np.arange(int(0.028 * SR)) / SR)) * 0.5
    stut = np.zeros(n)
    for k in range(5):
        i = int(k * 0.042 * SR)
        m = min(len(grain), n - i)
        stut[i:i + m] += grain[:m] * (1 - k / 6)
    y = noise * 0.8 + bitcrush(stut, 4, 8) * 0.45
    pan = np.linspace(-0.8, 0.8, n)
    return np.stack([y * (1 - pan) / 2, y * (1 + pan) / 2], axis=1) * 1.6


def beep(freq, length=0.06):
    n = int(length * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * freq * t) + 0.25 * np.sign(np.sin(2 * np.pi * freq * t))
    e = np.minimum(1, t / 0.003) * np.minimum(1, (length - t) / 0.01).clip(0, 1)
    return y * e * 0.5


def lock_on():
    """Two rising beeps: target acquired."""
    out = np.zeros(int(0.2 * SR))
    for k, f in enumerate([1568.0, 2093.0]):
        b = beep(f)
        i = int(k * 0.075 * SR)
        out[i:i + len(b)] += b
    return out


def data_tick(freq=None):
    n = int(0.018 * SR)
    t = np.arange(n) / SR
    f = freq if freq else 2400 + rng.random() * 2400
    return np.sign(np.sin(2 * np.pi * f * t)) * np.exp(-t * 260) * 0.35


def power_up(length=0.7):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = np.geomspace(70, 1600, n)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + lp(saw(55, n), 900) * 0.3 * (1 - t / length)
    return y * np.minimum(1, t / 0.02) * (1 - t / length) ** 0.6


def arp_note(freq, length=0.11):
    """Robotic square pluck for the 16th arp."""
    n = int(length * SR)
    t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * freq * t)) * 0.7 + saw(freq * 1.005, n) * 0.3
    return bitcrush(lp(x * env(n, 0.001, 0.05), 3800), 3, 32) * 0.5


def sub_drone(length, freq=55.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * freq * t) * 0.8 + np.sin(2 * np.pi * freq * 2 * t) * 0.15
    return y * np.minimum(1, t / 0.4) * np.minimum(1, (length - t) / 0.2).clip(0, 1)


# ---------------------------------------------------------------- the score
# A minor, i - VI - III - VII (Am F C G), one chord per bar.
CHORDS = [
    (45, [57, 60, 64, 69]),  # Am
    (41, [53, 57, 60, 65]),  # F
    (48, [55, 60, 64, 67]),  # C
    (43, [55, 59, 62, 67]),  # G
]


def stage_starts():
    t, seen, res = 0, set(), []
    for s in EDIT["shots"]:
        if s["stage"] not in seen:
            seen.add(s["stage"])
            res.append((s["stage"], t / FPS))
        t += s["frames"]
    return res


def cut_times():
    """(time, out-transition) for every shot boundary."""
    t, out = 0, []
    for s in EDIT["shots"]:
        t += s["frames"]
        out.append((t / FPS, s.get("out")))
    return out[:-1]


END_STAGE = len(EDIT["stages"]) - 1
LOCK_FRAME = 13  # TargetLock locks this many frames after a unit's cut


def layout():
    starts = dict(stage_starts())
    drop = int(round(starts[1] / BAR))
    end_bar = int(round(starts[END_STAGE] / BAR))
    return drop, end_bar


def music():
    drums, bassb, synth, padb, fx = buf(), buf(), buf(), buf(), buf()
    K, CL, CH, OH = kick(), clap(), hat(), hat(True)
    drop, end_bar = layout()
    sidechain = np.ones(N)

    def duck(t):
        i = int(t * SR)
        m = min(N - i, int(0.2 * SR))
        sidechain[i:i + m] = np.minimum(sidechain[i:i + m], 0.25 + 0.75 * np.linspace(0, 1, m) ** 0.6)

    # Hook bar: drone + an arp whose filter opens, hits on the title beats,
    # riser into the drop.
    hook = drop * BAR
    place(padb, np.stack([sub_drone(hook + 0.05)] * 2, axis=1), 0, 0.5)
    for k in range(int(hook / (BEAT / 4))):
        m = CHORDS[0][1][[0, 2, 1, 3][k % 4]] + 12
        place(synth, arp_note(note_hz(m)), k * BEAT / 4, 0.08 + 0.14 * k / (hook / (BEAT / 4)), pan=0.35 if k % 2 else -0.35)
    place(drums, K, 0, 0.9)
    place(drums, clank(660), BEAT, 0.35, pan=0.2)
    place(drums, K, 2 * BEAT, 0.9)
    place(drums, CL, 2 * BEAT, 0.5)
    for k in range(4):
        place(drums, CH, 3 * BEAT + k * BEAT / 4, 0.18 + 0.08 * k)
    place(fx, riser(BEAT * 2), hook - BEAT * 2, 0.5)

    span = max(1, end_bar - drop)
    for b in range(drop, end_bar):
        t0 = b * BAR
        root, chord = CHORDS[(b - drop) % 4]
        pos = (b - drop) / span
        section = 1 if pos < 0.2 else (2 if pos < 0.6 else 3)
        for beat in range(4):
            tb = t0 + beat * BEAT
            place(drums, K, tb, 0.95)
            duck(tb)
            place(drums, CH, tb + BEAT / 2, 0.42, pan=0.25)
            if section >= 2:
                place(drums, OH, tb + BEAT / 2, 0.15, pan=-0.2)
            if section >= 3:
                place(drums, CH, tb + BEAT / 4, 0.2, pan=0.35)
                place(drums, CH, tb + 3 * BEAT / 4, 0.2, pan=0.35)
            if beat in (1, 3):
                place(drums, CL, tb, 0.5 if section >= 2 else 0.3)
            for s16 in (1, 2, 3):
                place(bassb, bass_note(note_hz(root), BEAT / 4 * 0.9), tb + s16 * BEAT / 4, 0.55)
        # robotic arp: 16ths over the chord, octave jump in the last section
        seq = [0, 2, 1, 3, 2, 0, 3, 1]
        for k in range(16):
            m = chord[seq[k % 8]] + (24 if section == 3 and k % 4 == 3 else 12)
            place(synth, arp_note(note_hz(m)), t0 + k * BEAT / 4, 0.22 if k % 4 == 0 else 0.14,
                  pan=0.4 if k % 2 else -0.4)
        place(padb, pad_chord(chord, BAR + 0.1, bright=900 + 400 * (section - 1)), t0, 0.3 + 0.08 * section)
        place(drums, clank(520 if b % 2 else 392), t0 + 3.5 * BEAT, 0.25, pan=-0.35 if b % 2 else 0.35)
        if b == end_bar - 1:
            for k in range(8):
                place(drums, CL, t0 + 2 * BEAT + k * BEAT / 4, 0.15 + 0.07 * k)
            place(fx, riser(BEAT * 2), t0 + 2 * BEAT, 0.45)

    # End card: impact, wide Am(add9) pad, bell motif, reverb bloom.
    te = end_bar * BAR
    tail = DUR - te
    place(fx, impact(), te, 0.9)
    place(drums, K, te, 0.85)
    place(padb, pad_chord([45, 57, 64, 69, 71, 76], tail + 0.2, bright=1800), te, 0.75)
    for k, m in enumerate([76, 72, 69, 71, 76, 79]):
        place(synth, bell(note_hz(m)), te + 0.5 + k * BEAT / 2, 0.2, pan=[-0.3, 0.3, -0.15, 0.15, -0.3, 0.3][k])

    sc = sidechain[:, None]
    bassb *= sc
    padb *= (0.45 + 0.55 * sc)
    synth *= (0.6 + 0.4 * sc)
    synth = reverb(synth, 0.3)
    padb = reverb(padb, 0.3)
    drums = drums + reverb(drums, 0.12) * 0.25
    fx = reverb(fx, 0.25)
    mixb = drums * 0.9 + bassb * 0.9 + synth * 0.75 + padb * 0.7 + fx * 0.8
    fade = np.ones(N)
    k = int(0.6 * SR)
    fade[-k:] = np.linspace(1, 0, k) ** 1.5
    return mixb * fade[:, None]


def sfx():
    out = buf()
    starts = dict(stage_starts())
    f = 1.0 / FPS
    # boot
    place(out, power_up(), 0, 0.55)
    place(out, impact(), 0, 0.35)
    for k in range(6):
        place(out, data_tick(), (5 + 2 * k) * f, 0.4, pan=0.3)
    for k in range(6):  # "TECHNOLOGY AT WORK" typing in on beat 3
        place(out, data_tick(5200), (43 + 2 * k) * f, 0.14, pan=-0.4)
    # every cut: glitch burst centred on the cut
    for t, tr in cut_times():
        if tr and tr["type"] == "glitch":
            place(out, glitch_burst(), t - 0.08, 0.7)
    # every unit: decode ticks on the name, typing on the readouts, lock-on beep
    for st, t in starts.items():
        if 1 <= st < END_STAGE:
            for k in range(6):
                place(out, data_tick(), t + (2 + 2 * k) * f, 0.35, pan=-0.3)
            for k in range(10):
                place(out, data_tick(5200), t + (10 + 2 * k) * f, 0.12, pan=-0.5)
            place(out, lock_on(), t + LOCK_FRAME * f, 0.45, pan=0.25)
    # end card: logo shimmer + CTA blip
    te = starts[END_STAGE]
    for k, m in enumerate([88, 91, 95]):
        place(out, bell(note_hz(m)) * 0.5, te + 1.13 + k * 0.06, 0.18, pan=[-0.5, 0, 0.5][k])
    place(out, lock_on(), te + 2.0, 0.3)
    return reverb(out, 0.12)


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
            fr = int(0.03 * SR)
            ramp = np.ones(n)
            ramp[:fr] = np.linspace(0, 1, fr)
            ramp[-fr:] = np.linspace(1, 0, fr)
            gain = 0.35 if s["stage"] == END_STAGE else 1.0
            place(out, x * ramp, t / FPS, gain)
        t += s["frames"]
    return np.tanh(out * 2.0) / 2.0


def write(path, x):
    peak = np.abs(x).max() + 1e-9
    x = np.tanh(x / peak * 1.1) * 0.9
    wavfile.write(path, SR, (x * 32767).astype(np.int16))


def loudnorm(src, dst, tp=-1.0):
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", src, "-af", f"loudnorm=I=-14:TP={tp}:LRA=9",
         "-ar", str(SR), "-c:a", "pcm_s16le", dst],
        check=True,
    )


def main():
    adir = os.path.join(ROOT, "public", "audio")
    os.makedirs(adir, exist_ok=True)
    m, fx, amb = music(), sfx(), ambience()
    tmp = os.path.join(adir, "_tmp.wav")
    write(tmp, m * 1.0 + fx * 0.6 + amb * 0.2)
    loudnorm(tmp, os.path.join(adir, "mix_music.wav"))
    write(tmp, fx * 0.75 + amb * 0.8)
    # the glitch bursts overshoot after AAC encoding, so this mix gets extra headroom
    loudnorm(tmp, os.path.join(adir, "mix_nomusic.wav"), tp=-4.0)
    write(tmp, m)
    loudnorm(tmp, os.path.join(adir, "music_only.wav"))
    os.remove(tmp)
    print(f"duration {DUR:.2f}s  cuts={len(cut_times())}")


if __name__ == "__main__":
    main()
