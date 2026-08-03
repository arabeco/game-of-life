import type { ScheduledTask, UserProfile } from '../types';

export const FREE_PROGRESS_RESET_FLAG_PREFIX = 'free_progress_reset_at:';

export const buildFreeProgressResetFlag = (date = new Date()) =>
    `${FREE_PROGRESS_RESET_FLAG_PREFIX}${date.toISOString()}`;

export const getFreeProgressResetAt = (profile?: Pick<UserProfile, 'completedSeasonMissions'> | null) => {
    const flags = profile?.completedSeasonMissions || [];
    return flags
        .filter((flag) => typeof flag === 'string' && flag.startsWith(FREE_PROGRESS_RESET_FLAG_PREFIX))
        .map((flag) => flag.slice(FREE_PROGRESS_RESET_FLAG_PREFIX.length))
        .filter((value) => !Number.isNaN(Date.parse(value)))
        .sort()
        .at(-1) || null;
};

const getTaskAnchorTime = (task: ScheduledTask) => {
    const candidates = [task.completedAt, task.createdAt];
    for (const candidate of candidates) {
        if (candidate && !Number.isNaN(Date.parse(candidate))) {
            return Date.parse(candidate);
        }
    }

    if (task.date && !Number.isNaN(Date.parse(`${task.date}T00:00:00`))) {
        return Date.parse(`${task.date}T00:00:00`);
    }

    return 0;
};

export const filterTasksAfterFreeProgressReset = <T extends ScheduledTask>(tasks: T[], resetAt?: string | null): T[] => {
    if (!resetAt) return tasks;
    const resetTime = Date.parse(resetAt);
    if (Number.isNaN(resetTime)) return tasks;
    return tasks.filter((task) => getTaskAnchorTime(task) > resetTime);
};
