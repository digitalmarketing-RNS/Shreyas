# Vendored fonts

The staff app's web fonts, loaded with `next/font/local` from `index.ts` (decisions.md section 2). Nothing is fetched
from Google at build time or by the browser. Public pages (`data-surface="public"`) use system fonts and load none of
these files. Each family's licence text sits next to its file; all are SIL Open Font License 1.1 and none names a
Reserved Font Name, so our Inter subset may keep the name.

| file | family, version | bytes | KiB | loading | source |
| --- | --- | ---: | ---: | --- | --- |
| `inter/InterVariable-latin-rupee.woff2` | Inter 4.1 (4.001), our subset | 47,568 | 46.5 | preload, swap, Arial metric fallback | built from `InterVariable.woff2` (352,240 bytes), https://cdn.jsdelivr.net/gh/rsms/inter@v4.1/docs/font-files/InterVariable.woff2 (recipe below) |
| `inter/InterVariable-latin-ext.woff2` | Inter 4.001, Google "latin-ext" | 85,272 | 83.3 | on demand | https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa25L7W0Q5n-wU.woff2 |
| `noto-devanagari/NotoSansDevanagari-devanagari.woff2` | Noto Sans Devanagari 2.006 | 121,188 | 118.3 | on demand | https://fonts.gstatic.com/s/notosansdevanagari/v30/TuG7UUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHN5TV_5Kl4-GIB.woff2 |
| `noto-bengali/NotoSansBengali-bengali.woff2` | Noto Sans Bengali 3.011 | 107,884 | 105.4 | on demand | https://fonts.gstatic.com/s/notosansbengali/v33/Cn-fJsCGWQxOjaGwMQ6fIiMywrNJIky6nvd8BjzVMvJx2mc4I3mYrtU3_I-n.woff2 |
| `noto-gurmukhi/NotoSansGurmukhi-gurmukhi.woff2` | Noto Sans Gurmukhi 2.004 | 33,776 | 33.0 | on demand | https://fonts.gstatic.com/s/notosansgurmukhi/v29/w8gyH3EvQP81sInb43inmyN9zZ7hb7ATbSWo4q8dJ74a3cVrSnsXn3KMYO8ieQ.woff2 |
| `noto-gujarati/NotoSansGujarati-gujarati.woff2` | Noto Sans Gujarati 2.106 | 112,492 | 109.9 | on demand | https://fonts.gstatic.com/s/notosansgujarati/v27/wlpZgx_HC1ti5ViekvcxnhMlCVo3f5pv17ivlzsUB14gg1TMbXaYEK2BoVnhAg.woff2 |
| `noto-oriya/NotoSansOriya-oriya.woff2` | Noto Sans Oriya 2.007 | 98,824 | 96.5 | on demand | https://fonts.gstatic.com/s/notosansoriya/v35/AYCcpXfzfccDCstK_hrjDyADv5e9748vhj3CJBLHIARtqiu71P4rx5PUIw.woff2 |
| `noto-tamil/NotoSansTamil-tamil.woff2` | Noto Sans Tamil 2.004 | 50,444 | 49.3 | on demand | https://fonts.gstatic.com/s/notosanstamil/v31/ieVp2YdFI3GCY6SyQy1KfStzYKZgzN1z4LKDbeZce-048cFpwFNLIdyzxg.woff2 |
| `noto-telugu/NotoSansTelugu-telugu.woff2` | Noto Sans Telugu 2.005 | 123,764 | 120.9 | on demand | https://fonts.gstatic.com/s/notosanstelugu/v30/0FlCVOGZlE2Rrtr-HmgkMWJNjJ5_RyT8o8c7fHkeg-esVARN5Ij9vyctgUg.woff2 |
| `noto-kannada/NotoSansKannada-kannada.woff2` | Noto Sans Kannada 2.006 | 90,572 | 88.4 | on demand | https://fonts.gstatic.com/s/notosanskannada/v32/8vIh7xs32H97qzQKnzfeXycxXZyUmySvZWItmf1fe6TVmgoD4F-YsX_ZG2GH.woff2 |
| `noto-malayalam/NotoSansMalayalam-malayalam.woff2` | Noto Sans Malayalam 2.104 | 89,448 | 87.4 | on demand | https://fonts.gstatic.com/s/notosansmalayalam/v29/sJov3K5XjsSdcnzn071rL37lpAOsUThnDZIfPdbeSNzVakglNOWE6zDg56wKn84.woff2 |
| `noto-naskh-arabic/NotoNaskhArabic-arabic.woff2` | Noto Naskh Arabic 2.021 (wght 400–700) | 93,960 | 91.8 | on demand | https://fonts.gstatic.com/s/notonaskharabic/v44/RrQKbpV-9Dd1b1OAGA6M9PkyDuVBeN2DHV2mLXgzTrc.woff2 |

Every file except the Inter subset is the per-script woff2 that the Google Fonts CSS API
(`https://fonts.googleapis.com/css2?family=<Family>:wght@100..900`, `wght@400..700` for Noto Naskh Arabic) served on
2026-10-06 to an Android Chrome user agent. The files were downloaded again on 2026-10-18 from the URLs above and are
byte-identical. The `unicode-range` of each face in `index.ts` is the range that CSS declares for the same file.

## Licences

| folder | licence file | copyright line |
| --- | --- | --- |
| `inter/` | `LICENSE.txt` (https://cdn.jsdelivr.net/gh/rsms/inter@v4.1/LICENSE.txt) | Copyright (c) 2016 The Inter Project Authors (https://github.com/rsms/inter) |
| `noto-<script>/` | `OFL.txt` (https://github.com/notofonts/<script>/blob/main/OFL.txt) | Copyright 2022 The Noto Project Authors |
| `noto-naskh-arabic/` | `OFL.txt` (https://github.com/notofonts/arabic/blob/main/OFL.txt) | Copyright 2022 The Noto Project Authors |

The app's `THIRD_PARTY_LICENSES` file (README of `replica/design`) must also carry these texts.

## Inter subset recipe

From Inter 4.1's `InterVariable.woff2`, with fontTools 4.66:

```bash
python3 -m fontTools.varLib.instancer InterVariable.woff2 opsz=14 -o inter-opsz14.ttf
python3 -m fontTools.subset inter-opsz14.ttf \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+20B9,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" \
  --layout-features+=tnum,case,zero --flavor=woff2 --output-file=InterVariable-latin-rupee.woff2
```

Result: weight axis 100–900 kept, optical size pinned at 14, Google's "latin" ranges plus U+20B9 (₹), so a page that
shows "₹2,50,000" never downloads Inter latin-ext or a Noto file for the rupee sign. U+2022 (•, the mask character)
and U+2212 (−, our minus sign) are in the subset too.

## How the faces stack

`tokens.css` builds `--family-sans` from the variables `index.ts` puts on `<html>`:
`Inter subset, Inter latin-ext, Noto Sans Devanagari … Noto Naskh Arabic, Inter's Arial fallback, system-ui, sans-serif`.
The fallback goes last on purpose: placed earlier, a local Arial (which has Arabic glyphs on Windows) would draw Urdu
text before Noto Naskh Arabic could.
