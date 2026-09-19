// Dev-only entry, deliberately excluded from the main app and production garden build.
import type { GardenSnapshot } from '../views/zen3d/gardenAccount';
import { templateObjects } from '../views/zen3d/gardenTemplates';
const frame=document.querySelector<HTMLIFrameElement>('#garden')!;
const report=document.querySelector('#report')!;
let state:GardenSnapshot|null=null,saves=0,fail=false;
const params=new URLSearchParams(location.search);
if(params.has('legacy')){
  const texture=(height:boolean)=>{
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle=height?'#808080':'#d9cdb0';ctx.fillRect(0,0,512,1024);
    ctx.strokeStyle=height?'#333333':'#70604d';ctx.lineWidth=4;
    for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(300,600,35+i*9,0,Math.PI*2);ctx.stroke();}
    return canvas.toDataURL('image/png');
  };
  state={version:1,base:'open',objects:templateObjects('open','rustic'),artifacts:[],sand:1,environment:'mist',atmosphere:'morning',drawing:{color:texture(false),height:texture(true)}};
}
const hash=(text:string)=>{let h=0;for(let i=0;i<text.length;i++)h=(h*31+text.charCodeAt(i))|0;return h;};
const post=(data:unknown)=>frame.contentWindow?.postMessage(data,location.origin);
document.querySelector('#fail')!.addEventListener('click',()=>{fail=true;});
const reopen=()=>{frame.src=`${params.has('embedded')?'/garden3d/index.html':'./index.html'}?skin=GOLD&test=${Date.now()}`;};
document.querySelector('#reopen')!.addEventListener('click',reopen);
window.addEventListener('message',e=>{
  if(e.source!==frame.contentWindow||e.origin!==location.origin)return;
  if(e.data?.type==='glyph-garden-ready')post({type:'glyph-garden-init',state,owned:['garden_kit_luxury','item_artifact_1_001'],artifacts:[{id:'item_artifact_1_001',name:'Adaga Aprendiz',file:'artefato_t1_adagaaprendiz.png'}],products:[{id:'garden_kit_genesis',name:'Gênesis',price:500},{id:'garden_base_pond',name:'Lago',price:340},{id:'garden_base_river',name:'Rio',price:500},{id:'garden_base_path',name:'Caminho',price:380}]});
  if(e.data?.type==='glyph-garden-save'){
    if(fail){fail=false;post({type:'glyph-garden-saved',id:e.data.id,error:'Falha simulada: tente novamente.'});return;}
    state=e.data.state;saves++;
    report.textContent=JSON.stringify({saves,base:state!.base,terrain:state!.terrain,drawingBounds:state!.drawingBounds,objects:state!.objects.length,artifacts:state!.artifacts.length,bytes:JSON.stringify(state).length,layout:hash(JSON.stringify(state!.objects)),color:hash(state!.drawing!.color),height:hash(state!.drawing!.height)});
    post({type:'glyph-garden-saved',id:e.data.id});
  }
});
reopen();
