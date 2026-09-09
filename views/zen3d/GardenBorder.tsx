import type { KitId } from './kits';
import { useEffect, useMemo } from 'react';
import { BoxGeometry, BufferGeometry, Float32BufferAttribute, IcosahedronGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GARDEN_X,GARDEN_Z,gardenBoundary,randomAt } from './model';
import type { Finish } from './gardenTemplates';
export function GardenBorder({finish,kit='starter'}:{finish:Finish;kit?:KitId}){
  const assets=useMemo(()=>{
    const stones:BufferGeometry[]=[],grasses:BufferGeometry[]=[],flowers:BufferGeometry[]=[];
    for(let i=0;i<82;i++){
      const a=i/82*Math.PI*2;if(a>1.33&&a<1.81)continue;
      const [x,z]=gardenBoundary(a,.04),h=finish==='rustic'?.09:.12;
      const stone=new IcosahedronGeometry(1,1).scale(.24+randomAt(1,i)*.06,h,.28+randomAt(2,i)*.07).rotateY(-a);
      stone.translate(x,h-.04,z);stones.push(stone);
      for(let j=0;j<6;j++){
        const px=x+Math.cos(a)*(.17+randomAt(i,j)*.30),pz=z+Math.sin(a)*(.17+randomAt(i+3,j)*.3),height=.12+randomAt(i+6,j)*.28;
        const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute([px-.022,0,pz,px+.022,0,pz,px+Math.cos(i+j)*.1,height,pz+Math.sin(j)*.08],3));g.computeVertexNormals();grasses.push(g);
        if(j===0&&(finish==='ornate'||i%3===0))flowers.push(new IcosahedronGeometry(.065,0).scale(1,.6,1).translate(px,height,pz));
      }
    }
    const merge=(parts:BufferGeometry[])=>{const g=parts.length?mergeGeometries(parts)!:new BufferGeometry();parts.forEach(p=>p.dispose());return g;};
    return {stones:merge(stones),grasses:merge(grasses),flowers:merge(flowers)};
  },[finish]);
  useEffect(()=>()=>Object.values(assets).forEach(g=>g.dispose()),[assets]);
  return <group>
    <mesh geometry={assets.stones} castShadow receiveShadow><meshStandardMaterial color={kit==='genesis'?'#675b79':kit==='luxury'?'#b7ad91':'#7c8270'} roughness={.96}/></mesh>
    <mesh geometry={assets.grasses}><meshStandardMaterial color="#65774b" roughness={1} side={2}/></mesh>
    {<mesh geometry={assets.flowers}><meshStandardMaterial color={kit==='genesis'?'#b39ac0':'#dfd7ac'} roughness={1}/></mesh>}
  </group>;
}
