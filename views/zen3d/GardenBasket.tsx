import { useEffect, useMemo, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { LatheGeometry, Vector2, Vector3 } from 'three';

export function GardenBasket({ score, target, onOpen }: {
  score: number | null; target: RefObject<HTMLButtonElement | null>; onOpen: () => void;
}) {
  const ready = score !== null;
  const accent = !ready ? '#796a53' : score > 15 ? '#d5ad56' : score >= 10 ? '#79afd0' : '#89ab79';
  const point = useMemo(() => new Vector3(), []);
  const fabric = useMemo(() => {
    const g = new LatheGeometry([[0,0],[.27,.03],[.44,.17],[.47,.42],[.39,.65],[.19,.82],[.17,.9],[.28,1.05],[.22,1.1],[0,1.07]].map(([x,y]) => new Vector2(x,y)), 24);
    const positions = g.attributes.position;
    for (let i=0;i<positions.count;i++) {
      const x=positions.getX(i),z=positions.getZ(i),y=positions.getY(i);
      const fold=1+Math.sin(Math.atan2(z,x)*8+y*2)*.045;
      const gatheredTop=y>.9?Math.sin(Math.atan2(z,x)*7)*.055:0;
      positions.setXYZ(i,x*fold,y+gatheredTop,z*fold*.78);
    }
    g.computeVertexNormals(); return g;
  }, []);
  useEffect(() => () => fabric.dispose(), [fabric]);
  useFrame(({camera,size}) => {
    const button=target.current;if(!button)return;
    point.set(2.4,.7,-6.2).project(camera);
    button.style.left=`${(point.x*.5+.5)*size.width}px`;
    button.style.top=`${(-point.y*.5+.5)*size.height}px`;
    button.style.visibility=point.z>1||point.z< -1||Math.abs(point.x)>1||Math.abs(point.y)>1?'hidden':'visible';
  });
  return <group position={[2.4,.08,-6.2]} scale={1.25} onClick={e=>{if(e.delta>7)return;e.stopPropagation();onOpen();}}>
    <mesh position={[0,-.06,0]} receiveShadow><boxGeometry args={[1.25,.16,1.12]}/><meshStandardMaterial color="#68614d" roughness={.95}/></mesh>
    <mesh geometry={fabric} castShadow receiveShadow><meshStandardMaterial color="#ae9670" roughness={1}/></mesh>
    {[.81,.87].map(y=><mesh key={y} position={[0,y,0]} rotation={[Math.PI/2,0,0]} scale={[1,.8,1]}><torusGeometry args={[.2,.035,6,24]}/><meshStandardMaterial color={accent} roughness={.8}/></mesh>)}
    {[-1,1].map(side=><mesh key={side} position={[side*.1,.84,.19]} scale={[1,.5,1]} rotation={[0,0,side*.4]}><torusGeometry args={[.09,.018,5,12]}/><meshStandardMaterial color={accent} roughness={.9}/></mesh>)}
    <mesh position={[.08,.68,.24]} rotation={[0,0,.2]}><cylinderGeometry args={[.019,.019,.35,6]}/><meshStandardMaterial color={accent} roughness={.9}/></mesh>
    <mesh position={[.11,.5,.33]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.11,.11,.035,12]}/><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={ready ? .28 : 0} metalness={.15} roughness={.65}/></mesh>
    {ready&&<mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.47,.58,32]}/><meshBasicMaterial color={accent} transparent opacity={.12} depthWrite={false}/></mesh>}
  </group>;
}
