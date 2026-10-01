# Rafting trip reel

A 37-second, 9:16 Instagram reel cut from the 16 April 2026 rafting footage
(12 GoPro HERO12 clips plus the shore photographer's Nikon shots and the raft GoPro
stills). It is edited to the beat of **"Ilahi"** (Yeh Jawaani Hai Deewani, Arijit
Singh / Pritam) and built around Shreyas (red t-shirt, blue life jacket). A face
tracker keeps him centred in the vertical crop.

The rendered videos are not in this repo. They carry a copyrighted song and other
people's faces, and this repository is public. The reference photos of Shreyas and
the face data derived from them are gitignored too. This folder holds only the edit
itself, so the reel can be rebuilt or changed.

## Structure

The cut follows the song (129 BPM). Every cut lands on a detected beat.

| Reel time | Song | Picture |
|---|---|---|
| 0:00–0:01.8 | intro drums | Flash-forward: his raft slamming into the big rapid, slow-mo on the impact |
| 0:01.8–0:16.4 | "Shaamein malang si…" (drums drop out) | The calm before. Relaxing on the raft, paddles up, floating, paddling off, grinning as the rapids get close, then the raft lines up and tips into the rapid |
| 0:16.4 | drums return on "Ilahi mera **jee** aaye aaye" | Hard cut into the whitewater, slow-mo as the wave hits |
| 0:16.4–0:23.6 | chorus | DSLR hero shot of him with his paddle up in the spray, a three-photo burst cut one frame per beat, him waving mid-rapid |
| 0:23.6–0:32.7 | "na na na…" | Fast montage: paddle cheer, the post-rapid wave, paddling, photo dump of his poses (flex, dab), ending on a photo of him standing on the raft |
| 0:32.7–0:38.4 | end of the phrase, music fades | Finale: he stands on the raft edge and leaps in slow-mo. The splash lands on the last beat, then a fade to black |

Hook text from 0:02 to 0:07: *they said it'll be a / "chill" rafting trip* (Poppins).
Photos cut in with a short camera-shutter flash. The grade adds light contrast and
vibrance, warm highlights, cool shadows and a soft vignette. Natural GoPro sound
(screams, splashes, laughs) sits under the music and takes over for the final splash.

## Posting it

Two exports were delivered:

- `Rafting_Reel_Ilahi_v3.mp4` has the song mixed in. Post it as is.
- `Rafting_Reel_no_music_v3.mp4` is the same edit with only natural sound. It is
  the safer option if Instagram mutes or limits the first one for copyright. Upload
  it, tap **Add audio**, pick **"Ilahi" (Arijit Singh)** and set the start to
  **0:27–0:28** of the song. The cuts are timed to the song from 0:27.56, so the
  drop at 0:16 of the reel lines up with the drums. Nudge the start by a fraction
  if Instagram's copy of the track is offset. Keep the natural sound at about
  20–30% under the music.
- `cover_v3.jpg` is a 9:16 cover frame from the hero rapid photo.

Suggested caption: `they said "chill" 🙂🌊 #rafting #whitewaterrafting #travelreels #weekendvibes #ilahi`

## Rebuilding

Requirements: ffmpeg, Python 3 with `numpy pillow soundfile scipy opencv-python-headless`.

1. Download the Drive folder "Trip" into `raw/` (for example
   `gdown --folder <folder url> -O raw`). Remove the duplicate copies of
   GX019686 and GX019687 if they come down twice.
2. Put the song at `music/ilahi.wav` (the 3:32 film version), Poppins
   Medium/Bold in `fonts/`, and the two face models in `models/` (see `face.py`).
3. Put a few photos of Shreyas in `me/`, then run `python3 face.py refs me/` and
   `python3 face.py photos`. These write `ref_feats.npy` and `photo_pos.json`.
4. `python3 render.py` renders every shot to `shots/` and assembles `video.mp4`
   and `nat.wav`. Face tracks are cached in `tracks/`. `python3 render.py N3 N9`
   re-renders only those shots.
5. `python3 finish.py out` mixes the song and natural sound, adds the text
   overlay, normalises loudness to -14 LUFS and exports H.264 1080x1920 at 30 fps.

All editorial decisions (shot order, source in-points, which shots follow his face,
zoom, speed ramps, photo push-ins and flashes, sound levels) are in `edl.py`.
