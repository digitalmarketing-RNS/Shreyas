// Exports the hero as flat banner images for the existing Owl carousel slide.
//
//   NODE_PATH=$(npm root -g) node render.cjs
//
// Needs Playwright with Chromium, and network access to naveentile.com and
// Google Fonts. WebP files need ImageMagick's `convert`; without it you still
// get PNG and JPG.

const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const here = __dirname;
const out = path.join(here, 'exports');
const page = 'file://' + path.join(here, 'preview.html');

// Phone slide only: keep the headline, one button and the mosaic.
const compact = `
  .nt-hero .nt-hero__lede, .nt-hero .nt-hero__link, .nt-hero .nt-hero__clients,
  .nt-hero .nt-hero__stats, .nt-hero .nt-btn--ghost { display: none; }
  .nt-hero__copy { padding: 30px 18px 22px; }
  .nt-hero .nt-hero__title { font-size: 40px; }
  .nt-hero__actions { margin-top: 22px; }
  .nt-hero__mosaic { height: 317px; }
`;

const jobs = [
  { name: 'naveen-hero-1600x650', width: 1600, height: 650, scale: 1 },
  { name: 'naveen-hero-mobile-800x1120', width: 400, height: 560, scale: 2, css: compact },
];

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ proxy });

  for (const job of jobs) {
    const ctx = await browser.newContext({
      viewport: { width: job.width, height: job.height },
      deviceScaleFactor: job.scale,
      reducedMotion: 'reduce', // no entrance animation in a still image
    });
    const tab = await ctx.newPage();
    await tab.goto(page, { waitUntil: 'networkidle' });
    if (job.css) await tab.addStyleTag({ content: job.css });
    await tab.evaluate(() => document.fonts.ready);

    const box = await tab.$eval('.nt-hero', (el) => {
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height };
    });
    if (Math.round(box.height) !== job.height) {
      console.warn(`! ${job.name}: hero is ${Math.round(box.height)}px tall, expected ${job.height}px. Copy may be too long.`);
    }

    const png = path.join(out, `${job.name}.png`);
    await tab.screenshot({ path: png, clip: { x: 0, y: 0, width: job.width, height: job.height } });
    await tab.screenshot({ path: path.join(out, `${job.name}.jpg`), type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: job.width, height: job.height } });

    try {
      execFileSync('convert', [png, '-quality', '84', '-define', 'webp:method=6', path.join(out, `${job.name}.webp`)]);
      fs.unlinkSync(png); // keep the repo light: WebP for the site, JPG for sharing
    } catch {
      console.warn(`! ImageMagick not found: kept ${job.name}.png instead of WebP.`);
    }
    console.log(`✓ ${job.name}`);
    await ctx.close();
  }

  await browser.close();
})();
