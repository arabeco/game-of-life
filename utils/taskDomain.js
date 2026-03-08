/**
 * @typedef {import('../types').Action} Action
 * @typedef {import('../types').Arena} Arena
 * @typedef {import('../types').ScheduledTask} ScheduledTask
 */

/**
 * @param {string | undefined | null} value
 * @returns {string}
 */
export const normalizeDomainLabel = (value) => {
    if (!value) return '';
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
};

/**
 * @param {Arena | null | undefined} arena
 * @returns {{
 *   normalizedName: string,
 *   normalizedDescription: string,
 *   isSeasonQuest: boolean,
 *   isClanQuest: boolean,
 *   isQuest: boolean,
 *   isSideQuest: boolean,
 *   isShared: boolean,
 *   isOffice: boolean,
 *   hasLegacyClanQuestFallback: boolean,
 * }}
 */
export const getArenaDomainFlags = (arena) => {
    const normalizedName = normalizeDomainLabel(arena?.name);
    const normalizedDescription = normalizeDomainLabel(arena?.description);
    const isSeasonQuest = normalizedName.includes('quests - season');
    const isClanQuest = normalizedName.includes('quests - cla');

    return {
        normalizedName,
        normalizedDescription,
        isSeasonQuest,
        isClanQuest,
        isQuest: isSeasonQuest || isClanQuest,
        isSideQuest: normalizedName.includes('outros') || normalizedName.includes('sidequest') || normalizedName.includes('side quest'),
        isShared: normalizedDescription.includes('[shared]'),
        isOffice: normalizedName.startsWith('clan office'),
        hasLegacyClanQuestFallback: normalizedName === '1' || normalizedName.includes('socializar') || normalizedName.includes('unidade'),
    };
};

export const isQuestArena = (arena) => getArenaDomainFlags(arena).isQuest;
export const isClanQuestArena = (arena) => getArenaDomainFlags(arena).isClanQuest;
export const isSeasonQuestArena = (arena) => getArenaDomainFlags(arena).isSeasonQuest;
export const isSideQuestArena = (arena) => getArenaDomainFlags(arena).isSideQuest;
export const isSharedArena = (arena) => getArenaDomainFlags(arena).isShared;
export const isOfficeArena = (arena) => getArenaDomainFlags(arena).isOffice;

/**
 * @param {Arena | null | undefined} arena
 * @returns {boolean}
 */
export const looksLikeClanQuestArena = (arena) => {
    const flags = getArenaDomainFlags(arena);
    return flags.isClanQuest || flags.hasLegacyClanQuestFallback;
};

/**
 * @param {string | Action} actionOrId
 * @param {Action[]} actions
 * @param {Arena[]} arenas
 * @returns {Arena | undefined}
 */
export const getArenaForAction = (actionOrId, actions, arenas) => {
    const actionId = typeof actionOrId === 'string' ? actionOrId : actionOrId?.id;
    const action = typeof actionOrId === 'string'
        ? actions.find(candidate => candidate.id === actionId)
        : actionOrId;

    if (!action) return undefined;
    return arenas.find(arena => arena.id === action.arenaId);
};

export const isQuestAction = (actionOrId, actions, arenas) => isQuestArena(getArenaForAction(actionOrId, actions, arenas));
export const isClanQuestAction = (actionOrId, actions, arenas) => isClanQuestArena(getArenaForAction(actionOrId, actions, arenas));
export const isSeasonQuestAction = (actionOrId, actions, arenas) => isSeasonQuestArena(getArenaForAction(actionOrId, actions, arenas));

/**
 * @param {Pick<ScheduledTask, 'startTime' | 'completed'>} task
 * @returns {boolean}
 */
export const isTaskInPool = (task) => task.startTime < 0 && !task.completed;

/**
 * @param {Pick<ScheduledTask, 'startTime'>} task
 * @returns {boolean}
 */
export const hasScheduledTime = (task) => task.startTime >= 0;

/**
 * @param {Pick<ScheduledTask, 'id' | 'startTime' | 'completed'>} task
 * @param {string[]} [trackedTaskIds]
 * @returns {boolean}
 */
export const doesTaskConsumePoolCapacity = (task, trackedTaskIds = []) => {
    return task.completed || hasScheduledTime(task) || trackedTaskIds.includes(task.id);
};

