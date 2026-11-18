// Dados fictícios; todas as RPCs desta bancada são substituídas antes de montar.
import '../index.css';
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {GameContext} from '../contexts/GameContext';
import {supabase} from '../supabaseClient';
import {GardenVisitPanel} from '../components/GardenVisitPanel';
import {PessoasParaConhecer} from '../components/PessoasParaConhecer';
import type {GardenMark,VisitState} from '../utils/visitasJardim';
const state:VisitState={marks:[],history:[],balance:10,pond:true,today:0,noteToday:false,enabled:true,catalog:[
 {id:'recado',nome:'Deixar um recado',custo:1,requisito:null,duracao:168,ativo:true},
 {id:'peixes',nome:'Alimentar os peixes',custo:2,requisito:'garden_base_pond',duracao:24,ativo:true},
 {id:'borboleta',nome:'Soltar uma borboleta',custo:3,requisito:null,duracao:24,ativo:true}]};
(supabase as any).rpc=async(name:string,args:any)=>{
 if(name==='pessoas_para_conhecer')return {data:['Luna','Kael','Aurora'].map((nickname,i)=>({id:String(i),nickname,avatar:'',borda:'default',patente:'cavaleiro',motivo:['Tem uma arena parecida com a sua','Vocês têm amigos em comum','Curtiu 3 feitos seus'][i]})),error:null};
 if(name==='deixar_marca_no_jardim'){
  const item=state.catalog.find(i=>i.id===args.p_kind)!;
  state.balance-=item.custo;state.today++;state.noteToday||=item.id==='recado';
  const mark={id:crypto.randomUUID(),kind:item.id,phrase_id:args.p_phrase_id,visitor_name:'Você',created_at:new Date().toISOString(),expires_at:new Date(Date.now()+item.duracao*3600000).toISOString()};state.marks.unshift(mark);
  return {data:{balance:state.balance,mark},error:null};
 }
 return {data:structuredClone(state),error:null};
};
function App(){
 const [essential,setEssential]=useState(false),[outgoing,setOutgoing]=useState<any[]>([]),[ready,setReady]=useState(false),[tab,setTab]=useState('garden'),[entered,setEntered]=useState(false);
 const frame=useRef<HTMLIFrameElement>(null),marks=useRef<GardenMark[]>([]);
 const sendMarks=(list:GardenMark[])=>{marks.current=list;frame.current?.contentWindow?.postMessage({type:'glyph-garden-visit-marks',marks:list,essential},location.origin);};
 useEffect(()=>{sendMarks(marks.current);},[essential]);
 useEffect(()=>{const receive=(e:MessageEvent)=>{if(e.source!==frame.current?.contentWindow||e.origin!==location.origin||e.data?.type!=='glyph-garden-ready')return;frame.current.contentWindow?.postMessage({type:'glyph-garden-init',owned:[],artifacts:[],products:[],readOnly:true,state:{version:1,base:'pond',objects:[{id:'lake',type:'pond',position:[3,0,-.3],rotation:0,variant:1}],artifacts:[],sand:0,environment:'cloister',atmosphere:'morning'}},location.origin);setReady(true);sendMarks(marks.current);};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);},[tab]);
 return <GameContext.Provider value={{modoEssencial:essential,userProfile:{id:'me'},friends:[],friendRequestsIncoming:[],friendRequestsOutgoing:outgoing,sendFriendRequest:async(id:string)=>setOutgoing(s=>[...s,{recipientId:id}])} as any}>
 <main style={{width:390,maxWidth:'100vw',height:'100dvh',margin:'auto',color:'white',position:'relative',background:'#111827'}}><header style={{height:60,display:'flex',alignItems:'center',gap:16,padding:8}}><button onClick={()=>setTab(tab==='garden'?'social':'garden')}>{tab==='garden'?'Pessoas':'Jardim'}</button><label><input type="checkbox" checked={essential} onChange={e=>setEssential(e.target.checked)}/> Essencial</label></header>
 {tab==='garden'?<div style={{position:'relative',height:'calc(100% - 60px)'}}><button style={{position:"absolute",zIndex:10,top:12,right:12,padding:12,background:"#111827",borderRadius:20}} onClick={()=>{setEntered(!entered);frame.current?.contentWindow?.postMessage({type:"glyph-garden-visit-mode",entered:!entered},location.origin);}}>{entered?"Voltar à prévia":"Entrar"}</button><iframe ref={frame} title="Jardim fictício" src="/garden3d/index.html" style={{height:'100%',width:'100%',border:0}}/><GardenVisitPanel ownerId="owner" ownGarden={false} entered={entered} frameReady={ready} onMarks={sendMarks} gardenFrame={frame}/></div>:<PessoasParaConhecer onProfile={()=>{}}/>}</main>
 </GameContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<App/>);
