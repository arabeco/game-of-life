import React, { useEffect, useMemo, useState } from 'react';
import { useGame, PROFILE_FLAG_TUTORIAL_COMPLETED } from '../contexts/GameContext';
import { GlassCard } from '../components/GlassCard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ChevronRightIcon, UsersIcon, CheckIcon, XIcon } from '../components/Icons';
import { SeasonMission, SeasonQuest } from '../types';
import { MissionDetailModal, QuestDetailModal, SeasonDetailModal, SeasonTransitionModal } from '../components/SeasonDetailModal';
import { calculateArenaProgress } from '../utils/progressUtils';
import { getNextSeasonConfig, getSeasonLaunchToastStorageKey, isGenesisSeason, resolveRuntimeActiveSeason, resolveSeasonBackgroundUrl, resolveSeasonLoreText } from '../utils/seasonPresentation';
import { SYSTEM_CHALLENGES, SystemChallenge } from '../constants/systemChallenges';
import { GM_SEASON_MISSIONS } from '../constants/seasonContent';

type SelectableQuest = SeasonQuest | SystemChallenge;

const isSystemQuest = (quest: SelectableQuest): quest is SystemChallenge => (quest as SystemChallenge).source === 'system';

const formatQuestReward = (quest: SelectableQuest): string | undefined => {
    const parts: string[] = [];
    const xp = Number(quest.rewards?.xp || 0);
    if (xp > 0) parts.push(`${xp} XP`);

    if (isSystemQuest(quest)) {
        if (quest.rewardGold) parts.push(`${quest.rewardGold} ouro`);
        if (quest.rewardChest) parts.push(`baú ${quest.rewardChest}`);
    } else if (quest.rewards?.gold) {
        parts.push(`${quest.rewards.gold} ouro`);
    }

    return parts.length > 0 ? parts.join(' · ') : undefined;
};

// Every completed mission grants an insignia, so it always belongs in the summary.
const formatMissionReward = (mission: SeasonMission): string => {
    if (mission.reward_type === 'exp') {
        const xp = Number(mission.reward_value);
        return Number.isFinite(xp) && xp > 0 ? `${xp} XP · insígnia` : 'Insígnia';
    }
    const category = String(mission.reward_value || '').split(':')[0];
    return category === 'ornament' ? 'Ornamento · insígnia' : 'Insígnia';
};

const MissionSection: React.FC<{
    title: string;
    hint: string;
    count: number;
    children: React.ReactNode;
}> = ({ title, hint, count, children }) => (
    <section className="space-y-2">
        <div className="flex items-baseline justify-between px-1">
            <div className="flex items-center gap-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.16em] text-white/62">{title}</h4>
                <span className="text-[9px] font-bold text-white/28">{count}</span>
            </div>
            <span className="text-[9px] text-white/32">{hint}</span>
        </div>
        <div className="space-y-2">{children}</div>
    </section>
);

const SeasonQuestCard: React.FC<{
    title: string;
    icon?: string;
    metaLabel: string;
    isAccepted: boolean;
    progress: number;
    progressLabel?: string;
    participants?: number;
    reward?: string;
    onClick: () => void;
    onAbort?: () => void;
}> = ({ title, icon, metaLabel, isAccepted, progress, progressLabel, participants, reward, onClick, onAbort }) => {
    const isCompleted = progress >= 100;

    return (
        <GlassCard
            variant="neutral"
            className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3 transition-all duration-200 active:scale-[0.99] ${isAccepted
                ? 'border-[var(--skin-accent-color)]/22 bg-[var(--skin-accent-color)]/[0.055] hover:border-[var(--skin-accent-color)]/38'
                : 'border-white/8 bg-white/[0.025] hover:border-white/16 hover:bg-white/[0.045]'}`}
            onClick={onClick}
        >
            {isAccepted && <div className="absolute inset-y-0 left-0 w-[2px] bg-[var(--skin-accent-color)]/75" />}
            <div className="flex items-start justify-between relative z-10">
                <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex items-center space-x-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/25 text-lg text-white shadow-inner">
                            {icon || '📜'}
                        </div>
                        <div>
                            <h3 className="line-clamp-2 text-[12px] font-black uppercase leading-tight tracking-[0.06em] text-white">{title}</h3>
                            <div className="flex items-center space-x-2 mt-0.5">
                                <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] ${isAccepted ? 'bg-[var(--skin-accent-color)]/12 text-[var(--skin-accent-color)]' : 'bg-white/8 text-white/48'}`}>
                                    {metaLabel}
                                </span>
                                {typeof participants === 'number' && (
                                    <div className="flex items-center space-x-1 text-[9px] text-gray-400 font-bold">
                                        <UsersIcon className="w-3 h-3" />
                                        <span>{participants} ativos</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {reward && (
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-200/72">
                            <span aria-hidden="true">🏅</span>
                            <span className="truncate">{reward}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.1em]">
                            <span className="text-white/38">{isAccepted ? 'Progresso' : 'Disponível'}</span>
                            <span className="text-white/68">{isAccepted ? (progressLabel || `${progress}%`) : 'Ver missão'}</span>
                        </div>
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-black/40">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,255,255,0.2)] bg-gradient-to-r from-[var(--skin-accent-color)] to-white"
                                style={{ width: `${Math.min(100, isAccepted ? progress : 0)}%` }}
                            />
                            {isCompleted && (
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="ml-2 flex h-full flex-col items-center justify-center space-y-1.5 pt-1">
                    {isCompleted ? (
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500 blur-md animate-ping opacity-30 rounded-full" />
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.5)] relative z-10">
                                <CheckIcon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors group-hover:bg-white/10">
                                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            {isAccepted && onAbort && (
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onAbort();
                                    }}
                                    className="flex h-7 w-7 items-center justify-center rounded-full border border-red-500/15 bg-red-500/5 transition-colors hover:bg-red-500/15"
                                    title="Abandonar missão"
                                >
                                    <XIcon className="w-4 h-4 text-red-400/50 group-hover/abort:text-red-400" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

        </GlassCard>
    );
};

export const SeasonView: React.FC = () => {
    const {
        userProfile,
        tasks,
        reports,
        activeCycle,
        seasons,
        seasonMissions,
        seasonQuests,
        acceptSeasonQuest,
        abortSeasonQuest,
        getArenas,
        getActionsForArena,
        getClanQuestProgress,
        getClanQuestsForArena,
        clanQuestParticipants,
        fetchClanQuestParticipants,
        userMissionParticipations,
        showToast,
        updateUserProfile,
    } = useGame();
    const [selectedQuest, setSelectedQuest] = useState<SelectableQuest | null>(null);
    const [selectedAutomaticMission, setSelectedAutomaticMission] = useState<SeasonMission | null>(null);
    const [isSeasonDetailOpen, setSeasonDetailOpen] = useState(false);
    const [isSeasonTransitionOpen, setSeasonTransitionOpen] = useState(false);
    const [isMissionLibraryOpen, setMissionLibraryOpen] = useState(false);
    const [pendingAbandon, setPendingAbandon] = useState<{ id: string; title: string; kind: 'system' | 'season' } | null>(null);

    const activeSeason = resolveRuntimeActiveSeason(seasons);
    const quests = useMemo(
        () => seasonQuests.filter((quest) => !activeSeason || !quest.season_id || quest.season_id === activeSeason.id),
        [seasonQuests, activeSeason?.id]
    );

    const allArenas = getArenas();
    const allActions = useMemo(
        () => allArenas.flatMap((arena) => getActionsForArena(arena.id)),
        [allArenas, getActionsForArena]
    );
    const completedFlags = useMemo(() => new Set(userProfile.completedSeasonMissions || []), [userProfile.completedSeasonMissions]);
    const automaticSeasonMissions = useMemo(() => {
        if (!activeSeason) return [];

        const merged = [
            ...GM_SEASON_MISSIONS.filter((mission) => mission.season_id === activeSeason.id),
            ...seasonMissions.filter((mission) => mission.season_id === activeSeason.id),
        ];
        const seen = new Set<string>();

        return merged.filter((mission) => {
            if (seen.has(mission.id) || completedFlags.has(mission.id)) return false;
            seen.add(mission.id);
            return mission.goal_type !== 'actions_completed' && mission.goal_type !== 'milestones_completed';
        });
    }, [activeSeason, seasonMissions, completedFlags]);

    useEffect(() => {
        quests.forEach((quest) => {
            if (quest.type === 'clan' && quest.actionTemplate?.name) {
                fetchClanQuestParticipants?.(quest.id, quest.actionTemplate.name);
            }
        });
    }, [quests, fetchClanQuestParticipants]);

    const hasQuestAction = (quest: SeasonQuest): boolean => (
        allActions.some((action) => action.name === quest.actionTemplate.name || action.name === quest.title)
    );

    const countCompletedTasksForQuest = (quest: SeasonQuest): number => {
        const matchingActionIds = new Set(
            allActions
                .filter((action) => action.name === quest.actionTemplate.name || action.name === quest.title)
                .map((action) => action.id)
        );

        if (matchingActionIds.size === 0) return 0;
        return tasks.filter((task) => matchingActionIds.has(task.actionId) && task.completed).length;
    };

    const isQuestAccepted = (quest: SeasonQuest): boolean => {
        if (quest.type === 'clan') {
            return Boolean(userMissionParticipations?.[quest.id]) || hasQuestAction(quest);
        }
        return hasQuestAction(quest);
    };

    const calculateQuestProgress = (quest: SeasonQuest): number => {
        if (completedFlags.has(quest.id)) return 100;

        const required = quest.type === 'clan'
            ? (quest.requirements?.clanGoal || quest.goal_value || quest.actionTemplate.repetitions || 1)
            : (quest.requirements?.totalReps || quest.goal_value || quest.actionTemplate.repetitions || 1);

        if (quest.type === 'clan') {
            const clanProgress = getClanQuestProgress?.(quest.id) || 0;
            return Math.min(100, Math.round((clanProgress / Math.max(required, 1)) * 100));
        }

        const count = countCompletedTasksForQuest(quest);
        return Math.min(100, Math.round((count / Math.max(required, 1)) * 100));
    };

    const tutorialCompleted = completedFlags.has(PROFILE_FLAG_TUTORIAL_COMPLETED)
        || tasks.some((task) => task.actionId === 'action_tutorial_01' && task.completed);
    const hasInstalledCampaign = allArenas.some((arena) => Boolean(arena.originCodexId));
    const hasCreatedCycle = Boolean(activeCycle) || reports.length > 0;
    const completedRealActions = useMemo(() => {
        const realActionIds = new Set(allActions.filter((action) => action.actionType !== 'Livre').map((action) => action.id));
        return tasks.filter((task) => task.completed && realActionIds.has(task.actionId)).length;
    }, [allActions, tasks]);
    const clearedArenaCount = useMemo(() => {
        return allArenas.reduce((count, arena) => {
            const arenaActions = getActionsForArena(arena.id);
            const clanQuests = getClanQuestsForArena?.(arena, arenaActions) || [];
            const progress = calculateArenaProgress({
                arena,
                actions: arenaActions,
                tasks,
                clanQuests,
                getClanQuestProgress,
            });
            return count + (progress.isCleared ? 1 : 0);
        }, 0);
    }, [allArenas, getActionsForArena, tasks, getClanQuestsForArena, getClanQuestProgress]);
    const hasCompletedCycle = reports.length > 0;
    const currentProofStreak = Math.max(0, Number(userProfile.dailyProofStreak?.current || 0));

    const getSystemQuestProgress = (quest: SystemChallenge): number => {
        if (completedFlags.has(quest.id)) return 100;

        switch (quest.id) {
            case 'tutorial-quest':
                return tutorialCompleted ? 100 : 0;
            case 'system-first-campaign':
                return hasInstalledCampaign ? 100 : 0;
            case 'system-first-cycle':
                return hasCreatedCycle ? 100 : 0;
            case 'system-five-day-proof-streak':
                return Math.min(100, Math.round((currentProofStreak / 5) * 100));
            case 'system-first-arena-gold':
                return Math.min(100, clearedArenaCount * 100);
            case 'system-twenty-actions':
                return Math.min(100, Math.round((completedRealActions / 20) * 100));
            case 'system-first-cycle-report':
                return hasCompletedCycle ? 100 : 0;
            default:
                return 0;
        }
    };

    const getAutomaticSeasonMissionProgress = (mission: SeasonMission): number => {
        if (completedFlags.has(mission.id)) return 100;

        const goal = Math.max(1, Number(mission.goal_value || 1));
        switch (mission.goal_type) {
            case 'tutorial_completed':
                return tutorialCompleted ? 100 : 0;
            case 'cycle_created':
                return hasCreatedCycle ? 100 : 0;
            case 'campaign_installed':
                return hasInstalledCampaign ? 100 : 0;
            case 'arena_completed':
            case 'arena_cleared':
                return Math.min(100, Math.round((clearedArenaCount / goal) * 100));
            case 'cycle_completed':
            case 'report_completed':
                return hasCompletedCycle ? 100 : 0;
            case 'quests_claimed': {
                const sourceIds = mission.sourceQuestIds || [];
                const completedCount = sourceIds.length > 0
                    ? sourceIds.filter((id) => completedFlags.has(id)).length
                    : quests.filter((quest) => completedFlags.has(quest.id)).length;
                return Math.min(100, Math.round((completedCount / goal) * 100));
            }
            default:
                return 0;
        }
    };

    const acceptedSystemIds = useMemo(
        () => new Set(userProfile.acceptedSystemChallenges || []),
        [userProfile.acceptedSystemChallenges]
    );
    const activeSystemQuests = useMemo(
        () => SYSTEM_CHALLENGES.filter((quest) => acceptedSystemIds.has(quest.id) && !completedFlags.has(quest.id)).slice(0, 1),
        [acceptedSystemIds, completedFlags]
    );
    const availableSystemQuests = useMemo(
        () => SYSTEM_CHALLENGES.filter((quest) => quest.id !== activeSystemQuests[0]?.id && !completedFlags.has(quest.id)),
        [activeSystemQuests, completedFlags]
    );

    const acceptSystemQuest = (questId: string) => {
        const replaced = activeSystemQuests[0];
        updateUserProfile({ acceptedSystemChallenges: [questId] });
        const quest = SYSTEM_CHALLENGES.find((candidate) => candidate.id === questId);

        // Only one system challenge can be active, so say plainly what was swapped out
        // instead of letting the previous one disappear without a word.
        if (replaced && replaced.id !== questId) {
            showToast(`"${quest?.title || 'Missão'}" substituiu "${replaced.title}". O progresso da anterior foi mantido.`, 'info');
            return;
        }
        showToast(`Missao escolhida${quest ? `: ${quest.title}` : ''}.`, 'success');
    };

    const abandonSystemQuest = (questId: string) => {
        updateUserProfile({ acceptedSystemChallenges: (userProfile.acceptedSystemChallenges || []).filter((id) => id !== questId) });
        showToast('Missao removida. Seu progresso foi mantido.', 'info');
    };

    const individualQuests = useMemo(
        () => quests.filter((quest) => (
            quest.type === 'individual'
            && !completedFlags.has(quest.id)
            && (!quest.goal_type || quest.goal_type === 'actions_completed' || quest.goal_type === 'milestones_completed')
        )),
        [quests, completedFlags]
    );
    const activeIndividualQuests = useMemo(
        () => individualQuests.filter((quest) => isQuestAccepted(quest)),
        [individualQuests, allActions, userMissionParticipations]
    );
    const availableIndividualQuests = useMemo(
        () => individualQuests.filter((quest) => !isQuestAccepted(quest)),
        [individualQuests, allActions, userMissionParticipations]
    );
    const clanQuests = useMemo(
        () => quests.filter((quest) => quest.type === 'clan' && !completedFlags.has(quest.id)),
        [quests, completedFlags]
    );
    const activeClanQuests = useMemo(
        () => clanQuests.filter((quest) => isQuestAccepted(quest)),
        [clanQuests, allActions, userMissionParticipations]
    );
    const availableClanQuests = useMemo(
        () => clanQuests.filter((quest) => !isQuestAccepted(quest)),
        [clanQuests, allActions, userMissionParticipations]
    );
    // Counts only what the player actually took on; season missions are assigned, not chosen.
    const chosenMissionCount = activeSystemQuests.length
        + activeIndividualQuests.length
        + activeClanQuests.length;
    const activeMissionCount = automaticSeasonMissions.length
        + activeSystemQuests.length
        + activeIndividualQuests.length
        + activeClanQuests.length;

    const isGenesis = isGenesisSeason(activeSeason);
    const activeSeasonBackground = resolveSeasonBackgroundUrl(activeSeason);
    const activeSeasonLore = resolveSeasonLoreText(activeSeason);
    const nextSeason = getNextSeasonConfig(activeSeason?.id);

    useEffect(() => {
        if (!activeSeason || !nextSeason) return;

        const seasonEnd = new Date(`${activeSeason.end_date}T23:59:59`);
        if (Number.isNaN(seasonEnd.getTime()) || Date.now() < seasonEnd.getTime()) return;

        const storageKey = `glyph:season-transition:${activeSeason.id}:${nextSeason.id}`;
        if (window.localStorage.getItem(storageKey) === 'seen') return;

        window.localStorage.setItem(storageKey, 'seen');
        setSeasonTransitionOpen(true);
    }, [activeSeason, nextSeason]);

    const handleCloseSeasonTransition = () => {
        setSeasonTransitionOpen(false);
        if (!activeSeason || typeof window === 'undefined') return;

        const toastKey = getSeasonLaunchToastStorageKey(activeSeason.id);
        const pendingToast = window.localStorage.getItem(toastKey);
        if (!pendingToast) return;

        window.localStorage.removeItem(toastKey);
        showToast(pendingToast, 'success');
    };

    const selectedQuestProgress = selectedQuest
        ? (isSystemQuest(selectedQuest)
            ? (activeSystemQuests[0]?.id === selectedQuest.id ? getSystemQuestProgress(selectedQuest) : 0)
            : calculateQuestProgress(selectedQuest))
        : 0;
    const selectedQuestIsActive = selectedQuest ? (isSystemQuest(selectedQuest) ? activeSystemQuests[0]?.id === selectedQuest.id : isQuestAccepted(selectedQuest)) : false;

    return (
        <div className="space-y-8 pb-20 animate-fade-in">
            {activeSeason && (
                <>
                    <GlassCard
                        variant="accent"
                        className="relative overflow-hidden cursor-pointer group hover:border-[var(--skin-accent-color)] transition-all"
                        onClick={() => setSeasonDetailOpen(true)}
                    >
                        {activeSeasonBackground && (
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                style={{ backgroundImage: `url('${activeSeasonBackground}')` }}
                            />
                        )}

                        {isGenesis ? (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#2e003e] via-[#6a1b9a]/80 to-[#b0bec5]/80 opacity-90 group-hover:opacity-80 transition-opacity" />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--skin-accent-color)]/90 to-black/90 group-hover:opacity-90 transition-opacity" />
                        )}

                        <div className="relative z-10 flex justify-between items-center p-4">
                            <div>
                                <div className="text-[10px] uppercase tracking-[0.2em] accent-text mb-1 drop-shadow-md">TEMPORADA ATUAL</div>
                                <h2 className="text-2xl font-black accent-text drop-shadow-lg uppercase">{activeSeason.name}</h2>
                                <p className="text-xs text-gray-200 italic mt-1 group-hover:text-white transition-colors drop-shadow-md max-w-[80%]">
                                    "{(activeSeasonLore || 'Nova era').slice(0, 60)}..."
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-white drop-shadow-md">Termina em</div>
                                <div className="text-lg font-mono accent-text drop-shadow-md">
                                    {new Date(activeSeason.end_date).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <span className="text-[10px] font-bold text-[var(--skin-accent-color)] uppercase tracking-wider bg-black/80 px-2 py-1 rounded-full border border-[var(--skin-accent-color)]/30 backdrop-blur-sm">Ver detalhes</span>
                        </div>
                    </GlassCard>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 px-1 pb-2">
                            <div className="flex items-center gap-2.5">
                                <h3 className="text-sm font-black uppercase tracking-[0.12em] text-white/82">Minhas missões</h3>
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-white/10 bg-white/7 px-1.5 text-[9px] font-black text-white/55">
                                    {chosenMissionCount}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMissionLibraryOpen((open) => !open)}
                                className="rounded-lg border border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-[var(--skin-accent-color)]"
                            >
                                {isMissionLibraryOpen ? 'Fechar' : 'Escolher'}
                            </button>
                        </div>
                        <div className="space-y-5">
                            {automaticSeasonMissions.length > 0 && (
                                <MissionSection title="Da temporada" hint="Atribuídas" count={automaticSeasonMissions.length}>
                                    {automaticSeasonMissions.map((mission) => (
                                        <SeasonQuestCard
                                            key={mission.id}
                                            title={mission.title}
                                            icon={mission.icon}
                                            metaLabel="Temporada"
                                            isAccepted={true}
                                            progress={getAutomaticSeasonMissionProgress(mission)}
                                            reward={formatMissionReward(mission)}
                                            onClick={() => setSelectedAutomaticMission(mission)}
                                        />
                                    ))}
                                </MissionSection>
                            )}

                            {(activeSystemQuests.length > 0 || activeIndividualQuests.length > 0) && (
                                <MissionSection
                                    title="Sua escolha"
                                    hint={`${activeSystemQuests.length}/1 desafio`}
                                    count={activeSystemQuests.length + activeIndividualQuests.length}
                                >
                                    {activeSystemQuests.map((quest) => (
                                        <SeasonQuestCard
                                            key={quest.id}
                                            title={quest.title}
                                            icon={quest.actionTemplate.icon}
                                            metaLabel="Desafio"
                                            isAccepted={true}
                                            progress={getSystemQuestProgress(quest)}
                                            progressLabel={quest.id === 'system-five-day-proof-streak'
                                                ? `${Math.min(currentProofStreak, 5)}/5 dias`
                                                : quest.id === 'system-twenty-actions'
                                                    ? `${Math.min(completedRealActions, 20)}/20 acoes`
                                                    : quest.id === 'system-first-arena-gold'
                                                        ? `${Math.min(clearedArenaCount, 1)}/1 arena`
                                                        : undefined}
                                            reward={formatQuestReward(quest)}
                                            onClick={() => setSelectedQuest(quest)}
                                            onAbort={() => setPendingAbandon({ id: quest.id, title: quest.title, kind: 'system' })}
                                        />
                                    ))}
                                    {activeIndividualQuests.map((quest) => (
                                        <SeasonQuestCard
                                            key={quest.id}
                                            title={quest.title}
                                            icon={quest.actionTemplate.icon}
                                            metaLabel="Com arena"
                                            isAccepted={true}
                                            progress={calculateQuestProgress(quest)}
                                            reward={formatQuestReward(quest)}
                                            onClick={() => setSelectedQuest(quest)}
                                            onAbort={() => setPendingAbandon({ id: quest.id, title: quest.title, kind: 'season' })}
                                        />
                                    ))}
                                </MissionSection>
                            )}

                            {activeClanQuests.length > 0 && (
                                <MissionSection title="Do grupo" hint="Progresso coletivo" count={activeClanQuests.length}>
                                    {activeClanQuests.map((quest) => (
                                        <SeasonQuestCard
                                            key={quest.id}
                                            title={quest.title}
                                            icon={quest.actionTemplate.icon}
                                            metaLabel="Grupo"
                                            isAccepted={true}
                                            progress={calculateQuestProgress(quest)}
                                            participants={clanQuestParticipants[quest.id] || 0}
                                            reward={formatQuestReward(quest)}
                                            onClick={() => setSelectedQuest(quest)}
                                            onAbort={() => setPendingAbandon({ id: quest.id, title: quest.title, kind: 'season' })}
                                        />
                                    ))}
                                </MissionSection>
                            )}

                            {activeMissionCount === 0 && (
                                <div className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-5 text-center">
                                    <p className="text-[11px] font-bold text-white/62">Nenhuma missão em andamento.</p>
                                    <button type="button" onClick={() => setMissionLibraryOpen(true)} className="mt-3 rounded-lg border border-[var(--skin-accent-color)]/25 bg-[var(--skin-accent-color)]/10 px-4 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-[var(--skin-accent-color)]">
                                        Escolher missão
                                    </button>
                                </div>
                            )}
                        </div>

                        {isMissionLibraryOpen && (
                            <div className="space-y-2 rounded-xl border border-white/8 bg-black/15 p-2.5">
                                <div className="flex items-center justify-between px-1 pb-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/58">Missões disponíveis</p>
                                    <span className="text-[9px] font-bold text-white/32">{availableSystemQuests.length + availableIndividualQuests.length + availableClanQuests.length}</span>
                                </div>
                                {availableSystemQuests.map((quest) => (
                                    <SeasonQuestCard
                                        key={quest.id}
                                        title={quest.title}
                                        icon={quest.actionTemplate.icon}
                                        metaLabel={activeSystemQuests.length > 0 ? 'Substitui a atual' : 'Desafio'}
                                        isAccepted={false}
                                        progress={0}
                                        reward={formatQuestReward(quest)}
                                        onClick={() => setSelectedQuest(quest)}
                                    />
                                ))}
                                {availableIndividualQuests.map((quest) => (
                                    <SeasonQuestCard
                                        key={quest.id}
                                        title={quest.title}
                                        icon={quest.actionTemplate.icon}
                                        metaLabel="Cria uma arena"
                                        isAccepted={false}
                                        progress={0}
                                        reward={formatQuestReward(quest)}
                                        onClick={() => setSelectedQuest(quest)}
                                    />
                                ))}
                                {availableClanQuests.map((quest) => (
                                    <SeasonQuestCard
                                        key={quest.id}
                                        title={quest.title}
                                        icon={quest.actionTemplate.icon}
                                        metaLabel="Missão do grupo"
                                        isAccepted={false}
                                        progress={0}
                                        participants={clanQuestParticipants[quest.id] || 0}
                                        reward={formatQuestReward(quest)}
                                        onClick={() => setSelectedQuest(quest)}
                                    />
                                ))}
                                {availableSystemQuests.length === 0 && availableIndividualQuests.length === 0 && availableClanQuests.length === 0 && (
                                    <p className="py-3 text-center text-[10px] text-white/42">Nenhuma missão disponível.</p>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {pendingAbandon && (
                <ConfirmationModal
                    title="Abandonar missão"
                    message={`"${pendingAbandon.title}" sai da sua lista. O progresso já feito é mantido, e você pode pegá-la de novo depois.`}
                    confirmLabel="ABANDONAR"
                    variant="danger"
                    onConfirm={() => {
                        if (pendingAbandon.kind === 'system') {
                            abandonSystemQuest(pendingAbandon.id);
                        } else {
                            void abortSeasonQuest(pendingAbandon.id);
                        }
                        setPendingAbandon(null);
                    }}
                    onCancel={() => setPendingAbandon(null)}
                />
            )}

            {!activeSeason && (
                <div className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-8 text-center">
                    <p className="text-[11px] font-bold text-white/62">Nenhuma temporada ativa no momento.</p>
                    <p className="mt-1.5 text-[10px] text-white/38">As missões aparecem aqui assim que a próxima temporada começar.</p>
                </div>
            )}

            {selectedAutomaticMission && (
                <MissionDetailModal
                    mission={selectedAutomaticMission}
                    progress={getAutomaticSeasonMissionProgress(selectedAutomaticMission)}
                    isCompleted={completedFlags.has(selectedAutomaticMission.id)}
                    onClose={() => setSelectedAutomaticMission(null)}
                />
            )}

            {selectedQuest && (
                <QuestDetailModal
                    quest={selectedQuest}
                    progress={selectedQuestProgress}
                    isActive={selectedQuestIsActive}
                    participants={!isSystemQuest(selectedQuest) && selectedQuest.type === 'clan' ? (clanQuestParticipants[selectedQuest.id] || 0) : undefined}
                    onClose={() => setSelectedQuest(null)}
                    onTake={() => {
                        if (isSystemQuest(selectedQuest)) {
                            acceptSystemQuest(selectedQuest.id);
                            setMissionLibraryOpen(false);
                            setSelectedQuest(null);
                        } else {
                            void acceptSeasonQuest(selectedQuest.id);
                            setMissionLibraryOpen(false);
                            setSelectedQuest(null);
                        }
                    }}
                    onAbandon={selectedQuestIsActive ? () => {
                        if (isSystemQuest(selectedQuest)) {
                            abandonSystemQuest(selectedQuest.id);
                        } else {
                            void abortSeasonQuest(selectedQuest.id);
                        }
                        setSelectedQuest(null);
                    } : undefined}
                    createsArena={!isSystemQuest(selectedQuest)}
                />
            )}

            {isSeasonDetailOpen && activeSeason && (
                <SeasonDetailModal
                    season={activeSeason}
                    onClose={() => setSeasonDetailOpen(false)}
                    onOpenTransition={() => setSeasonTransitionOpen(true)}
                />
            )}
            {isSeasonTransitionOpen && activeSeason && nextSeason && (
                <SeasonTransitionModal
                    fromSeason={activeSeason}
                    toSeason={nextSeason}
                    onClose={handleCloseSeasonTransition}
                />
            )}
        </div>
    );
};
