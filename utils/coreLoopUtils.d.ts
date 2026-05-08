import type { Action, Arena, Cycle, DailyCommitment, ScheduledTask } from '../types';

export type TaskPoolItemLike = {
    actionId: string;
    unlimited?: boolean;
};

export type DailyArenaFocus = {
    arenaId: string;
    name: string;
    total: number;
    completed: number;
} | null;

export type SitrepStockOption = {
    count: number;
    action: Action;
    ids: string[];
};

export type ActionPoolByDate = Record<string, {
    count: number;
    isUnlimited: boolean;
    taskIds: string[];
}>;

export type CyclePaceMetrics = {
    executionRatePct: number;
    timeElapsedPct: number;
    paceDeltaPct: number;
    daysWithoutCompletion: number;
    consistencyDays: number;
    durationDays: number;
    plannedDurationDays: number;
};

export function dedupeIds(ids: string[]): string[];

export function mergeTasksIntoCommitment(
    taskIds: string[],
    tasks: Array<Pick<ScheduledTask, 'id' | 'actionId' | 'date'>>,
    commitmentDate: string,
    isQuestActionId: (actionId: string) => boolean,
): string[];

export function getInitialDailyCommitmentTaskIds(
    tasks: ScheduledTask[],
    commitmentDate: string,
    isQuestActionId: (actionId: string) => boolean,
): string[];

export function reconcileTaskInCommitment(
    taskIds: string[],
    taskId: string,
    nextTask: Pick<ScheduledTask, 'actionId' | 'date'>,
    commitmentDate: string,
    isQuestActionId: (actionId: string) => boolean,
): string[];

export function buildDailyArenaFocus(
    taskStatuses: Array<{ task: ScheduledTask; isCompleted: boolean }>,
    actions: Action[],
    arenas: Arena[],
): DailyArenaFocus;

export function buildActionPoolByDate(
    actions: Action[],
    taskPool: TaskPoolItemLike[],
    tasks: ScheduledTask[],
    date: string | null,
    trackedTaskIds?: string[],
    consumePoolTasks?: boolean,
): ActionPoolByDate;

export function buildSitrepStockOptions(
    actions: Action[],
    taskPool: TaskPoolItemLike[],
    tasks: ScheduledTask[],
    dailyCommitment: DailyCommitment,
): SitrepStockOption[];

export function buildTaskPoolEntries(
    actions: Action[],
    activeArenaIds: Set<string> | string[],
    isClanQuestActionId: (actionId: string) => boolean,
): TaskPoolItemLike[];

export function filterCycleTasksByScope(
    tasks: ScheduledTask[],
    actions: Action[],
    cycle: Pick<Cycle, 'arenaIds'> | null | undefined,
    startDate: string,
    endDate: string,
): ScheduledTask[];

export function buildCyclePaceMetrics(
    cycleTasks: ScheduledTask[],
    startDate: string,
    endDate: string,
    plannedEndDate?: string,
): CyclePaceMetrics;
