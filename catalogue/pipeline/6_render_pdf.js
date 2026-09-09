const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const p = await b.newPage();
  await p.goto('file://' + process.cwd() + '/pdf/catalogue.html', {waitUntil:'networkidle', timeout:300000});
  await p.waitForTimeout(6000);
  const n = await p.evaluate(()=>document.querySelectorAll('.page').length);
  console.log('page divs:', n);
  await p.pdf({ path:'Naveen-Tile-Master-Catalogue.pdf', format:'A4',
                printBackground:true, preferCSSPageSize:true,
                margin:{top:'0',right:'0',bottom:'0',left:'0'} });
  await b.close();
})();
