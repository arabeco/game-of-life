import type { Action, Arena, ScheduledTask } from '../types';

export type ArenaDomainFlags = {
    normalizedName: string;
    normalizedDescription: string;
    isSeasonQuest: boolean;
    isClanQuest: boolean;
    isQuest: boolean;
    isSideQuest: boolean;
    isShared: boolean;
    isOffice: boolean;
    hasLegacyClanQuestFallback: boolean;
};

export function normalizeDomainLabel(value?: string | null): string;
export function getArenaDomainFlags(arena?: Arena | null): ArenaDomainFlags;
export function isQuestArena(arena?: Arena | null): boolean;
export function isClanQuestArena(arena?: Arena | null): boolean;
export function isSeasonQuestArena(arena?: Arena | null): boolean;
export function isSideQuestArena(arena?: Arena | null): boolean;
export function isSharedArena(arena?: Arena | null): boolean;
export function isOfficeArena(arena?: Arena | null): boolean;
export function looksLikeClanQuestArena(arena?: Arena | null): boolean;
export function getArenaForAction(actionOrId: string | Action, actions: Action[], arenas: Arena[]): Arena | undefined;
export function isQuestAction(actionOrId: string | Action, actions: Action[], arenas: Arena[]): boolean;
export function isClanQuestAction(actionOrId: string | Action, actions: Action[], arenas: Arena[]): boolean;
export function isSeasonQuestAction(actionOrId: string | Action, actions: Action[], arenas: Arena[]): boolean;
export function isTaskInPool(task: Pick<ScheduledTask, 'startTime' | 'completed'>): boolean;
export function hasScheduledTime(task: Pick<ScheduledTask, 'startTime'>): boolean;
export function doesTaskConsumePoolCapacity(
    task: Pick<ScheduledTask, 'id' | 'startTime' | 'completed'>,
    trackedTaskIds?: string[],
): boolean;

