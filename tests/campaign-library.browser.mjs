import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFileSync,readdirSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/Afonso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {CampaignsCodex} from './components/CampaignsCodex';
const w=window as any;
let arenas=[{id:'a',name:'Leitura',assetId:'trabalho',icon:'📚',originCodexId:'book'},{id:'b',name:'Prática',assetId:'saude',icon:'💪',originCodexId:'book'}];
const actions=[{id:'x',arenaId:'a',name:'Ler',actionType:'Ação Recorrente',repetitions:1,originCodexId:'book'},{id:'y',arenaId:'b',name:'Praticar',actionType:'Ação Recorrente',repetitions:1,originCodexId:'book'}];
w.game={campaigns:[{id:'run',title:'Corpo e mente',status:'active',arenaIds:['a','b'],arenaConfig:{b:{isLocked:true,prerequisiteArenaIds:['a']}}}],actions,
 tasks:[{id:'t1',actionId:'x',date:'2026-09-01',completed:true},{id:'t2',actionId:'y',date:'2026-10-15',completed:true}],activeCycle:{startDate:'2026-10-15',endDate:'2026-10-20'},
 getArenas:()=>arenas,getClanQuestsForArena:()=>[],getClanQuestProgress:()=>0,getSharedActionPoolProgress:()=>0,showToast:()=>{},
 userCodexes:[{id:'book',name:'Corpo e mente',created_at:'2026-10-01',source_type:'catalog',template:{title:'Corpo e mente',levels:[{level:1,title:'Leitura',assetId:'trabalho',actions:[{name:'Ler',repetitions:1}]},{level:2,title:'Prática',assetId:'saude',actions:[{name:'Praticar',repetitions:1}]}]}}],
 finishCampaign:async(id,status)=>{w.finished=status;w.game.campaigns=w.game.campaigns.map(c=>({...c,status,completedAt:new Date().toISOString(),resultSnapshot:{completedRepetitions:2}}));arenas=arenas.map(a=>({...a,isArchived:true}));w.refresh();return true;},
 installCodex:async()=>{w.installed=(w.installed||0)+1},updateCampaign:async()=>true,deleteCampaign:()=>{}};
function App(){const [v,setV]=useState(0);w.refresh=()=>setV(v=>v+1);return <CampaignsCodex onClose={()=>{}}/>}createRoot(document.getElementById('root')!).render(<App/>);
`},bundle:true,write:false,format:'iife',loader:{'.css':'empty'},plugins:[{name:'fixture',setup(b){
 b.onResolve({filter:/contexts\/GameContext$/},()=>({path:'game',namespace:'fixture'}));
 b.onResolve({filter:/hooks\/useConfirmation$/},()=>({path:'confirm',namespace:'fixture'}));
 b.onResolve({filter:/\/(ArenaCard|NewArenaModal|ArenaDetailModal|CreateCampaignModal)$/},a=>({path:a.path.split('/').pop(),namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},a=>({resolveDir:process.cwd(),loader:'tsx',contents:a.path==='game'?`export const useGame=()=>window.game;export const getLocalDateString=()=> '2026-10-15';`:a.path==='confirm'?`export const useConfirmation=()=>({confirm:async()=>true,confirmationElement:null});`:`import React from 'react';export const ${a.path}=({arena})=><div>{arena?.name}</div>;`}));
}}]});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const cssFiles=readdirSync('dist/assets').filter(f=>f.endsWith('.css'));
 const css=cssFiles.map(f=>readFileSync('dist/assets/'+f,'utf8')).join('\n');
 await page.setContent('<html class="dark"><head><style>'+css+'</style></head><body style="background:#101114;color:white"><div id="root"></div></body></html>');
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.getByRole('tab',{name:'Biblioteca',exact:true}).click();
 await page.getByRole('button',{name:/Corpo e mente/}).click();
 await page.getByRole('button',{name:'Em andamento',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Em andamento',exact:true}).isDisabled(),true);
 // Return to the active run without relying on preview close labels.
 await page.reload(); // reinitialize fixture below
 await page.setContent('<html class="dark"><head><style>'+css+'</style></head><body style="background:#101114;color:white"><div id="root"></div></body></html>');
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.getByRole('button',{name:/Corpo e mente/}).click();
 await page.getByRole('button',{name:'Concluir e guardar'}).waitFor();
 mkdirSync('output/campaign-library',{recursive:true});
 await page.screenshot({path:'output/campaign-library/completed-mobile.png'});
 await page.getByRole('button',{name:'Concluir e guardar'}).click();
 assert.equal(await page.getByRole('tab',{name:'Biblioteca',exact:true}).getAttribute('aria-selected'),'true');
 assert.equal(await page.evaluate(()=>window.finished),'completed');
 await page.screenshot({path:'output/campaign-library/library-mobile.png'});
 await page.getByRole('tab',{name:'Histórico',exact:true}).click();
 await page.getByText('Corpo e mente · Concluída',{exact:true}).waitFor();
 await page.getByRole('tab',{name:'Biblioteca',exact:true}).click();
 await page.getByRole('button',{name:/Corpo e mente/}).click();
 await page.getByRole('button',{name:'Instalar',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.installed),1);
 assert.deepEqual(errors,[]);console.log('PASS mobile: library install disabled while active, cross-cycle completion, finish returns to library, history and replay CTA.');
}finally{await browser.close()}
