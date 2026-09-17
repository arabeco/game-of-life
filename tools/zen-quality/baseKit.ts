import * as T from 'three';

export type Variant = { p: number[]; s: number[]; r: number; tint: string };
type InstanceModel = (root: T.Group, variants: Variant[], foliageOnly: boolean) => T.Group;

/** A reusable starter palette; future kits can derive materials without new image files. */
export const BASE_PALETTE = {
  stone: '#ddd6bd', edge: '#959c86', bamboo: '#78844b', node: '#b4ab7d',
  leaf: '#526b35', water: '#476e65', bronze: '#685740', light: '#ffd496',
};
export const KIT_THEMES = {
  serene: {name:'Sereno', palette:BASE_PALETTE, foliage: null},
  luxury: {name:'Pátio dourado', palette:{...BASE_PALETTE,stone:'#e9dcc4',edge:'#b2a58d',bronze:'#997947',light:'#ffe1a3'},foliage:'#bca75b'},
  genesis: {name:'Gênesis',palette:{...BASE_PALETTE,stone:'#686475',edge:'#4c4659',bamboo:'#595567',node:'#9983aa',leaf:'#796091',water:'#423e60',bronze:'#756382',light:'#d4b3ff'},foliage:'#9565b2'},
};
export type KitTheme = keyof typeof KIT_THEMES;

export function createBaseKit(tree: T.Group, rock: T.Group, instanceModel: InstanceModel, theme: KitTheme = 'serene') {
  const style=KIT_THEMES[theme],palette=style.palette;
  const kit = new T.Group(); kit.name = style.name;
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
  let rockMaterial: T.MeshStandardMaterial | undefined;
  rock.traverse(object => {
    if (object instanceof T.Mesh && object.material instanceof T.MeshStandardMaterial) rockMaterial ??= object.material;
  });
  const stone = rockMaterial!.clone(); stone.color.set(palette.stone); stone.roughness = .94;
  const edge = stone.clone(); edge.color.set(palette.edge);
  const softenStone = (material: T.MeshStandardMaterial) => {
    material.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
        #include <map_fragment>
        float stoneLuma = dot(diffuseColor.rgb, vec3(.2126,.7152,.0722));
        diffuseColor.rgb = mix(vec3(stoneLuma) * vec3(1.06,1.03,.94), diffuseColor.rgb, .32);
      `);
    };
    material.customProgramCacheKey = () => 'serene-weathered-stone';
  };
  softenStone(stone);softenStone(edge);
  const bamboo = new T.MeshStandardMaterial({ color: palette.bamboo, roughness: .76 });
  const node = new T.MeshStandardMaterial({ color: palette.node, roughness: .85 });
  const leaf = new T.MeshStandardMaterial({ color: palette.leaf, roughness: .83, side: T.DoubleSide });
  const bronze = new T.MeshStandardMaterial({ color: palette.bronze, roughness: .48, metalness: .55 });
  const glow = new T.MeshBasicMaterial({ color: palette.light });
  [stone, edge, bamboo, node, leaf, bronze, glow].forEach(m => materials.add(m));

  function mesh(geometry: T.BufferGeometry, material: T.Material, parent: T.Object3D, p = [0,0,0], s = [1,1,1]) {
    geometries.add(geometry);
    const object = new T.Mesh(geometry, material);
    object.position.set(...p as [number,number,number]); object.scale.set(...s as [number,number,number]);
    object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  }
  function batch(geometry: T.BufferGeometry, material: T.Material, transforms: T.Matrix4[], parent = kit) {
    geometries.add(geometry);
    const object = new T.InstancedMesh(geometry, material, transforms.length);
    transforms.forEach((m, i) => object.setMatrixAt(i, m));
    object.instanceMatrix.needsUpdate = true;
    object.castShadow = true; object.receiveShadow = true; object.computeBoundingSphere();
    parent.add(object); return object;
  }
  const matrix = (p: number[], s: number[], yaw = 0) => new T.Matrix4().compose(
    new T.Vector3(...p), new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0), yaw), new T.Vector3(...s));

  // The approved tree remains the focal point; the rock file supplies all larger rocks.
  const treeGroup=instanceModel(tree, [
    { p:[-2.7,.03,-1.4], s:[1,.94,1], r:.35, tint:'#ffffff' },
    { p:[-7.5,.03,-5.6], s:[.58,.62,.58], r:2.1, tint:'#d6e1c4' },
    { p:[7.2,.03,5.7], s:[.46,.53,.46], r:4.8, tint:'#c5d7b4' },
  ], true);
  if(style.foliage) treeGroup.traverse(object=>{
    if(!(object instanceof T.Mesh)||!(object.material instanceof T.MeshStandardMaterial)||!object.material.name.includes('leaves'))return;
    const material=object.material.clone(),tint=new T.Color(style.foliage!);
    material.onBeforeCompile=shader=>{
      shader.uniforms.gardenLeafTint={value:tint};
      shader.fragmentShader='uniform vec3 gardenLeafTint;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat leafLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));\ndiffuseColor.rgb=leafLuma*gardenLeafTint*2.1;');
    };
    material.customProgramCacheKey=()=>`garden-foliage-${theme}`;
    materials.add(material);object.material=material;
  });
  kit.add(treeGroup);
  kit.add(instanceModel(rock, [
    {p:[-3.5,0,-.15],s:[.46,.31,.5],r:1.8,tint:'#ffffff'},
    {p:[3.45,0,1.15],s:[.43,.28,.4],r:2.6,tint:'#d0d4c1'},
    {p:[1.5,0,-.6],s:[.33,.32,.36],r:.7,tint:'#d6d8bb'},
    {p:[2.65,0,3.05],s:[.3,.18,.36],r:3.5,tint:'#dfdbc9'},
    // A deliberately balanced, three-stone signature for the starter collection.
    ...(theme==='serene' ? [
    {p:[-3.3,0,2.6],s:[.52,.20,.45],r:.3,tint:'#d6d6c8'},
    {p:[-3.28,.51,2.6],s:[.34,.16,.32],r:2.1,tint:'#d6d6c8'},
    {p:[-3.25,.92,2.6],s:[.21,.13,.23],r:4.5,tint:'#d6d6c8'},
    ] : []),
  ], false));

  // A compact garden edge gives the composition a readable footprint.
  const borderTransforms: T.Matrix4[] = [];
  // The new footprint is about four times the original area: the central
  // composition keeps its intimacy while the outer margin gives the arrival
  // camera and the smaller trees room to breathe.
  for (let i=0;i<36;i++) for (const z of [-8.9,8.9]) borderTransforms.push(matrix([-10.5+i*.6,.015,z],[.575,.14,.18]));
  for (let i=0;i<30;i++) for (const x of [-10.8,10.8]) borderTransforms.push(matrix([x,.015,-8.7+i*.6],[.18,.14,.575]));
  batch(new T.BoxGeometry(1,1,1), edge, borderTransforms);

  // One beveled slab mesh repeated along a gentle path.
  const slab = new T.Shape([new T.Vector2(-.48,-.28),new T.Vector2(-.31,-.43),new T.Vector2(.33,-.38),new T.Vector2(.49,-.15),new T.Vector2(.39,.35),new T.Vector2(-.32,.4)]);
  const slabGeometry = new T.ExtrudeGeometry(slab,{depth:.07,bevelEnabled:true,bevelThickness:.04,bevelSize:.05,bevelSegments:2,steps:1});
  slabGeometry.rotateX(-Math.PI/2);
  const steps = [[-.5,3.85],[-.85,2.85],[-1,1.85],[-1.3,.85],[-1.65,-.15],[-1.6,-1.2],[-.9,-2.15],[.1,-2.65],[1.2,-2.75],[2.2,-3.55],[3.2,-4.55],[4.15,-5.55],[5.2,-6.45]];
  batch(slabGeometry,stone,steps.map(([x,z],i)=>matrix([x,.015,z],[1+(i%3)*.06,1,.83],Math.sin(i*.9)*.3)));

  // Pool: shallow rippled geometry, a dark bed and a shared-stone shoreline.
  const poolCenter = new T.Vector3(2,.065,1.5);
  function shore(angle: number, scale = 1) {
    const radius = 1 + .08*Math.sin(angle*3) + .05*Math.cos(angle*5);
    return new T.Vector2(Math.cos(angle)*1.6*radius*scale,Math.sin(angle)*1.22*radius*scale);
  }
  const points: number[] = [], indices: number[] = [];
  const radial=18, angular=80;
  for(let r=0;r<=radial;r++) for(let a=0;a<=angular;a++) {
    const p=shore(a/angular*Math.PI*2,r/radial);
    points.push(p.x,.006*Math.sin(p.x*15+p.y*8)*Math.sin(r/radial*Math.PI),p.y);
    if(r<radial&&a<angular){const i=r*(angular+1)+a;indices.push(i,i+1,i+angular+1,i+1,i+angular+2,i+angular+1);}
  }
  const waterGeometry = new T.BufferGeometry(); waterGeometry.setAttribute('position',new T.Float32BufferAttribute(points,3)); waterGeometry.setIndex(indices); waterGeometry.computeVertexNormals();
  // A tiny generated sky supplies reflection without another image download.
  const skyPixels=new Uint8Array(128*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<128;x++) {
    const horizon=1-Math.abs(y/63-.5)*2, cloud=Math.max(0,Math.sin(x*.14)+Math.cos(y*.32)-.7)*.22;
    const i=(y*128+x)*4;
    skyPixels[i]=Math.min(255,132+horizon*83+cloud*50);
    skyPixels[i+1]=Math.min(255,158+horizon*62+cloud*50);
    skyPixels[i+2]=Math.min(255,176+horizon*40+cloud*50);skyPixels[i+3]=255;
  }
  const sky=new T.DataTexture(skyPixels,128,64);sky.colorSpace=T.SRGBColorSpace;sky.mapping=T.EquirectangularReflectionMapping;sky.needsUpdate=true;
  const water = new T.MeshPhysicalMaterial({color:palette.water,roughness:.17,metalness:.05,clearcoat:1,clearcoatRoughness:.1,envMap:sky,envMapIntensity:1.5});
  materials.add(water);
  const surface=mesh(waterGeometry,water,kit,poolCenter.toArray()); surface.castShadow=false;
  const pebbles = Array.from({length:46},(_,i)=>{const angle=i/46*Math.PI*2,p=shore(angle,1.035);return matrix([poolCenter.x+p.x,.08,poolCenter.z+p.y],[.21+(i%3)*.035,.12,.18+(i%4)*.022],angle);});
  batch(new T.DodecahedronGeometry(1,1),stone,pebbles);
  // Delicate ripple accents keep water readable without continuous animation/rendering.
  const rippleMaterial=new T.MeshBasicMaterial({color:'#bdc8b3',transparent:true,opacity:.24,depthWrite:false,side:T.DoubleSide});materials.add(rippleMaterial);
  for(const radius of [.23,.36,.52]) {
    const ring=mesh(new T.RingGeometry(radius,radius+.008,48),rippleMaterial,kit,[2.45,.079,1.3],[1, .65,1]);
    ring.rotation.x=-Math.PI/2;ring.castShadow=false;ring.receiveShadow=false;
  }

  // Bamboo uses shared segment/node/leaf meshes instead of one model per stem.
  const stems:T.Matrix4[]=[], nodes:T.Matrix4[]=[], leaves:T.Matrix4[]=[],branches:T.Matrix4[]=[];
  for(let i=0;i<11;i++) {
    const x=2.8+Math.sin(i*2.4)*.7,z=-2.6+Math.cos(i*1.8)*.65,height=2.6+(i%4)*.35;
    const count=7,segment=height/count;
    for(let j=0;j<count;j++) {
      const bend=j*j*.003*(i%2?1:-1);
      stems.push(matrix([x+bend,(j+.5)*segment,z],[.055+(i%3)*.008,segment-.014,.055+(i%3)*.008]));
      nodes.push(matrix([x+bend,(j+1)*segment,z],[.076,.026,.076]));
    }
    for(let j=0;j<5;j++) {
      const yaw=i*2.1+j*2.4,level=height*(.59+j*.085),reach=.55+(j%3)*.12;
      const start=new T.Vector3(x,level,z),end=new T.Vector3(x+Math.cos(yaw)*reach,level+.18,z+Math.sin(yaw)*reach);
      const delta=end.clone().sub(start),center=start.clone().add(end).multiplyScalar(.5);
      branches.push(new T.Matrix4().compose(center,new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize()),new T.Vector3(.018,delta.length(),.018)));
      for(let k=0;k<7;k++) {
        const along=.3+k*.095,tip=start.clone().lerp(end,along),leafYaw=yaw+(k%2?1:-1)*.7;
        const leafMatrix = matrix(tip.toArray(),[.23,.43+(k%3)*.08,.23],leafYaw);
        leafMatrix.multiply(new T.Matrix4().makeRotationZ(1.35+(k%3)*.22));
        leaves.push(leafMatrix);
      }
    }
  }
  batch(new T.CylinderGeometry(.86,1,1,7,1),bamboo,stems);
  batch(new T.CylinderGeometry(1,1,1,8,1),node,nodes);
  batch(new T.CylinderGeometry(.45,1,1,5,1),bamboo,branches);
  const leafShape = new T.Shape();leafShape.moveTo(0,0);leafShape.quadraticCurveTo(.65,.35,0,1);leafShape.quadraticCurveTo(-.32,.35,0,0);
  batch(new T.ShapeGeometry(leafShape,3),leaf,leaves);

  // Reusable lantern: weathered stone, open chamber, bronze details and warm core.
  const lantern = new T.Group();kit.add(lantern);lantern.position.set(-.05,0,.05);
  const lathe=(profile:number[][],segments=12)=>new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),segments);
  mesh(lathe([[0,0],[.39,0],[.42,.07],[.36,.15],[.22,.2],[.16,.3],[.14,.9],[.22,1],[.33,1.05],[.33,1.12],[0,1.12]]),stone,lantern);
  const barGeometry=new T.BoxGeometry(.055,.44,.055);
  for(const x of [-.22,.22]) for(const z of [-.22,.22]) mesh(barGeometry,bronze,lantern,[x,1.35,z]);
  mesh(new T.CylinderGeometry(.11,.13,.25,10),glow,lantern,[0,1.32,0]);
  const roof=mesh(lathe([[0,1.92],[.055,1.9],[.1,1.74],[.2,1.64],[.4,1.58],[.54,1.6],[.52,1.53],[.27,1.48],[0,1.48]],4),stone,lantern);
  roof.rotation.y=Math.PI/4;
  mesh(new T.SphereGeometry(.07,8,5),bronze,lantern,[0,1.94,0]);
  const second=lantern.clone(true);second.position.set(3.85,0,-1.15);second.scale.setScalar(.72);kit.add(second);

  if(theme!=='serene') {
    const signature=new T.Group();signature.position.set(-3.3,0,2.6);kit.add(signature);
    mesh(new T.CylinderGeometry(.53,.64,.22,8),stone,signature,[0,.11,0]);
    mesh(new T.CylinderGeometry(.4,.48,.12,8),bronze,signature,[0,.28,0]);
    if(theme==='genesis') {
      const crystal=new T.MeshPhysicalMaterial({color:'#9c65cc',metalness:.23,roughness:.16,clearcoat:1,emissive:'#41245a',emissiveIntensity:.25});materials.add(crystal);
      mesh(new T.OctahedronGeometry(.48,0),crystal,signature,[0,1.05,0],[.72,1.65,.72]);
      const arc=mesh(new T.TorusGeometry(.64,.035,6,40),bronze,signature,[0,1.06,0]);arc.rotation.y=.5;
      const cross=mesh(arc.geometry,bronze,signature,[0,1.06,0]);cross.rotation.y=Math.PI/2+.5;
      for(const [x,z,h] of [[-.4,.25,.55],[.36,.18,.4],[.15,-.4,.62]]) mesh(new T.ConeGeometry(.11,h,5),crystal,signature,[x,.35+h/2,z]);
    }else{
      // Stylized guardian sculpture: draped stone body, helmet, shield and staff.
      mesh(lathe([[0,0],[.31,0],[.33,.12],[.23,.38],[.19,.77],[.29,.91],[.2,1],[0,1]],8),stone,signature,[0,.36,0]);
      mesh(new T.SphereGeometry(.18,10,8),stone,signature,[0,1.52,0],[.85,1.16,.85]);
      mesh(new T.ConeGeometry(.2,.22,8),bronze,signature,[0,1.74,0]);
      mesh(new T.CylinderGeometry(.025,.025,1.28,6),bronze,signature,[.35,.98,0]);
      mesh(new T.SphereGeometry(.05,8,6),bronze,signature,[.35,1.63,0]);
      const shield=new T.Shape([new T.Vector2(-.17,.2),new T.Vector2(.17,.2),new T.Vector2(.15,-.1),new T.Vector2(0,-.27),new T.Vector2(-.15,-.1)]);
      mesh(new T.ExtrudeGeometry(shield,{depth:.06,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:1}),bronze,signature,[-.12,1.1,.21]);
    }
  }

  kit.userData.dispose = () => {
    kit.traverse(object=>{if(object instanceof T.InstancedMesh)object.dispose();});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
    sky.dispose();
    // Borrowed tree/rock geometry and image textures remain owned by the scene cache.
  };
  return kit;
}
