import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../../index.css';
import '../../components/legacy-ui.css';
import {MetalReportCard} from '../../components/MetalReportCard';
import './cycle-plates-all.css';

const ranks = ['E','D','C','B','A','S','SS','SSS'];
const finishes = ['Ferro','Aço azulado','Bronze','Prata fria','Ouro luminoso','Roxo e ouro','Rubi e ouro','Pedra da lua'];
const metrics = [{label:'Ações',value:'50/54'},{label:'Carga',value:'46h'},{label:'Metas',value:'6/9'},{label:'Presença',value:'7 dias'}];
const sssMetrics = [{label:'Ações',value:'120/120'},{label:'Carga',value:'200h'},{label:'Metas',value:'8/8'},{label:'Presença',value:'28 dias'}];
const sssContrastVariants = [
  {id:'ss',name:'1 · SS atual',detail:'Gradiente do SS com contorno castanho fino.'},
  {id:'stone',name:'1B · Pedra mais azul',detail:'Fonte da 1 com dourado um pouco mais escuro sobre a nova pedra azul.'},
  {id:'bronze',name:'2 · Bronze firme',detail:'SSS dourado; título e números com bronze escuro e faixa clara.'},
  {id:'jewel',name:'8 · Marfim e petróleo',detail:'Frente platinum, lateral azul-petróleo e reflexo champagne fino.'},
  {id:'platinum',name:'3 · Prata / platinum',detail:'Centro claro, bordas grafite-prata e reflexo branco frio.'},
  {id:'mineral',name:'4 · Azul mineral escuro',detail:'Teal profundo com brilho petróleo e contorno escuro.'},
  {id:'cold-bronze',name:'5 · Bronze frio',detail:'Bronze acinzentado, mais sóbrio e menos amarelo.'},
  {id:'graphite',name:'6 · Grafite metálico',detail:'Metal escuro com highlights prateados.'},
  {id:'champagne',name:'7 · Champagne frio',detail:'Prata quente com um toque bege e bordas mais fundas.'},
];
const goldTextVariants = [
  {id:'emboss',name:'E · Ouro em relevo',detail:'Centro claro com lateral bronze mais marcada.'},
  {id:'calm',name:'F · Ouro com contorno firme',detail:'Pedra mais calma, centro claro e contorno escuro nos textos menores.'},
  {id:'base',name:'1B · Atual',detail:'Referência: texto da 1B sem novo tratamento.'},
  {id:'ivory',name:'A · Ouro marfim',detail:'Centro marfim amplo e contorno castanho escuro.'},
  {id:'facets',name:'B · Ouro lapidado',detail:'Facetas douradas com luz clara no centro.'},
  {id:'deep',name:'C · Ouro profundo',detail:'Base mais escura com faixa clara estreita.'},
  {id:'champagne',name:'D · Champagne dourado',detail:'Ouro frio, centro perolado e borda escura.'},
];
const progress = {progress:83,time:71,progressValue:'50/60 · 83%',timeValue:'Faltam 2 dias'};
function App(){
  const [mode,setMode]=useState(window.location.hash==='#textos-1b'?'Textos 1B':window.location.hash==='#contraste-sss'?'Contraste SSS':'Patamares');
  const [compact,setCompact]=useState(['#contraste-sss','#textos-1b'].includes(window.location.hash));
  const [capture,setCapture]=useState('');
  const [captureStatus,setCaptureStatus]=useState('');
  async function checkCapture(){
    setCaptureStatus('Gerando PNG…');
    try {
      const el=document.getElementById(mode==='Patamares'?'plate-B':mode==='Contraste SSS'?'plate-contrast-ss':mode==='Textos 1B'?'plate-gold-base':'plate-export')!;
      await Promise.all(Array.from(el.querySelectorAll('img')).map(img=>img.decode()));
      const {toPng}=await import('html-to-image');
      setCapture(await toPng(el,{pixelRatio:2,backgroundColor:'#080b0f',skipFonts:true}));
      setCaptureStatus('PNG gerado');
    }catch(error){setCaptureStatus(String(error));}
  }
  return <main className="plates-gallery">
    <header><p>GLYPH / COLEÇÃO DE CICLOS</p><h1>{mode==='Contraste SSS'?'Oito acabamentos e uma pedra mais azul.':mode==='Textos 1B'?'Ouro sobre a pedra azul.':'Um desenho. Oito patamares.'}</h1><p>Componente do app · dados ilustrativos</p></header>
    <nav aria-label="Visualização">{['Patamares','Contraste SSS','Textos 1B','Cinco usos'].map(m=><button key={m} aria-pressed={mode===m} onClick={()=>{setMode(m);if(m==='Contraste SSS'||m==='Textos 1B')setCompact(true)}}>{m}</button>)}<label><input type="checkbox" checked={compact} onChange={e=>setCompact(e.target.checked)}/> Compactos</label><button onClick={checkCapture}>Conferir PNG</button></nav><p role="status">{captureStatus}</p>{capture&&<figure className="capture-proof"><figcaption>PNG da placa renderizada</figcaption><img src={capture} alt="Placa exportada em PNG"/><button onClick={()=>setCapture('')}>Fechar PNG</button></figure>}
    {mode==='Patamares'?<section className={`plates-grid ${compact?'compact-grid':''}`}>
      {ranks.map((rank,i)=><article className="plate-sample" key={rank}><h2>{rank} · {finishes[i]}</h2><MetalReportCard rank={rank} score={[32,48,65,83,90,97,99,100][i]} title="Ciclo de maio" dateRange={i>=6?'01 MAI — 28 MAI':i===5?'01 MAI — 14 MAI':'26 MAI — 31 MAI'} metrics={rank==='SSS'?sssMetrics:rank==='SS'?[{label:'Ações',value:'114/120'},{label:'Carga',value:'180h'},{label:'Metas',value:'7/8'},{label:'Presença',value:'27 dias'}]:rank==='S'?[{label:'Ações',value:'57/60'},{label:'Carga',value:'60h'},{label:'Metas',value:'5/6'},{label:'Presença',value:'13 dias'}]:metrics} compact={compact} captureId={`plate-${rank}`}/></article>)}
    </section>:mode==='Contraste SSS'?<section className="contrast-study">
      <p className="contrast-study__intro">A opção 1B usa a fonte da 1 sobre uma pedra mais azul, com o texto inferior um pouco mais escuro para comparar a leitura.</p>
      <div className={`plates-grid contrast-grid ${compact?'compact-grid':''}`}>
        {sssContrastVariants.map(variant=><article className="plate-sample" key={variant.id}><h2>{variant.name}</h2><MetalReportCard rank="SSS" score={100} title="Ciclo de maio" dateRange="01 MAI — 28 MAI" metrics={sssMetrics} compact={compact} className={`sss-contrast-ss sss-contrast-ss-${variant.id}`} sssTextureSrc={variant.id==='stone'?'./sss-blue-study.png':undefined} captureId={`plate-contrast-${variant.id}`}/><p className="contrast-study__detail">{variant.detail}</p></article>)}
      </div>
      <div className="contrast-reference"><h2>Referências da coleção</h2><div className="contrast-reference__plates">
        <article className="plate-sample"><h2>S</h2><MetalReportCard rank="S" score={97} title="Ciclo de maio" dateRange="01 MAI — 14 MAI" metrics={metrics} compact/></article>
        <article className="plate-sample"><h2>SS</h2><MetalReportCard rank="SS" score={99} title="Ciclo de maio" dateRange="01 MAI — 28 MAI" metrics={metrics} compact/></article>
      </div></div>
    </section>:mode==='Textos 1B'?<section className="contrast-study">
      <p className="contrast-study__intro">Compare E e F primeiro. O F combina uma pedra azul mais calma com contorno mais definido nos números e no título. As opções anteriores continuam abaixo.</p>
      <div className={`plates-grid contrast-grid ${compact?'compact-grid':''}`}>
        {goldTextVariants.map(variant=><article className="plate-sample" key={variant.id}><h2>{variant.name}</h2><MetalReportCard rank="SSS" score={100} title="Ciclo de maio" dateRange="01 MAI — 28 MAI" metrics={sssMetrics} compact={compact} className={`sss-contrast-ss sss-contrast-ss-stone ${variant.id==='base'?'':`sss-gold-study sss-gold-study-${variant.id}`}`} sssTextureSrc={variant.id==='calm'?'./sss-blue-calm-study.png':'./sss-blue-study.png'} captureId={`plate-gold-${variant.id}`}/><p className="contrast-study__detail">{variant.detail}</p></article>)}
      </div>
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
