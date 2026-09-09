import { useEffect, useRef, useState } from 'react';
import SandExperiment from '../views/zen3d/SandExperiment';
import { GardenAccountContext, validateGardenSnapshot, type GardenAccount } from '../views/zen3d/gardenAccount';
import { setGardenArtifacts } from '../views/zen3d/artifactCatalog';

export function AccountGarden({skinId,theme}:{skinId:string;theme:'light'|'dark'}) {
  const [account,setAccount]=useState<GardenAccount|null>(null);
  const pending=useRef<{id:string;resolve:()=>void;reject:(e:Error)=>void;timer:number}|null>(null);
  useEffect(()=>{
    const send=(data:unknown)=>window.parent.postMessage(data,location.origin);
    const receive=(event:MessageEvent)=>{
      if(event.source!==window.parent||event.origin!==location.origin)return;
      const d=event.data;
      if(d?.type==='glyph-garden-init'&&Array.isArray(d.owned)&&Array.isArray(d.artifacts)&&(!d.state||validateGardenSnapshot(d.state))){
        setGardenArtifacts(d.artifacts);
        setAccount({owned:d.owned,initial:d.state,products:d.products??[],readOnly:d.readOnly===true,markDirty:dirty=>send({type:'glyph-garden-dirty',dirty}),buy:id=>send({type:'glyph-garden-buy',id}),save:state=>new Promise<void>((resolve,reject)=>{
          if(pending.current){reject(Error('Aguarde o salvamento atual.'));return;}
          const id=crypto.randomUUID();const timer=window.setTimeout(()=>{pending.current=null;reject(Error('Sem confirmação do servidor. Reabra o jardim antes de tentar novamente.'));},30000);
          pending.current={id,resolve,reject,timer};send({type:'glyph-garden-save',id,state});
        })});
      }
      if(d?.type==='glyph-garden-inventory'&&Array.isArray(d.owned)){setAccount(a=>a?{...a,owned:d.owned}:a);}
      if(d?.type==='glyph-garden-saved'&&pending.current?.id===d.id){const p=pending.current!;pending.current=null;clearTimeout(p.timer);d.error?p.reject(Error(d.error)):p.resolve();}
    };
    window.addEventListener('message',receive);send({type:'glyph-garden-ready'});
    return()=>{window.removeEventListener('message',receive);if(pending.current){clearTimeout(pending.current.timer);pending.current.reject(Error('Jardim fechado.'));pending.current=null;}};
  },[]);
  return account?<GardenAccountContext.Provider value={account}><SandExperiment skinId={skinId} theme={theme}/></GardenAccountContext.Provider>:<p style={{padding:24,color:'#ddd'}}>Carregando o jardim…</p>;
}
