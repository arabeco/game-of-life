// Local fixture only: no sign-in, database, geolocation, upload or real account.
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../index.css';
import {GardenLegacyCapture,type GardenPlaqueImage} from '../components/GardenLegacyCapture';
import {templateObjects} from '../views/zen3d/gardenTemplates';
import type {GardenSnapshot} from '../views/zen3d/gardenAccount';
import type {Report,UserProfile} from '../types';
const profile={id:'garden-local-fixture',nickname:'AFONSO',username:'afonso',level:84,nobility:{rankId:'escudeiro'},legacyPlaqueColor:'vinho'} as UserProfile;
const reports=[{id:'fixture',cycleName:'Presença',startDate:'2026-09-01',endDate:'2026-09-07',performanceScore:88,metrics:{totalHours:12,actionsCompleted:24,weeklyAtlas:[{completedCount:24,days:[{date:'2026-09-01',completedCount:12},{date:'2026-09-02',completedCount:12}]}]}}] as Report[];
const boundaries:string[]=[];
function Check(){
  const frame=useRef<HTMLIFrameElement>(null),plaque=useRef<GardenPlaqueImage|undefined>(undefined);
  const [hour,setHour]=useState(12),[revision,setRevision]=useState(0),[report,setReport]=useState('Conta fictícia · sem banco'),[portrait,setPortrait]=useState(true);
  const state=useRef<GardenSnapshot>({version:1,base:'open',objects:templateObjects('open','rustic'),artifacts:[],sand:1,environment:'mist',atmosphere:'morning'});
  const imageReady=useCallback((image:GardenPlaqueImage)=>{plaque.current=image;frame.current?.contentWindow?.postMessage({type:'glyph-garden-legacy',plaque:image},location.origin);},[]);
  useEffect(()=>{
    const send=(data:unknown)=>frame.current?.contentWindow?.postMessage(data,location.origin);
    const receive=(e:MessageEvent)=>{
      if(e.origin!==location.origin||e.source!==frame.current?.contentWindow)return;
      if(e.data?.type==='glyph-garden-ready')send({type:'glyph-garden-init',state:state.current,owned:[],artifacts:[],products:[],previewHour:hour,legacyPlaque:plaque.current});
      if(e.data?.type==='glyph-garden-save'){state.current=e.data.state;setReport(`Salvo localmente · ${state.current.objects.length} peças · ${state.current.terrain?.shape}`);send({type:'glyph-garden-saved',id:e.data.id});}
    };
    window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);
  },[hour]);
  return <main style={{background:'#101623',minHeight:'100vh',color:'#ddd',fontFamily:'system-ui'}}>
    <div style={{padding:10,maxWidth:900,fontSize:12}}><b>{report}</b><div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>{[[0,'Madrugada'],[6.5,'Amanhecer'],[12,'Dia'],[17.5,'Entardecer'],[22,'Noite']].map(([h,name])=><button style={{padding:8,border:'1px solid #667',borderRadius:8}} key={h} onClick={()=>{setHour(Number(h));setRevision(r=>r+1);}}>{name}</button>)}<button style={{padding:8}} onClick={()=>setPortrait(v=>!v)}>Alternar largura</button><button style={{padding:8}} onClick={()=>setRevision(r=>r+1)}>Reabrir salvo</button></div></div>
    <iframe key={revision} ref={frame} title="Ilha de teste" src="/garden3d/index.html" style={{display:'block',width:portrait?'min(390px,100vw)':'100%',height:portrait?844:500,border:0}}/>
    <GardenLegacyCapture profile={profile} reports={reports} boundaries={boundaries} available onReady={imageReady}/>
  </main>;
}
createRoot(document.getElementById('world-check')!).render(<Check/>);
