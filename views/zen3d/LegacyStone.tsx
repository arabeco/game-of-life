import { useEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, ExtrudeGeometry, Shape, SRGBColorSpace, TextureLoader, type Texture } from 'three';

function tablet(height:number){
  const s=new Shape(),w=1.46,h=height/2+.045,r=.06;
  s.moveTo(-w+r,-h);s.lineTo(w-r,-h);s.lineTo(w,-h+r);s.lineTo(w,h-r);s.lineTo(w-r,h);s.lineTo(-w+r,h);s.lineTo(-w,h-r);s.lineTo(-w,-h+r);s.closePath();
  return new ExtrudeGeometry(s,{depth:.14,bevelEnabled:true,bevelThickness:.018,bevelSize:.018,bevelSegments:1,steps:1});
}
export function LegacyStone({onInspect,plaque}:{onInspect:()=>void;plaque?:{image:string;aspect:number}}){
  const {invalidate,gl}=useThree(),[texture,setTexture]=useState<Texture|null>(null);
  const height=2.84/(plaque?.aspect??3),geometry=useMemo(()=>tablet(height),[height]);
  const placeholder=useMemo(()=>{
    const c=document.createElement('canvas');c.width=768;c.height=256;const ctx=c.getContext('2d')!;
    ctx.fillStyle='#241126';ctx.fillRect(0,0,768,256);ctx.strokeStyle='#b99a68';ctx.lineWidth=3;ctx.strokeRect(12,12,744,232);ctx.lineWidth=1;ctx.strokeRect(22,22,724,212);
    ctx.fillStyle='#eddbb1';ctx.textAlign='center';ctx.font='bold 44px Georgia';ctx.fillText('LEGADO',384,142);
    const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t;
  },[]);
  useEffect(()=>{
    if(!plaque)return;let cancelled=false;
    const result=new TextureLoader().load(plaque.image,t=>{if(cancelled)return;t.colorSpace=SRGBColorSpace;t.anisotropy=Math.min(4,gl.capabilities.getMaxAnisotropy());setTexture(t);invalidate();},undefined,()=>{if(!cancelled)setTexture(null);});
    return()=>{cancelled=true;result.dispose();};
  },[plaque,gl,invalidate]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);useEffect(()=>()=>placeholder.dispose(),[placeholder]);
  return <group position={[.8,0,-7.65]} rotation={[0,-.1,0]}>
    <mesh position={[0,.06,0]} receiveShadow><cylinderGeometry args={[.38,.48,.12,12]}/><meshStandardMaterial color="#788074" roughness={1}/></mesh>
    <mesh position={[0,.51,0]} castShadow receiveShadow><cylinderGeometry args={[.16,.24,.9,10]}/><meshStandardMaterial color="#626b60" roughness={.94}/></mesh>
    <mesh position={[0,.99,0]} castShadow><cylinderGeometry args={[.32,.23,.10,12]}/><meshStandardMaterial color="#8c907b" roughness={.9}/></mesh>
    <group position={[0,1.65,0]} rotation={[-.23,0,0]} onClick={e=>{if(e.delta>7)return;e.stopPropagation();onInspect();}}>
      <mesh geometry={geometry} position={[0,0,-.10]} castShadow receiveShadow><meshStandardMaterial color="#3e323e" metalness={.35} roughness={.65}/></mesh>
      <mesh position={[0,0,.065]}><planeGeometry args={[2.84,height]}/><meshBasicMaterial map={texture??placeholder} toneMapped={false} transparent/></mesh>
    </group>
  </group>;
}
