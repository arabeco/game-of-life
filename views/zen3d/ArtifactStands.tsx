import { personalEdge } from './gardenTemplates';
import { useEffect, useState } from 'react';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import { TextureLoader, SRGBColorSpace, type Texture } from 'three';
import { ARTIFACTS } from './artifactCatalog';
import { inGarden, worldFootprint, type GardenObject } from './model';
export interface PlacedArtifact {id:string;artifact:string;x:number;z:number;rotation:number}
export const artifactUrl=(file:string)=>/^(https?:|data:|\/)/.test(file)?file:`${import.meta.env.BASE_URL}artifacts/${file}`;
export function artifactObstacle(a:PlacedArtifact):GardenObject{return {id:a.id,type:'rock',position:[a.x,0,a.z],rotation:0,variant:0};}
export function artifactFits(a:PlacedArtifact,all:PlacedArtifact[],fixed:GardenObject[]){
  return (a.x/4.2)**2+(a.z/8.2)**2<1&&a.z<=personalEdge(a.x)-.8&&inGarden(a.x,a.z,.95)&&all.every(b=>a.id===b.id||Math.hypot(a.x-b.x,a.z-b.z)>1.7)&&fixed.flatMap(worldFootprint).every(b=>Math.hypot(a.x-b.x,a.z-b.z)>b.radius+.9);
}
export function ArtifactStand({item,selected,draft,valid=true,onSelect}:{item:PlacedArtifact;selected?:boolean;draft?:boolean;valid?:boolean;onSelect:(e:ThreeEvent<MouseEvent>)=>void}){
  const {gl,invalidate}=useThree(),[texture,setTexture]=useState<Texture|null>(null);
  const art=ARTIFACTS.find(a=>a.id===item.artifact)!;
  useEffect(()=>{
    let stopped=false;const t=new TextureLoader().load(artifactUrl(art.file),loaded=>{if(stopped)return;loaded.colorSpace=SRGBColorSpace;loaded.anisotropy=Math.min(4,gl.capabilities.getMaxAnisotropy());setTexture(loaded);invalidate();},undefined,()=>invalidate());
    return()=>{stopped=true;t.dispose();};
  },[art.file,gl,invalidate]);
  const image=texture?.image as HTMLImageElement|undefined;
  const ratio=image?image.width/image.height:1;
  const w=ratio>=1?1.0:ratio,h=ratio>=1?1.0/ratio:1.0;
  return <group position={[item.x,0,item.z]} rotation={[0,item.rotation,0]} onClick={onSelect}>
    <mesh position={[0,.12,0]} castShadow receiveShadow><cylinderGeometry args={[.63,.76,.24,8]}/><meshStandardMaterial color="#606b60" roughness={.94}/></mesh>
    <mesh position={[0,.4,-.08]} castShadow><cylinderGeometry args={[.15,.25,.56,8]}/><meshStandardMaterial color="#4d5c50" roughness={.9}/></mesh>
    <group position={[0,.78,0]} rotation={[-Math.PI/3,0,0]}>
      <mesh castShadow receiveShadow><boxGeometry args={[1.25,1.25,.12]}/><meshStandardMaterial color={draft&&!valid?'#965548':'#667367'} roughness={.9}/></mesh>
      <mesh position={[0,0,.065]}><planeGeometry args={[1.16,1.16]}/><meshStandardMaterial color="#b9a16c" metalness={.25} roughness={.6}/></mesh>
      <mesh position={[0,0,.071]}><planeGeometry args={[1.10,1.10]}/><meshStandardMaterial color="#182820" roughness={.85}/></mesh>
      {texture&&<mesh position={[0,0,.079]}><planeGeometry args={[w,h]}/><meshBasicMaterial map={texture} transparent toneMapped={false}/></mesh>}
    </group>
    {(selected||draft)&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,.06,0]}><ringGeometry args={[.80,.84,48]}/><meshBasicMaterial color={valid?'#e4d09b':'#df8170'} depthWrite={false}/></mesh>}
  </group>;
}
