"""Generate the reel's full voiceover with Kokoro-82M (Apache-2.0), one file per line.

Voice: hf_alpha (Kokoro's Indian female voice) reading English. Each line is trimmed of
leading/trailing silence and written to <out_dir>/<id>.wav (24 kHz mono), plus
vo_lines.json with durations and Whisper word timings for syncing on-screen text.

Usage:
    python make_vo.py <out_dir> [line_id ...]
Requires: kokoro>=0.9.4, espeak-ng, faster-whisper (for the timing check).
"""

import json
import os
import sys

import numpy as np
import soundfile as sf

VOICE = "hf_alpha"
SR = 24000

# id, text as spoken (spelled for the TTS), speed
LINES = [
    ("hook", "Every child holds a universe of possibilities.", 1.0),
    ("id_explorer", "An explorer.", 1.05),
    ("id_artist", "An artist.", 1.05),
    ("id_scientist", "A scientist.", 1.05),
    ("id_innovator", "An innovator.", 1.1),
    ("id_athlete", "An athlete.", 1.05),
    ("id_performer", "A performer.", 1.05),
    ("id_leader", "A leader.", 1.0),
    ("get_to_be", "Here, they get to be...", 1.2),
    ("all_of_it", "all of it!", 0.95),
    ("attention", "With individual attention for every child.", 1.0),
    ("cbse", "C B S E, since twenty thirteen.", 1.05),
    ("stages", "Nursery to Grade ten.", 1.0),
    ("facilities", "World-class labs, library, and sports.", 1.05),
    ("start", "Give your child the start they deserve.", 0.97),
    ("cta", "Book your campus visit today.", 0.97),
    ("name", "R N S International School.", 0.95),
    ("tagline", "Educating minds. Enriching values.", 0.95),
]


def trim(y, thresh_db=-42, pad=0.03):
    win = int(0.01 * SR)
    rms = np.sqrt(np.convolve(y ** 2, np.ones(win) / win, mode="same")) + 1e-9
    on = np.where(20 * np.log10(rms / rms.max()) > thresh_db)[0]
    a = max(0, on[0] - int(pad * SR))
    b = min(len(y), on[-1] + int(pad * SR))
    return y[a:b]


def main(out_dir, only=()):
    from kokoro import KPipeline
    from faster_whisper import WhisperModel

    os.makedirs(out_dir, exist_ok=True)
    pipe = KPipeline(lang_code="a")
    whisper = WhisperModel("small", device="cpu", compute_type="int8")
    manifest_path = os.path.join(out_dir, "vo_lines.json")
    manifest = []
    if only and os.path.exists(manifest_path):
        with open(manifest_path) as f:
            manifest = [m for m in json.load(f) if m["id"] not in only]
    for line_id, text, speed in LINES:
        if only and line_id not in only:
            continue
        audio = np.concatenate([r.audio.numpy() for r in pipe(text, voice=VOICE, speed=speed)])
        audio = trim(audio)
        path = os.path.join(out_dir, f"{line_id}.wav")
        sf.write(path, audio, SR)
        segs, _ = whisper.transcribe(path, word_timestamps=True, language="en")
        words = [(w.word.strip(), round(w.start, 2), round(w.end, 2)) for s in segs for w in s.words]
        manifest.append({"id": line_id, "text": text, "duration": round(len(audio) / SR, 3), "words": words})
        print(f"{line_id:13s} {len(audio) / SR:5.2f}s  {' '.join(w for w, _, _ in words)}")
    order = [line_id for line_id, _, _ in LINES]
    manifest.sort(key=lambda m: order.index(m["id"]))
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=1)


if __name__ == "__main__":
    # make_vo.py <out_dir> [line_id ...]   (line ids regenerate just those lines)
    main(sys.argv[1] if len(sys.argv) > 1 else "vo", tuple(sys.argv[2:]))
