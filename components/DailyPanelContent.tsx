import { DailySummaryCard } from './DailySummaryCard';
import { useDailyComparison } from '../hooks/useDailyComparison';
import { dailyComparisonLabel } from '../utils/dailyComparison';
import type { DailyFeedSnapshot } from '../types';
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
import './daily-review.css';
import { EmojiGlyph } from './EmojiGlyph';
import { OracleSpeakerMark } from './OracleSpeakerMark';
import { buildHistoricalDailyInsight, buildTodayDailyReading, type DailyReadingDepth } from '../utils/dailyInsights';
import { ArenaPactBalloon } from './ArenaPactBalloon';
import { getTaskExp, getTaskMinutes } from '../utils/taskExp';
import { getCycleXpBonusRate } from '../utils/premiumAccess';
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

/** Minutos em "9h15". Recebe MINUTOS, nunca EXP — os dois nao sao a mesma coisa. */
const formatarDuracao = (minutos: number): string => {
    const total = Math.max(0, Math.round(minutos));
    const horas = Math.floor(total / 60);
    const restante = total % 60;
    if (horas <= 0) return restante + 'min';
    return restante > 0 ? horas + 'h' + String(restante).padStart(2, '0') : horas + 'h';
};

const formatPanelDate = (date: string) => {
    const parsed = new Date(`${date}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(parsed);
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

export const DailyPanelContent: React.FC<{
    onClose?: () => void;
    selectedDateOverride?: string | null;
    fillHeight?: boolean;
}> = ({ onClose, selectedDateOverride, fillHeight = false }) => {
    const {
        activeCycle,
        cycleExpBonus,
        roundExpBonus,
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
    const selectedDate = selectedDateOverride || getOperationalDateString();

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

    /**
     * O QUE ESPERA NA BAIA NAO E "AÇÃO DO DIA".
     *
     * `start_time = -1` significa sem horario: a tarefa esta na baia, esperando
     * ser puxada para algum dia. Ela carrega uma data no banco por construcao,
     * mas ninguem se comprometeu com ela naquela data — e o denominador estava
     * contando como se alguem tivesse.
     *
     * O efeito era pior do que parece: uma acao recorrente pode ter uma copia
     * agendada E uma copia na baia no mesmo dia. Quem cumpriu a agendada via a
     * copia da baia entrar como "nao feita" ao lado dela — o dia fechado inteiro
     * aparecia como 75%, e as tres faltantes eram um misterio porque duas delas
     * tinham gemea concluida na mesma lista.
     *
     * Concluida entra sempre, com horario ou sem: fazer sem ter marcado hora
     * continua sendo fazer.
     */
    const rowsNaBaia = dailyRows.filter((row) => !row.task.completed && row.task.startTime < 0);
    const rowsDoDia = dailyRows.filter((row) => row.task.completed || row.task.startTime >= 0);

    const scoredRows = rowsDoDia.filter((row) => row.isScored);
    const completedRows = rowsDoDia.filter((row) => row.task.completed);
    const completedScoredRows = scoredRows.filter((row) => row.task.completed);
    const dayExp = completedScoredRows.reduce((sum, row) => sum + getTaskExp(row.task, row.action), 0);
    /**
     * O TEMPO EXECUTADO, que nao e a EXP.
     *
     * Some `completedRows` — TODAS as concluidas — enquanto a EXP soma so as
     * pontuadas. Uma tarde inteira de acao Livre aparece aqui e nao aparece la,
     * e e por isso que este numero tem que sair da propria duracao em vez de
     * reaproveitar o total de EXP.
     */
    const dayMinutes = completedRows.reduce((sum, row) => sum + getTaskMinutes(row.task, row.action), 0);
    // Guardada, nao creditada: com ciclo aberto o pote e o do ciclo; sem ciclo, o
    // da rodada. Nos dois casos a origem e a mesma soma de exp_deposited.
    const expGuardada = Math.max(0, Math.round(activeCycle ? cycleExpBonus : roundExpBonus));
    /**
     * O QUE ESTA GUARDADO NAO E O QUE VAI CAIR.
     *
     * No fecho, endCycle paga `cycleExpBonus + premiumBonusExp`, e o bonus incide
     * sobre a base. Quem assina recebe MAIS do que este numero, e a linha dizia o
     * numero sem dizer isso — o mesmo tipo de meia-verdade de somar EXP achando
     * que se soma tempo.
     *
     * Mostramos a TAXA e nao o valor de proposito: o bonus e calculado sobre a
     * base recalculada no fecho, que nao e exatamente este acumulado. A taxa e
     * exata; um valor previsto seria chute com cara de promessa.
     */
    const bonusAssinaturaPercent = Math.round(getCycleXpBonusRate(userProfile) * 100);
    const dayProgress = scoredRows.length > 0 ? Math.round((completedScoredRows.length / scoredRows.length) * 100) : (rowsDoDia.length > 0 ? 100 : 0);
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
            plannedCount: rowsDoDia.length,
            distinctArenaCount: arenaStats.filter((entry) => entry.completed > 0).length,
            arenaNames: arenaStats.filter((entry) => entry.completed > 0).map((entry) => entry.name),
            topArenaName: topArena?.name || null,
            topArenaCompleted: topArena?.completed || 0,
            previousActiveDaysAverage,
        });
    }, [arenaStats, completedRows.length, cyclePattern?.days, rowsDoDia.length, isToday, selectedDate, topArena]);

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
            plannedCount: rowsDoDia.length,
            distinctArenaCount: arenaStats.filter((entry) => entry.completed > 0).length,
            topArenaName: topArena?.name || null,
            streakCurrent: cyclePattern?.currentPerfectStreak || 0,
            cycleActiveDayAverage,
            currentCycleExecutionPct: typeof cyclePattern?.progress === 'number' ? cyclePattern.progress : null,
            pastCyclesExecutionMedianPct: median,
            pastCyclesCount: pastRates.length,
        }, readingDepth);
    }, [arenaStats, completedRows.length, cyclePattern, rowsDoDia.length, isToday, readingDepth, reports, selectedDate, topArena]);

    const handleShareImage = () => {
        if (ehHoje) return;
        void shareElementWithFeedback(showToast, 'daily-summary-capture-area', {
            title: 'Meu Resumo Diário - Glyph',
            text: 'Veja como foi meu dia no Glyph.',
            preparingMessage: 'Preparando resumo...',
            sharedMessage: 'Resumo diário compartilhado.',
            cancelledMessage: 'Compartilhamento cancelado.',
            errorMessage: 'Não foi possível preparar o resumo.',
        });
    };

    const comparison = useDailyComparison(userProfile.id, selectedDate, completedRows.length, dayExp);
    const dailySnapshot: DailyFeedSnapshot = {
        version: 1, date: selectedDate, dateLabel, completed: completedRows.length,
        total: rowsDoDia.length, minutes: dayMinutes, xp: dayExp, bayCount: rowsNaBaia.length,
        reading: (ehHoje ? todayReading?.text : historicalInsight) || undefined,
        comparisonLabel: dailyComparisonLabel(comparison, completedRows.length, dayExp) || undefined,
        actions: rowsDoDia.map(row => ({id: row.task.id, name: row.action.name, icon: row.action.icon || '📝', completed: Boolean(row.task.completed), background: getActionBackgroundStyle(row.action.id).background as string | undefined})),
    };

    const handlePostToFeed = async () => {
        if (ehHoje) return false;
        const published = await addFeedEvent({
            type: 'REPORT_COMPLETED',
            content: {
                title: `Resumo diário ${dateLabel}`,
                icon: '\u{1F4CA}',
                score: dayProgress,
                dailySummary: dailySnapshot,
            },
        });
        if (published) showToast('Resumo diário postado em Feitos.', 'success');
        return published;
    };


    return (
        <div className="daily-review daily-postcard-layout">
            <DailySummaryCard snapshot={dailySnapshot} captureId="daily-summary-capture-area" isToday={ehHoje} onShare={() => setIsShareChoiceOpen(true)} />
            <ShareChoiceSheet
                isOpen={isShareChoiceOpen}
                title="Resumo diário"
                subtitle="Compartilhe o cartão como imagem ou publique em Feitos."
                onShareImage={handleShareImage}
                onPostToFeed={handlePostToFeed}
                onClose={() => setIsShareChoiceOpen(false)}
            />
        </div>
    );
};
