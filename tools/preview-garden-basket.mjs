import { build } from 'esbuild';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
const out='output/garden-basket';mkdirSync(out,{recursive:true});
await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React,{useEffect,useRef,useState}from'react';import{createRoot}from'react-dom/client';
import{GardenBasketPanel}from'./components/GardenBasketPanel';
function App(){
 const frame=useRef(null),[open,setOpen]=useState(false),[pending,setPending]=useState([{id:'demo',created_at:'2026-10-17',score:10}]),[balance,setBalance]=useState(20),[claims,setClaims]=useState(0);
 const params=new URLSearchParams(location.search),visit=params.has('visit'),chest=params.has('chest'),failure=params.has('failure');
 const send=data=>frame.current?.contentWindow?.postMessage(data,location.origin);
 useEffect(()=>{const receive=e=>{if(e.source!==frame.current?.contentWindow||e.origin!==location.origin)return;
 if(e.data?.type==='glyph-garden-ready')send({type:'glyph-garden-init',owned:[],artifacts:[],products:[],state:null,readOnly:visit,basketEnabled:!visit,basketScore:pending.length?(chest?16:params.has('green')?7:10):null,previewHour:10});
 if(e.data?.type==='glyph-garden-open-basket'&&!visit)setOpen(true);
 };window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)},[pending,visit]);
 useEffect(()=>{send({type:'glyph-garden-basket',enabled:!visit,score:pending.length?(chest?16:params.has('green')?7:10):null})},[pending]);
 return <main style={{position:'fixed',inset:0,background:'#111',color:'white'}}>
 <iframe ref={frame} title="Jardim — demonstração" src="/garden3d/index.html?skin=BASIC" style={{width:'100%',height:'100%',border:0}}/>
 <output style={{position:'absolute',right:12,bottom:12,fontSize:11,background:'#111c',padding:8}}>DEMONSTRAÇÃO · Saldo: {balance} · Coletas: {claims}</output>
 {open&&!visit&&<GardenBasketPanel deliveries={pending} onClose={()=>setOpen(false)} onClaimed={id=>setPending(list=>list.filter(d=>d.id!==id))} claim={async()=>{await new Promise(resolve=>setTimeout(resolve,250));if(failure)throw Error('offline');setClaims(n=>n+1);setBalance(n=>n+(chest?0:10));return{awarded:true,fragments:chest?0:10,chest:chest?'Comum':null,balance:chest?20:30}}}/>}
 </main>
}createRoot(document.getElementById('root')).render(<App/>);
`},bundle:true,format:'iife',outfile:out+'/preview.cjs'});
const css=[...readFileSync('index.html','utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n')+'\n'+readdirSync('dist/assets').filter(f=>f.endsWith('.css')).map(f=>readFileSync('dist/assets/'+f,'utf8')).join('\n');
writeFileSync(out+'/index.html',`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cesta do jardim · demonstração</title><style>${css}</style><body><div id="root"></div><script src="preview.cjs"></script></body></html>`);
console.log('Preview: /output/garden-basket/index.html (local demonstration; no backend)');
