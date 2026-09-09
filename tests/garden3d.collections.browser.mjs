import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto('http://localhost:3018/zen3d-test/');
  await page.getByRole('button',{name:'Itens',exact:true}).click();
  await page.getByRole('button',{name:'Ornamentos',exact:true}).click();
  for(const name of ['Totem das três pedras','Guardião do pátio','Relicário de ametista']) assert.equal(await page.getByRole('button',{name,exact:true}).count(),1);
  await page.getByRole('combobox',{name:'Filtrar coleção'}).selectOption('luxury');
  assert.equal(await page.getByRole('button',{name:'Guardião do pátio',exact:true}).count(),1);
  assert.equal(await page.getByRole('button',{name:'Relicário de ametista',exact:true}).count(),0);
  await page.getByRole('button',{name:'Guardião do pátio',exact:true}).click();
  await page.locator('canvas').click({position:{x:280,y:480}});
  assert.equal(await page.locator('main').getAttribute('data-object-count'),'7');
  await page.getByRole('button',{name:'Girar',exact:true}).click();
  await page.getByRole('button',{name:'Itens',exact:true}).click();
  await page.getByRole('combobox',{name:'Filtrar coleção'}).selectOption('genesis');
  await page.getByRole('button',{name:'Relicário de ametista',exact:true}).click();
  await page.locator('canvas').click({position:{x:250,y:550}});
  assert.equal(await page.locator('main').getAttribute('data-object-count'),'8');
  await page.getByRole('button',{name:'Itens',exact:true}).click();
  await page.getByRole('combobox',{name:'Filtrar coleção'}).selectOption('starter');
  await page.getByRole('button',{name:'Totem das três pedras',exact:true}).click();
  await page.locator('canvas').click({position:{x:185,y:600}});
  assert.equal(await page.locator('main').getAttribute('data-object-count'),'9');
  await page.getByRole('button',{name:'Itens',exact:true}).click();
  await page.getByRole('combobox',{name:'Filtrar coleção'}).selectOption('all');
  await page.getByRole('button',{name:'Pedras',exact:true}).click();
  assert.ok(await page.getByRole('button',{name:'Caminho reto',exact:true}).count());
  await page.getByRole('button',{name:'Ornamentos',exact:true}).click();
  await page.getByRole('button',{name:'Relicário de ametista',exact:true}).locator('img').waitFor();
  if(process.env.GARDEN_SCREENSHOT){await page.screenshot({path:process.env.GARDEN_SCREENSHOT});await page.getByRole('button',{name:'Recolher painel',exact:false}).click();await page.screenshot({path:process.env.GARDEN_SCREENSHOT.replace('.png','-garden.png')});}
  assert.deepEqual(errors,[]);
  console.log('Collections: three distinct signature sculptures, mixed collections, paths under stones and placement/rotation passed.');
}finally{await browser.close();}
