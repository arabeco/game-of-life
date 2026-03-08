/**
 * @typedef {import('../types').ScheduledTask} ScheduledTask
 */

/**
 * @param {Array<{ id: string }>} items
 * @param {string[]} idsToRemove
 */
export const removeEntitiesById = (items, idsToRemove) => {
    const idSet = new Set(idsToRemove);
    return items.filter(item => !idSet.has(item.id));
};

/**
 * @param {string[]} taskIds
 * @param {string[]} idsToRemove
 */
export const removeTaskIds = (taskIds, idsToRemove) => {
    const idSet = new Set(idsToRemove);
    return taskIds.filter(id => !idSet.has(id));
};

/**
 * @param {ScheduledTask[]} tasks
 * @param {ScheduledTask} snapshot
 */
export const restoreTaskSnapshot = (tasks, snapshot) => {
    if (!tasks.some(task => task.id === snapshot.id)) {
        return tasks;
    }

    return tasks.map(task => task.id === snapshot.id ? snapshot : task);
};
/**
 * @param {ScheduledTask} task
 * @param {number} actionDuration
 * @param {number} nowInMinutes
 */
export const buildToggledTaskSnapshot = (task, actionDuration, nowInMinutes) => {
    const willComplete = !task.completed;
    const updatedTask = {
        ...task,
        completed: willComplete,
    };

    if (willComplete && updatedTask.startTime < 0) {
        updatedTask.startTime = Math.max(0, nowInMinutes - actionDuration);
    }

    return updatedTask;
};
