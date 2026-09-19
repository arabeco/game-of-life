import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BackSide, Color, Mesh, ShaderMaterial, Vector3 } from 'three';
import { gardenTime, localGardenHour, type GardenTime } from './gardenTime';

export function useGardenTime(previewHour?:number){
  const [hour,setHour]=useState(()=>previewHour??localGardenHour());
  useEffect(()=>{
    const update=()=>{if(!document.hidden)setHour(previewHour??localGardenHour());};update();
    const timer=window.setInterval(update,15000);
    document.addEventListener('visibilitychange',update);window.addEventListener('focus',update);
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',update);window.removeEventListener('focus',update);};
  },[previewHour]);
  return useMemo(()=>gardenTime(hour),[hour]);
}

// One distant sky surface: high fibrous cirrus and a lower stratus veil, no puff meshes.
export function GardenSky({time}:{time:GardenTime}){
  const ref=useRef<Mesh>(null),{invalidate}=useThree();
  const material=useMemo(()=>new ShaderMaterial({side:BackSide,depthWrite:false,toneMapped:false,uniforms:{
    top:{value:new Color()},horizon:{value:new Color()},bottom:{value:new Color()},sun:{value:new Vector3()},moon:{value:new Vector3()},day:{value:1},night:{value:0},drift:{value:0},
  },vertexShader:`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`precision highp float;
    varying vec3 vDirection;uniform vec3 top,horizon,bottom,sun,moon;uniform float day,night,drift;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){return .57*noise(p)+.28*noise(p*2.03+13.7)+.15*noise(p*4.11+5.4);}
    void main(){
      vec3 d=normalize(vDirection);float y=d.y;
      vec3 color=mix(horizon,top,smoothstep(0.,.85,y));color=mix(color,bottom,(1.-smoothstep(-.8,0.,y)));
      // Continuous world-space projection avoids a visible seam around the island.
      vec2 uv=d.xz/(abs(y)+.32);float warp=fbm(uv*1.7);
      float cirrus=fbm(uv*vec2(2.,22.)+vec2(drift*.014,warp*2.));
      cirrus=smoothstep(.49,.8,cirrus)*smoothstep(.08,.45,y)*smoothstep(.25,.7,fbm(uv*.6+4.))*.22;
      float stratus=fbm(uv*vec2(1.8,5.)+vec2(drift*.006,8.));
      stratus=smoothstep(.3,.79,stratus)*(1.-smoothstep(-.18,.18,y))*.26;
      color=mix(color,mix(vec3(.42,.49,.62),vec3(.94,.95,.96),day),cirrus+stratus);
      float sd=dot(d,normalize(sun)),md=dot(d,normalize(moon));
      color+=vec3(1.,.73,.4)*pow(max(0.,sd),36.)*.25*day;
      color=mix(color,vec3(1.,.95,.78),smoothstep(.99945,.9997,sd)*smoothstep(-.04,.04,sun.y));
      float lunar=smoothstep(.9988,.99915,md)*smoothstep(-.02,.08,moon.y);
      float crater=.7*fbm(d.xz*65.)+.3*noise(d.xz*170.);color=mix(color,vec3(.76,.85,1.)*(.72+crater*.25),lunar*.9);
      vec2 grid=vec2(atan(d.z,d.x)*110.,asin(d.y)*110.);vec2 cell=floor(grid),q=fract(grid)-.5;
      float star=step(.986,hash(cell))*(1.-smoothstep(0.,.12,length(q)))*night*smoothstep(-.02,.3,y);
      color+=vec3(.73,.83,1.)*star;
      gl_FragColor=vec4(color,1.);
      #include <colorspace_fragment>
    }`}),[]);
  useEffect(()=>{
    const u=material.uniforms;u.top.value.set(time.top);u.horizon.value.set(time.horizon);u.bottom.value.set(time.bottom);u.sun.value.set(...time.sun);u.moon.value.set(...time.moon);u.day.value=time.daylight;u.night.value=time.night;u.drift.value=time.hour;invalidate();
  },[time,material,invalidate]);
  useEffect(()=>()=>material.dispose(),[material]);
  useFrame(({camera})=>{ref.current?.position.copy(camera.position);});
  return <mesh ref={ref} renderOrder={-100} material={material}><sphereGeometry args={[78,40,24]}/></mesh>;
}
