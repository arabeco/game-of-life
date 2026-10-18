import {build} from 'esbuild';
import {mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
const out='output/garden-retomada';mkdirSync(out,{recursive:true});
await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React,{useState} from 'react';import{createRoot}from'react-dom/client';
import{GardenLayoutPanel}from'./views/zen3d/GardenLayoutPanel';import{GardenAccountContext}from'./views/zen3d/gardenAccount';
import{gardenMenuStyle}from'./views/zen3d/gardenMenuTheme';import{GARDEN_SIZES}from'./views/zen3d/gardenSizes';
import{DailyPanelBoard}from'./components/DailyPanelBoard';import{DailyFragmentRewardLine}from'./components/DailyFragmentReward';
import{GardenGuide}from'./views/zen3d/GardenGuide';import{GUIDE_PAGES}from'./views/zen3d/gardenGuideContent';
import './views/zen3d/glyphMenu.css';import './components/daily-board.css';
function App(){const[level,setLevel]=useState(0),[balance,setBalance]=useState(1000),[pending,setPending]=useState(null),[terrain,setTerrain]=useState({shape:'classic',size:'spacious'}),[help,setHelp]=useState(false);
 const account={owned:[],initial:null,products:[],expansionLevel:level,expansionsAvailable:true,buyExpansion:setPending,save:async()=>{},buy:()=>{}};
 return <main style={{padding:16,background:'#0b0f15',color:'white',minHeight:'100vh'}}><p style={{fontSize:12}}>DEMONSTRAÇÃO LOCAL · compras e saldo simulados</p>
 <div style={{display:'flex',gap:24,flexWrap:'wrap',alignItems:'start'}}>
 <section style={{width:390,maxWidth:'100%'}}><h1>Tamanhos do jardim</h1><p>Saldo de demonstração: {balance}</p><GardenAccountContext.Provider value={account}><div className="glyph-garden" style={gardenMenuStyle('BASIC','dark')}><GardenLayoutPanel base="open" terrain={terrain} onTerrain={setTerrain} onModel={()=>{}} disabled={false} environment="mist" onEnvironment={()=>{}} atmosphere="morning" onAtmosphere={()=>{}} timeLabel="Manhã"/>
 <p>Tamanho escolhido: {terrain.size}</p><button onClick={()=>setHelp(true)}>Ver guia</button>{help&&<GardenGuide pages={GUIDE_PAGES} news={false} onClose={()=>setHelp(false)}/>}</div></GardenAccountContext.Provider>
 {pending!==null&&<div role="dialog" aria-label="Compra simulada"><p>Comprar expansão {pending} por {GARDEN_SIZES.find(s=>s.level===pending)?.price} fragmentos?</p><button onClick={()=>{const price=GARDEN_SIZES.find(s=>s.level===pending).price;if(balance>=price){setBalance(b=>b-price);setLevel(pending);setPending(null);}}}>Confirmar compra simulada</button><button onClick={()=>setPending(null)}>Cancelar</button></div>}</section>
 <section style={{width:390,maxWidth:'100%'}}><DailyPanelBoard date="2026-10-16" dateLabel="16 de outubro" isToday={false} completed={4} total={4} xp={250} stats={[]} arenas={[]} reward={<DailyFragmentRewardLine receipt={{day:'2026-10-16',rawExp:250,fragments:5,balance:1005,awarded:true}}/>}/></section>
 </div></main>;
}createRoot(document.getElementById('root')).render(<App/>);
`},bundle:true,format:'iife',outfile:out+'/preview.cjs',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/contexts\/GameContext$/},()=>({path:'game',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const useGame=()=>({});',loader:'js'}));}}]});
const css=[...readFileSync('index.html','utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n')+'\n'+readdirSync('dist/assets').filter(f=>f.endsWith('.css')).map(f=>readFileSync('dist/assets/'+f,'utf8')).join('\n');
writeFileSync(out+'/index.html',`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/garden3d/"><title>Jardim e fragmentos · revisão</title><style>${css}</style><link rel="stylesheet" href="/output/garden-retomada/preview.css"><body style="margin:0"><div id="root"></div><script src="/output/garden-retomada/preview.cjs"></script></body></html>`);
console.log('Preview: /output/garden-retomada/index.html');
