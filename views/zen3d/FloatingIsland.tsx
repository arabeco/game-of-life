import { useEffect, useMemo } from 'react';
import { BufferGeometry, Color, Float32BufferAttribute } from 'three';
import { GARDEN_X,GARDEN_Z,GARDEN_ROUNDNESS,randomAt } from './model';
import { gardenSurface } from './gardenSurface';

export function islandRock(x:number,z:number,roundness:number){
  const n=128,rings=[{y:-.07,s:1.018},{y:-.7,s:1.025},{y:-2.5,s:.94},{y:-6,s:.7},{y:-10,s:.36},{y:-14,s:.025}],points:number[][]=[];
  for(let j=0;j<rings.length;j++)for(let i=0;i<n;i++){
    const a=i/n*Math.PI*2,c=Math.cos(a),s=Math.sin(a),r=(Math.abs(c/x)**roundness+Math.abs(s/z)**roundness)**(-1/roundness);
    const rough=j===0?0:(Math.sin(a*7+j*.8)+Math.sin(a*13-j*.4))*.025,ring=rings[j];
    points.push([c*r*(ring.s+rough),ring.y+(j===0?0:(randomAt(i+18,j)-.5)*.42),s*r*(ring.s+rough)]);
  }
  const vertices:number[]=[],colors:number[]=[];
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){
    const a=j*n+i,b=j*n+(i+1)%n,c=(j+1)*n+i,d=(j+1)*n+(i+1)%n;
    for(const tri of [[a,b,c],[b,d,c]]){
      const shade=new Color(j===0?'#776f60':j<3?'#666775':'#4e5264').multiplyScalar(.84+randomAt(i*7,j)*.27);
      for(const index of tri){vertices.push(...points[index]);colors.push(shade.r,shade.g,shade.b);}
    }
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setAttribute('color',new Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
export function FloatingIsland(){
  const geometry=useMemo(()=>islandRock(GARDEN_X,GARDEN_Z,GARDEN_ROUNDNESS),[]),top=useMemo(()=>gardenSurface(.07),[]);
  useEffect(()=>()=>{geometry.dispose();top.dispose();},[geometry,top]);
  return <group><mesh geometry={geometry} receiveShadow><meshStandardMaterial vertexColors roughness={.97}/></mesh><mesh geometry={top} rotation={[-Math.PI/2,0,0]} position={[0,-.055,0]} receiveShadow><meshStandardMaterial color="#9d977b" roughness={1}/></mesh></group>;
}
