# Design system

The design tokens and component specs for the CRM, from the `/replica-design` step (2026-10-06, checked and
assembled 2026-10-18). They describe our own system. Nothing here is taken from the original product's code,
assets, fonts, copy or brand colour.

## What is in this folder

| file | what it is | edit it? |
| --- | --- | --- |
| `tokens.json` | Light theme tokens. The source of truth: colour roles, the `pairs` list for contrast, type, spacing, radius, shadow, motion, focus, layout, sizes, icons, z order. | Yes |
| `tokens.dark.json` | Dark theme tokens. Same keys as `tokens.json`; only `color`, `shadow`, `_about` and `_theme` differ. | Yes |
| `build_tokens.py` | Generator, standard library only. Checks both JSON files, then writes the three files below. | Yes |
| `tokens.css` | CSS custom properties: light on `:root`, dark for the OS setting and for `data-theme="dark"`, and the reduced-motion rules. | No, generated |
| `tailwind.css` | Tailwind CSS v4 mapping (`@theme inline`). Turns the tokens into utilities such as `bg-surface`, `text-muted`, `h-control-md`, and adds the `animate-*` keyframes, the `motion-safe:` and `motion-reduce:` variants, and `focus-inset`. Tailwind's default palette and sizes are switched off. | No, generated |
| `tw-merge.ts` | tailwind-merge config that knows our token class names. The app's `cn()` imports `twMerge` from it. | No, generated |
| `components.md` | Component specs: 123 blocks in three groups, the status vocabulary, and the open questions. | Yes |
| `decisions.md` | Decisions that come from context: accessibility, fonts, locale formatting, public pages, icons, dark theme, charts, motion. | Yes |
| `measurements.md` | The original's measured system (roles, type scale, spacing, layout), with its brand colours described in words only. | Yes |
| `contrast-report.txt` | Output of the contrast check for both themes, the chart palette check and the drift check. | Regenerate |

## Regenerate tokens.css, tailwind.css and tw-merge.ts

Edit `tokens.json` and `tokens.dark.json` only. Keep the same keys in both, and keep the role names:
`/replica-brand` changes values, never names. Then, from the repo root:

```bash
python3 replica/design/build_tokens.py          # writes tokens.css, tailwind.css and tw-merge.ts
python3 replica/design/build_tokens.py --check  # exits 1 if any of the three is out of date
```

Before it writes, the script checks that both files have the same keys, that only the themed keys differ, that
both have the same `pairs` list naming real colours, and that every colour is a hex value (or rgb/rgba for the
overlay). It does not check contrast. Never edit the three generated files by hand.

## Run the contrast check

```bash
python3 .claude/skills/replica-design/contrast.py replica/design/tokens.json
python3 .claude/skills/replica-design/contrast.py replica/design/tokens.dark.json
```

Each run reads the file's `pairs` list and prints the WCAG 2.2 ratio of every pair. The floor is AA: 4.5:1 for
text, 3:1 for large text, and 3:1 for UI parts (input edges, focus rings). The script exits 1 if any pair fails.
Fix a failure in the tokens, never in a component.

Result on 2026-10-18: 112 pairs per theme, 0 failures in light and 0 in dark.

After any token change, run both checks and then `build_tokens.py --check`, and replace `contrast-report.txt` with
the new output. A component may only use a text and background combination that is in the `pairs` list. If it
needs a new one, add the pair to both files and run the check first.

## Fonts, icons and licences

- **Staff app: Inter 4.1** (SIL Open Font License 1.1). We build our own subset with ₹ and a variable weight axis
  (46.5 KiB woff2), loaded with `next/font/local`. Inter's latin-ext file loads only when needed.
- **Indian scripts: Noto Sans** for Devanagari, Bengali, Gurmukhi, Gujarati, Oriya, Tamil, Telugu, Kannada and
  Malayalam, and **Noto Naskh Arabic** for Urdu (all SIL OFL 1.1). Each file is downloaded only when a page shows
  a character from its script.
- **Public pages** (enquiry form, checkout, consent, privacy requests) use system fonts and load no web fonts.
- **Monospace:** no web font. API keys and webhook payloads use the system monospace stack.
- All font files are vendored with their `OFL.txt`. Nothing is fetched from Google at build time or by the
  browser. Details and file sizes: `decisions.md` section 2.
- **Icons: lucide-react 1.52** (ISC licence; icons derived from Feather are MIT, Cole Bemis). Icons are imported by
  name. Our own icons follow Lucide's 24 px grid and 2 px stroke. Details: `decisions.md` section 5.
- **Licence file.** The app must ship a `THIRD_PARTY_LICENSES` file with Inter's `LICENSE.txt`, the ten Noto
  `OFL.txt` files and lucide-react's `LICENSE`. It is not in the repo yet. The headers of `tokens.css` and
  `tailwind.css` point to it.
- **Component base:** Radix UI primitives (`radix-ui`, MIT), styled in the shadcn/ui way with our tokens. New
  libraries the specs need are listed in `components.md`, open question 1.
- **Colour:** `accent`, `accent-hover`, `accent-subtle`, `focus-ring` and the `chart-*` colours are placeholders.
  The accent family is pure grey for now, so no hue of the original is carried over. `/replica-brand` picks our
  palette.

## The original's screenshots

`measurements.md` was measured from public help-centre screenshots of the original product. Those images are not
stored in this repo. They were kept only in the working session's scratchpad, outside the repo, and are deleted
when `/replica-design` closes. Some of them show the original's logo, which we never use. The original's brand
colour is recorded only as the role `accent`, described in words, never as a value.
