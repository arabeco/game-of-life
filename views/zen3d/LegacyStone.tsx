import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, Color, ExtrudeGeometry, Group, Shape, SRGBColorSpace } from 'three';

function tablet(){
  const s=new Shape(),w=1.24,h=.39,r=.07;
  s.moveTo(-w+r,-h);s.lineTo(w-r,-h);s.quadraticCurveTo(w,-h,w,-h+r);s.lineTo(w,h-r);s.quadraticCurveTo(w,h,w-r,h);s.lineTo(-w+r,h);s.quadraticCurveTo(-w,h,-w,h-r);s.lineTo(-w,-h+r);s.quadraticCurveTo(-w,-h,-w+r,-h);
  return new ExtrudeGeometry(s,{depth:.19,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:2,steps:1,curveSegments:5});
}
export function LegacyStone({onInspect}:{onInspect:()=>void}){
  const {invalidate,gl}=useThree();const floating=useRef<Group>(null!);
  const geometry=useMemo(tablet,[]),[texture,setTexture]=useState<CanvasTexture|null>(null);
  const [failed,setFailed]=useState(false),[animated,setAnimated]=useState(false);
  useEffect(()=>{
    const q=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setAnimated(!q.matches&&!document.hidden);update();q.addEventListener('change',update);document.addEventListener('visibilitychange',update);
    return()=>{q.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);};
  },[]);
  useEffect(()=>{
    let stopped=false,result:CanvasTexture|undefined;
    fetch(`${import.meta.env.BASE_URL}legacy/legacy-face.svg?v=2`).then(r=>{if(!r.ok)throw Error('Local plaque not found');return r.text();}).then(svg=>new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);})).then(img=>{
      if(stopped)return;const canvas=document.createElement('canvas');canvas.width=Math.min(2048,gl.capabilities.maxTextureSize);canvas.height=Math.round(canvas.width*300/1024);canvas.getContext('2d')!.drawImage(img,0,0,canvas.width,canvas.height);result=new CanvasTexture(canvas);result.colorSpace=SRGBColorSpace;result.anisotropy=Math.min(8,gl.capabilities.getMaxAnisotropy());setTexture(result);invalidate();
    }).catch(()=>{if(!stopped)setFailed(true);});
    return()=>{stopped=true;result?.dispose();};
  },[invalidate,gl]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  useEffect(()=>{if(!animated)return;const id=window.setInterval(invalidate,1000/24);return()=>clearInterval(id);},[animated,invalidate]);
  useFrame(({clock})=>{if(floating.current)floating.current.position.y=1.58+(animated?Math.sin(clock.elapsedTime*.85)*.025:0);});
  return <group position={[.8,0,-7.65]} rotation={[0,-.1,0]}>
    <mesh position={[0,.06,0]} receiveShadow><cylinderGeometry args={[.38,.48,.12,12]}/><meshStandardMaterial color="#788074" roughness={1}/></mesh>
    <mesh position={[0,.51,0]} castShadow receiveShadow><cylinderGeometry args={[.16,.24,.9,10]}/><meshStandardMaterial color="#626b60" roughness={.94}/></mesh>
    <mesh position={[0,.99,0]} castShadow><cylinderGeometry args={[.32,.23,.10,12]}/><meshStandardMaterial color="#8c907b" roughness={.9}/></mesh>
    <group ref={floating} position={[0,1.58,0]} rotation={[-.23,0,0]} onClick={e=>{if(e.delta>7)return;e.stopPropagation();onInspect();}}>
      <mesh geometry={geometry} position={[0,0,-.13]} castShadow receiveShadow><meshStandardMaterial color="#343d3a" roughness={.88}/></mesh>
      <mesh position={[0,0,.103]}><planeGeometry args={[2.46,.725]}/><meshStandardMaterial key={texture?'ready':'pending'} map={texture} color={texture?'#ffffff':failed?'#5e5240':'#16201e'} emissive={new Color('#ffffff')} emissiveMap={texture} emissiveIntensity={texture?.2:0} roughness={.75} transparent/></mesh>
    </group>
  </group>;
}
