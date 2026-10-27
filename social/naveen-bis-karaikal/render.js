// Renders every <section class="art" data-out="..."> in the source pages to export/<data-out>.png
// Usage: node render.js                 (all pages)
//        node render.js single.html     (one page)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const pages = process.argv.slice(2).filter(a => a.endsWith('.html'));
const sources = pages.length ? pages : ['single.html', 'posts.html'];

(async () => {
  const outDir = path.join(__dirname, 'export');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 2000 }, deviceScaleFactor: 1 });
  for (const src of sources) {
    await page.goto('file://' + path.join(__dirname, src));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    for (const el of await page.$$('section.art[data-out]')) {
      const name = await el.getAttribute('data-out');
      await el.screenshot({ path: path.join(outDir, name + '.png'), animations: 'disabled' });
      console.log(src, '->', name + '.png');
    }
  }
  await browser.close();
})();
