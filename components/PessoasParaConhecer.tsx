import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useGame } from '../contexts/GameContext';
import { UserAvatar } from './UserAvatar';
import type { UserProfile } from '../types';
import { NOBILITY_RANKS } from '../constants/nobility';

export function AdicionarPessoa({id}:{id:string}) {
 const {userProfile,friends,friendRequestsIncoming,friendRequestsOutgoing,sendFriendRequest}=useGame();
 const [busy,setBusy]=useState(false);
 if(id===userProfile.id||friends.some(p=>p.id===id)||friendRequestsIncoming.some(r=>r.senderId===id))return null;
 const sent=friendRequestsOutgoing.some(r=>r.recipientId===id);
 return <button className="min-h-11 rounded-lg px-3 text-xs disabled:opacity-50" disabled={busy||sent} onClick={async()=>{if(busy)return;setBusy(true);try{await sendFriendRequest(id);}finally{setBusy(false);}}}>{sent?'Pedido enviado':busy?'Enviando…':'Adicionar'}</button>;
}

type Pessoa={id:string;nickname:string;avatar:string;borda:string;patente:string;motivo:string};
export function PessoasParaConhecer({onProfile}:{onProfile:(p:UserProfile)=>void}) {
 const {userProfile,modoEssencial,friends,friendRequestsIncoming,friendRequestsOutgoing}=useGame();
 const [people,setPeople]=useState<Pessoa[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const start=useRef<number|null>(null),generation=useRef(0);
 const refresh=async()=>{
  const current=++generation.current;setBusy(true);setError('');
  try{const {data,error}=await supabase.rpc('pessoas_para_conhecer',{p_limite:5});
   if(current!==generation.current)return;
   if(error){setError('Não foi possível buscar pessoas agora.');return;}setPeople(data||[]);
  }catch{if(current===generation.current)setError('Confira a conexão e tente novamente.');}
  finally{if(current===generation.current)setBusy(false);}
 };
 useEffect(()=>{void refresh();return()=>{generation.current++;};},[userProfile.id]);
 const hidden=new Set([...friends.map(p=>p.id),...friendRequestsIncoming.map(r=>r.senderId),...friendRequestsOutgoing.map(r=>r.recipientId)]);
 return <section aria-label="Pessoas para conhecer" className="space-y-2 py-3" onTouchStart={e=>{start.current=e.touches[0].clientY;}} onTouchEnd={e=>{if(start.current!==null&&e.changedTouches[0].clientY-start.current>70&&!busy)void refresh();start.current=null;}}>
  <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Pessoas para conhecer</h3><button className="min-h-11 px-3 text-xs" disabled={busy} onClick={()=>void refresh()}>{busy?'Buscando…':'Ver outras'}</button></div>
  {error&&<p role="status" className="text-xs">{error}</p>}
  {!busy&&!error&&people.filter(p=>!hidden.has(p.id)).length===0&&<p className="text-xs text-gray-400">Volte depois para conhecer mais pessoas.</p>}
  {people.filter(p=>!hidden.has(p.id)).map(p=><article key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-black/20 p-3">
   <UserAvatar avatarUrl={p.avatar} nickname={p.nickname} borderId={p.borda} showBorder={!modoEssencial} className="h-11 w-11"/>
   <div className="min-w-0 flex-1"><p className="truncate text-sm">{p.nickname}</p><p className="text-xs text-gray-400">{modoEssencial?`Patente ${Math.max(1,NOBILITY_RANKS.findIndex(r=>r.id===p.patente)+1)}`:NOBILITY_RANKS.find(r=>r.id===p.patente)?.name}</p><p className="text-xs">{p.motivo}</p></div>
   <div className="flex"><AdicionarPessoa id={p.id}/><button className="min-h-11 px-3 text-xs" onClick={()=>onProfile({id:p.id,nickname:p.nickname,avatarUrl:p.avatar,border:p.borda,nobility:{rankId:p.patente,exp:0}} as UserProfile)}>Ver perfil</button></div>
  </article>)}
 </section>;
}

/** Lê e grava só preferências; sem saldo ou outros campos do perfil. */
export function PreferenciasSociais() {
 const {userProfile}=useGame();
 const [prefs,setPrefs]=useState<{social_discoverable:boolean;garden_interactions_enabled:boolean}|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let cancelled=false;supabase.from('user_profiles').select('social_discoverable,garden_interactions_enabled,feats_visibility').eq('id',userProfile.id).single().then(({data,error})=>{if(cancelled)return;if(error){setError('Preferências sociais indisponíveis.');return;}setPrefs({social_discoverable:data.social_discoverable??data.feats_visibility==='all',garden_interactions_enabled:data.garden_interactions_enabled});});return()=>{cancelled=true;};},[userProfile.id]);
 const change=async(key:keyof NonNullable<typeof prefs>)=>{if(!prefs||busy)return;setBusy(true);setError('');const value=!prefs[key];try{const {error}=await supabase.from('user_profiles').update({[key]:value}).eq('id',userProfile.id);if(error)throw error;setPrefs({...prefs,[key]:value});}catch{setError('Não foi possível salvar. Tente novamente.');}finally{setBusy(false);}};
 return <div className="space-y-2">{error&&<p role="alert" className="text-xs">{error}</p>}{prefs&&(['social_discoverable','garden_interactions_enabled'] as const).map(key=><label key={key} className="flex min-h-11 items-center justify-between gap-3 text-xs"><span>{key==='social_discoverable'?'Aparecer em Pessoas para conhecer':'Permitir interações de visitantes'}</span><input type="checkbox" checked={prefs[key]} disabled={busy} onChange={()=>void change(key)}/></label>)}</div>;
}
