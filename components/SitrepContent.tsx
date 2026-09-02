import React, { useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { CheckCircleIcon, ClockIcon, ShareIcon, SquareCheckIcon, TrophyIcon, ZapIcon } from './Icons';
import { Action, ScheduledTask } from '../types';
import { shareElementWithFeedback } from './Share';
import { ShareChoiceSheet } from './ShareChoiceSheet';
import { getOperationalDateString, shiftLocalDateString, taskMatchesOperationalDate } from '../utils/operationalDay.js';
import { getCycleTimingSummary } from '../utils/dateUtils';
import { filterCycleTasksByScope } from '../utils/coreLoopUtils.js';
import './core-ui.css';
import { EmojiGlyph } from './EmojiGlyph';
import { OracleSpeakerMark } from './OracleSpeakerMark';
import { buildHistoricalDailyInsight, buildTodayDailyReading, type DailyReadingDepth } from '../utils/dailyInsights';
import { ArenaPactBalloon } from './ArenaPactBalloon';
import { pickOracleOpeningLine, ORACLE_FREE_TONE } from '../constants/oracleSpeechLibrary';
import { DEFAULT_ORACLE_PRESENCE_LEVEL, hasSpokenOpeningLineToday, markOpeningLineSpoken } from '../utils/oracleFeedUtils';
import { getOraclePresenceRules } from '../constants/oraclePresencePolicy';
import { hasPlatinumAccess, hasPremiumAccess } from '../utils/premiumAccess';

type DailyActionRow = {
    task: ScheduledTask;
    action: Action;
    isScored: boolean;
};

type DailyPatternDay = {
    date: string;
    total: number;
    completed: number;
    exp: number;
};

const formatPanelDate = (date: string) => {
    const parsed = new Date(`${date}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(parsed);
};

const getTaskExp = (task: ScheduledTask, action?: Action | null) => {
    if (action?.actionType === 'Livre') return 0;
    const duration = Number.isFinite(task.duration) ? Number(task.duration) : Number(action?.duration || 0);
    return Math.max(0, Math.round(duration));
};

const getDatesBetween = (startDate: string, endDate: string) => {
    const dates: string[] = [];
    const cursor = new Date(`${startDate}T12:00:00`);
    const end = new Date(`${endDate}T12:00:00`);
    if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime())) return dates;

    while (cursor <= end) {
        dates.push(cursor.toISOString().slice(0, 10));
        cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
};

const buildPerfectDayStreak = (days: DailyPatternDay[], selectedDate: string) => {
    const byDate = new Map(days.map((day) => [day.date, day]));
    let cursor = selectedDate;
    let streak = 0;

    while (true) {
        const day = byDate.get(cursor);
        if (!day || day.total <= 0 || day.completed < day.total) break;
        streak += 1;
        cursor = shiftLocalDateString(cursor, -1);
    }

    return streak;
};

const PanelMetric: React.FC<{ label: string; value: string | number; hint?: string; accent?: boolean }> = ({
    label,
    value,
    hint,
    accent = false,
}) => (
    <div className="sitrep-neutral-panel rounded-2xl p-3 text-center">
        <p className="core-label">{label}</p>
        <p className={`mt-1 arena-title-text text-2xl leading-tight ${accent ? 'accent-text luxe-title-shadow' : 'text-white'}`}>
            {value}
        </p>
        {hint && <p className="mt-1 text-[10px] text-gray-500">{hint}</p>}
    </div>
);

const ActionSummaryCard: React.FC<{
    row: DailyActionRow;
    getActionBackgroundStyle: (actionId: string) => React.CSSProperties;
}> = ({ row, getActionBackgroundStyle }) => {
    const isFreeAction = row.action.actionType === 'Livre';
    const backgroundStyle = getActionBackgroundStyle(row.action.id);
    const exp = getTaskExp(row.task, row.action);

    return (
        <div
            className={`relative overflow-hidden rounded-[18px] border px-2.5 py-1.5 text-white ${isFreeAction ? 'free-action-shell free-action-outline' : 'border-white/12'}`}
            style={isFreeAction
                ? {
                    ['--free-action-bg' as string]: String(backgroundStyle.background || 'var(--asset-grad-default)'),
                }
                : backgroundStyle}
        >
            {!isFreeAction && <div className="absolute inset-0 bg-black/32" />}
            <div className="relative z-10 flex min-w-0 items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-black/30">
                    <EmojiGlyph symbol={row.action.icon || '\u{1F4DD}'} size="action" className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-black uppercase tracking-[0.08em] text-white">
                        {row.action.name}
                    </div>
                    <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/48">
                        {row.task.completed ? 'Concluida' : 'Pendente'}{exp > 0 ? ` · ${exp} XP` : ' · Livre'}
                    </div>
                </div>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${row.task.completed ? 'border-emerald-300/35 bg-emerald-300/10 text-emerald-200' : 'border-white/12 bg-black/24 text-white/35'}`}>
                    {row.task.completed ? <SquareCheckIcon className="h-3.5 w-3.5" /> : <ClockIcon className="h-3.5 w-3.5" />}
                </div>
            </div>
        </div>
    );
};

/**
 * `fillHeight` faz o painel ocupar exatamente a altura que recebe, em vez de
 * crescer e empurrar rolagem para fora.
 *
 * Na tela de descanso ele abre grande e nao deve rolar: o unico trecho que rola
 * e a lista de acoes, por dentro. No SitrepModal o comportamento certo e o
 * contrario — la o proprio modal rola —, por isso isto e opcional e nao padrao.
 */
export const SitrepContent: React.FC<{
    onClose?: () => void;
    selectedDateOverride?: string | null;
    fillHeight?: boolean;
}> = ({ onClose, selectedDateOverride, fillHeight = false }) => {
    const {
        activeCycle,
        dailyCommitment,
        actions,
        tasks,
        getArenas,
        checklistItems,
        showToast,
        addFeedEvent,
        userProfile,
        getActionBackgroundStyle,
        reports,
        oraclePreferences,
    } = useGame();

    const [isShareChoiceOpen, setIsShareChoiceOpen] = useState(false);
    const selectedDate = selectedDateOverride || dailyCommitment?.date || getOperationalDateString();

    /**
     * Olhando um dia que nao e hoje, algumas coisas param de ser verdade.
     *
     * A leitura do Oraculo e a proposta de missao falam do AGORA — mostra-las
     * sobre o painel de ontem seria apresentar o presente como se fosse aquele
     * dia. E a sequencia atual nao pertence a nenhum dia especifico: no lugar
     * dela, ontem mostra como o dia fechou, que e a pergunta que se faz sobre
     * ontem.
     */
    const ehHoje = selectedDate === getOperationalDateString();
    const actionsById = useMemo(() => new Map(actions.map((action) => [action.id, action])), [actions]);
    const arenas = getArenas();
    const arenasById = useMemo(() => new Map(arenas.map((arena) => [arena.id, arena])), [arenas]);

    const dailyRows = useMemo<DailyActionRow[]>(() => {
        return tasks
            .filter((task) => taskMatchesOperationalDate(task, selectedDate))
            .map((task) => {
                const action = actionsById.get(task.actionId);
                if (!action) return null;
                return {
                    task,
                    action,
                    isScored: action.actionType !== 'Livre',
                };
            })
            .filter((row): row is DailyActionRow => Boolean(row))
            .sort((left, right) => {
                if (left.task.completed !== right.task.completed) return left.task.completed ? -1 : 1;
                return left.action.name.localeCompare(right.action.name);
            });
    }, [actionsById, selectedDate, tasks]);

    const scoredRows = dailyRows.filter((row) => row.isScored);
    const completedRows = dailyRows.filter((row) => row.task.completed);
    const completedScoredRows = scoredRows.filter((row) => row.task.completed);
    const dayExp = completedScoredRows.reduce((sum, row) => sum + getTaskExp(row.task, row.action), 0);
    const dayProgress = scoredRows.length > 0 ? Math.round((completedScoredRows.length / scoredRows.length) * 100) : (dailyRows.length > 0 ? 100 : 0);
    const checklistCompleted = checklistItems.filter((item) => item.completed).length;
    const checklistTotal = checklistItems.length;

    const arenaStats = useMemo(() => {
        const stats = new Map<string, { name: string; completed: number; total: number; exp: number }>();
        for (const row of dailyRows) {
            const arena = arenasById.get(row.action.arenaId);
            const name = arena?.name || 'Sem arena';
            const entry = stats.get(row.action.arenaId) || { name, completed: 0, total: 0, exp: 0 };
            entry.total += 1;
            if (row.task.completed) {
                entry.completed += 1;
                entry.exp += getTaskExp(row.task, row.action);
            }
            stats.set(row.action.arenaId, entry);
        }

        return Array.from(stats.values()).sort((left, right) => {
            if (right.completed !== left.completed) return right.completed - left.completed;
            return right.exp - left.exp;
        });
    }, [arenasById, dailyRows]);

    const cyclePattern = useMemo(() => {
        if (!activeCycle) return null;

        const cycleTasks = filterCycleTasksByScope(tasks, actions, activeCycle, activeCycle.startDate, activeCycle.endDate);
        const cycleDates = getDatesBetween(activeCycle.startDate, activeCycle.endDate);
        const days = cycleDates.map<DailyPatternDay>((date) => {
            const dayTasks = cycleTasks.filter((task) => taskMatchesOperationalDate(task, date));
            const scoredDayTasks = dayTasks.filter((task) => actionsById.get(task.actionId)?.actionType !== 'Livre');
            const completed = scoredDayTasks.filter((task) => task.completed);
            return {
                date,
                total: scoredDayTasks.length,
                completed: completed.length,
                exp: completed.reduce((sum, task) => sum + getTaskExp(task, actionsById.get(task.actionId)), 0),
            };
        });

        const perfectDays = days.filter((day) => day.total > 0 && day.completed === day.total).length;
        const activeDays = days.filter((day) => day.completed > 0 || day.total > 0).length;
        const emptyDays = days.filter((day) => day.total === 0 && day.date <= selectedDate).length;
        const bestDay = [...days].sort((left, right) => {
            if (right.exp !== left.exp) return right.exp - left.exp;
            return right.completed - left.completed;
        })[0] || null;
        const currentPerfectStreak = buildPerfectDayStreak(days, selectedDate);
        const totalExp = days.reduce((sum, day) => sum + day.exp, 0);
        const totalPlanned = days.reduce((sum, day) => sum + day.total, 0);
        const totalCompleted = days.reduce((sum, day) => sum + day.completed, 0);
        const timing = getCycleTimingSummary(activeCycle.startDate, activeCycle.endDate, selectedDate);

        return {
            days,
            perfectDays,
            activeDays,
            emptyDays,
            bestDay,
            currentPerfectStreak,
            totalExp,
            totalPlanned,
            totalCompleted,
            timing,
            progress: totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0,
        };
    }, [actions, actionsById, activeCycle, selectedDate, tasks]);

    const topArena = arenaStats[0] || null;
    const dateLabel = formatPanelDate(selectedDate);
    const isToday = selectedDate === getOperationalDateString();
    const historicalInsight = useMemo(() => {
        if (isToday) return null;

        const previousActiveDays = (cyclePattern?.days || [])
            .filter((day) => day.date < selectedDate && day.completed > 0)
            .slice(-3);
        const previousActiveDaysAverage = previousActiveDays.length > 0
            ? previousActiveDays.reduce((sum, day) => sum + day.completed, 0) / previousActiveDays.length
            : null;

        return buildHistoricalDailyInsight({
            completedCount: completedRows.length,
            plannedCount: dailyRows.length,
            distinctArenaCount: arenaStats.filter((entry) => entry.completed > 0).length,
            arenaNames: arenaStats.filter((entry) => entry.completed > 0).map((entry) => entry.name),
            topArenaName: topArena?.name || null,
            topArenaCompleted: topArena?.completed || 0,
            previousActiveDaysAverage,
        });
    }, [arenaStats, completedRows.length, cyclePattern?.days, dailyRows.length, isToday, selectedDate, topArena]);

    // A fala de abertura, na frequencia que o nivel de presenca manda:
    // Silencioso nunca, Equilibrado uma por dia, Presente a cada abertura.
    // Sorteada uma vez por montagem para nao trocar de frase a cada re-render.
    const greeting = useMemo(() => {
        if (!isToday) return null;

        const rules = getOraclePresenceRules(oraclePreferences?.presenceLevel ?? DEFAULT_ORACLE_PRESENCE_LEVEL);
        if (rules.openingLine === 'nunca') return null;
        if (rules.openingLine === 'diaria' && hasSpokenOpeningLineToday(userProfile.id, selectedDate)) return null;

        const line = pickOracleOpeningLine(
            rules.value,
            oraclePreferences?.speechTone || ORACLE_FREE_TONE,
        );
        if (line && rules.openingLine === 'diaria') markOpeningLineSpoken(userProfile.id, selectedDate);
        return line;
        // Sem oraclePreferences nas dependencias de proposito: trocar o tom no
        // meio da sessao nao deve reescrever o cumprimento que ja esta na tela.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isToday, selectedDate, userProfile.id]);

    // O painel so falava de dias passados. Esta leitura cobre o dia corrente, e a
    // profundidade acompanha a assinatura: livre descreve, Premium compara com o
    // seu dia medio no ciclo, Platinum compara o ciclo com o seu historico.
    const readingDepth: DailyReadingDepth = hasPlatinumAccess(userProfile)
        ? 'platinum'
        : hasPremiumAccess(userProfile)
            ? 'premium'
            : 'livre';

    const todayReading = useMemo(() => {
        if (!isToday) return null;

        const previousActiveDays = (cyclePattern?.days || [])
            .filter((day) => day.date < selectedDate && day.completed > 0);
        const cycleActiveDayAverage = previousActiveDays.length > 0
            ? previousActiveDays.reduce((sum, day) => sum + day.completed, 0) / previousActiveDays.length
            : null;

        // Relatorios antigos podem nao ter executionRatePct; da para reconstruir.
        const pastRates = (reports || [])
            .map((report) => {
                const direct = report.metrics?.executionRatePct;
                if (typeof direct === 'number' && Number.isFinite(direct)) return direct;
                const done = Number(report.metrics?.actionsCompleted || 0);
                const planned = Number(report.metrics?.totalPlannedActions || 0);
                return planned > 0 ? (done / planned) * 100 : null;
            })
            .filter((rate): rate is number => typeof rate === 'number' && Number.isFinite(rate))
            .sort((left, right) => left - right);

        const median = pastRates.length > 0
            ? (pastRates.length % 2 === 1
                ? pastRates[(pastRates.length - 1) / 2]
                : (pastRates[pastRates.length / 2 - 1] + pastRates[pastRates.length / 2]) / 2)
            : null;

        return buildTodayDailyReading({
            completedCount: completedRows.length,
            plannedCount: dailyRows.length,
            distinctArenaCount: arenaStats.filter((entry) => entry.completed > 0).length,
            topArenaName: topArena?.name || null,
            streakCurrent: cyclePattern?.currentPerfectStreak || 0,
            cycleActiveDayAverage,
            currentCycleExecutionPct: typeof cyclePattern?.progress === 'number' ? cyclePattern.progress : null,
            pastCyclesExecutionMedianPct: median,
            pastCyclesCount: pastRates.length,
        }, readingDepth);
    }, [arenaStats, completedRows.length, cyclePattern, dailyRows.length, isToday, readingDepth, reports, selectedDate, topArena]);

    const handleShareImage = () => {
        void shareElementWithFeedback(showToast, 'daily-summary-capture-area', {
            title: 'Meu Resumo Diário - Glyph',
            preparingMessage: 'Preparando resumo...',
            sharedMessage: 'Resumo diário compartilhado.',
            cancelledMessage: 'Compartilhamento cancelado.',
            errorMessage: 'Não foi possível preparar o resumo.',
        });
    };

    const handlePostToFeed = () => {
        addFeedEvent({
            type: 'REPORT_COMPLETED',
            content: {
                title: `Resumo diário ${dateLabel}`,
                icon: '\u{1F4CA}',
                score: dayProgress,
            },
        });
        showToast('Resumo diário postado no feed.', 'success');
    };

    // Quantas linhas cabem sem rolagem. Numero fixo porque a altura disponivel
    // varia com o aparelho e medir em tempo de execucao para cortar lista costuma
    // piscar; o resto vira uma linha de "+N", que informa sem ocupar espaco.
    /**
     * O corte em cinco linhas saiu.
     *
     * Ele existia porque a lista nao rolava: mostrava cinco e dizia "+3 no
     * Planner", mandando a pessoa a outra tela para ver o resto do proprio dia.
     * Agora ela rola com a barra escondida, entao cortar so esconderia coisa que
     * cabe — e quem tem doze acoes e justamente quem mais precisa ve-las.
     */
    const visibleDailyRows = dailyRows;
    const hiddenDailyCount = 0;

    /**
     * Ontem em numeros, nao em lista.
     *
     * Uma lista de ontem responde "quais", e ninguem pergunta isso sobre um dia
     * que ja passou — pergunta-se "quanto" e "onde". Alem disso lista cresce e o
     * painel nao: com doze acoes, ontem empurraria o resto para fora da tela por
     * uma informacao que ninguem foi buscar.
     *
     * Por arena e o recorte que responde as duas: quanto voce entregou e em que
     * frentes da sua vida isso aconteceu.
     */
    const ontemPorArena = useMemo(() => {
        if (ehHoje) return [];
        const contagem = new Map<string, number>();
        for (const row of dailyRows) {
            if (!row.task.completed) continue;
            const nome = arenasById.get(row.action?.arenaId || '')?.name || 'Sem arena';
            contagem.set(nome, (contagem.get(nome) || 0) + 1);
        }
        return Array.from(contagem.entries())
            .sort((esquerda, direita) => direita[1] - esquerda[1])
            .slice(0, 6);
    }, [arenasById, dailyRows, ehHoje]);

    return (
        <div className={fillHeight ? 'flex h-full min-h-0 flex-col gap-3' : 'space-y-4'}>
            {/* Embutido, este bloco NAO desenha cartao: o GlassCard do painel ja e o
                cartao, e a borda arredondada aqui dentro criava cartao dentro de
                cartao — duas bordas, dois paddings, ~28px de largura e outro tanto
                de altura gastos so em moldura. No modal ele continua sendo o cartao,
                porque la ele e a unica moldura que existe. */}
            <div id="daily-summary-capture-area" className={`relative overflow-hidden ${fillHeight ? 'flex min-h-0 flex-1 flex-col' : 'rounded-[24px] border border-[var(--skin-accent-color)]/20 bg-black/28 shadow-[inset_0_0_24px_rgba(255,255,255,0.025)] p-4'}`}>
                {!fillHeight && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--skin-accent-color)_0%,transparent_62%)] opacity-12" />}
                <div className={`relative z-10 ${fillHeight ? 'flex min-h-0 flex-1 flex-col gap-3' : 'space-y-4'}`}>
                    {/* Antes empilhava quatro coisas dizendo a mesma: a saudacao, o
                        rotulo "Resumo Diário", o titulo "Resumo de hoje" — e o painel
                        que abriu ja tem "RESUMO DIÁRIO" no proprio cabecalho. Quem
                        abriu sabe onde esta. Sobra a data, que e a unica informacao. */}
                    <div className="text-center">
                        <h3 className="arena-title-text text-lg text-white luxe-title-shadow leading-tight">{dateLabel}</h3>
                    </div>

                    {/* No painel embutido o Oraculo fala UMA vez. Os dois blocos
                        empilhados eram dois paragrafos dele seguidos, e sao a maior
                        altura variavel da coluna — junto com a leitura de hoje, eram
                        o que estourava a tela em aparelho curto. A leitura de hoje
                        ganha, por ser a mais especifica. */}
                    {ehHoje && (!fillHeight || !todayReading) && historicalInsight && (
                        <div className="sitrep-neutral-panel flex items-start gap-3 rounded-2xl border border-[var(--skin-accent-color)]/16 p-3 text-left">
                            <OracleSpeakerMark tone="info" size="sm" className="mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                {/* Sem rotulo: o rosto do Oraculo ao lado ja diz de quem e a fala. */}
                                <p className={`text-[11px] leading-relaxed text-white/78 ${fillHeight ? 'line-clamp-3' : ''}`}>{historicalInsight}</p>
                            </div>
                        </div>
                    )}

                    {ehHoje && todayReading && (
                        <div className="sitrep-neutral-panel flex items-start gap-3 rounded-2xl border border-[var(--skin-accent-color)]/16 p-3 text-left">
                            <OracleSpeakerMark tone="info" size="sm" className="mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="core-label text-[var(--skin-accent-color)]">Leitura do Oráculo</p>
                                    {todayReading.depth === 'platinum' && (
                                        <span className="shrink-0 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-cyan-100">
                                            Platinum
                                        </span>
                                    )}
                                    {todayReading.depth === 'premium' && (
                                        <span className="shrink-0 rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-amber-100">
                                            Premium
                                        </span>
                                    )}
                                </div>
                                <p className={`mt-1 text-[11px] leading-relaxed text-white/78 ${fillHeight ? 'line-clamp-4' : ''}`}>{todayReading.text}</p>
                                {todayReading.comparison && (
                                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--skin-accent-color)]/80">
                                        {todayReading.comparison}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {ehHoje && <ArenaPactBalloon />}

                    {activeCycle && cyclePattern && (
                        <div className="sitrep-neutral-panel rounded-2xl p-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="core-label truncate">{activeCycle.name}</p>
                                    <p className="mt-1 text-[10px] text-gray-500">{cyclePattern.timing.statusLabel}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400">{cyclePattern.timing.elapsedDays}/{cyclePattern.timing.totalDays}</p>
                                    <p className="text-[10px] text-gray-500">dias</p>
                                </div>
                            </div>
                            <div className="sitrep-neutral-track mt-3 h-1.5 w-full rounded-full">
                                <div className="h-full rounded-full bg-[var(--skin-accent-color)]" style={{ width: `${Math.max(0, Math.min(100, cyclePattern.progress))}%` }} />
                            </div>
                            <p className="mt-1 text-[10px] text-gray-500">
                                Acoes do ciclo: {cyclePattern.totalCompleted}/{cyclePattern.totalPlanned}
                            </p>
                        </div>
                    )}

                    {/* Eram cinco numeros em duas grades, e dois nao diziam nada novo:
                        "Ritmo" e "Feitas" em porcentagem, e "Checklist" ja aparece
                        como badge no proprio botao de checklist, a dois centimetros
                        daqui na mesma tela. Sobram os tres que sao de hoje. */}
                    <div className="grid grid-cols-3 gap-2">
                        <PanelMetric label="Feitas" value={`${completedRows.length}/${dailyRows.length}`} hint="ações do dia" />
                        <PanelMetric label="EXP" value={`+${dayExp}`} hint="confirmado" accent />
                        {ehHoje ? (
                            <PanelMetric
                                label="Streak"
                                value={userProfile.dailyProofStreak?.current || 0}
                                hint="sequência atual"
                                accent={(userProfile.dailyProofStreak?.current || 0) > 0}
                            />
                        ) : (
                            <PanelMetric
                                label="Fechou em"
                                value={`${dayProgress}%`}
                                hint="do que tinha"
                                accent={dayProgress >= 100}
                            />
                        )}
                    </div>

                    {!fillHeight && topArena && (
                        <div className="sitrep-neutral-panel rounded-2xl p-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--skin-accent-color)]/25 bg-[var(--skin-accent-color)]/12">
                                    <TrophyIcon className="h-5 w-5 text-[var(--skin-accent-color)]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="core-label">Arena mais tocada</p>
                                    <p className="truncate text-sm font-bold text-white">{topArena.name}</p>
                                </div>
                                <div className="text-right text-[10px] text-gray-400">
                                    <div>{topArena.completed}/{topArena.total}</div>
                                    <div>{topArena.exp} XP</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Historia do ciclo, nao do dia — e "Sequencia" ficava ao lado de
                        "Streak" sendo outra coisa, dois numeros parecidos com nomes
                        parecidos. Vive no modal e na tela de historico, que agora
                        existe; o painel embutido responde so "como esta hoje". */}
                    {!fillHeight && cyclePattern && (
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="sitrep-neutral-panel rounded-xl p-2">
                                <p className="core-label">Perfeitos</p>
                                <p className="arena-title-text text-lg leading-tight text-white">{cyclePattern.perfectDays}</p>
                            </div>
                            <div className="sitrep-neutral-panel rounded-xl p-2">
                                <p className="core-label">Sequencia</p>
                                <p className="arena-title-text text-lg leading-tight text-white">{cyclePattern.currentPerfectStreak}</p>
                            </div>
                            <div className="sitrep-neutral-panel rounded-xl p-2">
                                <p className="core-label">Melhor dia</p>
                                <p className="text-xs font-bold leading-tight text-white">{cyclePattern.bestDay ? formatPanelDate(cyclePattern.bestDay.date) : '--'}</p>
                            </div>
                        </div>
                    )}

                    <div className={fillHeight ? 'flex min-h-0 flex-1 flex-col gap-2' : 'space-y-2'}>
                        <div className="flex items-center justify-between gap-2">
                            {/* Ontem pergunta "o que eu fiz"; hoje pergunta "o que falta".
                                E a mesma lista, e o rotulo e o que diz qual das duas
                                perguntas ela esta respondendo. */}
                            <p className="core-label">{ehHoje ? 'Ações de hoje' : 'O que foi feito'}</p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
                                {ehHoje ? `${completedRows.length}/${dailyRows.length}` : 'somente leitura'}
                            </p>
                        </div>
                        {/* A lista ROLA, com a barra escondida.
                            Com `overflow-hidden` ela cortava o ultimo cartao no
                            meio: a altura disponivel quase nunca e multipla da
                            altura de um cartao, entao sobrava sempre meio card
                            fatiado na borda. Meio cartao parece defeito; cartao
                            inteiro com rolagem escondida parece lista.
                            O que nao pode rolar e o PAINEL — esse continua fixo. */}
                        {!ehHoje ? (
                            <div className="flex flex-wrap gap-1.5">
                                {ontemPorArena.length > 0 ? ontemPorArena.map(([nome, quantas]) => (
                                    <span
                                        key={nome}
                                        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold text-white/70"
                                    >
                                        <span className="truncate max-w-[8rem]">{nome}</span>
                                        <span className="font-black text-[var(--skin-accent-color)]">{quantas}</span>
                                    </span>
                                )) : (
                                    <p className="w-full py-2 text-center text-[11px] text-white/35">
                                        Nada foi concluído nesse dia.
                                    </p>
                                )}
                            </div>
                        ) : (
                        <div className={`space-y-1.5 pr-1 hide-scrollbar ${fillHeight ? 'min-h-0 flex-1 overflow-y-auto' : 'max-h-56 overflow-y-auto'}`}>
                            {visibleDailyRows.map((row) => (
                                <ActionSummaryCard
                                    key={row.task.id}
                                    row={row}
                                    getActionBackgroundStyle={getActionBackgroundStyle}
                                />
                            ))}
                            {dailyRows.length === 0 && (
                                <div className="sitrep-neutral-panel rounded-2xl p-4 text-center">
                                    <CheckCircleIcon className="mx-auto h-6 w-6 text-white/35" />
                                    <p className="mt-2 text-xs text-gray-500">Nenhuma ação registrada para este dia.</p>
                                </div>
                            )}
                        </div>
                        )}
                    </div>

                    {!fillHeight && (
                        <p className="text-center text-[10px] text-gray-500">
                            Este painel não trava metas nem julga o dia. Ele so le as ações registradas no Planner e mostra o padrao do ciclo.
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {onClose && (
                    <button onClick={onClose} className="w-full rounded-xl luxe-button-secondary py-2 text-sm">
                        Fechar
                    </button>
                )}
                <button
                    onClick={() => setIsShareChoiceOpen(true)}
                    className="rounded-xl luxe-button-secondary p-3"
                    aria-label="Compartilhar resumo diário"
                >
                    <ShareIcon className="h-5 w-5" />
                </button>
                {/* "Ver no Planner" so existe no MODAL.
                    Dentro do painel da tela de descanso ele mentia: dispara
                    `planner:focus-date` e avisa "Planner aberto em...", mas a tela
                    de descanso nao navega para lugar nenhum e nao ha onClose ali —
                    a pessoa continuava exatamente onde estava, lendo um toast que
                    dizia o contrario. */}
                {!fillHeight && (
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('planner:focus-date', {
                                detail: {
                                    dateString: selectedDate,
                                    viewMode: 'day',
                                },
                            }));
                            showToast(`Planner aberto em ${selectedDate}.`);
                            if (onClose) onClose();
                        }}
                        className="w-full rounded-xl luxe-skin-button py-2 text-sm"
                    >
                        Ver no Planner
                    </button>
                )}
            </div>

            <ShareChoiceSheet
                isOpen={isShareChoiceOpen}
                title="Resumo diário"
                subtitle="Escolha se quer compartilhar a imagem ou publicar esse resumo no feed."
                onShareImage={handleShareImage}
                onPostToFeed={handlePostToFeed}
                onClose={() => setIsShareChoiceOpen(false)}
            />
        </div>
    );
};
