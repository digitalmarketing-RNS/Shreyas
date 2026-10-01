# Naveen Tiles: "Meet the robots of NAVEEN" (Instagram Reel)

A 20-second vertical reel (1080×1920, 30 fps). Seven robots from the NAVEEN plant are introduced one by one under a sci-fi camera HUD:

- scanning brackets lock onto each machine and track it
- a decoded name tag (PICKER-01, SHUTTLE-02, STACKER-03…)
- typed readouts

It ends on **"Technology at work."** The footage comes from the numbered "Naveen Tile-Factory Sept" Drive folder. Built with [Remotion](https://www.remotion.dev/) on components from [claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit).

- **Master:** `renders/NaveenTiles_Robots_master.mp4` (66 MB, H.264 CRF 16, AAC 256k, −13.7 LUFS)
- **Cover:** `renders/NaveenTiles_Robots_cover.jpg`
- **Caption and posting notes:** [`CAPTION.md`](CAPTION.md)

## Structure

The music is 120 BPM, so a bar is 2 s. Each robot gets exactly one bar, and every cut is a glitch transition on the downbeat.

| Time | On screen | Drive clip |
|---|---|---|
| 0–2 s | The feed boots. "MEET THE / ROBOTS / OF NAVEEN ▸ TECHNOLOGY AT WORK"; brackets lock onto a NAVEEN carton | 154-PK |
| 2–4 s | PICKER-01 · vacuum gantry · tile pick & place | 115-KL |
| 4–6 s | PICKER-02 · vacuum gantry · suction lift | 113-KL |
| 6–8 s | SHUTTLE-01 · rail shuttle · stack transfer | 102-KL |
| 8–10 s | SHUTTLE-02 · rail shuttle · stack parking | 101-KL |
| 10–12 s | STACKER-01 · robotic arm · carton stacking | 147-PK |
| 12–14 s | STACKER-02 · robotic arm · lift & place | 150-PK |
| 14–16 s | STACKER-03 · robotic arm · pallet stacking | 153-PK |
| 16–20 s | "All units active." "TECHNOLOGY AT WORK." Official logo, "Precision engineered · Since 1983", naveentile.com | 147-PK (slow-mo) |

`src/edit.json` holds the trims, speeds and each clip's Drive file id. It also holds the HUD text for each robot (`stages[]`) and the target-box keyframes (`roi`: frame, x, y, w, h in clip pixels).

## How the HUD works

- `HudFrame.tsx`: the chrome that stays up for the whole reel. That is the frame corners, REC and timecode, the unit counter, a scan line that sweeps once per bar, and CRT lines. It jolts sideways on every cut.
- `TargetLock.tsx`: the brackets open wide on each cut, spring onto the robot and turn orange with a pulse when they lock. They then follow the robot using the `roi` keyframes. The keyframes go through the same Ken Burns scale as the picture (`shotScale` in `Shot.tsx`), so the brackets stay on the machine.
- `UnitTag.tsx`: the name decodes from random characters, then TYPE / TASK / ZONE type in and STATUS turns green.
- Transitions are the toolkit's `glitch` presentation.

## Wording

- The line is "Technology at work", not "no humans" or "fully automated". People appear in some shots, and the brand note asked to keep the message on technology.
- The robot names are made up for the video. The readouts only describe what each machine visibly does.
- "Since 1983" and the logo come from naveentile.com.

## Rebuild or tweak

You need Node 18+, Python 3.10+ with `numpy scipy`, and `ffmpeg`.

```bash
npm install
npm run footage   # downloads the source clips from Drive into raw/
npm run cut       # rotates, trims, grades and sets speed, writing public/clips/
npm run audio     # original score + HUD SFX + factory ambience, writing public/audio/
npm run studio    # preview
npm run render && npm run render:nomusic && npm run cover
```

The glitch transitions draw every clip several times per frame, so a full render takes about 20 minutes on 4 cores. The video track is identical with or without music. To make the no-music file faster, swap the audio onto the music render with `ffmpeg -i out/naveen-tiles-robots-reel.mp4 -i public/audio/mix_nomusic.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k out/nomusic.mp4`.

- To retime a shot, change its `start` in `src/edit.json`, re-run `cut`, then adjust its `roi` keyframes so the brackets still sit on the robot. Studio is the easiest place to check that.
- To rename a robot or change its readouts, edit its entry in `stages[]`.

## Credits

- The glitch transition, film grain and vignette in `src/toolkit/` come from claude-code-video-toolkit (MIT, © Digital Samba).
- Fonts: Anton, Inter and JetBrains Mono (SIL OFL; licences in `public/fonts/`).
- The music and sound effects are original: `tools/make_audio.py` synthesises them, so no licence is needed.
