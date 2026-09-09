import type { KitId } from './kits';
import { personalEdge } from './gardenTemplates';
import { useMemo, useEffect } from 'react';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { randomAt, GARDEN_X, GARDEN_Z } from './model';
export const ENVIRONMENTS=[{id:'cloister',name:'Claustro antigo'},{id:'ruins',name:'Ruínas do bosque'},{id:'mist',name:'Vale silencioso'}] as const;
export type EnvironmentId=typeof ENVIRONMENTS[number]['id'];
export const PERSONAL_EDGE=-4.05;
// All texture data is generated locally. Broad mineral veins and pores use different scales.
function mineral(){
 const size=256,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const wave=Math.sin(x*.071+Math.sin(y*.031)*3)*12+Math.sin(y*.18+x*.035)*6;
  const pore=randomAt(x+91,y),n=158+wave+pore*28-(pore>.985?55:0);
  const i=(y*size+x)*4;data.set([n,n*.96,n*.85,255],i);
 }
 const t=new T.DataTexture(data,size,size);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.needsUpdate=true;return t;
}
export function Sanctuary({environment}:{environment:EnvironmentId}){
 const assets=useMemo(()=>{
  const stones:T.BufferGeometry[]=[],moss:T.BufferGeometry[]=[],far:T.BufferGeometry[]=[];
  const block=(x:number,y:number,z:number,w:number,h:number,d:number,angle=0,seed=0)=>{
   const g=new T.BoxGeometry(w,h,d,2,2,2).toNonIndexed(),p=g.attributes.position,colors=[];
   for(let i=0;i<p.count;i++){
    const px=p.getX(i),py=p.getY(i),pz=p.getZ(i);
    const n=Math.sin(px*19+py*13+pz*17+seed)*.018;
    p.setXYZ(i,px+n,py+n*.7,pz+n);
    const c=new T.Color(seed%3?'#aaa38b':'#827e6d').multiplyScalar(.85+.12*Math.sin(py*7+seed));colors.push(c.r,c.g,c.b);
   }
   g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.rotateZ(angle).translate(x,y,z);stones.push(g);
  };
  // Scattered low stones mark an organic edge; the sand remains continuous.
  for(let i=0;i<23;i++){
   if(i===10||i===11||i===12)continue;
   const x=-4.3+i*.39,z=personalEdge(x);
   const g=new T.IcosahedronGeometry(1,1).scale(.18+randomAt(8,i)*.09,.07,.15+randomAt(9,i)*.06).rotateY(i).translate(x,.03,z);
   const c=new T.Color('#8a8d79');g.setAttribute('color',new T.Float32BufferAttribute(Array.from({length:g.attributes.position.count},()=>[c.r,c.g,c.b]).flat(),3));stones.push(g);
  }
  if(environment!=='mist'){
   const height=environment==='cloister'?7:4;
   // Masonry piers with real open arches, large enough to read from the garden.
   for(let pier=-3;pier<=3;pier++){
    const x=pier*3.2;
    for(let row=0;row<height;row++)block(x,.22+row*.44,-11.8,.95,.415,.95,0,pier*7+row);
    block(x,height*.44,-11.8,1.17,.20,1.12,0,pier);
   }
   for(let bay=-3;bay<3;bay++){
    const cx=bay*3.2+1.6;
    for(let k=0;k<13;k++){
     if(environment==='ruins'&&(bay%2===0&&k>5))continue;
     const a=k/12*Math.PI,r=1.6;
     block(cx+Math.cos(a)*r,height*.44+Math.sin(a)*r,-11.8,.41,.47,.8,a-Math.PI/2,k+bay*17);
    }
   }
   for(let i=0;i<24;i++){
    const x=(randomAt(71,i)-.5)*22,z=-12.4-randomAt(73,i)*3;
    const g=new T.IcosahedronGeometry(1,1).scale(.3+randomAt(1,i)*.7,.17+randomAt(2,i)*.5,.4).rotateY(i).translate(x,0,z);
    const color=new T.Color('#686c55'),arr=Array.from({length:g.attributes.position.count},()=>[color.r,color.g,color.b]).flat();g.setAttribute('color',new T.Float32BufferAttribute(arr,3));stones.push(g);
   }
  }
  for(let i=0;i<75;i++){
   const x=(randomAt(90,i)-.5)*24,z=-10.5-randomAt(30,i)*5;
   moss.push(new T.IcosahedronGeometry(1,0).scale(.25+randomAt(9,i)*.6,.035,.23).translate(x,.015,z));
  }
  for(let i=0;i<22;i++)far.push(new T.IcosahedronGeometry(1,1).scale(4+randomAt(4,i)*5,3+randomAt(6,i)*8,3).rotateY(i).translate((i-11)*4,-2,-29-randomAt(8,i)*12));
  const merge=(list:T.BufferGeometry[])=>{const g=mergeGeometries(list)!;list.forEach(p=>p.dispose());return g;};
  return {stone:merge(stones),moss:merge(moss),far:merge(far),texture:mineral()};
 },[environment]);
 useEffect(()=>()=>{Object.values(assets).forEach(a=>a.dispose());},[assets]);
 return <group>
  <mesh geometry={assets.stone} castShadow receiveShadow><meshStandardMaterial vertexColors map={assets.texture} bumpMap={assets.texture} bumpScale={.065} roughness={.94}/></mesh>
  <mesh geometry={assets.moss} receiveShadow><meshStandardMaterial color="#4e5935" roughness={1}/></mesh>
  <mesh geometry={assets.far}><meshStandardMaterial color={environment==='mist'?'#68797c':'#6f776d'} roughness={1}/></mesh>
 </group>;
}
// Individual folded leaves create open silhouettes and visible branches instead of solid canopy balls.
export function BotanicalTree({x,z,seed=1,kind='maple',kit='starter'}:{x:number;z:number;seed?:number;kind?:'maple'|'pine';kit?:KitId}){
 const geo=useMemo(()=>{
  const pine=kind==='pine'&&kit==='starter';
  const wood:T.BufferGeometry[]=[],leaves:T.BufferGeometry[]=[];
  const branch=(a:T.Vector3,b:T.Vector3,r:number)=>{const d=b.clone().sub(a),g=new T.CylinderGeometry(r*.45,r,d.length(),7);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());wood.push(g);};
  branch(new T.Vector3(),new T.Vector3(.23,3.6,.1),.18);
  for(let k=0;k<15;k++){
   const angle=k*2.399+seed,h=(pine?.85:1.3)+k*(pine?.21:.14),r=(pine?1.45:1.7)*(1-k/(pine?17:26)),tip=new T.Vector3(Math.cos(angle)*r,h+(kit==='genesis'?.25:.6),Math.sin(angle)*r);
   branch(new T.Vector3(.1,h,0),tip,.052);
   for(let j=0;j<65;j++){
    const a=randomAt(k+seed,j)*6.28,rad=Math.sqrt(randomAt(k+61,j))*(pine?.50:.75);
    const p=tip.clone().add(new T.Vector3(Math.cos(a)*rad,(randomAt(k+13,j)-.3)*.55,Math.sin(a)*rad));
    const s=(pine?.07:.10)+randomAt(k+38,j)*(pine?.09:.12);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,-s, -s*.48,0,0,0,s*.18,0, 0,0,-s,0,s*.18,0,s*.48,0,0, -s*.48,0,0,0,0,s,0,s*.18,0, 0,s*.18,0,0,0,s,s*.48,0,0],3));
    g.rotateX(randomAt(k+19,j)*1.6).rotateY(a).translate(p.x,p.y,p.z);g.computeVertexNormals();const c=new T.Color((kit==='genesis'?['#654085','#8052a2','#a575c1','#c298d8']:kit==='luxury'?['#b39347','#d0b969','#958547','#dccb80']:pine?['#304b3c','#45604a','#627854','#3b583c']:['#796333','#98904e','#687647','#b09452'])[j%4]);g.setAttribute('color',new T.Float32BufferAttribute(Array.from({length:12},()=>[c.r,c.g,c.b]).flat(),3));leaves.push(g);
   }
  }
  const merge=(list:T.BufferGeometry[])=>{const g=mergeGeometries(list)!;list.forEach(a=>a.dispose());return g;};return {wood:merge(wood),leaves:merge(leaves)};
 },[seed,kind,kit]);
 useEffect(()=>()=>{geo.wood.dispose();geo.leaves.dispose();},[geo]);
 return <group position={[x,0,z]}><mesh geometry={geo.wood} castShadow receiveShadow><meshStandardMaterial color={kit==='genesis'?'#665574':kit==='luxury'?'#7b694b':'#66503b'} roughness={1}/></mesh><mesh geometry={geo.leaves} castShadow receiveShadow><meshStandardMaterial vertexColors side={T.DoubleSide} roughness={.85}/></mesh></group>;
}

