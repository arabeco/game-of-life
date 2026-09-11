import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

type Snapshot = { id: string; mastery_index: number; taken_at: string };

export const MasteryHistory: React.FC<{ userId: string; updatedAt?: number }> = ({userId, updatedAt}) => {
  const [entries, setEntries] = useState<Snapshot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState('Carregando histórico…');
  useEffect(() => {
    let cancelled = false;
    setEntries([]); setSelected(null); setStatus('Carregando histórico…');
    if (!userId) { setStatus('Sem avaliações salvas'); return; }
    void (async () => {
      try {
        const {data, error} = await supabase.from('mastery_snapshots')
          .select('id,mastery_index,taken_at').eq('user_id', userId)
          .order('taken_at', {ascending: false}).limit(6);
        if (cancelled) return;
        if (error) { setStatus('Histórico indisponível'); return; }
        const rows = (data || []).filter(row => Number.isFinite(row.mastery_index) && Number.isFinite(Date.parse(row.taken_at))).reverse();
        setEntries(rows); setSelected(rows.at(-1)?.id || null); setStatus('Sem avaliações salvas');
      } catch { if (!cancelled) setStatus('Histórico indisponível'); }
    })();
    return () => { cancelled = true; };
  }, [userId, updatedAt]);
  const chosen = entries.find(entry => entry.id === selected);
  const date = (value: string) => new Date(value).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'});
  const point = (entry: Snapshot, index: number) => ({
    x: entries.length === 1 ? 150 : 20 + index * 260 / (entries.length - 1),
    y: 56 - Math.max(0,Math.min(100,entry.mastery_index)) * .4,
  });
  return <section className="mastery-history" aria-label="Histórico das avaliações">
    {entries.length ? <>
      <svg viewBox="0 0 300 72" className="mastery-history-chart" aria-label="Últimas avaliações">
        <polyline points={entries.map((entry,index) => {const p=point(entry,index);return `${p.x},${p.y}`;}).join(' ')} fill="none" stroke="currentColor" strokeOpacity=".3" strokeWidth="1.5" />
        {entries.map((entry,index) => {const p=point(entry,index);return <g key={entry.id} role="button" tabIndex={0}
          aria-label={`${date(entry.taken_at)}: índice ${entry.mastery_index}`} aria-pressed={entry.id===selected}
          onClick={()=>setSelected(entry.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelected(entry.id);}}} className="mastery-history-point">
          <circle cx={p.x} cy={p.y} r="18" fill="transparent" />
          <circle cx={p.x} cy={p.y} r={entry.id===selected ? 5 : 3.5} fill={entry.id===selected?'currentColor':'#17202a'} stroke="currentColor" strokeWidth="1.5" />
        </g>;})}
      </svg>
      <p aria-live="polite">{chosen && `${date(chosen.taken_at)} · ${chosen.mastery_index} pontos`}</p>
    </> : <p>{status}</p>}
  </section>;
};
