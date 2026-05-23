import type { Dispatch, SetStateAction } from 'react';
import type { Action, Arena, Campaign, Clan, Cycle, DailyCommitment, DayOfWeek, FeedEvent, FeedEventType, ScheduledTask, SeasonQuest } from '../../types';
import { mergeTasksIntoCommitment, reconcileTaskInCommitment } from '../../utils/coreLoopUtils.js';
import { OPERATIONAL_DAY_START_MINUTE, getOperationalDateString, getTaskOperationalDateString, taskMatchesOperationalDate } from '../../utils/operationalDay.js';
import { isSharedArena } from '../../utils/taskDomain.js';
import { buildToggledTaskSnapshot, removeEntitiesById, removeTaskIds, restoreTaskSnapshot } from '../../utils/taskMutationUtils.js';
import { calculateArenaProgress, calculateCampaignProgressSummary } from '../../utils/progressUtils';
import { emitArenaAttention } from '../../utils/arenaAttention';
import { emitAppSensoryCue } from '../../utils/sensoryCue';

type ToastTone = 'success' | 'error' | 'info';
type AchievementState = { type: FeedEventType; data: any } | null;
type SupabaseLike = { from: (table: string) => any };
type CompletionAttentionResult = 'arena' | 'campaign' | null;

const DAY_MAP: DayOfWeek[] = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

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
    toggleTaskCompletion: (taskId: string) => Promise<void>;
    completeTutorialMission: () => void;
}

interface CreateTaskDomainParams {
    tasks: ScheduledTask[];
    activeCycle: Cycle | null;
    campaigns: Campaign[];
    dailyCommitment: DailyCommitment;
    judgedOperationalDates: string[];
    clan: Clan | null;
    supabase: SupabaseLike;
    setTasks: Dispatch<SetStateAction<ScheduledTask[]>>;
    setDailyCommitmentState: Dispatch<SetStateAction<DailyCommitment>>;
    getActionById: (actionId: string) => Action | undefined;
    getArenas: () => Arena[];
    getActionsForArena: (arenaId: string) => Action[];
    getClanQuestForAction: (action: Action | undefined) => SeasonQuest | null;
    getSupabaseUserId: () => string | null | undefined;
    isClanQuestActionId: (actionId: string) => boolean;
    showToast: (message: string, tone: ToastTone) => void;
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
    activeCycle,
    campaigns,
    dailyCommitment,
    judgedOperationalDates,
    clan,
    supabase,
    setTasks,
    setDailyCommitmentState,
    getActionById,
    getArenas,
    getActionsForArena,
    getClanQuestForAction,
    getSupabaseUserId,
    isClanQuestActionId,
    showToast,
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
    const isOperationalDateJudged = (operationalDate: string) =>
        !!operationalDate && judgedOperationalDates.includes(operationalDate);

    const isTaskLockedByClosedDay = (task: ScheduledTask) => {
        const taskOperationalDate = getTaskOperationalDateString(task);
        if (!taskOperationalDate) return false;

        return (taskOperationalDate === dailyCommitment.date && dailyCommitment.stage === 'judgment')
            || isOperationalDateJudged(taskOperationalDate);
    };

    const getEditableLockedOperationalDate = (task: Pick<ScheduledTask, 'date' | 'startTime'>): string | false => {
        const taskOperationalDate = getTaskOperationalDateString(task as ScheduledTask);
        if (!taskOperationalDate || !activeCycle) return false;
        if (taskOperationalDate < activeCycle.startDate || taskOperationalDate > activeCycle.endDate) return false;

        if (
            (taskOperationalDate === dailyCommitment.date && dailyCommitment.stage === 'judgment')
            || isOperationalDateJudged(taskOperationalDate)
        ) {
            return taskOperationalDate;
        }

        return false;
    };

    const isTaskCompletionEditableWithinOpenCycle = (task: ScheduledTask) => Boolean(getEditableLockedOperationalDate(task));

    const canMutateClosedDayPlacement = (task: Pick<ScheduledTask, 'date' | 'startTime'>) =>
        !isCommitmentDayClosedForTask(task) || Boolean(getEditableLockedOperationalDate(task));

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

    const showClosedDayMutationBlockedToast = () => {
        showToast('Esse dia ja foi julgado e agora esta travado.', 'error');
    };

    const isCommitmentDayClosedForTask = (task: Pick<ScheduledTask, 'date' | 'startTime'>) => {
        const operationalDate = getTaskOperationalDateString(task as Pick<ScheduledTask, 'date' | 'startTime'> & Partial<ScheduledTask>);
        if (!operationalDate) return false;

        return (dailyCommitment.stage === 'judgment' && operationalDate === dailyCommitment.date)
            || isOperationalDateJudged(operationalDate);
    };

    const isTaskInsideActiveCycle = (task: Pick<ScheduledTask, 'date'>) => {
        if (!activeCycle) return true;
        return task.date >= activeCycle.startDate && task.date <= activeCycle.endDate;
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

        const previousProgress = calculateArenaProgress({
            arena,
            actions: arenaActions,
            tasks: previousTasks,
        });

        const nextProgress = calculateArenaProgress({
            arena,
            actions: arenaActions,
            tasks: nextTasks,
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
                tasks: previousTasks,
            });
            const nextCampaignProgress = calculateCampaignProgressSummary({
                campaign: parentCampaign,
                arenasById,
                actionsByArena,
                tasks: nextTasks,
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

        showToast(
            campaignJustCleared && parentCampaign
                ? `Campanha "${parentCampaign.title}" concluida.`
                : `Arena "${arena.name}" concluida.`,
            'success',
        );
        addFeedEvent({
            type: 'ARENA_COMPLETED',
            content: { title: arena.name, icon: arena.icon || '🏟️' }
        });

        setAchievementUnlocked({
            type: 'ARENA_COMPLETED',
            data: {
                name: arena.name,
                icon: arena.icon || '🏛️',
                arenaId: arena.id,
            }
        });

        if (handleCompetitionArenaCompletion) {
            void handleCompetitionArenaCompletion(arena.id);
        }

        return campaignJustCleared ? 'campaign' : 'arena';
    };

    const maybePromptSitrepFollowUp = (task: ScheduledTask, action?: Action) => {
        void task;
        void action;
    };

    const scheduleMultipleTasks = async (actionOrId: string | Action, daysOfWeek: DayOfWeek[], startTimeInMinutes: number) => {
        const action = typeof actionOrId === 'string' ? getActionById(actionOrId) : actionOrId;
        if (!action) return;
        const actionId = action.id;

        const existingKeys = new Set(tasks.map(task => `${task.actionId}_${task.date}_${task.startTime}`));
        const newTasks: ScheduledTask[] = [];
        const currentDate = new Date();

        for (let i = 0; i < 365; i += 1) {
            const date = new Date(currentDate);
            date.setDate(currentDate.getDate() + i);
            const dayOfWeek = DAY_MAP[date.getDay()];
            if (!daysOfWeek.includes(dayOfWeek)) continue;

            const dateString = getLocalDateString(date);
            const key = `${actionId}_${dateString}_${startTimeInMinutes}`;
            if (existingKeys.has(key)) continue;

            newTasks.push({
                id: crypto.randomUUID(),
                actionId,
                date: dateString,
                startTime: startTimeInMinutes,
                duration: action.duration,
                completed: false,
            });
            existingKeys.add(key);
        }

        if (newTasks.length === 0) return;

        const allowedTasks = newTasks.filter(task => canMutateClosedDayPlacement(task));
        if (allowedTasks.length !== newTasks.length) {
            showClosedDayMutationBlockedToast();
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

        if (!canMutateClosedDayPlacement(newTask)) {
            showClosedDayMutationBlockedToast();
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

        const isOfficeMode = clan?.clanType === 'Office';
        let shouldPersistSharedCompletion = isOfficeMode || isSharedArena(arena);

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
        const retroactiveOperationalDate = getEditableLockedOperationalDate(taskToCheck);
        const wasLockedByClosedDay = isTaskLockedByClosedDay(taskToCheck);
        const canRetroactivelyToggle = Boolean(retroactiveOperationalDate);
        if (wasLockedByClosedDay && !canRetroactivelyToggle) {
            showClosedDayMutationBlockedToast();
            return;
        }

        const action = getActionById(taskToCheck.actionId);
        const now = new Date();
        const nowInMinutes = now.getHours() * 60 + now.getMinutes();
        const operationalToday = getOperationalDateString(now);
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

        setTasks(prevTasks => restoreTaskSnapshot(prevTasks, updatedTask));
        setDailyCommitmentState(prev => ({
            ...prev,
            taskIds: reconcileTaskInCommitment(prev.taskIds, updatedTask.id, updatedTask, prev.date, isClanQuestActionId),
        }));

        try {
            await persistTaskCompletionUpdate(updatedTask);
        } catch (error: any) {
            console.error('Supabase toggle task completion error:', error?.message || error);
            restoreTaskAfterPersistenceFailure(taskToCheck);
            showToast('Falha ao atualizar a tarefa no servidor.', 'error');
            return;
        }

        if (wasLockedByClosedDay && canRetroactivelyToggle) {
            try {
                await maybeReconcileRetroactiveMutations([retroactiveOperationalDate], tasks, optimisticTasks);
            } catch (error: any) {
                console.error('Retroactive judged day reconciliation error:', error?.message || error);
                showToast('A tarefa foi atualizada, mas nao foi possivel recalcular o dia fechado.', 'error');
            }
        }

        const completionAttention = updatedTask.completed
            ? maybeTriggerArenaCompletionAttention(action, tasks, optimisticTasks)
            : null;
        if (updatedTask.completed && !completionAttention) {
            emitAppSensoryCue('task_complete');
        }
        runTaskCompletionSideEffects(updatedTask, action, optimisticTasks);
        maybePromptSitrepFollowUp(updatedTask, action);
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

        if (!existingTaskForToday && !canMutateClosedDayPlacement({ date, startTime })) {
            showClosedDayMutationBlockedToast();
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
        }
        maybePromptSitrepFollowUp(newTask, action);
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
            if (isTaskLockedByClosedDay(existingTask) && !existingTaskRetroDate) {
                showClosedDayMutationBlockedToast();
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
            if (!canMutateClosedDayPlacement(updatedTask)) {
                showClosedDayMutationBlockedToast();
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
            }
            if (!existingTask.completed) {
                runTaskCompletionSideEffects(updatedTask, action, optimisticTasks);
            }
            maybePromptSitrepFollowUp(updatedTask, action);
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

        if (!canMutateClosedDayPlacement(newTask)) {
            showClosedDayMutationBlockedToast();
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
        }
        runTaskCompletionSideEffects(newTask, action, optimisticTasks);
        maybePromptSitrepFollowUp(newTask, action);
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

        if (!canMutateClosedDayPlacement(newTask)) {
            showClosedDayMutationBlockedToast();
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
        }
        maybePromptSitrepFollowUp(newTask, action);
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
        if (currentTask && isTaskLockedByClosedDay(currentTask) && !retroactiveOperationalDate) {
            showClosedDayMutationBlockedToast();
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
                showToast('A tarefa foi removida, mas nao foi possivel recalcular o dia fechado.', 'error');
            }
        });
    };

    const updateTask = (taskId: string, updates: Partial<ScheduledTask>) => {
        const currentTask = tasks.find(task => task.id === taskId);
        if (!currentTask) return;
        const previousRetroactiveOperationalDate = getEditableLockedOperationalDate(currentTask);
        if (isTaskLockedByClosedDay(currentTask) && !previousRetroactiveOperationalDate) {
            showClosedDayMutationBlockedToast();
            return;
        }

        const nextTask = { ...currentTask, ...updates };
        const nextRetroactiveOperationalDate = getEditableLockedOperationalDate(nextTask);
        if (isCommitmentDayClosedForTask({ date: nextTask.date, startTime: nextTask.startTime }) && !nextRetroactiveOperationalDate) {
            showClosedDayMutationBlockedToast();
            return;
        }
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
                    showToast('A tarefa foi atualizada, mas nao foi possivel recalcular o dia fechado.', 'error');
                }
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
        if (currentTask && isTaskLockedByClosedDay(currentTask)) {
            showClosedDayMutationBlockedToast();
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
        toggleTaskCompletion,
        completeTutorialMission,
    };
};
