import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,join} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/Afonso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:950});
  await page.goto(pathToFileURL(join(root,'galeria.html')).href);
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  assert.equal(await page.locator('article').count(),4);
  assert.ok(await page.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.screenshot({path:join(root,'qa',`galeria-${width}-escuro.png`),fullPage:true});
  await page.locator('#theme').click();
  assert.ok(await page.locator('body').evaluate(e=>e.classList.contains('light')));
  await page.screenshot({path:join(root,'qa',`galeria-${width}-claro.png`),fullPage:true});
  await page.locator('#photo').click();
  assert.equal(await page.locator('.portrait').first().evaluate(e=>getComputedStyle(e).visibility),'hidden');
  await page.locator('details').evaluateAll(es=>es.forEach(e=>e.open=true));
  await page.screenshot({path:join(root,'qa',`galeria-${width}-tamanhos.png`),fullPage:true});
  console.log(`PASS ${width}px: imagens, sem overflow, temas, foto sob bordas e tamanhos reais.`);
 }
}finally{await browser.close()}
