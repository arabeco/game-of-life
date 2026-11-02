import type { ScheduledTask, UserProfile } from '../types';
import { getOperationalDateString } from './operationalDay.js';

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

    // Meia-noite LOCAL do dia seguinte (02/11/2026). Em UTC, no Brasil, ela
    // caia as 21h do ultimo dia do ciclo, e o que se marcava depois disso
    // aparecia na rodada nova.
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fim.trim());
    if (!partes) return null;
    const diaSeguinte = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]) + 1, 0, 0, 0, 0);
    if (Number.isNaN(diaSeguinte.getTime())) return null;

    return diaSeguinte.toISOString();
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

/**
 * A ACAO VALE PELO DIA EM QUE ESTA NO PLANNER, nao pela hora do toque (02/11/2026,
 * com o Afonso). Dia antes do zerar fica de fora, mesmo marcado depois; dia
 * depois entra. So no proprio dia de um zerar feito no meio do dia o horario
 * da conclusao decide.
 */
export const filterTasksAfterFreeProgressReset = <T extends ScheduledTask>(tasks: T[], resetAt?: string | null): T[] => {
    if (!resetAt) return tasks;
    const resetTime = Date.parse(resetAt);
    if (Number.isNaN(resetTime)) return tasks;
    const marca = new Date(resetTime);
    const doisDigitos = (n: number) => String(n).padStart(2, '0');
    // A meia-noite do "Continuar" e o comeco de um dia; qualquer outra hora e o
    // dia do Glyph, que so vira as 4h (zerar as 2h ainda e o dia anterior).
    const naVirada = marca.getHours() === 0 && marca.getMinutes() === 0 && marca.getSeconds() === 0 && marca.getMilliseconds() === 0;
    const diaDaMarca = naVirada
        ? `${marca.getFullYear()}-${doisDigitos(marca.getMonth() + 1)}-${doisDigitos(marca.getDate())}`
        : getOperationalDateString(marca);
    return tasks.filter((task) => {
        if (typeof task.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(task.date)) {
            if (task.date < diaDaMarca) return false;
            if (task.date > diaDaMarca || naVirada) return true;
        }
        return getTaskAnchorTime(task) > resetTime;
    });
};
