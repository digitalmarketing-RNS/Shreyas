// Makes the "text built in" banner videos for the existing Owl carousel slide.
//
//   python3 build_video.py               # once, makes .cache/master.mp4
//   NODE_PATH=$(npm root -g) node render.cjs
//
// It renders the hero's text layer from preview.html + hero.css as a
// transparent PNG, then lays it over the video loop with ffmpeg, so the
// flat video matches the coded hero exactly. Needs Playwright with Chromium,
// network access to Google Fonts, and ffmpeg.

const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const here = __dirname;
const master = path.join(here, '.cache', 'master.mp4'); // 2256x916, from build_video.py
const out = path.join(here, 'exports');
const page = 'file://' + path.join(here, 'preview.html');

// Text layer only: no video, no page background, no pause button (nothing to click in a flat video).
const textOnly = (height) => `
  html, body { background: transparent !important; }
  .nt-vhero { background: transparent !important; height: ${height}px; min-height: 0 !important; }
  .nt-vhero__video, .nt-vhero__toggle { display: none !important; }
`;
// Phone slide: headline and one button only, so the video still shows above the text.
const phone = `
  .nt-vhero .nt-vhero__lede, .nt-vhero .nt-btn--ghost, .nt-vhero__bar { display: none !important; }
  .nt-vhero__copy { padding-bottom: 30px; }
  .nt-vhero__actions { margin-top: 24px; }
  .nt-vhero__shade {
    background: linear-gradient(0deg,
      rgba(var(--nt-shade), .94) 0%, rgba(var(--nt-shade), .84) 40%,
      rgba(var(--nt-shade), .45) 62%, rgba(var(--nt-shade), .08) 100%) !important;
  }
`;

const jobs = [
  { name: 'naveen-hero-banner-1920x780', width: 1920, height: 780, scale: 1, vf: 'scale=1920:780:flags=lanczos', maxrate: '3M' },
  { name: 'naveen-hero-banner-720x900', width: 360, height: 450, scale: 2, css: phone, vf: 'crop=733:916,scale=720:900:flags=lanczos', maxrate: '1.6M' },
];

(async () => {
  if (!fs.existsSync(master)) throw new Error('Run "python3 build_video.py" first: .cache/master.mp4 is missing.');
  fs.mkdirSync(out, { recursive: true });
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ proxy });

  for (const job of jobs) {
    const ctx = await browser.newContext({
      viewport: { width: job.width, height: job.height },
      deviceScaleFactor: job.scale,
      reducedMotion: 'reduce', // text fully in place, no entrance animation
    });
    const tab = await ctx.newPage();
    await tab.goto(page, { waitUntil: 'networkidle' });
    await tab.addStyleTag({ content: textOnly(job.height) + (job.css || '') });
    await tab.evaluate(() => document.fonts.ready);

    const overlay = path.join(here, '.cache', `${job.name}-text.png`);
    await tab.screenshot({ path: overlay, omitBackground: true, clip: { x: 0, y: 0, width: job.width, height: job.height } });
    await ctx.close();

    const mp4 = path.join(out, `${job.name}.mp4`);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', master, '-i', overlay,
      '-filter_complex', `[0:v]${job.vf}[bg];[bg][1:v]overlay=0:0:format=auto,format=yuv420p[v]`,
      '-map', '[v]', '-an', '-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-crf', '24',
      '-maxrate', job.maxrate, '-bufsize', '6M', '-movflags', '+faststart', mp4]);
    // still of the first frame, for approvals and as the slide's poster
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', mp4, '-frames:v', '1', '-q:v', '3', path.join(out, `${job.name}.jpg`)]);
    console.log(`✓ ${job.name}  ${(fs.statSync(mp4).size / 1024).toFixed(0)} KB`);
  }

  await browser.close();
})();
