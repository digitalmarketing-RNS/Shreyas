# Target to email mapping, and how to get the addresses

Emails referenced by number live in `06-outreach.md`.

---

## Why there are no addresses in this file

Two independent reasons, neither fixable by permission:

1. Every target site is refused by this session's network egress policy. That is
   an organisation-level block, not a setting I control.
2. `WebSearch` reaches the index but the contact pages do not surface an address
   in snippets.

I searched anyway. The result is the argument against guessing: a query for
priyankatanwar.in returned a Priyanka Tanwar who is an HR Executive at
Ads247365, a different Priyanka Tanwar at EXL, and a RocketReach profile for a
Priyankadevi Venkatachalam. Three wrong people. Guessed addresses from a domain
with no sending history produce bounces, and bounces cost you deliverability on
every later send.

You will get all of these in about twenty minutes yourself. Method at the bottom.

---

## Step 1: triage before you write anything

For each roundup, run this in Google:

```
site:mahakdigital.com "Shreyas"
```

Three outcomes:

| Result | Meaning | Send |
|---|---|---|
| Named, no link to eeatminds.in | Unlinked mention | **Email 1** (reclamation). Highest hit rate |
| Named, already linked | Done | Nothing. Log it and move on |
| Not named | Not on the list | **Email 2** (inclusion) |

To check whether a mention is linked: open the page, Ctrl+F your name, then look
at whether it is clickable. If it is, right click and copy the link address to
confirm it points at eeatminds.in and not somewhere else.

---

## Step 2: the map

### Group A: Bangalore and India freelancer roundups

Triage each with the `site:` query above. Most likely Email 1.

| # | Target page | Likely email |
|---|---|---|
| 1 | mahakdigital.com/best-digital-marketing-freelancer-in-bangalore/ | 1 or 2 |
| 2 | shakirdm360.in/top-digital-marketing-freelancers-in-bangalore-for-2026/ | 1 or 2 |
| 3 | priyankatanwar.in/top-10-digital-marketing-freelancers-in-bangalore-2026/ | 1 or 2 |
| 4 | digitalmarketingwithpriya.com/2026/01/30/top-5-digital-marketing-freelancer-bangalore-3/ | 1 or 2 |
| 5 | preetispace.com/best-digital-marketing-freelancer-in-bangalore/ | 1 or 2 |
| 6 | arsiyahub.com/ai-digital-marketing-freelancers-in-bangalore/ | 1 or 2 |
| 7 | karavalistudios.com/digital-marketing-freelancers-in-india/ | 1 or 2 |
| 8 | webhopers.com/top-10-seo-freelancers-in-bangalore | 2 |

**Cap this group at four sends.** All eight are competing freelancers, and you
publish a competing list yourself. Working the whole set is how the reciprocal
pattern in `06-outreach.md` gets built on purpose. Reclaim where you are already
mentioned, pitch one or two where you are not, then stop and spend the effort
outside this circle.

### Group B: guest posts

Published contributor guidelines, so these are legitimate invitations rather
than cold asks. All take **Email 3**, adjusted to each site's stated rules.

| Target | Rule to respect |
|---|---|
| iidm.co/digital-marketing-write-for-us/ | Wants 3 to 5 topic ideas before a draft. Educational only, no promotion. Docx |
| nexagrowth.co.uk/blog/write-for-us/ | Reviews each pitch. Wants something beyond what three other articles already say |
| serpmaestro.com/write-for-us/ | SEO and digital marketing |
| seoforcontractors.agency/write-for-us/ | 100 percent original, runs plagiarism checks |

IIDM is the best fit: Indian, relevant, and expects genuine expertise. Start there.

Most "write for us" pages publish the submission address directly on the page,
so this group is the easiest to get addresses for.

### Group C: clients

**Email 5.** You already have these addresses. This is the highest-value group
in the whole document and the only one needing no research.

Pick the three clients most likely to say yes. Real businesses in varied
industries linking to you is exactly the diversity your profile lacks, and it is
the one group no competitor can replicate.

### Group D: Google Partners and Meta Business Partners

No email needed. Application through their own portals. Check whether you hold
partner status or individual certification first. Highest authority link
available to you if it is the former.

### Group E: podcasts and Source of Sources

**Email 4** for podcasts, after you have actually listened to an episode.
Source of Sources needs no template: reply to the journalist's question directly
and usefully, within the hour.

---

## Step 3: getting the addresses, roughly twenty minutes

In order. Stop at the first that works.

1. **The site's own contact page.** These are freelancers who want client
   enquiries, so most publish an address openly. Try `/contact`, `/about`, and
   the footer
2. **`site:domain.com "@"`** in Google, which sometimes surfaces an address that
   is on the page but not in the main snippet
3. **LinkedIn contact panel.** Often lists a business email
4. **WHOIS**, via `whois domain.com` or any lookup site. Small Indian domains
   frequently leave registrant contact public
5. **Hunter.io free tier.** 25 searches a month, and it returns a confidence
   score. Only use a result scoring above 90
6. **Contact form.** Lower response rate, zero bounce risk. Always better than a
   guess

Two rules:

- **Never send to an unverified address.** One bounce is survivable. A pattern
  of them on a new domain is not
- **Match the person to the site before sending.** The Priyanka Tanwar case
  above is the whole reason. Confirm the person you found actually runs the site
  you are pitching

---

## Suggested first week

Ten sends, not forty.

| Day | Send | Emails |
|---|---|---|
| 1 | Three clients | 5 |
| 2 | Triage all eight Group A pages, send reclamations only | 1 |
| 3 | IIDM guest post pitch | 3 |
| 4 | One or two Group A inclusion pitches | 2 |
| 5 | Check Google and Meta partner eligibility | none |

Log every send in `02-tracker.csv`. Follow up once after seven days, then stop.
