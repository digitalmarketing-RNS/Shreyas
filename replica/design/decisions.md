# Design decisions: the context-driven parts

Date: 2026-10-06. Step: replica-design.
Inputs: `replica/recon.md` (Screens, Flows, Components), `replica/architecture.md` (Stack), the replica-design skill rules, and `replica/design/measurements.md` (the original's measured system).

This file decides the parts of the design system that come from context: law, users, devices, languages and networks. It does not pick colour values. `/replica-brand` picks our palette later; until then the original's brand colour exists only as the role `accent`, with the neutral placeholder recorded in `measurements.md`.

Numbers marked "measured" were produced in this session on 2026-10-06. The method is at the end of the file.

## At a glance

| # | topic | decision |
| --- | --- | --- |
| 1 | Accessibility | WCAG 2.2 AA on every screen. Also 2.4.13 Focus Appearance (AAA) on every screen, and 2.5.5 Target Size Enhanced (AAA, 44 px) on public pages. This covers IS 17802 and GIGW 3.0, which follow WCAG 2.1 AA. |
| 2 | Fonts | Staff app: Inter (OFL), our own subset that includes ₹, 46.5 KiB, preloaded. Noto Sans for nine Indic scripts and Noto Naskh Arabic for Urdu, all vendored, each downloaded only when a page contains that script. Public pages: system fonts, 0 bytes. Line height at least 1.5. |
| 3 | Locale | One `format` module on `en-IN`: `1,23,45,678`; money from integer paise; `06 Oct 2026, 2:30 pm IST`; relative times only in feeds; `+91 98765 43210`; masking done on the server. |
| 4 | Public pages | Per route: at most 150 KiB JS (brotli), 0 font bytes, 250 KiB total. LCP 2.0 s lab and 2.5 s field (p75), INP 200 ms, CLS 0.1. One column, 16 px inputs, 48 px controls, full autocomplete. Forms work before JS loads. |
| 5 | Icons | `lucide-react` (ISC; Feather-derived icons MIT). Sizes 16, 20, 24. Lucide's default stroke of 2, scaled with the icon. Decorative by default; labels go on the button. |
| 6 | Dark theme | Ships in v1 for staff screens: System (default), Light or Dark, saved in member prefs and a cookie. Public pages stay light. |
| 7 | Charts | Funnels are ordinal: one hue plus direct labels. Series use 8 fixed colour slots. Colour is never the only cue. Marks are at least 3:1 against the chart surface. Every chart has a table view. |
| 8 | Motion | 100, 150 and 240 ms; nothing over 300 ms. Reduced motion (OS setting or in-app setting) removes all movement. |

---

## 1. Accessibility floor

**Decision.** Every screen, staff and public, meets WCAG 2.2 Level AA. The current version is the W3C Recommendation of 12 Dec 2024. We also meet three AAA criteria: 2.4.13 Focus Appearance on every screen, 2.5.5 Target Size (Enhanced) on public pages, and 2.3.3 Animation from Interactions (section 8).

**Why.**
- Indian law. Rule 15 of the RPwD Rules 2017 was amended on 11 May 2023. It now requires websites and apps to comply with IS 17802 Part 1 (2021) and Part 2 (2022), and it covers private establishments as well as government. IS 17802 is harmonised with EN 301 549, whose web clauses map to WCAG 2.1 AA. We took that mapping from secondary sources; we did not read the BIS text.
- In Rajive Raturi v Union of India (8 Nov 2024), the Supreme Court held that Rule 15 set no enforceable floor. It ordered the government to define mandatory standards. A law-firm summary from Sept 2025 reports draft ICT accessibility rules that would require suppliers to provide Accessibility Conformance Reports (ACRs). We have not checked whether those rules have been notified.
- GIGW 3.0 (NIC, MeitY) governs central and state government websites and apps and is based on WCAG 2.1 (AA, per secondary sources). Government and aided colleges will embed our enquiry form on sites that GIGW governs, and their purchase process can ask for proof of conformance.
- WCAG 2.2 AA includes every 2.1 AA criterion except 4.1.1 Parsing, which 2.2 removed as obsolete. Meeting 2.2 AA therefore meets 2.1 AA.
- 2.4.13 costs one token and one CSS rule. Counsellors work through lists and dialogs by keyboard all day.

**Rules for this app.**
- **Focus (2.4.7, 2.4.13).** `:focus-visible` gets `outline: 2px solid var(--color-focus-ring); outline-offset: 2px`. In table rows, menu items and listbox options, where an outer ring would be clipped, use `outline-offset: -2px`. The `focus-ring` token must reach 3:1 against every surface it can sit on, in both themes; add these as `ui` pairs in `tokens.json`. Use `outline`, never `box-shadow` alone, because forced-colors mode removes box-shadow. A background highlight alone does not count as a focus indicator. Focus rings appear at once, with no transition.
- **Focus not obscured (2.4.11).** The app shell has a sticky header, tables have sticky header rows, and S05 has a bulk-action bar at the bottom. Each scroll container sets `scroll-padding-top` and `scroll-padding-bottom` to the heights of those bars (technique C43). Toasts sit bottom-right. They never cover the bulk bar or the focused element, and Esc dismisses them. Public pages set no non-essential cookies, so they need no cookie banner.
- **Dragging (2.5.7).** Every drag has a click-or-tap alternative. Keyboard support alone does not satisfy 2.5.7.

  | where | drag | single-pointer alternative |
  | --- | --- | --- |
  | S29 stages; S05 column chooser; S05 quick-filter manage | reorder rows | Move up and Move down buttons on each row, plus "Move to position…" in the row menu |
  | S18 workflow canvas | place nodes, connect, pan | automatic layout, so nodes never need placing by hand; a "+" button on each connector adds a step; "Move step…" picks a new slot; zoom and pan buttons; scrollbars |
  | S34 team tree; S28 picklist tree | move a node | a "Move to…" dialog that picks the new parent; Move up and Move down among siblings; expand and collapse buttons |
  | S12 calendar | drag an event to a new time | "Reschedule" opens the follow-up form (S11) |
  | S21 dashboards | move and resize widgets | widget menu: move left, right, up or down; size S, M or L |
  | S07 import; file fields | drop a file | "Choose file" button |
  | S29 stage score −10 to +10 | slider | number input or select; no slider-only control |

- **Target size (2.5.8).** Every pointer target in the staff app has a hit area of at least 24 × 24 CSS px. That includes row checkboxes (16 px box, 24 px hit area; the original uses 13 px native boxes, per `measurements.md`), chip remove buttons, pagination, calendar days, menu items (32 px tall) and icon buttons (32 px by default, 24 px only in dense toolbars). On public pages the minimum is 44 × 44 (2.5.5), and inputs and buttons are 48 px tall.
- **Redundant entry (3.3.7).** Within one process, never ask for the same thing twice.
  - Change stage (S09) records the follow-up date it collects; it does not open a second follow-up form.
  - Import (S07) remembers the last column mapping for the same file headers.
  - The payment page (S02) and the gateway receive the lead's name, email and mobile prefilled.
  - An OTP step shows the address the code went to. It does not ask for that address again.
  - Guardian consent and privacy requests prefill what an earlier step verified.
  - No "confirm email" fields.
  - Browser autofill alone does not satisfy 3.3.7; the app must supply the values.
- **Accessible authentication (3.3.8).**
  - Sign-in (S03) uses `autocomplete="username"` and `autocomplete="current-password"`, allows paste and password managers, and has a show-password button.
  - TOTP and every OTP use a single text field with `inputmode="numeric"` and `autocomplete="one-time-code"`. Never one box per digit. Paste always works.
  - Magic link and SSO are alternatives (the architecture uses Supabase Auth for both).
  - No CAPTCHA puzzles. Abuse is handled by rate limits (architecture) or a non-interactive check.
- **Consistent help (3.2.6).** Public pages (S01, S02, consent, privacy) show the institution's contact details in the same place, the page footer.
- **Input purpose (1.3.5).** Every personal-data field carries an `autocomplete` token (table in section 4).
- **Reflow and resize (1.4.10, 1.4.4).** Public pages work at 320 CSS px. Staff screens reflow too. The exceptions are data tables, the workflow canvas and the calendar, which scroll inside their own container; WCAG allows this for content that needs two dimensions. Never set `maximum-scale` or `user-scalable=no`.
- **Text spacing (1.4.12).** No fixed heights on boxes that hold text.
- **Colour (1.4.1).** Status and errors always pair colour with text, an icon or both. Each error sits under its field, linked by `aria-describedby`. On submit, a summary appears at the top of the form.

**How we check.** axe-core runs in Playwright on every screen in both themes. Each screen also gets a keyboard pass. Screen-reader passes: NVDA with Chrome (staff screens), TalkBack with Chrome on Android and VoiceOver with Safari on iOS (public pages). Before the first government institution signs, we publish an accessibility statement and an ACR against WCAG 2.2 AA that also maps to IS 17802.

**Sources.**
- WCAG 2.2, Recommendation of 12 Dec 2024: https://www.w3.org/TR/WCAG22/
- What is new in 2.2 (and 4.1.1 removed): https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- 2.4.11: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- 2.4.13: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
- 2.5.7: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- 2.5.8: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- 2.5.5: https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html
- 3.3.7: https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html
- 3.3.8: https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html
- 3.2.6: https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html
- 1.4.11 (focus rings, input borders, charts): https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- Forced-colors mode drops box-shadow: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors
- RPwD (Amendment) Rules 2023, 11 May 2023 (summary): https://www.scconline.com/blog/?p=291941
- IS 17802 Part 1:2021 record: https://archive.org/details/gov.in.is.17802.1.2021
- GIGW 3.0 scope and WCAG 2.1 basis: https://guidelines.india.gov.in/scope-and-objective/
- GIGW 3.0 and WCAG 2.1 AA (secondary): https://www.digit.in/features/general/what-is-gigw-3-0-indian-govts-design-guidelines-for-official-websites-and-apps.html
- Rajive Raturi (2024), Pragya Prasun (2025) and the draft ICT rules (law-firm summary, Sept 2025): https://www.azbpartners.com/bank/bridging-the-digital-divide-indias-evolving-accessibility-framework/

---

## 2. Fonts

**Decision.**
- **Staff app, Latin text: Inter 4.1** (SIL Open Font License 1.1). We build our own subset with a variable weight axis (100–900; we use 400, 500, 600 and 700) and optical size pinned at 14. It covers Google's "latin" ranges plus U+20B9 (₹) and keeps the OpenType features `tnum`, `case` and `zero`. Measured size: 47,568 bytes (46.5 KiB) as woff2. It loads through `next/font/local` with `preload: true`, `display: 'swap'` and `adjustFontFallback: 'Arial'`, which gives a metric-matched fallback and no layout shift.
- **Rare Latin diacritics.** Inter's latin-ext file (83.3 KiB) is a second face with its own `unicode-range` and `preload: false`.
- **Indic scripts (staff app).** Noto Sans Devanagari, Bengali, Gurmukhi, Gujarati, Oriya, Tamil, Telugu, Kannada and Malayalam (all OFL 1.1), one variable-weight file per script. Urdu uses Noto Naskh Arabic (OFL). Each face is declared with a `unicode-range`, `preload: false` and `display: 'swap'`. The browser downloads a file only when the page shows a character in its range, so staff at a Tamil college download only the Tamil file.
- **Where files live.** All font files are vendored in the app with their `OFL.txt` and loaded through `next/font/local`. Nothing is fetched from Google, either at build time or by the browser. Builds stay reproducible, and we control every `unicode-range`.
- **Staff font stack:** `Inter, "Noto Sans Devanagari", "Noto Sans Bengali", "Noto Sans Gurmukhi", "Noto Sans Gujarati", "Noto Sans Oriya", "Noto Sans Tamil", "Noto Sans Telugu", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Naskh Arabic", system-ui, sans-serif`. In code these are the CSS variables that `next/font` generates.
- **Public pages (S01, S02, consent, privacy): no web fonts.** Stack: `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif`. Android ships Roboto and Noto fonts, including the Indic ones. Indic coverage on iOS, macOS and Windows still has to be confirmed on the test devices.
- **Monospace: no web font.** Lead IDs and receipt numbers use Inter with `font-variant-numeric: tabular-nums slashed-zero`. API keys and webhook payloads (S37) use `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.

**Why a custom Inter subset.** Google's Inter "latin" file has no ₹; the glyph is in "latin-ext" (U+20AD–20C4). Every Noto Indic file also claims U+20B9 in its `unicode-range`. With stock Inter, a page showing "₹2,50,000" would download Inter latin-ext (83 KiB) for one glyph. If latin-ext were not declared, the browser would fall through to the first Noto Indic face in the stack instead and download Devanagari (118 KiB). Our subset puts ₹ in the preloaded file, which is about the size of Google's latin file. Inter's licence names no Reserved Font Name, so the subset may keep the name. The licence file ships with the font.

**Measured sizes** (woff2, variable weight, from the Google Fonts CSS API on 2026-10-06):

| file | KiB | note |
| --- | --- | --- |
| Inter, our Latin + ₹ subset | 46.5 | preloaded in the staff app |
| Inter latin (Google) | 47.3 | no ₹ |
| Inter latin-ext (Google) | 83.3 | on demand |
| Inter latin, with the optical-size axis kept | 71.3 | why we pin `opsz` |
| Noto Sans Devanagari | 118.3 | Hindi, Marathi, Nepali, Sanskrit |
| Noto Sans Bengali | 105.4 | Bengali, Assamese |
| Noto Sans Gurmukhi | 33.0 | Punjabi |
| Noto Sans Gujarati | 109.9 | |
| Noto Sans Oriya | 96.5 | Odia |
| Noto Sans Tamil | 49.3 | |
| Noto Sans Telugu | 120.9 | |
| Noto Sans Kannada | 88.4 | |
| Noto Sans Malayalam | 87.4 | |
| Noto Naskh Arabic | 91.8 | Urdu, chosen |
| Noto Nastaliq Urdu | 233.6 | Urdu, not chosen |

**Urdu: Naskh, not Nastaliq.** Noto Nastaliq Urdu is 233.6 KiB, and its line metrics span 2.5 em (ascender 1.90, descender 0.60). That does not fit table rows or inputs. Noto Naskh Arabic is 91.8 KiB, and a sample name's ink spans 0.93 em. Urdu readers often prefer Nastaliq, so we will revisit it for long messages if an Urdu-medium institution asks. User-entered text gets `dir="auto"`, so Urdu runs right to left inside the English UI.

**Line height for Indic scripts (measured).** We shaped real names with HarfBuzz. Across all ten scripts, the ink stays within 1.0 em above the baseline and 0.53 em below it. The deepest are Kannada and Telugu stacked consonants such as ಸ್ತ್ರೀ and స్త్రీ, at 0.47–0.53 em below. Inter's ascender is 0.97 em and its descender 0.24 em, so its baseline sits low in the line box. With a numeric `line-height` of 1.5, the box reaches only 0.39 em below the baseline, and Kannada or Telugu subscripts hang about 0.14 em under it. That is 2 px at 14 px text. Material Design also classes Hindi, Telugu and Arabic as "tall" scripts that need extra line height. Rules:
- Any text that can hold a user-entered name or message has a line height of at least 1.5. Proposed scale: xs 12/18, table 13/20, sm 14/22, base 16/24, lg 20/28.
- Multi-line user text (notes, chat bubbles, message previews, timeline entries) gets at least 1.57 (sm 14/22, base 16/26). A deep subscript then never touches a tall vowel sign on the next line.
- A box that clips its content keeps at least 4 px of padding below the text and 2 px above, inside the clipping box. This covers ellipsis truncation, chips, select triggers, tabs and table cells with `overflow: hidden`.
- Control heights: 32 px (toolbars, filters) and 40 px (form fields) in the staff app, both with 14 px text; 48 px with 16 px text on public pages. All of these fit the measured ink.
- No line height below 1.2 on anything that holds user text.
- Test fixture, shown in the component gallery and in a Playwright screenshot test, in a table row, a chip, a select, a toast and the profile header: हृषीकेश, ঋতুপর্ণা, ਗੁਰਪ੍ਰੀਤ, દ્રષ્ટિ, ସ୍ୱାତୀ, ஸ்ரீநிதி, శ్రీలక్ష్మి, ಶ್ರೀನಿವಾಸ್, ശ്രീക്കുട്ടി, عائشہ, ಸ್ತ್ರೀ, స్త్రీ.

**Acceptance test.** On a Latin-only page that contains ₹ and an emoji sequence, the network log must show only the Inter file. Inter has no glyphs for U+200C and U+200D (the zero-width non-joiner and joiner), and the Noto Indic ranges include both. An emoji joined with U+200D could therefore trigger an Indic download. If it does, narrow the Noto `unicode-range` declarations to the script blocks, then re-check that Indic shaping still works.

**Sources.**
- Inter repository and licence (OFL 1.1, no Reserved Font Name): https://github.com/rsms/inter , licence file read at https://cdn.jsdelivr.net/gh/rsms/inter@v4.1/LICENSE.txt
- `next/font` (self-hosting, `preload`, `display` default `swap`, `adjustFontFallback`, `declarations`): https://nextjs.org/docs/app/api-reference/components/font
- `unicode-range` (a face downloads only when its characters are used): https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/unicode-range
- `font-display` (swap and optional): https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display
- Google Fonts CSS API (subset ranges and file sizes measured): https://fonts.googleapis.com/css2?family=Inter:wght@100..900
- Noto fonts in Android (OFL 1.1): https://android.googlesource.com/platform/external/noto-fonts/+/refs/heads/androidx-javascriptengine-release/other/README.android
- Noto project: https://notofonts.github.io/
- "Tall" scripts need extra line height: https://m2.material.io/design/typography/language-support.html

---

## 3. Locale formatting

**Decision.** All display formatting goes through one `format` module. It always uses the `en-IN` locale, whatever the browser's locale, because the v1 UI is in English. Times display in the org's time zone (default `Asia/Kolkata`). Data stays raw: money as integer paise, times in UTC, phone numbers in E.164.

| value | rule | output (measured: Node 22.22, ICU 77.1, CLDR 47) |
| --- | --- | --- |
| count | `Intl.NumberFormat('en-IN')` | 1,23,45,678 |
| money, exact | paise as `bigint`; split rupees and paise by integer division; format the decimal **string** with `{style:'currency', currency:'INR'}`; always 2 decimals | ₹12,34,567.89 |
| money, summary | `notation:'compact'`, short form only | ₹1.5L, ₹1.2Cr |
| percent | `{style:'percent', maximumFractionDigits:1}` | 12.3% |
| date | `{day:'2-digit', month:'short', year:'numeric'}` | 06 Oct 2026 |
| time | `{hour:'numeric', minute:'2-digit', hour12:true}` | 2:30 pm |
| date, time and zone | add `timeZoneName:'short'` | 06 Oct 2026, 2:30 pm IST |
| relative | `Intl.RelativeTimeFormat('en-IN', {numeric:'auto', style:'short'})` | 5 min ago, 3 hr ago, yesterday |
| list | `Intl.ListFormat('en-IN')` | Email, SMS and WhatsApp |
| phone | libphonenumber-js `formatInternational()` | +91 98765 43210; +91 80 2612 3456 |

**Rules.**
- **Money.**
  - Never convert money through a JS float. `Intl.NumberFormat` formats a decimal string exactly; we tested an 18-digit string.
  - Exact amounts (S02, receipts, S25 payments, refunds) always show paise.
  - Compact amounts (KPI tiles, chart axes) always carry the exact value in their tooltip and accessible name.
  - Never use `compactDisplay: 'long'`: it switches to "12 million".
  - Negative amounts and refunds carry a text label as well as a minus sign.
  - Numbers in tables use tabular figures and are right-aligned.
- **Time zone.**
  - "IST" appears only with the `en-IN` locale; `en-GB` and `en-US` print "GMT+5:30".
  - Show the zone on times that drive action: follow-ups, scheduled sends, payment-link expiry, receipts and the audit log. Also show it whenever the viewer's browser zone differs from the org's.
  - A follow-up displays in its own stored zone.
- **Month names.** Current CLDR writes September as "Sept" ("06 Sept 2026"), so leave room for four letters. Format on the server and pass strings to client components. A browser with older ICU data then cannot cause a hydration mismatch.
- **Relative times.**
  - Use them only in feeds: the timeline, notifications, the inbox and "last engaged".
  - Under 1 minute, show "just now". From 7 days on, show the absolute date.
  - Always wrap the value in `<time dateTime>`, with the absolute value in a tooltip that also opens on focus.
  - Render relative times on the client after mount (the server sends the absolute value) and refresh them every 60 s.
  - Due times are never relative alone: "Overdue · due 05 Oct, 4:00 pm".
- **Phone.**
  - Stored as E.164.
  - Input: a country-code select (default +91, `autocomplete="tel-country-code"`) plus the national number (`type="tel"`, `autocomplete="tel-national"`).
  - Accept spaces, dashes, a leading 0 and a pasted "+91…", and normalise on blur.
  - The browser checks only the digit count. The server validates with libphonenumber-js and its `max` metadata. Even the `min` metadata is 19 KiB gzipped, too heavy for the public-page budget.
  - Do not guess the number type from the first digit: libphonenumber classifies 6123456789 as a landline.
- **Masked values.**
  - Masking happens on the server. A role without the right never receives the full value.
  - Phone: `+91 ••••• •3210` (country code and last four digits). Email: `pr•••@gmail.com` (first two characters and the domain).
  - Accessible name: "Mobile number hidden, ends in 3210".
  - A "Show" button exists only for permitted roles. It fetches the value, writes an audit-log row, and the value is masked again on navigation.
  - The mask character is U+2022, which Inter includes.
- **Names.** One "Full name" field, with no first/last split. Any script, at least 100 characters. Shown exactly as entered, with `dir="auto"`.
- **Digits.** Always Latin digits, even when an Indian-language UI arrives later. `hi-IN` also defaults to Latin digits.

**Sources.**
- `Intl.NumberFormat`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
- `Intl.DateTimeFormat`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
- `Intl.RelativeTimeFormat`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat
- libphonenumber-js (1.13.14 tested): https://www.npmjs.com/package/libphonenumber-js
- Personal names around the world, including South Indian patterns: https://www.w3.org/International/questions/qa-personal-names

---

## 4. Public, student-facing pages

Routes: `/f/:publicKey` (S01), `/pay/:shortCode` and `/pay/return/:attemptRef` (S02), `/consent/:token`, `/privacy/:orgSlug/*`, `/v/:token`, `/unsubscribe/:token`.

**Who uses them.** Students and parents, mostly on low-cost Android phones on mobile data. India's 75th-percentile network is 6.2 Mbps down with an 85 ms round trip (Russell, Nov 2025), and our target users sit below that.

**Performance budget per route** (first load, cold cache):

| item | budget | why |
| --- | --- | --- |
| JavaScript | ≤ 150 KiB brotli | An empty Next.js 16.3.8 page already ships 111 KiB brotli (443 KiB uncompressed) to modern browsers (measured). Our own code therefore gets about 40 KiB. |
| CSS | ≤ 20 KiB brotli | |
| fonts | 0 | system fonts (section 2) |
| images | ≤ 20 KiB | institution logo only, SVG or WebP, with width and height set |
| HTML | ≤ 30 KiB brotli | |
| total transfer | ≤ 250 KiB | |
| LCP | ≤ 2.0 s in the lab; ≤ 2.5 s at field p75 | Lab means Lighthouse mobile (Slow 4G: 150 ms RTT, 1.6 Mbps, 4× CPU). These pages are small, so we hold the lab number below the 2.5 s "good" line. |
| INP | ≤ 200 ms at p75 | |
| CLS | ≤ 0.1 at p75, aiming for 0 | |

- No third-party scripts on these routes: no analytics tags, chat widgets or tag managers. The gateway's script loads only on the payment-attempt step, after the student taps Pay, and never on the S02 summary.
- Render the form on the server, and statically where the form's configuration allows. Functions run in Mumbai (bom1, per the architecture).
- The form submits through a Server Action, so it works before JavaScript loads and when JavaScript fails. Server-side errors render through `useActionState` in a client component.
- Use native `<select>`, radio buttons and checkboxes, not custom comboboxes. They cost no JavaScript, and Android's own picker suits small screens.
- CI enforces the budget. A script sums each public route's JS chunks the same way this file's numbers were measured, and Lighthouse CI asserts the metrics. Before each release, we also check on one real low-cost Android phone.

**Layout rules.**
- One column, at most 480 px wide, with 16 px side padding. Labels sit above fields and are never placeholders. One field per row, except the country code with the mobile number, and day, month and year.
- Text is at least 16 px everywhere, including inputs, selects and textareas: iOS Safari zooms into fields with smaller text. Never block zoom.
- Inputs and buttons are 48 px tall. Checkbox and radio rows are 44 px tall, with the label as part of the target. The primary button is full width.
- Errors: text and an icon under the field, with `aria-invalid` and `aria-describedby`. On submit, a summary with links appears at the top and receives focus.
- If sending fails, keep every value and say so plainly, for example "Not sent. Check your connection and try again." A repeat tap reuses the Idempotency-Key from the architecture, so nothing is created twice.
- Light theme only (`color-scheme: light`), because these pages live inside institution websites.
- Consent checkboxes are never pre-ticked.
- The institution's contact details sit in the footer of every public page (3.2.6).

**Field table.**

| field | type | inputmode | autocomplete | other |
| --- | --- | --- | --- | --- |
| full name | text | — | `name` | `autocapitalize="words"`, `spellcheck="false"` |
| email | email | — (the type brings the @ keyboard) | `email` | `autocapitalize="off"`, `spellcheck="false"` |
| country code | select | — | `tel-country-code` | default +91 |
| mobile | tel | — (the type brings the keypad) | `tel-national` | |
| OTP | text | `numeric` | `one-time-code` | one field, `pattern="\d{6}"`, paste allowed |
| date of birth | 3 × text in a fieldset | `numeric` | `bday-day`, `bday-month`, `bday-year` | also accept month names such as "jan" |
| PIN code | text | `numeric` | `postal-code` | `maxlength="6"` |
| city, state | text, select | — | `address-level2`, `address-level1` | |
| course, campus | native select or checkboxes | — | `off` | with a choice limit, show "2 of 3 chosen" |

- OTP SMS end with the origin-bound line `@<host> #<code>`, so Android (WebOTP) and iOS can offer the code. That line must be part of the template registered on DLT (TRAI rules, see the architecture).

**Sources.**
- Core Web Vitals thresholds and p75: https://web.dev/articles/vitals
- Lighthouse mobile throttling: https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md
- Performance Inequality Gap 2026 (device and network baselines; India p75): https://infrequently.org/2025/11/performance-inequality-gap-2026/
- Server Action forms are progressively enhanced: https://react.dev/reference/react-dom/components/form and https://nextjs.org/docs/app/guides/forms
- iOS zooms fields under 16 px (Apple does not document this; secondary sources): https://456bereastreet.com/archive/201212/ios_webkit_browsers_and_auto-zooming_form_controls and https://css-tricks.com/?p=339455
- Autofill tokens: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
- `inputmode`: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode
- SMS OTP form and WebOTP: https://web.dev/articles/sms-otp-form
- Date input for dates people know: https://design-system.service.gov.uk/components/date-input/

---

## 5. Icons

**Decision.** Use `lucide-react`. We checked version 1.52.0 (peer React 16.5 to 19). Licence: ISC. Icons derived from Feather are MIT (copyright Cole Bemis). Keep both notices in our third-party licence file.
- **Sizes.** 16 px next to 12–14 px text and for dense table actions. 20 px is the default, for buttons, navigation and inputs. 24 px for the top bar, empty states and public pages.
- **Stroke.** Lucide's default of 2 on its 24 px grid, scaled with the icon: about 1.33 px at 16 px and 1.67 px at 20 px. Do not use `absoluteStrokeWidth`; it makes small icons heavy and blurs their detail. Round caps and joins (Lucide's defaults).
- **Colour.** `currentColor`, taken from text tokens. An icon that carries meaning on its own needs 3:1 against its background (1.4.11).
- **Accessibility.** Lucide sets `aria-hidden="true"` unless the icon gets a label. Icon-only buttons put `aria-label` on the button, not the icon, and show a tooltip on hover and focus. Status icons always sit next to text.
- **Bundle.** Import each icon by name so unused icons are tree-shaken. No `DynamicIcon` and no lookup by string name. The package's base `Icon` component is marked `"use client"`, so even an icon inside a Server Component ships a small client runtime. On public pages it counts against the budget.
- **Not taken.** No logos or icons from the original. Channels (WhatsApp, SMS, email) show as text with generic icons such as `MessageCircle`, `MessageSquare` and `Mail`. A third-party brand mark is used only from its owner's official assets, under the owner's rules.
- **Our own icons** follow Lucide's grid: 24 × 24, 2 px stroke, round caps and joins, at least 1 px padding.

**Sources.**
- Licence: https://lucide.dev/license
- React package: https://lucide.dev/guide/packages/lucide-react
- Accessibility defaults: https://lucide.dev/guide/react/advanced/accessibility
- Design rules (24 px canvas, 2 px stroke): https://lucide.dev/contribute/icon-design-guide
- Package contents checked: https://www.npmjs.com/package/lucide-react (defaults `width: 24`, `stroke-width: 2`, round caps and joins; `LucideProvider` for global defaults)

---

## 6. Dark theme

**Decision.** v1 ships a dark theme for staff screens.
- **Setting.** Profile menu → Theme: System (default), Light or Dark. It is saved in member prefs (`PATCH /me/prefs`), so it follows the person across devices. It is also mirrored to a cookie, so the server renders `<html data-theme="light|dark">` with no flash of the wrong theme. "System" leaves the attribute off and follows `prefers-color-scheme`.
- **CSS.** Light tokens sit on `:root`. Dark tokens appear twice: under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` and under `:root[data-theme="dark"]`. `color-scheme` is set to match, and the page has `<meta name="color-scheme" content="light dark">`, so native controls and scrollbars follow the theme.
- **Components** use semantic token utilities only (`bg-surface`, `text-muted`), with no `dark:` variants. If a `dark:` variant is ever unavoidable, define `@custom-variant dark` to match both selectors above.
- **Kept light inside a framed "paper" surface:** email HTML previews (S10, S19), WhatsApp template previews, and uploaded documents and images. These show what the recipient sees.
- **Public pages** are light only in v1 (section 4).
- **Gate.** A screen ships only when both token sets pass `contrast.py` and its screenshots have been reviewed in both themes. `contrast.py` reads one `color` set per file, so run it once per theme file. Charts get dark steps of their own (section 7).

**Why.** Counsellors work full shifts in this app, and many people run their OS in dark mode. We are defining dark tokens anyway. With the token-only rule, most of the extra cost is review time. The original has no dark theme (`measurements.md`), so this is our own addition.

**Sources.**
- Tailwind v4 dark mode (`@custom-variant`, system plus a user choice): https://tailwindcss.com/docs/dark-mode
- `color-scheme`: https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme

---

## 7. Charts

**Decision.** These rules apply to S20 attribution, S21 dashboards, S22 pivot charts and S23 productivity. `/replica-brand` picks the colour values; these rules decide which palettes are allowed.

- **Colour follows the data's job.**
  - Funnel (the journey milestones from enquiry to enrolment): the stages are ordered, so use one hue in steps of increasing lightness, or a single colour. Direct-label every step with its name, its count, and its conversion from the previous step and from the top. Draw horizontal bars in stage order.
  - Bars of one measure across named categories (source, counsellor, campus): one colour. Colouring each bar adds nothing.
  - Several series: categorical slots 1 to 8, in a fixed order, assigned in sequence and never cycled. Colour follows the entity, so a filter never repaints the series that remain. A ninth series folds into "Other" or moves to small multiples.
  - Good or bad meaning: status tokens (success, warning, danger) with an icon and text. Status colours are never used as series colours.
- **Never colour alone.**
  - A legend for two or more series.
  - Direct labels at line ends or on bars when there are four series or fewer.
  - Lines also differ by marker shape (circle, square, triangle, diamond; at least 8 px).
  - The "previous period" comparison in S20 is a dashed line.
  - Stacked segments are separated by a 2 px gap in the surface colour, with a 45° or 135° hatch available as a second cue.
- **Contrast.**
  - Every mark (bar, line, point, segment) is at least 3:1 against the chart surface, in both themes.
  - The one exception, which 1.4.11 allows: a mark may fall below 3:1 when the same values are printed as text on the chart.
  - Gridlines stay faint. Axis labels and values are text: they need 4.5:1 and use text tokens, never series colours.
- **Palette checks** (run in CI next to `contrast.py`, once per theme):
  - each slot's OKLCH lightness is 0.43–0.77 (light theme) or 0.48–0.67 (dark theme), and its chroma is at least 0.10;
  - adjacent slots differ by ΔE ≥ 8 (OKLab × 100) under simulated protanopia and deuteranopia (Machado, Oliveira and Fernandes 2009, severity 1.0), and by ΔE ≥ 15 with normal vision;
  - every slot is at least 3:1 against the chart surface;
  - dark mode gets its own validated steps, not an inverted copy.

  These thresholds come from the data-visualisation method in this project's tooling (the bundled `dataviz` skill, `references/color-formula.md`). We adopt them as our rule.
- **Every chart** has a title that states the takeaway, a data-table view (S22 already has a table toggle), tooltips that open on focus as well as on hover, and `role="img"` with a one-sentence summary. No dual y-axes. No entry animations.

**Sources.**
- 1.4.1 Use of Color (techniques G111 colour plus pattern, G14 information also in text): https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- 1.4.11 Non-text Contrast (graphs; the exception for labelled values): https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- Colour-vision-deficiency simulation model: Machado, Oliveira and Fernandes, IEEE TVCG 15(6), 2009, https://doi.org/10.1109/TVCG.2009.113

---

## 8. Motion

**Decision.**

| token | value | used for |
| --- | --- | --- |
| `motion-fast` | 100 ms | hover, press and toggle; colour and opacity changes |
| `motion-base` | 150 ms | menus, popovers, tooltips, accordions |
| `motion-slow` | 240 ms | dialogs, drawers and toasts entering |
| `ease-standard` | `cubic-bezier(0.2, 0, 0.38, 0.9)` | entering and moving |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | leaving; an exit uses the next shorter duration |

- Nothing in the staff app animates for more than 300 ms, apart from loading indicators.
- No parallax, no auto-advancing content and nothing that flashes. No chart entry animations.
- **Reduced motion.** It applies when the OS asks (`prefers-reduced-motion: reduce`) or when the person turns on "Reduce motion" in their preferences, which sets `data-motion="reduce"` on `<html>`. Staff often share college PCs where they cannot change OS settings.
  - All movement stops: no translate, scale, rotate, height or size animation, and no smooth scrolling.
  - Drawers and dialogs appear in place.
  - Opacity and colour changes stay, at 100 ms or less.
  - Skeleton shimmer becomes a static block. Spinners become a static icon with the text "Loading…".
- Components animate only through these tokens and Tailwind's `motion-safe:` variant. The reduced-motion rules live in one place, `tokens.css`.
- Toasts with an action never dismiss themselves. Other toasts stay at least 6 s and pause on hover and focus (2.2.1 Timing Adjustable).

**Why.** Carbon's durations for UI work run from 70 to 240 ms, and longer motion slows people who repeat the same action all day. WCAG 2.3.3 asks that motion triggered by interaction can be turned off, and technique C39 (`prefers-reduced-motion`) satisfies it. Under 2.3.3, changes in colour and opacity do not count as motion, so fades can stay. The template's 120 and 200 ms values give way to these.

**Sources.**
- 2.3.3 Animation from Interactions and technique C39: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- 2.2.2 Pause, Stop, Hide and 2.2.1 Timing Adjustable: https://www.w3.org/TR/WCAG22/
- `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- Carbon motion durations and easing: https://carbondesignsystem.com/elements/motion/overview/
- Tailwind `motion-safe`, `motion-reduce`, `forced-colors` and `contrast-more` variants: https://tailwindcss.com/docs/hover-focus-and-other-states

---

## Handoff to the token and component steps

`tokens.json` and `tokens.css` need:
- a `focus-ring` colour, with `ui` pairs against `bg`, `surface`, `surface-subtle` and `surface-strong` in both themes;
- a full dark colour set, checked as its own file with `contrast.py`;
- line heights: xs 12/18, table 13/20, sm 14/22, base 16/24, lg 20/28, plus `leading-prose` 1.625 for multi-line user text;
- font stacks: `sans` (staff, section 2), `public` (system) and `mono` (system);
- motion tokens (section 8), and a reduced-motion block keyed on both the media query and `data-motion="reduce"`;
- chart tokens: `chart-1` to `chart-8`, `chart-surface`, an ordinal ramp, and dark steps for each;
- sizes: controls at 32 and 40 px (staff) and 48 px (public); minimum hit areas of 24 px (staff) and 44 px (public); 2 px focus outline with a 2 px offset.

`components.md` needs specs for: the drag alternatives (section 1 table), the OTP field, the phone input, the masked value, the amount display, the `<time>` display with relative and absolute forms, the chart frame with its table view, and the theme and reduce-motion settings.

## How the numbers were measured

- **Fonts.** We fetched the Google Fonts CSS2 API with an Android Chrome user agent, downloaded each woff2 file and recorded its size in bytes. Coverage and vertical metrics came from fontTools 4.66, and ink extents from shaping sample strings with HarfBuzz (uharfbuzz).
- **Inter subset.** From Inter 4.1's `InterVariable.woff2`: `fontTools.varLib.instancer` with `opsz=14`, then `fontTools.subset` with Google's latin ranges plus U+20B9, `--layout-features+=tnum,case,zero`, `--flavor=woff2`. The recipe and the output file are in the session scratchpad (`design/subset-out/`).
- **JavaScript baseline.** `next build` (Next.js 16.3.8, React 19.3.0, Turbopack) of an app with one page and one Server Action form. We summed the `<script>` chunks referenced by the generated HTML, left out the `noModule` polyfill chunk that modern browsers skip, and compressed each chunk with brotli at quality 11. Result: 113,828 bytes brotli, 133,232 bytes gzip, 453,357 bytes uncompressed.
- **Intl.** Node 22.22.0, ICU 77.1, CLDR 47, tz 2025b. Browsers ship their own ICU, so the CI test suite must pin these outputs.
- **Packages checked.** lucide-react 1.52.0 and libphonenumber-js 1.13.14, from npm on 2026-10-06.

## Open questions

1. Have the mandatory ICT accessibility rules ordered in Rajive Raturi been notified? Do they require an ACR from a SaaS vendor that sells to private institutions?
2. Which WCAG version does the BIS text of IS 17802 cite? Our 2.1 AA mapping comes from secondary sources.
3. Does WebOTP work when S01 is embedded as a cross-origin iframe on an institution's site? What permission policy and SMS format does it need? Check before relying on it.
4. Do the pilot institutions need a Hindi or regional-language UI, not only Indic names? That brings UI text in Indic scripts, `lang` attributes, and maybe larger line heights for the UI itself.
5. Do iOS, macOS and Windows render all nine Indic scripts and Urdu on public pages, which use system fonts only? Confirm on the test devices.
6. Should Urdu-medium institutions get Noto Nastaliq Urdu for long messages?
