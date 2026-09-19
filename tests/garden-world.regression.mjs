import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transpileModule,ModuleKind,ScriptTarget,JsxEmit} from 'typescript';
const load=(path,replacements={})=>{
  let source=readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
  for(const [from,to] of Object.entries(replacements))source=source.replaceAll(`'${from}'`,`'${to}'`);
  const code=transpileModule(source,{compilerOptions:{module:ModuleKind.ES2022,target:ScriptTarget.ES2022,jsx:JsxEmit.ReactJSX}}).outputText.replace('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')));
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
};
const {gardenTime,localGardenHour}=await import(load('views/zen3d/gardenTime.ts'));
assert.equal(localGardenHour(new Date(2026,8,19,17,30,0)),17.5,'Use device-local time, not UTC');
assert.equal(gardenTime(12).daylight,1);assert.equal(gardenTime(0).night,1);
assert.ok(gardenTime(12).sun[1]>.9&&gardenTime(0).moon[1]>.9);
assert.ok(gardenTime(6).sun[0]>0&&gardenTime(18).sun[0]<0,'Sun travels across the sky');
assert.deepEqual(gardenTime(0),gardenTime(24));assert.deepEqual(gardenTime(-1),gardenTime(23));
for(let h=0;h<24;h+=1/60){
  const t=gardenTime(h),next=gardenTime(h+1/60);
  assert.ok(t.ambient>=.8&&t.intensity>=.8,'Night remains usable');
  assert.ok(t.position.every(Number.isFinite));assert.ok(Math.abs(next.ambient-t.ambient)<.03);
  for(const key of ['top','horizon','bottom'])assert.match(t[key],/^#[0-9a-f]{6}$/);
}
const modelURL=load('views/zen3d/model.ts');
const surfaceURL=load('views/zen3d/gardenSurface.ts',{'./model':modelURL,three:import.meta.resolve('three')});
const {islandRock}=await import(load('views/zen3d/FloatingIsland.tsx',{'./model':modelURL,'./gardenSurface':surfaceURL,three:import.meta.resolve('three'),react:import.meta.resolve('react')}));
for(const [x,z,n] of [[6.44,11.44,2],[11.44,11.44,12],[13.375,13.375,2]]){
  const geometry=islandRock(x,z,n),p=geometry.attributes.position;
  assert.ok([...p.array].every(Number.isFinite));assert.ok(p.count/3<1500,'Rock base has a fixed small geometry budget');
  geometry.computeBoundingBox();assert.ok(geometry.boundingBox.min.y<-13);assert.ok(geometry.boundingBox.max.y<0,'Never cover existing sand and pieces');geometry.dispose();
}
const {gardenLegacyEras}=await import(load('utils/gardenLegacy.ts'));
const report=(id,end,score,season='one')=>({id,cycleName:id,startDate:'2026-09-01',endDate:end,performanceScore:score,seasonId:season,metrics:{totalHours:3,weeklyAtlas:[]}});
const reports=[report('a','2026-09-15',81),report('b','2026-09-10',90),report('c','2026-09-05',70,'two')];
const raw=JSON.stringify(reports),eras=gardenLegacyEras(reports);
assert.deepEqual(eras.map(e=>e.cycleCount),[2,1]);assert.equal(eras[0].avgScore,86);
assert.deepEqual(gardenLegacyEras(reports,['a']).map(e=>e.cycleCount),[1,2]);
assert.equal(gardenLegacyEras([...reports,{...reports[0],id:'duplicate'}])[0].cycleCount,2);
assert.equal(JSON.stringify(reports),raw,'Plaque rendering never mutates account history');
assert.deepEqual(gardenLegacyEras([]),[]);
console.log('PASS: local day/night, midnight wrap, smooth light, usable night, island geometry budget and matching legacy history grouping.');
