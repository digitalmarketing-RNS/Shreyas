# Tile SEO outreach: playbook

Selling EEAT Minds SEO to tile companies. Owner: Shreyas V Patil.

**Status (23 Oct 2026): pilot batch of 10 emails sitting in Gmail drafts (eeatminds.in@gmail.com),
waiting for Shreyas's OK.** Once approved, Claude sends up to 20 new emails a day plus follow-ups.

> **This repo is public.** Names, personal emails, phone numbers and security findings about
> prospects live only in the private Google Drive folder **"EEAT Tile Outreach (private)"**:
> - *Tile Outreach Tracker* (Google Sheet): one row per prospect, decision-maker, channels, verified hook, status
> - *Tile Outreach: messages to send by hand* (Google Doc): LinkedIn notes, WhatsApp messages, Instagram DMs, call scripts
>
> Never commit prospect contact data or "their site is hacked" findings here.

---

## The offer

| Item | Value |
|---|---|
| Price | ₹15,000 / month, 3-month minimum (Gulf: "INR 15,000/month, under USD 200") |
| Scope | Technical fixes, keyword pages, links, monthly ranking report |
| Free hook | 1-page audit of their site with the first 5 fixes |
| Proof | Naveen Tile (Murudeshwar Ceramics) is #1 on Google India for "best tile company" and "top tiles company", above Kajaria's homepage |

**Proof check (23 Oct 2026):** #1 for both phrases from Bangalore, Mumbai and Delhi.
Not visible in US results, so always say "Google India". Naveen Tile approved being named.
Re-check before each big batch; if it drops, stop saying "#1" until it's back.

Don't sell Naveen Tile's own keywords ("best tile company") to its competitors.
Pitch manufacturers on **export** and **product** keywords instead
("porcelain tiles manufacturer India", "parking tiles manufacturer India").

---

## Who we target

| Segment | Where | Best channel | Hook that works |
|---|---|---|---|
| Tile dealers / showrooms | Indian cities | WhatsApp, Instagram DM, phone | "You have 200+ JustDial reviews but no website, so Google sends your buyers to JustDial, which lists your competitors" |
| Tile manufacturers / exporters | Morbi, Gujarat | Email to named MD/partner + LinkedIn + WhatsApp | "Foreign buyers searching 'porcelain tiles manufacturer India' see Porcious, Italus, Bluetone, not you" |
| Tile traders | Dubai / UAE / GCC | Email to named CEO/MD + LinkedIn | "When I searched 'tiles shop in Dubai', you weren't on page 1" |

Most Indian dealers have **no email and no real website**, only IndiaMART template sites
or JustDial. Reach them on WhatsApp/Instagram, not email.

---

## Reaching the decision-maker, not info@

| Step | Tool | Cost |
|---|---|---|
| 1. Find companies | Apollo company lookup, Firecrawl search of city/product keywords | Free / Firecrawl credits |
| 2. Find the decision-maker | **Lusha** `prospecting_contact_search` by company domain, seniority = founder, partner, c-suite, VP, director | 1 credit per 25 people |
| 3. Reveal their email | **Lusha** `prospecting_contact_enrich`, reveal = emails only | 1 credit per email |
| 4. If Lusha has nothing | Indian company registry (ZaubaCorp, FalconEbiz: directors/partners of every Pvt Ltd/LLP), public LinkedIn via web search | Free |
| 5. Last resort | Company inbox, addressed to the named person in subject and greeting | Free |

Lusha is on the **free plan: 40 credits** (11 used in the pilot). Phone reveals cost **5 credits**,
so reveal emails only, and phones only for high-value prospects with no email.
Apollo (connected) is on its free plan, which blocks people search and email reveal, so it's used
for company lists only.

No guessed addresses (firstname@company). They can't be verified from here, and bounces hurt the
sending reputation of eeatminds.in@gmail.com.

**LinkedIn:** no connector exists, and logged-in scraping gets accounts banned. Claude reads public
profiles via search and writes the LinkedIn notes; Shreyas sends them.

---

## The sequence (per prospect)

| Day | Channel | What | Who sends |
|---|---|---|---|
| 0 | Email 1 | Specific finding + Naveen proof + price + "free audit?" | Claude (after approval) |
| 0 | LinkedIn | Connection note to the named decision-maker | Shreyas (Claude drafts) |
| 1 | WhatsApp / Instagram | Short personal message to the listed mobile | Shreyas (Claude drafts) |
| 3 | Email 2 | Same thread: one more finding + screenshot of the Naveen #1 result | Claude |
| 9 | Email 3 | Short breakup: "closing the loop, reply anytime" | Claude |
| Any reply | | Claude drafts the reply, builds the free audit (Ubersuggest + Firecrawl) and a proposal deck (Gamma) | Claude drafts, Shreyas approves |

**Email 2 template**

> Subject: (same thread)
> Hi {name}, one more thing I spotted on {domain}: {second verified finding}.
> Here's the Naveen Tile result I mentioned: {screenshot}. Happy to send the free audit if useful.
> Shreyas

**Email 3 template**

> Subject: (same thread)
> Hi {name}, I'll stop here so I'm not filling your inbox. If ranking for {keyword} becomes a
> priority, just reply and I'll send the audit the same day.
> Shreyas

### Rules

- Every claim in a message is something Claude checked on the live site or search results that day.
  No made-up numbers, no "I noticed your traffic dropped" guesses.
- Check the claim before it goes out. Example from the pilot: a "noindex" tag that looked damning
  turned out to come from an embedded chat widget, not the client's site, so it was dropped.
- Every email has an opt-out line, and a "no" is honoured immediately.
- Max 20 new cold emails/day from Gmail. Max ~15 WhatsApps/day, one message + one follow-up, then stop.
- Never bulk-blast WhatsApp, never automate LinkedIn or Instagram.
- Stop a sequence the moment anyone replies.

### Realistic expectations

Personalised cold outreach usually gets a few replies per 100 contacts, and only some of
those become paying clients. Plan on contacting 100+ companies for each client won. The daily
cadence matters more than any single message.

---

## Files in this folder

- `README.md`: this playbook
- `queue.csv`: next companies to research (public company info only). Pilot companies and
  ones already ranking on page 1 are left out.
