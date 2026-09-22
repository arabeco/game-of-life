import { createGardenArt, isNewGardenPiece, NEW_GARDEN_PIECES } from './GardenArt';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createBaseKit, KIT_THEMES, type KitTheme } from '../../tools/zen-quality/baseKit';
import { GardenInstances } from './GardenObjects';
import { BotanicalTree } from './Sanctuary';
import { stonePieces, type GardenObject, type ObjectKind } from './model';
import type { KitId } from './kits';
import sandColorUrl from '../../tools/zen-quality/assets/sand/compact/diff.webp?url';
import sandRoughUrl from '../../tools/zen-quality/assets/sand/compact/rough.webp?url';

type Part = {geometry:T.BufferGeometry;material:T.Material|T.Material[];matrix:T.Matrix4};
const supported = new Set<ObjectKind>([...NEW_GARDEN_PIECES,'pine','maple','rock','pebble','rock-cluster','path-straight','path-curve','path-wild','bamboo','lantern','bridge']);
const themeOf=(kit:KitId):KitTheme=>kit==='starter'?'serene':kit;
const themeCache=new WeakMap<Library,Map<string,Part[]>>();

// Flatten shared prototypes once; instance transforms keep the saved item IDs intact.
function parts(root:T.Object3D, size?:T.Vector3):Part[] {
 root.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(root),extent=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
 const normalize=new T.Matrix4();
 if(size)normalize.makeScale(size.x/extent.x,size.y/extent.y,size.z/extent.z).multiply(new T.Matrix4().makeTranslation(-center.x,-box.min.y,-center.z));
 const result:Part[]=[];
 root.traverse(o=>{
  if(!(o instanceof T.Mesh))return;
  const base=normalize.clone().multiply(o.matrixWorld);
  if(o instanceof T.InstancedMesh)for(let i=0;i<o.count;i++){const m=new T.Matrix4();o.getMatrixAt(i,m);result.push({geometry:o.geometry,material:o.material,matrix:base.clone().multiply(m)});}
  else result.push({geometry:o.geometry,material:o.material,matrix:base});
 });
 return result;
}

class Library {
 private art=new Map<string,T.Group>();
 private kits=new Map<KitId,T.Group>();
 private materials=new Set<T.Material>();
 constructor(readonly tree:T.Group,readonly rock:T.Group,readonly sand?:T.Texture,readonly rough?:T.Texture) {themeCache.set(this,new Map());}
 get(type:ObjectKind,kit:KitId):Part[] {
  const cache=themeCache.get(this)!,key=`${type}:${kit}`,existing=cache.get(key);if(existing)return existing;
  const theme=themeOf(kit);let result:Part[];
  if(isNewGardenPiece(type)){
   let source=this.art.get(key);if(!source){let material:T.MeshStandardMaterial|undefined;this.rock.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial)material??=o.material;});source=createGardenArt(type,theme,material);this.art.set(key,source);}
   result=parts(source);
  }else if(type==='pine'||type==='maple') {
   result=parts(this.tree,new T.Vector3(type==='pine'?4.6:4.9,type==='pine'?5.5:4.8,4.5)).map(p=>{
    if(!(p.material instanceof T.MeshStandardMaterial)||!p.material.name.includes('leaves')||!KIT_THEMES[theme].foliage)return p;
    const material=p.material.clone(),tint=new T.Color(KIT_THEMES[theme].foliage!);
    material.onBeforeCompile=shader=>{shader.uniforms.gardenTint={value:tint};shader.fragmentShader='uniform vec3 gardenTint;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat luma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=luma*gardenTint*2.1;');};
    material.customProgramCacheKey=()=>`garden-approved-${kit}`;this.materials.add(material);return {...p,material};
   });
  }else if(['rock','pebble','rock-cluster'].includes(type)) {
   result=parts(this.rock,new T.Vector3(2,2,2)).map(p=>{const material=(p.material as T.MeshStandardMaterial).clone();material.color.set(KIT_THEMES[theme].palette.stone);this.materials.add(material);return {...p,material};});
  }else {
   let source=this.kits.get(kit);
   if(!source){source=createBaseKit(this.tree,this.rock,()=>new T.Group(),theme,'river');this.kits.set(kit,source);}
   const name=type.startsWith('path')?'path':type;
   const object=source.getObjectByName(`quality-${name}`)!;
   if(name==='path')result=[{geometry:(object as T.Mesh).geometry,material:(object as T.Mesh).material,matrix:new T.Matrix4()}];
   else result=parts(object,name==='bamboo'?new T.Vector3(1.1,3.1,1.1):name==='lantern'?new T.Vector3(.85,1.8,.85):new T.Vector3(3.2,1.2,1.3));
  }
  cache.set(key,result);return result;
 }
 dispose(){
  this.art.forEach(a=>a.userData.dispose());
  this.sand?.dispose();this.rough?.dispose();
  this.kits.forEach(k=>k.userData.dispose());this.materials.forEach(m=>m.dispose());
  const resources=new Set<T.BufferGeometry|T.Material|T.Texture>();
  for(const root of [this.tree,this.rock])root.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.add(m);for(const v of Object.values(m))if(v instanceof T.Texture)resources.add(v);}}});
  resources.forEach(r=>r.dispose());
 }
}
const Context=createContext<Library|null>(null);
export const useQualityLibrary=()=>useContext(Context);
export function QualityGardenProvider({children,onError}:{children:ReactNode;onError:(message:string)=>void}) {
 const [library,setLibrary]=useState<Library|null>(null),{invalidate,gl}=useThree();
 useEffect(()=>{
  let cancelled=false,loaded:Library|undefined;
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const base=import.meta.env.DEV?'/tools/zen-quality/assets/light/':'./assets/light/';
  const textures=new T.TextureLoader();
  Promise.allSettled([loader.loadAsync(`${base}tree-full.gltf`),loader.loadAsync(`${base}rock-light.gltf`),textures.loadAsync(sandColorUrl),textures.loadAsync(sandRoughUrl)] as const).then(results=>{
   const groups=[results[0],results[1]].map(r=>r.status==='fulfilled'?r.value.scene:new T.Group());
   const sand=results[2].status==='fulfilled'?results[2].value:undefined,rough=results[3].status==='fulfilled'?results[3].value:undefined;
   for(const map of [sand,rough])if(map){map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(12,18);}
   if(sand)sand.colorSpace=T.SRGBColorSpace;
   loaded=new Library(groups[0],groups[1],sand,rough);
   if(cancelled||results.some(r=>r.status==='rejected')){loaded.dispose();if(!cancelled)onError('Os materiais novos não carregaram. Reabra o jardim para tentar novamente.');return;}
   for(const root of groups)root.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial){m.envMapIntensity=.5;if(m.alphaTest>0)m.alphaToCoverage=true;for(const map of [m.map,m.normalMap,m.roughnessMap])if(map)map.anisotropy=Math.min(8,gl.capabilities.getMaxAnisotropy());}});
   setLibrary(loaded);gl.shadowMap.needsUpdate=true;invalidate();
  });
  return()=>{cancelled=true;loaded?.dispose();};
 },[gl,invalidate,onError]);
 return <Context.Provider value={library}>{children}</Context.Provider>;
}

function Batch({library,type,kit,items,select}:{library:Library;type:ObjectKind;kit:KitId;items:GardenObject[];select:(id:string,e:ThreeEvent<MouseEvent>)=>void}) {
 const {invalidate,gl}=useThree();
 const group=useMemo(()=>{
  const root=new T.Group(),prototype=library.get(type,kit),transforms:{matrix:T.Matrix4;id:string}[]=[];
  for(const item of items){
   const base=new T.Matrix4().compose(new T.Vector3(...item.position),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),item.rotation),new T.Vector3(1,1,1));
   const stones=stonePieces(type,item.variant);
   if(stones.length)for(const s of stones){const scale=type.startsWith('path')?new T.Vector3(s.sx*2,1,s.sz*2):new T.Vector3(s.sx,s.sy,s.sz);transforms.push({id:item.id,matrix:base.clone().multiply(new T.Matrix4().compose(new T.Vector3(s.x,0,s.z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),s.yaw),scale))});}
   else {if(type==='bridge')base.multiply(new T.Matrix4().makeRotationY(Math.PI/2));if(type==='pine'||type==='maple'){const s=.88+item.variant%6*.045;base.scale(new T.Vector3(s,1+(item.variant%3-1)*.055,s));}transforms.push({id:item.id,matrix:base});}
  }
  // Coalesce identical geometry/materials (bamboo segments and bridge planks).
  const batches=new Map<string,{part:Part;matrices:T.Matrix4[];ids:string[]}>();
  for(const part of prototype){const key=part.geometry.uuid+':'+(Array.isArray(part.material)?part.material.map(m=>m.uuid).join():part.material.uuid);const batch=batches.get(key)??{part,matrices:[],ids:[]};for(const t of transforms){batch.matrices.push(t.matrix.clone().multiply(part.matrix));batch.ids.push(t.id);}batches.set(key,batch);}
  for(const {part,matrices,ids} of batches.values()){const m=new T.InstancedMesh(part.geometry,part.material,matrices.length);matrices.forEach((matrix,i)=>m.setMatrixAt(i,matrix));m.userData.ids=ids;m.castShadow=!type.startsWith('path');m.receiveShadow=true;m.computeBoundingSphere();root.add(m);}
  return root;
 },[library,type,kit,items]);
 useEffect(()=>{gl.shadowMap.needsUpdate=true;invalidate();return()=>group.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});},[group,gl,invalidate]);
 return <primitive object={group} dispose={null} onClick={(e:ThreeEvent<MouseEvent>)=>{if(e.instanceId!==undefined)select(e.object.userData.ids[e.instanceId],e);}}/>;
}
export function QualityGardenObjects({objects,select}:{objects:GardenObject[];select:(id:string,e:ThreeEvent<MouseEvent>)=>void}) {
 const library=useContext(Context);
 const batches=useMemo(()=>{const groups=new Map<string,GardenObject[]>();for(const o of objects)if(supported.has(o.type)){const key=`${o.type}:${o.kit??'starter'}`;const list=groups.get(key)??[];list.push(o);groups.set(key,list);}return [...groups.entries()];},[objects]);
 if(!library)return <><GardenInstances objects={objects.filter(o=>o.type!=='pine'&&o.type!=='maple')} select={select} shadows/>{objects.filter(o=>o.type==='pine'||o.type==='maple').map(o=><group key={o.id} position={o.position} rotation={[0,o.rotation,0]} onClick={e=>select(o.id,e)}><BotanicalTree x={0} z={0} seed={o.variant+1} kit={o.kit??'starter'} kind={o.type==='pine'?'pine':'maple'}/></group>)}</>;
 return <><GardenInstances objects={objects.filter(o=>!supported.has(o.type))} select={select} shadows/>{batches.map(([key,items])=><Batch key={key} library={library} items={items} type={items[0].type} kit={items[0].kit??'starter'} select={select}/>)}</>;
}
