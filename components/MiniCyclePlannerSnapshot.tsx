import React, { useMemo } from 'react';
import type { ReportAtlasWeek, ReportAtlasTaskItem } from '../types';
import { LIFE_AREA_BY_ID, normalizeLifeAreaId } from '../constants/lifeAreas';

interface MiniCyclePlannerSnapshotProps {
    weeks?: ReportAtlasWeek[];
    accentColor?: string;
    className?: string;
    compact?: boolean;
    spacious?: boolean;
    /**
     * Deixa as semanas dividirem o espaco que o pai oferecer, ATE UM TETO.
     *
     * Sem isto a altura da linha e uma tabela fixa que encolhe conforme o ciclo
     * cresce (52px com duas semanas, 24px com cinco): cada acao vira uma barra
     * de 4px, menor que a borda da propria celula, e nao ha o que ver. Com isto
     * e sem teto acontece o oposto — um ciclo de uma semana ocupa a tela toda e
     * a foto do planner vira grafico de barras.
     *
     * O teto e por SEMANA, nao pelo bloco: uma semana desenha do tamanho de uma
     * semana, duas desenham duas faixas do mesmo tamanho, e so quando nao cabe
     * mais e que elas comecam a se apertar.
     */
    fill?: boolean;
    style?: React.CSSProperties;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/**
 * A FAIXA DA SEMANA TEM UM TAMANHO, E ELE NAO DEPENDE DA TELA.
 *
 * Teto por semana e teto do bloco inteiro. Uma semana desenha 96px de altura;
 * duas desenham duas faixas de 96; a partir de quatro elas passam a dividir os
 * 300px do bloco, ate o piso de 30px — abaixo disso a barra de uma acao fica
 * menor que a borda da celula e a foto do planner deixa de mostrar o planner.
 *
 * E conta fechada de proposito: esticar para o espaco que sobrar fazia um ciclo
 * de uma semana ocupar meia tela e virar grafico de barras, e deixava uma caixa
 * vazia embaixo quando o teto por semana segurava a linha.
 */
const PLANNER_WEEK_MAX_HEIGHT = 96;
const PLANNER_WEEK_MIN_HEIGHT = 30;
// O bloco inteiro nao passa disto. Uma semana desenha os 96px cheios; a partir
// de duas elas dividem este teto, porque acima dele o planner passa a empurrar o
// card do ciclo para fora do palco — e quem tem que ceder e a foto, nao o card.
// 206 estourava o palco da cena em 19px e cortava a quarta semana. 186 fecha a
// conta com folga de uma linha: placa reduzida (314) + vao + planner + rodape.
const PLANNER_BLOCK_HEIGHT = 168;

/**
 * QUATRO SEMANAS DESENHADAS, O RESTO CONTADO.
 *
 * Dividir o bloco por todas as semanas funciona ate certo ponto: num ciclo de
 * doze, cada faixa fica com 17px e a barra de uma acao deixa de existir — o
 * planner vira textura. Entao ele desenha as quatro primeiras semanas em tamanho
 * legivel e diz quantas ficaram de fora, em vez de fingir que mostrou todas.
 */
const MAX_SEMANAS_DESENHADAS = 4;
const ALTURA_DO_RESTO = 17;

const alturaDaSemana = (totalDeSemanas: number) => {
    const desenhadas = Math.min(Math.max(totalDeSemanas, 1), MAX_SEMANAS_DESENHADAS);
    const disponivel = PLANNER_BLOCK_HEIGHT - (totalDeSemanas > MAX_SEMANAS_DESENHADAS ? ALTURA_DO_RESTO : 0);
    return Math.max(
        PLANNER_WEEK_MIN_HEIGHT,
        Math.min(PLANNER_WEEK_MAX_HEIGHT, Math.floor(disponivel / desenhadas)),
    );
};
const START_MINUTE = 4 * 60;
const END_MINUTE = 24 * 60;
const TOTAL_MINUTES = END_MINUTE - START_MINUTE;

const palette = ['#EAB308', '#22C55E', '#3B82F6', '#F97316', '#EC4899', '#14B8A6', '#A855F7', '#F43F5E'];

const getArenaColor = (arenaKey: string, areaKey?: string) => {
    const normalizedArea = normalizeLifeAreaId(areaKey || arenaKey);
    if (normalizedArea !== 'geral') return LIFE_AREA_BY_ID[normalizedArea].color;

    const input = arenaKey || 'glyph';
    let hash = 0;
    for (let index = 0; index < input.length; index += 1) {
        hash = ((hash << 5) - hash) + input.charCodeAt(index);
        hash |= 0;
    }
    return palette[Math.abs(hash) % palette.length];
};

const getTaskStyle = (item: ReportAtlasTaskItem) => {
    const startTime = Number.isFinite(item.startTime) ? item.startTime : START_MINUTE;
    const clampedStart = Math.max(START_MINUTE, Math.min(startTime, END_MINUTE));
    const duration = Math.max(12, Math.min(item.duration || 20, TOTAL_MINUTES));
    const top = ((clampedStart - START_MINUTE) / TOTAL_MINUTES) * 100;
    const height = Math.max(8, (duration / TOTAL_MINUTES) * 100);

    return {
        top: `${Math.min(top, 96)}%`,
        height: `${Math.min(height, 32)}%`,
        // Percentual sozinho some quando a faixa e baixa: 6% de 34px e 2px, que
        // e menos que a borda da celula. O piso em pixel garante que a acao
        // continue sendo um risco colorido em vez de nada.
        minHeight: '3px',
        backgroundColor: getArenaColor(item.arenaId || item.arenaName, item.areaId),
        opacity: item.completed ? 0.92 : 0.3,
        boxShadow: item.completed ? '0 0 4px rgba(255,255,255,0.18)' : 'none',
    };
};

export const MiniCyclePlannerSnapshot: React.FC<MiniCyclePlannerSnapshotProps> = ({
    weeks = [],
    accentColor = '#D4AF37',
    className = '',
    compact = false,
    spacious = false,
    fill = false,
    style,
}) => {
    const days = useMemo(() => weeks.flatMap((week) => week.days.map((day, dayIndex) => ({
        ...day,
        weekIndex: week.weekIndex,
        isWeekStart: dayIndex === 0,
    }))), [weeks]);

    const dayWidth = days.length >= 28 ? 8 : days.length >= 21 ? 10 : days.length >= 14 ? 12 : 14;
    const totalCompleted = useMemo(() => days.reduce((sum, day) => sum + day.completedCount, 0), [days]);
    const totalPlanned = useMemo(() => days.reduce((sum, day) => sum + day.plannedCount, 0), [days]);

    if (days.length === 0) {
        return (
            <div className={`${compact ? 'px-1 py-1.5' : 'rounded-2xl border border-white/10 bg-black/25 p-3'} ${className}`} style={style}>
                <p className={`${compact ? 'text-[8px] text-gray-600' : 'text-[10px] text-gray-500'} font-black uppercase tracking-[0.22em]`}>Sem planner consolidado</p>
            </div>
        );
    }

    if (compact) {
        const compactRowHeight = spacious ? (weeks.length <= 2 ? 52 : weeks.length <= 4 ? 36 : 24) : weeks.length <= 1 ? 26 : weeks.length === 2 ? 18 : 12;
        // Com `fill` as semanas dividem a altura disponivel; sem ele, cada uma
        // recebe a altura da tabela acima. Uma semana = uma faixa, sempre.
        const alturaDaLinha = fill ? alturaDaSemana(weeks.length) : compactRowHeight;
        const semanasVisiveis = fill ? weeks.slice(0, MAX_SEMANAS_DESENHADAS) : weeks;
        const semanasDeFora = fill ? weeks.length - semanasVisiveis.length : 0;
        const mostraDia = fill ? weeks.length <= 4 : weeks.length <= 2;

        return (
            <div className={`px-0 py-0 ${spacious ? 'legacy-planner-readable' : ''} ${className}`} style={style}>
                <div className="space-y-[2px] overflow-hidden rounded-[6px] border border-white/6 bg-black/20 px-[2px] py-[2px]">
                    {semanasVisiveis.map((week) => (
                        <div
                            key={`${week.weekIndex}-${week.startDate}`}
                            className="grid items-center gap-[2px]"
                            style={{ gridTemplateColumns: '12px repeat(7, minmax(0, 1fr))', height: `${alturaDaLinha}px` }}
                        >
                            <span className="text-center text-[5px] font-black leading-none text-gray-500">S{week.weekIndex}</span>
                            {week.days.map((day) => {
                                const completionRatio = day.plannedCount > 0 ? day.completedCount / day.plannedCount : 0;
                                const items = [...day.scheduledItems, ...day.unscheduledItems];

                                return (
                                    <div
                                        key={day.date}
                                        className="relative h-full min-w-0 overflow-hidden rounded-[3px] border border-white/10 bg-white/[0.04]"
                                        title={`${day.date} - ${day.completedCount}/${day.plannedCount}: ${items.map((item) => `${item.completed ? 'feito' : 'pendente'} ${item.actionName}`).join(', ') || 'sem ações'}`}
                                    >
                                        <div
                                            className="absolute inset-x-0 bottom-0"
                                            style={{
                                                height: `${Math.max(5, completionRatio * 100)}%`,
                                                // 9% -> 30% de alfa era invisivel sobre o card escuro: um dia
                                                // com 3 de 5 feitos desenhava o mesmo que um dia vazio.
                                                background: `linear-gradient(180deg, ${accentColor}33 0%, ${accentColor}a8 100%)`,
                                            }}
                                        />
                                        {mostraDia && (
                                            <span className="absolute left-[1px] top-[1px] z-10 text-[4px] font-black leading-none text-white/40">
                                                {day.date.slice(-2)}
                                            </span>
                                        )}
                                        {day.scheduledItems.map((item) => (
                                            <span
                                                key={item.taskId}
                                                className="absolute left-[1px] right-[1px] rounded-[1px]"
                                                style={getTaskStyle(item)}
                                            />
                                        ))}
                                        <div className="absolute inset-x-[1px] bottom-[1px] flex flex-wrap items-end justify-center gap-[1px]">
                                            {day.unscheduledItems.map((item) => (
                                                <span
                                                    key={item.taskId}
                                                    className="h-[2px] min-w-[2px] flex-1 rounded-full"
                                                    style={{
                                                        backgroundColor: getArenaColor(item.arenaId || item.arenaName, item.areaId),
                                                        opacity: item.completed ? 0.95 : 0.28,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {Array.from({ length: Math.max(0, 7 - week.days.length) }).map((_, index) => (
                                <span key={`empty-${index}`} style={{ height: `${alturaDaLinha}px` }} />
                            ))}
                        </div>
                    ))}
                    {semanasDeFora > 0 && (
                        <p
                            className="flex items-center justify-center text-[9px] font-black uppercase tracking-[0.18em] text-white/38"
                            style={{ height: `${ALTURA_DO_RESTO}px` }}
                        >
                            + {semanasDeFora} {semanasDeFora === 1 ? 'semana' : 'semanas'}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    const compactTimelineGridStyle = compact
        ? {
            display: 'grid',
            gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
            alignItems: 'end',
            gap: '2px',
            width: '100%',
        } satisfies React.CSSProperties
        : undefined;

    const expandedTimelineStyle = !compact
        ? {
            minWidth: `${(dayWidth + 2) * days.length}px`,
        } satisfies React.CSSProperties
        : undefined;

    return (
        <div className={`${compact ? 'px-0 py-0' : 'rounded-[22px] border border-white/10 bg-black/35 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]'} ${className}`} style={style}>
            {!compact && (
                <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Planner mini</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{totalCompleted}/{totalPlanned}</p>
                </div>
            )}
            <div className={`${compact ? 'overflow-hidden rounded-[6px] border border-white/6 bg-transparent px-[2px] py-[2px]' : 'overflow-hidden rounded-[18px] border border-white/5 bg-[#060606] px-2 py-2'}`}>
                <div
                    className={compact ? '' : 'flex items-end gap-[2px]'}
                    style={compact ? compactTimelineGridStyle : expandedTimelineStyle}
                >
                    {days.map((day) => {
                        const completionRatio = day.plannedCount > 0 ? day.completedCount / day.plannedCount : 0;
                        return (
                            <div key={day.date} className="flex min-w-0 flex-col items-center gap-1" style={compact ? undefined : { width: `${dayWidth}px` }}>
                                <div className={`${compact ? 'text-[6px]' : 'text-[7px]'} font-black leading-none text-gray-600`}>{day.date.slice(-2)}</div>
                                <div
                                    className={`relative ${compact ? 'h-[26px] rounded-[4px]' : 'h-[88px] rounded-[10px]'} w-full overflow-hidden border border-white/6 bg-white/[0.01]`}
                                    style={{ boxShadow: day.isWeekStart ? `inset 1px 0 0 ${accentColor}` : undefined }}
                                    title={`${day.date} - ${day.completedCount}/${day.plannedCount}: ${[...day.scheduledItems, ...day.unscheduledItems].map((item) => `${item.completed ? 'feito' : 'pendente'} ${item.actionName}`).join(', ') || 'sem ações'}`}
                                >
                                    <div
                                        className="absolute inset-x-0 bottom-0 bg-white/5"
                                        style={{ height: `${Math.max(6, completionRatio * 100)}%`, background: `linear-gradient(180deg, ${accentColor}22 0%, ${accentColor}55 100%)` }}
                                    />
                                    {day.scheduledItems.map((item) => (
                                        <div
                                            key={item.taskId}
                                            className="absolute left-[2px] right-[2px] rounded-sm"
                                            style={getTaskStyle(item)}
                                        />
                                    ))}
                                    {day.unscheduledItems.length > 0 && (
                                        <div className="absolute inset-x-[2px] bottom-[2px] flex flex-wrap justify-center gap-[2px]">
                                            {day.unscheduledItems.map((item) => (
                                                <span
                                                    key={item.taskId}
                                                    className="h-[3px] min-w-[3px] flex-1 rounded-full"
                                                    style={{
                                                        backgroundColor: getArenaColor(item.arenaId || item.arenaName, item.areaId),
                                                        opacity: item.completed ? 0.95 : 0.3,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className={`${compact ? 'text-[6px]' : 'text-[7px]'} font-black leading-none text-gray-500`}>{day.isWeekStart ? `S${day.weekIndex}` : '-'}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

