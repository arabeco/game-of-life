import React,{useEffect,useMemo,useRef} from 'react';
import { LegacyGrandPlaque } from './LegacyGrandPlaque';
import { NOBILITY_RANKS } from '../constants/nobility';
import { gardenLegacyEras } from '../utils/gardenLegacy';
import type { Report,UserProfile } from '../types';

export interface GardenPlaqueImage {image:string;aspect:number}
export function GardenLegacyCapture({profile,reports,boundaries,available,onReady}:{profile:UserProfile;reports:Report[];boundaries:string[];available:boolean;onReady:(image:GardenPlaqueImage)=>void}){
  const ref=useRef<HTMLDivElement>(null);
  const eras=useMemo(()=>gardenLegacyEras(reports,boundaries),[reports,boundaries]);
  const identity=useMemo(()=>({nickname:profile.nickname||profile.username||'Legado',level:profile.level??0,title:profile.title,nobilityRankName:NOBILITY_RANKS.find(r=>r.id===profile.nobility?.rankId)?.name,capturedAt:''}),[profile.nickname,profile.username,profile.level,profile.title,profile.nobility?.rankId]);
  useEffect(()=>{
    let cancelled=false;
    const capture=async()=>{
      const {toPng}=await import('html-to-image');
      await document.fonts.ready;
      const node=ref.current;if(!node||cancelled)return;
      const image=await toPng(node,{pixelRatio:2,cacheBust:false,skipFonts:true});
      if(!cancelled)onReady({image,aspect:node.offsetWidth/node.offsetHeight});
    };
    capture().catch(()=>{/* Keep the neutral pedestal; never substitute another person's statistics. */});
    return()=>{cancelled=true;};
  },[eras,identity,profile.legacyPlaqueColor,available,onReady]);
  return <div aria-hidden="true" style={{position:'fixed',left:-10000,top:0,width:480,pointerEvents:'none'}}><div ref={ref} style={{width:480}}><LegacyGrandPlaque eras={eras} sovereignName={identity.nickname} identity={identity} plaqueColorId={profile.legacyPlaqueColor} compact captureSafe metricsAvailable={available}/></div></div>;
}
