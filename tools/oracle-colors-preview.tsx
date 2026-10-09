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
createRoot(document.getElementById('root')!).render(<main style={{maxWidth:1000,margin:'auto',padding:24,color:'#eee'}}>
 <h1 className="text-2xl font-bold">Oráculo: cor sem imagem</h1>
 <p className="my-4 text-sm text-white/60">Marca real do app. Textos ilustrativos. O push abaixo é uma simulação: o Android controla o fundo.</p>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20}}>{examples.map(([tone,title,text])=>{
 const t=getOracleSpeakerToneTokens(tone);return <section key={tone} data-tone={tone}>
 <h2 className="mb-3 font-bold">{title}</h2>
 <article style={{border:`1px solid ${t.border}`,background:`linear-gradient(135deg, ${t.coreSoft}, transparent 80%), #101013`,borderRadius:22,padding:16}}>
 <div className="mb-3 flex items-center gap-3"><OracleSpeakerMark tone={tone} size="sm" pulse={false}/><span className="text-xs">Oráculo</span></div><p className="text-sm leading-relaxed">{text}</p></article>
 {[false,true].map(dark=><article key={String(dark)} style={{marginTop:16,padding:16,borderRadius:22,background:dark?'#252528':'#f0eff5',color:dark?'#fafafa':'#18181b'}}>
 <div style={{fontSize:12,color:ORACLE_PUSH_COLORS[tone]}}>◆ Glyph · agora</div><h3 style={{marginTop:8,fontWeight:700}}>Oráculo</h3><p style={{fontSize:14}}>{text}</p></article>)}
 </section>;
 })}</div></main>);
