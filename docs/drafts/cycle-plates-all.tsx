import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../../index.css';
import '../../components/legacy-ui.css';
import {MetalReportCard} from '../../components/MetalReportCard';
import './cycle-plates-all.css';

const ranks = ['E','D','C','B','A','S','SS'];
const finishes = ['Ferro','Aço azulado','Bronze','Prata fria','Ouro luminoso','Roxo e ouro','Rubi e ouro'];
const metrics = [{label:'Ações',value:'50/54'},{label:'Carga',value:'46h'},{label:'Metas',value:'6/9'},{label:'Presença',value:'7 dias'}];
const progress = {progress:83,time:71,progressValue:'50/60 · 83%',timeValue:'Faltam 2 dias'};
function App(){
  const [mode,setMode]=useState('Patamares');
  const [compact,setCompact]=useState(false);
  const [capture,setCapture]=useState('');
  const [captureStatus,setCaptureStatus]=useState('');
  async function checkCapture(){
    setCaptureStatus('Gerando PNG…');
    try {
      const el=document.getElementById(mode==='Patamares'?'plate-B':'plate-export')!;
      await Promise.all(Array.from(el.querySelectorAll('img')).map(img=>img.decode()));
      const {toPng}=await import('html-to-image');
      setCapture(await toPng(el,{pixelRatio:2,backgroundColor:'#080b0f',skipFonts:true}));
      setCaptureStatus('PNG gerado');
    }catch(error){setCaptureStatus(String(error));}
  }
  return <main className="plates-gallery">
    <header><p>GLYPH / COLEÇÃO DE CICLOS</p><h1>Um desenho. Sete patamares.</h1><p>Componente do app · dados ilustrativos</p></header>
    <nav aria-label="Visualização">{['Patamares','Cinco usos'].map(m=><button key={m} aria-pressed={mode===m} onClick={()=>setMode(m)}>{m}</button>)}<label><input type="checkbox" checked={compact} onChange={e=>setCompact(e.target.checked)}/> Compactos</label><button onClick={checkCapture}>Conferir PNG</button></nav><p role="status">{captureStatus}</p>{capture&&<figure className="capture-proof"><figcaption>PNG da placa renderizada</figcaption><img src={capture} alt="Placa exportada em PNG"/><button onClick={()=>setCapture('')}>Fechar PNG</button></figure>}
    {mode==='Patamares'?<section className={`plates-grid ${compact?'compact-grid':''}`}>
      {ranks.map((rank,i)=><article className="plate-sample" key={rank}><h2>{rank} · {finishes[i]}</h2><MetalReportCard rank={rank} score={[32,48,65,83,90,97,100][i]} title="Ciclo de maio" dateRange="26 MAI — 31 MAI" metrics={metrics} compact={compact} captureId={`plate-${rank}`}/></article>)}
    </section>:<section className="uses-grid">
      <article className="plate-sample narrow"><h2>1 · Ciclo ativo</h2><MetalReportCard rank="B" score={83} title="Ciclo de maio" subtitle="26 MAI — 31 MAI · 7 dias" compact dualProgress={progress} metrics={metrics}/></article>
      <article className="plate-sample narrow"><h2>2 · Histórico</h2><MetalReportCard rank="A" score={90} title="Ciclo de maio" subtitle="26 MAI — 31 MAI" compact metrics={metrics}/></article>
      <article className="plate-sample"><h2>3 · Encerramento</h2><MetalReportCard rank="SS" score={100} title="Ciclo de maio" dateRange="26 MAI — 31 MAI" metrics={metrics} badges={[{label:'Ouro',value:'+200'},{label:'Fragmentos',value:'+15'}]} captureId="plate-result"/></article>
      <article className="plate-sample narrow legacy-cycle-focus"><h2>4 · Cena do legado</h2><MetalReportCard rank="S" score={97} title="Um ciclo com nome longo para conferir a leitura" subtitle="26 MAI — 31 MAI" compact metrics={metrics}/></article>
      <article className="plate-sample export"><h2>5 · Exportação do legado</h2><MetalReportCard rank="B" score={83} title="Ciclo de maio" dateRange="26 MAI — 31 MAI" subtitle="Era I" summary="Uma semana de presença e construção." metrics={[{label:'Foco',value:'Saúde e desenvolvimento pessoal'},{label:'Ação-chave',value:'Leitura e prática diária'},{label:'Score',value:'83'},{label:'Era',value:'Era I'}]} badges={[{label:'Início',value:'26/05'},{label:'Fecho',value:'31/05'}]} captureId="plate-export"/></article>
    </section>}
  </main>
}
createRoot(document.getElementById('root')!).render(<App/>);
