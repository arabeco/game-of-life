const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Afonso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve('C:/Users/Afonso/Desktop/glyph-landing');
const server = http.createServer((req,res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '') || 'index.html');
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const page = await browser.newPage();
    await page.route('**/*.supabase.co/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
    for (const width of [390,1440]) {
      await page.setViewportSize({width,height:900});
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      assert.ok(await page.locator('#btn-hero-download').isDisabled());
      assert.equal(await page.locator('a[href*="app.glyph.life"], a[href*="play.google.com"]').count(),0);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth + 1),false);
      await page.screenshot({path:`output/public-access-${width}.png`});
      await page.locator('#link-hero-waitlist').click();
      assert.ok(await page.locator('#hero-form').isVisible());
      console.log(`PASS ${width}px: acesso desativado, sem overflow, lista de interesse abre.`);
    }
  } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
