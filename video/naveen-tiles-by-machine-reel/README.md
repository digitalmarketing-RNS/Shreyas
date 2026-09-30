# Naveen Tiles: "Start to finish, by machine" (Instagram Reel)

A 78-second vertical reel (1080×1920, 30 fps). It shows the whole process at the Murudeshwar Ceramics plant, from raw material to dispatch, in 14 steps. All 71 shots show machines only; the one exception is people loading the truck at the dispatch step. The footage comes from the numbered "Naveen Tile-Factory Sept" Drive folder. Built with [Remotion](https://www.remotion.dev/) on components from [claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit).

- **Master:** `renders/NaveenTiles_ByMachine_master.mp4` (89 MB, 9 Mbps H.264, AAC 256k, −13.3 LUFS; kept under GitHub's 100 MB file limit)
- **Cover:** `renders/NaveenTiles_ByMachine_cover.jpg`
- **Caption and posting notes:** [`CAPTION.md`](CAPTION.md)

## Structure

The music is 120 BPM, so a bar is 2 s. Every cut lands on a beat.

| Time | Section | Drive clips |
|---|---|---|
| 0–2 s | Teaser: PRESS · FIRE · POLISH · PACK, one per beat | 63-PR, 97.3-KL, 124-PO, 147-PK |
| 2–4 s | "How a tile is made: start to finish, by machine" | 111-KL |
| 4–6 s | "Inside the factory of Murudeshwar Ceramics" | FC gate board |
| 6–10 s | 01 Raw materials | 13-BM, 5-CP, 12.3-CP, 9-CP |
| 10–14 s | 02 Crushing | 7-CP, 12.2-CP, 11-CP, 12.1-CP |
| 14–18 s | 03 Wet grinding | 22.1-BM, 21-BM, 20-BM, 22-BM |
| 18–22 s | 04 Liquid slip (slow-mo) | 25-BM, 23-BM, 26.1-BM |
| 22–28 s | 05 Spray drying | 46-SD, 45-SD, 44-SD, 57-SD, 51.1-SD, 53-SD |
| 28–34 s | 06 Pressing: "Presses up to 6,500 tonnes" | 63-PR, 64-PR, 62.1PR, 69-PR, 71-PR, 66-PR |
| 34–38 s | 07 Drying | 75-PR, 77-DR, 79-DR, 78-DR |
| 38–42 s | 08 Glazing | GP, 80-GL, 84-GL, 82-GL |
| 42–46 s | 09 Digital printing | 86-DG, 87-DG, 90-DG |
| 46–52 s | 10 Firing: "Kilns up to 252 m long", 930 → 1126 °C counter | 94-KL, 95-KL, 97.1-KL, 95.1-KL, 96-KL, 97.2-KL |
| 52–56 s | 11 Sort & store | 97.6.3-KL, 106-KL, 101-KL, 102-KL |
| 56–62 s | 12 Polishing: "Lines with up to 64 heads" | 115.1-PO, 119-PO, 123-PO, 125-PO, 126-PO, 132-PO |
| 62–68 s | 13 Grade & pack (robots) | 135-PK, 136-PK, 137-PK, 145-PK, 147-PK, 154-PK |
| 68–72 s | 14 Dispatch (people loading the truck) | 162-DS, 164-DS, 169DS, 168-DS |
| 72–78 s | "Every step. By machine." Official logo, facts (1983 · 860 lakh sq ft/yr · ISO 9001), naveentile.com | 131-PO |

The exact trims, speeds and captions, with each clip's Drive file id, are in [`src/edit.json`](src/edit.json).

## Where the on-screen facts come from

These are all from naveentile.com, read on 30 Sep 2026:

- The **logo** is the official `naveen-logo.webp` from the website header.
- **"Since 1983"** comes from the site title "Leading Tile Manufacturers in India Since 1983".
- **"860 lakh sq ft a year"** and **ISO 9001**: the Manufacturers page says "production capacity of 860 lakh sqft per year" and lists ISO 9001 certification.
- **"Presses up to 6,500 tonnes"**, **"Kilns up to 252 m long"** and **"Lines with up to 64 heads"** come from the Manufacturers page lines "PH 6500 tons — 04 nos. from SACMI", "longest kiln is 252 meters" and "biggest polishing line has 64 heads".
- **930 → 1126 °C** are the zone readings on the kiln control panel in clip 97.1-KL.

## Rebuild or tweak

You need Node 18+, Python 3.10+ with `numpy scipy`, and `ffmpeg`.

```bash
npm install
npm run footage   # downloads the source clips from Drive into raw/
npm run cut       # rotates, trims, grades and applies slow-mo, writing public/clips/
npm run audio     # original score + SFX + machine ambience, writing public/audio/
npm run studio    # preview
npm run render && npm run render:nomusic && npm run cover
```

To swap a shot, edit its entry in `src/edit.json` and re-run `footage`, `cut` and `audio`. Text lives in `stages[]` in the same file. The opener is in `src/components/HookTitle.tsx`, and the end card facts are in `src/components/EndCard.tsx`.

## Credits

- The transitions, film grain and vignette in `src/toolkit/` come from claude-code-video-toolkit (MIT, © Digital Samba).
- Fonts: Anton and Inter (SIL OFL).
- The music is original: `tools/make_audio.py` synthesises it, so no licence is needed.
