# Rafting trip reel

A 21-second, 9:16 Instagram reel cut from the 16 April 2026 rafting footage
(12 GoPro HERO12 clips plus the shore photographer's Nikon shots and the raft GoPro
stills). It is edited to **"Ik Junoon (Paint It Red)"** (Zindagi Na Milegi Dobara)
and built around Shreyas (red t-shirt, blue life jacket). It uses only shots where
he is clearly visible and looks good. A face tracker keeps him centred in the
vertical crop. There is no on-screen text; beat-synced transitions carry the edit.

The rendered videos are not in this repo. They carry a copyrighted song and other
people's faces, and this repository is public. The reference photos of Shreyas and
the face data derived from them are gitignored too. This folder holds only the edit
itself, so the reel can be rebuilt or changed.

## Structure

The cut follows the song (126 BPM). Every cut lands on a detected beat.

| Reel time | Song | Picture | Into it |
|---|---|---|---|
| 0:00–0:04.2 | quiet guitar build | Smiling on calm water, floating, paddle cheer | zoom blur, whip pan |
| 0:04.2 | the drop | DSLR hero shot of the raft in the spray, then a punch-in tight on his laughing face on the next beat | zoom punch, white flash, shake, RGB split, sub boom |
| 0:06–0:09.9 | full band | Him smiling in the rapid, the after-rapid wave | whip pan, spin, zoom |
| 0:09.9–0:14.6 | | Flex and arms-crossed photos, floating, calm-water smile | shutter flashes, whip, zoom |
| 0:14.6–0:21.4 | | Finale: on the raft edge, the leap in slow-mo with the music muffled as if underwater, the splash on the beat, then a fade | whip pan, shake on the splash |

Each whip, zoom and spin has a filtered-noise whoosh timed into the cut. The grade
adds light contrast and vibrance, warm highlights, cool shadows and a soft vignette.

## Posting it

Two exports were delivered:

- `Rafting_Reel_IkJunoon_v4.mp4` has the song mixed in. Post it as is.
- `Rafting_Reel_no_music_v4.mp4` is the same edit with the natural sound and
  transition whooshes only. It is the safer option if Instagram mutes or limits the
  first one for copyright. Upload it, tap **Add audio**, pick **"Ik Junoon (Paint It
  Red)"** and set the start to **0:13**. The drop at 0:04 of the reel should line up
  with the drums kicking in. Nudge the start by a fraction if Instagram's copy of the
  track is offset.
- `cover_v4.jpg` is a 9:16 cover frame of him laughing in the spray.

## Rebuilding

Requirements: ffmpeg, Python 3 with `numpy pillow soundfile scipy opencv-python-headless`.

1. Download the Drive folder "Trip" into `raw/` (for example
   `gdown --folder <folder url> -O raw`). Remove the duplicate copies of
   GX019686 and GX019687 if they come down twice.
2. Put the song at `music/ikjunoon.wav` (the 4:28 album version), Poppins
   Medium/Bold in `fonts/` (only needed if `TEXT` is set), and the two face models
   in `models/` (see `face.py`).
3. Put a few photos of Shreyas in `me/`, then run `python3 face.py refs me/` and
   `python3 face.py photos`. These write `ref_feats.npy` and `photo_pos.json`.
4. `python3 render.py` renders every shot to `shots/` and assembles `video.mp4`
   and `nat.wav`. Face tracks are cached in `tracks/`. `python3 render.py M3 F1`
   re-renders only those shots.
5. `python3 fx.py` applies the transitions and shakes and writes `video_fx.mp4`.
6. `python3 finish.py out` mixes the song, natural sound and transition SFX,
   normalises loudness to -14 LUFS with a -1.5 dBFS ceiling, and exports H.264
   1080x1920 at 30 fps.

All editorial decisions (song and start point, shot order, source in-points, which
shots follow his face, zoom, speed ramps, photo push-ins and flashes, transitions,
sound levels, the underwater muffle) are in `edl.py`.
