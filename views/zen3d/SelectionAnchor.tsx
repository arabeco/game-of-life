import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useMemo, type RefObject } from 'react';
// HTML actions follow the projected selection without a React update every frame.
export function SelectionAnchor({position,element}:{position:[number,number,number];element:RefObject<HTMLDivElement|null>}){
 const {size}=useThree(),point=useMemo(()=>new Vector3(),[]);
 useFrame(({camera})=>{const node=element.current;if(!node)return;point.set(position[0],position[1]+.55,position[2]).project(camera);
  const x=Math.max(122,Math.min(size.width-122,(point.x*.5+.5)*size.width));
  const y=Math.max(170,Math.min(size.height-170,(-point.y*.5+.5)*size.height-38));
  node.style.left=`${x}px`;node.style.top=`${y}px`;node.style.visibility=point.z>1?'hidden':'visible';
 });return null;
}
