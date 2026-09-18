// Built-document integration fixture: no credentials, purchases or backend writes.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[],assetRequests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/assets/light/'))assetRequests.push(r.url());});
 const host='http://127.0.0.1:3018',root='https://sand.test/storage/v1/object/public/garden-sand/11111111-1111-4111-8111-111111111111/';
 await page.goto(host+'/zen3d-test/account-check.html');
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=512;c.height=1024;c.getContext('2d').fillRect(0,0,512,1024);return c.toDataURL();});
 await page.route('https://sand.test/**',route=>route.fulfill({status:200,contentType:'image/png',headers:{'access-control-allow-origin':'*'},body:Buffer.from(png.split(',')[1],'base64')}));
 const state={version:1,base:'pond',environment:'mist',atmosphere:'morning',sand:1,artifacts:[],drawing:{color:root+'color.png?v=123',height:root+'height.png?v=123'},objects:[
  {id:'tree',type:'pine',position:[-3,0,1],rotation:0,variant:0,kit:'starter'},
  {id:'gold',type:'maple',position:[3,0,3],rotation:1,variant:1,kit:'luxury'},
  {id:'violet',type:'maple',position:[-2,0,-2],rotation:2,variant:2,kit:'genesis'},
  {id:'pool',type:'pond',position:[2,0,-1],rotation:0,variant:1,kit:'starter'},
 ]};
 await page.route('**/quality-account-fixture.html*',route=>route.fulfill({contentType:'text/html',body:`<body style="margin:0"><iframe id="garden" src="/garden3d/index.html" style="border:0;width:1100px;height:1000px"></iframe><script>
 window.saves=[];window.dirty=[];const frame=document.querySelector('iframe');
 window.addEventListener('message',e=>{if(e.source!==frame.contentWindow||e.origin!==location.origin)return;const d=e.data;
 if(d.type==='glyph-garden-ready')frame.contentWindow.postMessage({type:'glyph-garden-init',state:${JSON.stringify(state)},owned:['garden_base_pond','garden_kit_luxury','garden_kit_genesis'],artifacts:[],products:[],readOnly:location.search.includes('visit')},location.origin);
 if(d.type==='glyph-garden-dirty')window.dirty.push(d.dirty);
 if(d.type==='glyph-garden-save'){window.saves.push(d.state);frame.contentWindow.postMessage({type:'glyph-garden-saved',id:d.id},location.origin);}});</script>`}));
 await page.goto(host+'/quality-account-fixture.html');
 const garden=page.frameLocator('#garden');
 await garden.getByRole('button',{name:'Salvar',exact:true}).waitFor();
 await page.waitForTimeout(2500);
 await garden.getByRole('button',{name:'Salvar',exact:true}).click();
 await page.waitForFunction(()=>window.saves.length===1);
 assert.deepEqual(await page.evaluate(()=>window.saves[0].drawing),state.drawing,'Untouched sand must reuse persisted URLs');
 assert.deepEqual(await page.evaluate(()=>window.saves[0].objects),state.objects,'Existing composition must survive the renderer replacement');
 const before=assetRequests.length;
 await garden.getByRole('button',{name:'Itens',exact:true}).click();
 await garden.getByRole('combobox',{name:'Filtrar coleção'}).selectOption('genesis');
 await page.waitForTimeout(1500);
 assert.equal(assetRequests.length,before,'Changing collection must not reload model files');
 await garden.getByRole('button',{name:'Areia',exact:true}).click();
 const canvas=await garden.locator('canvas').boundingBox();
 await page.mouse.move(canvas.x+550,canvas.y+470);await page.mouse.down();
 for(let i=0;i<14;i++){await page.mouse.move(canvas.x+550+i*3,canvas.y+470+i*7);await page.waitForTimeout(30);}await page.mouse.up();
 await garden.getByRole('button',{name:'Salvar',exact:true}).click();await page.waitForFunction(()=>window.saves.length===2);
 assert.match(await page.evaluate(()=>window.saves[1].drawing.height),/^data:image\/png/,'Drawing must export the changed canvas');
 await page.screenshot({path:'temp/garden-main-quality.png'});
 await page.goto(host+'/quality-account-fixture.html?visit');await garden.locator('canvas').waitFor();await page.waitForTimeout(1200);
 assert.equal(await garden.getByRole('button',{name:'Salvar',exact:true}).count(),0);
 assert.equal(await garden.getByRole('button',{name:'Itens',exact:true}).count(),0);
 assert.deepEqual(await page.evaluate(()=>window.saves),[]);assert.deepEqual(await page.evaluate(()=>window.dirty),[]);
 assert.deepEqual(errors,[]);
 console.log('PASS: built renderer, saved positions, all three themes, shared asset requests, sand URLs/changed drawing and read-only visits.');
}finally{await browser.close();}
