import type { Action, Cycle, DayOfWeek } from '../types';

/**
 * ATE ONDE O APP AGENDA, E QUEM ENTRA NO CICLO.
 *
 * Este arquivo existe porque tres decisoes que sempre foram a mesma pergunta
 * viviam separadas e discordavam entre si:
 *
 *   1. quantas tarefas gravar quando alguem marca "todo dia"
 *   2. quais arenas entram no ciclo novo
 *   3. o que reagendar quando o ciclo vira
 *
 * A pergunta unica e: QUAL E A JANELA? E a resposta do app sempre foi o ciclo —
 * e o ciclo que zera a barra da arena, que recorta o relatorio, que define o
 * escopo de tudo. Gravar um ano a frente era responder outra coisa.
 *
 * Tudo aqui e funcao pura sobre datas 'YYYY-MM-DD', para dar para testar sem
 * subir o app.
 */

export const DAY_OF_WEEK_ORDER: DayOfWeek[] = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

/**
 * A janela de quem NAO tem ciclo aberto (a "rodada livre").
 *
 * 35 dias e o mesmo numero do horizonte de leitura (TASK_LOAD_HORIZON_DAYS):
 * sem ciclo nao existe um fim natural, entao agendamos exatamente o que o app
 * ja carrega de uma vez. Nem sobra escrita que ninguem le, nem falta tarefa
 * dentro do que a tela mostra.
 */
export const FREE_ROUND_SCHEDULE_DAYS = 35;

/**
 * Teto duro de seguranca. Nenhum ciclo real chega perto disto; ele existe para
 * que uma data digitada errada (ou corrompida) nao gere dezenas de milhares de
 * linhas antes de alguem perceber.
 */
const MAX_GENERATED_DAYS = 400;

const toDate = (iso: string): Date => {
    const [year, month, day] = String(iso).split('-').map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
};

const toIso = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const addDaysIso = (iso: string, days: number): string => {
    const date = toDate(iso);
    date.setDate(date.getDate() + days);
    return toIso(date);
};

export const dayOfWeekForIso = (iso: string): DayOfWeek => DAY_OF_WEEK_ORDER[toDate(iso).getDay()];

export type CycleWindow = Pick<Cycle, 'startDate' | 'endDate'> | null | undefined;

/**
 * Ate que data gerar tarefas a partir de hoje.
 *
 * O ciclo manda enquanto ainda nao terminou. Um ciclo ja vencido nao serve de
 * horizonte — geraria zero tarefa e a acao nasceria morta —, entao ele cai no
 * mesmo tratamento de quem nao tem ciclo.
 */
export const resolveScheduleHorizon = (today: string, cycle?: CycleWindow): string => {
    if (cycle?.endDate && cycle.endDate >= today) return cycle.endDate;
    return addDaysIso(today, FREE_ROUND_SCHEDULE_DAYS);
};

/**
 * As datas que um padrao de dias da semana ocupa dentro de uma janela.
 * Inclusiva nas duas pontas: o ultimo dia do ciclo e dia de trabalho.
 */
export const buildRecurringDates = (params: {
    from: string;
    through: string;
    daysOfWeek: DayOfWeek[] | undefined | null;
}): string[] => {
    const { from, through, daysOfWeek } = params;
    if (!from || !through || through < from) return [];
    if (!daysOfWeek || daysOfWeek.length === 0) return [];

    const wanted = new Set(daysOfWeek);
    const dates: string[] = [];
    let cursor = from;

    for (let guard = 0; guard < MAX_GENERATED_DAYS && cursor <= through; guard += 1) {
        if (wanted.has(dayOfWeekForIso(cursor))) dates.push(cursor);
        cursor = addDaysIso(cursor, 1);
    }

    return dates;
};

/**
 * Quantas vezes aquele padrao acontece na janela. E o numero que a tela mostra
 * quando a pessoa marca os dias — a meta deixa de ser sobra do calendario e
 * passa a ser algo que ela ve antes de confirmar.
 */
export const countRecurringOccurrences = (params: {
    from: string;
    through: string;
    daysOfWeek: DayOfWeek[] | undefined | null;
}): number => buildRecurringDates(params).length;

export type ArenaSetupStatus = 'renew' | 'archive' | 'delete';

export type ArenaSetupDecision = {
    id: string;
    status: ArenaSetupStatus;
};

export type ArenaLike = {
    id: string;
    isArchived?: boolean;
};

/**
 * QUAIS ARENAS ENTRAM NO CICLO NOVO.
 *
 * Antes isto era "as que a pessoa marcou renovar". Mas a tela de novo ciclo so
 * registra as arenas que ela TOCOU — quem marcasse renovar em uma arena de oito
 * comecava o ciclo com uma arena, e as outras sete sumiam da contagem sem aviso
 * nenhum. O caminho seguro era nao mexer em nada, e o caminho perigoso era
 * cuidar justamente da arena que mais importava.
 *
 * A regra agora e a inversa e nao depende de a pessoa decidir sobre todas:
 * continuar e o padrao, e so sai quem foi arquivada ou apagada ali.
 */
export const resolveCycleArenaIds = (params: {
    arenas: ArenaLike[];
    changes: ArenaSetupDecision[];
}): string[] => {
    const { arenas, changes } = params;
    const removed = new Set(
        changes.filter(change => change.status === 'archive' || change.status === 'delete').map(change => change.id)
    );
    // Renovar uma arena arquivada a traz de volta, e a lista de arenas que
    // recebemos aqui ainda e a de antes dessa mudanca. Sem esta excecao a arena
    // ressuscitada ficaria de fora do proprio ciclo que a ressuscitou.
    const renewed = new Set(changes.filter(change => change.status === 'renew').map(change => change.id));

    return arenas
        .filter(arena => !removed.has(arena.id) && (!arena.isArchived || renewed.has(arena.id)))
        .map(arena => arena.id);
};

export type PlannedTask = {
    actionId: string;
    date: string;
    startTime: number;
    duration: number;
};

export type ExistingTaskKey = {
    actionId: string;
    date: string;
    startTime: number;
};

const taskKey = (actionId: string, date: string, startTime: number) => `${actionId}_${date}_${startTime}`;

/**
 * O QUE REAGENDAR QUANDO O CICLO VIRA.
 *
 * Antes da janela virar o ciclo, isto nao existia porque nao precisava: o laco
 * de 365 dias ja tinha gravado o ciclo seguinte inteiro. A virada funcionava por
 * acidente, como efeito colateral do desperdicio.
 *
 * Agora e explicito. A receita ja esta na propria acao (`scheduledDays` e
 * `scheduledStartTime`), entao nada precisa ser perguntado a ninguem: as acoes
 * das arenas que continuam voltam a ter tarefas, e as das arenas arquivadas ou
 * apagadas nao voltam.
 *
 * `existingTasks` deve vir do BANCO, nao da memoria. Depois do teto de leitura
 * o estado local nao enxerga o fim de um ciclo longo, e conferir duplicata
 * contra ele criaria tarefa repetida exatamente na virada.
 */
export const buildCycleRegenerationPlan = (params: {
    cycle: Pick<Cycle, 'startDate' | 'endDate' | 'arenaIds'>;
    today: string;
    actions: Action[];
    existingTasks: ExistingTaskKey[];
}): PlannedTask[] => {
    const { cycle, today, actions, existingTasks } = params;
    if (!cycle?.startDate || !cycle?.endDate) return [];

    const scope = new Set(cycle.arenaIds || []);
    if (scope.size === 0) return [];

    // Um ciclo agendado para o futuro gera a janela inteira; um que ja comecou
    // gera de hoje em diante — reagendar o passado criaria tarefa vencida na
    // estreia do ciclo.
    const from = cycle.startDate > today ? cycle.startDate : today;
    if (cycle.endDate < from) return [];

    const taken = new Set(existingTasks.map(task => taskKey(task.actionId, task.date, task.startTime)));
    const planned: PlannedTask[] = [];

    for (const action of actions) {
        if (!scope.has(action.arenaId)) continue;
        if (action.actionType !== 'Ação Recorrente') continue;

        const daysOfWeek = action.scheduledDays;
        const startTime = action.scheduledStartTime;
        if (!daysOfWeek || daysOfWeek.length === 0) continue;
        if (typeof startTime !== 'number') continue;

        for (const date of buildRecurringDates({ from, through: cycle.endDate, daysOfWeek })) {
            const key = taskKey(action.id, date, startTime);
            if (taken.has(key)) continue;
            taken.add(key);
            planned.push({ actionId: action.id, date, startTime, duration: action.duration });
        }
    }

    return planned;
};
