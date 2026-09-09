import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, PerspectiveCamera } from 'three';
import { GARDEN_X, GARDEN_Z, canWalkCircles, collisionCircles, isWater, bridgeHeight, EYE_HEIGHT, findEntrance, type GardenMode, type GardenObject } from './model';
export interface Motion { x:number;y:number }
export interface GardenView { angle:number;zoom:number;x:number;z:number }
export function GardenCamera({mode,objects,motion,view,onView,gesture,buildNavigation=true}: {buildNavigation?:boolean;mode:GardenMode;objects:GardenObject[];motion:MutableRefObject<Motion>;view:GardenView;onView:(change:(v:GardenView)=>GardenView)=>void;gesture:MutableRefObject<boolean>}) {
  const {camera,set,gl,invalidate,size}=useThree();
  const cameras=useMemo(()=>({ build:new OrthographicCamera(-6,6,10,-10,.1,100),explore:new PerspectiveCamera(62,1,.08,100) }),[]);
  const keys=useRef(new Set<string>()),look=useRef({yaw:0,pitch:-.07});
  const lastMode=useRef<GardenMode|null>(null);
  const collisions=useMemo(()=>({all:collisionCircles(objects),dry:collisionCircles(objects.filter(o=>!isWater(o.type)))}),[objects]);
  const walk=(x:number,z:number)=>canWalkCircles(bridgeHeight(objects,x,z)!==null?collisions.dry:collisions.all,x,z);
  const latestObjects=useRef(objects);latestObjects.current=objects;
  useLayoutEffect(()=>{
    const aspect=size.width/size.height;
    if(mode==='build') {
      const c=cameras.build;
      const halfWidth=aspect<1?Math.max(GARDEN_X+.75,GARDEN_Z*aspect+.8)*view.zoom:Math.max(10.3,GARDEN_Z+1)*aspect*view.zoom;
      const halfHeight=halfWidth/aspect;
      c.left=-halfWidth;c.right=halfWidth;c.top=halfHeight;c.bottom=-halfHeight;
      c.position.set(view.x+Math.sin(view.angle)*17,24,view.z+Math.cos(view.angle)*17);c.lookAt(view.x,0,view.z);c.updateProjectionMatrix();
    } else {
      const c=cameras.explore;c.aspect=aspect;c.updateProjectionMatrix();
      if(lastMode.current!=='explore') {const entry=findEntrance(latestObjects.current);if(entry)c.position.set(...entry);look.current={yaw:0,pitch:-.07};c.rotation.set(-.07,0,0,'YXZ');}
    }
    lastMode.current=mode;
    if(camera!==cameras[mode])set({camera:cameras[mode]});
    invalidate();
  },[mode,view,size.width,size.height,cameras,camera,set,invalidate]);
  useEffect(()=>{
    if(mode!=='build'||!buildNavigation)return;
    const canvas=gl.domElement,pointers=new Map<number,{x:number;y:number;startX:number;startY:number}>();
    let distance=0,angle=0;
    const pair=()=>{const p=[...pointers.values()];return {distance:Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y),angle:Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x)};};
    const down=(e:PointerEvent)=>{if(e.button!==0)return;if(!pointers.size)gesture.current=false;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});canvas.setPointerCapture(e.pointerId);if(pointers.size===2){gesture.current=true;const p=pair();distance=p.distance;angle=p.angle;}};
    const move=(e:PointerEvent)=>{
      const previous=pointers.get(e.pointerId);if(!previous)return;
      if(!gesture.current&&Math.hypot(e.clientX-previous.startX,e.clientY-previous.startY)<7)return;
      gesture.current=true;
      const dx=e.clientX-previous.x,dy=e.clientY-previous.y;pointers.set(e.pointerId,{...previous,x:e.clientX,y:e.clientY});
      if(pointers.size===1)onView(v=>{if(e.shiftKey)return {...v,angle:v.angle+dx*.008};const scale=(cameras.build.right-cameras.build.left)/size.width;return {...v,x:Math.max(-4,Math.min(4,v.x-dx*scale*Math.cos(v.angle)-dy*scale*Math.sin(v.angle)*1.25)),z:Math.max(-7,Math.min(7,v.z+dx*scale*Math.sin(v.angle)-dy*scale*Math.cos(v.angle)*1.25))};});
      if(pointers.size===2){const next=pair();const ratio=distance/Math.max(20,next.distance),delta=Math.atan2(Math.sin(next.angle-angle),Math.cos(next.angle-angle));onView(v=>({...v,zoom:Math.max(.55,Math.min(1.65,v.zoom*ratio)),angle:v.angle+delta}));distance=next.distance;angle=next.angle;}
    };
    const up=(e:PointerEvent)=>pointers.delete(e.pointerId);
    const wheel=(e:WheelEvent)=>{e.preventDefault();onView(v=>({...v,zoom:Math.max(.55,Math.min(1.65,v.zoom*Math.exp(e.deltaY*.001)))}));};
    const reset=()=>pointers.clear();
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);canvas.addEventListener('wheel',wheel,{passive:false});window.addEventListener('blur',reset);
    return()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('lostpointercapture',up);canvas.removeEventListener('wheel',wheel);window.removeEventListener('blur',reset);};
  },[mode,buildNavigation,gl,cameras,size.width,onView,gesture]);
  useEffect(()=>{
    if(mode!=='explore')return;
    const canvas=gl.domElement;
    let pointer:{id:number;x:number;y:number}|null=null;
    const down=(e:PointerEvent)=>{if(pointer||e.button!==0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};
    const move=(e:PointerEvent)=>{if(!pointer||pointer.id!==e.pointerId)return;look.current.yaw-=(e.clientX-pointer.x)*.003;look.current.pitch=Math.max(-1.05,Math.min(.9,look.current.pitch-(e.clientY-pointer.y)*.003));pointer.x=e.clientX;pointer.y=e.clientY;cameras.explore.rotation.set(look.current.pitch,look.current.yaw,0,'YXZ');invalidate();};
    const up=(e:PointerEvent)=>{if(pointer?.id===e.pointerId)pointer=null;};
    const reset=()=>{keys.current.clear();motion.current={x:0,y:0};pointer=null;};
    const downKey=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest('button,input,select'))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.current.add(e.code);invalidate();}};
    const upKey=(e:KeyboardEvent)=>keys.current.delete(e.code);
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);window.addEventListener('keydown',downKey);window.addEventListener('keyup',upKey);window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);
    return()=>{reset();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('lostpointercapture',up);window.removeEventListener('keydown',downKey);window.removeEventListener('keyup',upKey);window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',reset);};
  },[mode,cameras,gl,invalidate,motion]);
  useFrame((_,delta)=>{
    if(mode!=='explore'||document.hidden)return;
    const k=keys.current;let x=motion.current.x+Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft'));let z=motion.current.y+Number(k.has('KeyS')||k.has('ArrowDown'))-Number(k.has('KeyW')||k.has('ArrowUp'));
    const length=Math.hypot(x,z);if(length<.045)return;if(length>1){x/=length;z/=length;}
    const speed=Math.min(delta,.04)*1.65,yaw=look.current.yaw,c=cameras.explore;
    const dx=(x*Math.cos(yaw)+z*Math.sin(yaw))*speed,dz=(-x*Math.sin(yaw)+z*Math.cos(yaw))*speed;
    if(walk(c.position.x+dx,c.position.z))c.position.x+=dx;
    if(walk(c.position.x,c.position.z+dz))c.position.z+=dz;
    c.position.y=EYE_HEIGHT+(bridgeHeight(objects,c.position.x,c.position.z)??0);
    invalidate();
  });
  return null;
}
export function Joystick({ motion, wake }: { motion: MutableRefObject<Motion>; wake: () => void }) {
  const pointer = useRef<number | null>(null);
  const [knob, setKnob] = useState<Motion>({ x: 0, y: 0 });
  const reset = () => { pointer.current = null; motion.current = { x: 0, y: 0 }; setKnob({ x: 0, y: 0 }); };
  useEffect(() => {
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
    return () => {
      motion.current = { x: 0, y: 0 };
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
    };
  }, [motion]);
  const update = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointer.current !== e.pointerId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    let x = (e.clientX - rect.left - rect.width / 2) / 38;
    let y = (e.clientY - rect.top - rect.height / 2) / 38;
    const length = Math.hypot(x, y);
    if (length > 1) { x /= length; y /= length; }
    motion.current = { x, y }; setKnob({ x, y }); wake();
  };
  return <div className="zen3d-joystick-wrap">
    <div className="zen3d-joystick" aria-label="Joystick de movimento; no teclado use WASD ou setas" onPointerDown={e => {
      if (pointer.current !== null) return;
      pointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); update(e);
    }} onPointerMove={update} onPointerUp={e => { if (pointer.current === e.pointerId) reset(); }} onPointerCancel={reset} onLostPointerCapture={reset}>
      <span className="zen3d-joystick-cross">＋</span>
      <span className="zen3d-joystick-knob" style={{ transform: `translate(${knob.x * 38}px, ${knob.y * 38}px)` }} />
    </div>
    <span>MOVER</span>
  </div>;
}

