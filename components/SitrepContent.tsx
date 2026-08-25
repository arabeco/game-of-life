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
            className={`relative overflow-hidden rounded-[20px] border px-3 py-2 text-white ${isFreeAction ? 'free-action-shell free-action-outline' : 'border-white/12'}`}
            style={isFreeAction
                ? {
                    ['--free-action-bg' as string]: String(backgroundStyle.background || 'var(--asset-grad-default)'),
                }
                : backgroundStyle}
        >
            {!isFreeAction && <div className="absolute inset-0 bg-black/32" />}
            <div className="relative z-10 flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-black/30">
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

export const SitrepContent: React.FC<{ onClose?: () => void; selectedDateOverride?: string | null }> = ({ onClose, selectedDateOverride }) => {
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
    const title = isToday ? 'Resumo de hoje' : `Resumo de ${dateLabel}`;
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
            title: 'Meu Resumo Diario - Glyph',
            preparingMessage: 'Preparando resumo...',
            sharedMessage: 'Resumo diario compartilhado.',
            cancelledMessage: 'Compartilhamento cancelado.',
            errorMessage: 'Nao foi possivel preparar o resumo.',
        });
    };

    const handlePostToFeed = () => {
        addFeedEvent({
            type: 'REPORT_COMPLETED',
            content: {
                title: `Resumo diario ${dateLabel}`,
                icon: '\u{1F4CA}',
                score: dayProgress,
            },
        });
        showToast('Resumo diario postado no feed.', 'success');
    };

    return (
        <div className="space-y-4">
            <div id="daily-summary-capture-area" className="relative overflow-hidden rounded-[24px] border border-[var(--skin-accent-color)]/20 bg-black/28 p-4 shadow-[inset_0_0_24px_rgba(255,255,255,0.025)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--skin-accent-color)_0%,transparent_62%)] opacity-12" />
                <div className="relative z-10 space-y-4">
                    <div className="text-center">
                        {greeting && (
                            <p className="mb-1.5 text-[11px] font-medium italic leading-relaxed text-white/55">
                                {greeting.text}
                            </p>
                        )}
                        <p className="core-label text-[var(--skin-accent-color)]">Resumo Diario</p>
                        <h3 className="mt-1 arena-title-text text-xl text-white luxe-title-shadow leading-tight">{title}</h3>
                    </div>

                    {historicalInsight && (
                        <div className="sitrep-neutral-panel flex items-start gap-3 rounded-2xl border border-[var(--skin-accent-color)]/16 p-3 text-left">
                            <OracleSpeakerMark tone="info" size="sm" className="mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <p className="core-label text-[var(--skin-accent-color)]">Leitura do Oraculo</p>
                                <p className="mt-1 text-[11px] leading-relaxed text-white/78">{historicalInsight}</p>
                            </div>
                        </div>
                    )}

                    {todayReading && (
                        <div className="sitrep-neutral-panel flex items-start gap-3 rounded-2xl border border-[var(--skin-accent-color)]/16 p-3 text-left">
                            <OracleSpeakerMark tone="info" size="sm" className="mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="core-label text-[var(--skin-accent-color)]">Leitura do Oraculo</p>
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
                                <p className="mt-1 text-[11px] leading-relaxed text-white/78">{todayReading.text}</p>
                                {todayReading.comparison && (
                                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--skin-accent-color)]/80">
                                        {todayReading.comparison}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <ArenaPactBalloon />

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

                    <div className="grid grid-cols-3 gap-2">
                        <PanelMetric label="Feitas" value={`${completedRows.length}/${dailyRows.length}`} hint="acoes do dia" />
                        <PanelMetric label="EXP" value={`+${dayExp}`} hint="confirmado" accent />
                        <PanelMetric label="Ritmo" value={`${dayProgress}%`} hint="acoes com XP" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <PanelMetric
                            label="Checklist"
                            value={`${checklistCompleted}/${checklistTotal}`}
                            hint={checklistTotal > 0 ? 'itens marcados' : 'sem itens'}
                        />
                        <PanelMetric
                            label="Streak"
                            value={userProfile.dailyProofStreak?.current || 0}
                            hint="sequencia atual"
                            accent={(userProfile.dailyProofStreak?.current || 0) > 0}
                        />
                    </div>

                    {topArena && (
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

                    {cyclePattern && (
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

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <p className="core-label">Acoes do dia</p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">somente leitura</p>
                        </div>
                        <div className="max-h-56 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                            {dailyRows.map((row) => (
                                <ActionSummaryCard
                                    key={row.task.id}
                                    row={row}
                                    getActionBackgroundStyle={getActionBackgroundStyle}
                                />
                            ))}
                            {dailyRows.length === 0 && (
                                <div className="sitrep-neutral-panel rounded-2xl p-4 text-center">
                                    <CheckCircleIcon className="mx-auto h-6 w-6 text-white/35" />
                                    <p className="mt-2 text-xs text-gray-500">Nenhuma acao registrada para este dia.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="text-center text-[10px] text-gray-500">
                        Este painel nao trava metas nem julga o dia. Ele so le as acoes registradas no Planner e mostra o padrao do ciclo.
                    </p>
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
                    aria-label="Compartilhar resumo diario"
                >
                    <ShareIcon className="h-5 w-5" />
                </button>
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
            </div>

            <ShareChoiceSheet
                isOpen={isShareChoiceOpen}
                title="Resumo diario"
                subtitle="Escolha se quer compartilhar a imagem ou publicar esse resumo no feed."
                onShareImage={handleShareImage}
                onPostToFeed={handlePostToFeed}
                onClose={() => setIsShareChoiceOpen(false)}
            />
        </div>
    );
};
