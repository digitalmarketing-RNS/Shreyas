# Rafting trip reel

A 37-second, 9:16 Instagram reel cut from the 16 April 2026 rafting footage
(12 GoPro HERO12 clips plus the shore photographer's Nikon shots and the raft GoPro
stills). It is edited to the beat of **"Ilahi"** (Yeh Jawaani Hai Deewani, Arijit
Singh / Pritam), with Shreyas as the main subject throughout.

The rendered videos are not in this repo. They carry a copyrighted song and other
people's faces, and this repository is public. This folder holds only the edit
itself, so the reel can be rebuilt or changed.

## Structure

The cut follows the song (129 BPM). Every cut lands on a beat.

| Reel time | Song | Picture |
|---|---|---|
| 0:00–0:01.8 | intro drums | Flash-forward: raft slams into the big rapid, legs in the air |
| 0:01.8–0:16.4 | "Shaamein malang si…" (drums drop out) | The calm before: group photos, floating circle, Shreyas runs and dives off the raft in slow-mo on "baaghi **udaan**", back in the water, grin before the rapid |
| 0:16.4 | drums return on "Ilahi mera **jee** aaye aaye" | Hard cut into the whitewater |
| 0:16.4–0:23.8 | chorus | Rapid from the raft, hero DSLR shot of Shreyas in the spray, laughing selfie |
| 0:23.8–0:37.4 | "na na na…" | Fast montage: selfies, paddle shots, squad poses, a 3-frame photo burst of the man-overboard moment, ending on Shreyas grinning to camera as the music fades |

Hook text from 0:02 to 0:07: *they said it'll be a / "chill" rafting trip* (Poppins).
The grade adds light contrast and vibrance, with warm highlights and cool shadows.
Natural GoPro sound (screams, splashes, laughs) sits under the music and comes up
on the hook, the dive splash, the drop and the final laugh.

## Posting it

Two exports were delivered:

- `rafting_reel_final.mp4` has the song mixed in. Post it as is.
- `rafting_reel_no_music.mp4` is the same edit with only natural sound. It is the
  safer option if Instagram mutes or limits the first one for copyright. Upload it,
  tap **Add audio**, pick **"Ilahi" (Arijit Singh)** and set the start to
  **0:27–0:28** of the song. The cuts are timed to the song from 0:27.56, so the
  drop at 0:16 of the reel lines up with the drums. Nudge the start by a fraction
  if Instagram's copy of the track is offset. Keep the natural sound at about
  20–30% under the music.
- `cover.jpg` is a 9:16 cover frame from the hero rapid photo.

Suggested caption: `they said "chill" 🙂🌊 #rafting #whitewaterrafting #travelreels #weekendvibes #ilahi`

## Rebuilding

Requirements: ffmpeg, Python 3 with `numpy pillow soundfile scipy`.

1. Download the Drive folder "Trip" into `raw/` (for example
   `gdown --folder <folder url> -O raw`). Remove the duplicate copies of
   GX019686 and GX019687 if they come down twice.
2. Put the song at `music/ilahi.wav` (the 3:32 film version) and Poppins
   Medium/Bold in `fonts/`.
3. `python3 render.py` renders every shot to `shots/` and assembles `video.mp4`
   and `nat.wav`. `python3 render.py N3 N9` re-renders only those shots.
4. `python3 finish.py out` mixes the song and natural sound, adds the text
   overlay, normalises loudness to -14 LUFS and exports H.264 1080x1920 at 30 fps.

All editorial decisions (shot order, source in-points, crop tracking keyframes,
slow-mo, photo push-ins, sound levels) are in `edl.py`.
