import type { Action, Arena, ScheduledTask } from '../types';

/**
 * ARENA FINALIZADA (26/10/2026).
 *
 * Uma arena com meta final pode ser concluida. Concluida, ela fica na grade
 * (opaca, com a estrela) ate a pessoa guarda-la nas Finalizadas, nao ocupa vaga
 * no limite e, no ciclo, vale so o que foi feito (utils/cycleCommitment.ts).
 */
export const isArenaFinalizada = (arena?: Pick<Arena, 'completedAt'> | null): boolean => Boolean(arena?.completedAt);

/**
 * As acoes param ao concluir: saem do planner as ocorrencias ainda pendentes de
 * hoje em diante. O que ja foi feito e o que ficou para tras sao historico.
 */
export function tarefasQueParam({ tasks, actionIds, hoje }: {
    tasks: Pick<ScheduledTask, 'id' | 'actionId' | 'date' | 'completed'>[];
    actionIds: string[];
    hoje: string;
}): string[] {
    const acoes = new Set(actionIds);
    return tasks
        .filter((t) => acoes.has(t.actionId) && !t.completed && String(t.date).slice(0, 10) >= hoje)
        .map((t) => t.id);
}

/** "Concluir e criar copia": uma arena igual, com a meta em branco, e as acoes dela. */
export function copiaDaArena(arena: Arena, actions: Action[]) {
    const { id: _id, actionIds: _ids, completedAt: _c, finalGoal: _m, isArchived: _a, ...resto } = arena;
    const novaArena = { ...resto, finalGoal: '', completedAt: null, isArchived: false };
    const acoes = actions
        .filter((acao) => acao.arenaId === arena.id)
        .map(({ id: _aid, arenaId: _arena, ...acao }) => acao);
    return { arena: novaArena, acoes };
}
