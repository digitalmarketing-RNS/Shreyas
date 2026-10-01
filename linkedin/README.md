# LinkedIn workspace

| File | What it is |
|---|---|
| `01-profile-audit.md` | Audit of `linkedin.com/in/best-digital-marketing-freelancer`, with rewrites ready to paste: headline, About, Featured, Experience, Skills, banner, recommendation request |
| `02-post-ai-reels.md` | Ready-to-post LinkedIn post about the two Claude-built reels (Naveen Tiles robots, RNS International School admissions 2027-28), plus first comment, alternative hooks and posting notes |
| `03-post-rnsis-reel.md` | Post for the RNS International School admissions reel on its own, with its own first comment |

## The skills

The 12 LinkedIn skills from
[sergebulaev/linkedin-skills](https://github.com/sergebulaev/linkedin-skills)
(MIT, commit `14d332b`, 29 Sep 2026) are installed in this repo:

- `.claude/skills/linkedin-*`: one folder per skill. Claude Code picks them up automatically in any session on this repo
- `.claude/references/`: the shared hook formulas, voice rules and algorithm notes the skills read, plus the license (`LICENSE-linkedin-skills`)

Ask in plain words and the matching skill loads:
"write a LinkedIn post about…", "audit my profile", "humanize this draft",
"plan my week on LinkedIn", "turn this video into a LinkedIn post".

### What's changed from upstream

| File | Change |
|---|---|
| `.claude/references/voice-profile.md` | Filled in for Shreyas (public facts only, since this repo is public). The voice fingerprint still needs 3-5 real posts: run `linkedin-humanizer --mode profile` |
| `.claude/references/story-bank.md` | Started with the two reels and public career facts. Run `linkedin-interviewer` to add more |
| `.claude/references/algorithm-heuristics.md` | Added: LinkedIn allows one video per post. To show two, join them into one file |
| `linkedin-profile-optimizer` (`SKILL.md` + `experience-skills-rules.md`) | Added: keep a keyword custom URL that backlinks already point to, because LinkedIn doesn't redirect the old one |

### What isn't installed

The upstream publishing and reading layers (Python `lib/`, Publora, Apify,
Pixfaro) are not included. The skills run in **draft-only mode**: each one
gives you text to paste into LinkedIn yourself. Nothing gets posted
automatically.
