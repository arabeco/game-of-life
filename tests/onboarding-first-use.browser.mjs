import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { createServer, transformWithEsbuild } from 'vite';
import fs from 'node:fs';
import tailwindcss from '@tailwindcss/vite';

// Actual guide components with an isolated local game fixture. No account or backend.
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Afonso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }
const root = path.resolve(import.meta.dirname, '..');
const gameId = path.join(root, 'tests/__guide-game.tsx').replaceAll('\\','/');
const entryId = path.join(root, 'tests/__guide-entry.tsx').replaceAll('\\','/');
const gameSource = `import React from 'react';
export const PROFILE_FLAG_TUTORIAL_COMPLETED = '__flag_tutorial_completed_v1';
export const Game = React.createContext(null);
export const useGame = () => React.useContext(Game);`;
const entrySource = `import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Game } from '${gameId}';
import { FirstUseOnboardingOverlay } from '/components/FirstUseOnboardingOverlay';
import { TutorialProvider, useTutorial } from '/contexts/TutorialContext';
import { OracleTutorialOverlay } from '/components/OracleTutorialOverlay';
import { FIRST_USE_ONBOARDING_EVENTS as events } from '/utils/firstUseOnboarding';
import '/index.css';
function Controls() {
 const guide = useTutorial();
 window.guide = guide;
 return <OracleTutorialOverlay />;
}
function App() {
 const seed = JSON.parse(localStorage.getItem('fixture') || '{}');
 const [assets,setAssets] = useState(seed.assets || []);
 const [actions,setActions] = useState(seed.actions || []);
 const [tasks,setTasks] = useState([]);
 const [userProfile,setProfile] = useState({id:'qa-guide', completedSeasonMissions:[]});
 const [active,setActive] = useState(true);
 const [arenaModal,setArenaModal] = useState(false);
 const [actionModal,setActionModal] = useState(false);
 const game = {userProfile, assets, actions, tasks, updateUserProfile: p => setProfile(u=>({...u,...p})), addProfileFlag: f=>setProfile(u=>({...u,completedSeasonMissions:[...u.completedSeasonMissions,f]})), completeTutorialMission:()=>{}};
 window.fixture = {profile:userProfile, active, assets, actions, finishAction:()=>setTasks([{id:'t1',actionId:'action-1',completed:true}])};
 const event = (name,detail={}) => window.dispatchEvent(new CustomEvent(name,{detail}));
 const persist = (a,b) => localStorage.setItem('fixture', JSON.stringify({assets:a,actions:b}));
 return <Game.Provider value={game}><TutorialProvider>
 <main style={{padding:20,color:'white'}}>
 <button id="new-action-button" onClick={()=>{setArenaModal(true);setTimeout(()=>event(events.arenaModalOpened),0)}}>Nova arena</button>
 {arenaModal && <section>
 <button id="new-arena-asset-button" onClick={()=>event(events.arenaAssetSelected)}>Saúde</button>
 <input aria-label="Nome da arena" id="new-arena-name-input" />
 <button id="new-arena-submit-button" onClick={()=>{const a=[{id:'saude',arenas:[{id:'arena-1'}]}];setAssets(a);persist(a,actions);setArenaModal(false);event(events.arenaCreated,{arenaId:'arena-1'})}}>Salvar arena</button>
 </section>}
 <button id="add-action-button" onClick={()=>{setActionModal(true);setTimeout(()=>event(events.actionModalOpened),0)}}>Nova ação</button>
 {actionModal && <section>
 <input aria-label="Nome da ação" id="onboarding-action-name-input" />
 <div id="onboarding-action-repetitions">3 repetições</div>
 <button id="onboarding-action-save-button" onClick={()=>{const a=[{id:'action-1',arenaId:'arena-1'}];setActions(a);persist(assets,a);setActionModal(false);event(events.actionCreated,{actionId:'action-1'})}}>Salvar ação</button>
 </section>}
 <section id="planner-container" style={{marginTop:40,height:400}}><div id="planner-pool">Ações disponíveis</div><button id="report-button">Histórico</button></section>
 </main>
 <Controls />
 <FirstUseOnboardingOverlay active={active} onDismiss={()=>setActive(false)} onComplete={()=>setActive(false)} />
 </TutorialProvider></Game.Provider>;
}
createRoot(document.getElementById('root')).render(<App/>);`;
const server = await createServer({ root, configFile:false, server:{host:'127.0.0.1',port:0},
  optimizeDeps: { entries: [], include: ['react', 'react-dom/client', 'react-dom'] },
  plugins:[tailwindcss(), {
    name:'isolated-guide-fixture',
    enforce:'pre',
    resolveId(id) { if (/(?:^|\/)GameContext(?:\.tsx)?$/.test(id) || id===gameId) return gameId; if(id==='/guide-entry')return entryId; },
    async load(id) { if(id===gameId || id===entryId) return (await transformWithEsbuild(id===gameId?gameSource:entrySource,id,{loader:'tsx',jsx:'transform'})).code; },
    configureServer(s) { s.middlewares.use((req,res,next)=>{if(req.url!=='/guide-test')return next();res.setHeader('Content-Type','text/html');res.end('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module" src="/guide-entry"></script></body></html>');}); },
  }],
});
let browser;
try {
 await server.listen();
 browser = await playwright.chromium.launch({headless:true, executablePath:process.env.MEGA_BROWSER || 'C:/Users/Afonso/AppData/Local/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-win64/chrome-headless-shell.exe'});
 const page = await browser.newPage({viewport:{width:390,height:844}});
 const errors=[]; page.on('pageerror',e=>{errors.push(e.message); console.error(e.message);});
 await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
 await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/guide-test');
 const title = page.locator('#first-use-onboarding-title');
 const at = async text => { await page.waitForFunction(t=>document.querySelector('#first-use-onboarding-title')?.textContent===t,text); };
 const next = async () => {
  const before=await title.textContent();
  await page.locator('#first-use-onboarding-next').click();
  await page.waitForTimeout(100);
  if(await page.evaluate(()=>document.querySelector('#first-use-onboarding-title')?.textContent)===before)
    await page.locator('#first-use-onboarding-next').click();
 };
 await at('Pra que você quer usar o app?');
 await page.locator('#onboarding-purpose-organizar').click();
 await at('Sua primeira arena'); await next();
 await at('Escolha a área'); await page.locator('#new-arena-asset-button').click();
 await at('Dê um nome claro');
 await page.locator('#new-arena-name-input').pressSequentially('Minha saude');
 assert.equal(await page.locator('#new-arena-name-input').inputValue(),'Minha saude');
 assert.equal(await title.textContent(),'Dê um nome claro','space must type, not advance');
 await page.locator('#new-arena-name-input').press('Enter');
 assert.equal(await title.textContent(),'Dê um nome claro');
 await next(); await at('Crie a arena'); await page.locator('#new-arena-submit-button').click();
 await at('Primeira ação');
 await page.reload(); await at('Primeira ação');
 assert.equal(await page.evaluate(()=>fixture.assets[0].arenas.length),1);
 await next(); await at('O que você vai fazer?');
 await page.locator('#onboarding-action-name-input').pressSequentially('Estudar ingles');
 assert.equal(await page.locator('#onboarding-action-name-input').inputValue(),'Estudar ingles');
 await next(); await at('Escolha uma meta leve'); await next(); await at('Salve sua ação');
 await page.locator('#onboarding-action-save-button').click();
 await at('Sua ação está no planner');
 await page.reload(); await at('Sua ação está no planner');
 assert.equal(await page.evaluate(()=>fixture.actions.length),1);
 fs.mkdirSync(path.join(root,'output/onboarding-qa'),{recursive:true});
 await page.waitForTimeout(4500);
 await page.screenshot({path:path.join(root,'output/onboarding-qa/planner-first.png')});
 await next(); await at('Prefere escolher um horário?'); await next();
 await at('Concluiu sem querer?'); await next(); await at('O ciclo pode ficar para depois');
 await next(); await at('Quer uma missão para começar?'); await next(); await at('Tudo pronto'); await next();
 await page.waitForFunction(()=>!fixture.active);
 console.log('PASS browser: keyboard, saved arena/action resume and no-cycle onboarding.');
 await page.evaluate(()=>guide.startTutorialLevel(1));
 await page.getByRole('button',{name:'Pular',exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>fixture.profile.completedSeasonMissions),[]);
 for(const level of [1,2,3,4]) {
  await page.evaluate(l=>guide.startTutorialLevel(l),level);
  // Drive the actual provider to each section end; completion must be per section.
  await page.waitForFunction(()=>guide.isTutorialActive);
  for(let step=0;step<18 && await page.evaluate(()=>guide.isTutorialActive);step++) {
   await page.evaluate(()=>guide.nextStep());
   await page.waitForTimeout(30);
  }
  assert.equal(await page.evaluate(()=>guide.isTutorialActive),false);
 }
 assert.ok((await page.evaluate(()=>fixture.profile.completedSeasonMissions)).includes('__flag_tutorial_completed_v1'));
 assert.deepEqual(errors,[]);
 console.log('PASS browser: real guide keyboard, reload after arena/action, no-cycle walkthrough, skip and four-section completion (isolated fixture).');
} finally { await browser?.close(); await server.close(); }
