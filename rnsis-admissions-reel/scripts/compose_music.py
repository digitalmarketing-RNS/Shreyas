"""Compose the original 37.5 s score for the RNSIS Admissions 2027-28 reel.

120 BPM, D major, written as a bed for a voiceover that runs the whole length:
  0-4   hook      "Every child holds a universe of possibilities": celesta twinkles,
                  choir, warm pad, shimmer on the key words, build into the drop
  4-11  identities: pizzicato-string pulse, drums, a tom hit on every 1 s cut
  11-12 break     music stops, riser + reverse cymbal
  12-16 payoff    "ALL OF IT": full groove, strings, glockenspiel motif
  16-24 proof     lighter groove, then a snare/riser build
  24-28 lift      biggest section: horns, choir, string octaves, motif
  28-32 end card  half-time, calm cadence under the call to action
  32    final hit on the school name; the chord holds softly under the closing
        tagline and fades out by 37.5 s
Every section boundary is a downbeat and an edit point in src/timeline.ts.

Pitched parts are MIDI rendered with FluidSynth + the MuseScore General soundfont (MIT).
Drums, bass, plucks, risers and impacts are synthesised here. Mid-range instruments are
kept light and high-passed so the voiceover sits on top; mix_audio.py ducks the bed under it.

Usage:
    python compose_music.py <out_dir>        -> music.wav, sfx.wav
"""

import os
import subprocess
import sys
import tempfile

import mido
import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
LENGTH = 37.5
N = int(SR * LENGTH)
SOUNDFONT = "/usr/share/sounds/sf2/MuseScore_General_Full.sf2"
rng = np.random.default_rng(2027)

# Section boundaries (seconds); keep in sync with src/timeline.ts.
HOOK, IDS, BREAK, PAYOFF, PROOF, LIFT, OUTRO, FINAL = 0, 4, 11, 12, 16, 24, 28, 32
CUTS = [4, 5, 6, 7, 8, 9, 10]          # identity cuts
FAC_CUTS = [20, 21, 22, 23]            # facility flashes

# ---------------------------------------------------------------- harmony
CHORDS = {
    "Dadd9": dict(v=[62, 66, 69, 76], bass=38),
    "Gadd9": dict(v=[62, 67, 69, 71], bass=31),
    "D": dict(v=[62, 66, 69, 74], bass=38),
    "A": dict(v=[61, 64, 69, 73], bass=33),
    "Asus4": dict(v=[62, 64, 69, 74], bass=33),
    "Bm": dict(v=[62, 66, 71, 74], bass=35),
    "G": dict(v=[62, 67, 71, 74], bass=31),
    "Em7": dict(v=[62, 64, 67, 71], bass=40),
}
PROGRESSION = [
    (0, 2, "Dadd9"), (2, 3, "Gadd9"), (3, 4, "A"),
    (4, 6, "D"), (6, 8, "A"), (8, 10, "Bm"), (10, 11, "G"),
    (11, 12, "Asus4"),
    (12, 13, "D"), (13, 14, "A"), (14, 15, "Bm"), (15, 16, "G"),
    (16, 18, "D"), (18, 20, "A"), (20, 22, "Bm"), (22, 23, "G"), (23, 23.5, "Asus4"), (23.5, 24, "A"),
    (24, 25, "D"), (25, 26, "A"), (26, 27, "Bm"), (27, 28, "G"),
    (28, 30, "Em7"), (30, 31, "G"), (31, 32, "A"),
    (32, 37.5, "D"),
]


def chord_at(t):
    for s, e, c in PROGRESSION:
        if s <= t < e:
            return CHORDS[c]
    return CHORDS["D"]


def frange(a, b, step):
    t = a
    while t < b - 1e-6:
        yield t
        t += step


# ---------------------------------------------------------------- MIDI parts
TPB = 480


def sec_to_tick(t):
    return int(round(t * 2 * TPB))  # 120 BPM -> 2 beats per second


def write_midi(path, program, notes, ccs=()):
    """notes: (start, dur, pitch, vel); ccs: (time, cc, value)."""
    events = []
    for s, d, p, v in notes:
        v = int(max(1, min(127, v)))
        events.append((sec_to_tick(s), 1, mido.Message("note_on", note=p, velocity=v)))
        events.append((sec_to_tick(s + d), 0, mido.Message("note_off", note=p, velocity=0)))
    for t, cc, val in ccs:
        events.append((sec_to_tick(t), 0, mido.Message("control_change", control=cc, value=int(max(0, min(127, val))))))
    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=500000, time=0))
    tr.append(mido.Message("program_change", program=program, time=0))
    tr.append(mido.Message("control_change", control=7, value=110, time=0))
    last = 0
    for tick, _, msg in events:
        msg.time = tick - last
        last = tick
        tr.append(msg)
    mid.save(path)


def render_midi(mid_path, wav_path, gain=0.5):
    subprocess.run(
        ["fluidsynth", "-ni", "-g", str(gain), "-R", "0", "-C", "0", "-r", str(SR), "-F", wav_path, SOUNDFONT, mid_path],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    y, sr = sf.read(wav_path, always_2d=True)
    assert sr == SR
    out = np.zeros((N, 2))
    n = min(N, len(y))
    out[:n] = y[:n]
    return out


def ramp(a, b, v0, v1, steps=12, cc=11):
    return [(a + (b - a) * k / (steps - 1), cc, v0 + (v1 - v0) * k / (steps - 1)) for k in range(steps)]


def piano_part():
    notes = []
    # Hook: soft open voicings under the celesta.
    for s, e, c in [(0, 2, "Dadd9"), (2, 3, "Gadd9"), (3, 4, "A")]:
        ch = CHORDS[c]
        notes += [(s, e - s - 0.05, p, 58) for p in [ch["bass"] + 12] + ch["v"][1:]]
    # Light high ostinato (8ths) in the grooves; stays above the voice's core range.
    for a, b, vel in [(IDS, BREAK, 62), (PAYOFF, PROOF, 70), (PROOF, 22, 58), (LIFT, OUTRO, 76)]:
        for k, t in enumerate(frange(a, b, 0.25)):
            ch = sorted(chord_at(t)["v"])
            pat = [ch[3] + 12, ch[2] + 12, ch[1] + 12, ch[2] + 12]
            notes.append((t, 0.22, pat[k % 4], vel + (8 if k % 4 == 0 else 0)))
    # Break pickups into the slam.
    notes += [(11.5, 0.24, 69, 72), (11.75, 0.24, 73, 78)]
    # End card: warm sustained chords, then the final chord.
    for s, e, c in [(28, 30, "Em7"), (30, 31, "G"), (31, 32, "A")]:
        ch = CHORDS[c]
        notes += [(s, e - s - 0.05, p, 64) for p in [ch["bass"] + 12] + ch["v"]]
    notes += [(32.0, 4.8, p, 98) for p in [38, 50, 57, 62, 66, 69, 74, 78]]
    return notes


def pizz_part():
    """Pizzicato ostinato that drives the montage and proof sections."""
    notes = []
    for a, b, vel in [(IDS, BREAK, 92), (PAYOFF, PROOF, 96), (PROOF, 23.5, 84), (LIFT, OUTRO, 100)]:
        for k, t in enumerate(frange(a, b, 0.25)):
            ch = chord_at(t)
            root = ch["bass"] + 12
            pat = [root, root + 7, root + 12, root + 7]
            notes.append((t, 0.2, pat[k % 4], vel + (12 if k % 2 == 0 else 0)))
    return notes


def strings_part():
    notes, ccs = [], []
    spans = [(s, e, c) for s, e, c in PROGRESSION if not (BREAK <= s < PAYOFF)]
    for s, e, c in spans:
        ch = CHORDS[c]
        voicing = [ch["bass"] + 12, ch["v"][0] - 12, ch["v"][2] - 12, ch["v"][1], ch["v"][2]]
        if s >= LIFT and s < OUTRO or s >= FINAL:
            voicing += [ch["v"][3], ch["v"][3] + 12]  # octave doubling in the lift / final
        vel = 70 if s < IDS else 82 if s < PAYOFF else 96 if s < PROOF else 80 if s < LIFT else 112 if s < OUTRO else 88
        notes += [(s, e - s, p, vel) for p in voicing]
    ccs += [(0, 11, 50)] + ramp(0.2, 3.95, 50, 118)
    ccs += [(4.0, 11, 92)] + ramp(9.0, 10.95, 92, 120) + [(11.0, 11, 40)]
    ccs += [(12.0, 11, 122), (16.0, 11, 90)] + ramp(21.0, 23.95, 90, 127)
    ccs += [(24.0, 11, 127), (28.0, 11, 96)] + ramp(30.0, 31.95, 96, 124) + [(32.0, 11, 127)]
    ccs += ramp(33.0, 36.5, 127, 62)  # settle under the closing tagline
    return notes, ccs


def celesta_part():
    """Twinkling 16th-note celesta across the hook, a sprinkle on the final hit."""
    notes = []
    arps = {"Dadd9": [74, 78, 81, 88, 86, 81, 78, 83], "Gadd9": [74, 79, 81, 86, 83, 81, 79, 74], "A": [73, 76, 81, 85, 83, 81, 76, 71]}
    for k, t in enumerate(frange(0, 3.94, 0.125)):
        name = "Dadd9" if t < 2 else "Gadd9" if t < 3 else "A"
        notes.append((t, 0.5, arps[name][k % 8], min(112, 60 + 34 * t / 4 + (10 if k % 4 == 0 else 0))))
    for k, p in enumerate([86, 90, 93, 98]):
        notes.append((32.0 + k * 0.125, 1.5, p, 84))
    return notes


def choir_part():
    notes = [(0.0, 2.0, p, 70) for p in (62, 66, 69, 76)]
    notes += [(2.0, 1.0, p, 76) for p in (62, 67, 71, 74)]
    notes += [(3.0, 0.95, p, 84) for p in (61, 64, 69, 76)]
    for s, e, c in [(24, 25, "D"), (25, 26, "A"), (26, 27, "Bm"), (27, 28, "G"), (32, 37.2, "D")]:
        notes += [(s, e - s, p, 92) for p in CHORDS[c]["v"]]
    ccs = [(0.0, 11, 40)] + ramp(0.1, 3.9, 40, 120) + [(24.0, 11, 110), (32.0, 11, 120)] + ramp(33.0, 36.5, 120, 60)
    return notes, ccs


def horns_part():
    """French horns give the lift and the final chord their size."""
    notes = []
    for s, e, c in [(24, 25, "D"), (25, 26, "A"), (26, 27, "Bm"), (27, 28, "G"), (32, 36.6, "D")]:
        ch = CHORDS[c]
        notes += [(s, e - s - 0.04, p, 100) for p in (ch["bass"] + 24, ch["v"][1] - 12, ch["v"][2] - 12)]
    # Horn swell under "ALL OF IT".
    notes += [(12.0, 3.95, p, 82) for p in (50, 57, 62)]
    return notes, ramp(12.0, 13.5, 60, 110) + [(16.0, 11, 100), (24.0, 11, 110)] + ramp(33.0, 36.4, 110, 50)


MOTIF = [(0.0, 0.75, 81), (0.75, 0.25, 78), (1.0, 0.5, 76), (1.5, 0.5, 81),
         (2.0, 0.75, 78), (2.75, 0.25, 74), (3.0, 0.5, 74), (3.5, 0.5, 71)]


def glock_part():
    notes = []
    for base, vel in [(PAYOFF, 84), (LIFT, 100)]:
        notes += [(base + o, d + 0.3, p, vel) for o, d, p in MOTIF]
    notes += [(32.0, 2.4, p, 92) for p in (86, 90, 93)]
    return notes


def strings_melody_part():
    """The motif sung by violins an octave down in the lift."""
    return [(LIFT + o, d, p - 12, 104) for o, d, p in MOTIF]


def pad_part():
    notes = []
    for s, e, c in PROGRESSION:
        if BREAK <= s < PAYOFF:
            continue
        notes += [(s, e - s, p - 12, 64) for p in CHORDS[c]["v"][:3]]
    return notes


# ---------------------------------------------------------------- synthesis
def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def lowpass(x, fc, order=2):
    return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x)


def highpass(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def hp2(x, fc):
    return highpass(x.T, fc).T


def place(buf, sample, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= len(buf) or i < 0:
        return
    if sample.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sample = np.stack([sample * l * 1.414, sample * r * 1.414], axis=1)
    n = min(len(sample), len(buf) - i)
    buf[i:i + n] += sample[:n] * gain


def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 48 + 120 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.13)
    click = highpass(rng.standard_normal(n), 3000) * env_exp(n, 0.003) * 0.3
    return np.tanh(1.7 * (body + click)) * 0.9


def snare():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    body = (np.sin(2 * np.pi * 185 * t) + 0.5 * np.sin(2 * np.pi * 330 * t)) * env_exp(n, 0.05)
    noise = bandpass(rng.standard_normal(n), 1800, 9000) * env_exp(n, 0.09)
    return np.tanh(0.45 * body + 0.7 * noise) * 0.75


def clap():
    n = int(0.35 * SR)
    noise = bandpass(rng.standard_normal(n), 900, 4200)
    e = np.zeros(n)
    for k, d in enumerate([0, 0.011, 0.022]):
        i = int(d * SR)
        e[i:] += env_exp(n - i, 0.006 if k < 2 else 0.12)
    return noise * e * 0.5


def hat(open_=False):
    n = int((0.28 if open_ else 0.05) * SR)
    return highpass(rng.standard_normal(n), 7500, 4) * env_exp(n, 0.09 if open_ else 0.012) * 0.2


def shaker():
    n = int(0.07 * SR)
    t = np.arange(n) / SR
    return bandpass(rng.standard_normal(n), 5000, 12000) * np.sin(np.pi * t / 0.07) ** 2 * 0.12


def tom(pitch_hz=110):
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = pitch_hz * (1 + 0.6 * np.exp(-t / 0.04))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.22)
    skin = lowpass(rng.standard_normal(n), 2500) * env_exp(n, 0.02) * 0.4
    return np.tanh(1.4 * (body + skin)) * 0.8


def crash(length=2.4):
    n = int(length * SR)
    noise = highpass(rng.standard_normal((n, 2)).T, 4500, 2).T
    return noise * env_exp(n, length / 4.5)[:, None] * 0.26


def impact(length=2.2):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = 36 + 64 * np.exp(-t / 0.08)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.55)
    hit = lowpass(rng.standard_normal(n), 1800) * env_exp(n, 0.05) * 0.6
    return np.tanh(1.3 * (boom + hit)) * 0.85


def riser(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    blocks = 40
    for b in range(blocks):
        a, z = b * n // blocks, (b + 1) * n // blocks
        fc = 400 * (12000 / 400) ** (b / blocks)
        seg = bandpass(noise[max(0, a - 2000):z], fc * 0.7, min(fc * 1.4, 20000))
        out[a:z] = seg[-(z - a):]
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / length) ** 2) / SR) * 0.12
    return (out * 0.5 + sweep) * (t / length) ** 2.2


def whoosh(length=0.35):
    n = int(length * SR)
    t = np.arange(n) / SR
    return bandpass(rng.standard_normal(n), 600, 6000) * np.sin(np.pi * t / length) ** 2 * 0.35


def shimmer(length=1.1, f_lo=1800, f_hi=5200):
    """Rising sparkle: sine partials gliding upward with tremolo."""
    n = int(length * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k, ratio in enumerate([1.0, 1.5, 2.0, 2.52, 3.0]):
        f = (f_lo + (f_hi - f_lo) * (t / length) ** 0.6) * ratio / 1.6
        out += np.sin(2 * np.pi * np.cumsum(f) / SR + k) * (0.6 ** k)
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * 14 * t)
    env = (1 - np.exp(-t / 0.02)) * np.exp(-t / (length * 0.45))
    return out * trem * env * 0.18


def tick():
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * 1800 * t) * env_exp(n, 0.012) * 0.22


def pluck_note(pitch, dur, vel):
    f0 = 440 * 2 ** ((pitch - 69) / 12)
    n = int((dur + 0.25) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for h in range(1, 14):
        if f0 * h > 16000:
            break
        out += np.sin(2 * np.pi * f0 * h * t + rng.uniform(0, 6.28)) / h * np.exp(-t * (7 + 10 * h))
    return out * (1 - np.exp(-t / 0.002)) * (vel / 127) * 0.3


def bass_note(pitch, dur, decay=0.35):
    f0 = 440 * 2 ** ((pitch - 69) / 12)
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f0 * t) + 0.45 * np.sin(4 * np.pi * f0 * t) + 0.15 * np.sin(6 * np.pi * f0 * t)
    e = (1 - np.exp(-t / 0.004)) * np.exp(-t / decay)
    rel = np.minimum(1, (n - np.arange(n)) / (0.015 * SR))
    return np.tanh(1.4 * y) * e * rel * 0.5


def reverb_ir(rt60=1.9, predelay=0.02):
    n = int(rt60 * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-6.9 * t / rt60)[:, None]
    ir = lowpass(ir.T, 6500).T
    ir[: int(predelay * SR)] = 0
    return ir / np.sqrt(np.sum(ir ** 2))


def reverb(x, ir, wet):
    out = np.zeros_like(x)
    for c in range(2):
        out[:, c] = fftconvolve(x[:, c], ir[:, c])[: len(x)]
    return x + out * wet


# ---------------------------------------------------------------- arrangement
def drum_bus():
    d = np.zeros((N, 2))
    kicks = []
    K, S, C, H, HO, SH = kick(), snare(), clap(), hat(), hat(True), shaker()

    def beat_index(t, start):
        return int(round((t - start) / 0.5)) % 4

    # Identities: cinematic pulse (kick 1 & 3 + push, clap 2 & 4, 16th shaker, tom on every cut).
    for t in frange(IDS, BREAK, 0.5):
        b = beat_index(t, IDS)
        if b in (0, 2):
            place(d, K, t, 1.0); kicks.append(t)
        if b == 1:
            place(d, K, t + 0.25, 0.6); kicks.append(t + 0.25)
        if b in (1, 3):
            place(d, C, t, 0.8, 0.05)
    for t in frange(IDS, BREAK, 0.125):
        place(d, SH, t, 0.9 if int(round(t * 8)) % 2 else 0.5, 0.3)
    for i, t in enumerate(CUTS):
        place(d, tom(98 + 6 * i), t, 0.75, -0.2 + 0.07 * i)

    # Payoff + lift: full groove.
    for a, b in [(PAYOFF, PROOF), (LIFT, OUTRO)]:
        for t in frange(a, b, 0.5):
            place(d, K, t, 1.0); kicks.append(t)
            if beat_index(t, a) in (1, 3):
                place(d, S, t, 0.9); place(d, C, t, 0.6, 0.1)
            place(d, HO, t + 0.25, 0.7, 0.25)
        for t in frange(a, b, 0.125):
            place(d, H, t, 0.35 if int(round(t * 8)) % 2 else 0.2, -0.25)
    for k, t in enumerate(frange(LIFT, OUTRO, 1.0)):
        place(d, tom(90 - 8 * k), t + 0.75, 0.5)

    # Proof: lighter groove, then a build into the lift.
    for t in frange(PROOF, 23.0, 0.5):
        b = beat_index(t, PROOF)
        if b in (0, 2):
            place(d, K, t, 0.9); kicks.append(t)
        if b in (1, 3):
            place(d, C, t, 0.7)
    for t in frange(PROOF, 23.0, 0.125):
        place(d, SH, t, 0.7 if int(round(t * 8)) % 2 else 0.4, 0.3)
    for t in FAC_CUTS:
        place(d, tom(120), t, 0.4)
    for k, t in enumerate(frange(23.0, 24.0, 0.0625)):
        place(d, S, t, 0.25 + 0.7 * k / 15)

    # Hook build into the drop.
    for k, t in enumerate(frange(3.0, 4.0, 0.125)):
        place(d, S, t, 0.2 + 0.6 * k / 7)
    for k in range(4):
        place(d, S, 10.5 + k * 0.125, 0.45 + 0.1 * k)

    # End card: half-time, then a fill into the final hit.
    for t in (28.0, 29.25, 29.5, 30.0, 31.0):
        place(d, K, t, 0.8); kicks.append(t)
    for t in (29.0, 31.0):
        place(d, C, t, 0.55)
    for t in frange(28, 32, 0.25):
        place(d, H, t, 0.2, 0.2)
    for k, t in enumerate(frange(31.5, 32.0, 0.0625)):
        place(d, S, t, 0.3 + 0.6 * k / 7)

    # Landings.
    for t, g in [(IDS, 1.0), (PAYOFF, 1.15), (LIFT, 1.2), (FINAL, 1.25)]:
        place(d, crash(), t, g)
        place(d, impact(), t, 0.85 * g)
        kicks.append(t)
    place(d, impact(), 0.0, 0.3)
    place(d, crash(1.8), PROOF, 0.5)
    place(d, crash(2.0), OUTRO, 0.55)
    return d, sorted(kicks)


def bass_bus():
    bass = np.zeros((N, 2))
    for a, b, octave in [(IDS, 10.75, False), (PAYOFF, PROOF, True), (PROOF, 23.0, False), (LIFT, OUTRO, True)]:
        for t in frange(a, b, 0.25):
            p = chord_at(t)["bass"] + (12 if octave and int(round(t * 4)) % 2 else 0)
            place(bass, bass_note(p, 0.24), t, 0.9)
    for s, e, c in [(28, 30, "Em7"), (30, 31, "G"), (31, 32, "A")]:
        place(bass, bass_note(CHORDS[c]["bass"], e - s - 0.04, decay=2.0), s, 0.7)
    place(bass, bass_note(38, 4.8, decay=2.2), FINAL, 1.0)
    place(bass, bass_note(33, 0.95, decay=0.8), 3.0, 0.6)  # pickup under the build
    return bass


def pluck_bus():
    pl = np.zeros((N, 2))
    pattern = [0, 1, 2, 3, 2, 1, 2, 3]
    for a, b, vel in [(PROOF, 23.0, 88), (LIFT, OUTRO, 96)]:
        for k, t in enumerate(frange(a, b, 0.125)):
            ch = sorted(chord_at(t)["v"])
            place(pl, pluck_note(ch[pattern[k % 8]] + 12, 0.1, vel * (1 if k % 4 == 0 else 0.72)), t, 1.0, 0.35 if k % 2 else -0.35)
    return pl


def fx_bus():
    fx = np.zeros((N, 2))
    place(fx, riser(1.4), 2.6, 1.1)
    place(fx, riser(1.0), BREAK, 1.0)
    place(fx, crash(1.0)[::-1] * 1.4, BREAK, 1.0)          # reverse cymbal into "ALL OF IT"
    place(fx, riser(2.5), 21.5, 0.9)
    place(fx, crash(1.0)[::-1] * 1.0, 23.0, 0.8)
    place(fx, riser(1.5), 30.5, 0.6)
    return fx


def sfx_bus():
    sfx = np.zeros((N, 2))
    place(sfx, whoosh(0.4), 0.0, 0.3)
    place(sfx, reverb(np.stack([shimmer()] * 2, axis=1), reverb_ir(2.2), 0.8), 1.45, 0.9)       # "A UNIVERSE"
    place(sfx, reverb(np.stack([shimmer(1.3, 2400, 7000)] * 2, axis=1), reverb_ir(2.2), 0.8), 2.15, 1.0)  # "OF POSSIBILITIES"
    for t in CUTS[1:]:
        place(sfx, whoosh(0.3), t - 0.15, 0.45)
    for t in CUTS:
        place(sfx, tick(), t + 0.04, 0.5)
    for t in FAC_CUTS:
        place(sfx, whoosh(0.3), t - 0.15, 0.35)
        place(sfx, tick(), t, 0.45)
    place(sfx, whoosh(0.5), PROOF - 0.25, 0.45)
    place(sfx, whoosh(0.5), OUTRO - 0.25, 0.45)
    return sfx


def sidechain(kicks, depth=0.5, tau=0.11):
    env = np.zeros(N)
    for k in kicks:
        i = int(k * SR)
        n = min(N - i, int(0.5 * SR))
        if n > 0:
            env[i:i + n] = np.maximum(env[i:i + n], np.exp(-np.arange(n) / (tau * SR)))
    return (1 - depth * env)[:, None]


def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    tmp = tempfile.mkdtemp()

    def stem(name, program, notes, ccs=(), gain=0.5):
        mp, wp = os.path.join(tmp, name + ".mid"), os.path.join(tmp, name + ".wav")
        write_midi(mp, program, notes, ccs)
        return render_midi(mp, wp, gain)

    piano = stem("piano", 0, piano_part(), gain=0.5)
    pizz = stem("pizz", 45, pizz_part(), gain=0.6)
    s_notes, s_ccs = strings_part()
    strings = stem("strings", 48, s_notes, s_ccs, gain=0.45)
    melody = stem("violins", 40, strings_melody_part(), gain=0.4)
    celesta = stem("celesta", 8, celesta_part(), gain=0.55)
    c_notes, c_ccs = choir_part()
    choir = stem("choir", 53, c_notes, c_ccs, gain=0.42)
    h_notes, h_ccs = horns_part()
    horns = stem("horns", 60, h_notes, h_ccs, gain=0.45)
    glock = stem("glock", 9, glock_part(), gain=0.45)
    pad = stem("pad", 89, pad_part(), gain=0.32)

    drums, kicks = drum_bus()
    duck = sidechain(kicks)
    bass = bass_bus() * duck
    plucks = pluck_bus() * sidechain(kicks, 0.3)
    fx, sfx = fx_bus(), sfx_bus()

    hall, room, space = reverb_ir(2.2), reverb_ir(1.1, 0.03), reverb_ir(2.8, 0.03)
    piano = hp2(reverb(piano, hall, 0.35), 120)
    pizz = hp2(reverb(pizz, room, 0.35), 90) * sidechain(kicks, 0.25)
    strings = hp2(reverb(strings, hall, 0.45), 90) * sidechain(kicks, 0.25)
    melody = hp2(reverb(melody, hall, 0.5), 150)
    celesta = reverb(celesta, space, 0.7)
    choir = hp2(reverb(choir, space, 0.6), 200)
    horns = hp2(reverb(horns, hall, 0.45), 70)
    glock = reverb(glock, hall, 0.55)
    pad = hp2(reverb(pad, hall, 0.5), 160) * duck
    plucks = reverb(plucks, room, 0.3)
    drums = drums + reverb(drums * 0.12, reverb_ir(0.9), 1.0) - drums * 0.12

    # The hook carries weight on its own; lift its melodic layers.
    t = np.arange(N) / SR
    hook = (1 + 1.4 * np.clip((3.6 - t) / 0.4, 0, 1))[:, None]
    piano, strings, pad = piano * hook, strings * hook, pad * hook

    mix = (piano * 0.9 + pizz * 1.0 + strings * 1.25 + melody * 0.9 + celesta * 1.7 + choir * 1.25
           + horns * 1.1 + glock * 0.85 + pad * 0.55 + plucks * 0.8 + bass * 0.75 + drums * 0.78 + fx * 0.7)
    mix = hp2(mix, 32)
    mix = mix - 0.3 * lowpass(mix.T, 110).T  # gentle low shelf: phones can't use the sub anyway

    # Break (11-12): hard stop, keep reverb tails, pickups and the riser.
    gate = np.ones(N)
    gate[(t >= BREAK + 0.02) & (t < PAYOFF)] = 0.0
    gate = np.convolve(gate, np.ones(400) / 400, mode="same")
    keep = piano * 0.9 + strings * 1.25 + fx * 0.7
    mix = mix * gate[:, None] + keep * (1 - gate[:, None])

    fade = np.clip((LENGTH - t) / 1.5, 0, 1)[:, None]
    mix, sfx = mix * fade, sfx * fade
    mix = np.tanh(mix * 1.1) / 1.1
    mix /= np.max(np.abs(mix)) / 0.89
    sfx /= max(np.max(np.abs(sfx)), 1e-9) / 0.5
    sf.write(os.path.join(out_dir, "music.wav"), mix.astype(np.float32), SR, subtype="PCM_24")
    sf.write(os.path.join(out_dir, "sfx.wav"), sfx.astype(np.float32), SR, subtype="PCM_24")
    print("wrote", out_dir)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
