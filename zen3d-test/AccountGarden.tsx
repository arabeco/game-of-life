import { useEffect, useRef, useState } from 'react';
import SandExperiment from '../views/zen3d/SandExperiment';
import { GardenAccountContext, validateGardenSnapshot, validGardenPlaque, type GardenAccount } from '../views/zen3d/gardenAccount';
import { setGardenArtifacts } from '../views/zen3d/artifactCatalog';
import {frasesDoJardim,acaoDaMarca,type GardenMark} from '../utils/visitasJardim';

export function AccountGarden({skinId,theme}:{skinId:string;theme:'light'|'dark'}) {
  const [account,setAccount]=useState<GardenAccount|null>(null);
  const [marks,setMarks]=useState<GardenMark[]>([]),[essential,setEssential]=useState(false),[selected,setSelected]=useState<GardenMark|null>(null);
  const pending=useRef<{id:string;resolve:()=>void;reject:(e:Error)=>void;timer:number}|null>(null);
  useEffect(()=>{
    const send=(data:unknown)=>window.parent.postMessage(data,location.origin);
    const receive=(event:MessageEvent)=>{
      if(event.source!==window.parent||event.origin!==location.origin)return;
      const d=event.data;
      if(d?.type==='glyph-garden-visit-mode')setAccount(a=>a&&a.readOnly?{...a,visitEntered:d.entered===true}:a);
      if(d?.type==='glyph-garden-visit-marks'&&Array.isArray(d.marks)){
        setMarks(d.marks.slice(0,20).filter((m:GardenMark)=>m&&typeof m.id==='string'&&['recado','peixes','borboleta'].includes(m.kind)&&typeof m.visitor_name==='string'&&Number.isFinite(Date.parse(m.expires_at||''))));setEssential(d.essential===true);
      }
      if(d?.type==='glyph-garden-init'&&Array.isArray(d.owned)&&Array.isArray(d.artifacts)&&(!d.state||validateGardenSnapshot(d.state))){
        setGardenArtifacts(d.artifacts);
        setAccount({basket:d.readOnly!==true&&d.basketEnabled===true?{score:typeof d.basketScore==='number'?d.basketScore:null,open:()=>send({type:'glyph-garden-open-basket'})}:undefined,legacyPlaque:validGardenPlaque(d.legacyPlaque)?d.legacyPlaque:undefined,previewHour:['127.0.0.1','localhost'].includes(location.hostname)&&typeof d.previewHour==='number'&&Number.isFinite(d.previewHour)?d.previewHour:undefined,owned:d.owned,initial:d.state,products:d.products??[],readOnly:d.readOnly===true,markDirty:dirty=>send({type:'glyph-garden-dirty',dirty}),buy:id=>send({type:'glyph-garden-buy',id}),save:state=>new Promise<void>((resolve,reject)=>{
          if(pending.current){reject(Error('Aguarde o salvamento atual.'));return;}
          const id=crypto.randomUUID();const timer=window.setTimeout(()=>{pending.current=null;reject(Error('Sem confirmação do servidor. Reabra o jardim antes de tentar novamente.'));},30000);
          pending.current={id,resolve,reject,timer};send({type:'glyph-garden-save',id,state});
        })});
      }
      if(d?.type==='glyph-garden-expansions')setAccount(a=>a?{...a,expansionLevel:Number.isInteger(d.level)&&d.level>=0&&d.level<=7?d.level:0,expansionsAvailable:!a.readOnly&&d.available===true,buyExpansion:level=>send({type:'glyph-garden-buy-expansion',level})}:a);
      if(d?.type==='glyph-garden-basket')setAccount(a=>a?{...a,basket:!a.readOnly&&d.enabled===true?{score:typeof d.score==='number'?d.score:null,open:()=>send({type:'glyph-garden-open-basket'})}:undefined}:a);
      if(d?.type==='glyph-garden-legacy'&&validGardenPlaque(d.plaque))setAccount(a=>a?{...a,legacyPlaque:d.plaque}:a);
      if(d?.type==='glyph-garden-inventory'&&Array.isArray(d.owned)){setAccount(a=>a?{...a,owned:d.owned}:a);}
      if(d?.type==='glyph-garden-saved'&&pending.current?.id===d.id){const p=pending.current!;pending.current=null;clearTimeout(p.timer);d.error?p.reject(Error(d.error)):p.resolve();}
    };
    const pointerDown=()=>send({type:'glyph-garden-pointerdown'});
    window.addEventListener('pointerdown',pointerDown);
    window.addEventListener('message',receive);send({type:'glyph-garden-ready'});
    return()=>{window.removeEventListener('pointerdown',pointerDown);window.removeEventListener('message',receive);if(pending.current){clearTimeout(pending.current.timer);pending.current.reject(Error('Jardim fechado.'));pending.current=null;}};
  },[]);
  return account?<GardenAccountContext.Provider value={{...account,visitMarks:marks,essential,inspectVisitMark:setSelected}}><SandExperiment skinId={skinId} theme={theme}/>{selected&&<div role="status" style={{position:'fixed',zIndex:50,left:16,bottom:90,maxWidth:300,padding:16,borderRadius:16,background:'#101923',color:'#fff',fontSize:14}}><p>{selected.visitor_name} {acaoDaMarca(selected.kind)}.</p>{selected.kind==='recado'&&<p>{frasesDoJardim[(selected.phrase_id||1)-1]}</p>}<button style={{minHeight:44}} onClick={()=>setSelected(null)}>Fechar</button></div>}</GardenAccountContext.Provider>:<p style={{padding:24,color:'#ddd'}}>Carregando o jardim…</p>;
}
