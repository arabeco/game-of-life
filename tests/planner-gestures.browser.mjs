import { build } from 'esbuild';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const { chromium }=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Afonso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React from 'react';
import {createRoot} from 'react-dom/client';
import {usePlannerDragHold} from './hooks/usePlannerDragHold';
import {emitOracleSpeech,maoEntrouNaTela,maoSaiuDaTela,ORACLE_SPEECH_EVENT} from './utils/oracleSpeech';
import {plannerEdgeScroll} from './utils/plannerGesture';
const w=window as any; w.log=[]; w.speeches=[];
w.emit=emitOracleSpeech; w.enter=maoEntrouNaTela; w.exit=maoSaiuDaTela; w.edge=plannerEdgeScroll;
window.addEventListener(ORACLE_SPEECH_EVENT,(e:any)=>w.speeches.push(e.detail.message));
function Fixture(){
 const {events,erguido}=usePlannerDragHold({onTap:()=>w.log.push('tap'),onDrag:()=>w.log.push('drag'),onHoldStart:()=>w.log.push('hold'),onHoldCancel:()=>w.log.push('cancel'),dragThreshold:14});
 return <div id="scroll" style={{height:450,overflowY:'auto'}}><div id="card" {...events} data-armed={erguido} style={{height:180,touchAction:'pan-y',background:'#555'}}>Ação</div><div style={{height:1800}}>Agenda</div></div>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
`},bundle:true,write:false,format:'iife',plugins:[{name:'feedback',setup(b){b.onResolve({filter:/useSensoryFeedback$/},()=>({path:'feedback',namespace:'fake'}));b.onLoad({filter:/.*/,namespace:'fake'},()=>({contents:'export const useSensoryFeedback=()=>({trigger:()=>window.log.push("feedback")});',loader:'js'}));}}]});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:800},hasTouch:true,isMobile:true});
 await page.route('http://localhost/planner-gesture-fixture',r=>r.fulfill({body:'<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div>',contentType:'text/html'}));
 await page.goto('http://localhost/planner-gesture-fixture');await page.addScriptTag({content:bundle.outputFiles[0].text});await page.waitForSelector('#card');
 await page.locator('#card').click();assert.equal(await page.evaluate(()=>window.log.filter(x=>x==='tap').length),1);
 const cdp=await page.context().newCDPSession(page);
 const touch=async(type,x=100,y=100)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y}],modifiers:0});
 await page.evaluate(()=>window.log=[]);
 await touch('touchStart');await page.waitForTimeout(290);await touch('touchMove',100,124);await touch('touchEnd');
 assert.equal(await page.evaluate(()=>window.log.filter(x=>x==='drag').length),1,'movimento nativo depois de pegar arrasta');
 assert.equal(await page.evaluate(()=>window.log.includes('hold')),false);
 await page.evaluate(()=>window.log=[]);
 await page.waitForTimeout(850);await page.mouse.move(100,100);await page.mouse.down();await page.waitForTimeout(290);await page.mouse.move(108,100);await page.mouse.up();
 assert.equal(await page.evaluate(()=>window.log.filter(x=>x==='drag').length),1,'mouse arrasta com 8px ap�s pegar');
 await page.evaluate(()=>window.log=[]);
 await touch('touchStart');await page.waitForTimeout(700);await touch('touchCancel');await page.waitForTimeout(50);
 assert.equal(await page.evaluate(()=>window.log.includes('hold')),true);assert.equal(await page.locator('#card').getAttribute('data-armed'),'false');
 assert.equal(await page.evaluate(()=>window.log.includes('cancel')),true);
 await page.evaluate(()=>window.log=[]);
 await touch('touchStart');await touch('touchEnd');await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>window.log.filter(x=>x==='tap').length),1,'toque n�o abre duas vezes pelo mouse sint�tico');
 await page.evaluate(()=>window.log=[]);
 await touch('touchStart',100,160);await touch('touchMove',100,100);await touch('touchMove',100,50);await touch('touchEnd');await page.waitForTimeout(100);
 assert.ok(await page.evaluate(()=>document.getElementById('scroll').scrollTop)>0,'rolagem nativa começando sobre cartão');
 assert.equal(await page.evaluate(()=>window.log.includes('drag')),false);
 await page.evaluate(()=>{window.speeches=[];window.enter();window.emit({kind:'reacao',message:'primeira'});window.enter();window.exit();});
 await page.waitForTimeout(750);assert.equal(await page.evaluate(()=>window.speeches.length),0,'arraste mantém bloqueio depois de soltar hold');
 await page.evaluate(()=>{window.exit();window.emit({kind:'reacao',message:'última'});});await page.waitForTimeout(250);
 await page.evaluate(()=>window.enter());await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>window.speeches.length),0);
 await page.evaluate(()=>window.exit());await page.waitForTimeout(750);assert.deepEqual(await page.evaluate(()=>window.speeches),['última']);
 const edge=await page.evaluate(()=>[window.edge(300,0,600,16),window.edge(599,0,600,16),window.edge(599,0,600,8)*2,window.edge(570,0,600,16)]);
 assert.equal(edge[0],0);assert.ok(edge[1]>edge[3]);assert.equal(edge[1],edge[2]);
 console.log('PASS: toque, pegar+8px, hold cancelado, rolagem nativa no cartão, Oráculo espera gesto encadeado e reação assíncrona, rolagem proporcional 60/120Hz.');
}finally{await browser.close();}
