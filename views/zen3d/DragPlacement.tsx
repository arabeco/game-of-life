import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Plane, Raycaster, Vector2, Vector3 } from 'three';
import type { GardenObject } from './model';
// Pointer release applies the last valid preview locally; no persistence happens here.
export function DragPlacement({item,moving,onMove,canDrop,onDrop,onCancel}:{item?:GardenObject;moving:boolean;onMove:(item:GardenObject)=>void;canDrop:(item:GardenObject)=>boolean;onDrop:(item:GardenObject|null)=>void;onCancel:()=>void}){
 const {gl,camera}=useThree();const latest=useRef({item,moving,onMove,canDrop,onDrop,onCancel});latest.current={item,moving,onMove,canDrop,onDrop,onCancel};
 useEffect(()=>{
  const canvas=gl.domElement,ray=new Raycaster(),plane=new Plane(new Vector3(0,1,0),0),uv=new Vector2();
  let held:number|null=null,start:GardenObject|undefined,origin:Vector3|null=null,downX=0,downY=0,moved=false,lastGood:GardenObject|null=null;
  const project=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();uv.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(uv,camera);return ray.ray.intersectPlane(plane,new Vector3());};
  const down=(e:PointerEvent)=>{if(e.button!==0||held!==null||!latest.current.item)return;const p=project(e);if(!p)return;const a=latest.current.item;
   // Selected items have a ground handle; Move mode also accepts a drag anywhere on sand.
   if(!latest.current.moving&&Math.hypot(p.x-a.position[0],p.z-a.position[2])>1.1)return;
   moved=false;lastGood=latest.current.canDrop(a)?a:null;held=e.pointerId;start={...a,position:[...a.position]};origin=p;downX=e.clientX;downY=e.clientY;canvas.setPointerCapture(held);
  };
  const move=(e:PointerEvent)=>{if(e.pointerId!==held||!start||!origin||Math.hypot(e.clientX-downX,e.clientY-downY)<5)return;const p=project(e);if(p){moved=true;const next:GardenObject={...start,position:[start.position[0]+p.x-origin.x,0,start.position[2]+p.z-origin.z]};if(latest.current.canDrop(next))lastGood=next;latest.current.onMove(next);}};
  const end=(e:PointerEvent)=>{if(e.pointerId!==held)return;held=null;start=undefined;origin=null;if(moved){moved=false;if(e.type==='pointerup')latest.current.onDrop(lastGood);else latest.current.onCancel();}};
  const mouseUp=()=>{if(held!==null)end({pointerId:held,type:'pointerup'} as PointerEvent);};
  const blur=()=>{held=null;start=undefined;origin=null;if(moved)latest.current.onCancel();moved=false;};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);window.addEventListener('pointerup',end,true);window.addEventListener('mouseup',mouseUp,true);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);window.addEventListener('blur',blur);
  return()=>{if(held!==null&&canvas.hasPointerCapture(held))canvas.releasePointerCapture(held);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end,true);window.removeEventListener('mouseup',mouseUp,true);canvas.removeEventListener('pointercancel',end);canvas.removeEventListener('lostpointercapture',end);window.removeEventListener('blur',blur);};
 },[gl,camera]);
 return null;
}
