# Tile SEO outreach: playbook

Selling EEAT Minds SEO to tile companies. Owner: Shreyas V Patil.

**Status (23 Oct 2026): 23 cold emails sent from eeatminds.in@gmail.com** (Morbi/Gulf SEO-gap
pitches, national brands' marketing heads, companies hiring marketers, and three South India
brands). 13 more "page 2" emails go out 24 Oct. Follow-ups go out on Day 3 to anyone who hasn't
replied. Up to 20 new emails a day.

**Gmail connector gotcha:** any web address in an email body (even `example.com` or `google.co.in`)
is rewritten into a long google.com redirect link, which looks like spam. Write "your website" and
"Google India" instead, and keep the signature to name + phone.

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
| Free hook | Small only: "want the 3 fixes I'd make first?" or a one-page note. No full free audits (Shreyas, 23 Oct) |
| Proof | Naveen Tile (Murudeshwar Ceramics) is #1 on Google India for "best tile company" and "top tiles company", above Kajaria's homepage |

**Proof check (23 Oct 2026):** #1 for both phrases from Bangalore, Mumbai and Delhi.
Not visible in US results, so always say "Google India". Naveen Tile approved being named.
Re-check before each big batch; if it drops, stop saying "#1" until it's back.

Don't sell Naveen Tile's own keywords to its competitors. As of 23 Oct, Naveen ranks top 4 on
Google India for "best/top tile company" **and** for "vitrified / wall / porcelain tiles
manufacturer in India", so those are off-limits for rival manufacturers. Before pitching a
keyword, check that Naveen isn't on page 1 for it. Clean keywords on 23 Oct: "tiles manufacturer
in Morbi", "tiles exporter from India", "porcelain slab manufacturer in India", "parking tiles
manufacturer in India/Morbi", and city showroom searches outside Karnataka.

---

## Who we target

| Segment | Where | Best channel | Hook that works |
|---|---|---|---|
| Tile dealers / showrooms | Indian cities | WhatsApp, Instagram DM, phone | "You have 200+ JustDial reviews but no website, so Google sends your buyers to JustDial, which lists your competitors" |
| Tile manufacturers / exporters | Morbi, Gujarat | Email to named MD/partner + LinkedIn + WhatsApp | "Foreign buyers searching 'porcelain tiles manufacturer India' see Porcious, Italus, Bluetone, not you" |
| Tile traders | Dubai / UAE / GCC | Email to named CEO/MD + LinkedIn | "When I searched 'tiles shop in Dubai', you weren't on page 1" |
| National tile brands | India (Somany, Nitco, Orientbell, Simpolo, Johnson, AGL, Varmora…) | Email to CMO / Head of Marketing + LinkedIn to them **and** their digital manager | City showroom searches: "In Pune, Hyderabad, Bangalore, Chennai and Mumbai, Orientbell, Simpolo and Johnson have city pages on page 1; you have none" (or, for the leaders, the one city where they slip) |

### National brands: what's different

- **Who decides SEO:** the CMO / Head of Marketing, not the MD. Their digital marketing manager
  usually runs the vendor, so contact both (email the senior one, LinkedIn both).
- **No price in the first email.** ₹15,000/month reads as too small for a listed brand. Offer a free
  city-by-city report for their top 20 cities and quote after scope.
- **The hook is city pages**, not "you're not on page 1 for your product". Leaders (Orientbell,
  Simpolo, Johnson) get the one city where they slip; brands with no city pages get the 5-city gap.
- **No cold WhatsApp to corporate execs.** Email + LinkedIn only.
- **Kajaria is skipped on purpose:** the Naveen Tile proof is framed as beating Kajaria.
- **Watch the Naveen conflict:** don't take on brand-level keywords ("best tile company") for a
  national brand while Naveen Tile is a client.

### The "page 2" play (best response odds)

Companies sitting at **positions 11-30** for a buyer search are already trying to rank and can
see they're close, so "you're #14, here's what's holding you back" lands better than a cold
"you need SEO".

1. Search 10-12 buyer phrases with Firecrawl (`limit: 30`, `location` set to the city or "India").
   Manufacturers: Morbi, export, product phrases. Dealers: "tiles showroom/shop/dealers in {city}".
2. Keep real company sites at positions 11-30. Drop directories, marketplaces, listicles and
   anyone already contacted.
3. Re-run the same phrase from a second city (or a close variant). Only pitch positions that
   hold on both checks, and say "when I searched today".
4. Skip any phrase where Naveen Tile is on page 1.
5. Fetch the homepage and find one or two concrete, checkable reasons (title missing the city,
   H1 that says "About us", 200-character title, empty H1, placeholder founder name in schema).
   If a heading is filled by JavaScript, don't claim it's empty.
6. Find the decision-maker: one Lusha search across all the domains at once (1 credit per 25
   people), the company registry for Pvt Ltd/LLP directors, the "About" page, public LinkedIn.
7. Email: their exact position + who is above them + 1-2 reasons + Naveen proof + Rs 15,000/month
   + "want the other 2 fixes?". WhatsApp and LinkedIn notes go in the private Drive doc.

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

Lusha is on the **free plan: 40 credits** (33 used by 23 Oct, 7 left). Phone reveals cost **5 credits**,
so reveal emails only (`waterfallEnabled: false`), and phones only for high-value prospects with
no email. Search many domains in one call: 18 domains returned 17 senior people for 1 credit.
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
| 0 | Email 1 | Specific finding + Naveen proof + price + "want the 3 fixes?" | Claude (after approval) |
| 0 | LinkedIn | Connection note to the named decision-maker | Shreyas (Claude drafts) |
| 1 | WhatsApp / Instagram | Short personal message to the listed mobile | Shreyas (Claude drafts) |
| 3 | Email 2 | Same thread: one more finding + screenshot of the Naveen #1 result | Claude |
| 9 | Email 3 | Short breakup: "closing the loop, reply anytime" | Claude |
| Any reply | | Claude drafts the reply and the promised fixes (Firecrawl checks), and a proposal deck (Gamma) once they're interested | Claude drafts, Shreyas approves |

**Email 2 template**

> Subject: (same thread)
> Hi {name}, one more thing I spotted on {domain}: {second verified finding}.
> Here's the Naveen Tile result I mentioned: {screenshot}. Happy to send the 3 fixes if useful.
> Shreyas

**Email 3 template**

> Subject: (same thread)
> Hi {name}, I'll stop here so I'm not filling your inbox. If ranking for {keyword} becomes a
> priority, just reply and I'll send the fixes the same day.
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
- `queue.csv`: next companies to research (public company info only). Companies already
  contacted are left out. Rows sourced "Google page 2-3 check" carry the position seen that day;
  re-check before pitching.
