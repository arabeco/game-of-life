import { gardenSurface } from './gardenSurface';
import { personalEdge } from './gardenTemplates';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, Color, LinearFilter, Plane, Raycaster, SRGBColorSpace, Vector2, Vector3 } from 'three';
import { chaseFactor, roundedCorner } from './sandSmoothing';
import { rakeBrush, type RakeSettings } from './sandOptions';
import { GARDEN_X, GARDEN_Z, inGarden, worldFootprint, type GardenObject } from './model';

export type SandTool = 'rake'|'smooth'|'camera'|'artifacts'|'bases' | 'decor' | 'shop';
export interface SandActions { clear:()=>void; undo:()=>void; snapshot:()=>{color:string;height:string} }
const W=512,H=1024;
const referenceColor=new Color('#d9cdb0');
// Fixed-size texture memory: no mesh subdivision, stroke list, or growing history.
export function SandSurface({tool,settings,sandColor,enabled,objects,actions,onChange,initialDrawing,onReady,onLoadError}:{onReady?:(ready:boolean)=>void;onLoadError?:(message:string)=>void;initialDrawing?:{color:string;height:string};tool:SandTool;settings:RakeSettings;sandColor:string;enabled:boolean;objects:GardenObject[];actions:MutableRefObject<SandActions|null>;onChange:(undo:boolean)=>void}) {
  const {gl,camera,invalidate}=useThree();
  const geometry=useMemo(()=>gardenSurface(),[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const dirty=useRef(true);
  const [restored,setRestored]=useState(!initialDrawing);
  useEffect(()=>{onReady?.(restored);},[restored,onReady]);
  const assets=useMemo(()=>{
    const color=document.createElement('canvas'),height=document.createElement('canvas');
    color.width=height.width=W;color.height=height.height=H;
    const c=color.getContext('2d')!,h=height.getContext('2d')!;
    const map=new CanvasTexture(color),bump=new CanvasTexture(height);map.colorSpace=SRGBColorSpace;
    for(const t of [map,bump]){t.generateMipmaps=false;t.minFilter=LinearFilter;t.magFilter=LinearFilter;}
    c.fillStyle='#d9cdb0';c.fillRect(0,0,W,H);
    const base=c.getImageData(0,0,W,H);for(let i=0;i<W*H;i++){const n=(Math.sin(i*12.9898)*43758.5453%1)*3;for(let j=0;j<3;j++)base.data[i*4+j]+=n;}c.putImageData(base,0,0);h.fillStyle='#808080';h.fillRect(0,0,W,H);
    return {color,height,c,h,map,bump,base};
  },[]);
  useEffect(()=>{
    if(!initialDrawing)return;
    let cancelled=false;
    // `crossOrigin` ANTES do src, e nao e detalhe: a areia salva passou a chegar
    // como URL do bucket em vez de data URL. Desenhar uma imagem de outra origem
    // sem esta linha CONTAMINA o canvas, e o `toDataURL` do snapshot logo abaixo
    // passa a lancar SecurityError — a pessoa abriria o jardim e nunca mais
    // conseguiria salvar. Data URL ignora a propriedade, entao serve para as duas.
    const load=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>img.width===W&&img.height===H?resolve(img):reject(Error('Invalid sand size'));img.onerror=()=>reject(Error('Invalid sand image'));img.src=src;});
    Promise.all([load(initialDrawing.color),load(initialDrawing.height)]).then(([c,h])=>{if(cancelled)return;assets.c.drawImage(c,0,0);assets.h.drawImage(h,0,0);dirty.current=true;setRestored(true);invalidate();}).catch(()=>{if(!cancelled)onLoadError?.('Não foi possível restaurar a areia salva. Reabra o jardim; seu desenho não foi alterado.');});
    return()=>{cancelled=true;};
  },[initialDrawing,assets,invalidate,onLoadError]);
  const history=useRef<{color:ImageData;height:ImageData}|null>(null);
  useEffect(()=>{
    const save=()=>{history.current={color:assets.c.getImageData(0,0,W,H),height:assets.h.getImageData(0,0,W,H)};onChange(true);};
    actions.current={snapshot:()=>{if(!restored)throw Error('A areia salva ainda não pôde ser carregada. Reabra o jardim.');return {color:assets.color.toDataURL('image/png'),height:assets.height.toDataURL('image/png')};},clear:()=>{save();assets.c.putImageData(assets.base,0,0);assets.h.fillStyle='#808080';assets.h.fillRect(0,0,W,H);dirty.current=true;invalidate();},undo:()=>{if(!history.current)return;assets.c.putImageData(history.current.color,0,0);assets.h.putImageData(history.current.height,0,0);history.current=null;onChange(false);dirty.current=true;invalidate();}};
    return()=>{actions.current=null;};
  },[assets,actions,invalidate,onChange,restored]);
  useEffect(()=>{
    if(!enabled||!restored||tool==='camera')return;
    const canvas=gl.domElement,ray=new Raycaster(),uv=new Vector2(),plane=new Plane(new Vector3(0,1,0),-.045);
    const brush=rakeBrush(settings);
    const brushRadius=((brush.lines-1)*brush.gap/2+brush.width)*2*GARDEN_X/W;
    const margin=tool==='smooth'?.34:brushRadius+.08;
    const obstacles=objects.flatMap(worldFootprint);
    let pointer:number|null=null,previous:Vector2|null=null,normal:Vector2|null=null,saved=false;
    let anchors:Vector2[]=[],latest:Vector2|null=null,smooth:Vector2|null=null,lastEmitted:Vector2|null=null;
    let raf=0,lastTime=0;
    const mark=()=>{dirty.current=true;invalidate();};
    const point=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();uv.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(uv,camera);const p=ray.ray.intersectPlane(plane,new Vector3());
      if(!p||p.z < personalEdge(p.x)+margin||!inGarden(p.x,p.z,margin+.1)||obstacles.some(o=>Math.hypot(p.x-o.x,p.z-o.z)<o.radius+margin))return null;
      return new Vector2((p.x/GARDEN_X*.5+.5)*W,(p.z/GARDEN_Z*.5+.5)*H);
    };
    const save=()=>{if(saved)return;saved=true;history.current={color:assets.c.getImageData(0,0,W,H),height:assets.h.getImageData(0,0,W,H)};onChange(true);};
    const line=(ctx:CanvasRenderingContext2D,a:Vector2,b:Vector2,n:Vector2,offset:number,width:number,color:string)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x+(normal??n).x*offset,a.y+(normal??n).y*offset);ctx.lineTo(b.x+n.x*offset,b.y+n.y*offset);ctx.stroke();};
    const paint=(p:Vector2)=>{
      if(tool==='smooth') {save();for(const [ctx,color] of [[assets.c,'#d9cdb0'],[assets.h,'#808080']] as const){const fade=ctx.createRadialGradient(p.x,p.y,7,p.x,p.y,16);fade.addColorStop(0,color);fade.addColorStop(1,color+'00');ctx.fillStyle=fade;ctx.beginPath();ctx.arc(p.x,p.y,16,0,Math.PI*2);ctx.fill();}mark();return;}
      if(!previous)return;
      const d=p.clone().sub(previous);if(d.length()<.35)return;
      save();const target=new Vector2(-d.y,d.x).normalize();const nextNormal=normal?normal.clone().lerp(target,.3).normalize():target;
      for(let i=0;i<brush.lines;i++) {const offset=(i-(brush.lines-1)/2)*brush.gap;
        const depth=Math.round(128-95*brush.strength);
        line(assets.h,previous,p,nextNormal,offset,Math.min(brush.gap*.78,brush.width+1),`rgb(${depth},${depth},${depth})`);
        line(assets.c,previous,p,nextNormal,offset,brush.width,`rgba(105,87,63,${brush.strength})`);
        line(assets.c,previous,p,nextNormal,offset+brush.width*.65,.9,`rgba(242,231,202,${brush.strength*.85})`);
      }normal=nextNormal;mark();
    };
    const sample=(p:Vector2)=>{
      if(tool==='rake'&&previous&&previous.distanceTo(p)<.35)return;
      // Fill fast gestures while checking each small step against solid objects.
      if(previous){const from=previous.clone(),steps=Math.ceil(from.distanceTo(p)/3);for(let i=1;i<=steps;i++){const q=from.clone().lerp(p,i/steps);const x=(q.x/W-.5)*2*GARDEN_X,z=(q.y/H-.5)*2*GARDEN_Z;if(z < personalEdge(x)+margin||!inGarden(x,z,margin+.1)||obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.radius+margin)){previous=null;normal=null;continue;}paint(q);previous=q;}}
      else {paint(p);previous=p;}
    };
    const curve=(a:Vector2,b:Vector2,c:Vector2)=>{
      for(const p of roundedCorner(a,b,c))sample(new Vector2(p.x,p.y));
    };
    const append=(p:Vector2)=>{
      anchors.push(p.clone());
      if(anchors.length===3){curve(anchors[0],anchors[1],anchors[2]);anchors.shift();}
    };
    const screenPoint=(p:Vector2)=>{
      const r=canvas.getBoundingClientRect();
      const world=new Vector3((p.x/W-.5)*2*GARDEN_X,.045,(p.y/H-.5)*2*GARDEN_Z).project(camera);
      return new Vector2(world.x*r.width/2,world.y*r.height/2);
    };
    const tick=(now:number)=>{
      raf=0;if(pointer===null||!latest||!smooth||!lastEmitted)return;
      const dt=lastTime?Math.min(50,now-lastTime):1000/60;lastTime=now;
      smooth.lerp(latest,chaseFactor(tool==='smooth',dt));
      // The 2D implementation emits only after 5.2 screen pixels (4.4 to erase).
      if(screenPoint(smooth).distanceTo(screenPoint(lastEmitted))>(tool==='smooth'?4.4:5.2)){
        if(tool==='smooth')sample(smooth.clone());else append(smooth);
        lastEmitted=smooth.clone();
      }
      if(smooth.distanceTo(latest)>.1)raf=requestAnimationFrame(tick);
    };
    const update=(e:PointerEvent)=>{
      latest=point(e);
      if(!latest){anchors=[];previous=null;normal=null;smooth=null;lastEmitted=null;return;}
      if(!smooth){smooth=latest.clone();lastEmitted=latest.clone();anchors=[latest.clone(),latest.clone()];previous=latest.clone();if(tool==='smooth')sample(latest);}
      if(!raf){lastTime=0;raf=requestAnimationFrame(tick);}
    };
    const reset=()=>{if(raf)cancelAnimationFrame(raf);raf=0;lastTime=0;pointer=null;previous=null;normal=null;anchors=[];latest=null;smooth=null;lastEmitted=null;};
    const down=(e:PointerEvent)=>{if(e.button!==0||pointer!==null)return;reset();pointer=e.pointerId;saved=false;canvas.setPointerCapture(e.pointerId);update(e);};
    const move=(e:PointerEvent)=>{if(pointer===e.pointerId)update(e);};
    const end=(e:PointerEvent)=>{
      if(pointer!==e.pointerId)return;
      // Finish only the already-smoothed tail, never chase the raw release point.
      if(e.type==='pointerup'&&tool==='rake'&&anchors.length===2)curve(anchors[0],anchors[1],anchors[1]);
      reset();
    };
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);
    return()=>{reset();document.removeEventListener('visibilitychange',reset);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',end);canvas.removeEventListener('pointercancel',end);canvas.removeEventListener('lostpointercapture',end);window.removeEventListener('blur',reset);};
  },[enabled,restored,tool,settings,objects,gl,camera,assets,invalidate,onChange]);
  useFrame(()=>{if(dirty.current){assets.map.needsUpdate=true;assets.bump.needsUpdate=true;dirty.current=false;}});
  useEffect(()=>()=>{assets.map.dispose();assets.bump.dispose();},[assets]);
  return <mesh position={[0,.045,0]} rotation={[-Math.PI/2,0,0]} geometry={geometry} receiveShadow>
    <meshStandardMaterial color={sandColor} onBeforeCompile={shader=>{shader.uniforms.uSandReference={value:referenceColor};shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uSandReference;').replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb /= uSandReference;');}} map={assets.map} bumpMap={assets.bump} bumpScale={.035} roughness={1}/>
  </mesh>;
}
