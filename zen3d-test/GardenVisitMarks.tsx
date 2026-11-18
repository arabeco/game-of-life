import {useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import type {Group} from 'three';
import type {GardenMark} from '../utils/visitasJardim';
import {useGardenAccount} from '../views/zen3d/gardenAccount';

function Mark({mark,index}:{mark:GardenMark;index:number}) {
 const account=useGardenAccount(),group=useRef<Group>(null),wings=useRef<Group>(null);
 const invalidate=useThree(s=>s.invalidate);
 const seed=Array.from(mark.id).reduce((n,c)=>n+c.charCodeAt(0),0);
 const x=(seed%7-3)*.6,z=2+Math.floor(index/5)*.65;
 const pond=account?.initial?.objects.find(o=>o.type==='pond')?.position||[3,0,-.3];
 const feeding=mark.kind==='peixes'&&Date.now()-Date.parse(mark.created_at)<12000;
 useFrame(({clock})=>{
  if(!group.current)return;
  group.current.visible=Date.parse(mark.expires_at||'')>Date.now()&&(mark.kind!=='peixes'||Date.now()-Date.parse(mark.created_at)<12000);
  if(account?.essential)return;
  const t=clock.elapsedTime;
  if(mark.kind==='borboleta'){
   group.current.position.set(x+Math.sin(t*.6+seed)*.6,1.2+Math.sin(t*1.2+seed)*.2,z+Math.cos(t*.5+seed)*.4);
   if(wings.current)wings.current.scale.x=.4+Math.abs(Math.sin(t*7))*.6;
   invalidate();
  }else if(feeding){group.current.rotation.y=t*.7;invalidate();}
 });
 if(mark.kind==='peixes'&&!feeding)return null;
 const inspect=(e:{stopPropagation:()=>void})=>{e.stopPropagation();account?.inspectVisitMark?.(mark);};
 return <group ref={group} position={mark.kind==='peixes'?[pond[0],.23,pond[2]]:[x,mark.kind==='borboleta'?1.2:.13,z]} onClick={inspect}>
  {mark.kind==='recado'?<mesh scale={[.35,.13,.26]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#b4baa8" roughness={.9}/></mesh>:mark.kind==='borboleta'?<>
   <mesh scale={[.035,.12,.035]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#5e4735"/></mesh>
   <group ref={wings}>{[-1,1].map(side=><mesh key={side} position={[side*.13,0,0]} scale={[.16,.1,.035]} rotation={[0,side*.4,side*.25]}><sphereGeometry args={[1,10,8]}/><meshStandardMaterial color={seed%2?'#dbaf70':'#a1c5da'} roughness={.7}/></mesh>)}</group>
  </>:<>{[0,1,2,3].map(i=><group key={i} position={[Math.cos(i*1.57)*.35,0,Math.sin(i*1.57)*.35]} rotation={[0,-i*1.57,0]}><mesh scale={[.14,.045,.06]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color={i%2?'#e6b778':'#d98055'}/></mesh><mesh position={[-.16,0,0]} rotation={[0,0,Math.PI/2]}><coneGeometry args={[.07,.12,3]}/><meshStandardMaterial color="#d98055"/></mesh></group>)}<mesh><sphereGeometry args={[.025,6,4]}/><meshBasicMaterial color="#bf9c65"/></mesh></>}
 </group>;
}
/** Camada efêmera: não entra em objects, artifacts, snapshot ou salvamento. */
export function GardenVisitMarks(){const account=useGardenAccount();return <group>{(account?.visitMarks||[]).filter(m=>Date.parse(m.expires_at||'')>Date.now()).slice(0,20).map((mark,index)=><Mark key={mark.id} mark={mark} index={index}/>)}</group>;}
