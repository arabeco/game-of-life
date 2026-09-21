import type { ScheduledTask, UserProfile } from '../types';

export const FREE_PROGRESS_RESET_FLAG_PREFIX = 'free_progress_reset_at:';

export const buildFreeProgressResetFlag = (date = new Date()) =>
    `${FREE_PROGRESS_RESET_FLAG_PREFIX}${date.toISOString()}`;

export const getFreeProgressResetAt = (profile?: Pick<UserProfile, 'completedSeasonMissions'> | null) => {
    const flags = profile?.completedSeasonMissions || [];
    return flags
        .filter((flag) => typeof flag === 'string' && flag.startsWith(FREE_PROGRESS_RESET_FLAG_PREFIX))
        .map((flag) => flag.slice(FREE_PROGRESS_RESET_FLAG_PREFIX.length))
        .filter((value) => !Number.isNaN(Date.parse(value)))
        .sort()
        .at(-1) || null;
};

/**
 * A marca da rodada que comeca quando um ciclo termina e ninguem abre outro.
 *
 * Tem de ser o DIA SEGUINTE ao fim do ciclo, a zero hora, e o motivo e que as
 * duas leituras da marca comparam de jeitos diferentes:
 *
 *   - `filterTasksAfterFreeProgressReset` guarda a tarefa com `> marca`, num
 *     instante;
 *   - o `refreshRoundExpBonus` soma `exp_deposited` com `gte('date', marca
 *     recortada em dez caracteres)`, numa data, e o `gte` inclui o proprio dia.
 *
 * Com a marca no ultimo dia do ciclo, a segunda leitura ainda alcancaria aquele
 * dia e pagaria o deposito dele outra vez. Com a marca no dia seguinte, as duas
 * concordam: o ciclo inteiro fica para tras.
 */
export const marcaDeRodadaDepoisDoCiclo = (
    relatorio?: { endDate?: string | null } | null,
): string | null => {
    const fim = relatorio?.endDate;
    if (typeof fim !== 'string' || !fim.trim()) return null;

    const ultimoDia = Date.parse(`${fim}T00:00:00.000Z`);
    if (Number.isNaN(ultimoDia)) return null;

    return new Date(ultimoDia + 24 * 60 * 60 * 1000).toISOString();
};

const getTaskAnchorTime = (task: ScheduledTask) => {
    const candidates = [task.completedAt, task.createdAt];
    for (const candidate of candidates) {
        if (candidate && !Number.isNaN(Date.parse(candidate))) {
            return Date.parse(candidate);
        }
    }

    if (task.date && !Number.isNaN(Date.parse(`${task.date}T00:00:00`))) {
        return Date.parse(`${task.date}T00:00:00`);
    }

    return 0;
};

export const filterTasksAfterFreeProgressReset = <T extends ScheduledTask>(tasks: T[], resetAt?: string | null): T[] => {
    if (!resetAt) return tasks;
    const resetTime = Date.parse(resetAt);
    if (Number.isNaN(resetTime)) return tasks;
    return tasks.filter((task) => getTaskAnchorTime(task) > resetTime);
};
