import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transpileModule, ModuleKind, ScriptTarget } from 'typescript';
const load = (name, replacements = {}) => {
  let source=readFileSync(new URL(`../views/zen3d/${name}.ts`,import.meta.url),'utf8');
  for(const [from,to] of Object.entries(replacements))source=source.replaceAll(`'${from}'`,`'${to}'`);
  const compiled=transpileModule(source,{compilerOptions:{module:ModuleKind.ES2022,target:ScriptTarget.ES2022}}).outputText;
  return `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`;
};
const modelUrl=load('model');
const m=await import(modelUrl);
const {INITIAL_LAYOUT,CATALOG,VARIANTS,MAX_OBJECTS,canPlace,canWalk,findEntrance,waterField,worldFootprint,moduleLine,snapModule,stonePieces,isWater}=m;
let checks=0;
const check=(condition,message)=>{assert.ok(condition,message);checks++;};
const object=(type,x=0,z=0,rotation=0,variant=0,id='fixture')=>({id,type,position:[x,0,z],rotation,variant});
check(m.GARDEN_Z>m.GARDEN_X*1.6,'Garden must be elongated for portrait.');
check(!m.inGarden(m.GARDEN_X,0),'Edge is excluded.');
check(!canPlace([], 'path-straight',4.5,7),'The whole module must fit, not just its center.');
check(canPlace([], 'path-curve',0,0),'A curve fits in the center.');
const rock=object('rock');
check(!canPlace([rock],'rock',0,0),'Reject accidental exact duplicates.');
check(canPlace([rock],'rock',0,0,rock.id),'Moving can reuse its original place.');
check(canPlace([rock],'rock-cluster',.2,0),'Intentional composition overlap remains possible.');
check(!canWalk([rock],0,0),'Rock blocks walking.');
check(canWalk([object('pebble')],0,0),'Loose stepping stone is walkable.');
check(canWalk([object('path-straight')],0,0),'Ready-made path is walkable.');
check(!canWalk([object('pond')],0,0),'Water blocks walking.');
const turned=worldFootprint(object('stream-straight',0,0,Math.PI/2));
check(Math.abs(turned[0].x+1.6)<1e-6,'Rotated water footprint follows visible rotation.');
const snapped=snapModule([object('stream-straight')],object('stream-straight',0,3.37,0,2,'next'));
check(Math.abs(snapped.position[2]-3.2)<1e-6,'Nearby river endpoints join gently.');
const noSnap=snapModule([object('path-straight')],object('stream-straight',0,3.37,0,2,'next'));
check(noSnap.position[2]===3.37,'Do not snap different families.');
const joined=[object('stream-straight'),snapped].flatMap(worldFootprint);
for(let z=1;z<=2.2;z+=.05)check(waterField(joined,0,z)<0,'Water must remain continuous across joined modules.');
for(const type of ['path-straight','path-curve','stream-straight','stream-curve']) {
  const a=moduleLine(type,0),b=moduleLine(type,5);
  check(Math.hypot(a[0][0]-b[0][0],a[0][1]-b[0][1])<1e-6,'Variants preserve starting port.');
  check(Math.hypot(a.at(-1)[0]-b.at(-1)[0],a.at(-1)[1]-b.at(-1)[1])<1e-6,'Variants preserve ending port.');
}
check(JSON.stringify(stonePieces('rock-cluster',0))!==JSON.stringify(stonePieces('rock-cluster',1)),'Variants actually change composition.');
check(JSON.stringify(stonePieces('path-wild',3))===JSON.stringify(stonePieces('path-wild',3)),'Procedural variants are reproducible.');
for(const o of INITIAL_LAYOUT.objects)check(canPlace(INITIAL_LAYOUT.objects,o.type,o.position[0],o.position[2],o.id,o.rotation,o.variant),`Initial object fits: ${o.id}`);
const entrance=findEntrance(INITIAL_LAYOUT.objects);
check(entrance&&canWalk(INITIAL_LAYOUT.objects,entrance[0],entrance[2]),'A safe entrance is found.');
const blocked=[];for(let x=-5;x<=5;x+=.3)for(let z=-9;z<=9;z+=.3)blocked.push(object('rock',x,z));
check(findEntrance(blocked)===null,'A completely blocked garden must not spawn the player inside geometry.');
check(JSON.stringify(JSON.parse(JSON.stringify(INITIAL_LAYOUT)))===JSON.stringify(INITIAL_LAYOUT),'Future layout remains plain JSON.');
check(INITIAL_LAYOUT.version===2&&INITIAL_LAYOUT.objects.every(o=>Number.isInteger(o.variant)),'Versioned layout carries procedural variants.');
const stress=await import(load('stressScene',{'./model':modelUrl}));
const loadScene=stress.createStressScene();check(loadScene.length===MAX_OBJECTS,'Stress scene fills the actual object limit.');
const art=await import(load('procedural',{'./model':modelUrl,'three':import.meta.resolve('three'),'three/addons/utils/BufferGeometryUtils.js':import.meta.resolve('three/addons/utils/BufferGeometryUtils.js')}));
let largest=0;
for(const item of CATALOG.filter(c=>!isWater(c.type)))for(let v=0;v<VARIANTS;v++) {
  const g=art.getObjectGeometry(item.type,v),p=g.attributes.position;
  check(p.count>0&&[...p.array].every(Number.isFinite),`Finite generated geometry: ${item.type}/${v}`);
  check(g.attributes.color.count===p.count&&g.attributes.normal.count===p.count,'Material and normals cover every vertex.');
  check(g===art.getObjectGeometry(item.type,v),'Geometry is cached across repeated objects.');
  largest=Math.max(largest,p.count/3);
}
check(largest<6000,'Every object variant stays below 6000 triangles.');
art.releaseProceduralAssets();
console.log(`Zen3D V2: ${checks} checks passed; largest object ${largest} triangles; stress fixture ${loadScene.length} objects.`);

for(const model of m.GARDEN_MODELS) {
 const objects=m.modelLayout(model.id);
 check(!!findEntrance(objects),`${model.id} has a walking entrance`);
 check(objects.filter(o=>o.fixed).length>0,`${model.id} contains fixed base elements`);
}
const river=m.modelLayout('stream');
check(canWalk(river,0,0),'Bridge deck permits crossing the stream');
check(!canWalk(river,1,0),'Water outside the bridge remains blocked');
check(canWalk(river,0,1.79)&&canWalk(river,0,1.81),'Bridge joins the approach');
check(m.bridgeHeight(river,0,0)>.2,'Eye follows elevated bridge deck');
check(!canWalk([...river,object('rock',0,0)],0,0),'Bridge does not bypass solid decoration collisions');
const rotated=[object('bridge',0,0,Math.PI/2),object('stream-straight')];
check(canWalk(rotated,0,0)&&!canWalk(rotated,0,1),'Rotated bridge respects its walkable width');
console.log('Zen3D V3: template entrances, bridge crossing and solid obstacles passed.');

check(!m.clearOfBase(river,object('maple',0,0)),'Decoration cannot obstruct the bridge');
check(!m.clearOfBase(river,object('lantern',1,0)),'Decoration cannot be placed in fixed water');
check(m.clearOfBase(river,object('maple',-2,4)),'Dry decoration space is available');

const templates=await import(load('gardenTemplates'));
for(const base of templates.BASES)for(const finish of templates.FINISHES){
 const objects=templates.templateObjects(base.id,finish.id);
 check(!!findEntrance([...objects,...templates.LEGACY_OBSTACLES]),`${base.id}/${finish.id}: entrance`);
 check(canWalk(objects,0,0),`${base.id}/${finish.id}: free center`);
 if(base.id==='river'){
  check(objects.filter(o=>isWater(o.type)).length===1,'River is one continuous composition');
  for(let x=1.05;x<=4.35;x+=.15)check(canWalk(objects,x,1.8),'Bridge connects both banks');
  check(!canWalk(objects,2.7,0),'Water outside the bridge blocks walking');
 }
}
console.log('Four bases / three finishes: center, entrances and river crossing passed.');
for(const base of templates.BASES)for(const finish of templates.FINISHES){
 const objects=templates.templateObjects(base.id,finish.id);
 for(const item of objects)for(const circle of m.worldFootprint(item))check(circle.z-circle.radius>=-4.05,`${base.id}: base stays outside personal terrace`);
}
console.log('Personal terrace: all base footprints remain outside the reserved area.');
const placement=await import(load('placement',{'./model':modelUrl,'./gardenTemplates':load('gardenTemplates')}));
check(placement.placementFits([object('rock',0,2)],[]),'Single decoration fits open sand');
check(!placement.placementFits([object('rock',0,-6)],[]),'Decoration cannot invade personal area');
check(!placement.placementFits([object('rock',0,2)],[object('rock',0,2)]),'Placement rejects occupied space');
const kit=templates.templateObjects('open','rustic');
check(placement.placementFits(kit.map(o=>({...o,position:[o.position[0]+.25,0,o.position[2]]})),templates.LEGACY_OBSTACLES),'Base translates as a complete group');
check(!placement.placementFits(kit.map(o=>({...o,position:[o.position[0]+10,0,o.position[2]]})),[]),'Whole base must fit inside ellipse');
console.log('Decoration placement and complete base movement passed.');
const kits=await import(load('kits'));
const kitArt=await import(load('procedural',{'./model':modelUrl,'three':import.meta.resolve('three'),'three/addons/utils/BufferGeometryUtils.js':import.meta.resolve('three/addons/utils/BufferGeometryUtils.js')}));
for(const kit of kits.KITS){
 const initial=templates.templateObjects('open','rustic',kit.id);
 check(initial.length===6,`${kit.id}: six starter pieces`);
 check(new Set(initial.map(o=>o.type)).size===6,`${kit.id}: six different functions`);
 check(initial.every(o=>o.kit===kit.id),`${kit.id}: theme is explicit in object data`);
 for(const base of templates.BASES){
  const group=templates.templateObjects(base.id,'rustic',kit.id);
  check(!!findEntrance(group),`${kit.id}/${base.id}: entrance remains available`);
  for(const o of group)for(const p of worldFootprint(o))check(p.z-p.radius>templates.personalEdge(p.x),`${kit.id}: personal area preserved`);
 }
 for(const o of initial){
  const g=kitArt.getObjectGeometry(o.type,o.variant,'serene',kit.id);
  check([...g.attributes.position.array].every(Number.isFinite),`${kit.id}/${o.type}: finite geometry`);
  check(g.attributes.position.count/3<6000,`${kit.id}/${o.type}: geometry budget`);
 }
}
kitArt.releaseProceduralAssets();
console.log('Three cosmetic kits: six pieces, four bases, personal area and geometry budgets passed.');
const shape=await import(load('gardenSurface',{'./model':modelUrl,'three':import.meta.resolve('three')}));
for(const base of templates.BASES){
 m.configureGarden(base.width/2,base.depth/2,base.roundness);
 const group=templates.templateObjects(base.id,'rustic');
 check(!!findEntrance(group),`${base.id}: shaped terrain has entrance`);
 check(m.inGarden(.8,-7.65,.4),`${base.id}: Legacy fits`);
 for(const item of group)for(const p of worldFootprint(item))check(m.inGarden(p.x,p.z,p.radius+.05),`${base.id}: template pieces inside new contour`);
 const g=shape.gardenSurface();
 check([...g.attributes.position.array].every(Number.isFinite),`${base.id}: finite terrain vertices`);
 check([...g.attributes.uv.array].every(n=>n>=0&&n<=1),`${base.id}: texture coordinates cover terrain`);
 g.dispose();
 for(let i=0;i<32;i++){const [x,z]=m.gardenBoundary(i*Math.PI/16);check(!m.inGarden(x*1.01,z*1.01),`${base.id}: exterior blocked`);check(m.inGarden(x*.99,z*.99),`${base.id}: interior matches outline`);}
}
m.configureGarden(5.15,9.15,2);
console.log('Four terrain formats: geometry, UVs, boundaries, Legacy and template fit passed.');
