import type { KitId } from './kits';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { randomAt, stonePieces, type ObjectKind, type GardenPalette } from './model';

const cache = new Map<string, THREE.BufferGeometry>();
export const opaqueMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .91, metalness: .02 });
const grainBytes=new Uint8Array(128*128*4);
for(let i=0;i<128*128;i++){const n=170+Math.floor(randomAt(93,i)*65);grainBytes.set([n,n,n,255],i*4);}
const grain=new THREE.DataTexture(grainBytes,128,128);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(3,3);grain.needsUpdate=true;
opaqueMaterial.bumpMap=grain;opaqueMaterial.bumpScale=.022;opaqueMaterial.roughnessMap=grain;
const rockBase = new THREE.IcosahedronGeometry(1, 2);
const pos = rockBase.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
  const n = 1 + .07 * Math.sin(x * 7 + z * 3) + .045 * Math.cos(y * 11 - x * 4);
  pos.setXYZ(i, x * n, y * n, z * n);
}
rockBase.computeVertexNormals();
const leafBase = new THREE.SphereGeometry(1, 7, 4);
function colored(g: THREE.BufferGeometry, color: string, seed: number) {
  const geo = g.index ? g.toNonIndexed() : g;
  if (g.index) g.dispose();
  const p = geo.attributes.position;
  const base = new THREE.Color(color);
  const colors = new Float32Array(p.count * 3);
  for (let i=0;i<p.count;i++) {
    const shade = .9 + .1 * Math.sin(p.getY(i) * 1.3 + seed) + .035 * Math.sin(p.getX(i) * 13 + p.getZ(i) * 9);
    colors[i*3] = base.r * shade; colors[i*3+1] = base.g * shade; colors[i*3+2] = base.b * shade;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
  return geo;
}
export function getObjectGeometry(type: ObjectKind, variant = 0, palette:GardenPalette = 'autumn',kit:KitId='starter') {
  const key = `${kit}:${type}:${variant}:${type==='maple'||type==='pine'?palette:'shared'}`;
  const existing = cache.get(key); if (existing) return existing;
  const luxe=kit==='luxury',genesis=kit==='genesis';
  const stoneColor=luxe?'#d5cbb0':genesis?'#514a68':'#929487',metal=luxe?'#ba9349':genesis?'#a592c7':'#605a42',glow=genesis?'#c79cf5':'#f0c675';
  const parts: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, color: string) => parts.push(colored(g,color,variant));
  const blob = (x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string,leaf=false,yaw=0) => add((leaf ? leafBase : rockBase).clone().scale(sx,sy,sz).rotateY(yaw).translate(x,y,z),color);
  const branch = (a:number[],b:number[],r:number,color='#675d47',end=.65) => {
    const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), delta=bv.clone().sub(av);
    const g = new THREE.CylinderGeometry(r*end,r,delta.length(),7);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));
    g.translate(...av.add(bv).multiplyScalar(.5).toArray()); add(g,color);
  };
  // Signature pieces: each is a different sculpture, not a recolored shared mesh.
  if(type==='stone-totem') {
    blob(0,.08,0,.52,.12,.44,'#737e6a');
    blob(-.05,.36,.02,.34,.30,.30,'#a0a38d');
    blob(.04,.84,-.02,.29,.27,.25,'#858d7b');
    blob(-.03,1.27,.01,.25,.22,.23,'#b1b39b');
    for(let i=0;i<3;i++)add(new THREE.TorusGeometry(.08,.013,4,12).translate(-.03,1.23+i*.055,.222),'#63715b');
    for(let i=0;i<4;i++)blob(Math.cos(i*2.1)*.37,.04,Math.sin(i*2.1)*.28,.14,.04,.10,'#688052',true);
  }
  if(type==='guardian-statue') {
    const marble='#d8ceb1',bronze='#b09151';
    add(new THREE.CylinderGeometry(.51,.60,.16,8).translate(0,.08,0),marble);
    add(new THREE.CylinderGeometry(.39,.48,.17,8).translate(0,.24,0),'#b9af94');
    add(new THREE.ConeGeometry(.40,1.08,10).translate(0,.85,0),marble);
    blob(0,1.18,0,.31,.30,.21,marble);
    add(new THREE.SphereGeometry(.23,12,8).scale(1,1.25,1).translate(0,1.62,0),marble);
    add(new THREE.SphereGeometry(.13,9,6).scale(1,1.2,.25).translate(0,1.61,.207),'#5d615d');
    for(const side of [-1,1])branch([side*.24,1.34,.03],[side*.20,.89,.19],.105,marble,.8);
    add(new THREE.CylinderGeometry(.24,.24,.055,10).rotateX(Math.PI/2).translate(0,.91,.29),bronze);
    add(new THREE.TorusGeometry(.18,.022,4,16).translate(0,.91,.325),'#eee2b9');
    add(new THREE.OctahedronGeometry(.10).scale(1,1.35,.25).translate(0,.91,.34),marble);
    for(const x of [-.17,0,.17])branch([x,.43,.21],[x*.7,1.09,.22],.012,'#a9a18b',1);
  }
  if(type==='crystal-reliquary') {
    add(new THREE.CylinderGeometry(.43,.57,.22,7).translate(0,.11,0),'#494355');
    for(const z of [-.13,.13])add(new THREE.TorusGeometry(.48,.066,5,22,Math.PI).translate(0,.69,z),'#8c78ac');
    for(const x of [-.48,.48])branch([x,.18,0],[x,.70,0],.07,'#716280',1);
    add(new THREE.OctahedronGeometry(.32).scale(.8,1.85,.8).rotateY(.4).translate(0,.91,0),'#bf97eb');
    add(new THREE.TorusGeometry(.27,.023,4,20).rotateX(Math.PI/2).translate(0,.46,0),'#c2aed8');
    for(let i=0;i<6;i++){const a=i*1.047;add(new THREE.OctahedronGeometry(.10).scale(.65,1.7,.65).translate(Math.cos(a)*.35,.27,Math.sin(a)*.35),i%2?'#8f69ba':'#b690db');}
  }
  if(type==='bridge') {
    for(let i=0;i<19;i++) {
      const z=-1.71+i*.19,y=.04+.25*Math.cos(z/1.8*Math.PI/2);
      add(new THREE.BoxGeometry(1.3,.075,.18).translate(0,y-.04,z),i%3?'#8b7050':'#a38963');
    }
    for(const x of [-.62,.62]) {
      for(const z of [-1.5,-.75,0,.75,1.5]) { const y=.04+.25*Math.cos(z/1.8*Math.PI/2);branch([x,y,z],[x,y+.68,z],.042,'#69533f',1); }
      for(let i=0;i<12;i++) { const z=-1.6+i*3.2/12,n=z+3.2/12;branch([x,.72+.25*Math.cos(z/1.8*Math.PI/2),z],[x,.72+.25*Math.cos(n/1.8*Math.PI/2),n],.032,'#a58a60',1); }
    }
  }
  const stones = stonePieces(type,variant);
  stones.forEach((s,i) => {
    if(luxe&&s.sy<.2)add(new THREE.CylinderGeometry(s.sx,s.sx*.94,s.sy*1.6,6).rotateY(s.yaw*.15).translate(s.x,s.sy*.8,s.z),stoneColor);
    else blob(s.x,s.sy*.64,s.z,s.sx,s.sy,s.sz,kit==='starter'?['#929487','#818d85','#9da293'][i%3]:stoneColor,false,s.yaw);
    if(s.sy>.25&&kit==='starter') for(let j=0;j<3;j++) blob(s.x+(j-1)*s.sx*.22,s.sy*1.32,s.z-.06,s.sx*.42,.035,s.sz*.45,['#687a4b','#819058','#96a270'][j],true,s.yaw);
  });
  if(luxe&&stones.length){
    stones.forEach(s=>{if(s.sy<.2){add(new THREE.TorusGeometry(.12,.015,4,16).rotateX(-Math.PI/2).translate(s.x,s.sy*1.7+.01,s.z),metal);} });
    if(type==='rock')for(let i=0;i<3;i++)branch([-.40+i*.18,.32,-.48],[-.31+i*.18,.88,-.2],.015,metal,1);
  }
  if(genesis&&stones.length){
    if(type==='rock'||type==='rock-cluster')for(let i=0;i<5;i++){
      const a=i*2.4,x=Math.cos(a)*.28,z=Math.sin(a)*.27,h=.32+(i%3)*.16;
      add(new THREE.CylinderGeometry(.02,.12,h,5).rotateZ((i-2)*.13).translate(x,.93+h*.45,z),i%2?'#a675d6':'#c5a4ea');
    }
    else stones.forEach(s=>add(new THREE.OctahedronGeometry(.08).scale(1,.22,1).translate(s.x,s.sy*1.7+.01,s.z),'#b18fdb'));
  }
  if(type==='garden-planter'){
    const soilY=luxe?.79:genesis?.30:.355;
    if(luxe){
      add(new THREE.CylinderGeometry(.28,.37,.10,10).translate(0,.05,0),stoneColor);
      add(new THREE.CylinderGeometry(.12,.20,.36,10).translate(0,.27,0),stoneColor);
      add(new THREE.CylinderGeometry(.47,.13,.38,12).translate(0,.62,0),stoneColor);
      for(const x of [-.48,.48])add(new THREE.TorusGeometry(.14,.032,5,16).translate(x,.62,0),metal);
    }else if(genesis){
      add(new THREE.CylinderGeometry(.48,.34,.26,7).translate(0,.15,0),stoneColor);
      for(let i=0;i<7;i++){const a=i*.897;add(new THREE.OctahedronGeometry(.10).scale(.7,1.7,.7).translate(Math.cos(a)*.48,.28,Math.sin(a)*.48),'#a382ca');}
    }else add(new THREE.CylinderGeometry(.52,.32,.32,9).translate(0,.19,0),stoneColor);
    add(new THREE.CylinderGeometry(.44,.44,.035,16).translate(0,soilY,0),'#423c32');
    if(!genesis)add(new THREE.TorusGeometry(.47,.035,5,24).rotateX(-Math.PI/2).translate(0,soilY,0),metal);
    for(let i=0;i<13;i++){
      const a=i*2.399,r=Math.sqrt(i/13)*.36,x=Math.cos(a)*r,z=Math.sin(a)*r,h=.22+randomAt(variant+3,i)*.20;
      branch([x,soilY,z],[x+.05,soilY+h,z],.012,genesis?'#626280':'#6a8055',.5);
      for(let j=0;j<5;j++){const q=j*1.257;blob(x+.05+Math.cos(q)*.055,soilY+h,z+Math.sin(q)*.055,.054,.022,.036,genesis?'#ba8be6':luxe?'#e8d5a0':'#d3cda1',true,q);}
    }
  }
  if (type === 'maple' || type === 'pine') {
    const pine = type === 'pine';
    const scale = .94 + variant*.035;
    const lean = .17 + randomAt(variant+1,0)*.2;
    branch([0,0,0],[lean,.95,0],.17); branch([lean,.9,0],[-.09,2.1,.08],.13); branch([-.09,2.05,.08],[.18,3.35,-.13],.085);
    for(let i=0;i<6;i++) {
      const a=i*2.4+variant*.6, h=1.5+i*.24;
      const tip=[Math.cos(a)*(pine?1.05:1.25),h+.65,Math.sin(a)*.85];
      branch([.04,h,0],tip,.065); branch([tip[0]*.65,h+.36,tip[2]*.65],[tip[0]*1.17,h+.98,tip[2]*1.15],.036);
      for(let j=0;j<12;j++) {
        const q=j*2.399, r=Math.sqrt(j/12)*.87;
        const x=tip[0]+Math.cos(q)*r, z=tip[2]+Math.sin(q)*r;
        const y=h+.82+randomAt(variant+i+5,j)*.35;
        const colors=palette==='blossom'&&!pine?['#b77f91','#ca96a6','#d7abba','#e1bac5']:palette==='serene'?['#456b4f','#62875b','#749669','#8fa379']:pine?['#345948','#456b4f','#507353','#5d7d59']:['#a55841','#b86549','#c97951','#bf784f'];
        blob(x,y,z,.23+randomAt(variant+i,j)*.22,pine?.13:.20,.28,colors[(i+j+variant)%4],true,q);
      }
    }
    blob(0,.012,0,.67,.045,.49,'#77885e',true);
    // Exposed roots anchor the tree at walking scale.
    for(let i=0;i<5;i++) branch([0,.18,0],[Math.cos(i*1.26)*.5,.02,Math.sin(i*1.26)*.44],.045);
    parts.forEach(g=>g.scale(scale,scale,scale));
  }
  if(type==='bamboo') {
    for(let i=0;i<6;i++) {
      const x=(randomAt(variant+1,i)-.5)*.66,z=(randomAt(variant+4,i)-.5)*.6,h=2.25+randomAt(variant+8,i)*1.1;
      branch([x,0,z],[x+.12,h,z-.07],.043,'#849363',.85);
      for(let j=1;j<6;j++) { const y=j*h/6; add(new THREE.CylinderGeometry(.049,.049,.032,6).translate(x+.12*y/h,y,z-.07*y/h),'#b4b48a'); }
      for(let j=0;j<7;j++) {
        const a=j*2.4+i, y=h-.2-j*.13;
        const end=[x+Math.cos(a)*.45,y+.13,z+Math.sin(a)*.45];
        branch([x,y,z],end,.013,'#627b4c');
        blob(end[0],end[1],end[2],.24,.022,.065,['#53764b','#79945c','#99a878'][j%3],true,a);
      }
    }
  }
  if(type==='medieval-lamp'&&kit==='luxury') {
    add(new THREE.CylinderGeometry(.22,.32,.18,8).translate(0,.09,0),stoneColor);
    branch([0,.18,0],[0,1.4,0],.065,metal,1);
    for(const x of [-.35,0,.35]){
      const y=x===0?1.6:1.35;
      branch([0,.9,0],[x,y-.16,0],.04,metal,1);
      add(new THREE.CylinderGeometry(.14,.07,.09,8).translate(x,y-.12,0),metal);
      add(new THREE.CylinderGeometry(.05,.05,.24,8).translate(x,y+.02,0),'#e8d8ac');
      add(new THREE.OctahedronGeometry(.09).scale(.55,1.6,.55).translate(x,y+.2,0),glow);
    }
  }
  if(type==='medieval-lamp'&&kit==='genesis') {
    add(new THREE.CylinderGeometry(.22,.34,.2,6).translate(0,.1,0),stoneColor);
    add(new THREE.CylinderGeometry(.14,.23,.9,6).translate(0,.65,0),stoneColor);
    add(new THREE.OctahedronGeometry(.27).scale(.7,1.8,.7).translate(0,1.4,0),glow);
    for(let i=0;i<3;i++){
      const a=i*Math.PI*2/3;
      branch([Math.cos(a)*.18,1,Math.sin(a)*.18],[Math.cos(a)*.3,1.55,Math.sin(a)*.3],.035,metal,1);
    }
  }
  if(type==='medieval-lamp'&&kit==='starter') {
    const frame=kit==='starter'?'#343b32':metal;
    blob(0,.09,0,.34,.10,.31,'#697363');
    branch([0,.1,0],[0,1.6,0],.065,kit==='starter'?'#69513a':frame,1);
    branch([0,1.55,0],[.37,1.55,0],.045,metal,1);
    add(new THREE.CylinderGeometry(.16,.20,.33,6).translate(.34,1.27,0),glow);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;branch([.34+Math.cos(a)*.17,1.1,Math.sin(a)*.17],[.34+Math.cos(a)*.17,1.45,Math.sin(a)*.17],.018,metal,1);}
    add(new THREE.ConeGeometry(.27,.20,6).translate(.34,1.52,0),metal);
    add(new THREE.CylinderGeometry(.22,.18,.07,6).translate(.34,1.08,0),metal);
    if(kit!=='starter'){
      add(new THREE.CylinderGeometry(.20,.26,.17,8).translate(0,.16,0),stoneColor);
      for(let i=0;i<3;i++)add(new THREE.TorusGeometry(.09,.022,5,16).rotateX(-Math.PI/2).translate(0,.45+i*.24,0),metal);
    }
    if(variant>0){add(new THREE.TorusGeometry(.11,.025,5,16).translate(0,.8,0),metal);}
  }
  if(type==='lantern') {
    blob(0,.07,0,.38,.09,.34,'#788277');
    add(new THREE.CylinderGeometry(.11,.16,.76,9).translate(0,.47,0),'#929785');
    add(new THREE.CylinderGeometry(.31,.37,.12,8).translate(0,.89,0),'#7b8677');
    add(new THREE.CylinderGeometry(.21,.23,.32,8).translate(0,1.10,0),'#ffe5a2');
    for(let i=0;i<4;i++) {const a=i*Math.PI/2;branch([Math.cos(a)*.22,.94,Math.sin(a)*.22],[Math.cos(a)*.22,1.29,Math.sin(a)*.22],.035,'#636f62');}
    add(new THREE.ConeGeometry(.49,.24,8).translate(0,1.38,0),'#71846c');
    blob(0,1.55,0,.07,.10,.07,'#829070');
  }
  const result = parts.length ? mergeGeometries(parts)! : new THREE.BufferGeometry();
  parts.forEach(g=>g.dispose()); cache.set(key,result); return result;
}
export function releaseProceduralAssets() { cache.forEach(g=>g.dispose()); cache.clear(); opaqueMaterial.dispose(); grain.dispose(); rockBase.dispose(); leafBase.dispose(); }
if(import.meta.hot) import.meta.hot.dispose(releaseProceduralAssets);
