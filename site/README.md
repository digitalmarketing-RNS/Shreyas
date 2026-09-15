# shreyasvpatil.com

Static personal-brand site for **Shreyas V Patil**, SEO freelancer in Bangalore.
Built to rank for *"SEO freelancer in Bangalore"*. Strategy and SERP analysis
live in [`../SEO-STRATEGY.md`](../SEO-STRATEGY.md).

## Running it

No build step. It is plain HTML, one CSS file and one JS file.

```bash
cd site && python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deploying

Upload the contents of `site/` to any static host — Netlify, Vercel, Cloudflare
Pages, GitHub Pages or plain nginx. Requirements:

- Serve `404.html` for not-found responses
- Pick **one** canonical host (`www` or bare) and 301 the other; the canonicals
  currently declare `https://www.shreyasvpatil.com`
- HTTPS with HSTS
- Long cache headers on `/assets/**`, short on HTML

## Structure

```
site/
├── index.html                       money page — "SEO freelancer in Bangalore"
├── about/                           entity + author page (E-E-A-T)
├── services/                        eight service areas, anchored
├── local-seo-bangalore/             local sub-intent — map pack, GBP
├── case-studies/                    named clients, verification sources
├── pricing/                         published rates + market context
├── contact/                         free audit request
├── blog/                            two posts + RSS
├── 404.html
├── robots.txt                       AI crawlers explicitly allowed
├── sitemap.xml
├── llms.txt                         facts for AI answer engines
└── assets/
    ├── css/main.css                 the whole design system
    ├── js/main.js                   progressive enhancement only
    └── img/                         favicon + OG cover
```

## Design system

Tokens are at the top of `assets/css/main.css`. Everything derives from them.

- **Fraunces** — display serif (variable: `opsz`, `SOFT`, `WONK`)
- **Schibsted Grotesk** — UI and body
- **JetBrains Mono** — all numerals, labels and data readouts

Colour: deep ink ground, one saffron accent (`--signal`), and a green
(`--verify`) reserved strictly for independently verifiable claims. Do not use
the green decoratively — the whole point is that it means something.

## Before launch

See §9 of the strategy document. In short: confirm the domain, add a real phone
number and address to the `ProfessionalService` schema, wire the contact form to
a real endpoint, and add a photograph at `assets/img/shreyas-v-patil.jpg`.

## Editing

Pages are standalone HTML — edit them directly. The header, footer and CTA band
are duplicated across pages by design (no build step). If you change one,
change all of them; `grep -rl "footer__grid" site/` finds every copy.
