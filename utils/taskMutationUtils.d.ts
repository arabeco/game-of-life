import type { ScheduledTask } from '../types';

export function removeEntitiesById<T extends { id: string }>(items: T[], idsToRemove: string[]): T[];
export function removeTaskIds(taskIds: string[], idsToRemove: string[]): string[];
export function restoreTaskSnapshot(tasks: ScheduledTask[], snapshot: ScheduledTask): ScheduledTask[];
export function buildToggledTaskSnapshot(task: ScheduledTask, actionDuration: number, nowInMinutes: number): ScheduledTask;
