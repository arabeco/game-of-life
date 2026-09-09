import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { Box3, Color, Group, OrthographicCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderTarget } from 'three';
import { CATALOG, type ObjectKind } from './model';
import { KITS, type KitId } from './kits';
import { getObjectGeometry, opaqueMaterial } from './procedural';
import { BotanicalTree } from './Sanctuary';
const cache=new Map<string,string>(),listeners=new Set<()=>void>();
const keyOf=(type:ObjectKind,kit:KitId)=>`${kit}:${type}`;
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export function ItemPreview({type,kit}:{type:ObjectKind;kit:KitId}){
 const src=useSyncExternalStore(subscribe,()=>cache.get(keyOf(type,kit))??'');
 return src?<img src={src} alt="" draggable={false}/>:<span className="preview-loading" aria-hidden="true">◇</span>;
}
// One small render target on the existing renderer; cards are ordinary cached PNG images.
export function PreviewStudio({kit}:{kit:KitId}){
 const {gl,invalidate}=useThree(),[index,setIndex]=useState(0),group=useRef<Group>(null),rendered=useRef('');
 const queue=useMemo(()=>[kit,...KITS.map(k=>k.id).filter(id=>id!==kit)].flatMap(id=>CATALOG.filter(o=>o.category!=='Água').map(o=>({type:o.type,kit:id}))),[kit]),entry=queue[index],type=entry?.type,previewKit=entry?.kit??kit;
 const assets=useMemo(()=>{const target=new WebGLRenderTarget(144,144);target.texture.colorSpace=SRGBColorSpace;return {scene:new Scene(),camera:new OrthographicCamera(-2,2,2,-2,.01,50),target};},[]);
 useEffect(()=>{setIndex(0);rendered.current='';invalidate();},[kit,invalidate]);
 useEffect(()=>()=>assets.target.dispose(),[assets]);
 useFrame(()=>{
  if(!type||!group.current)return;const key=keyOf(type,previewKit);if(rendered.current===key)return;
  if(!cache.has(key)){
   group.current.updateWorldMatrix(true,true);const box=new Box3().setFromObject(group.current);if(box.isEmpty()){invalidate();return;}
   const center=box.getCenter(new Vector3()),size=box.getSize(new Vector3()),span=Math.max(size.x,size.y,size.z)*.83+.12,c=assets.camera;
   c.left=c.bottom=-span;c.right=c.top=span;c.position.copy(center).add(new Vector3(4,3.5,5));c.lookAt(center);c.updateProjectionMatrix();
   const target=gl.getRenderTarget(),color=gl.getClearColor(new Color()),alpha=gl.getClearAlpha();
   gl.setRenderTarget(assets.target);gl.setClearColor(0x000000,0);gl.clear();gl.render(assets.scene,c);
   const pixels=new Uint8Array(144*144*4);gl.readRenderTargetPixels(assets.target,0,0,144,144,pixels);
   gl.setRenderTarget(target);gl.setClearColor(color,alpha);
   const canvas=document.createElement('canvas');canvas.width=canvas.height=144;const ctx=canvas.getContext('2d')!,data=ctx.createImageData(144,144);
   for(let y=0;y<144;y++)data.data.set(pixels.subarray((143-y)*576,(144-y)*576),y*576);
   ctx.putImageData(data,0,0);cache.set(key,canvas.toDataURL('image/png'));listeners.forEach(fn=>fn());
  }
  rendered.current=key;setIndex(i=>i+1);invalidate();
 },-1);
 return type?createPortal(<><ambientLight intensity={1.4}/><directionalLight position={[3,6,5]} intensity={3}/><group ref={group} key={`${previewKit}-${type}`}>
  {type==='pine'||type==='maple'?<BotanicalTree x={0} z={0} seed={2} kind={type} kit={previewKit}/>:<mesh geometry={getObjectGeometry(type,1,'serene',previewKit)} material={opaqueMaterial} dispose={null}/>}
 </group></>,assets.scene):null;
}
