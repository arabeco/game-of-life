import type { GardenObject } from './model';

// Small emissive panes and at most two local lights; no extra shadow maps.
export function GardenLanterns({objects,night}:{objects:GardenObject[];night:number}){
  const lamps=objects.filter(o=>o.type==='lantern'||o.type==='medieval-lamp');
  return <group>{lamps.map((o,i)=><group key={o.id} position={o.position} rotation={[0,o.rotation,0]}>
    <mesh position={[0,o.type==='medieval-lamp'?1.35:1.05,0]}><sphereGeometry args={[.105,8,6]}/><meshBasicMaterial color="#ffd8a0" transparent opacity={night*.92} toneMapped={false}/></mesh>
    {i<2&&<pointLight position={[0,1.45,0]} color="#ffcf91" intensity={night*5} distance={4.5} decay={2}/>}
  </group>)}</group>;
}
