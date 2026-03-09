const DAY_MS = 24 * 60 * 60 * 1000;

const parseIsoDate = (date) => new Date(`${date}T00:00:00Z`);
const formatIsoDate = (date) => date.toISOString().slice(0, 10);

const listDatesInRange = (startDate, endDate) => {
    const start = parseIsoDate(startDate);
    const end = parseIsoDate(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];

    const dates = [];
    for (let cursor = start.getTime(); cursor <= end.getTime(); cursor += DAY_MS) {
        dates.push(formatIsoDate(new Date(cursor)));
    }
    return dates;
};

const chunkDates = (dates, size) => {
    const chunks = [];
    for (let index = 0; index < dates.length; index += size) {
        chunks.push(dates.slice(index, index + size));
    }
    return chunks;
};

const sortBuckets = (left, right) => {
    return (right.total - left.total)
        || (right.completed - left.completed)
        || left.arenaName.localeCompare(right.arenaName);
};

const buildAtlasTaskItem = (task, actionById, arenaById) => {
    const action = actionById.get(task.actionId);
    const arenaId = action?.arenaId || 'unknown';
    const arenaName = arenaById.get(arenaId)?.name || 'Sem arena';

    return {
        taskId: task.id,
        actionId: task.actionId,
        actionName: action?.name || 'Acao desconhecida',
        actionIcon: action?.icon || '•',
        arenaId,
        arenaName,
        startTime: Number.isFinite(task.startTime) ? task.startTime : -1,
        duration: Number.isFinite(task.duration) ? task.duration : (action?.duration || 0),
        completed: !!task.completed,
        actionType: action?.actionType || 'Compromisso',
    };
};

const buildDayBuckets = (dayTasks, actionById, arenaById) => {
    const buckets = new Map();

    dayTasks.forEach((task) => {
        const action = actionById.get(task.actionId);
        const arenaId = action?.arenaId || 'unknown';
        const arenaName = arenaById.get(arenaId)?.name || 'Sem arena';
        const bucket = buckets.get(arenaId) || {
            arenaId,
            arenaName,
            total: 0,
            completed: 0,
        };

        bucket.total += 1;
        if (task.completed) bucket.completed += 1;
        buckets.set(arenaId, bucket);
    });

    return [...buckets.values()].sort(sortBuckets);
};

/**
 * @param {import('../types').ScheduledTask[]} cycleTasks
 * @param {import('../types').Action[]} actions
 * @param {import('../types').Arena[]} arenas
 * @param {string} startDate
 * @param {string} endDate
 * @returns {import('../types').ReportAtlasWeek[]}
 */
export const buildCycleWeeklyAtlas = (cycleTasks, actions, arenas, startDate, endDate) => {
    const dates = listDatesInRange(startDate, endDate);
    if (dates.length === 0) return [];

    const actionById = new Map(actions.map((action) => [action.id, action]));
    const arenaById = new Map(arenas.map((arena) => [arena.id, arena]));
    const tasksByDate = new Map();

    cycleTasks.forEach((task) => {
        if (!task?.date || task.date < startDate || task.date > endDate) return;
        const list = tasksByDate.get(task.date) || [];
        list.push(task);
        tasksByDate.set(task.date, list);
    });

    return chunkDates(dates, 7).map((weekDates, index) => {
        const days = weekDates.map((date) => {
            const dayTasks = [...(tasksByDate.get(date) || [])].sort((left, right) => {
                const leftTime = Number.isFinite(left.startTime) ? left.startTime : -1;
                const rightTime = Number.isFinite(right.startTime) ? right.startTime : -1;
                return leftTime - rightTime;
            });

            const plannedMinutes = dayTasks.reduce((sum, task) => {
                if (Number.isFinite(task.duration)) return sum + task.duration;
                return sum + (actionById.get(task.actionId)?.duration || 0);
            }, 0);
            const completedMinutes = dayTasks.reduce((sum, task) => {
                if (!task.completed) return sum;
                if (Number.isFinite(task.duration)) return sum + task.duration;
                return sum + (actionById.get(task.actionId)?.duration || 0);
            }, 0);
            const arenaBuckets = buildDayBuckets(dayTasks, actionById, arenaById);
            const atlasItems = dayTasks.map((task) => buildAtlasTaskItem(task, actionById, arenaById));
            const scheduledItems = atlasItems
                .filter((item) => item.startTime >= 0)
                .sort((left, right) => left.startTime - right.startTime || right.duration - left.duration || left.actionName.localeCompare(right.actionName));
            const unscheduledItems = atlasItems
                .filter((item) => item.startTime < 0)
                .sort((left, right) => left.actionName.localeCompare(right.actionName));

            return {
                date,
                plannedCount: dayTasks.length,
                completedCount: dayTasks.filter((task) => !!task.completed).length,
                plannedMinutes,
                completedMinutes,
                arenaBuckets,
                scheduledItems,
                unscheduledItems,
            };
        });

        const weeklyBuckets = new Map();
        days.forEach((day) => {
            day.arenaBuckets.forEach((bucket) => {
                const existing = weeklyBuckets.get(bucket.arenaId) || {
                    arenaId: bucket.arenaId,
                    arenaName: bucket.arenaName,
                    total: 0,
                    completed: 0,
                };
                existing.total += bucket.total;
                existing.completed += bucket.completed;
                weeklyBuckets.set(bucket.arenaId, existing);
            });
        });

        const dominantArena = [...weeklyBuckets.values()].sort(sortBuckets)[0];

        return {
            weekIndex: index + 1,
            startDate: weekDates[0],
            endDate: weekDates[weekDates.length - 1],
            plannedCount: days.reduce((sum, day) => sum + day.plannedCount, 0),
            completedCount: days.reduce((sum, day) => sum + day.completedCount, 0),
            plannedMinutes: days.reduce((sum, day) => sum + day.plannedMinutes, 0),
            completedMinutes: days.reduce((sum, day) => sum + day.completedMinutes, 0),
            dominantArenaId: dominantArena?.arenaId,
            dominantArenaName: dominantArena?.arenaName || 'Sem arena dominante',
            days,
        };
    });
};

