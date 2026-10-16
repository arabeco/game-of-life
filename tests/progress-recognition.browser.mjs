import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFileSync,readdirSync,mkdirSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Afonso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import {useProgressRecognition} from './hooks/useProgressRecognition';
import {ProgressRecognitionBadge} from './components/ProgressRecognitionBadge';
import {DailyPanelBoard} from './components/DailyPanelBoard';
import {MetalReportCard} from './components/MetalReportCard';
const w=window as any;w.next={kind:'mastery',subjectId:'a',current:100,cohortSize:100,topPercent:1};w.calls=0;
function App(){const [user,setUser]=useState('a');w.setUser=setUser;
 const recognition=useProgressRecognition(user,'mastery',user,100);
 return <div style={{maxWidth:390,margin:'auto',padding:12}}>
 <div id="badge" style={{textAlign:'center',padding:12}}><ProgressRecognitionBadge value={recognition} context="Maestria"/></div>
 <DailyPanelBoard date="2026-10-13" dateLabel="13 de outubro" isToday completed={4} total={6} xp={420} stats={[]} arenas={[]} expAverageLabel="↑ 20% acima da sua média de EXP" expAverageHint="30 dias anteriores, incluindo dias sem atividade"/>
 <div style={{marginTop:20}}><MetalReportCard rank="A" title="Ciclo concluído" subtitle="Ciclo consolidado" dateRange="01/10/2026 - 07/10/2026" summary="↑ 20% acima da sua média de EXP por dia" metrics={[{label:'Ações',value:'40/42'},{label:'Carga',value:'30h'},{label:'Metas',value:'3/3'},{label:'Presença',value:'7 dias'}]} badges={[{label:'Top 1%',value:'EXP · ciclos de 7 dias'},{label:'XP',value:'+2100'}]}/></div>
 </div>;
}createRoot(document.getElementById('root')!).render(<App/>);
`},bundle:true,write:false,format:'iife',loader:{'.css':'empty'},plugins:[{name:'rpc-fixture',setup(b){b.onResolve({filter:/supabaseClient$/},()=>({path:'rpc',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:`export const supabase={rpc:async()=>{window.calls++;if(window.hold)return await new Promise(r=>window.pending=r);return {data:window.next,error:window.error||null};}}`,loader:'js'}));}}]});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:950},deviceScaleFactor:1});
 await page.route('http://localhost/**',r=>{
  const pathname=new URL(r.request().url()).pathname;
  if(pathname.startsWith('/assets/') && !pathname.includes('..') && existsSync('public'+pathname)) return r.fulfill({body:readFileSync('public'+pathname),contentType:pathname.endsWith('.webp')?'image/webp':pathname.endsWith('.png')?'image/png':'application/octet-stream'});
  return r.fulfill({body:'<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div>',contentType:'text/html'});
 });
 await page.goto('http://localhost/fixture');
 const css=readdirSync('dist/assets').filter(f=>f.endsWith('.css')).map(f=>readFileSync('dist/assets/'+f,'utf8')).join('\n');
 await page.addStyleTag({content:css+'\nbody {background:#080b10;color:white;margin:0}'});
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.waitForFunction(()=>document.querySelector('#badge').textContent.includes('Top 1%'));
 mkdirSync('output/progress-recognition',{recursive:true});
 await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
 await page.screenshot({path:'output/progress-recognition/mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>[...document.images].filter(i=>!i.naturalWidth).length),0,'fixture assets loaded');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
 await page.evaluate(()=>{window.next={...window.next,topPercent:5};window.dispatchEvent(new Event('focus'));});
 await page.waitForFunction(()=>document.querySelector('#badge').textContent.includes('Top 5%'));
 await page.evaluate(()=>{window.next={...window.next,topPercent:11};window.dispatchEvent(new Event('focus'));});
 await page.waitForFunction(()=>document.querySelector('#badge').textContent==='');
 await page.evaluate(()=>{window.hold=true;window.dispatchEvent(new Event('focus'));});
 await page.waitForFunction(()=>!!window.pending);
 await page.evaluate(()=>{window.hold=false;window.next={...window.next,subjectId:'b',topPercent:10};window.setUser('b');});
 await page.waitForTimeout(50);
 await page.evaluate(()=>window.pending({data:{kind:'mastery',subjectId:'a',current:100,cohortSize:100,topPercent:1},error:null}));
 assert.equal(await page.locator('#badge').textContent(),'','late reply of former account not shown');
 await page.waitForFunction(()=>document.querySelector('#badge').textContent.includes('Top 10%'));
 await page.evaluate(()=>{window.error={code:'PGRST202'};window.dispatchEvent(new Event('focus'));});
 await page.waitForFunction(()=>document.querySelector('#badge').textContent==='');
 console.log('PASS: refresh Top 1→5→none, account switch ignores late response, missing migration hides data, mobile layout without horizontal overflow.');
}finally{await browser.close();}
