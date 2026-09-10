// Step 6 — render the paginated HTML to PDF with Chromium.
//
//   node 6_render_pdf.js                       # pdf/ -> Naveen-Tile-Master-Catalogue.pdf
//   SRC=pdf-hi OUT=Catalogue.pdf node 6_render_pdf.js
//   PAGES=1-42 OUT=Vol-1.pdf node 6_render_pdf.js   # split a run that is too large to send
//
// preferCSSPageSize honours the @page A4 rule, and every .page div is already
// exactly A4 with a break after it, so Chromium paginates 1:1 with the layout.
const { chromium } = require('playwright');

const SRC   = process.env.SRC   || 'pdf';
const OUT   = process.env.OUT   || 'Naveen-Tile-Master-Catalogue.pdf';
const PAGES = process.env.PAGES || '';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage();
  await page.goto(`file://${process.cwd()}/${SRC}/catalogue.html`,
                  { waitUntil: 'networkidle', timeout: 300000 });
  await page.waitForTimeout(6000);            // let the webfonts settle before layout

  const count = await page.evaluate(() => document.querySelectorAll('.page').length);
  await page.pdf({
    path: OUT, format: 'A4', printBackground: true, preferCSSPageSize: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    ...(PAGES ? { pageRanges: PAGES } : {}),
  });
  console.log(`${OUT}: ${PAGES || `1-${count}`} of ${count} pages`);
  await browser.close();
})();
