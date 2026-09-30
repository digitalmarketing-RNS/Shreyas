# Naveen Tiles: "How a tile is born" (Instagram Reel)

A 32-second vertical reel (1080×1920, 30 fps) made from the September factory shoot. It follows a tile through 13 steps, from rock to your floor. Built with [Remotion](https://www.remotion.dev/) on components from [claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit).

- **Final master:** `renders/NaveenTiles_FactoryReel_master.mp4` (83 MB, H.264 CRF 16, AAC 256k, −13.5 LUFS)
- **Cover:** `renders/NaveenTiles_FactoryReel_cover.jpg`
- **Caption and posting notes:** [`CAPTION.md`](CAPTION.md)

## Structure

The music is 120 BPM, so one bar is 2 seconds (60 frames). Every step gets one bar and every cut falls on the beat.

| Time | Step | Footage (Drive file) |
|---|---|---|
| 0–2 s | Hook: "This tile was once a rock." | PO polished tile |
| 2–4 s | 01 Raw earth | 5-CP loader dumping into the hopper |
| 4–6 s | 02 Crushed | 7-CP crusher, 11-CP belt |
| 6–8 s | 03 Ground | 20-BM ball mill |
| 8–10 s | 04 Liquid clay | 25-BM slip pour (slow-mo) |
| 10–12 s | 05 Spray-dried | 44-SD burner, 51.1-SD powder |
| 12–14 s | 06 Pressed | 64-PR press, 75-PR rollers |
| 14–16 s | 07 Dried | 77-DR dryer hall, 78-DR exit |
| 16–18 s | 08 Glazed | 80-GL glaze bell (slow-mo) |
| 18–20 s | 09 Printed | 90-DG digital printer |
| 20–22 s | 10 Fired: 930 → 1126°C counter | 97.1-KL kiln panel, 97.3.1-KL kiln exit |
| 22–24 s | 11 Polished | PO polishing heads, wet sheen |
| 24–26 s | 12 Packed | PK robot with a NAVEEN carton |
| 26–28 s | 13 Shipped | DS crew with cartons, RNS truck |
| 28–32 s | "From earth to your floor." NAVEEN end card + CTA | PO glossy tile, blurred |

Every cut, trim, speed and caption is set in [`src/edit.json`](src/edit.json). The Python tools and the Remotion composition all read timing from that file, so editing it and re-running the steps below keeps the picture, music and SFX in sync.

## Sound

No music APIs were used. `tools/make_audio.py` builds everything from scratch, so there are no licences to worry about:

- an original A-minor track (Am–F–C–G): four-on-the-floor kick, rolling bass, metallic "factory" FM hits, a pluck arpeggio from 10 s, and a pad. The track builds in three sections.
- a riser into a sub-bass hit on the 2 s drop, whooshes on the transitions, ticks as each label lands, blips on the kiln counter, and a shimmer when the brand appears.
- the real machine sound from each clip, level-matched and mixed under the track.

It writes two mixes: `mix_music.wav` and `mix_nomusic.wav`. The no-music mix is for pairing with a trending Instagram sound.

## Rebuild or tweak

Requirements: Node 18+, Python 3.10+ with `numpy scipy`, and `ffmpeg`.

```bash
npm install
npm run footage      # downloads the 23 source clips from the shared Drive folder into raw/
npm run cut          # rotates, trims, grades, bakes in slow-mo -> public/clips/
npm run audio        # music + SFX + ambience -> public/audio/
npm run studio       # preview and scrub in the browser
npm run render       # -> out/naveen-tiles-factory-reel.mp4
npm run render:nomusic
npm run cover
```

Common changes:

- **Swap a shot or its timing:** edit `src`/`driveId`/`start`/`speed` in `src/edit.json`, then `npm run footage && npm run cut && npm run audio`.
- **Change the on-screen text:** edit `stages[].title` and `sub` in `src/edit.json`. The hook lines are in `src/components/HookTitle.tsx`.
- **Use the real logo:** put a transparent PNG at `public/brand/logo.png` and pass `"logo": "brand/logo.png"` in the props (`src/Root.tsx`). The typeset NAVEEN wordmark is only a stand-in.
- **Change the CTA:** set `cta` in `src/Root.tsx`, for example to your handle or phone number.

## Credits and licences

- The transitions (`zoom-blur`, `light-leak`), `FilmGrain` and `Vignette` in `src/toolkit/` are from claude-code-video-toolkit (MIT, © Digital Samba). See `src/toolkit/LICENSE-claude-code-video-toolkit`.
- Fonts: Anton, Inter and Archivo, all under the SIL Open Font License (`public/fonts/OFL-*.txt`).
- Footage: the Naveen Tiles factory shoot, September.
