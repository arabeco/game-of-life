import { doesTaskConsumePoolCapacity, hasScheduledTime } from './taskDomain.js';

/**
 * @typedef {import('../types').Action} Action
 * @typedef {import('../types').Arena} Arena
 * @typedef {import('../types').Cycle} Cycle
 * @typedef {import('../types').DailyCommitment} DailyCommitment
 * @typedef {import('../types').ScheduledTask} ScheduledTask
 */

/**
 * @typedef {{ actionId: string, unlimited?: boolean }} TaskPoolItemLike
 */

const parseIsoDate = (value) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
};

/**
 * @param {string[]} ids
 * @returns {string[]}
 */
export const dedupeIds = (ids) => Array.from(new Set(ids));

/**
 * @param {string[]} taskIds
 * @param {Array<Pick<ScheduledTask, 'id' | 'actionId' | 'date'>>} tasks
 * @param {string} commitmentDate
 * @param {(actionId: string) => boolean} isQuestActionId
 * @returns {string[]}
 */
export const mergeTasksIntoCommitment = (taskIds, tasks, commitmentDate, isQuestActionId) => {
    const trackedTaskIds = tasks
        .filter(task => task.date === commitmentDate && !isQuestActionId(task.actionId))
        .map(task => task.id);

    return dedupeIds([...taskIds, ...trackedTaskIds]);
};

/**
 * @param {ScheduledTask[]} tasks
 * @param {string} commitmentDate
 * @param {(actionId: string) => boolean} isQuestActionId
 * @returns {string[]}
 */
export const getInitialDailyCommitmentTaskIds = (tasks, commitmentDate, isQuestActionId) => {
    const scheduledToday = tasks.filter(task =>
        task.date === commitmentDate &&
        !isQuestActionId(task.actionId) &&
        (hasScheduledTime(task) || task.completed)
    );

    return mergeTasksIntoCommitment([], scheduledToday, commitmentDate, isQuestActionId);
};

/**
 * @param {string[]} taskIds
 * @param {string} taskId
 * @param {Pick<ScheduledTask, 'actionId' | 'date'>} nextTask
 * @param {string} commitmentDate
 * @param {(actionId: string) => boolean} isQuestActionId
 * @returns {string[]}
 */
export const reconcileTaskInCommitment = (taskIds, taskId, nextTask, commitmentDate, isQuestActionId) => {
    const shouldTrack = nextTask.date === commitmentDate && !isQuestActionId(nextTask.actionId);
    const isTracked = taskIds.includes(taskId);

    if (shouldTrack && !isTracked) {
        return [...taskIds, taskId];
    }

    if (!shouldTrack && isTracked) {
        return taskIds.filter(id => id !== taskId);
    }

    return taskIds;
};

/**
 * @param {Array<{ task: ScheduledTask, isCompleted: boolean }>} taskStatuses
 * @param {Action[]} actions
 * @param {Arena[]} arenas
 * @returns {{ arenaId: string, name: string, total: number, completed: number } | null}
 */
export const buildDailyArenaFocus = (taskStatuses, actions, arenas) => {
    const actionById = new Map(actions.map(action => [action.id, action]));
    const arenaById = new Map(arenas.map(arena => [arena.id, arena]));
    const arenaStats = taskStatuses.reduce((acc, { task, isCompleted }) => {
        const action = actionById.get(task.actionId);
        const arena = action ? arenaById.get(action.arenaId) : undefined;
        if (!action || !arena) return acc;

        const current = acc.get(arena.id) || { arenaId: arena.id, name: arena.name, total: 0, completed: 0 };
        current.total += 1;
        if (isCompleted) current.completed += 1;
        acc.set(arena.id, current);
        return acc;
    }, new Map());

    const candidates = Array.from(arenaStats.values());
    return candidates.sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        if (b.completed !== a.completed) return b.completed - a.completed;
        return a.name.localeCompare(b.name);
    })[0] || null;
};

/**
 * @param {Action[]} actions
 * @param {TaskPoolItemLike[]} taskPool
 * @param {ScheduledTask[]} tasks
 * @param {string | null | undefined} date
 * @param {string[]} [trackedTaskIds=[]]
 * @returns {Record<string, { count: number, isUnlimited: boolean, taskIds: string[] }>}
 */
export const buildActionPoolByDate = (actions, taskPool, tasks, date, trackedTaskIds = []) => {
    const actionById = new Map(actions.map(action => [action.id, action]));
    const grouped = {};

    for (const actionId of new Set(taskPool.map(item => item.actionId))) {
        const action = actionById.get(actionId);
        if (!action) continue;

        const maxRepetitions = Number.isFinite(action.repetitions) ? Math.max(1, Math.floor(action.repetitions)) : 1;
        const isUnlimited = taskPool.some(item => item.actionId === action.id && item.unlimited);
        const tasksForAction = tasks.filter(task =>
            task.actionId === action.id &&
            (!date || task.date === date)
        );
        const consumedCount = tasksForAction.filter(task => doesTaskConsumePoolCapacity(task, trackedTaskIds)).length;
        const remaining = isUnlimited ? 99 : Math.max(0, maxRepetitions - consumedCount);

        grouped[action.id] = { count: remaining, isUnlimited, taskIds: [] };
    }

    return grouped;
};

/**
 * @param {Action[]} actions
 * @param {TaskPoolItemLike[]} taskPool
 * @param {ScheduledTask[]} tasks
 * @param {DailyCommitment} dailyCommitment
 * @returns {Array<{ count: number, action: Action, ids: string[] }>}
 */
export const buildSitrepStockOptions = (actions, taskPool, tasks, dailyCommitment) => {
    const actionById = new Map(actions.map(action => [action.id, action]));
    return Object.entries(buildActionPoolByDate(actions, taskPool, tasks, dailyCommitment.date, dailyCommitment.taskIds))
        .filter(([, payload]) => payload.count > 0)
        .map(([actionId, payload]) => ({ count: payload.count, action: actionById.get(actionId), ids: [actionId] }))
        .filter(group => !!group.action);
};

/**
 * @param {Action[]} actions
 * @param {Set<string> | string[]} activeArenaIds
 * @param {(actionId: string) => boolean} isClanQuestActionId
 * @returns {TaskPoolItemLike[]}
 */
export const buildTaskPoolEntries = (actions, activeArenaIds, isClanQuestActionId) => {
    const arenaIdSet = activeArenaIds instanceof Set ? activeArenaIds : new Set(activeArenaIds);
    const activeActions = actions.filter(action => arenaIdSet.has(action.arenaId));
    const poolableActions = activeActions.filter(action => action.actionType !== 'Marco');

    return poolableActions.flatMap(action => {
        if (isClanQuestActionId(action.id) || action.actionType === 'Livre') {
            return [{ actionId: action.id, unlimited: true }];
        }

        const repetitions = Number.isFinite(action.repetitions) ? Math.max(1, Math.floor(action.repetitions)) : 1;
        return Array.from({ length: repetitions }, () => ({ actionId: action.id }));
    });
};

/**
 * @param {ScheduledTask[]} tasks
 * @param {Action[]} actions
 * @param {Pick<Cycle, 'arenaIds'> | null | undefined} cycle
 * @param {string} startDate
 * @param {string} endDate
 * @returns {ScheduledTask[]}
 */
export const filterCycleTasksByScope = (tasks, actions, cycle, startDate, endDate) => {
    const cycleArenaIdSet = cycle?.arenaIds?.length ? new Set(cycle.arenaIds) : null;
    const actionArenaById = new Map(actions.map(action => [action.id, action.arenaId]));

    return tasks.filter(task => {
        if (task.date < startDate || task.date > endDate) return false;
        if (!cycleArenaIdSet) return true;
        const arenaId = actionArenaById.get(task.actionId);
        return !!arenaId && cycleArenaIdSet.has(arenaId);
    });
};

/**
 * @param {ScheduledTask[]} cycleTasks
 * @param {string} startDate
 * @param {string} endDate
 * @param {string | undefined} plannedEndDate
 * @returns {{
 *   executionRatePct: number,
 *   timeElapsedPct: number,
 *   paceDeltaPct: number,
 *   daysWithoutCompletion: number,
 *   consistencyDays: number,
 *   durationDays: number,
 *   plannedDurationDays: number
 * }}
 */
export const buildCyclePaceMetrics = (cycleTasks, startDate, endDate, plannedEndDate) => {
    const completedTasks = cycleTasks.filter(task => task.completed);
    const uniqueDays = new Set(completedTasks.map(task => task.date)).size;
    const start = parseIsoDate(startDate);
    const end = parseIsoDate(endDate);
    const plannedEnd = plannedEndDate ? parseIsoDate(plannedEndDate) : end;
    const durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const plannedDurationDays = Math.max(1, Math.round((plannedEnd.getTime() - start.getTime()) / 86400000) + 1);
    const progress = cycleTasks.length > 0 ? (completedTasks.length / cycleTasks.length) * 100 : 100;
    const executionRatePct = cycleTasks.length > 0 ? Math.min(100, Math.round(progress)) : 100;
    const timeElapsedPct = Math.min(100, Math.round((durationDays / plannedDurationDays) * 100));
    const paceDeltaPct = executionRatePct - timeElapsedPct;
    const daysWithoutCompletion = Math.max(0, durationDays - uniqueDays);

    return {
        executionRatePct,
        timeElapsedPct,
        paceDeltaPct,
        daysWithoutCompletion,
        consistencyDays: uniqueDays,
        durationDays,
        plannedDurationDays,
    };
};

