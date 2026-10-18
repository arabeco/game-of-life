import { useEffect, useRef, useState } from 'react';
import { Gem } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { getOperationalDateString } from '../utils/operationalDay.js';

export type DailyFragmentReceipt = {day:string;rawExp:number;fragments:number;balance:number;awarded:boolean};
export function DailyFragmentRewardLine({receipt}:{receipt:DailyFragmentReceipt}) {
 if(receipt.fragments===0)return null;
 return <div className="border border-white/10 px-2.5 py-2" style={{background:'linear-gradient(90deg,rgba(125,211,252,.10),rgba(15,16,19,.88) 42%)',color:'#fff'}} role="status">
   <div className="flex items-center gap-2.5">
     <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden border border-white/10 bg-black/30"><Gem className="h-5 w-5 text-sky-200" aria-hidden="true"/></div>
     <div><div className="text-[9px] font-black uppercase tracking-[.18em] text-sky-200">Fragmentos</div><div className="mt-1 text-sm font-black">+{receipt.fragments} recebidos</div><div className="mt-1 text-[11px] opacity-70">{receipt.rawExp} EXP crua neste dia</div></div>
   </div>
 </div>;
}
export function DailyFragmentReward({date}:{date:string}) {
 const {userProfile,claimDailyFragments}=useGame();
 const claim=useRef(claimDailyFragments);claim.current=claimDailyFragments;
 const [state,setState]=useState<{key:string;receipt:DailyFragmentReceipt|null;error:boolean}|null>(null);
 const [retry,setRetry]=useState(0);const key=`${userProfile.id}:${date}`;
 useEffect(()=>{
  let disposed=false;
  if(!userProfile.id||date>=getOperationalDateString())return;
  claim.current(date).then(receipt=>{if(!disposed)setState({key,receipt,error:false});}).catch(()=>{if(!disposed)setState({key,receipt:null,error:true});});
  return()=>{disposed=true;};
 },[key,date,userProfile.id,retry]);
 if(!state||state.key!==key)return null;
 if(state.error)return <div role="status" className="text-xs">Não foi possível conferir os fragmentos. <button className="underline min-h-11" onClick={()=>setRetry(n=>n+1)}>Tentar novamente</button></div>;
 return state.receipt?<DailyFragmentRewardLine receipt={state.receipt}/>:null;
}
