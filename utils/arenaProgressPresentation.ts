import type { Action, ScheduledTask, Cycle } from '../types';
import type { ArenaProgressResult } from './progressUtils';
import { filterTasksAfterFreeProgressReset } from './freeProgressScope.ts';

// O texto usa a mesma medida da barra; unidades mistas continuam em percentual.
export const describeArenaProgress = (
    actions: Action[],
    progress: ArenaProgressResult,
    displayedPercent = progress.progressPercent,
): { label: string; accessibleLabel: string; remaining: number | null } | null => {
    if (!progress.hasMeasurableProgress) return null;
    const measured = actions.filter(action => action.actionType !== 'Livre');
    const sameType = new Set(measured.map(action => action.actionType)).size === 1;
    const canCount = measured.length > 0 && sameType
        && !progress.isClanQuestArena && !progress.isSeasonQuestArena && !progress.isSharedPool
        && Number.isInteger(progress.totalCompleted) && Number.isInteger(progress.totalPlanned)
        && Math.abs(displayedPercent - progress.progressPercent) < 0.01;
    if (!canCount) {
        const percentual = `${Math.round(displayedPercent)}%`;
        return { label: percentual, accessibleLabel: `${percentual} concluído`, remaining: null };
    }
    const unit = measured[0].actionType === 'Marco' ? 'marcos' : 'ações';
    // DUAS FORMAS DO MESMO NUMERO.
    //
    // O que aparece no card e so "3/4": a palavra "ações" ocupava mais espaco que
    // o dado e se repetia em cada arena da tela. Quem le por leitor de tela
    // continua ouvindo a frase inteira — encolher o visivel nao pode encolher o
    // que e dito em voz alta.
    return {
        label: `${progress.totalCompleted}/${progress.totalPlanned}`,
        accessibleLabel: `${progress.totalCompleted}/${progress.totalPlanned} ${unit}`,
        remaining: Math.max(0, progress.totalPlanned - progress.totalCompleted),
    };
};

// Escopo de apresentação do card e do toast. Não altera pontuação nem EXP.
export const getArenaPresentationTasks = (
    tasks: ScheduledTask[],
    cycle: Cycle | null,
    resetAt: string | null | undefined,
    today: string,
) => {
    if (!cycle) return filterTasksAfterFreeProgressReset(tasks, resetAt);
    const end = today < cycle.endDate ? today : cycle.endDate;
    return tasks.filter(task => typeof task.date === 'string'
        && task.date >= cycle.startDate && task.date <= end);
};
