import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { openingCandidates, reactionCandidates, readProgress, selectSpeech, type Voice } from '../supabase/functions/_shared/oracle-engine-v2';

function Preview() {
  const [tone, setTone] = useState<Voice>('neutro');
  const [presence, setPresence] = useState(3);
  const [done, setDone] = useState(3);
  const [queued, setQueued] = useState(0);
  const [stock, setStock] = useState(5);
  const [returned, setReturned] = useState(false);
  const [cycle, setCycle] = useState(false);
  const [mission, setMission] = useState(false);
  const day = '2026-10-08';
  const opening = selectSpeech(openingCandidates({ completed: done, queued, stock, returned }, tone, day), 'opening', presence, [], Date.now(), day);
  const reaction = selectSpeech(reactionCandidates({ eventId: 'preview', action: { id: 'action', name: 'Ler um capítulo', completed: done, target: 5 }, previousCount: Math.max(0, done - 1), returned,
    mission: mission ? { id: 'mission', name: 'Avançar em Estudos', completed: 5, target: 5, previous: 4 } : undefined,
  }, tone), 'reaction', presence, [], Date.now(), day);
  const reading = readProgress({ cycle: cycle ? { percent: done / 5 * 100, daysLeft: 5, ended: false } : null, arenas: [{ id: 'arena', name: 'Estudos', completed: done, target: 5 }], completed: done });
  return <main><header><small>PRÉVIA LOCAL · DADOS FICTÍCIOS</small><h1>Uma voz para cada momento.</h1><p>Experimente os cenários. Esta tela não altera sua conta nem envia notificações.</p></header>
    <section className="controls">
      <label>Narrador<select value={tone} onChange={e => setTone(e.target.value as Voice)}>{['neutro','coach','reflexivo','calmo'].map(t => <option key={t}>{t}</option>)}</select></label>
      <label>Presença<select value={presence} onChange={e => setPresence(Number(e.target.value))}>{['Silencioso','Discreto','Equilibrado','Presente'].map((t,i) => <option key={t} value={i}>{t}</option>)}</select></label>
      <label>Concluídas: {done}<input aria-label="Concluídas" type="range" min="0" max="5" value={done} onChange={e => setDone(Number(e.target.value))}/></label>
      <label>Na lista de hoje: {queued}<input aria-label="Na lista de hoje" type="range" min="0" max="8" value={queued} onChange={e => setQueued(Number(e.target.value))}/></label>
      <label>Opções no estoque: {stock}<input aria-label="Estoque" type="range" min="0" max="10" value={stock} onChange={e => setStock(Number(e.target.value))}/></label>
      <label><input type="checkbox" checked={returned} onChange={e => setReturned(e.target.checked)}/> Retorno após uma pausa</label>
      <label><input type="checkbox" checked={cycle} onChange={e => setCycle(e.target.checked)}/> Ciclo aberto</label>
      <label><input type="checkbox" checked={mission} onChange={e => setMission(e.target.checked)}/> Esta conclusão também fecha a missão</label>
    </section><section className="cards">
      <article><small>ABERTURA · PLANNER E ESTOQUE</small><p data-testid="opening">{opening.chosen?.text || 'Fica em silêncio.'}</p></article>
      <article><small>REAÇÃO · A CONCLUSÃO AGORA</small><p data-testid="reaction">{reaction.chosen?.text || 'Fica em silêncio.'}</p></article>
      <article><small>LEITURA · CICLO E ARENAS</small><p data-testid="reading">{reading}</p></article>
    </section><details><summary>Por que essa fala venceu?</summary><pre>{JSON.stringify({ opening: opening.rows, reaction: reaction.rows }, null, 2)}</pre></details>
    <footer>A leitura solicitada sempre responde. Na conta, intervalos e memória também filtram falas repetidas. A leitura usa uma voz factual; os narradores variam aberturas e reações.</footer>
  </main>;
}
const css = document.createElement('style');
css.textContent = `*{box-sizing:border-box}body{margin:0;background:#111319;color:#eee;font:16px system-ui}main{max-width:1000px;margin:auto;padding:36px 24px}h1{font-size:32px;margin:12px 0}small{color:#dbba75;font-size:11px;letter-spacing:.12em}header p,footer{color:#aab0bc;line-height:1.6}.controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:20px;margin:32px 0;padding:24px;background:#1a1d25;border-radius:18px}label{font-size:14px}select,input[type=range]{display:block;width:100%;margin-top:10px}select{background:#101218;color:#fff;padding:9px;border:1px solid #555;border-radius:8px}input{accent-color:#d9b76b}.cards{display:grid;gap:16px}article{padding:24px;border:1px solid #4c4433;border-radius:18px;background:#191b21}article p{line-height:1.7;margin-bottom:0}details{margin:24px 0;color:#adb2bd}pre{overflow:auto;font-size:12px}footer{font-size:12px}`;
document.head.appendChild(css);
createRoot(document.getElementById('root')!).render(<Preview/>);
