// Render review stills for a list of frames with one bundle + one browser.
// Usage: node scripts/stills.mjs <outDir> <frame> [frame...]
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const [outDir, ...frames] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: process.env.REMOTION_BROWSER ?? null});
const composition = await selectComposition({serveUrl, id: 'AdmissionsReel', puppeteerInstance: browser});
for (const f of frames) {
  const output = path.join(outDir, `f${String(f).padStart(4, '0')}.jpg`);
  await renderStill({composition, serveUrl, frame: Number(f), output, imageFormat: 'jpeg', jpegQuality: 85, puppeteerInstance: browser});
  console.log(output);
}
await browser.close({silent: true});
