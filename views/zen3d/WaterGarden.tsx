import { memo, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { type ThreeEvent } from '@react-three/fiber';
import { GARDEN_X, GARDEN_Z, isWater, randomAt, waterField, worldFootprint, type Circle, type GardenObject } from './model';

type Sample = {x:number;z:number;d:number};
function surface(circles:Circle[], level:number, y:number, colorize:boolean) {
  const positions:number[]=[],colors:number[]=[],edges:number[]=[];
  const step=.18,nx=Math.ceil((GARDEN_X+1)*2/step),nz=Math.ceil((GARDEN_Z+1)*2/step);
  const field:Sample[][]=[];
  for(let z=0;z<=nz;z++){field[z]=[];for(let x=0;x<=nx;x++){const px=-GARDEN_X-.5+x*step,pz=-GARDEN_Z-.5+z*step;field[z][x]={x:px,z:pz,d:waterField(circles,px,pz)-level};}}
  const emit=(a:Sample,b:Sample,c:Sample)=>{
    for(const p of [a,c,b]) {
      positions.push(p.x,y,p.z);
      if(colorize){const depth=Math.min(1,Math.max(0,-waterField(circles,p.x,p.z)/.6));const col=new THREE.Color('#91b5a0').lerp(new THREE.Color('#376e68'),depth);colors.push(col.r,col.g,col.b);}
    }
  };
  const clip=(triangle:Sample[])=>{
    const polygon:Sample[]=[],crossings:Sample[]=[];
    for(let i=0;i<3;i++) {
      const a=triangle[i],b=triangle[(i+1)%3];
      if(a.d<=0)polygon.push(a);
      if((a.d<=0)!==(b.d<=0)){const t=a.d/(a.d-b.d);const p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,d:0};polygon.push(p);crossings.push(p);}
    }
    for(let i=1;i<polygon.length-1;i++)emit(polygon[0],polygon[i],polygon[i+1]);
    if(crossings.length===2)edges.push(crossings[0].x,y+.009,crossings[0].z,crossings[1].x,y+.009,crossings[1].z);
  };
  for(let z=0;z<nz;z++)for(let x=0;x<nx;x++) {const a=field[z][x],b=field[z][x+1],c=field[z+1][x+1],d=field[z+1][x];clip([a,b,c]);clip([a,c,d]);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  if(colorize)geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  return {geometry,edges};
}
export const WaterGarden = memo(function WaterGarden({ objects, select }: {objects:GardenObject[];select:(id:string,e:ThreeEvent<MouseEvent>)=>void}) {
  const water=useMemo(()=>objects.filter(o=>isWater(o.type)),[objects]);
  const shapeKey=water.map(o=>`${o.id}:${o.type}:${o.position.join(',')}:${o.rotation}:${o.variant}`).join('|');
  const assets=useMemo(()=>{
    const circles=water.flatMap(worldFootprint);
    const wet=surface(circles,0,.045,true),bank=surface(circles,.18,.022,false);
    const outline=new THREE.BufferGeometry();outline.setAttribute('position',new THREE.Float32BufferAttribute(wet.edges,3));
    const rocks:THREE.BufferGeometry[]=[];const used=new Set<string>();
    for(let i=0;i<wet.edges.length;i+=18){const x=wet.edges[i],z=wet.edges[i+2];const key=`${Math.round(x/.52)}:${Math.round(z/.52)}`;if(used.has(key))continue;used.add(key);
      rocks.push(new THREE.IcosahedronGeometry(1,1).scale(.12+randomAt(3,i)*.08,.055,.13).rotateY(i).translate(x,.055,z));}
    const pebbles=rocks.length?mergeGeometries(rocks)!:new THREE.BufferGeometry();rocks.forEach(g=>g.dispose());
    return {wet:wet.geometry,bank:bank.geometry,outline,pebbles};
    // Geometry changes only with water edits, not when placing trees or moving the camera.
  },[shapeKey]);
  const material=useMemo(()=>{
    const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.28,metalness:.18});
    m.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vGardenPoint;').replace('#include <begin_vertex>','#include <begin_vertex>\nvGardenPoint = position;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vGardenPoint;').replace('#include <color_fragment>',`#include <color_fragment>
        float ripple = sin(vGardenPoint.x * 13.0 + sin(vGardenPoint.z * 4.0)) * sin(vGardenPoint.z * 17.0 + vGardenPoint.x * 2.0);
        diffuseColor.rgb += pow(max(0.0, ripple), 14.0) * 0.06;
      `);
    };
    return m;
  },[]);
  useEffect(()=>()=>{Object.values(assets).forEach(g=>g.dispose());},[assets]);
  useEffect(()=>()=>material.dispose(),[material]);
  if(!water.length)return null;
  return <group dispose={null} position={[0,.035,0]}>
    <mesh geometry={assets.bank} receiveShadow><meshStandardMaterial color="#9ea88b" roughness={1}/></mesh>
    <mesh geometry={assets.wet} material={material} receiveShadow onClick={e=>{
      const hit=[...water].reverse().find(o=>waterField(worldFootprint(o),e.point.x,e.point.z)<.06);if(hit)select(hit.id,e);
    }}/>
    <lineSegments geometry={assets.outline}><lineBasicMaterial color="#d5dfb7" transparent opacity={.38}/></lineSegments>
    <mesh geometry={assets.pebbles} receiveShadow><meshStandardMaterial color="#9ca48e" roughness={1}/></mesh>
  </group>;
});
