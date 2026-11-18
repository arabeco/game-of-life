import React,{useCallback,useEffect,useRef,useState} from 'react';
import {supabase} from '../supabaseClient';
import {useGame} from '../contexts/GameContext';
import {ValorIcon} from './ValorIcon';
import {Fish,Mail,Sparkles} from 'lucide-react';
import {acaoDaMarca,confirmarInteracao,frasesDoJardim,motivoIndisponivel,type GardenMark,type VisitState,type VisitItem} from '../utils/visitasJardim';

const errors:Record<string,string>={INSUFFICIENT_FRAGMENTS:'Fragmentos insuficientes.',POND_REQUIRED:'Sem lago neste jardim.',DAILY_LIMIT:'Limite de hoje atingido.',NOTE_LIMIT:'Já deixou um recado hoje aqui.',INTERACTIONS_DISABLED:'O dono desativou as interações.',GARDEN_NOT_VISIBLE:'Este jardim não está aberto para visitas.'};
export function GardenVisitPanel({ownerId,ownGarden,entered,frameReady,onMarks,gardenFrame}:{ownerId:string;ownGarden:boolean;entered:boolean;frameReady:boolean;onMarks:(marks:GardenMark[])=>void;gardenFrame:React.RefObject<HTMLIFrameElement|null>}) {
 const {modoEssencial}=useGame();
 const [state,setState]=useState<VisitState|null>(null),[open,setOpen]=useState(false),[phrases,setPhrases]=useState(false),[history,setHistory]=useState(false);
 const [historyItems,setHistoryItems]=useState<GardenMark[]>([]),[more,setMore]=useState(false);
 const [armed,setArmed]=useState<{key:string;until:number}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const lock=useRef(false),panel=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null),pending=useRef<{key:string;id:string}|null>(null),alive=useRef(true);
 const onMarksRef=useRef(onMarks);onMarksRef.current=onMarks;
 const reload=useCallback(async()=>{
  const {data,error}=await supabase.rpc('marcas_do_jardim',{p_owner:ownerId});
  if(!alive.current)return;
  if(error)throw error;
  setState(data as VisitState);onMarksRef.current(data.marks);
  return data as VisitState;
 },[ownerId]);
 useEffect(()=>{alive.current=true;setState(null);void reload().catch(()=>{});const timer=setInterval(()=>{if(document.visibilityState==='visible')void reload().catch(()=>{});},60000);return()=>{alive.current=false;clearInterval(timer);};},[reload]);
 useEffect(()=>{if(state&&frameReady)onMarksRef.current(state.marks);},[state,frameReady]);
 useEffect(()=>{const outside=(event:MessageEvent)=>{if(event.origin===location.origin&&event.source===gardenFrame.current?.contentWindow&&event.data?.type==='glyph-garden-pointerdown'&&!lock.current){setOpen(false);setArmed(null);setPhrases(false);}};window.addEventListener('message',outside);return()=>window.removeEventListener('message',outside);},[gardenFrame]);
 useEffect(()=>{if(!armed)return;const timer=setTimeout(()=>setArmed(null),Math.max(0,armed.until-Date.now()));return()=>clearTimeout(timer);},[armed]);
 useEffect(()=>{if(!open)return;const outside=(e:PointerEvent)=>{if(!lock.current&&!panel.current?.contains(e.target as Node)){setOpen(false);setArmed(null);setPhrases(false);}};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!lock.current){e.preventDefault();e.stopPropagation();setOpen(false);setArmed(null);button.current?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape,true);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape,true);};},[open]);
 const act=async(item:VisitItem,phrase:number|null=null)=>{
  if(lock.current||!state||motivoIndisponivel(item,state))return;
  const key=`${item.id}:${phrase}`;
  if(!confirmarInteracao(armed,key,Date.now())){setArmed({key,until:Date.now()+2000});return;}
  lock.current=true;setBusy(true);setError('');setArmed(null);
  // Mantém a chave em erro de rede: repetir não cobra uma segunda vez.
  if(pending.current?.key!==key)pending.current={key,id:crypto.randomUUID()};
  try{
   const {data,error}=await supabase.rpc('deixar_marca_no_jardim',{p_owner:ownerId,p_kind:item.id,p_phrase_id:phrase,p_request_id:pending.current.id});
   if(error)throw error;
   pending.current=null;
   window.dispatchEvent(new Event('glyph:wallet-refresh'));
   const mark:GardenMark={...data.mark,visitor_name:'Você'};
   setState(s=>s?{...s,balance:data.balance,today:s.today+(data.repeated?0:1),noteToday:s.noteToday||item.id==='recado',marks:[mark,...s.marks.filter(m=>m.id!==mark.id)].slice(0,20)}:s);
   setOpen(false);setPhrases(false);button.current?.focus();
   void reload().catch(()=>{});
  }catch(e){const message=String((e as {message?:string})?.message||'');setError(Object.entries(errors).find(([code])=>message.includes(code))?.[1]||'Não recebemos a confirmação. Tente a mesma ação novamente.');void reload().catch(()=>{});}
  finally{lock.current=false;setBusy(false);}
 };
 const loadHistory=async(offset=0)=>{setBusy(true);setError('');try{const {data,error}=await supabase.rpc('historico_visitas_jardim',{p_offset:offset});if(error)throw error;setHistoryItems(items=>offset?[...items,...data]:data);setMore(data.length===50);setHistory(true);}catch{setError('Não foi possível carregar as visitas.');}finally{setBusy(false);}};
 const closeHistory=async()=>{if(!state)return;setBusy(true);setError('');try{const ids=(history?historyItems:state.history).filter(m=>!m.owner_seen_at).map(m=>m.id);for(let start=0;start<ids.length;start+=100){const {error}=await supabase.rpc('marcar_visitas_vistas',{p_ids:ids.slice(start,start+100)});if(error)throw error;}setState(s=>s?{...s,history:s.history.map(m=>ids.includes(m.id)?{...m,owner_seen_at:m.owner_seen_at||new Date().toISOString()}:m)}:s);setHistory(false);void reload().catch(()=>{});}catch{setError('Não foi possível marcar as visitas como vistas.');}finally{setBusy(false);}};
 const remove=async(id:string)=>{setBusy(true);setError('');try{const {error}=await supabase.rpc('remover_recado',{p_mark:id});if(error)throw error;await reload();if(history)await loadHistory();}catch{setError('Não foi possível remover o recado.');}finally{setBusy(false);}};
 if(!state||!frameReady||!entered)return null;
 const unseen=state.history.filter(m=>!m.owner_seen_at);
 if(ownGarden)return <div style={{position:'absolute',zIndex:6,left:12,top:'calc(var(--safe-area-top, 0px) + 70px)',maxWidth:'min(360px, calc(100% - 24px))'}}>
  {(unseen.length>0||history)?<section className="max-h-[55vh] overflow-y-auto rounded-2xl border border-white/20 bg-gray-950/95 p-4" aria-label="Visitas desde a última vez"><h2 className="text-sm font-semibold">{history?'Visitas ao jardim':'Visitas desde a última vez'}</h2>{(history?historyItems:unseen).map(m=><div key={m.id} className="mt-3 text-xs"><p>{m.visitor_name} {acaoDaMarca(m.kind)}</p><time>{new Date(m.created_at).toLocaleString('pt-BR')}</time>{m.kind==='recado'&&<p className="mt-1">{frasesDoJardim[(m.phrase_id||1)-1]}</p>}{m.kind==='recado'&&!m.removed_at&&<button disabled={busy} className="min-h-11" onClick={()=>void remove(m.id)}>Remover recado</button>}</div>)}{history&&more&&<button disabled={busy} className="min-h-11" onClick={()=>void loadHistory(historyItems.length)}>Ver visitas anteriores</button>}{error&&<p role="alert">{error}</p>}<button disabled={busy} className="min-h-11 mt-2" onClick={()=>void closeHistory()}>Fechar</button></section>:<button className="min-h-11 rounded-full bg-gray-950/85 px-4 text-xs" onClick={()=>void loadHistory()}>Visitas</button>}
 </div>;
 if(!state.enabled)return null;
 const note=state.catalog.find(i=>i.id==='recado');
 return <div ref={panel} style={{position:'absolute',zIndex:7,right:12,bottom:'calc(var(--safe-area-bottom, 0px) + 76px)',maxWidth:'calc(100% - 24px)'}}>
  {open&&<section aria-label="Interações no jardim" className="mb-2 w-[350px] max-w-full rounded-2xl border border-white/20 bg-gray-950/95 p-3 shadow-xl" style={{animation:modoEssencial?'none':'garden-visit-open 150ms ease-out'}}>
   <p className="mb-2 flex items-center gap-1 text-sm">Saldo: {state.balance} <ValorIcon valor="fragmento"/></p>
   {phrases&&note?<><button disabled={busy} className="min-h-11 text-xs" onClick={()=>{setPhrases(false);setArmed(null);}}>Voltar às interações</button><div className="max-h-[42vh] overflow-y-auto">{frasesDoJardim.map((phrase,index)=><button key={phrase} disabled={busy||!!motivoIndisponivel(note,state)} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-2 text-left text-xs hover:bg-white/10 disabled:opacity-40" onClick={()=>void act(note,index+1)}><span>{phrase}</span><span>{armed?.key===`recado:${index+1}`?'Confirmar · ':''}{note.custo} <ValorIcon valor="fragmento" className="inline"/></span></button>)}</div></>:state.catalog.filter(i=>i.ativo).map(item=>{const reason=motivoIndisponivel(item,state);return <div key={item.id} className={`flex items-center gap-2 py-2 ${reason?'opacity-40':''}`}><span aria-hidden>{item.id==='recado'?<Mail size={16}/>:item.id==='peixes'?<Fish size={16}/>:<Sparkles size={16}/>}</span><div className="flex-1 text-xs">{item.nome}{reason&&<p className="mt-1 text-[10px]">{reason}</p>}</div><span className="flex items-center gap-1 text-xs">{item.custo}<ValorIcon valor="fragmento"/></span><button disabled={busy||!!reason} className="min-h-11 w-24 shrink-0 rounded-lg bg-white/10 px-2 text-xs" onClick={()=>item.id==='recado'?(setPhrases(true),setArmed(null)):void act(item)}>{armed?.key===`${item.id}:null`?`Confirmar · ${item.custo}`:item.id==='recado'?'Deixar':item.id==='peixes'?'Alimentar':'Soltar'}</button></div>;})}
   {error&&<p role="alert" className="mt-2 text-xs text-amber-200">{error}</p>}
  </section>}
  <button ref={button} aria-label="Interagir" aria-expanded={open} disabled={busy} className="ml-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-gray-950/90 text-xl" onClick={()=>{setOpen(v=>!v);setPhrases(false);setArmed(null);if(!open)void reload().catch(()=>{});}}>✦</button>
  <style>{'@keyframes garden-visit-open{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}'}</style>
 </div>;
}
