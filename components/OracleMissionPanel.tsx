import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { ArenaPactBalloon, ArenaPactProposal } from './ArenaPactBalloon';
import { OracleSpeakerMark } from './OracleSpeakerMark';
import { buildOracleMissionBrief } from '../utils/oracleMissionBrief';

export const OracleMissionPanel: React.FC = () => {
  const {activeArenaPact: pact, arenaPactProgress: progress, missaoIndividualDisponivel,
    missaoDeSistemaAtiva, oracleMessages} = useGame();
  const [choosing, setChoosing] = useState(false);
  // Stored messages belong here only with an explicit mission identity, never by keywords.
  const related = (oracleMessages || []).filter(message => pact
    && message.contextSnapshot?.purpose === 'individual_mission'
    && message.contextSnapshot?.missionId === pact.id)
    .slice().sort((a,b) => Date.parse(a.createdAt)-Date.parse(b.createdAt));
  if (choosing) return <div className="space-y-3">
    <button type="button" onClick={() => setChoosing(false)} className="min-h-11 text-xs font-bold text-white/70">← Voltar à missão</button>
    <ArenaPactProposal substituindo={Boolean(pact)} onClose={() => setChoosing(false)} />
  </div>;
  if (!pact) return <div className="rounded-2xl border border-[var(--skin-accent-color)]/20 bg-white/[0.03] p-5">
    <OracleSpeakerMark tone="guide" size="sm" />
    <h3 className="mt-4 text-base font-bold text-white">{missaoDeSistemaAtiva?.title || 'Um compromisso de cada vez'}</h3>
    <p className="mt-2 text-sm leading-relaxed text-white/60">{missaoDeSistemaAtiva
      ? 'Você já tem uma missão em andamento. Acompanhe os detalhes na aba Temporada.'
      : missaoIndividualDisponivel ? 'Escolha uma missão para todas as suas arenas ou para uma frente específica.'
      : 'Registre uma ação para abrir suas primeiras propostas de missão.'}</p>
    {!missaoDeSistemaAtiva && missaoIndividualDisponivel && <button type="button" onClick={() => setChoosing(true)} className="luxe-skin-button mt-5 min-h-11 w-full px-4 text-xs font-bold">Escolher missão</button>}
  </div>;
  return <div className="space-y-5">
    <div>
      <ArenaPactBalloon />
    </div>
    <section aria-label="Acompanhamento da missão" className="space-y-3">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Acompanhamento</h3>
      {related.map(message => <article key={message.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <time className="text-[10px] text-white/40" dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString('pt-BR')}</time>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/80">{message.content}</p>
      </article>)}
      <article className="rounded-2xl border border-[var(--skin-accent-color)]/20 bg-[var(--skin-accent-color)]/[0.04] p-4" aria-live="polite">
        <div className="flex items-center gap-2"><OracleSpeakerMark tone={progress.completed ? 'success' : 'guide'} size="sm" /><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--skin-accent-color)]">Agora</span></div>
        <p className="mt-3 text-sm leading-relaxed text-white/85">{buildOracleMissionBrief(pact, progress)}</p>
      </article>
    </section>
  </div>;
};
