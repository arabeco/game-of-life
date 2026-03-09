import type { Action, Arena, ReportAtlasWeek, ScheduledTask } from '../types';

export function buildCycleWeeklyAtlas(
    cycleTasks: ScheduledTask[],
    actions: Action[],
    arenas: Arena[],
    startDate: string,
    endDate: string,
): ReportAtlasWeek[];
