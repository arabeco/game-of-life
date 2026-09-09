import { gardenSurface } from './gardenSurface';
import { useEffect, useLayoutEffect, useMemo, useRef, memo } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getObjectGeometry, opaqueMaterial } from './procedural';
import { GARDEN_X, GARDEN_Z, gardenBoundary, isPath, isWater, randomAt, type GardenObject, type GardenPalette } from './model';

function InstanceBatch({ items, select, shadows, palette }: { palette:GardenPalette; items: GardenObject[]; select: (id:string,e:ThreeEvent<MouseEvent>)=>void; shadows:boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const geometry=getObjectGeometry(items[0].type,items[0].variant,palette,items[0].kit);
  useLayoutEffect(()=>{ const mesh=ref.current; return ()=>mesh.dispose(); },[items.length]);
  useLayoutEffect(()=>{
    const m=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3();
    items.forEach((item,i)=>{ q.setFromAxisAngle(new THREE.Vector3(0,1,0),item.rotation);p.set(...item.position);m.compose(p,q,new THREE.Vector3(1,1,1));ref.current.setMatrixAt(i,m); });
    ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere();
  },[items]);
  return <instancedMesh ref={ref} args={[geometry,opaqueMaterial,items.length]} dispose={null} castShadow={shadows&&!isPath(items[0].type)} receiveShadow
    onClick={e=>{ if(e.instanceId!==undefined) select(items[e.instanceId].id,e); }} />;
}
export const GardenInstances = memo(function GardenInstances({ objects, select, shadows, palette = 'autumn' }: { palette?:GardenPalette; objects:GardenObject[];select:(id:string,e:ThreeEvent<MouseEvent>)=>void;shadows:boolean }) {
  const batches=useMemo(()=>{
    const groups=new Map<string,GardenObject[]>();
    for(const item of objects) if(!isWater(item.type)) { const key=`${item.type}-${item.variant}-${item.kit??'starter'}`; const list=groups.get(key)??[];list.push(item);groups.set(key,list); }
    return [...groups.entries()];
  },[objects]);
  return <>{batches.map(([key,items])=><InstanceBatch key={key} items={items} select={select} shadows={shadows} palette={palette}/>)}</>;
});
export function ObjectGhost({ item, valid, palette }: {item:GardenObject;valid:boolean;palette?:GardenPalette}) {
  return <mesh geometry={getObjectGeometry(item.type,item.variant,palette)} position={item.position} rotation={[0,item.rotation,0]} dispose={null} renderOrder={5}>
    <meshStandardMaterial color={valid?'#e6e9b8':'#e38874'} transparent opacity={.62} depthWrite={false} roughness={1}/>
  </mesh>;
}
export function PerformanceProbe() {
  useFrame(({gl})=>{
    gl.domElement.dataset.drawCalls=String(gl.info.render.calls);
    gl.domElement.dataset.triangles=String(gl.info.render.triangles);
    gl.domElement.dataset.geometries=String(gl.info.memory.geometries);
  });
  return null;
}
export function StaticShadows({objects,quality}:{objects:GardenObject[];quality:string}) {
  const {gl,invalidate}=useThree();
  useLayoutEffect(()=>{
    gl.shadowMap.autoUpdate=false;
    gl.shadowMap.needsUpdate=true;
    invalidate();
  },[gl,invalidate,objects,quality]);
  return null;
}
function sandTexture() {
  const bytes=new Uint8Array(128*128*4);
  for(let i=0;i<128*128;i++) {const shade= randomAt(71,i)*14;bytes[i*4]=225-shade;bytes[i*4+1]=216-shade;bytes[i*4+2]=189-shade;bytes[i*4+3]=255;}
  const texture=new THREE.DataTexture(bytes,128,128);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(24,36);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;return texture;
}
export const Scenery = memo(function Scenery({plain=false}:{plain?:boolean}) {
  const assets=useMemo(()=>{
    const rings=Array.from({length:15},(_,i)=>new THREE.RingGeometry(.95+i*.115,.968+i*.115,100).rotateX(-Math.PI/2).scale(1,1,.82).translate(-1.5,.009,-3.3));
    const ringGeometry=mergeGeometries(rings)!;rings.forEach(g=>g.dispose());
    const rim=[];
    for(let i=0;i<90;i++) {const a=i/90*Math.PI*2; const [x,z]=gardenBoundary(a);rim.push(new THREE.IcosahedronGeometry(1,1).scale(.25+randomAt(8,i)*.15,.055,.32).rotateY(a).translate(x,-.025,z));}
    const rimGeometry=mergeGeometries(rim)!;rim.forEach(g=>g.dispose());
    const grasses=[];
    for(let i=0;i<110;i++) { const a=i/110*Math.PI*2;const [x,z]=gardenBoundary(a,.1);for(let j=0;j<3;j++){const h=.12+randomAt(i+1,j)*.25;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([x-.03,-.01,z,x+.03,-.01,z,x+Math.sin(i+j)*.15,h,z+.05],3));g.computeVertexNormals();grasses.push(g);}}
    const grassGeometry=mergeGeometries(grasses)!;grasses.forEach(g=>g.dispose());
    return { ringGeometry,rimGeometry,grassGeometry,texture:sandTexture(),surface:gardenSurface(.07) };
  },[]);
  useEffect(()=>()=>Object.values(assets).forEach(a=>a.dispose()),[assets]);
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.4,0]}><planeGeometry args={[160,160]}/><meshStandardMaterial color="#6f8779" roughness={1}/></mesh>
    {!plain&&<mesh position={[0,-.3,0]} scale={[GARDEN_X+.28,.32,GARDEN_Z+.28]}><sphereGeometry args={[1,64,12]}/><meshStandardMaterial color="#73816a" roughness={1}/></mesh>}
    <mesh rotation={[-Math.PI/2,0,0]} geometry={assets.surface} receiveShadow><meshStandardMaterial map={assets.texture} roughness={1}/></mesh>
    {!plain&&<mesh geometry={assets.ringGeometry} receiveShadow><meshStandardMaterial color="#b6ad92" roughness={1}/></mesh>}
    <mesh geometry={assets.rimGeometry} receiveShadow><meshStandardMaterial color="#788960" roughness={1}/></mesh>
    <mesh geometry={assets.grassGeometry}><meshStandardMaterial color="#8b9b71" side={THREE.DoubleSide} roughness={1}/></mesh>
    {!plain&&Array.from({length:9},(_,i)=><mesh key={i} position={[(i-4)*12,-4,-37-i%2*8]} scale={[12,6+i%3*2,12]}><sphereGeometry args={[1,16,10]}/><meshStandardMaterial color={i%2?'#7e978a':'#93a497'} roughness={1}/></mesh>)}
  </group>;
});
