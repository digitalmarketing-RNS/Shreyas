// Renders every <section class="art" data-out="..."> in posts.html to export/<data-out>.png
// Usage: node render.js            (1x, exact platform size)
//        node render.js --preview  (also writes a contact sheet to export/_preview.png)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const outDir = path.join(__dirname, 'export');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 2000 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'posts.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const arts = await page.$$('section.art[data-out]');
  for (const el of arts) {
    const name = await el.getAttribute('data-out');
    await el.screenshot({ path: path.join(outDir, name + '.png'), animations: 'disabled' });
    console.log('wrote', name + '.png');
  }
  if (process.argv.includes('--preview')) {
    await page.screenshot({ path: path.join(outDir, '_preview.png'), fullPage: true });
  }
  await browser.close();
})();
