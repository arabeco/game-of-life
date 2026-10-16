import { build } from 'esbuild';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Afonso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const bundle = await build({
    stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { useConquistasSecretas } from './hooks/useConquistasSecretas';
        import { avisarSegredoConfirmado } from './utils/eventosDeSegredos';
        import { createTaskDomain } from './contexts/gameDomains/taskDomain';
        import { salvarPagina } from './services/JournalService';
        const w = window as any;
        w.fatos = { acoesConcluidas:0, maiorSequencia:0, maiorDia:0, diasSeguidosComCincoAreas:0,
            maiorSemanaAntesDasSete:0, paginasDoDiario:0, diasDeHumor:0, amizades:0,
            competicoesVencidas:0, missoesDoOraculo:0, mentoriasAteOFim:0, ciclos:[] };
        w.calls=0; w.grants=[]; w.modals=[]; w.owned=new Set(); w.pausado=false;
        w.__db = {
            rpc: async () => {
                w.calls++; const result={data:{...w.fatos},error:null};
                if(w.hold){w.hold=false; await new Promise(resolve=>w.release=resolve);}
                return result;
            },
            from: (table) => {
                const query={select:()=>query,eq:()=>query,is:()=>query,gt:()=>query,order:()=>query,limit:()=>query,in:()=>query,
                    then:(resolve)=>Promise.resolve(resolve({data:table==='user_inventory'?[...w.owned].map(item_id=>({item_id})):w.nextMentoria?[{expires_at:w.nextMentoria}]:[],error:null}))};
                return query;
            }
        };
        w.__game={userProfile:{id:'user-1',completedSeasonMissions:[],unlockedItems:{}},inventory:[],
            reports:[],friends:[],notifications:[],isProfileLoaded:true,
            grantInventoryItem:async (id)=>{w.grants.push(id);w.owned.add(id);return {item:{id},granted:true};},
            updateUserProfile:async patch=>{w.__game={...w.__game,userProfile:{...w.__game.userProfile,...patch}};w.render();},
            setAchievementUnlocked:modal=>w.modals.push(modal)};
        const root=createRoot(document.getElementById('root')!);
        function App(){useConquistasSecretas({pausado:w.pausado});return null;}
        w.render=()=>root.render(<App/>);
        w.emit=(evento,userId=w.__game.userProfile.id)=>avisarSegredoConfirmado(userId,evento);
        w.render();
        w.testProducers=async()=>{
            const events=[];const listen=e=>events.push(e.detail.evento);
            window.addEventListener('glyph:segredo-confirmado',listen);
            let fail=false;
            const query={update:()=>query,eq:()=>query,insert:()=>query,upsert:()=>query,
                then:resolve=>Promise.resolve(resolve({error:fail?{message:'fixture failed write'}:null}))};
            const date=new Date().toLocaleDateString('en-CA');
            const action={id:'action',arenaId:'missing-arena',duration:15,actionType:'Normal'};
            const task={id:'task',actionId:'action',date,startTime:540,duration:15,completed:false};
            const domain=(tasks=[])=>createTaskDomain({tasks,reports:[],campaigns:[],activeCycle:null,
                judgedTaskIdsByDate:{},dailyCommitment:{date,taskIds:[]},
                supabase:{from:()=>query},getSupabaseUserId:()=> 'producer-fixture',
                setTasks:()=>{},setDailyCommitmentState:()=>{},getActionById:()=>action,
                getArenas:()=>[],getActionsForArena:()=>[],getClanQuestForAction:()=>null,
                getActiveArenaPact:()=>({pact:null,progress:null}),isClanQuestActionId:()=>false,showToast:()=>{},
                setAchievementUnlocked:()=>{},getLocalDateString:()=>date,mapToSnakeCase:x=>x,
            } as any);
            const result=[];
            fail=true; await domain([task]).toggleTaskCompletion('task');result.push(events.length);
            fail=false;await domain([task]).toggleTaskCompletion('task');result.push(events.length);
            await domain([{...task,completed:true}]).toggleTaskCompletion('task');result.push(events.length);
            fail=true;await domain().scheduleAndCompleteNow('action');result.push(events.length);
            fail=false;await domain().scheduleAndCompleteNow('action');result.push(events.length);
            await domain().scheduleAndCompleteAt('action',date,540);result.push(events.length);
            action.actionType='Marco';await domain().scheduleAndCompleteMilestoneNow('action');result.push(events.length);
            const oldDb=w.__db;w.__db={from:()=>query};
            fail=true;await salvarPagina('producer-fixture',1,'x'.repeat(100));result.push(events.length);
            fail=false;await salvarPagina('producer-fixture',1,'x'.repeat(99));result.push(events.length);
            await salvarPagina('producer-fixture',1,'x'.repeat(100));result.push(events.length);
            w.__db=oldDb;window.removeEventListener('glyph:segredo-confirmado',listen);
            return result;
        };
    ` },
    bundle: true, write: false, format: 'iife', platform: 'browser',
    plugins: [{name:'confirmed-fixture',setup(b){
        b.onResolve({filter:/contexts\/GameContext$/},()=>({path:'game',namespace:'fixture'}));
        b.onResolve({filter:/supabaseClient$/},()=>({path:'db',namespace:'fixture'}));
        b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='game'
            ? 'export const useGame=()=>window.__game;'
            : 'export const supabase={rpc:(...a)=>window.__db.rpc(...a),from:(...a)=>window.__db.from(...a)};'}));
    }}],
});
const browser = await chromium.launch({channel:'msedge',headless:true});
try {
    const page = await browser.newPage();
    await page.route('http://localhost/segredos-fixture', route => route.fulfill({contentType:'text/html',body:'<div id="root"></div>'}));
    await page.goto('http://localhost/segredos-fixture');
    await page.addScriptTag({content:bundle.outputFiles[0].text});
    await page.waitForFunction(()=>window.calls>0);
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>window.grants.length),0);
    // 29 -> 30 while the first request is in flight: the event must survive.
    await page.evaluate(()=>{window.fatos.maiorSequencia=29;window.hold=true;window.emit('acao');});
    await page.waitForFunction(()=>typeof window.release==='function');
    await page.evaluate(()=>{window.pausado=true;window.render();window.fatos.maiorSequencia=30;window.emit('acao');window.release();});
    await page.waitForFunction(()=>window.grants.length===2);
    assert.equal(await page.evaluate(()=>window.modals.length),0,'grant must not wait for the report; modal must wait');
    await page.evaluate(()=>{window.pausado=false;window.render();});
    await page.waitForFunction(()=>window.modals.length===1);
    assert.match(await page.evaluate(()=>window.modals[0].data.id),/imparavel/);
    await page.evaluate(()=>{window.emit('acao');window.emit('acao');});
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>window.grants.length),2,'repeat event grants nothing twice');
    // Another account cannot trigger a check. An action cannot unlock a diary rule.
    await page.evaluate(()=>{window.fatos.paginasDoDiario=10;window.emit('diario','different-user');window.emit('acao');});
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>window.grants.length),2);
    await page.evaluate(()=>window.emit('diario'));
    await page.waitForFunction(()=>window.modals.length===2);
    assert.match(await page.evaluate(()=>window.modals[1].data.id),/escriba/);
    await page.evaluate(()=>{window.fatos.diasDeHumor=30;window.emit('humor');});
    await page.waitForFunction(()=>window.modals.length===3);
    assert.match(await page.evaluate(()=>window.modals[2].data.id),/sereno/);
    await page.evaluate(()=>{window.fatos.amizades=5;window.__game={...window.__game,friends:[1,2,3,4,5]};window.render();});
    await page.waitForFunction(()=>window.modals.some(m=>m.data.id.includes('popular')));
    await page.evaluate(()=>{window.fatos.missoesDoOraculo=2;window.emit('missao');});
    await page.waitForFunction(()=>window.modals.some(m=>m.data.id.includes('oraculo')));
    await page.evaluate(()=>{window.fatos.competicoesVencidas=5;window.emit('vinculo');});
    await page.waitForFunction(()=>window.modals.some(m=>m.data.id.includes('campeao')));
    await page.evaluate(()=>{
        window.fatos.ciclos=[{fim:'2026-10-13',dias:7,nota:'A',feitas:10,planejadas:10,arenasFechadasPorArea:{}}];
        window.__game={...window.__game,reports:[{id:'closed'}]};window.render();
    });
    await page.waitForFunction(()=>window.modals.some(m=>m.data.id.includes('disciplinado')));
    await page.evaluate(()=>{window.nextMentoria=new Date(Date.now()+20).toISOString();window.emit('vinculo');});
    await page.waitForTimeout(150);
    await page.evaluate(()=>{window.nextMentoria=null;window.fatos.mentoriasAteOFim=2;});
    await page.waitForFunction(()=>window.modals.some(m=>m.data.id.includes('guardia')));
    assert.deepEqual(await page.evaluate(()=>window.testProducers()),[0,1,1,1,2,3,4,4,4,5],
        'Planner, estoque, horario, marco e diario: falha/undo nao disparam, sucesso confirmado dispara');
    console.log('PASS: dia 30 sem reabrir, concorrencia, fila do modal, nao duplicar, conta isolada; diario, humor, amizade, missao, competicao, ciclo e prazo da mentoria; gravacoes reais simuladas com sucesso/falha/undo.');
} finally { await browser.close(); }
