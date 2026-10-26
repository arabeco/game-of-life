import type { Action, Arena, ScheduledTask } from '../types';
import { isQuestAction } from './taskDomain.js';

export const CYCLE_SEASON_MISSION_RULE = 'Missões de temporada são extras: o que faltar nelas não reduz a conclusão nem a nota do ciclo.';

/** Season/clan missions have their own targets. A personal SIDEQUESTS arena does not. */
export const isCycleQuestAction = (action: Action, arenas: Arena[]): boolean =>
  Boolean(action.sourceQuestId) || isQuestAction(action, [], arenas);

/** The cycle promises action repetitions, whether or not they have a planner slot. */
export const buildCycleCommitment = ({ actions, arenas, tasks, startDate, endDate }: {
  actions: Action[];
  arenas: Arena[];
  tasks: ScheduledTask[];
  startDate: string;
  endDate: string;
}) => {
  // Arena finalizada entra mesmo depois de guardada nas Finalizadas (arquivada):
  // o que foi feito nela continua valendo no ciclo.
  const finalizadaIds = new Set(arenas.filter(arena => Boolean(arena.completedAt)).map(arena => arena.id));
  const activeArenaIds = new Set(arenas.filter(arena => !arena.isArchived || finalizadaIds.has(arena.id)).map(arena => arena.id));
  const activeActions = actions.filter(action => activeArenaIds.has(action.arenaId) || Boolean(action.originCodexId));
  const activeActionIds = new Set(activeActions.map(action => action.id));
  const cycleTasks = [...new Map(tasks.filter(task => activeActionIds.has(task.actionId)
    && task.date >= startDate && task.date <= endDate).map(task => [task.id, task])).values()];
  const questIds = new Set(activeActions.filter(action => isCycleQuestAction(action, arenas)).map(action => action.id));
  const plannedActions = activeActions.filter(action => action.actionType !== 'Livre' && !questIds.has(action.id) && !action.originCodexId && !finalizadaIds.has(action.arenaId));
  const completedByAction = new Map<string, number>();
  for (const task of cycleTasks) {
    if (task.completed === true) completedByAction.set(task.actionId, (completedByAction.get(task.actionId) || 0) + 1);
  }
  const promised = plannedActions.map(action => {
    const planned = Math.max(1, Math.floor(Number(action.repetitions) || 1));
    return { action, planned, completed: Math.min(planned, completedByAction.get(action.id) || 0), extra: false };
  });
  /*
   * MISSAO E CAMPANHA CONTAM SO PARA O BEM (19/10/2026, decisao do Afonso).
   *
   * "Andarilho: 20 caminhadas, fiz 3, acabou o ciclo. Nao quero perder % de
   * conclusao; quero as 3 acoes e o tempo contados." Missao de temporada, de
   * cla e campanha entram como PROMETIDO = FEITO, so com o que foi feito
   * dentro deste ciclo. O que faltou nao pesa (somar "x de x" nunca baixa a
   * porcentagem), e o que foi feito vale como acao, dia ativo e horas.
   *
   * A campanha atravessa ciclos: aqui so conta o que caiu na janela do ciclo;
   * o progresso dela (fases) continua contando a vida toda em outro lugar.
   * `extra` avisa a nota para nao tratar essas arenas como meta a selar.
   *
   * ARENA FINALIZADA (26/10/2026) entra do mesmo jeito: a pessoa chegou na
   * meta antes do fim do ciclo, entao o que faltava nao conta contra ela.
   */
  const extras = activeActions
    .filter(action => action.actionType !== 'Livre' && (questIds.has(action.id) || Boolean(action.originCodexId) || finalizadaIds.has(action.arenaId)))
    .map(action => ({ action, planned: completedByAction.get(action.id) || 0, completed: completedByAction.get(action.id) || 0, extra: true }))
    .filter(entry => entry.completed > 0);
  const entries = [...promised, ...extras];
  const plannedCount = entries.reduce((sum, entry) => sum + entry.planned, 0);
  const completedCount = entries.reduce((sum, entry) => sum + entry.completed, 0);
  const plannedIds = new Set(entries.map(entry => entry.action.id));
  return {
    entries, cycleTasks, plannedCount, completedCount,
    progressPercent: plannedCount > 0 ? completedCount / plannedCount * 100 : 0,
    scoredTasks: cycleTasks.filter(task => plannedIds.has(task.actionId)),
    questTasks: cycleTasks.filter(task => questIds.has(task.actionId)),
  };
};
