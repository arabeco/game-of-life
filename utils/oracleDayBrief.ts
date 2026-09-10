import type { ScheduledTask } from '../types';
import type { OracleCycleCoachBrief } from './oracleCoach';
import { getOperationalDateString, taskMatchesOperationalDate } from './operationalDay.js';

/** Leitura do dia operacional, independente das metas e do ritmo do ciclo. */
export function buildOracleDayBrief(tasks: ScheduledTask[], now = new Date()): OracleCycleCoachBrief {
  const day = getOperationalDateString(now);
  const today = [...new Map(tasks.filter(task => taskMatchesOperationalDate(task, day)).map(task => [task.id, task])).values()];
  const completed = today.filter(task => task.completed).length;
  const pending = today.length - completed;
  const content = today.length === 0
    ? 'Hoje ainda não há atividades registradas no seu planejamento. Se quiser organizar o dia, escolha uma ação que faça sentido para agora.'
    : pending === 0
      ? `Você concluiu ${completed === 1 ? 'a atividade registrada' : `as ${completed} atividades registradas`} para hoje. O planejamento do dia está em dia. Pode deixar espaço para descansar ou rever o que vem depois.`
      : `Hoje você concluiu ${completed} de ${today.length} atividades registradas. ${pending === 1 ? 'Falta uma atividade' : `Restam ${pending} atividades`} no planejamento. Abra o dia e escolha o próximo passo; se algo já não cabe, ajuste o plano.`;
  return { id: `day:${day}`, content, quickActions: [{ id: 'day-planner', label: 'Abrir meu dia', kind: 'open_planner' }] };
}
