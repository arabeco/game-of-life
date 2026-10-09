import { ORACLE_ENGINE_V2, readingFacts } from './oracleEngineV2.ts';
import { readingVisualTone } from '../supabase/functions/_shared/oracle-visual-tone.ts';
import { readProgress } from '../supabase/functions/_shared/oracle-engine-v2.ts';
import type { Action, Asset, Cycle, ScheduledTask } from '../types';
import type { OracleCycleCoachBrief } from './oracleCoach';
import { buildCycleCommitment } from './cycleCommitment.ts';
import { getCycleTimingSummary } from './dateUtils.ts';
import { getOperationalDateString, taskMatchesOperationalDate } from './operationalDay.js';
import {
  montarLeituraDoCiclo,
  type FatosDaLeitura,
} from '../supabase/functions/_shared/oracle-cycle-reading.ts';

/**
 * Os fatos da leitura, juntados com o que o app tem na mao.
 *
 * O ciclo usa buildCycleCommitment, a mesma conta do widget, do card de Ativos
 * e do relatorio: o numero que o Oraculo fala e o numero que a pessoa ve. O
 * `cycleProgress` do GameContext soma os relatorios diarios, e e outra conta.
 */
export const fatosDaLeitura = ({ tasks, actions, assets, activeCycle, now = new Date() }: {
  tasks: ScheduledTask[];
  actions: Action[];
  assets: Asset[];
  activeCycle: Cycle | null | undefined;
  resetAt?: string | null;
  now?: Date;
}): FatosDaLeitura => {
  const hojeData = getOperationalDateString(now);
  const deHoje = [...new Map(tasks
    .filter((task) => taskMatchesOperationalDate(task, hojeData))
    .map((task) => [task.id, task])).values()];
  const hoje = { agendadas: deHoje.length, feitas: deHoje.filter((task) => task.completed).length };

  if (!activeCycle) return { hoje, ciclo: null };
  const tempo = getCycleTimingSummary(activeCycle.startDate, activeCycle.endDate, hojeData);
  if (tempo.isUpcoming) return { hoje, ciclo: null };

  const promessa = buildCycleCommitment({
    actions,
    arenas: assets.flatMap((asset) => asset.arenas),
    tasks,
    startDate: activeCycle.startDate,
    endDate: activeCycle.endDate,
  });
  return {
    hoje,
    ciclo: {
      dia: Math.max(1, Math.min(tempo.totalDays, tempo.elapsedDays + 1)),
      totalDias: tempo.totalDays,
      feitas: promessa.completedCount,
      prometidas: promessa.plannedCount,
      prazoAcabou: activeCycle.endDate < hojeData,
    },
  };
};

/** O que o botao "Ler meu dia e ciclo" devolve: o mesmo motor do push da manha. */
export const lerMeuDiaECiclo = (entrada: Parameters<typeof fatosDaLeitura>[0]): OracleCycleCoachBrief => {
  const facts = readingFacts({ ...entrada, activeCycle: entrada.activeCycle || null, arenas: entrada.assets.flatMap(a => a.arenas), today: getOperationalDateString(entrada.now || new Date()) });
  const fatos = fatosDaLeitura(entrada);
  const leitura = montarLeituraDoCiclo(fatos, { nuncaVazia: true });
  return {
    visualTone: ORACLE_ENGINE_V2 ? readingVisualTone(facts) : 'neutral',
    id: `leitura:${leitura.estados.ciclo}:${leitura.estados.dia}`,
    content: ORACLE_ENGINE_V2 ? readProgress(facts) : leitura.texto || '',
    quickActions: ORACLE_ENGINE_V2 ? [
      { id: 'leitura-arenas', label: 'Ver arenas', kind: 'open_arenas' },
      ...(fatos.ciclo ? [{ id: 'leitura-ciclo', label: 'Ver ciclo', kind: 'open_cycle' as const }] : []),
    ] : [
      { id: 'leitura-abrir-dia', label: 'Abrir meu dia', kind: 'open_planner' },
      fatos.ciclo
        ? { id: 'leitura-ver-ciclo', label: 'Ver meu ciclo', kind: 'open_cycle' }
        : { id: 'leitura-montar-ciclo', label: 'Montar ciclo', kind: 'open_cycle' },
    ],
  };
};
