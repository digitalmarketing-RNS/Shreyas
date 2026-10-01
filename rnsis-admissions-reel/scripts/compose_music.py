"""Compose the original 31s music bed for the RNSIS Admissions 2027-28 reel.

120 BPM, D major. Every section boundary sits on an edit point of the reel
(see src/timeline.ts), so cuts, text pops and musical hits line up exactly.

Melodic/harmonic parts are written as MIDI and rendered with FluidSynth using
the MuseScore General soundfont (MIT licence). Drums, bass, plucks, risers and
impacts are synthesised here, so the whole track is original and safe to use in
paid social ads.

Usage:
    python compose_music.py <out_dir>
Writes music.wav (full mix, no VO) and sfx.wav (whooshes/ticks on cuts).
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
LENGTH = 31.5
N = int(SR * LENGTH)
SOUNDFONT = "/usr/share/sounds/sf2/MuseScore_General_Full.sf2"
rng = np.random.default_rng(2027)

# ---------------------------------------------------------------- harmony
# Close voicings around D4 for smooth voice leading.
CHORDS = {
    "Dadd9": dict(piano=[62, 66, 69, 76], bass=38),
    "D": dict(piano=[62, 66, 69, 74], bass=38),
    "A": dict(piano=[61, 64, 69, 73], bass=33),
    "Asus4": dict(piano=[62, 64, 69, 74], bass=33),
    "Bm": dict(piano=[62, 66, 71, 74], bass=35),
    "G": dict(piano=[62, 67, 71, 74], bass=31),
    "Em": dict(piano=[64, 67, 71, 76], bass=40),
}

# (start, end, chord) in seconds
PROGRESSION = [
    (0, 2, "Dadd9"), (2, 3, "A"),                                   # hook
    (3, 5, "D"), (5, 7, "A"), (7, 9, "Bm"), (9, 10, "G"),           # identities
    (10, 11, "A"),                                                   # break
    (11, 12, "D"), (12, 13, "A"), (13, 14, "Bm"), (14, 15, "G"),     # ALL OF IT
    (15, 17, "D"), (17, 19, "A"), (19, 20, "G"), (20, 20.5, "Asus4"), (20.5, 21, "A"),  # proof
    (21, 22, "D"), (22, 23, "A"), (23, 24, "Bm"), (24, 25, "G"),     # admissions open
    (25, 27, "Em"), (27, 29, "A"), (29, 31.5, "D"),                  # end card
]


def chord_at(t):
    for s, e, c in PROGRESSION:
        if s <= t < e:
            return CHORDS[c]
    return CHORDS["D"]


def section(t):
    if t < 2:
        return "intro"
    if t < 3:
        return "build"
    if t < 10:
        return "groove"
    if t < 11:
        return "break"
    if t < 15:
        return "chorus"
    if t < 21:
        return "proof"
    if t < 25:
        return "lift"
    if t < 29:
        return "outro"
    return "final"


# ---------------------------------------------------------------- MIDI parts
TPB = 480


def sec_to_tick(t):
    return int(round(t * 2 * TPB))  # 120 BPM -> 2 beats per second


def write_midi(path, program, notes, ccs=(), channel=0):
    """notes: (start, dur, pitch, vel); ccs: (time, cc, value)."""
    events = []
    for s, d, p, v in notes:
        events.append((sec_to_tick(s), 1, mido.Message("note_on", note=p, velocity=int(v), channel=channel)))
        events.append((sec_to_tick(s + d), 0, mido.Message("note_off", note=p, velocity=0, channel=channel)))
    for t, cc, val in ccs:
        events.append((sec_to_tick(t), 0, mido.Message("control_change", control=cc, value=int(val), channel=channel)))
    events.sort(key=lambda e: (e[0], e[1]))
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=500000, time=0))
    tr.append(mido.Message("program_change", program=program, channel=channel, time=0))
    tr.append(mido.Message("control_change", control=7, value=110, channel=channel, time=0))
    last = 0
    for tick, _, msg in events:
        msg.time = tick - last
        last = tick
        tr.append(msg)
    mid.save(path)


def render_midi(mid_path, wav_path, gain=0.5):
    subprocess.run(
        ["fluidsynth", "-ni", "-g", str(gain), "-R", "0", "-C", "0", "-r", str(SR),
         "-F", wav_path, SOUNDFONT, mid_path],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    y, sr = sf.read(wav_path, always_2d=True)
    assert sr == SR
    out = np.zeros((N, 2))
    n = min(N, len(y))
    out[:n] = y[:n]
    return out


def piano_part():
    notes = []
    # Intro ("a universe of possibilities"): soft open Dadd9 under the celesta twinkles,
    # then the A chord swells into the drop.
    notes += [(0.0, 1.95, p, 60) for p in (50, 57, 64, 66, 69)]
    notes += [(2.0, 0.9, p, 62) for p in CHORDS["A"]["piano"]]
    # Grooves: 3-3-2 stabs per 2s, chord taken from the progression.
    for start, end, vel in [(3, 10, 74), (11, 15, 84), (15, 21, 72), (21, 25, 90)]:
        t = start
        while t < end - 1e-6:
            for off in (0, 0.75, 1.5):
                ht = t + off
                if ht < end - 1e-6:
                    for p in chord_at(ht)["piano"]:
                        notes.append((ht, 0.42, p, vel))
                    notes.append((ht, 0.42, chord_at(ht)["piano"][0] - 12, vel - 10))
            t += 2
    # Break pickup notes leading into the slam.
    notes += [(10.5, 0.24, 69, 70), (10.75, 0.24, 73, 76)]
    # Outro: sustained chords under the tagline.
    for s, e, c in [(25, 27, "Em"), (27, 29, "A")]:
        for p in CHORDS[c]["piano"]:
            notes.append((s, e - s - 0.05, p, 64))
        notes.append((s, e - s - 0.05, CHORDS[c]["piano"][0] - 12, 60))
    # Final hit.
    for p in [50, 62, 66, 69, 74, 78]:
        notes.append((29.0, 2.4, p, 96))
    return notes


def strings_part():
    notes, ccs = [], []
    spans = [(0, 2, "Dadd9", 40), (2, 3, "A", 70), (3, 5, "D", 70), (5, 7, "A", 72), (7, 9, "Bm", 75), (9, 10, "G", 78),
             (11, 12, "D", 92), (12, 13, "A", 92), (13, 14, "Bm", 94), (14, 15, "G", 96),
             (15, 17, "D", 74), (17, 19, "A", 76), (19, 20, "G", 82), (20, 21, "A", 90),
             (21, 22, "D", 104), (22, 23, "A", 104), (23, 24, "Bm", 106), (24, 25, "G", 108),
             (25, 27, "Em", 82), (27, 29, "A", 86), (29, 31.3, "D", 110)]
    for s, e, c, v in spans:
        ch = CHORDS[c]
        voicing = [ch["bass"] + 12, ch["piano"][0] - 12, ch["piano"][2] - 12] + ch["piano"][1:3]
        if section(s) in ("lift", "final"):
            voicing += [ch["piano"][-1] + 12]
        for p in voicing:
            notes.append((s, e - s, p, v))
    # Expression swells: build before drops, dip in the break.
    for t, val in [(0, 55), (2.0, 70), (2.9, 120), (3.0, 95), (9.5, 110), (10.0, 30), (10.9, 115),
                   (11.0, 120), (15.0, 95), (19.0, 100), (20.9, 127), (21, 127), (25, 100), (29, 127)]:
        ccs.append((t, 11, val))
    # Fine-grained ramps for the build sections.
    for a, b, v0, v1 in [(2.0, 2.95, 70, 125), (10.0, 10.95, 30, 120), (19.0, 20.95, 95, 127)]:
        for k in range(12):
            ccs.append((a + (b - a) * k / 11, 11, v0 + (v1 - v0) * k / 11))
    return notes, ccs


def pad_part():
    notes = []
    for s, e, c in PROGRESSION:
        if section(s) == "break":
            continue
        for p in CHORDS[c]["piano"][:3]:
            notes.append((s, e - s, p - 12, 70))
    return notes


def celesta_part():
    """Twinkling 16th-note celesta arpeggio across the hook (0-3 s)."""
    notes = []
    d_arp = [74, 78, 81, 88, 86, 81, 78, 83]   # D F# A E A F# B: Dadd9/6 shimmer
    a_arp = [73, 76, 81, 85, 83, 81, 76, 71]
    k = 0
    t = 0.0
    while t < 2.94:
        arp = d_arp if t < 2.0 else a_arp
        vel = 62 + 30 * (t / 3.0) + (10 if k % 4 == 0 else 0)
        notes.append((t, 0.5, arp[k % 8], min(vel, 110)))
        k += 1
        t += 0.125
    return notes


def choir_part():
    """Airy 'oohs' that open up the space under the hook."""
    notes = [(0.0, 2.0, p, 72) for p in (62, 66, 69, 76)]
    notes += [(2.0, 0.95, p, 82) for p in (61, 64, 69, 71)]
    ccs = [(0.0, 11, 40), (0.6, 11, 90), (1.6, 11, 100), (2.0, 11, 95), (2.9, 11, 127)]
    return notes, ccs


def bells_part():
    motif = [(0.0, 0.75, 81), (0.75, 0.25, 78), (1.0, 0.5, 76), (1.5, 0.5, 81),
             (2.0, 0.75, 78), (2.75, 0.25, 74), (3.0, 0.5, 74), (3.5, 0.5, 71)]
    notes = []
    for base, vel in [(11.0, 92), (21.0, 104)]:
        for off, d, p in motif:
            notes.append((base + off, d + 0.3, p, vel))
            if base == 21.0:
                notes.append((base + off, d + 0.3, p + 12, vel - 30))
    notes += [(29.0, 2.0, 86, 100), (29.0, 2.0, 90, 80), (29.0, 2.0, 93, 80)]
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


def place(buf, sample, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= len(buf):
        return
    if sample.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sample = np.stack([sample * l * 1.414, sample * r * 1.414], axis=1)
    n = min(len(sample), len(buf) - i)
    buf[i:i + n] += sample[:n] * gain


def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 46 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env_exp(n, 0.12)
    click = highpass(rng.standard_normal(n), 2500) * env_exp(n, 0.004) * 0.25
    return np.tanh(1.6 * (body + click)) * 0.9


def clap():
    n = int(0.35 * SR)
    noise = bandpass(rng.standard_normal(n), 900, 4200)
    e = np.zeros(n)
    for k, d in enumerate([0, 0.011, 0.022]):
        i = int(d * SR)
        e[i:] += env_exp(n - i, 0.006 if k < 2 else 0.11)
    return noise * e * 0.55


def snare():
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 190 * t) * env_exp(n, 0.04)
    noise = bandpass(rng.standard_normal(n), 1500, 8000) * env_exp(n, 0.07)
    return (0.5 * tone + 0.6 * noise) * 0.7


def hat(open_=False):
    n = int((0.28 if open_ else 0.06) * SR)
    noise = highpass(rng.standard_normal(n), 7500, 4)
    return noise * env_exp(n, 0.09 if open_ else 0.014) * 0.22


def crash(length=2.4):
    n = int(length * SR)
    noise = highpass(rng.standard_normal((n, 2)).T, 4500, 2).T
    return noise * env_exp(n, length / 4.5)[:, None] * 0.28


def impact():
    n = int(2.0 * SR)
    t = np.arange(n) / SR
    f = 38 + 60 * np.exp(-t / 0.08)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.5)
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
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / length) ** 2) / SR) * 0.15
    return (out * 0.5 + sweep) * (t / length) ** 2.2


def whoosh(length=0.35):
    n = int(length * SR)
    t = np.arange(n) / SR
    noise = bandpass(rng.standard_normal(n), 600, 6000)
    shape = np.sin(np.pi * t / length) ** 2
    return noise * shape * 0.35


def shimmer(length=1.1, f_lo=1800, f_hi=5200):
    """Rising sparkle: detuned sine partials gliding upward with tremolo."""
    n = int(length * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k, ratio in enumerate([1.0, 1.5, 2.0, 2.52, 3.0]):
        f = (f_lo + (f_hi - f_lo) * (t / length) ** 0.6) * ratio / 1.6
        ph = 2 * np.pi * np.cumsum(f) / SR + k
        out += np.sin(ph) * (0.6 ** k)
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * 14 * t)
    env = (1 - np.exp(-t / 0.02)) * np.exp(-t / (length * 0.45))
    return out * trem * env * 0.18


def tick():
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * 1800 * t) * env_exp(n, 0.012) * 0.25


def pluck_note(pitch, dur, vel):
    f0 = 440 * 2 ** ((pitch - 69) / 12)
    n = int((dur + 0.25) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for h in range(1, 14):
        if f0 * h > 16000:
            break
        out += np.sin(2 * np.pi * f0 * h * t + rng.uniform(0, 6.28)) / h * np.exp(-t * (6 + 9 * h))
    out *= (1 - np.exp(-t / 0.002))
    return out * (vel / 127) * 0.32


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


# ---------------------------------------------------------------- arrange
def drum_bus():
    drums = np.zeros((N, 2))
    kicks = []
    K, C, S, H, HO = kick(), clap(), snare(), hat(), hat(True)

    def groove(a, b, density):
        t = a
        while t < b - 1e-6:
            place(drums, K, t, 1.0)
            kicks.append(t)
            beat_in_bar = int(round((t - 3) / 0.5)) % 4
            if beat_in_bar in (1, 3):
                place(drums, C, t, 0.9, 0.05)
            place(drums, HO if density >= 2 else H, t + 0.25, 0.8, 0.25)
            if density >= 1:
                place(drums, H, t + 0.125, 0.45, -0.25)
                place(drums, H, t + 0.375, 0.45, -0.25)
            t += 0.5

    groove(3, 10, 1)
    groove(11, 15, 2)
    groove(15, 21, 1)
    groove(21, 25, 2)
    # Half-time outro under the tagline.
    for t in (25.0, 26.0, 26.75, 27.0, 28.0, 28.5):
        place(drums, K, t, 0.85)
        kicks.append(t)
    for t in (25.5, 26.5, 27.5, 28.5):
        place(drums, C, t, 0.6)
    for k in range(32):
        place(drums, H, 25 + k * 0.125, 0.25 if k % 2 else 0.35, 0.2)
    # Intro ticking hats.
    for k in range(16):
        place(drums, H, k * 0.125, 0.1 + 0.06 * (k % 4 == 0), 0.3)
    # Snare builds.
    for k in range(8):
        place(drums, S, 2.0 + k * 0.125, 0.5 + 0.7 * k / 7)
    for k in range(4):
        place(drums, S, 9.5 + k * 0.125, 0.5 + 0.1 * k)
    for k in range(16):
        place(drums, S, 20.0 + k * 0.0625, 0.25 + 0.65 * k / 15)
    # Downbeat crashes + impacts on every big landing.
    for t, g in [(3.0, 1.0), (11.0, 1.15), (21.0, 1.2), (29.0, 1.2)]:
        place(drums, crash(), t, g)
        place(drums, impact(), t, 0.9 * g)
        kicks.append(t)
    place(drums, impact(), 0.0, 0.35)
    place(drums, crash(1.6), 15.0, 0.6)
    place(drums, crash(2.0), 25.0, 0.6)
    return drums, sorted(kicks)


def fx_bus():
    fx = np.zeros((N, 2))
    place(fx, riser(1.2), 1.8, 1.3)
    place(fx, riser(1.0), 10.0, 1.0)
    place(fx, riser(2.0), 19.0, 0.9)
    rc = crash(1.0)[::-1] * 1.4  # reverse cymbal into the slam
    place(fx, rc, 10.0, 1.0)
    return fx


def sfx_bus():
    sfx = np.zeros((N, 2))
    for t in (4, 5, 6, 7, 8, 9):
        place(sfx, whoosh(0.3), t - 0.15, 0.55)
    for t in (3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0):
        place(sfx, tick(), t + 0.05, 0.6)
    for t in (19.0, 19.5, 20.0, 20.5):
        place(sfx, tick(), t, 0.5)
        place(sfx, whoosh(0.25), t - 0.12, 0.35)
    # Hook words: "Every child holds" / "A UNIVERSE" / "OF POSSIBILITIES".
    place(sfx, whoosh(0.4), 0.0, 0.35)
    place(sfx, reverb(np.stack([shimmer()] * 2, axis=1), reverb_ir(2.2), 0.8), 0.48, 0.9)
    place(sfx, reverb(np.stack([shimmer(1.3, 2400, 7000)] * 2, axis=1), reverb_ir(2.2), 0.8), 1.48, 1.0)
    place(sfx, whoosh(0.5), 14.75, 0.5)
    place(sfx, whoosh(0.5), 24.75, 0.5)
    return sfx


def bass_bus():
    bass = np.zeros((N, 2))
    for a, b, octave_jump in [(3, 9.5, False), (11, 15, True), (15, 20, False), (21, 25, True)]:
        t = a
        while t < b - 1e-6:
            p = chord_at(t)["bass"]
            if octave_jump and int(round(t / 0.25)) % 2 == 1:
                p += 12
            place(bass, bass_note(p, 0.24), t, 0.9)
            t += 0.25
    for s, e, c in [(25, 27, "Em"), (27, 29, "A")]:
        place(bass, bass_note(CHORDS[c]["bass"], e - s - 0.05, decay=2.5), s, 0.7)
    place(bass, bass_note(38, 2.3, decay=1.5), 29.0, 1.0)
    return bass


def pluck_bus():
    pl = np.zeros((N, 2))
    pattern = [0, 1, 2, 3, 2, 1, 2, 3]
    for a, b, vel in [(3, 10, 92), (11, 15, 100), (15, 21, 86), (21, 25, 108), (25, 29, 60)]:
        k = 0
        t = a
        while t < b - 1e-6:
            ch = sorted(chord_at(t)["piano"])
            p = ch[pattern[k % 8]] + 12
            accent = 1.0 if k % 4 == 0 else 0.75
            place(pl, pluck_note(p, 0.12, vel * accent), t, 1.0, 0.35 if k % 2 else -0.35)
            k += 1
            t += 0.125
    return pl


def sidechain(kicks, depth=0.55, tau=0.11):
    t = np.arange(N) / SR
    env = np.zeros(N)
    for k in kicks:
        i = int(k * SR)
        n = min(N - i, int(0.5 * SR))
        env[i:i + n] = np.maximum(env[i:i + n], np.exp(-np.arange(n) / (tau * SR)))
    return (1 - depth * env)[:, None]


def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    tmp = tempfile.mkdtemp()

    def midi_stem(name, program, notes, ccs=(), gain=0.5):
        mp, wp = os.path.join(tmp, name + ".mid"), os.path.join(tmp, name + ".wav")
        write_midi(mp, program, notes, ccs)
        return render_midi(mp, wp, gain)

    piano = midi_stem("piano", 0, piano_part(), gain=0.55)
    s_notes, s_ccs = strings_part()
    strings = midi_stem("strings", 48, s_notes, s_ccs, gain=0.45)
    pad = midi_stem("pad", 89, pad_part(), gain=0.35)
    bells = midi_stem("bells", 9, bells_part(), gain=0.5)
    celesta = midi_stem("celesta", 8, celesta_part(), gain=0.55)
    c_notes, c_ccs = choir_part()
    choir = midi_stem("choir", 53, c_notes, c_ccs, gain=0.45)

    drums, kicks = drum_bus()
    duck = sidechain(kicks)
    bass = bass_bus() * duck
    plucks = pluck_bus() * sidechain(kicks, 0.35)
    fx = fx_bus()
    sfx = sfx_bus()

    # Lift the hook section so the first seconds carry as much weight as the drop.
    tt = np.arange(N) / SR
    intro = (1 + 1.6 * np.clip((2.4 - tt) / 0.4, 0, 1))[:, None]
    piano, strings, pad, bells = piano * intro, strings * intro, pad * intro, bells * intro

    ir = reverb_ir()
    piano = reverb(piano, ir, 0.35)
    strings = reverb(strings, ir, 0.45) * sidechain(kicks, 0.3)
    pad = reverb(pad, ir, 0.5) * duck
    bells = reverb(bells, ir, 0.55)
    space = reverb_ir(2.8, 0.03)  # big, airy room for the "universe" intro
    celesta = reverb(celesta, space, 0.7)
    choir = highpass(reverb(choir, space, 0.6).T, 200).T
    plucks = reverb(plucks, reverb_ir(1.2, 0.03), 0.3)
    drums = drums + reverb(drums * 0.12, reverb_ir(0.9), 1.0) - drums * 0.12

    # Keep the sub region for kick/bass only; phones can't reproduce it anyway.
    pad = highpass(pad.T, 150).T
    strings = highpass(strings.T, 90).T
    piano = highpass(piano.T, 80).T
    mix = (
        piano * 1.15 + strings * 1.3 + pad * 0.55 + bells * 0.9 + plucks * 0.95
        + celesta * 1.7 + choir * 1.3
        + bass * 0.7 + drums * 0.72 + fx * 0.7
    )
    mix = highpass(mix.T, 32).T
    lows = lowpass(mix.T, 110).T
    mix = mix - 0.35 * lows  # ~-3.7 dB low shelf
    # Hard stop for the break (10.0-11.0) except reverb tails, riser and pickups.
    t = np.arange(N) / SR
    gate = np.ones(N)
    gate[(t >= 10.02) & (t < 11.0)] = 0.0
    gate = np.convolve(gate, np.ones(400) / 400, mode="same")
    break_keep = piano * 0.9 + strings * 1.1 + fx * 0.6
    mix = mix * gate[:, None] + break_keep * (1 - gate[:, None])
    # Tail fade.
    fade = np.clip((LENGTH - t) / 1.2, 0, 1)
    mix *= fade[:, None]
    sfx *= fade[:, None]

    mix = np.tanh(mix * 1.1) / 1.1
    mix /= np.max(np.abs(mix)) / 0.89
    sfx /= max(np.max(np.abs(sfx)), 1e-9) / 0.5
    sf.write(os.path.join(out_dir, "music.wav"), mix.astype(np.float32), SR, subtype="PCM_24")
    sf.write(os.path.join(out_dir, "sfx.wav"), sfx.astype(np.float32), SR, subtype="PCM_24")
    print("wrote", out_dir)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
