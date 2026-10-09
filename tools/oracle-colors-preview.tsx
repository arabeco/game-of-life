import React from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { OracleSpeakerMark, getOracleSpeakerToneTokens } from '../components/OracleSpeakerMark';
import { ORACLE_PUSH_COLORS, type OracleVisualTone } from '../supabase/functions/_shared/oracle-visual-tone';

// A regua aprovada em 09/10/2026, com a marca real do app (o simbolo aceso na
// cor do tom, sem a bolinha do centro). O vermelho existe e fica reservado.
const examples: Array<[OracleVisualTone, string, string]> = [
  ['neutral', 'Informação neutra', 'Seu ciclo está em 40%. Faltam 8 dias.'],
  ['guide', 'Orientação e retorno', 'Bom te ver de volta. Escolha por onde continuar.'],
  ['success', 'Avanço em andamento', 'Leitura: 3/5. Faltam 2 para completar a meta.'],
  ['achievement', 'Conquista completa', 'Missão «Treino»: 10/10. Meta cumprida.'],
];

createRoot(document.getElementById('root')!).render(
  <main style={{ maxWidth: 1000, margin: 'auto', padding: 24, color: '#eee' }}>
    <h1 className="text-2xl font-bold">As cores do Oráculo</h1>
    <p className="my-4 text-sm text-white/60">Branco informa, azul orienta, verde é avanço em andamento, dourado é conquista. O quadradinho é a cor de destaque do push no Android.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
      {examples.map(([tone, title, text]) => {
        const t = getOracleSpeakerToneTokens(tone);
        return (
          <section key={tone} data-tone={tone}>
            <h2 className="mb-3 flex items-center gap-2 font-bold">
              {title}
              <span title="Cor do push" style={{ width: 12, height: 12, borderRadius: 3, background: ORACLE_PUSH_COLORS[tone] }} />
            </h2>
            <article style={{ border: `1px solid ${t.border}`, background: `linear-gradient(135deg, ${t.coreSoft}, transparent 80%), #101013`, borderRadius: 22, padding: 16 }}>
              <div className="mb-3 flex items-center gap-3"><OracleSpeakerMark tone={tone} size="sm" pulse={false} /><span className="text-xs">Oráculo</span></div>
              <p className="text-sm leading-relaxed">{text}</p>
            </article>
          </section>
        );
      })}
    </div>
  </main>,
);
