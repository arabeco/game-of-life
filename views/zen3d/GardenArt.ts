import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { KIT_THEMES, type KitTheme } from '../../tools/zen-quality/baseKit';

export const NEW_GARDEN_PIECES = ['strata-stone','wood-walkway','fern','low-lantern'] as const;
export type NewGardenPiece = typeof NEW_GARDEN_PIECES[number];
export const isNewGardenPiece=(type:string):type is NewGardenPiece=>NEW_GARDEN_PIECES.includes(type as NewGardenPiece);

// Each recipe is merged by material before the existing instance renderer uses it.
// No image requests: stone borrows the approved rock maps; other surfaces use geometry.
export function createGardenArt(type:NewGardenPiece,theme:KitTheme,rock?:T.MeshStandardMaterial){
 const palette=KIT_THEMES[theme].palette,root=new T.Group();
 const stone=rock?.clone()??new T.MeshStandardMaterial();stone.color.set(palette.stone);stone.roughness=.96;
 stone.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 float luma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
 diffuseColor.rgb=diffuse*mix(.36,luma,.55)*2.0;
 `);};stone.customProgramCacheKey=()=> 'garden-art-strata-v1';

 const wood=new T.MeshStandardMaterial({color:theme==='genesis'?'#5b4c62':theme==='luxury'?'#9a7950':'#766044',roughness:.95});
 const dark=new T.MeshStandardMaterial({color:theme==='genesis'?'#322b42':'#343b31',roughness:.68,metalness:.6});
 const metal=new T.MeshStandardMaterial({color:palette.bronze,roughness:.57,metalness:.7});
 const leaf=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.83});
 const glow=new T.MeshStandardMaterial({color:palette.light,emissive:palette.light,emissiveIntensity:.7,roughness:.55});
 const buckets=new Map<T.Material,T.BufferGeometry[]>();
 function add(g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0,rz=0){g.rotateZ(rz).translate(x,y,z);const list=buckets.get(m)??[];list.push(g.index?g.toNonIndexed():g);if(g.index)g.dispose();buckets.set(m,list);}
 function box(w:number,h:number,d:number,m:T.Material,x:number,y:number,z:number){add(new T.BoxGeometry(w,h,d),m,x,y,z);}
 if(type==='strata-stone'){
  const vertices:number[]=[],uvs:number[]=[],indices:number[]=[];
  const rings=25,segments=12;
  for(let i=0;i<=rings;i++)for(let j=0;j<=segments;j++){
   const t=i/rings,a=j/segments*Math.PI*2;
   const width=.48*(1-.22*t)+.028*Math.sin(t*48)+.025*Math.cos(a*5+t*12);
   const y=t*1.8;
   vertices.push(Math.cos(a)*width+.06*Math.sin(t*5),y,Math.sin(a)*width*.58);
   uvs.push(j/segments,t);
  }
  for(let i=0;i<rings;i++)for(let j=0;j<segments;j++){const n=i*(segments+1)+j;indices.push(n,n+segments+1,n+1,n+1,n+segments+1,n+segments+2);}
  for(let j=1;j<segments-1;j++){indices.push(0,j+1,j);const n=rings*(segments+1);indices.push(n,n+j,n+j+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();add(g,stone);
 }else if(type==='wood-walkway'){
  for(const x of [-.37,.37])box(.13,.13,3.15,dark,x,.07,0);
  for(let i=0;i<13;i++){
   const z=-1.44+i*.24;box(1.08+Math.sin(i*3)*.035,.105,.216,wood,Math.sin(i)*.012,.175,z);
   for(const x of [-.38,.38])add(new T.CylinderGeometry(.018,.018,.006,6),metal,x,.231,z);
   // Fine recessed grain reads as elongated timber fibers, not painted stripes.
   for(let j=0;j<3;j++)box(.24+((i+j)%4)*.09,.002,.004,dark,-.28+j*.24,.228,z+.04*Math.sin(i+j));
  }
 }else if(type==='low-lantern'){
  add(new T.CylinderGeometry(.28,.34,.09,24),dark,0,.045);
  add(new T.CylinderGeometry(.19,.23,.44,24),glow,0,.31);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;box(.045,.48,.045,metal,Math.cos(a)*.23,.33,Math.sin(a)*.23);}
  add(new T.CylinderGeometry(.3,.3,.055,24),metal,0,.59);
  add(new T.ConeGeometry(.34,.15,24),dark,0,.69);
  add(new T.SphereGeometry(.045,10,6),metal,0,.79);
 }else{
  const p:number[]=[],colors:number[]=[],uv:number[]=[],base=new T.Color(theme==='luxury'?'#8c9450':palette.leaf);
  const point=(a:number,t:number)=>new T.Vector3(Math.cos(a)*1.02*t,.08+Math.sin(t*Math.PI*.82)*.85,Math.sin(a)*1.02*t);
  for(let f=0;f<11;f++){
   const a=f*2.399,scale=.73+(f%4)*.085;
   const curve=new T.CatmullRomCurve3(Array.from({length:13},(_,i)=>point(a,i/12).multiplyScalar(scale)));
   add(new T.TubeGeometry(curve,16,.009,4,false),wood);
   for(let j=1;j<18;j++)for(const side of [-1,1]){
    const t=j/19,center=point(a,t).multiplyScalar(scale),len=.23*Math.sin(Math.PI*t)**.7*scale;
    const tangent=new T.Vector3(-Math.sin(a)*side,.08,Math.cos(a)*side);
    const tip=center.clone().addScaledVector(tangent,len).add(new T.Vector3(Math.cos(a),-.035,Math.sin(a)).multiplyScalar(.06));
    const along=new T.Vector3(Math.cos(a),0,Math.sin(a)).multiplyScalar(.029*scale);
    const mid=center.clone().lerp(tip,.53);mid.y+=.018;
    const verts=[center,mid.clone().add(along),tip,center,tip,mid.clone().sub(along)];
    for(const [k,v] of verts.entries()){p.push(v.x,v.y,v.z);const c=base.clone().multiplyScalar(.78+.3*t+(k%3)*.055);colors.push(c.r,c.g,c.b);uv.push(k%2,t);}
   }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();add(g,leaf);
 }
 for(const [material,geometries] of buckets){const geometry=mergeGeometries(geometries)!;geometries.forEach(g=>g.dispose());const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
 for(const material of [stone,wood,dark,metal,leaf,glow])if(!buckets.has(material))material.dispose();
 root.userData.dispose=()=>root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();}});
 return root;
}
