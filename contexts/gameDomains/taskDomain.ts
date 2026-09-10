import type { Dispatch, SetStateAction } from 'react';
import type { Action, Arena, Campaign, Clan, Cycle, DailyCommitment, DayOfWeek, FeedEvent, FeedEventType, Report, ScheduledTask, SeasonQuest } from '../../types';
import type { ArenaPact, ArenaPactProgress } from '../../utils/arenaPacts';
import { mergeTasksIntoCommitment, reconcileTaskInCommitment } from '../../utils/coreLoopUtils.js';
import { OPERATIONAL_DAY_START_MINUTE, getOperationalDateString, getTaskOperationalDateString, taskMatchesOperationalDate } from '../../utils/operationalDay.js';
import { isSharedArena } from '../../utils/taskDomain.js';
import { buildToggledTaskSnapshot, removeEntitiesById, removeTaskIds, restoreTaskSnapshot } from '../../utils/taskMutationUtils.js';
import { calculateArenaProgress, calculateCampaignProgressSummary } from '../../utils/progressUtils';
import { describeArenaProgress, getArenaPresentationTasks } from '../../utils/arenaProgressPresentation';
import { emitArenaAttention } from '../../utils/arenaAttention';
import { emitAppSensoryCue } from '../../utils/sensoryCue';
import { emitOracleSpeech as emitOracleSpeechRaw } from '../../utils/oracleSpeech';
import { pickOracleReaction, readOracleReactionMemory, writeOracleReactionMemory } from '../../utils/oracleReaction';
import {
    allowsOracleReaction,
    type OraclePresenceRules,
    type OracleReactionWeight,
} from '../../constants/oraclePresencePolicy';
import { pickOracleSpeech, ORACLE_FREE_TONE, type OracleSpeechTone } from '../../constants/oracleSpeechLibrary';
import { PRODUCT_FEATURES } from '../../constants/featureFlags';

type ToastTone = 'success' | 'error' | 'info' | 'warning';
type AchievementState = { type: FeedEventType; data: any } | null;
type SupabaseLike = { from: (table: string) => any };
type CompletionAttentionResult = 'arena' | 'campaign' | null;

import { buildRecurringDates, resolveScheduleHorizon } from '../../utils/cycleScheduling';


export interface TaskDomainApi {
    scheduleMultipleTasks: (actionOrId: string | Action, daysOfWeek: DayOfWeek[], startTimeInMinutes: number) => Promise<void>;
    scheduleTask: (actionOrId: string | Action, date: string, startTime: number) => Promise<ScheduledTask | undefined>;
    scheduleAndCompleteNow: (actionId: string, taskId?: string) => Promise<void>;
    scheduleAndCompleteAt: (actionId: string, date: string, startTime: number, taskId?: string) => Promise<void>;
    scheduleAndCompleteMilestoneNow: (actionId: string) => Promise<void>;
    returnTaskToPool: (taskId: string, targetOperationalDate?: string) => void;
    deleteTask: (taskId: string) => void;
    getTasksForDate: (date: Date) => ScheduledTask[];
    rescheduleTask: (taskId: string, newDate: string, newStartTime: number) => void;
    updateTask: (taskId: string, updates: Partial<ScheduledTask>) => void;
    setTaskExecutionOrder: (taskId: string, executionOrder: number | null) => void;
    toggleTaskCompletion: (taskId: string) => Promise<void>;
    completeTutorialMission: () => void;
}

interface CreateTaskDomainParams {
    tasks: ScheduledTask[];
    freeProgressResetAt?: string | null;
    activeCycle: Cycle | null;
    campaigns: Campaign[];
    reports: Report[];
    dailyCommitment: DailyCommitment;
    judgedTaskIdsByDate: Record<string, string[]>;
    clan: Clan | null;
    supabase: SupabaseLike;
    setTasks: Dispatch<SetStateAction<ScheduledTask[]>>;
    setDailyCommitmentState: Dispatch<SetStateAction<DailyCommitment>>;
    getActionById: (actionId: string) => Action | undefined;
    getArenas: () => Arena[];
    /**
     * O pacto ativo, lido na hora da conclusao.
     *
     * E getter, e nao valor, porque o dominio de tarefa e montado bem antes de o
     * pacto ser calculado no provider. Getter tambem garante que a leitura seja
     * do estado do momento da conclusao, nao do momento da montagem.
     */
    getActiveArenaPact?: () => { pact: ArenaPact | null; progress: ArenaPactProgress | null };
    getActionsForArena: (arenaId: string) => Action[];
    getClanQuestForAction: (action: Action | undefined) => SeasonQuest | null;
    getSupabaseUserId: () => string | null | undefined;
    isClanQuestActionId: (actionId: string) => boolean;
    showToast: (message: string, tone: ToastTone) => void;
    oracleTone?: OracleSpeechTone;
    /**
     * O Oraculo comenta o que voce acabou de concluir. So o nivel Presente faz
     * isso: no Equilibrado ele fala uma vez por dia e nao acompanha cada acao.
     */
    /** Regra de reacao do nivel de presenca: 'nenhuma', 'marcos' ou 'todas'. */
    oracleReactions?: OraclePresenceRules['reactions'];
    updateClanMissionProgress: (questId: string, increment: number) => Promise<void>;
    updateCustomClanMissionProgress: (missionId: string, increment: number) => Promise<void>;
    handleCompetitionArenaCompletion?: (arenaId: string) => Promise<void>;
    onDailyProofActionCompleted?: (payload: { task: ScheduledTask; action?: Action; tasksAfterChange: ScheduledTask[] }) => void;
    setAchievementUnlocked: (achievement: AchievementState) => void;
    addFeedEvent: (eventData: Pick<FeedEvent, 'type' | 'content'>) => void;
    getLocalDateString: (date?: Date) => string;
    mapToSnakeCase: (value: any) => any;
    addProfileFlag: (flag: string) => void;
    tutorialActionId: string;
    tutorialCompletedFlag: string;
    reconcileJudgedDayTaskMutation?: (args: {
        operationalDate: string;
        previousTasks: ScheduledTask[];
        nextTasks: ScheduledTask[];
    }) => Promise<void>;
}

export const createTaskDomain = ({
    tasks,
    freeProgressResetAt,
    activeCycle,
    campaigns,
    reports,
    dailyCommitment,
    judgedTaskIdsByDate,
    clan,
    supabase,
    setTasks,
    setDailyCommitmentState,
    getActionById,
    getArenas,
    getActiveArenaPact,
    getActionsForArena,
    getClanQuestForAction,
    getSupabaseUserId,
    isClanQuestActionId,
    showToast,
    oracleTone = ORACLE_FREE_TONE,
    // O padrao erra para o lado silencioso. Se a preferencia ainda nao chegou,
    // 'todas' faria o Oraculo comentar o dia de quem pediu para ele calar.
    oracleReactions = 'nenhuma',
    updateClanMissionProgress,
    updateCustomClanMissionProgress,
    handleCompetitionArenaCompletion,
    onDailyProofActionCompleted,
    setAchievementUnlocked,
    addFeedEvent,
    getLocalDateString,
    mapToSnakeCase,
    addProfileFlag,
    tutorialActionId,
    tutorialCompletedFlag,
    reconcileJudgedDayTaskMutation,
}: CreateTaskDomainParams): TaskDomainApi => {

    // As reacoes nao pesam igual. Fechar arena, campanha ou marco e raro e vale
    // uma palavra ja no Equilibrado; volume do dia e avanco de meta disparam quase
    // sempre e, repetidos, viram papel de parede — esses so no Presente. O peso
    // vai no ponto de chamada porque so ele sabe o que acabou de acontecer.
    // Toda reacao passa por aqui, e por aqui ela lembra da anterior. Com tres
    // variantes e sorteio sem memoria, fechar duas arenas seguidas devolvia a
    // mesma frase uma vez em cada tres.
    const falarReacao = (
        evento: Parameters<typeof pickOracleReaction>[0],
        vars: Record<string, string | number> = {},
    ): string => {
        const escolha = pickOracleReaction(evento, oracleTone, vars, readOracleReactionMemory());
        if (escolha.message) writeOracleReactionMemory(escolha.memory);
        return escolha.message;
    };

    const emitOracleSpeech = (
        payload: Parameters<typeof emitOracleSpeechRaw>[0],
        weight: OracleReactionWeight = 'rotina',
    ) => {
        if (!allowsOracleReaction({ reactions: oracleReactions } as OraclePresenceRules, weight)) return;
        // Marco fica gravado; rotina passa e some. "Voce fez 5 acoes hoje" dispara
        // quase todo dia e, empilhado no historico, vira papel de parede — o mesmo
        // motivo que ja separava os dois pesos aqui em cima.
        emitOracleSpeechRaw({
            ...payload,
            kind: 'reacao',
            ephemeral: weight !== 'marco',
        });
    };

    const getJudgedTaskIdsForDate = (operationalDate: string) => {
        return judgedTaskIdsByDate[operationalDate] || [];
    };

    const getClosedReportTaskIds = (report: Report) => {
        const weeklyAtlas = report.metrics?.weeklyAtlas || [];
        return weeklyAtlas.flatMap((week) =>
            (week.days || []).flatMap((day) =>
                [...(day.scheduledItems || []), ...(day.unscheduledItems || [])]
                    .map((item) => item.taskId)
                    .filter(Boolean)
            )
        );
    };

    const isOperationalDateInsideClosedCycle = (operationalDate: string) =>
        reports.some((report) => operationalDate >= report.startDate && operationalDate <= report.endDate);

    const isTaskInClosedCycleScope = (task: Pick<ScheduledTask, 'id' | 'date' | 'startTime'>) => {
        const taskOperationalDate = getTaskOperationalDateString(task);
        if (!taskOperationalDate) return false;

        return reports.some((report) => {
            if (taskOperationalDate < report.startDate || taskOperationalDate > report.endDate) return false;
            const closedTaskIds = getClosedReportTaskIds(report);
            return closedTaskIds.length > 0 ? closedTaskIds.includes(task.id) : true;
        });
    };

    const isTaskInJudgedActionScope = (task: Pick<ScheduledTask, 'id' | 'date' | 'startTime'>) => {
        const taskOperationalDate = getTaskOperationalDateString(task);
        if (!taskOperationalDate) return false;
        return getJudgedTaskIdsForDate(taskOperationalDate).includes(task.id);
    };

    const isTaskLockedByJudgment = (task: ScheduledTask) =>
        Boolean(task.completed) && isTaskInClosedCycleScope(task);

    const getEditableLockedOperationalDate = (task: Pick<ScheduledTask, 'id' | 'date' | 'startTime' | 'completed'>): string | false => {
        const taskOperationalDate = getTaskOperationalDateString(task as ScheduledTask);
        if (!taskOperationalDate) return false;
        if (task.completed && isTaskInJudgedActionScope(task)) {
            return taskOperationalDate;
        }

        return false;
    };

    const isTaskCompletionEditableWithinOpenCycle = (task: ScheduledTask) => Boolean(getEditableLockedOperationalDate(task));

    const canPlaceTaskInJudgmentScope = (task: Pick<ScheduledTask, 'date' | 'startTime'>) => {
        const taskOperationalDate = getTaskOperationalDateString(task);
        return Boolean(taskOperationalDate && !isOperationalDateInsideClosedCycle(taskOperationalDate));
    };

    const maybeReconcileRetroactiveMutations = async (
        operationalDates: Array<string | false>,
        previousTasks: ScheduledTask[],
        nextTasks: ScheduledTask[],
    ) => {
        if (!reconcileJudgedDayTaskMutation) return;

        const uniqueDates = [...new Set(operationalDates.filter((date): date is string => Boolean(date)))];
        for (const operationalDate of uniqueDates) {
            await reconcileJudgedDayTaskMutation({
                operationalDate,
                previousTasks,
                nextTasks,
            });
        }
    };

    const showJudgedActionMutationBlockedToast = () => {
        showToast('Essa acao pertence a um ciclo fechado. Crie outra acao para compensar sem apagar historico antigo.', 'warning');
    };

    const isTaskInsideActiveCycle = (task: Pick<ScheduledTask, 'date'>) => {
        if (!activeCycle) return true;
        return task.date >= activeCycle.startDate && task.date <= activeCycle.endDate;
    };

    const getTasksInsideActiveCycle = (sourceTasks: ScheduledTask[]) => {
        if (!activeCycle) return sourceTasks;
        return sourceTasks.filter((task) => {
            const operationalDate = getTaskOperationalDateString(task);
            return Boolean(
                operationalDate &&
                operationalDate >= activeCycle.startDate &&
                operationalDate <= activeCycle.endDate
            );
        });
    };

    const rollbackOptimisticTaskCreation = (taskIdsToRollback: string[]) => {
        setTasks(prevTasks => removeEntitiesById(prevTasks, taskIdsToRollback));
        setDailyCommitmentState(prev => ({
            ...prev,
            taskIds: removeTaskIds(prev.taskIds, taskIdsToRollback)
        }));
    };

    const restoreTaskAfterPersistenceFailure = (snapshot: ScheduledTask) => {
        setTasks(prevTasks => restoreTaskSnapshot(prevTasks, snapshot));
        setDailyCommitmentState(prev => ({
            ...prev,
            taskIds: reconcileTaskInCommitment(prev.taskIds, snapshot.id, snapshot, prev.date, isClanQuestActionId)
        }));
    };

    const maybeTriggerArenaCompletionAttention = (
        action: Action | undefined,
        previousTasks: ScheduledTask[],
        nextTasks: ScheduledTask[],
    ): CompletionAttentionResult => {
        if (!action) return null;

        const arena = getArenas().find(item => item.id === action.arenaId);
        if (!arena) return null;

        const normalizedArenaName = (arena.name || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();

        if (normalizedArenaName.includes('quests - cla') || normalizedArenaName.includes('quests - season')) {
            return null;
        }

        if (getClanQuestForAction(action)) return null;

        const arenaActions = getActionsForArena(arena.id);
        if (arenaActions.length === 0) return null;

        const previousCycleTasks = getTasksInsideActiveCycle(previousTasks);
        const nextCycleTasks = getTasksInsideActiveCycle(nextTasks);

        const previousProgress = calculateArenaProgress({
            arena,
            actions: arenaActions,
            tasks: previousCycleTasks,
        });

        const nextProgress = calculateArenaProgress({
            arena,
            actions: arenaActions,
            tasks: nextCycleTasks,
        });

        if (previousProgress.progressPercent >= 100 || nextProgress.progressPercent < 100 || !nextProgress.isCleared) {
            return null;
        }

        const parentCampaign = campaigns.find((campaign) => campaign.arenaIds.includes(arena.id)) || null;
        const arenasById = Object.fromEntries(getArenas().map((currentArena) => [currentArena.id, currentArena]));
        const actionsByArena = parentCampaign
            ? Object.fromEntries(parentCampaign.arenaIds.map((arenaId) => [arenaId, getActionsForArena(arenaId)]))
            : {};

        let campaignJustCleared = false;

        if (parentCampaign) {
            const previousCampaignProgress = calculateCampaignProgressSummary({
                campaign: parentCampaign,
                arenasById,
                actionsByArena,
                tasks: previousCycleTasks,
            });
            const nextCampaignProgress = calculateCampaignProgressSummary({
                campaign: parentCampaign,
                arenasById,
                actionsByArena,
                tasks: nextCycleTasks,
            });

            campaignJustCleared =
                nextCampaignProgress.totalArenaCount > 0 &&
                nextCampaignProgress.clearedArenaCount === nextCampaignProgress.totalArenaCount &&
                previousCampaignProgress.clearedArenaCount < nextCampaignProgress.clearedArenaCount;
        }

        emitArenaAttention(
            campaignJustCleared
                ? {
                    arenaIds: [],
                    campaignId: parentCampaign?.id || null,
                    focusArenaId: arena.id,
                    phase: 'celebrate',
                    navigateToArenas: true,
                }
                : {
                    arenaIds: [arena.id],
                    focusArenaId: arena.id,
                    phase: 'celebrate',
                    navigateToArenas: true,
                }
        );
        emitAppSensoryCue(campaignJustCleared ? 'campaign_complete' : 'arena_complete');

        // O toast CONFIRMA, o Oraculo COMENTA. Sao papeis diferentes e por isso os
        // dois podem existir no mesmo evento — mas o toast dizia "Muito bem" e o
        // balao dizia a mesma coisa logo abaixo, dois elogios pelo mesmo fato.
        //
        // Pior: o toast ignora a presenca. Quem pos o Oraculo no Silencioso pediu
        // para nao ser comentado, e recebia o elogio assim mesmo pela outra porta.
        // Sem a voz, o toast vira o que ele deveria ser: o registro de que a acao
        // pegou. Quem quiser comentario sobe a presenca.
        showToast(
            campaignJustCleared && parentCampaign
                ? `Campanha "${parentCampaign.title}" concluida.`
                : `Arena "${arena.name}" concluida.`,
            'success',
        );
        emitOracleSpeech({
            title: campaignJustCleared ? 'Campanha' : 'Arena',
            message: campaignJustCleared && parentCampaign
                ? falarReacao('campaign_completed', { campaign: parentCampaign.title })
                : falarReacao('arena_completed', { arena: arena.name }),
            tone: 'success',
            durationMs: campaignJustCleared ? 5600 : 5000,
        }, 'marco');

        // Os numeros do feito viram parte do registro, medidos agora.
        //
        // "Concluiu Academia" nao deixa a pessoa se achar no proprio feito: cinco
        // acoes em tres dias e trinta e quatro entregas em vinte e um dias sao
        // historias diferentes com o mesmo titulo. E gravar em vez de consultar e
        // o que torna isso honesto — desmarcar uma acao amanha muda o estado da
        // arena, nao muda o que aconteceu.
        const arenaActionIdSet = new Set(arenaActions.map((action) => action.id));
        const entregasDaArena = nextCycleTasks.filter(
            (task) => task.completed && arenaActionIdSet.has(task.actionId),
        );
        const diasDaArena = new Set(
            entregasDaArena.map((task) => getTaskOperationalDateString(task)).filter(Boolean),
        );

        addFeedEvent({
            type: 'ARENA_COMPLETED',
            content: {
                title: arena.name,
                icon: arena.icon || '🏟️',
                actionCount: arenaActions.length,
                deliveries: entregasDaArena.length,
                days: diasDaArena.size,
            }
        });

        setAchievementUnlocked({
            type: 'ARENA_COMPLETED',
            data: {
                name: arena.name,
                icon: arena.icon || '🏛️',
                arenaId: arena.id,
                actionCount: arenaActions.length,
                deliveries: entregasDaArena.length,
                days: diasDaArena.size,
            }
        });

        if (handleCompetitionArenaCompletion) {
            void handleCompetitionArenaCompletion(arena.id);
        }

        return campaignJustCleared ? 'campaign' : 'arena';
    };

    const maybeTriggerDailyMomentumAttention = (
        action: Action | undefined,
        completedTask: ScheduledTask,
        previousTasks: ScheduledTask[],
        nextTasks: ScheduledTask[],
    ) => {
        if (!action || action.actionType === 'Livre' || action.actionType === 'Marco') return;

        const operationalDate = getTaskOperationalDateString(completedTask);
        if (!operationalDate) return;

        const countRealCompletedTasks = (sourceTasks: ScheduledTask[]) => sourceTasks.filter((task) => {
            if (!task.completed || getTaskOperationalDateString(task) !== operationalDate) return false;
            const taskAction = getActionById(task.actionId);
            return taskAction && taskAction.actionType !== 'Livre' && taskAction.actionType !== 'Marco';
        }).length;

        const previousCount = countRealCompletedTasks(previousTasks);
        const nextCount = countRealCompletedTasks(nextTasks);
        const crossedThreshold = [3, 5, 8].find((threshold) => previousCount < threshold && nextCount >= threshold);
        if (!crossedThreshold) return;

        const repsEvent = crossedThreshold >= 8
            ? 'daily_reps_high'
            : crossedThreshold >= 5 ? 'daily_reps_mid' : 'daily_reps_low';
        const message = falarReacao(repsEvent, { count: crossedThreshold });

        emitOracleSpeech({
            title: crossedThreshold >= 8 ? 'Fechamento' : 'Ritmo',
            message,
            tone: 'success',
            durationMs: crossedThreshold >= 8 ? 4700 : 3900,
        });
    };

    const maybeTriggerActionCycleProgressAttention = (
        action: Action | undefined,
        completedTask: ScheduledTask,
        previousTasks: ScheduledTask[],
        nextTasks: ScheduledTask[],
    ): boolean => {
        if (!completedTask.completed || !action || !activeCycle || action.actionType === 'Livre' || action.actionType === 'Marco') return false;

        const target = Math.max(1, Math.floor(Number(action.repetitions || 1)));
        if (target <= 1) return false;

        const isTaskInCurrentCycleForAction = (task: ScheduledTask) => {
            const taskDate = getTaskOperationalDateString(task);
            return Boolean(
                task.completed &&
                task.actionId === action.id &&
                taskDate &&
                taskDate >= activeCycle.startDate &&
                taskDate <= activeCycle.endDate
            );
        };

        const previousCount = previousTasks.filter(isTaskInCurrentCycleForAction).length;
        const nextCount = nextTasks.filter(isTaskInCurrentCycleForAction).length;
        if (nextCount <= previousCount) return false;

        const cappedCount = Math.min(nextCount, target);
        const remaining = Math.max(0, target - cappedCount);
        const actionName = action.name || 'essa acao';
        const goalEvent = remaining === 0
            ? 'cycle_goal_met'
            : remaining === 1
                ? 'cycle_goal_last_one'
                : cappedCount === 1 ? 'cycle_goal_first' : 'cycle_goal_progress';
        const message = falarReacao(goalEvent, {
            action: actionName,
            count: cappedCount,
            target,
            remaining,
        });

        emitOracleSpeech({
            title: remaining === 0 ? 'Meta' : 'Progresso',
            message,
            tone: 'success',
            durationMs: remaining <= 1 ? 5000 : 4300,
        });
        return true;
    };

    const showTaskProgressToast = (action: Action | undefined, nextTasks: ScheduledTask[]) => {
        if (!action) return;
        const arena = getArenas().find(item => item.id === action.arenaId);
        if (!arena || isSharedArena(arena) || getClanQuestForAction(action)) return;
        if (action.actionType === 'Livre') {
            showToast(`${action.name}: registrada.`, 'success');
            return;
        }
        const arenaActions = getActionsForArena(arena.id);
        const progress = calculateArenaProgress({
            arena,
            actions: arenaActions,
            tasks: getArenaPresentationTasks(nextTasks, activeCycle, freeProgressResetAt, getLocalDateString()),
        });
        const description = describeArenaProgress(arenaActions, progress);
        if (!description) return;
        const remaining = description.remaining;
        const suffix = remaining !== null && remaining > 0
            ? ` · ${remaining === 1 ? 'falta' : 'faltam'} ${remaining}` : '';
        // A forma COMPLETA aqui, nao a curta. O rotulo encolheu para caber na
        // grade de arenas, onde a palavra competia com o dado; num toast sobra
        // linha, e "5/7" sozinho e mais seco do que precisa ser.
        showToast(`${arena.name}: ${description.accessibleLabel}${suffix}`, 'success');
    };

    /**
     * O pacto fala PRIMEIRO, antes da meta do ciclo.
     *
     * Meta de ciclo e estrutura que a pessoa montou; pacto e promessa que ela
     * aceitou de viva voz para o Oraculo. Quando as duas avancam na mesma
     * conclusao, a que ela escolheu conscientemente ganha o comentario.
     *
     * Sem pacto ativo, ou com a conclusao fora da arena do pacto, isto nao faz
     * nada — quem nao aceitou nada nunca ouve nada disto.
     */
    const maybeTriggerPactProgressAttention = (
        action: Action | undefined,
        completedTask: ScheduledTask,
    ): boolean => {
        if (!completedTask.completed || !action) return false;
        const atual = getActiveArenaPact?.();
        const pacto = atual?.pact;
        const progresso = atual?.progress;
        if (!pacto || !progresso) return false;
        if (action.actionType === 'Livre') return false;

        // A conclusao precisa ser da arena do pacto, senao qualquer tarefa do dia
        // viraria "avanco no pacto".
        const arenaDaAcao = getArenas().find((arena) => (arena.actionIds || []).includes(action.id));
        if (!arenaDaAcao || arenaDaAcao.id !== pacto.arenaId) return false;

        const alvo = Math.max(1, progresso.goal);
        const feito = Math.min(Math.max(0, progresso.current), alvo);
        const faltam = Math.max(0, alvo - feito);
        // Janela vencida nao comemora: o pacto acabou e dizer "faltam 2" seria
        // cobrar uma coisa que nao esta mais de pe.
        if (progresso.windowEnded && !progresso.completed) return false;

        // "faltam 3 dias" so existe no pacto de volume; nos outros endsOn e null.
        const dias = pacto.endsOn
            ? (() => {
                const hoje = getOperationalDateString();
                const restantes = Math.max(0, Math.round(
                    (new Date(`${pacto.endsOn.slice(0, 10)}T00:00:00`).getTime()
                        - new Date(`${hoje}T00:00:00`).getTime()) / 86400000,
                ));
                return restantes === 0 ? ', e o prazo acaba hoje' : `, e você tem ${restantes} dia${restantes === 1 ? '' : 's'}`;
            })()
            : '';

        const evento = progresso.completed
            ? 'pact_completed'
            : faltam === 1 ? 'pact_last_one' : 'pact_progress';

        emitOracleSpeech({
            title: progresso.completed ? 'Missão' : 'Missão em andamento',
            message: falarReacao(evento, {
                arena: pacto.arenaName,
                count: feito,
                target: alvo,
                remaining: faltam,
                dias,
            }),
            // Concluir e vitoria; avancar e orientacao. Pintar os dois de verde
            // gastava o verde — quando tudo e comemoracao, nada e.
            tone: progresso.completed || faltam <= 1 ? 'success' : 'guide',
            durationMs: progresso.completed || faltam <= 1 ? 5200 : 4300,
        });
        return true;
    };

    const maybeTriggerTaskCompletionSpeech = (
        action: Action | undefined,
        completedTask: ScheduledTask,
        previousTasks: ScheduledTask[],
        nextTasks: ScheduledTask[],
    ) => {
        showTaskProgressToast(action, nextTasks);
        if (maybeTriggerPactProgressAttention(action, completedTask)) return;
        if (maybeTriggerActionCycleProgressAttention(action, completedTask, previousTasks, nextTasks)) return;
        maybeTriggerDailyMomentumAttention(action, completedTask, previousTasks, nextTasks);
    };

    const maybePromptDailyPanelFollowUp = (task: ScheduledTask, action?: Action) => {
        void task;
        void action;
    };

    const scheduleMultipleTasks = async (actionOrId: string | Action, daysOfWeek: DayOfWeek[], startTimeInMinutes: number) => {
        const action = typeof actionOrId === 'string' ? getActionById(actionOrId) : actionOrId;
        if (!action) return;
        const actionId = action.id;

        // ATE ONDE AGENDAR: O CICLO.
        //
        // Isto era um laco de 365 dias fixos: marcar "todo dia" gravava o ano
        // inteiro no primeiro clique. Enchia o banco, descia em toda abertura do
        // app, e inventava uma meta que ninguem escolheu — o ano nao significa
        // nada para quem mede a vida em ciclos.
        //
        // O ano tinha um efeito colateral util: fazia a virada de ciclo funcionar
        // sozinha, porque as tarefas do ciclo seguinte ja estavam gravadas. Quem
        // assume esse papel agora e a regeneracao explicita em startNewCycle.
        //
        // (Registro, porque custou caro: esta mudanca chegou a ser revertida por
        // "quebrar" o smoke do relatorio de ciclo. Nao quebrava — o smoke tinha uma
        // corrida entre o insert do ciclo, que e disparado sem espera, e a leitura
        // dele no banco. Corrigida a corrida, o par voltou.)
        const todayString = getLocalDateString();
        const scheduleThrough = resolveScheduleHorizon(todayString, activeCycle);

        // A CONFERENCIA DE DUPLICATA PRECISA VIR DO BANCO.
        //
        // O estado local so carrega ate o horizonte de leitura (35 dias). Um
        // ciclo mais longo que isso tem um fim que a memoria nao enxerga — e
        // conferir duplicata contra o que nao se ve e como nao conferir. Com o
        // indice unico no banco isso deixaria de duplicar e passaria a ERRAR:
        // a pessoa marcaria os dias e levaria um toast de falha, sem entender.
        //
        // Uma consulta a mais no clique de agendar e barato; ela acontece uma vez
        // por acao, nao por abertura do app.
        const existingKeys = new Set(tasks.map(task => `${task.actionId}_${task.date}_${task.startTime}`));
        const scheduleUserId = getSupabaseUserId();
        if (scheduleUserId) {
            const { data: jaGravadas, error: leituraErro } = await supabase
                .from('scheduled_tasks')
                .select('action_id, date, start_time')
                .eq('user_id', scheduleUserId)
                .eq('action_id', actionId)
                .gte('date', todayString)
                .lte('date', scheduleThrough);

            if (leituraErro) {
                console.error('Failed to read existing tasks before scheduling:', leituraErro.message);
            } else {
                for (const row of jaGravadas || []) {
                    existingKeys.add(`${(row as any).action_id}_${(row as any).date}_${(row as any).start_time}`);
                }
            }
        }

        const newTasks: ScheduledTask[] = [];

        for (const dateString of buildRecurringDates({ from: todayString, through: scheduleThrough, daysOfWeek })) {
            const key = `${actionId}_${dateString}_${startTimeInMinutes}`;
            if (existingKeys.has(key)) continue;
            existingKeys.add(key);

            newTasks.push({
                id: crypto.randomUUID(),
                actionId,
                date: dateString,
                startTime: startTimeInMinutes,
                duration: action.duration,
                completed: false,
            });
        }

        if (newTasks.length === 0) return;

        const allowedTasks = newTasks.filter(task => canPlaceTaskInJudgmentScope(task));
        if (allowedTasks.length !== newTasks.length) {
            showJudgedActionMutationBlockedToast();
        }
        if (allowedTasks.length === 0) return;

        const newTaskIds = allowedTasks.map(task => task.id);
        setTasks(prevTasks => [...prevTasks, ...allowedTasks]);

        if (!isClanQuestActionId(actionId)) {
            const todayStr = getOperationalDateString();
            const todayTasks = allowedTasks.filter(task => taskMatchesOperationalDate(task, todayStr));
            if (todayTasks.length > 0) {
                setDailyCommitmentState(prev => ({
                    ...prev,
                    taskIds: mergeTasksIntoCommitment(prev.taskIds, todayTasks, prev.date, isClanQuestActionId)
                }));
            }
        }

        const userId = getSupabaseUserId();
        if (!userId) return;

        try {
            const payload = allowedTasks.map(task => ({ ...mapToSnakeCase(task), user_id: userId }));
            const { error } = await supabase.from('scheduled_tasks').insert(payload);
            if (error) throw error;
            await maybeReconcileRetroactiveMutations(
                allowedTasks.map(task => getEditableLockedOperationalDate(task)),
                tasks,
                [...tasks, ...allowedTasks],
            );
        } catch (error: any) {
            rollbackOptimisticTaskCreation(newTaskIds);
            console.error('Supabase schedule multiple tasks error:', error?.message || error);
            showToast('Falha na sincronizacao de dados. Tente novamente ou verifique a conexao.', 'error');
            throw error;
        }
    };

    const scheduleTask = async (actionOrId: string | Action, date: string, startTime: number): Promise<ScheduledTask | undefined> => {
        const action = typeof actionOrId === 'string' ? getActionById(actionOrId) : actionOrId;
        if (!action) return undefined;
        const actionId = action.id;

        const newTask: ScheduledTask = {
            id: crypto.randomUUID(),
            actionId,
            date,
            startTime,
            duration: action.duration,
            completed: false,
        };

        if (!canPlaceTaskInJudgmentScope(newTask)) {
            showJudgedActionMutationBlockedToast();
            return undefined;
        }

        setTasks(prevTasks => [...prevTasks, newTask]);

        const todayStr = getOperationalDateString();
        if (taskMatchesOperationalDate(newTask, todayStr) && !isClanQuestActionId(actionId)) {
            setDailyCommitmentState(prev => ({
                ...prev,
                taskIds: mergeTasksIntoCommitment(prev.taskIds, [newTask], prev.date, isClanQuestActionId)
            }));
        }

        const userId = getSupabaseUserId();
        if (userId) {
            try {
                const payload = { ...mapToSnakeCase(newTask), user_id: userId };
                const { error } = await supabase.from('scheduled_tasks').insert(payload);
                if (error) throw error;
                await maybeReconcileRetroactiveMutations(
                    [getEditableLockedOperationalDate(newTask)],
                    tasks,
                    [...tasks, newTask],
                );
            } catch (error: any) {
                rollbackOptimisticTaskCreation([newTask.id]);
                console.error('Supabase schedule task error:', error?.message || error);
                showToast('Falha na sincronizacao de dados. Tente novamente ou verifique a conexao.', 'error');
                throw error;
            }
        }

        showToast('Cronograma atualizado no banco de dados.', 'success');
        return newTask;
    };

    const persistTaskCompletionUpdate = async (task: ScheduledTask) => {
        const userId = getSupabaseUserId();
        if (!userId) return;

        const { error } = await supabase.from('scheduled_tasks')
            .update({
                date: task.date,
                completed: task.completed,
                start_time: task.startTime,
            })
            .eq('id', task.id);

        if (error) {
            throw error;
        }
    };

    const syncSharedCompletionForTask = async (action: Action, arena: Arena, userId: string, shouldMarkComplete: boolean) => {
        if (!shouldMarkComplete) {
            const { error } = await supabase.from('shared_action_completions')
                .delete()
                .eq('arena_id', action.arenaId)
                .eq('action_id', action.id)
                .eq('user_id', userId);

            if (error) {
                console.error('Error removing shared completion:', error);
            }
            return;
        }

        if (getClanQuestForAction(action)) {
            return;
        }

        const isOfficeMode = PRODUCT_FEATURES.clanSharedActions && clan?.clanType === 'Office';
        let shouldPersistSharedCompletion: boolean = PRODUCT_FEATURES.clanSharedActions && (isOfficeMode || isSharedArena(arena));

        if (!shouldPersistSharedCompletion) {
            const linkedArenaResult = await supabase
                .from('relationship_link_arenas')
                .select('relationship_link_id')
                .eq('arena_id', arena.id)
                .maybeSingle();

            const linkedRelationshipId = linkedArenaResult.data?.relationship_link_id || null;

            const { data: linkData, error } = await supabase.from('relationship_links')
                .select('id')
                .or(`mentor_id.eq.${userId},pupil_id.eq.${userId}`)
                .eq(linkedRelationshipId ? 'id' : 'arena_id', linkedRelationshipId || arena.id)
                .is('ended_at', null)
                .maybeSingle();

            if (error) {
                console.error('Error checking relationship link:', error);
                return;
            }

            shouldPersistSharedCompletion = Boolean(linkData);
        }

        if (!shouldPersistSharedCompletion) {
            return;
        }

        const { error } = await supabase.from('shared_action_completions').insert({
            arena_id: arena.id,
            action_id: action.id,
            user_id: userId
        });

        if (error) {
            console.error('Error recording shared completion:', error);
            return;
        }

        showToast('Acao compartilhada registrada!', 'success');
    };

    const runTaskCompletionSideEffects = (updatedTask: ScheduledTask, action: Action | undefined, optimisticTasks: ScheduledTask[]) => {
        if (!action) return;
        onDailyProofActionCompleted?.({ task: updatedTask, action, tasksAfterChange: optimisticTasks });

        if (updatedTask.completed && action.actionType === 'Marco') {
            setAchievementUnlocked({ type: 'MILESTONE_COMPLETED', data: action });
            addFeedEvent({
                type: 'MILESTONE_COMPLETED',
                content: { title: action.name, icon: action.icon }
            });
        }

        const arena = getArenas().find(item => item.id === action.arenaId);
        const userId = getSupabaseUserId();
        if (arena && userId) {
            void syncSharedCompletionForTask(action, arena, userId, Boolean(updatedTask.completed));
        }

        if (updatedTask.completed && arena?.name === 'Quem corre 15km antes') {
            const arenaActionIds = new Set(getActionsForArena(arena.id).map(item => item.id));
            const completedCount = optimisticTasks.filter(task => arenaActionIds.has(task.actionId) && task.completed).length;
            if (completedCount >= 15) {
                showToast('PARABENS! DESAFIO DE 15KM COMPLETADO!', 'success');
            }
        }

        const clanQuest = getClanQuestForAction(action);
        if (clanQuest) {
            void updateClanMissionProgress(clanQuest.id, updatedTask.completed ? 1 : -1);
        }

        if (action.originCodexId?.startsWith('clan_quest:')) {
            const questId = action.originCodexId.split(':')[1];
            void updateCustomClanMissionProgress(questId, updatedTask.completed ? 1 : -1);
        }
    };

    const toggleTaskCompletion = async (taskId: string) => {
        const taskToCheck = tasks.find(task => task.id === taskId);
        if (!taskToCheck) return;
        const wasLockedByJudgment = isTaskLockedByJudgment(taskToCheck);
        if (wasLockedByJudgment) {
            showJudgedActionMutationBlockedToast();
            return;
        }
        const previousRetroactiveOperationalDate = getEditableLockedOperationalDate(taskToCheck);

        const action = getActionById(taskToCheck.actionId);
        const now = new Date();
        const nowInMinutes = now.getHours() * 60 + now.getMinutes();
        const operationalToday = getOperationalDateString(now);
        const taskOperationalDate = getTaskOperationalDateString(taskToCheck);
        if (!taskToCheck.completed && taskOperationalDate && taskOperationalDate > operationalToday) {
            showToast('Essa acao ainda esta no futuro. Reagende para hoje se ela ja aconteceu.', 'warning');
            return;
        }
        const localToday = getLocalDateString(now);
        let updatedTask = buildToggledTaskSnapshot(taskToCheck, action?.duration || 15, nowInMinutes);

        if (!taskToCheck.completed && taskToCheck.startTime < 0 && nowInMinutes >= OPERATIONAL_DAY_START_MINUTE && updatedTask.startTime < OPERATIONAL_DAY_START_MINUTE) {
            // Keep newly completed pool tasks inside the current operational day.
            updatedTask = {
                ...updatedTask,
                startTime: OPERATIONAL_DAY_START_MINUTE,
            };
        }

        if (!taskToCheck.completed && taskToCheck.startTime < 0 && now.getHours() < 4 && taskMatchesOperationalDate(taskToCheck, operationalToday)) {
            updatedTask = {
                ...updatedTask,
                date: localToday,
            };
        }

        const optimisticTasks = restoreTaskSnapshot(tasks, updatedTask);
        const nextRetroactiveOperationalDate = getEditableLockedOperationalDate(updatedTask);

        setTasks(prevTasks => restoreTaskSnapshot(prevTasks, updatedTask));
        setDailyCommitmentState(prev => ({
            ...prev,
            taskIds: reconcileTaskInCommitment(prev.taskIds, updatedTask.id, updatedTask, prev.date, isClanQuestActionId),
        }));

        try {
            await persistTaskCompletionUpdate(updatedTask);
            await maybeReconcileRetroactiveMutations(
                [previousRetroactiveOperationalDate, nextRetroactiveOperationalDate],
                tasks,
                optimisticTasks,
            );
        } catch (error: any) {
            console.error('Supabase toggle task completion error:', error?.message || error);
            restoreTaskAfterPersistenceFailure(taskToCheck);
            showToast('Falha ao atualizar a tarefa no servidor.', 'error');
            return;
        }

        const completionAttention = updatedTask.completed
            ? maybeTriggerArenaCompletionAttention(action, tasks, optimisticTasks)
            : null;
        if (updatedTask.completed && !completionAttention) {
            emitAppSensoryCue('task_complete');
            maybeTriggerTaskCompletionSpeech(action, updatedTask, tasks, optimisticTasks);
        }
        runTaskCompletionSideEffects(updatedTask, action, optimisticTasks);
        maybePromptDailyPanelFollowUp(updatedTask, action);
    };

    const scheduleAndCompleteNow = async (actionId: string, taskId?: string) => {
        if (taskId) {
            await toggleTaskCompletion(taskId);
            return;
        }

        const action = getActionById(actionId);
        if (!action || action.actionType === 'Marco') return;

        const now = new Date();
        const operationalDate = getOperationalDateString(now);
        const date = getLocalDateString(now);
        const nowInMinutes = now.getHours() * 60 + now.getMinutes();
        const startTime = nowInMinutes >= OPERATIONAL_DAY_START_MINUTE
            ? Math.max(OPERATIONAL_DAY_START_MINUTE, nowInMinutes - action.duration)
            : Math.max(0, nowInMinutes - action.duration);
        const existingTaskForToday = tasks.find(task =>
            task.actionId === actionId &&
            taskMatchesOperationalDate(task, operationalDate) &&
            !task.completed
        );

        if (!existingTaskForToday && !canPlaceTaskInJudgmentScope({ date, startTime })) {
            showJudgedActionMutationBlockedToast();
            return;
        }

        if (existingTaskForToday) {
            await toggleTaskCompletion(existingTaskForToday.id);
            return;
        }

        const newTask: ScheduledTask = {
            id: crypto.randomUUID(),
            actionId,
            date,
            startTime,
            duration: action.duration,
            completed: true,
            createdAt: now.toISOString(),
        };

        setTasks(prev => [...prev, newTask]);
        if (taskMatchesOperationalDate(newTask, dailyCommitment.date) && !isClanQuestActionId(actionId)) {
            setDailyCommitmentState(prev => ({
                ...prev,
                taskIds: mergeTasksIntoCommitment(prev.taskIds, [newTask], prev.date, isClanQuestActionId)
            }));
        }

        const userId = getSupabaseUserId();
        if (userId) {
            try {
                const payload = { ...mapToSnakeCase(newTask), user_id: userId };
                const { error } = await supabase.from('scheduled_tasks').insert(payload);
                if (error) throw error;
                await maybeReconcileRetroactiveMutations(
                    [getEditableLockedOperationalDate(newTask)],
                    tasks,
                    [...tasks, newTask],
                );
            } catch (error: any) {
                rollbackOptimisticTaskCreation([newTask.id]);
                console.error('Supabase schedule task now error:', error?.message || error);
                showToast('Falha ao registrar a acao concluida.', 'error');
                return;
            }

            const arena = getArenas().find(item => item.id === action.arenaId);
            const clanQuest = getClanQuestForAction(action);

            if (clanQuest) {
                void updateClanMissionProgress(clanQuest.id, 1);
            }

            if (action.originCodexId?.startsWith('clan_quest:')) {
                const questId = action.originCodexId.split(':')[1];
                void updateCustomClanMissionProgress(questId, 1);
            }

            if (arena && !clanQuest) {
                void syncSharedCompletionForTask(action, arena, userId, true);
            }
        }

        const completionAttention = maybeTriggerArenaCompletionAttention(action, tasks, [...tasks, newTask]);
        if (!completionAttention) {
            emitAppSensoryCue('task_complete');
            maybeTriggerTaskCompletionSpeech(action, newTask, tasks, [...tasks, newTask]);
        }
        maybePromptDailyPanelFollowUp(newTask, action);
        onDailyProofActionCompleted?.({ task: newTask, action, tasksAfterChange: [...tasks, newTask] });
    };

    const scheduleAndCompleteAt = async (actionId: string, date: string, startTime: number, taskId?: string) => {
        const action = getActionById(actionId);
        if (!action || action.actionType === 'Marco') return;

        const existingTask = taskId
            ? tasks.find(task => task.id === taskId)
            : tasks.find(task => task.actionId === actionId && task.date === date);

        if (existingTask) {
            const existingTaskRetroDate = getEditableLockedOperationalDate(existingTask);
            if (isTaskLockedByJudgment(existingTask)) {
                showJudgedActionMutationBlockedToast();
                return;
            }

            const updatedTask: ScheduledTask = {
                ...existingTask,
                date,
                startTime,
                duration: action.duration,
                completed: true,
            };

            const nextRetroDate = getEditableLockedOperationalDate(updatedTask);
            if (!canPlaceTaskInJudgmentScope(updatedTask)) {
                showJudgedActionMutationBlockedToast();
                return;
            }

            const optimisticTasks = restoreTaskSnapshot(tasks, updatedTask);
            setTasks(prevTasks => restoreTaskSnapshot(prevTasks, updatedTask));
            setDailyCommitmentState(prev => ({
                ...prev,
                taskIds: reconcileTaskInCommitment(prev.taskIds, updatedTask.id, updatedTask, prev.date, isClanQuestActionId)
            }));

            try {
                await persistTaskCompletionUpdate(updatedTask);
                await maybeReconcileRetroactiveMutations(
                    [existingTaskRetroDate, nextRetroDate],
                    tasks,
                    optimisticTasks,
                );
            } catch (error: any) {
                console.error('Supabase complete task at time error:', error?.message || error);
                restoreTaskAfterPersistenceFailure(existingTask);
                showToast('Falha ao registrar a acao concluida.', 'error');
                return;
            }

            const completionAttention = maybeTriggerArenaCompletionAttention(action, tasks, optimisticTasks);
            if (!completionAttention && !existingTask.completed) {
                emitAppSensoryCue('task_complete');
                maybeTriggerTaskCompletionSpeech(action, updatedTask, tasks, optimisticTasks);
            }
            if (!existingTask.completed) {
                runTaskCompletionSideEffects(updatedTask, action, optimisticTasks);
            }
            maybePromptDailyPanelFollowUp(updatedTask, action);
            return;
        }

        const newTask: ScheduledTask = {
            id: crypto.randomUUID(),
            actionId,
            date,
            startTime,
            duration: action.duration,
            completed: true,
            createdAt: new Date().toISOString(),
        };

        if (!canPlaceTaskInJudgmentScope(newTask)) {
            showJudgedActionMutationBlockedToast();
            return;
        }

        const optimisticTasks = [...tasks, newTask];
        setTasks(prev => [...prev, newTask]);
        if (taskMatchesOperationalDate(newTask, dailyCommitment.date) && !isClanQuestActionId(actionId)) {
            setDailyCommitmentState(prev => ({
                ...prev,
                taskIds: mergeTasksIntoCommitment(prev.taskIds, [newTask], prev.date, isClanQuestActionId)
            }));
        }

        const userId = getSupabaseUserId();
        if (userId) {
            try {
                const payload = { ...mapToSnakeCase(newTask), user_id: userId };
                const { error } = await supabase.from('scheduled_tasks').insert(payload);
                if (error) throw error;
                await maybeReconcileRetroactiveMutations(
                    [getEditableLockedOperationalDate(newTask)],
                    tasks,
                    optimisticTasks,
                );
            } catch (error: any) {
                rollbackOptimisticTaskCreation([newTask.id]);
                console.error('Supabase schedule task at time error:', error?.message || error);
                showToast('Falha ao registrar a acao concluida.', 'error');
                return;
            }
        }

        const completionAttention = maybeTriggerArenaCompletionAttention(action, tasks, optimisticTasks);
        if (!completionAttention) {
            emitAppSensoryCue('task_complete');
            maybeTriggerTaskCompletionSpeech(action, newTask, tasks, optimisticTasks);
        }
        runTaskCompletionSideEffects(newTask, action, optimisticTasks);
        maybePromptDailyPanelFollowUp(newTask, action);
    };

    const scheduleAndCompleteMilestoneNow = async (actionId: string) => {
        const action = getActionById(actionId);
        if (!action || action.actionType !== 'Marco') return;

        const existingTask = tasks.find(task => task.actionId === actionId && isTaskInsideActiveCycle(task));
        if (existingTask) {
            if (!existingTask.completed) {
                await toggleTaskCompletion(existingTask.id);
            }
            return;
        }

        const now = new Date();
        const date = getLocalDateString(now);
        const nowInMinutes = now.getHours() * 60 + now.getMinutes();
        const startTime = nowInMinutes >= OPERATIONAL_DAY_START_MINUTE
            ? Math.max(OPERATIONAL_DAY_START_MINUTE, nowInMinutes - action.duration)
            : Math.max(0, nowInMinutes - action.duration);

        const newTask: ScheduledTask = {
            id: crypto.randomUUID(),
            actionId,
            date,
            startTime,
            duration: action.duration,
            completed: true,
        };

        if (!canPlaceTaskInJudgmentScope(newTask)) {
            showJudgedActionMutationBlockedToast();
            return;
        }

        setTasks(prevTasks => [...prevTasks, newTask]);
        if (taskMatchesOperationalDate(newTask, dailyCommitment.date)) {
            setDailyCommitmentState(prev => ({
                ...prev,
                taskIds: mergeTasksIntoCommitment(prev.taskIds, [newTask], prev.date, isClanQuestActionId)
            }));
        }

        const userId = getSupabaseUserId();
        if (userId) {
            try {
                const payload = { ...mapToSnakeCase(newTask), user_id: userId };
                const { error } = await supabase.from('scheduled_tasks').insert(payload);
                if (error) throw error;
                await maybeReconcileRetroactiveMutations(
                    [getEditableLockedOperationalDate(newTask)],
                    tasks,
                    [...tasks, newTask],
                );
            } catch (error: any) {
                rollbackOptimisticTaskCreation([newTask.id]);
                console.error('Supabase schedule milestone now error:', error?.message || error);
                showToast('Falha ao registrar o marco concluido.', 'error');
                return;
            }
        }

        const clanQuest = getClanQuestForAction(action);
        if (clanQuest) {
            void updateClanMissionProgress(clanQuest.id, 1);
        }

        if (action.originCodexId?.startsWith('clan_quest:')) {
            const questId = action.originCodexId.split(':')[1];
            void updateCustomClanMissionProgress(questId, 1);
        }

        const completionAttention = maybeTriggerArenaCompletionAttention(action, tasks, [...tasks, newTask]);
        if (!completionAttention) {
            emitAppSensoryCue('task_complete');
            showTaskProgressToast(action, [...tasks, newTask]);
            emitOracleSpeech({
                title: 'Marco',
                message: falarReacao('milestone_completed', { action: action.name }),
                tone: 'success',
                durationMs: 5000,
            }, 'marco');
        }
        maybePromptDailyPanelFollowUp(newTask, action);
        onDailyProofActionCompleted?.({ task: newTask, action, tasksAfterChange: [...tasks, newTask] });
        setAchievementUnlocked({ type: 'MILESTONE_COMPLETED', data: action });
        addFeedEvent({
            type: 'MILESTONE_COMPLETED',
            content: { title: action.name, icon: action.icon }
        });
    };

    const deleteTask = (taskId: string) => {
        const currentTask = tasks.find(task => task.id === taskId);
        const retroactiveOperationalDate = currentTask ? getEditableLockedOperationalDate(currentTask) : false;
        if (currentTask && isTaskLockedByJudgment(currentTask)) {
            showJudgedActionMutationBlockedToast();
            return;
        }

        const nextTasks = tasks.filter(task => task.id !== taskId);
        setTasks(nextTasks);
        setDailyCommitmentState(prev => (
            prev.taskIds.includes(taskId)
                ? { ...prev, taskIds: prev.taskIds.filter(id => id !== taskId) }
                : prev
        ));

        const userId = getSupabaseUserId();
        if (!userId) {
            void maybeReconcileRetroactiveMutations(retroactiveOperationalDate ? [retroactiveOperationalDate] : [], tasks, nextTasks);
            return;
        }

        supabase.from('scheduled_tasks').delete().eq('id', taskId).then(async ({ error }: { error?: { message?: string } }) => {
            if (error) {
                console.error('Supabase delete task error:', error.message);
                restoreTaskAfterPersistenceFailure(currentTask as ScheduledTask);
                showToast('Falha ao remover a tarefa no servidor.', 'error');
                return;
            }

            try {
                await maybeReconcileRetroactiveMutations(
                    retroactiveOperationalDate ? [retroactiveOperationalDate] : [],
                    tasks,
                    nextTasks,
                );
            } catch (reconcileError: any) {
                console.error('Retroactive judged day reconciliation error:', reconcileError?.message || reconcileError);
                showToast('A tarefa foi removida, mas nao foi possivel recalcular o resumo diario.', 'error');
            }
        });
    };

    const updateTask = (taskId: string, updates: Partial<ScheduledTask>) => {
        const currentTask = tasks.find(task => task.id === taskId);
        if (!currentTask) return;
        const previousRetroactiveOperationalDate = getEditableLockedOperationalDate(currentTask);
        if (isTaskLockedByJudgment(currentTask)) {
            showJudgedActionMutationBlockedToast();
            return;
        }

        const nextTask = { ...currentTask, ...updates };
        const nextRetroactiveOperationalDate = getEditableLockedOperationalDate(nextTask);
        const shouldReconcileDailyCommitment =
            updates.date !== undefined ||
            updates.actionId !== undefined ||
            updates.startTime !== undefined ||
            updates.completed !== undefined;

        setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? nextTask : task));

        if (shouldReconcileDailyCommitment) {
            setDailyCommitmentState(prev => ({
                ...prev,
                taskIds: reconcileTaskInCommitment(prev.taskIds, taskId, nextTask, prev.date, isClanQuestActionId)
            }));
        }

        const userId = getSupabaseUserId();
        if (!userId) return;

        const payload: Record<string, any> = {};
        if (updates.date !== undefined) payload.date = updates.date;
        if (updates.startTime !== undefined) payload.start_time = updates.startTime;
        if (updates.duration !== undefined) payload.duration = updates.duration;
        if (updates.completed !== undefined) payload.completed = updates.completed;
        if (updates.executionOrder !== undefined) payload.execution_order = updates.executionOrder;
        if (Object.keys(payload).length === 0) return;

        supabase.from('scheduled_tasks')
            .update(payload)
            .eq('id', taskId)
            .then(async ({ error }: { error?: { message?: string } }) => {
                if (error) {
                    console.error('Supabase update task error:', error.message);
                    restoreTaskAfterPersistenceFailure(currentTask);
                    showToast('Falha ao atualizar a tarefa no servidor.', 'error');
                    return;
                }

                try {
                    await maybeReconcileRetroactiveMutations(
                        [previousRetroactiveOperationalDate, nextRetroactiveOperationalDate],
                        tasks,
                        restoreTaskSnapshot(tasks, nextTask),
                    );
                } catch (reconcileError: any) {
                    console.error('Retroactive judged day reconciliation error:', reconcileError?.message || reconcileError);
                    showToast('A tarefa foi atualizada, mas nao foi possivel recalcular o resumo diario.', 'error');
                }
            });
    };

    const setTaskExecutionOrder = (taskId: string, executionOrder: number | null) => {
        setTasks(previous => previous.map(task => task.id === taskId ? { ...task, executionOrder } : task));

        const userId = getSupabaseUserId();
        if (!userId) return;

        supabase.from('scheduled_tasks')
            .update({ execution_order: executionOrder })
            .eq('id', taskId)
            .eq('user_id', userId)
            .then(({ error }: { error?: { message?: string } }) => {
                if (!error) return;
                console.error('Supabase task execution order error:', error.message);
                showToast('Nao foi possivel salvar a ordem da lista.', 'error');
            });
    };

    const rescheduleTask = (taskId: string, newDate: string, newStartTime: number) => {
        const currentTask = tasks.find(task => task.id === taskId);
        if (!currentTask) return;

        const action = getActionById(currentTask.actionId);
        const shouldSyncDurationFromAction =
            currentTask.startTime < 0 &&
            !currentTask.completed &&
            Number.isFinite(action?.duration);

        updateTask(taskId, {
            date: newDate,
            startTime: newStartTime,
            ...(shouldSyncDurationFromAction ? { duration: action?.duration } : {}),
        });
    };

    const returnTaskToPool = (taskId: string, targetOperationalDate?: string) => {
        const currentTask = tasks.find(task => task.id === taskId);
        if (currentTask && isTaskLockedByJudgment(currentTask)) {
            showJudgedActionMutationBlockedToast();
            return;
        }
        if (currentTask?.completed) {
            showToast('Essa acao ja esta concluida. Reabra manualmente antes de devolver ao estoque.', 'warning');
            return;
        }

        setDailyCommitmentState(prev => (
            prev.taskIds.includes(taskId)
                ? { ...prev, taskIds: prev.taskIds.filter(id => id !== taskId) }
                : prev
        ));

        const normalizedDate =
            !activeCycle && targetOperationalDate
                ? targetOperationalDate
                : currentTask?.date;

        updateTask(taskId, {
            ...(normalizedDate ? { date: normalizedDate } : {}),
            startTime: -1,
            completed: false,
            executionOrder: null,
        });
    };

    const getTasksForDate = (date: Date) => {
        const dateString = getLocalDateString(date);
        return tasks.filter(task => taskMatchesOperationalDate(task, dateString));
    };

    const completeTutorialMission = () => {
        const tutorialTask = tasks.find(task => task.actionId === tutorialActionId);
        if (tutorialTask && !tutorialTask.completed) {
            void toggleTaskCompletion(tutorialTask.id);
        } else if (!tutorialTask) {
            void scheduleAndCompleteMilestoneNow(tutorialActionId);
        }

        addProfileFlag(tutorialCompletedFlag);
    };

    return {
        scheduleMultipleTasks,
        scheduleTask,
        scheduleAndCompleteNow,
        scheduleAndCompleteAt,
        scheduleAndCompleteMilestoneNow,
        returnTaskToPool,
        deleteTask,
        getTasksForDate,
        rescheduleTask,
        updateTask,
        setTaskExecutionOrder,
        toggleTaskCompletion,
        completeTutorialMission,
    };
};
