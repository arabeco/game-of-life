import React, { useEffect, useRef, useState } from 'react';
import { Portal } from './Portal';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../supabaseClient';
import { ITEMS_DB, resolveItemDef } from '../constants/items';
import { validateGardenSnapshot, type GardenSnapshot } from '../views/zen3d/gardenAccount';
import { uploadGardenSand } from '../utils/gardenSand';
import type { UserProfile } from '../types';

/** The 3D document owns its CSS/WebGL; this shell owns account context and dismissal. */
export function Garden3DModal({ onClose, profile }: { onClose: () => void; profile?: UserProfile }) {
  const { userProfile, activeTheme, inventory, buyStoreItem } = useGame();
  const [state,setState]=useState<GardenSnapshot|null>(null),[ready,setReady]=useState(false),[error,setError]=useState('');
  const [owned,setOwned]=useState<string[]>([]);
  const [dirty,setDirty]=useState(false);
  const lastSaved=useRef('');
  const [retry,setRetry]=useState(0);
  const [purchase,setPurchase]=useState<string|null>(null),[buying,setBuying]=useState(false);
  const revision=useRef(0),saving=useRef(false);
  const ownerId=profile?.id||userProfile.id;
  const [closing, setClosing] = useState(false);
  /**
   * A VISITA COMECA PEQUENA.
   *
   * Cair direto em tela cheia no jardim de outra pessoa e entrar sem bater. O
   * cartao pequeno mostra de quem e e como esta, e "Entrar" e uma escolha — nao
   * o unico caminho. O jardim proprio continua abrindo inteiro: la nao ha o que
   * pedir licenca.
   */
  const [entrou, setEntrou] = useState(false);
  const [exitSaving,setExitSaving]=useState(false),[exitError,setExitError]=useState('');
  useEffect(()=>{if(!exitSaving)return;const timer=setTimeout(()=>{setExitSaving(false);setExitError('O salvamento demorou. Continue no jardim e tente novamente.');},35000);return()=>clearTimeout(timer);},[exitSaving]);
  const [loaded, setLoaded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const ownGarden = !profile || profile.id === userProfile.id;
  const telaCheia = ownGarden || entrou;
  const nomeDono = profile?.nickname || 'um amigo';
  const src = `${import.meta.env.BASE_URL}garden3d/index.html?skin=${encodeURIComponent(userProfile.skin || 'BASIC')}&theme=${activeTheme === 'LIGHT' ? 'light' : 'dark'}`;

  // Portal mounts its children after its first effect.
  const mountDialog = (node: HTMLDialogElement | null) => {
    dialog.current = node;
    if (node && !node.open) node.showModal();
  };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return () => { document.body.style.overflow=overflow;previous?.focus?.(); };
  }, []);

  useEffect(()=>{
    let stopped=false;
    setError('');
    const timer=setTimeout(()=>{if(!stopped)setError('O carregamento demorou. Confira a conexão e tente novamente.');},20000);
    // A LEITURA PASSA PELA RPC, e nao pelo select direto.
    //
    // `user_gardens_3d` so libera a linha do dono (`using(user_id=auth.uid())`),
    // entao um select direto no jardim de outra pessoa devolve zero linhas sem
    // erro — silencio, que e a pior resposta possivel. `load_garden_3d` decide no
    // servidor pela preferencia "Mostrar meu jardim" e devolve o documento, ou
    // NULL quando nao pode. O inventario so e buscado no jardim proprio: o do
    // amigo e bloqueado por RLS de qualquer jeito, e para VER nao e preciso —
    // a posse ja foi validada quando ele salvou.
    Promise.all([
      supabase.rpc('load_garden_3d',{p_owner:ownerId}),
      ownGarden?supabase.from('user_inventory').select('item_id').eq('user_id',ownerId):Promise.resolve({data:[],error:null}),
    ]).then(([garden,items]:any[])=>{
      const error=garden.error||items.error;
      if(stopped)return;
      clearTimeout(timer);
      if(error){setError('Não foi possível carregar o jardim. Tente novamente em instantes.');return;}
      const payload=garden.data as {state?:unknown;revision?:number}|null;
      if(payload?.state&&!validateGardenSnapshot(payload.state)){setError('O jardim salvo tem um formato inválido. Nenhum dado foi alterado.');return;}
      // Visita sem retorno: ou a pessoa fechou o jardim, ou nunca salvou um. As
      // duas respondem igual de proposito — distinguir contaria que existe um
      // jardim escondido ali.
      if(!ownGarden&&!payload?.state){setError('Este jardim não está aberto para visitas.');return;}
      setError('');
      setOwned(Array.from(new Set((items.data??[]).map((i:any)=>resolveItemDef(i.item_id)?.id??i.item_id))));
      lastSaved.current=payload?.state?JSON.stringify(payload.state):'';
      revision.current=payload?.revision??0;setState((payload?.state as GardenSnapshot)??null);setReady(true);
    }).catch(()=>{if(!stopped){clearTimeout(timer);setError('Não foi possível carregar o jardim. Tente novamente.');}});
    return()=>{stopped=true;clearTimeout(timer);};
  },[ownerId,retry]);
  const products=ITEMS_DB.filter(i=>i.category==='garden'&&i.costGold).map(i=>({id:i.id,name:i.name,price:i.costGold!}));
  const send=(data:unknown)=>frame.current?.contentWindow?.postMessage(data,location.origin);
  useEffect(()=>{if(!ready||!ownGarden)return;let cancelled=false;supabase.from('user_inventory').select('item_id').eq('user_id',ownerId).then(({data,error})=>{if(cancelled||error)return;const ids=Array.from(new Set((data??[]).map(i=>resolveItemDef(i.item_id)?.id??i.item_id)));setOwned(ids);send({type:'glyph-garden-inventory',owned:ids});});return()=>{cancelled=true;};},[inventory,ready,ownerId,ownGarden]);
  useEffect(() => {
    const requestExit = (event: MessageEvent) => {
      if(event.origin!==location.origin||event.source!==frame.current?.contentWindow)return;
      const d=event.data;
      if(d?.type==='glyph-garden-save-exit-result'&&exitSaving){setExitSaving(false);if(d.ok===true)onClose();else setExitError('Não foi possível concluir. Continue no jardim para conferir a mensagem e tentar novamente.');}
      if(d?.type==='glyph-garden-exit'){if(dirty)setClosing(true);else onClose();}
      if(d?.type==='glyph-garden-dirty')setDirty(d.dirty===true);
      if(d?.type==='glyph-garden-ready'&&ready){
        // Na visita a lista de artes vem do PROPRIO jardim salvo, nao do
        // inventario: o do amigo nao e legivel, e nao precisa ser — o servidor ja
        // conferiu a posse dele no momento em que ele salvou.
        const fonte=ownGarden?owned:Array.from(new Set((state?.artifacts??[]).map(a=>a.artifact)));
        const artifacts=fonte.map(id=>resolveItemDef(id)).filter(i=>i&&!i.isLegacyRetired&&!i.id.startsWith('item_garden_')&&['artifact','insignia','insignias'].includes(i.category)&&i.imageUrl).map(i=>({id:i!.id,name:i!.name,category:i!.category,file:new URL(i!.imageUrl!,location.href).href}));
        // No jardim proprio, arte reciclada ou removida nao pode continuar de pe;
        // na visita o documento e mostrado como esta, sem reescrever nada.
        const initial=state?(ownGarden?{...state,artifacts:state.artifacts.filter(a=>artifacts.some(i=>i.id===a.artifact))}:state):null;
        send({type:'glyph-garden-init',owned,artifacts,products,state:initial,readOnly:!ownGarden});
      }
      if(d?.type==='glyph-garden-buy'&&products.some(p=>p.id===d.id)&&!owned.includes(d.id))setPurchase(d.id);
      if(d?.type==='glyph-garden-save'&&ownGarden){
        if(saving.current){send({type:'glyph-garden-saved',id:d.id,error:'Um salvamento já está em andamento.'});return;}
        if(!validateGardenSnapshot(d.state)){send({type:'glyph-garden-saved',id:d.id,error:'Composição inválida. Nada foi salvo.'});return;}
        // O comparativo e contra o que o IFRAME mandou (data URL), nao contra o
        // que foi para o banco (URL). Sao formatos diferentes do mesmo desenho, e
        // guardar o de entrada e o que faz o atalho valer entre dois salvamentos
        // da mesma sessao — que e o caso que importa.
        const serialized=JSON.stringify(d.state);
        if(serialized===lastSaved.current){send({type:'glyph-garden-saved',id:d.id});return;}
        saving.current=true;
        // A areia vira ARQUIVO antes de o documento ir para o banco. O jsonb passa
        // a carregar duas URLs curtas no lugar de dois PNG em base64.
        uploadGardenSand(userProfile.id,d.state).then((estado)=>
          supabase.rpc('save_garden_3d',{p_state:estado,p_revision:revision.current})
        ).then(({data,error}:any)=>{
          saving.current=false;
          if(!error){revision.current=Number(data);lastSaved.current=serialized;}
          send({type:'glyph-garden-saved',id:d.id,error:error?(error.message.includes('garden_conflict')?'O jardim mudou em outra sessão. Reabra para carregar a versão atual.':'Não foi possível salvar. Confira a conexão e os itens desbloqueados.'):undefined});
        }).catch(()=>{
          saving.current=false;
          send({type:'glyph-garden-saved',id:d.id,error:'Não foi possível guardar o desenho da areia. Confira a conexão e tente de novo.'});
        });
      }
    };
    window.addEventListener('message', requestExit);
    return () => window.removeEventListener('message', requestExit);
  }, [ready,state,owned,ownGarden,dirty,onClose,exitSaving]);

  return <Portal><dialog ref={mountDialog} aria-label={ownGarden?'Jardim 3D':`Jardim de ${nomeDono}`} onCancel={e => { e.preventDefault(); if(exitSaving||buying)return; ownGarden&&dirty ? setClosing(true) : onClose(); }}
    style={telaCheia
      ? { position:'fixed',inset:0,width:'100%',maxWidth:'none',height:'100dvh',maxHeight:'none',margin:0,padding:0,border:0,background:'#090d12',color:'#e6edf5' }
      : { width:'min(92vw, 440px)',maxWidth:'none',height:'min(62vh, 480px)',maxHeight:'none',padding:0,border:'1px solid rgba(255,255,255,0.16)',borderRadius:20,overflow:'hidden',background:'#090d12',color:'#e6edf5' }}>
    <div inert={closing||!!purchase} style={{display:'flex',flexDirection:'column',height:'100%',paddingTop:telaCheia?'var(--safe-area-top, env(safe-area-inset-top, 0px))':0}}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
        {/* Na visita o cabecalho diz UMA coisa: de quem e o jardim. */}
        {ownGarden
          ? <div><b className="text-xs uppercase tracking-widest">Jardim 3D</b><p className="text-[10px] text-gray-400">{dirty?'Alterações não salvas':'Seu jardim · salve quando terminar'}</p></div>
          : <b className="truncate text-xs uppercase tracking-widest">Jardim de {nomeDono}</b>}
        {ownGarden
          ? <button className="min-h-11 rounded-xl border border-white/20 px-4 text-xs font-bold" onClick={() => dirty ? setClosing(true) : onClose()}>Voltar ao app</button>
          : <div className="flex shrink-0 gap-2">
              {!entrou&&ready&&!error&&<button className="luxe-skin-button min-h-11 rounded-xl px-4 text-xs font-bold" onClick={()=>setEntrou(true)}>Entrar</button>}
              <button className="min-h-11 rounded-xl border border-white/20 px-4 text-xs font-bold" onClick={()=>entrou?setEntrou(false):onClose()}>{entrou?'Voltar':'Sair'}</button>
            </div>}
      </header>
      {error?<div role="alert" className="p-6">{error}<button className="ml-3 min-h-11 rounded-lg border border-white/20 px-3" onClick={()=>setRetry(n=>n+1)}>Tentar novamente</button></div>:!ready?<p role="status" className="p-6">Carregando jardim…</p>:<>
        {!loaded && <p role="status" className="p-4 text-sm">Preparando o jardim…</p>}
        <iframe ref={frame} title={ownGarden?'Meu Jardim Zen 3D':'Jardim Zen 3D visitado'} src={src} onLoad={() => setLoaded(true)} style={{flex:1,width:'100%',minHeight:0,border:0}}/>
      </>}
    </div>
    {purchase && <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-5" role="alertdialog" aria-modal="true" aria-label="Comprar item do jardim"><div className="max-w-sm rounded-2xl border border-white/20 bg-gray-950 p-5"><h2>Comprar {products.find(p=>p.id===purchase)?.name}?</h2><p className="my-4 text-sm">Custo: {products.find(p=>p.id===purchase)?.price} ouro. O desbloqueio vai para seu inventário.</p><div className="flex gap-3"><button autoFocus disabled={buying} className="min-h-11 flex-1" onClick={()=>setPurchase(null)}>Cancelar</button><button disabled={buying} className="luxe-skin-button min-h-11 flex-1 rounded-xl" onClick={async()=>{setBuying(true);try{await buyStoreItem(purchase,'exclusive');setPurchase(null);}finally{setBuying(false);}}}>{buying?'Aguarde…':'Comprar'}</button></div></div></div>}
    {closing && <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-5" role="alertdialog" aria-modal="true" aria-labelledby="garden-exit-title">
      <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-gray-950 p-5">
        <h2 id="garden-exit-title" className="text-lg font-bold">Sair do jardim?</h2><p className="mt-3 text-sm text-gray-300">Você pode guardar o que fez antes de voltar ao app.</p>
        {exitError&&<p role="alert" className="mt-3 text-sm text-amber-200">{exitError}</p>}
        <button disabled={exitSaving} className="luxe-skin-button mt-5 min-h-11 w-full rounded-xl text-sm" onClick={()=>{setExitError('');setExitSaving(true);send({type:'glyph-garden-save-exit'});}}>{exitSaving?'Salvando…':'Salvar e sair'}</button>
        <div className="mt-3 flex gap-3"><button autoFocus disabled={exitSaving} className="min-h-11 flex-1 rounded-xl border border-white/20 text-sm" onClick={() => {setClosing(false);setExitError('');}}>Continuar aqui</button><button disabled={exitSaving} className="min-h-11 flex-1 rounded-xl text-sm text-gray-400" onClick={onClose}>Sair sem salvar</button></div>
      </div>
    </div>}
  </dialog></Portal>;
}
