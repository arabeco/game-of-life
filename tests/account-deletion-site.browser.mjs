import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/Afonso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root='C:/Users/Afonso/Desktop/glyph-landing';
const server=http.createServer((req,res)=>{
  const relative=decodeURIComponent(req.url.split('?')[0]);
  if(relative.includes('..')){res.writeHead(403).end();return;}
  const path=root+relative;
  if(!fs.existsSync(path)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.html')?'text/html':'application/octet-stream');
  res.end(fs.readFileSync(path));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.route('https://**/*',route=>route.fulfill({body:'',contentType:'text/javascript'}));
  await page.addInitScript(()=>{
    window.calls=[];window.deletionMode='success';
    window.supabase={createClient:()=>({auth:{
      getUser:async()=>({data:{user:null}}),onAuthStateChange:()=>{},
      signInWithPassword:async()=>({data:{user:{email:'teste@example.invalid'}}}),
      signInWithOtp:async args=>{window.calls.push(args);return {};},signOut:async()=>({}),
    },functions:{invoke:async(name,args)=>{
      window.calls.push({name,...args});
      return window.deletionMode==='failed'?{data:{success:false,requestId:42,error:'Pedido registrado para retentativa.'}}:{data:{success:true,requestId:42,cleanupPending:true}};
    }}})};
  });
  const url=`http://127.0.0.1:${server.address().port}/exclusao.html`;
  await page.goto(url);
  await page.locator('#del-email').fill('teste@example.invalid');
  await page.locator('#deletion-email-link').click();
  assert.equal(await page.evaluate(()=>window.calls[0].options.shouldCreateUser),false);
  assert.equal(await page.locator('#deletion-form').isVisible(),false);
  await page.locator('#del-password').fill('fixture-only');
  await page.getByRole('button',{name:'Entrar com senha'}).click();
  await page.locator('#deletion-form').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.name==='account-delete').length),0,'sign in never deletes');
  await page.getByRole('button',{name:'Excluir minha conta',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.name==='account-delete').length),0,'confirmation required');
  await page.locator('#del-confirm').check();
  await page.evaluate(()=>window.deletionMode='failed');
  await page.getByRole('button',{name:'Excluir minha conta',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('deletion-message').textContent.includes('42'));
  assert.ok((await page.locator('#deletion-message').innerText()).includes('retentativa'));
  assert.equal(await page.locator('#deletion-form').isVisible(),true);
  await page.evaluate(()=>window.deletionMode='success');
  await page.getByRole('button',{name:'Excluir minha conta',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('deletion-message').textContent.includes('Sua conta foi excluída'));
  assert.equal(await page.locator('#deletion-form').isVisible(),false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('#deletion-message').scrollIntoViewIfNeeded();
  await page.screenshot({path:'output/account-deletion-site/mobile.png'});
  console.log('PASS: mobile site, no auto-delete on login/link, explicit confirmation, failed request protocol, cleanup-pending success. Auth/backend mocked.');
}finally{await browser.close();server.close();}
