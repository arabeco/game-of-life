import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transpileModule,ModuleKind,ScriptTarget} from 'typescript';
const load=(file,replacements={})=>{
  let source=readFileSync(new URL(`../views/zen3d/${file}`,import.meta.url),'utf8');
  for(const [from,to] of Object.entries(replacements))source=source.replaceAll(`'${from}'`,`'${to}'`);
  return `data:text/javascript;base64,${Buffer.from(transpileModule(source,{compilerOptions:{module:ModuleKind.ES2022,target:ScriptTarget.ES2022}}).outputText).toString('base64')}`;
};
const modelURL=load('model.ts'),templatesURL=load('gardenTemplates.ts');
const model=await import(modelURL),templates=await import(templatesURL);
const terrain=await import(load('gardenTerrain.ts',{'./model':modelURL,'./gardenTemplates':templatesURL}));
const {validateGardenSnapshot}=await import(load('gardenAccount.tsx',{'react':import.meta.resolve('react')}));
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const drawing={color:'data:image/png;base64,YQ==',height:'data:image/png;base64,Yg=='};
const old={version:1,base:'open',objects:templates.templateObjects('open','rustic'),artifacts:[],sand:1,environment:'mist',atmosphere:'morning',drawing};
const original=JSON.stringify(old);
assert.ok(validateGardenSnapshot(old),'Legacy documents remain readable');
for(const base of templates.BASES){
  const before=terrain.legacyDrawingBounds(base.id),after=terrain.terrainDimensions(base.id);
  close(after.x/before.x,1.25);close(after.z/before.z,1.25);
  close(after.x*after.z/(before.x*before.z),1.5625);
  assert.ok(terrain.fitsTerrain([...templates.templateObjects(base.id,'rustic'),...templates.LEGACY_OBSTACLES],after),`Existing ${base.id} composition fits enlarged ground`);
  for(const shape of terrain.GARDEN_SHAPES){
    const choice={shape:shape.id,size:'spacious'},bounds=terrain.terrainDimensions(base.id,choice);
    model.configureGarden(bounds.x,bounds.z,bounds.roundness);
    assert.ok(model.inGarden(0,0));assert.ok(!model.inGarden(bounds.x+.1,0));
    if(shape.id==='circle'||shape.id==='square')close(bounds.x,bounds.z);
    if(shape.id==='circle')assert.ok(!model.inGarden(bounds.x*.85,bounds.z*.85));
    if(shape.id==='square')assert.ok(model.inGarden(bounds.x*.85,bounds.z*.85));
    const saved=JSON.parse(JSON.stringify({...old,base:base.id,terrain:choice,drawingBounds:bounds}));
    assert.ok(validateGardenSnapshot(saved));assert.deepEqual(saved.objects,old.objects);assert.deepEqual(saved.drawing,drawing);
    assert.deepEqual(terrain.terrainDimensions(saved.base,saved.terrain),bounds);
  }
}
assert.equal(JSON.stringify(old),original,'Size/shape calculation never rewrites saved pieces or sand');
const wide=terrain.terrainDimensions('open',{shape:'square',size:'spacious'});
const thin=terrain.terrainDimensions('open',{shape:'ellipse',size:'standard'});
const edge=[{id:'edge',type:'rock',position:[9,0,0],rotation:0,variant:0}];
assert.ok(terrain.fitsTerrain(edge,wide));assert.ok(!terrain.fitsTerrain(edge,thin),'Unsafe narrowing must be rejected');
// Drawings retain their world coordinates and their hidden edges across shrinking.
const source=terrain.legacyDrawingBounds('open'),expanded=terrain.expandedDrawingBounds(source,wide);
const rect=terrain.drawingRect(source,expanded,512,1024);
for(const [x,z] of [[0,0],[-3,4],[4,-7]]){
  const oldX=(x/source.x*.5+.5)*512,oldY=(z/source.z*.5+.5)*1024;
  close(rect.x+oldX*rect.width/512,(x/expanded.x*.5+.5)*512);
  close(rect.y+oldY*rect.height/1024,(z/expanded.z*.5+.5)*1024);
}
assert.deepEqual(terrain.expandedDrawingBounds(expanded,thin),expanded,'Smaller visible ground never crops the stored drawing');
assert.deepEqual(terrain.drawingRect(expanded,expanded,512,1024),{x:0,y:0,width:512,height:1024});
for(const invalid of [null,{shape:'infinite',size:'spacious'},{shape:'circle',size:'huge'}])assert.equal(validateGardenSnapshot({...old,terrain:invalid}),false);
for(const invalid of [null,{x:Infinity,z:10},{x:0,z:10},{x:33,z:10}])assert.equal(validateGardenSnapshot({...old,drawingBounds:invalid}),false);
console.log('PASS: legacy growth, all shapes/models, save/reopen metadata, unchanged composition, edge protection and sand world-coordinate preservation.');
