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

/**
 * O primeiro dia INTEIRO da rodada, para a soma de experiencia.
 *
 * A marca da rodada e um instante; o deposito de experiencia e um dia. Quando a
 * marca cai no meio de um dia, esse dia fica dos dois lados — e como a regra do
 * livro-caixa e que o dia deposita e o fecho paga, um dia dos dois lados e um
 * dia pago duas vezes.
 *
 * Entao a experiencia so conta o dia que a rodada teve INTEIRO:
 *
 *   - marca na virada do dia (o "Continuar" depois do ciclo) → o dia dela conta;
 *   - marca no meio do dia (o "Concluir rodada") → so o dia seguinte conta,
 *     porque o dia de hoje acabou de ser liquidado pelo proprio fecho.
 *
 * A conta e em hora LOCAL porque `daily_commitments.date` e gravado com
 * `getLocalDateString()`. Fazer em UTC erraria por um dia em todo fuso a oeste
 * de Greenwich — no Brasil, das 21h em diante.
 */
export const primeiroDiaInteiroDaRodada = (marca?: string | null): string => {
    const SEM_MARCA = '1970-01-01';
    if (!marca) return SEM_MARCA;

    const instante = new Date(marca);
    if (Number.isNaN(instante.getTime())) return SEM_MARCA;

    const naViradaDoDia = instante.getHours() === 0
        && instante.getMinutes() === 0
        && instante.getSeconds() === 0
        && instante.getMilliseconds() === 0;

    const dia = new Date(instante);
    dia.setHours(0, 0, 0, 0);
    if (!naViradaDoDia) dia.setDate(dia.getDate() + 1);

    const doisDigitos = (n: number) => String(n).padStart(2, '0');
    return `${dia.getFullYear()}-${doisDigitos(dia.getMonth() + 1)}-${doisDigitos(dia.getDate())}`;
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
