import React from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { OracleSpeakerMark, getOracleSpeakerToneTokens } from '../components/OracleSpeakerMark';
import { ORACLE_PUSH_COLORS, type OracleVisualTone } from '../supabase/functions/_shared/oracle-visual-tone';
const examples: Array<[OracleVisualTone,string,string]> = [
 ['neutral','Leitura e sabedoria','Seu estoque tem ações disponíveis. Você pode concluir direto, sem agendar.'],
 ['guide','Orientação e retorno','Bom te ver de volta. Seu planner e suas arenas estão aqui.'],
 ['success','Progresso confirmado','Leitura: 3/5. Faltam 2 para completar a meta.'],
];
// Visual experiment only: same silhouette as GameLogoIcon, without the central orb.
function SymbolPreview({ tone }: { tone: OracleVisualTone }) {
 const t = getOracleSpeakerToneTokens(tone);
 return <span aria-label="Símbolo do Oráculo" style={{display:'inline-flex', flexShrink:0, alignItems:'center',justifyContent:'center',width:44,height:44,borderRadius:'50%',border:`1px solid ${t.border}`,background:'#111216',color:t.core,boxShadow:`0 0 12px ${t.coreSoft}`}}>
  <svg width="28" height="28" viewBox="-5 -5 110 110" aria-hidden="true" style={{filter:`drop-shadow(0 0 3px ${t.glow})`}}>
   <path d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" fill="currentColor" />
   <path d="M50 15 L60 40 L85 50 L60 60 L50 85 L40 60 L15 50 L40 40 Z" fill="none" stroke="#111216" strokeOpacity=".3" strokeWidth="2" />
  </svg>
 </span>;
}
createRoot(document.getElementById('root')!).render(<main style={{maxWidth:1000,margin:'auto',padding:24,color:'#eee'}}>
 <h1 className="text-2xl font-bold">O símbolo ganha a cor</h1>
 <p className="my-4 text-sm text-white/60">Proposta visual: sem a bolinha central, com fundo escuro e brilho suave. Comparação no tamanho real do app.</p>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20}}>{examples.map(([tone,title,text])=>{
 const t=getOracleSpeakerToneTokens(tone);return <section key={tone} data-tone={tone}>
 <h2 className="mb-3 font-bold">{title}</h2>
 <div style={{display:'flex',gap:32,alignItems:'center',padding:'12px 0 24px'}}>
  <div><p className="mb-3 text-xs text-white/50">Atual</p><OracleSpeakerMark tone={tone} size="sm" pulse={false}/></div>
  <div><p className="mb-3 text-xs text-white/80">Proposta</p><SymbolPreview tone={tone}/></div>
 </div>
 <article style={{border:`1px solid ${t.border}`,background:`linear-gradient(135deg, ${t.coreSoft}, transparent 80%), #101013`,borderRadius:22,padding:16}}>
 <div className="mb-3 flex items-center gap-3"><SymbolPreview tone={tone}/><span className="text-xs">Oráculo</span></div><p className="text-sm leading-relaxed">{text}</p></article>
 </section>;
 })}</div></main>);
