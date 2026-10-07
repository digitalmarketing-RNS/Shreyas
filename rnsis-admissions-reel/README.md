# RNS International School: "Admissions Open 2027–28" Instagram Reel ad

A 37.5-second 9:16 reel ad (1080×1920, 30 fps). It is cut from the school's 4K brand film "Rnsis Film v3", with a voiceover that runs the whole length and an original score written for this edit.

| File | Use |
|---|---|
| `out/RNSIS-Admissions-2027-28-Reel.mp4` | Main cut: full voiceover, music and SFX |
| `out/RNSIS-Admissions-2027-28-Reel-music-only.mp4` | The same edit with music and SFX only, for an A/B test or for adding a new voiceover later |
| `out/RNSIS-Admissions-2027-28-cover.jpg` | Reel cover frame ("Every child holds A UNIVERSE OF POSSIBILITIES") |

Specs: 1080×1920, 30 fps, H.264 High (yuv420p, BT.709), AAC 48 kHz 320 kbps, mastered to −14 LUFS.

## Creative idea: "Every child holds a universe of possibilities."

Parents don't buy a building; they buy who their child will become. The hook opens that universe, the montage names seven of those possibilities in the school's own footage, and the payoff claims that RNS International School is where kids get to be all of it. The edit is cut to a 120 BPM beat, so every cut and text pop lands on the music.

| Time | Picture | On-screen copy | Voiceover | Music |
|---|---|---|---|---|
| 0–4 s | Little boy waving, nursery girl (smooth slow motion), scouts laughing, with a twinkling star field | Every child holds / **A UNIVERSE** / **OF POSSIBILITIES** | "Every child holds a universe of possibilities." | Celesta twinkles, choir, shimmer on each phrase, build |
| 4–11 s | 7 one-second cuts: abacus, painting, lab, circuits, high jump, band, scouts | An EXPLORER · An ARTIST · A SCIENTIST · An INNOVATOR · An ATHLETE · A PERFORMER · A LEADER (dots fill 1→7) | Each word on its cut | Drop: pizzicato-string pulse, drums, a tom on every cut |
| 11–12 s | Brand-blue card | At RNS International School, *they get to be…* | "Here, they get to be…" | Music stops, riser |
| 12–16 s | Group of students in every uniform (lab coat, karate, scouts, sports) | ALL OF **IT.** / With individual attention for every child. | "…all of it! With individual attention for every child." | Slam, full groove, horn swell, glockenspiel motif |
| 16–18 s | Drone over campus | CBSE AFFILIATED · Since 2013 · RR Nagar, Bengaluru | "CBSE, since 2013." | Lighter groove |
| 18–20 s | Nursery girl → high-schooler | ONE CAMPUS · EVERY STAGE / NURSERY TO GRADE 10 | "Nursery to Grade 10." | |
| 20–24 s | 4 one-second flashes | SCIENCE LABS · LIBRARY · COMPUTER LAB · SPORTS | "World-class labs, library, and sports." | Snare/riser build |
| 24–28 s | Kids stepping off the school bus, school front | ADMISSIONS **OPEN 2027–28** / Give your child the start they deserve. | "Give your child the start they deserve." (admissions year is on screen only) | Biggest lift: horns, choir, string octaves |
| 28–37.5 s | End card: crest, offer, CTA, phone, website, tagline | BOOK A CAMPUS VISIT · 99004 55135 · rnsischool.edu.in · *Educating Minds. Enriching Values.* (pops in with the VO) | "Book your campus visit today." … "RNS International School." on the final hit … "Educating minds, enriching values." | Calm cadence, final hit at 32 s, chord holds under the tagline and fades |

An "ADMISSIONS OPEN · 2027–28" badge stays on screen through the montage, so anyone who scrolls away early still sees the offer. All key copy sits inside the Reels safe area (y 290–1250 px); only the decorative tagline sits lower. The ad works with the sound off.

## Suggested ad copy (Meta Ads Manager)

- **Primary text:** Every child holds a universe of possibilities. ✨ Explorer, artist, scientist, athlete, leader: at RNS International School, RR Nagar, they get to be all of it, with labs, a library, sports and an auditorium on one campus. CBSE · Nursery to Grade 10 · Since 2013. Admissions for 2027–28 are now open. Book a campus visit today. 📞 99004 55135
- **Headline:** Admissions Open 2027–28 | Nursery to Grade 10
- **Description:** CBSE school in RR Nagar, Bengaluru
- **CTA button:** Book Now (or Learn More → rnsischool.edu.in/admission-procedure.php)
- **Targeting idea:** parents aged 25–45 within 8–10 km of Channasandra / RR Nagar / Kengeri / Rajarajeshwari Nagar, with interests in parenting, CBSE, and schools

## What's original vs. reused

- **Footage:** RNSIS brand film "Rnsis Film v3 .mp4" (4K, Google Drive folder "RNSIS FINAL"), reframed to 9:16 shot by shot. The film's grade looks the most cinematic of the shoots on Drive. The "RNSIS Commercial Video (Clips only)" and "Demo" files were reviewed too, but they're ungraded 1080p, so they weren't used, to keep the look consistent.
- **Music:** composed for this ad in `scripts/compose_music.py`, written as a bed for continuous voiceover. Piano, pizzicato and sustained strings, violins, French horns, choir, celesta, glockenspiel and pad are rendered with the MuseScore General soundfont (MIT licence). Drums, toms, bass, plucks, risers and impacts are synthesised. No third-party music, so it is safe for paid ads.
- **Voice:** a script written for this ad, generated with Kokoro-82M (Apache-2.0) using its Indian female voice `hf_alpha` (`scripts/make_vo.py`). Every line was checked with Whisper and the full mix transcribes word-for-word. To swap in a human or ElevenLabs voice later, replace the WAVs in the VO folder (same file names) and re-run `mix_audio.py`; line placement is automatic.
- **Brand:** crest from rnsischool.edu.in (background keyed out), Raleway typeface (the website's font, OFL), and colours blue `#3157A7`, orange `#FF6A00` and cream `#F4E9E1`.

## Rebuilding

Requirements: Node 18+, ffmpeg, Python 3.11 with `numpy scipy soundfile mido pyloudnorm kokoro faster-whisper`, `espeak-ng`, `fluidsynth`, and the `musescore-general-soundfont-lossless` package.

```bash
# 1. Footage: cut and reframe the shots from the brand film (written to public/clips/, which is gitignored)
scripts/prep_footage.sh "/path/to/Rnsis Film v3 .mp4"

# 2. Voiceover (one WAV per line + word timings)
python scripts/make_vo.py build/vo

# 3. Music + final mix (writes public/audio/soundtrack_vo.wav and soundtrack_music.wav)
python scripts/compose_music.py build/audio
python scripts/mix_audio.py build/vo build/audio public/audio

# 4. Video
npm install
npm run studio           # preview / tweak
npm run render           # main cut
npm run render:music     # music-only cut
# Set REMOTION_BROWSER=/path/to/chrome-headless-shell if Remotion can't download its own browser.
```

The edit decision list is in `src/timeline.ts` and the copy and animation are in `src/scenes.tsx`. To retime anything, keep section starts on multiples of 15 frames (one beat at 120 BPM) so the music stays in sync.
