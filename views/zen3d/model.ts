import type { KitId } from './kits';
export type ObjectKind = 'stone-totem' | 'guardian-statue' | 'crystal-reliquary' | 'garden-planter' | 'garden-river' | 'medieval-lamp' | 'bridge' | 'maple' | 'pine' | 'rock' | 'pebble' | 'rock-cluster' | 'path-straight' | 'path-curve' | 'path-wild' | 'pond' | 'stream-straight' | 'stream-curve' | 'lantern' | 'bamboo';
export type Category = 'Pedras' | 'Caminhos' | 'Água' | 'Plantas' | 'Luz';
export interface GardenObject { id: string; type: ObjectKind; position: [number, number, number]; rotation: number; variant: number; fixed?: boolean; kit?: KitId }
export interface GardenLayout { version: 2; objects: GardenObject[] }
export type GardenMode = 'build' | 'explore';
export type BuildTool = 'select' | 'move' | ObjectKind;
export interface StonePiece { x: number; z: number; sx: number; sy: number; sz: number; yaw: number }
export interface Circle { x: number; z: number; radius: number }
export const MAX_OBJECTS = 96;
export const VARIANTS = 6;
export const EYE_HEIGHT = 1.58;
export let GARDEN_X = 5.15;
export let GARDEN_Z = 9.15;
export let GARDEN_ROUNDNESS = 2;
// Only changed by an accepted model replacement, before remounting the isolated scene.
export function configureGarden(x:number,z:number,roundness:number){GARDEN_X=x;GARDEN_Z=z;GARDEN_ROUNDNESS=roundness;}
export function gardenBoundary(angle:number,margin=0):[number,number]{const c=Math.cos(angle),s=Math.sin(angle);return [Math.sign(c)*Math.abs(c)**(2/GARDEN_ROUNDNESS)*(GARDEN_X+margin),Math.sign(s)*Math.abs(s)**(2/GARDEN_ROUNDNESS)*(GARDEN_Z+margin)];}
export const CATEGORIES: Category[] = ['Pedras', 'Caminhos', 'Água', 'Plantas', 'Luz'];
export const CATALOG: { type: ObjectKind; category: Category; name: string; description: string }[] = [
  {type:'stone-totem',category:'Luz',name:'Totem das três pedras',description:'Pedra sobre pedra, marcas do tempo'},
  {type:'guardian-statue',category:'Luz',name:'Guardião do pátio',description:'Escultura de calcário com manto e brasão'},
  {type:'crystal-reliquary',category:'Luz',name:'Relicário de ametista',description:'Cristal suspenso em arcos de basalto'},
  { type: 'pebble', category: 'Pedras', name: 'Pedra avulsa', description: 'Uma peça, mil composições' },
  { type: 'rock', category: 'Pedras', name: 'Rocha musgosa', description: 'Um ponto de presença' },
  { type: 'rock-cluster', category: 'Pedras', name: 'Conjunto natural', description: 'Cinco pedras compostas' },
  { type: 'path-straight', category: 'Caminhos', name: 'Caminho reto', description: 'Passos de pedra · 3,2 m' },
  { type: 'path-curve', category: 'Caminhos', name: 'Caminho curvo', description: 'Uma mudança de direção' },
  { type: 'path-wild', category: 'Caminhos', name: 'Passos livres', description: 'Composição irregular' },
  { type: 'pond', category: 'Água', name: 'Lago orgânico', description: 'Um espelho de calma' },
  { type: 'stream-straight', category: 'Água', name: 'Riacho reto', description: 'Una as pontas · 3,2 m' },
  { type: 'stream-curve', category: 'Água', name: 'Curva de riacho', description: 'Água em outro ritmo' },
  { type: 'maple', category: 'Plantas', name: 'Bordo japonês', description: 'Copa leve, tons de cobre' },
  { type: 'pine', category: 'Plantas', name: 'Pinheiro', description: 'Galhos esculpidos pelo tempo' },
  { type: 'bamboo', category: 'Plantas', name: 'Bambuzal', description: 'Pequeno bosque vertical' },
  { type: 'garden-planter', category: 'Plantas', name: 'Jardineira de flores', description: 'Uma pequena composição botânica' },
  { type: 'medieval-lamp', category: 'Luz', name: 'Lanterna suspensa', description: 'Luz do kit em suporte vertical' },
  { type: 'lantern', category: 'Luz', name: 'Lanterna de pedra', description: 'Luz âmbar entre as folhas' },
];
export const isWater = (type: ObjectKind) => type === 'pond' || type === 'garden-river' || type.startsWith('stream-');
export const isPath = (type: ObjectKind) => type.startsWith('path-') || type === 'pebble';
export const randomAt = (seed: number, n: number) => { const v = Math.sin(seed * 73.13 + n * 137.91) * 43758.5453; return v - Math.floor(v); };
export function moduleLine(type: ObjectKind, variant = 0): [number, number][] {
  const count = type.startsWith('stream') ? 13 : 7;
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    if (type.endsWith('curve')) return [1.6 * (1 - Math.cos(t * Math.PI / 2)), -1.6 + 3.2 * Math.sin(t * Math.PI / 2)];
    const spread = type === 'path-wild' ? .38 : .10;
    return [Math.sin(t * Math.PI) * (randomAt(variant + 2, i) - .5) * spread, -1.6 + 3.2 * t];
  });
}
export function stonePieces(type: ObjectKind, variant = 0): StonePiece[] {
  const piece = (x: number, z: number, sx: number, sy: number, sz: number, i: number): StonePiece => ({ x, z, sx: sx * (.9 + randomAt(variant + 1, i) * .18), sy, sz, yaw: randomAt(variant + 4, i) * 6.28 });
  if (type === 'pebble') return [piece(0, 0, .36, .09, .28, 0)];
  if (type === 'rock') return [piece(0, 0, .72, .65, .56, 0)];
  if (type === 'rock-cluster') return [[0, 0, .59, .62, .48], [-.67, .18, .33, .27, .31], [.58, .39, .37, .34, .32], [.37, -.51, .28, .2, .25], [-.43, -.47, .26, .15, .24]].map(([x,z,sx,sy,sz],i) => piece(x,z,sx,sy,sz,i));
  if (type.startsWith('path')) return moduleLine(type, variant).map(([x,z], i) => piece(x + (randomAt(variant + 2, i) - .5) * .14,z,.33,.055 + randomAt(variant + 5,i) * .025,.26,i));
  return [];
}
export function waterPieces(type: ObjectKind, variant = 0): Circle[] {
  if(type==='garden-river')return Array.from({length:49},(_,i)=>{const z=-3.5+i*7/48;return {x:.38*Math.sin((z-1.8)*1.2),z,radius:.34+.035*Math.cos(z*2)};});
  if (type === 'pond') return [{ x: -.35, z: 0, radius: 1.04 }, { x: .43, z: .13, radius: .92 }, { x: .12, z: -.48, radius: .78 + variant * .025 }];
  if (type.startsWith('stream')) return moduleLine(type, variant).map(([x, z]) => ({ x, z, radius: .46 }));
  return [];
}
export function toWorld(x: number, z: number, item: Pick<GardenObject, 'position' | 'rotation'>): [number, number] {
  return [item.position[0] + x * Math.cos(item.rotation) + z * Math.sin(item.rotation), item.position[2] - x * Math.sin(item.rotation) + z * Math.cos(item.rotation)];
}
export function footprint(type: ObjectKind, variant = 0): Circle[] {
  if(type==='bridge')return [-1.45,-.72,0,.72,1.45].map(z=>({x:0,z,radius:.68}));
  if (isWater(type)) return waterPieces(type, variant);
  const stones = stonePieces(type, variant);
  if (stones.length) return stones.map(s => ({ x: s.x, z: s.z, radius: Math.max(s.sx, s.sz) }));
  return [{ x: 0, z: 0, radius: ['stone-totem','guardian-statue','crystal-reliquary'].includes(type) ? .68 : type === 'garden-planter' ? .58 : type === 'bamboo' ? .48 : type === 'lantern' ? .36 : .35 }];
}
export function worldFootprint(item: GardenObject): Circle[] {
  return footprint(item.type, item.variant).map(p => { const [x, z] = toWorld(p.x, p.z, item); return { x, z, radius: p.radius }; });
}
export function inGarden(x: number, z: number, margin = 0) { return Math.abs(x / (GARDEN_X - margin)) ** GARDEN_ROUNDNESS + Math.abs(z / (GARDEN_Z - margin)) ** GARDEN_ROUNDNESS < 1; }
export function canPlace(objects: GardenObject[], type: ObjectKind, x: number, z: number, ignoreId?: string, rotation = 0, variant = 0) {
  const candidate: GardenObject = { id: '', type, position: [x, 0, z], rotation, variant };
  // Overlap is intentional for composition, path joins and water unions. Exact duplicates are rejected.
  return worldFootprint(candidate).every(p => inGarden(p.x, p.z, p.radius + .12)) && !objects.some(o => o.id !== ignoreId && o.type === type && Math.hypot(o.position[0] - x, o.position[2] - z) < .08 && Math.abs(Math.sin((o.rotation - rotation) / 2)) < .02);
}
export function waterField(circles: Circle[], x: number, z: number) {
  let d = 100;
  for (const p of circles) d = Math.min(d, Math.hypot(x - p.x, z - p.z) - p.radius);
  return d;
}
export function collisionCircles(objects: GardenObject[]): Circle[] {
  return objects.filter(o => !isPath(o.type) && o.type !== 'bridge').flatMap(worldFootprint);
}
export function canWalkCircles(circles: Circle[], x: number, z: number) {
  return inGarden(x, z, .24) && circles.every(p => Math.hypot(x - p.x, z - p.z) > p.radius + .20);
}
export function bridgeHeight(objects: GardenObject[], x: number, z: number): number | null {
  for(const b of objects.filter(o=>o.type==='bridge')) {
    const dx=x-b.position[0],dz=z-b.position[2],lx=dx*Math.cos(b.rotation)-dz*Math.sin(b.rotation),lz=dx*Math.sin(b.rotation)+dz*Math.cos(b.rotation);
    if(Math.abs(lx)<.49 && Math.abs(lz)<1.8) return .04+.25*Math.cos(lz/1.8*Math.PI/2);
  }
  return null;
}
export function canWalk(objects: GardenObject[], x: number, z: number) {
  const bridge=bridgeHeight(objects,x,z)!==null;
  return canWalkCircles(collisionCircles(bridge?objects.filter(o=>!isWater(o.type)):objects),x,z);
}
export function findEntrance(objects: GardenObject[]): [number, number, number] | null {
  const circles = collisionCircles(objects);
  for (let z = 7.6; z >= -8; z -= .4) for (let x = 0; x <= 4.6; x += .4) {
    if (canWalkCircles(circles, x, z)) return [x, EYE_HEIGHT, z];
    if (canWalkCircles(circles, -x, z)) return [-x, EYE_HEIGHT, z];
  }
  return null;
}
// Gentle endpoint attraction, only for modules of the same family. No visible grid.
export function snapModule(objects: GardenObject[], candidate: GardenObject): GardenObject {
  const family = candidate.type.startsWith('stream') ? 'stream' : candidate.type.startsWith('path') ? 'path' : null;
  if (!family) return candidate;
  const endpoints = (item: GardenObject) => { const line = moduleLine(item.type, item.variant); return [line[0], line[line.length - 1]].map(([x,z]) => toWorld(x,z,item)); };
  let best = .48;
  let offset = [0, 0];
  for (const own of endpoints(candidate)) for (const other of objects) {
    if (other.id === candidate.id || !other.type.startsWith(family)) continue;
    for (const end of endpoints(other)) { const d = Math.hypot(end[0] - own[0], end[1] - own[1]); if (d < best) { best = d; offset = [end[0] - own[0], end[1] - own[1]]; } }
  }
  return { ...candidate, position: [candidate.position[0] + offset[0], 0, candidate.position[2] + offset[1]] };
}
const object = (id: string, type: ObjectKind, x: number, z: number, rotation = 0, variant = 0): GardenObject => ({ id, type, position: [x,0,z], rotation, variant });
export const INITIAL_LAYOUT: GardenLayout = { version: 2, objects: [
  object('maple-1','maple',-2.9,-4.9, .3, 2), object('maple-2','maple',3,3, 1.6, 4),
  object('pine-1','pine',2.7,-5.8,.4,1), object('pine-2','pine',-3.4,1.1,2,3),
  object('bamboo-1','bamboo',-3.3,-2.9,0,2), object('bamboo-2','bamboo',3.7,-2.1,1,4),
  object('rock-1','rock-cluster',-1.5,-3.3,.3,2), object('rock-2','rock',3,-.2,1,5),
  object('lamp-1','lantern',-1.7,4.1,0,0), object('lamp-2','lantern',1.3,-5.1,0,2),
  object('pond-1','pond',1.5,-1.8,0,2), object('stream-1','stream-straight',1.3,1.1,0,1),
  object('path-1','path-straight',-.2,5.3,0,1), object('path-2','path-curve',-.2,2.1,Math.PI,3),
] };

export type GardenPalette = 'serene' | 'autumn' | 'blossom';
export const PALETTES: {id:GardenPalette;name:string;colors:string[]}[] = [
  {id:'serene',name:'Verde sereno',colors:['#52785b','#90a579']},
  {id:'autumn',name:'Outono',colors:['#b86549','#d8a46c']},
  {id:'blossom',name:'Flores rosadas',colors:['#b97f91','#e1bac5']},
];
export const GARDEN_MODELS = [
  {id:'pond',name:'Espelho de calma',description:'Laguinho e passos de pedra',icon:'◯'},
  {id:'stream',name:'Entre margens',description:'Riacho com ponte de madeira',icon:'⌒'},
  {id:'sand',name:'Pátio sereno',description:'Areia zen e caminho curvo',icon:'◎'},
] as const;
export type GardenModel = typeof GARDEN_MODELS[number]['id'];
export function modelBase(model:GardenModel): GardenObject[] {
  const base = model==='stream' ? [
    object('base-river-1','stream-straight',-1.6,0,Math.PI/2),object('base-river-2','stream-straight',1.6,0,Math.PI/2),
    object('base-bridge','bridge',0,0),object('base-path-1','path-straight',0,3.4),object('base-path-2','path-straight',0,-3.4),
  ] : [object('base-path-1','path-straight',-.4,5.3),object('base-path-2','path-curve',-.4,2.1,Math.PI),
    ...(model==='pond'?[object('base-pond','pond',1.5,-1.8,0,2)]:[])];
  return base.map(o=>({...o,fixed:true}));
}
export function modelLayout(model:GardenModel):GardenObject[] {
  return [...modelBase(model),...INITIAL_LAYOUT.objects.filter(o=>!isWater(o.type)&&!o.type.startsWith('path'))
    .filter(o=>model!=='stream'||!['rock-2','pine-2'].includes(o.id)).map(o=>({...o,position:[...o.position] as [number,number,number]}))];
}

export function clearOfBase(objects:GardenObject[],item:GardenObject):boolean {
  return worldFootprint(item).every(p=>objects.filter(o=>o.fixed).every(o=>{
    if(isWater(o.type))return worldFootprint(o).every(w=>Math.hypot(p.x-w.x,p.z-w.z)>p.radius+w.radius+.08);
    if(o.type==='bridge') {
      const dx=p.x-o.position[0],dz=p.z-o.position[2],x=dx*Math.cos(o.rotation)-dz*Math.sin(o.rotation),z=dx*Math.sin(o.rotation)+dz*Math.cos(o.rotation);
      return Math.abs(x)>.72+p.radius || Math.abs(z)>1.85+p.radius;
    }
    return true;
  }));
}
