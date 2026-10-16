const {chromium}=require('C:/Users/Afonso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.route('**/*.supabase.co/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
    await page.goto('http://127.0.0.1:3180/termos.html');
    const terms=await page.locator('body').innerText();
    assert.match(terms,/13 anos/); assert.match(terms,/7 dias/); assert.doesNotMatch(terms,/PREENCHER|não são reembolsáveis/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.goto('http://127.0.0.1:3180/exclusao.html');
    const deletion=await page.locator('body').innerText();
    assert.match(deletion,/não exclui a conta nem registra um pedido automaticamente/);
    assert.equal(await page.getByRole('button',{name:'Preparar e-mail'}).count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.goto('http://127.0.0.1:3180/');
    for(const name of ['Instagram','X / Twitter','TikTok']) {
      const href=await page.getByRole('link',{name,exact:true}).getAttribute('href');
      assert.ok(href.startsWith('https://'));
    }
    assert.equal(await page.locator('#countdown').count(),0);
    console.log('PASS: Terms, deletion explanation, social links and responsive legal pages');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
