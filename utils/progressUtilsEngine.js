const normalizeArenaName = (value = '') =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

const isExplicitSharedArena = (arena) =>
    Boolean(arena.description?.includes('[SHARED]')) || normalizeArenaName(arena.name).startsWith('clan office');

const getPersonalCompletedCount = (actionId, tasks) =>
    tasks.filter(task => task.actionId === actionId && task.completed).length;

export const calculateArenaProgress = ({
    arena,
    actions,
    tasks,
    clanQuests = [],
    getClanQuestProgress,
    getSharedActionPoolProgress,
    forceSharedPool,
}) => {
    const normalizedArena = normalizeArenaName(arena.name);
    const isClanQuestArena = clanQuests.length > 0 || normalizedArena.includes('quests - cla');
    const isSeasonQuestArena = normalizedArena.includes('quests - season');

    if (isClanQuestArena) {
        const totals = clanQuests.reduce(
            (acc, quest) => {
                const goal = quest.requirements?.clanGoal || quest.goal_value || 50;
                const progress = typeof getClanQuestProgress === 'function' ? getClanQuestProgress(quest.id) || 0 : 0;
                return {
                    totalCompleted: acc.totalCompleted + progress,
                    totalPlanned: acc.totalPlanned + goal,
                };
            },
            { totalCompleted: 0, totalPlanned: 0 }
        );

        const progressPercent = totals.totalPlanned > 0
            ? Math.min(100, Math.max(0, (totals.totalCompleted / totals.totalPlanned) * 100))
            : (totals.totalCompleted > 0 ? 100 : 0);

        return {
            progressPercent,
            totalCompleted: totals.totalCompleted,
            totalPlanned: totals.totalPlanned,
            completedActionIds: progressPercent >= 100 ? actions.map(action => action.id) : [],
            isClanQuestArena,
            isSeasonQuestArena,
            isSharedPool: false,
            isCleared: progressPercent >= 100,
        };
    }

    const autoSharedPool =
        isExplicitSharedArena(arena) ||
        actions.some(action => (getSharedActionPoolProgress?.(arena.id, action.id) || 0) > 0);
    const isSharedPool = forceSharedPool ?? autoSharedPool;

    const completedActionIds = [];
    let totalCompleted = 0;
    let totalPlanned = 0;

    actions.forEach(action => {
        if (action.actionType === 'Livre') {
            return;
        }

        const planned = Math.max(1, Number(action.repetitions) || 1);
        const completed = isSharedPool && typeof getSharedActionPoolProgress === 'function'
            ? getSharedActionPoolProgress(arena.id, action.id) || 0
            : getPersonalCompletedCount(action.id, tasks);

        totalPlanned += planned;
        totalCompleted += completed;

        if (completed >= planned) {
            completedActionIds.push(action.id);
        }
    });

    const progressPercent = totalPlanned > 0
        ? Math.min(100, Math.max(0, (totalCompleted / totalPlanned) * 100))
        : 0;

    return {
        progressPercent,
        totalCompleted,
        totalPlanned,
        completedActionIds,
        isClanQuestArena,
        isSeasonQuestArena,
        isSharedPool,
        isCleared: actions.length > 0 && progressPercent >= 100,
    };
};

export const getCampaignArenaStates = ({
    campaign,
    arenasById,
    actionsByArena,
    tasks,
    getClanQuestsForArena,
    getClanQuestProgress,
    getSharedActionPoolProgress,
}) => {
    const progressByArena = {};

    campaign.arenaIds.forEach(arenaId => {
        const arena = arenasById[arenaId];
        if (!arena) return;

        const arenaActions = actionsByArena[arenaId] || [];
        const clanQuests = typeof getClanQuestsForArena === 'function'
            ? getClanQuestsForArena(arena, arenaActions) || []
            : [];

        progressByArena[arenaId] = calculateArenaProgress({
            arena,
            actions: arenaActions,
            tasks,
            clanQuests,
            getClanQuestProgress,
            getSharedActionPoolProgress,
        });
    });

    return campaign.arenaIds.reduce((acc, arenaId, index) => {
        const baseState = progressByArena[arenaId];
        if (!baseState) return acc;

        const prerequisiteArenaIds = campaign.arenaConfig?.[arenaId]?.prerequisiteArenaIds || [];
        const prerequisiteLock = prerequisiteArenaIds.some(prereqId => !progressByArena[prereqId]?.isCleared);
        const explicitLock = Boolean(campaign.arenaConfig?.[arenaId]?.isLocked);

        acc[arenaId] = {
            ...baseState,
            prerequisiteArenaIds,
            isLocked: explicitLock || prerequisiteLock,
        };

        return acc;
    }, {});
};

export const calculateCampaignProgress = (options) => {
    const arenaStates = getCampaignArenaStates(options);
    const visibleStates = options.campaign.arenaIds
        .map(arenaId => arenaStates[arenaId])
        .filter(Boolean);

    if (visibleStates.length === 0) return 0;

    const total = visibleStates.reduce((sum, state) => sum + state.progressPercent, 0);
    return Math.round(total / visibleStates.length);
};

