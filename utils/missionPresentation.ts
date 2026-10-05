import type { ArenaPact } from './arenaPacts';
const dayNumber = (date: string) => Date.parse(`${date.slice(0, 10)}T00:00:00Z`) / 86400000;

export const missionObjective = (pact: ArenaPact): string => {
  if (pact.kind === 'primeira') return 'Monte sua primeira arena e conclua uma ação nela';
  const scope = pact.arenaId ? `em ${pact.arenaName}` : 'entre suas arenas';
  if (pact.kind === 'conclusao') return `Conclua a arena ${pact.arenaName}`;
  if (pact.kind === 'constancia') return `Conclua ações ${scope} em ${pact.goal} dias diferentes`;
  const days = pact.endsOn ? dayNumber(pact.endsOn) - dayNumber(pact.startedOn) + 1 : null;
  return `Conclua ${pact.goal} ${pact.goal === 1 ? 'ação' : 'ações'} ${scope}${days && days > 0 ? ` em ${days} dias` : ''}`;
};

export const missionCountingRule = (pact: ArenaPact): string => {
  if (pact.kind === 'conclusao') return 'Conta o progresso das ações desta arena. Agendamentos não são conclusões; desfazer uma conclusão reduz o progresso.';
  const period = `Contam ações concluídas com data a partir de ${pact.startedOn.split('-').reverse().join('/')}${pact.endsOn ? ` até ${pact.endsOn.split('-').reverse().join('/')}` : ''}, inclusive as de hoje.`;
  return `${period} ${pact.kind === 'constancia' ? 'Cada dia conta uma vez; os dias não precisam ser seguidos. ' : ''}Ações Livres e agendamentos pendentes não contam. Desfazer uma conclusão retira esse registro da missão aberta. O dia vira às 4h.`;
};

export const missionTime = (pact: ArenaPact, today: string) => {
  if (!pact.endsOn) return null;
  const total = dayNumber(pact.endsOn) - dayNumber(pact.startedOn) + 1;
  if (!Number.isFinite(total) || total <= 0) return null;
  const remaining = Math.max(0, Math.min(total, dayNumber(pact.endsOn) - dayNumber(today) + 1));
  return { percent: Math.max(0, Math.min(100, (total - remaining) / total * 100)),
    label: remaining === 0 ? 'Prazo encerrado' : remaining === 1 ? 'Último dia' : `${remaining} dias restantes` };
};
