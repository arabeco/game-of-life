import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, LatheGeometry, Vector2, Vector3 } from 'three';

export function GardenBasket({ score, target, onOpen }: {
  score: number | null; target: RefObject<HTMLButtonElement | null>; onOpen: () => void;
}) {
  const ready = score !== null;
  const accent = !ready ? '#796a53' : score > 15 ? '#e3ba62' : score >= 10 ? '#78c7ef' : '#91c986';
  const sacks = !ready ? 0 : score > 15 ? 3 : score >= 10 ? 2 : 1;
  const point = useMemo(() => new Vector3(), []);
  const rewardGlow = useRef<Group>(null);
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
  useFrame(({camera,size,clock}) => {
    const button=target.current;if(!button)return;
    point.set(2.4,.7,-6.2).project(camera);
    button.style.left=`${(point.x*.5+.5)*size.width}px`;
    button.style.top=`${(-point.y*.5+.5)*size.height}px`;
    button.style.visibility=point.z>1||point.z< -1||Math.abs(point.x)>1||Math.abs(point.y)>1?'hidden':'visible';
    if (rewardGlow.current && ready) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 2.2) * .08;
      rewardGlow.current.scale.setScalar(pulse);
      rewardGlow.current.rotation.y += .005;
    }
  });
  return <group position={[2.4,.08,-6.2]} scale={.72} onClick={e=>{if(e.delta>7)return;e.stopPropagation();onOpen();}}>
    <mesh position={[0,.05,0]} receiveShadow><cylinderGeometry args={[.7,.57,.24,20]}/><meshStandardMaterial color="#5f482d" roughness={.92}/></mesh>
    {[0,.09,.18].map((y,index)=><mesh key={y} position={[0,y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.61-index*.025,.026,8,28]}/><meshStandardMaterial color={index===1?'#b88649':'#735332'} roughness={.82}/></mesh>)}
    {[-1,1].map(side=><mesh key={side} position={[side*.42,.47,0]} rotation={[0,0,side*.36]}><torusGeometry args={[.43,.035,8,24,Math.PI]}/><meshStandardMaterial color="#9b7140" roughness={.72}/></mesh>)}
    {Array.from({length:sacks}).map((_, index)=>{const x=[-.2,.19,0][index], z=[.08,.12,-.14][index], tone=['#b86e91','#6c9bb5','#b79455'][index];return <group key={index} position={[x,.18+index*.035,z]} scale={index===2?.55:.6} rotation={[0,index*.42,0]}>
      <mesh geometry={fabric} castShadow receiveShadow><meshStandardMaterial color={tone} roughness={.88} emissive={ready ? accent : tone} emissiveIntensity={ready ? .18 + index * .05 : 0}/></mesh>
      <mesh position={[0,.86,.02]} rotation={[Math.PI/2,0,0]} scale={[1,.8,1]}><torusGeometry args={[.2,.03,6,24]}/><meshStandardMaterial color={accent} metalness={.22} roughness={.55}/></mesh>
      <mesh position={[.1,.5,.32]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.11,.11,.035,12]}/><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={ready?.9:0} metalness={.35} roughness={.45}/></mesh>
    </group>})}
    {ready&&<group ref={rewardGlow}><pointLight color={accent} intensity={1.25} distance={3.5} decay={2}/><mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.58,.78,32]}/><meshBasicMaterial color={accent} transparent opacity={.3} depthWrite={false}/></mesh><mesh position={[0,.035,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.84,.88,32]}/><meshBasicMaterial color={accent} transparent opacity={.12} depthWrite={false}/></mesh></group>}
  </group>;
}
