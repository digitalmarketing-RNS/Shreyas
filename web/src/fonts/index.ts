/**
 * Font definitions for the staff app (decisions.md section 2).
 *
 * - Inter 4.1, our own Latin + ₹ subset (wght 100–900, opsz pinned at 14, tnum/case/zero kept):
 *   preloaded, font-display swap, with a metric-matched Arial fallback so swapping causes no
 *   layout shift.
 * - Inter latin-ext: rare Latin diacritics only, never preloaded.
 * - Noto Sans for nine Indic scripts and Noto Naskh Arabic for Urdu: never preloaded. Each face
 *   carries its script's unicode-range, so the browser downloads a file only when the page shows
 *   a character of that script.
 *
 * Public pages (data-surface="public") use the system stack and load none of these files.
 *
 * next/font needs literal options, so the unicode ranges are written out in each call. They are
 * the ranges the Google Fonts CSS API serves for the same files (see ./README.md).
 */
import localFont from "next/font/local";
import type { CSSProperties } from "react";

const interLatin = localFont({
  src: "./inter/InterVariable-latin-rupee.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+20B9, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

const interLatinExt = localFont({
  src: "./inter/InterVariable-latin-ext.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF",
    },
  ],
});

const notoDevanagari = localFont({
  src: "./noto-devanagari/NotoSansDevanagari-devanagari.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0900-097F, U+1CD0-1CF4, U+1CF7-1CF9, U+200C-200D, U+20A8, U+20B9, U+20F0, U+25CC, U+A830-A839, U+A8E0-A8FF, U+11B00-11B0A",
    },
  ],
});

const notoBengali = localFont({
  src: "./noto-bengali/NotoSansBengali-bengali.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0951-0952, U+0964-0965, U+0980-09FE, U+1CD0, U+1CD2, U+1CD5-1CD6, U+1CD8, U+1CE1, U+1CEA, U+1CED, U+1CF2, U+1CF5-1CF7, U+200C-200D, U+20B9, U+25CC, U+A8F1, U+11DF0-11DF1",
    },
  ],
});

const notoGurmukhi = localFont({
  src: "./noto-gurmukhi/NotoSansGurmukhi-gurmukhi.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0951-0952, U+0964-0965, U+0A01-0A76, U+200C-200D, U+20B9, U+25CC, U+262C, U+A830-A839",
    },
  ],
});

const notoGujarati = localFont({
  src: "./noto-gujarati/NotoSansGujarati-gujarati.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0951-0952, U+0964-0965, U+0A80-0AFF, U+200C-200D, U+20B9, U+25CC, U+A830-A839",
    },
  ],
});

const notoOriya = localFont({
  src: "./noto-oriya/NotoSansOriya-oriya.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0951-0952, U+0964-0965, U+0B01-0B77, U+1CDA, U+1CF2, U+200C-200D, U+20B9, U+25CC",
    },
  ],
});

const notoTamil = localFont({
  src: "./noto-tamil/NotoSansTamil-tamil.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0964-0965, U+0B82-0BFA, U+200C-200D, U+20B9, U+25CC",
    },
  ],
});

const notoTelugu = localFont({
  src: "./noto-telugu/NotoSansTelugu-telugu.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0951-0952, U+0964-0965, U+0B83, U+0C00-0C7F, U+1CD5-1CD6, U+1CD8, U+1CDA, U+1CF2, U+200C-200D, U+25CC",
    },
  ],
});

const notoKannada = localFont({
  src: "./noto-kannada/NotoSansKannada-kannada.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0951-0952, U+0964-0965, U+0B83, U+0C80-0CF3, U+1CD0, U+1CD2-1CD3, U+1CDA, U+1CF2, U+1CF4, U+200C-200D, U+20B9, U+25CC, U+A830-A835",
    },
  ],
});

const notoMalayalam = localFont({
  src: "./noto-malayalam/NotoSansMalayalam-malayalam.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0307, U+0323, U+0951-0952, U+0964-0965, U+0B83, U+0D00-0D7F, U+1CDA, U+1CF2, U+200C-200D, U+20B9, U+25CC, U+A830-A832",
    },
  ],
});

const notoNaskhArabic = localFont({
  src: "./noto-naskh-arabic/NotoNaskhArabic-arabic.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC, U+102E0-102FB, U+10E60-10E7E, U+10EC2-10EC7, U+10EC9-10EEE, U+10EF0-10EFF, U+1EE00-1EE03, U+1EE05-1EE1F, U+1EE21-1EE22, U+1EE24, U+1EE27, U+1EE29-1EE32, U+1EE34-1EE37, U+1EE39, U+1EE3B, U+1EE42, U+1EE47, U+1EE49, U+1EE4B, U+1EE4D-1EE4F, U+1EE51-1EE52, U+1EE54, U+1EE57, U+1EE59, U+1EE5B, U+1EE5D, U+1EE5F, U+1EE61-1EE62, U+1EE64, U+1EE67-1EE6A, U+1EE6C-1EE72, U+1EE74-1EE77, U+1EE79-1EE7C, U+1EE7E, U+1EE80-1EE89, U+1EE8B-1EE9B, U+1EEA1-1EEA3, U+1EEA5-1EEA9, U+1EEAB-1EEBB, U+1EEF0-1EEF1",
    },
  ],
});

/** The hashed family names next/font gives a face: [main, metric-matched fallback?]. */
function families(font: { style: { fontFamily: string } }): string[] {
  return font.style.fontFamily.split(",").map((name) => name.trim());
}

const [interMain, interFallback] = families(interLatin);
const main = (font: { style: { fontFamily: string } }) => families(font)[0];

/**
 * The CSS variables tokens.css reads in --family-sans:
 *   var(--font-inter), var(--font-noto-deva), ... var(--font-noto-arab), system-ui, sans-serif
 * Set them on <html> (not <body>), so :root resolves them.
 *
 * Order matters. Both Inter files come first. Inter's metric-matched Arial fallback goes last,
 * after Noto Naskh Arabic: placed earlier, a local Arial (which has Arabic and many Latin-ext
 * glyphs on Windows) would draw Urdu names and rare diacritics before our faces could. While
 * Inter is loading, Latin text still reaches the fallback, because every face in between has a
 * unicode-range that leaves Basic Latin out.
 */
export const fontVariables = {
  "--font-inter": `${interMain}, ${main(interLatinExt)}`,
  "--font-noto-deva": main(notoDevanagari),
  "--font-noto-beng": main(notoBengali),
  "--font-noto-guru": main(notoGurmukhi),
  "--font-noto-gujr": main(notoGujarati),
  "--font-noto-orya": main(notoOriya),
  "--font-noto-taml": main(notoTamil),
  "--font-noto-telu": main(notoTelugu),
  "--font-noto-knda": main(notoKannada),
  "--font-noto-mlym": main(notoMalayalam),
  "--font-noto-arab": interFallback ? `${main(notoNaskhArabic)}, ${interFallback}` : main(notoNaskhArabic),
} as CSSProperties;
