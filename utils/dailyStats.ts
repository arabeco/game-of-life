import type { DailyFeedSnapshot } from '../types';

/**
 * OS NUMEROS DO DIA, EM UM LUGAR SO.
 *
 * O painel e a placa mostravam conjuntos diferentes de estatisticas, com
 * enfases diferentes — a placa puxava a EXP pro numerao e o painel puxava as
 * acoes — porque cada um montava a propria lista. Nao havia erro em nenhum dos
 * dois: havia dois donos da mesma decisao, que e como duas telas sobre o mesmo
 * dia acabam discordando sem ninguem ter escrito nada errado.
 *
 * Agora as duas chamam esta funcao com o MESMO instantaneo. Trocar o que o dia
 * mostra e mexer aqui, e as duas mudam juntas por construcao.
 *
 * Regra de quem entra: cada estatistica mede uma GRANDEZA que nenhuma outra
 * mede — minutos, acoes, arenas, dias — e nenhuma delas depende de plano. Uma
 * porcentagem de "quanto do que foi marcado" nao cabe aqui: quem nao marca nada
 * colheria 100% sem ter medido esforco algum.
 */

export interface DailyStat {
    /** Chave estavel pra lista; o rotulo muda com singular e plural. */
    id: string;
    label: string;
    value: string;
    /** Linha de apoio, quando o numero sozinho nao se explica. */
    hint?: string;
}

/** Minutos em "9h15". Recebe MINUTOS, nunca EXP — os dois nao sao a mesma coisa. */
export const formatDailyDuration = (minutes: number): string => {
    const total = Math.max(0, Math.round(minutes));
    const horas = Math.floor(total / 60);
    const resto = total % 60;
    if (horas <= 0) return `${resto}min`;
    return resto > 0 ? `${horas}h${String(resto).padStart(2, '0')}` : `${horas}h`;
};

export const buildDailyStats = (snapshot: DailyFeedSnapshot): DailyStat[] => {
    const stats: DailyStat[] = [
        {
            id: 'tempo',
            label: 'Tempo',
            value: snapshot.minutes > 0 ? formatDailyDuration(snapshot.minutes) : '—',
            hint: 'registrado',
        },
        {
            id: 'acoes',
            label: snapshot.completed === 1 ? 'Ação' : 'Ações',
            value: String(snapshot.completed),
            hint: 'concluídas',
        },
    ];

    if (typeof snapshot.arenasTouched === 'number') {
        stats.push({
            id: 'arenas',
            label: snapshot.arenasTouched === 1 ? 'Arena' : 'Arenas',
            value: String(snapshot.arenasTouched),
            hint: 'tocadas',
        });
    }

    // So com ciclo aberto: este mede dias DENTRO de uma janela, e sem janela um
    // numero de dias nao diz nada. Post antigo tambem cai aqui, e tudo bem —
    // mostra os que tem.
    if (typeof snapshot.activeDays === 'number' && typeof snapshot.cycleDaysSoFar === 'number') {
        stats.push({
            id: 'dias',
            label: 'Dias ativos',
            value: String(snapshot.activeDays),
            hint: `de ${snapshot.cycleDaysSoFar} ${snapshot.cycleDaysSoFar === 1 ? 'dia' : 'dias'}`,
        });
    }

    return stats;
};

/**
 * O rotulo do numerao — a EXP.
 *
 * Ela encabeca as duas pecas porque e o que o dia RENDEU, e render nao depende
 * de ter sido planejado: quem so registra o que fez ganha EXP igual. Era o que
 * a placa ja fazia; o painel e que estava com outra ideia.
 */
export const dailyHeroLabel = (isToday: boolean): string =>
    isToday ? 'EXP acumulado' : 'EXP registrado';
