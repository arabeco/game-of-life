import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createAnonClient } from '../_smoke.supabase.mjs';
const require=createRequire(import.meta.url);
export const root=path.resolve(import.meta.dirname,'../..');
export const privatePath=path.join(root,'temp/mega-journey-accounts.json');
export const output=path.join(root,'docs/reports/mega-journey',new Date().toISOString().replace(/[:.]/g,'-'));
export const accounts=[];
export const results=[];
fs.mkdirSync(output,{recursive:true});
const buildIndex=path.join(root,'dist/index.html');
const environment={startedAt:new Date().toISOString(),url:process.env.SMOKE_URL||'http://127.0.0.1:4180/',version:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,revision:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),builtIndexSha256:fs.existsSync(buildIndex)?createHash('sha256').update(fs.readFileSync(buildIndex)).digest('hex'):null};
fs.writeFileSync(path.join(output,'environment.json'),JSON.stringify(environment,null,2));
const save=()=>{fs.mkdirSync(path.dirname(privatePath),{recursive:true});fs.writeFileSync(privatePath,JSON.stringify(accounts.map(({label,email,password,userId,session,nickname,deleted})=>({label,email,password,userId,session,nickname,deleted}))));};
export async function createPlayer(label){
 if(!accounts.length && fs.existsSync(privatePath))throw Error('Há contas de uma execução interrompida. Execute npm run smoke:journey:cleanup antes de continuar.');
 const client=createAnonClient();const email=`codex-mega-${label}-${Date.now()}@example.com`;
 const password='QA-'+crypto.randomUUID()+'!aA1';
 const signed=await client.auth.signUp({email,password});if(signed.error)throw signed.error;
 const a={label,email,password,userId:signed.data.user?.id,session:signed.data.session,client};accounts.push(a);save();
 if(!a.session){const login=await client.auth.signInWithPassword({email,password});if(login.error)throw login.error;a.session=login.data.session;save();}
 a.nickname=`QA Mega ${label} ${String(Date.now()).slice(-6)}`;
 const seeded=await client.from('user_profiles').upsert({id:a.userId,email,nickname:a.nickname,is_premium:false,role:'user',wallet:{gold:600,fragments:2000},is_online:false,avatar_url:'/assets/catalog/interface/insignia_rank_1_vagante.webp',background_url:'',skin:'BASIC',theme_preference:'dark',level:1,nobility:{exp:0,rankId:'vagante'},chests:[],visible_widgets:[],unlocked_skins:{BASIC:true},unlocked_items:{ui_skins:{BASIC:true}},completed_season_missions:['__flag_terms_accepted_v1','__flag_tutorial_completed_v1'],onboarding_completed_at:new Date().toISOString(),onboarding_dismissed_at:new Date().toISOString(),starter_rewards_pending:false});if(seeded.error)throw seeded.error;
 save();return a;
}
export async function cleanup(){
 for(const a of accounts){if(a.deleted)continue;try{
  if(!a.email.startsWith('codex-mega-'))throw Error('Conta fora da fixture');
  const identity=await a.client.auth.getUser();if(identity.data.user?.id!==a.userId)throw Error('Identidade divergente');
  const r=await a.client.functions.invoke('account-delete',{body:{blockReentry:false,reason:'Fim do megasmoke autorizado; conta temporaria QA'}});
  if(r.error||!r.data?.success)throw Error(r.error?.message||'Exclusão não confirmada');a.deleted=true;
  results.push({id:'cleanup-'+a.label,status:'PASS',evidence:'backend real: conta temporária excluída'});
 }catch(e){results.push({id:'cleanup-'+a.label,status:'FAIL',error:e.message});}save();}
 if(accounts.length&&accounts.every(a=>a.deleted))fs.rmSync(privatePath);
}
export async function launch(){
 let pw;try{pw=require('playwright');}catch{pw=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Afonso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');}
 return pw.chromium.launch({headless:true,executablePath:process.env.MEGA_BROWSER||'C:/Users/Afonso/AppData/Local/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-win64/chrome-headless-shell.exe',args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
}
export async function playerPage(browser,a,url){
 const ctx=await browser.newContext({viewport:{width:430,height:1000},locale:'pt-BR',recordVideo:{dir:path.join(output,'videos')},serviceWorkers:'block'});
 await ctx.addInitScript(s=>localStorage.setItem('gol-supabase-auth',JSON.stringify(s)),a.session);
 const page=await ctx.newPage();page.setDefaultTimeout(18000);
 const rpc=[];page.megaRpc=rpc;page.on('response',async response=>{
  if(!response.url().includes('/rest/v1/rpc/'))return;
  try{const data=await response.json();rpc.push({rpc:new URL(response.url()).pathname.split('/').pop(),status:response.status(),success:data?.success,itemId:data?.item_id,duplicate:data?.is_duplicate,fragments:data?.fragments_gained,code:data?.code,error:data?.error,message:data?.message});fs.writeFileSync(path.join(output,'rpc-'+a.label+'.json'),JSON.stringify(rpc,null,2));}catch{}
 });
 await page.goto(url);await page.locator('#nav-assets').waitFor({timeout:60000});
 await page.waitForTimeout(2500);await unlock(page);
 await page.waitForTimeout(1500);
 for(let i=0;i<5;i++){const b=page.getByRole('button',{name:/^(Prosseguir|Continuar|Desligar dicas|Entendi)$/i}).first();if(!await b.isVisible())break;await b.click();await page.waitForTimeout(500);}
 return page;
}
export async function step(id,page,fn){
 if(process.env.MEGA_ONLY&&!process.env.MEGA_ONLY.split(',').some(prefix=>id.startsWith(prefix))){results.push({id,status:'SKIPPED',evidence:'Filtro de diagnóstico'});return false;}
 const start=Date.now();await page.bringToFront();try{const details=await fn();results.push({id,status:'PASS',evidence:details?.evidence||'UI real (sem confirmação de transação)',details,ms:Date.now()-start});console.log('PASS',id);return true;}
 catch(e){results.push({id,status:'FAIL',error:e.message,ms:Date.now()-start});console.log('FAIL',id,e.message.slice(0,200));return false;}
 finally{await page.screenshot({path:path.join(output,id+'.png')}).catch(()=>{});fs.writeFileSync(path.join(output,id+'.txt'),await page.locator('body').innerText().catch(()=>''));writeReport();}
}
export function writeReport(){
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({scope:'Duas contas QA; saldo inicial sem valor monetário. Não valida Google Play Billing.',results},null,2));
 fs.writeFileSync(path.join(output,'README.md'),['# Jornada real do GLYPH','Saldo inicial preparado apenas nas duas contas temporárias; compras da Play Store não executadas.','','| Etapa | Resultado | Evidência |','|---|---|---|',...results.map(r=>`| ${r.id} | ${r.status} | ${r.error?.replace(/[\r\n|]/g,' ').slice(0,280)||r.evidence||''} |`),'','Vídeos em `videos/`. Screenshots por etapa neste diretório.'].join('\n'));
}

export async function unlock(page){
 await page.bringToFront();
 await page.waitForTimeout(500);
 for(let i=0;i<6;i++){
  const tip=page.getByRole('button',{name:/^(Desligar dicas|Prosseguir|Continuar)$/i}).first();
  if(!await tip.isVisible())break;
  await tip.click();await page.waitForTimeout(600);
 }
 const trigger=page.locator('.restscreen-unlock-trigger');
 for(let attempt=0;attempt<3&&await trigger.isVisible();attempt++){
  await trigger.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const box=await trigger.boundingBox();
  if(!box)break;
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  try{
   for(let i=0;i<24;i++){
    await page.waitForTimeout(250);
    if(!await trigger.isVisible())break;
   }
  }finally{await page.mouse.up();}
 }
 if(await trigger.isVisible())throw Error('Gesto de desbloqueio não fechou a tela de descanso');
}
