import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGame, PROFILE_FLAG_TUTORIAL_COMPLETED } from '../contexts/GameContext';
import { GlassCard } from '../components/GlassCard';
import { ChevronRightIcon, UsersIcon, CheckIcon, XIcon } from '../components/Icons';
import { ChestType, ConfigSeasonQuest, SeasonMission, SeasonQuest } from '../types';
import { QuestDetailModal, SeasonDetailModal, SeasonTransitionModal } from '../components/SeasonDetailModal';
import { calculateArenaProgress } from '../utils/progressUtils';
import { getNextSeasonConfig, getSeasonLaunchToastStorageKey, isGenesisSeason, resolveRuntimeActiveSeason, resolveSeasonBackgroundUrl, resolveSeasonLoreText } from '../utils/seasonPresentation';

type SystemQuest = ConfigSeasonQuest & {
    source: 'system';
    rewardChest: ChestType;
};

type SelectableQuest = SeasonQuest | SystemQuest;

const SYSTEM_QUEST_INSIGNIA_ID = 'insignia_quest_incomum';

const SYSTEM_QUESTS: SystemQuest[] = [
    {
        id: 'tutorial-quest',
        source: 'system',
        title: 'Concluir o Tutorial',
        description: 'Feche a trilha inicial do sistema. Recompensa: 1 Bau Comum.',
        type: 'individual',
        category: 'intellectual',
        actionTemplate: {
            name: 'Tutorial de Iniciacao',
            description: 'Concluir a sequencia de onboarding.',
            icon: '🎓',
            duration: 0,
            repetitions: 1,
            isMilestone: true,
        },
        requirements: { totalReps: 1, milestone: true },
        rewards: { xp: 1000 },
        rewardChest: 'Comum',
    },
    {
        id: 'system-first-campaign',
        source: 'system',
        title: 'Instalar a Primeira Campanha',
        description: 'Instale uma campanha no seu board e coloque o sistema para rodar. Recompensa: 1 Bau Comum.',
        type: 'individual',
        category: 'intellectual',
        actionTemplate: {
            name: 'Primeira Campanha Instalada',
            description: 'Ter ao menos uma campanha instalada.',
            icon: '📦',
            duration: 0,
            repetitions: 1,
            isMilestone: true,
        },
        requirements: { totalReps: 1, milestone: true },
        rewards: { xp: 1250 },
        rewardChest: 'Comum',
    },
    {
        id: 'system-first-cycle',
        source: 'system',
        title: 'Criar o Primeiro Ciclo',
        description: 'Abra seu primeiro ciclo real para organizar a execucao. Recompensa: 1 Bau Comum.',
        type: 'individual',
        category: 'intellectual',
        actionTemplate: {
            name: 'Primeiro Ciclo Criado',
            description: 'Ter um ciclo ativo ou um ciclo ja fechado.',
            icon: '🔄',
            duration: 0,
            repetitions: 1,
            isMilestone: true,
        },
        requirements: { totalReps: 1, milestone: true },
        rewards: { xp: 1500 },
        rewardChest: 'Comum',
    },
    {
        id: 'system-first-arena-clear',
        source: 'system',
        title: 'Completar a Primeira Arena',
        description: 'Feche uma arena inteira e prove que o board saiu do papel. Recompensa: 1 Bau Incomum.',
        type: 'individual',
        category: 'physical',
        actionTemplate: {
            name: 'Primeira Arena Completa',
            description: 'Levar uma arena a 100% de progresso.',
            icon: '🏟️',
            duration: 0,
            repetitions: 1,
            isMilestone: true,
        },
        requirements: { totalReps: 1, milestone: true },
        rewards: { xp: 2250 },
        rewardChest: 'Incomum',
    },
    {
        id: 'system-first-cycle-report',
        source: 'system',
        title: 'Concluir o Primeiro Ciclo',
        description: 'Feche um ciclo inteiro e receba um bonus real pelo primeiro relatorio. Recompensa: 1 Bau Ciclo.',
        type: 'individual',
        category: 'spiritual',
        actionTemplate: {
            name: 'Primeiro Relatorio de Ciclo',
            description: 'Gerar o primeiro relatorio de ciclo completo.',
            icon: '📜',
            duration: 0,
            repetitions: 1,
            isMilestone: true,
        },
        requirements: { totalReps: 1, milestone: true },
        rewards: { xp: 3500 },
        rewardChest: 'Ciclo',
    },
];

const isSystemQuest = (quest: SelectableQuest): quest is SystemQuest => (quest as SystemQuest).source === 'system';

const SeasonQuestCard: React.FC<{
    title: string;
    icon?: string;
    metaLabel: string;
    isAccepted: boolean;
    isClaimed: boolean;
    progress: number;
    participants?: number;
    onClick: () => void;
    onAbort?: () => void;
}> = ({ title, icon, metaLabel, isAccepted, isClaimed, progress, participants, onClick, onAbort }) => {
    const isCompleted = progress >= 100;

    return (
        <GlassCard
            variant="neutral"
            className="p-4 relative overflow-hidden group transition-all duration-500 cursor-pointer border-2 border-white/10 hover:border-white/30 shadow-xl hover:translate-y-[-2px] active:scale-[0.98] rounded-2xl"
            onClick={onClick}
        >
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 bg-white" />

            <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner bg-white/10 text-white">
                            {icon || '📜'}
                        </div>
                        <div>
                            <h3 className="font-black text-sm uppercase tracking-wider luxe-title-shadow leading-tight">{title}</h3>
                            <div className="flex items-center space-x-2 mt-0.5">
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter bg-white/10 text-gray-300">
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

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-gray-400">{isAccepted ? 'Progresso' : 'Status'}</span>
                            <span className="font-mono text-white">{isAccepted ? `${progress}%` : 'Pendente'}</span>
                        </div>
                        <div className="relative w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/5 p-[1px]">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,255,255,0.2)] bg-gradient-to-r from-[var(--skin-accent-color)] to-white"
                                style={{ width: `${Math.min(100, isAccepted ? progress : 0)}%` }}
                            />
                            {isCompleted && !isClaimed && (
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center h-full pt-1 space-y-2">
                    {isClaimed ? (
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                            <CheckIcon className="w-5 h-5 text-green-400" />
                        </div>
                    ) : isCompleted ? (
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500 blur-md animate-ping opacity-30 rounded-full" />
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.5)] relative z-10">
                                <CheckIcon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            {isAccepted && onAbort && (
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onAbort();
                                    }}
                                    className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 hover:bg-red-500/20 transition-colors group/abort"
                                    title="Abandonar missao"
                                >
                                    <XIcon className="w-4 h-4 text-red-400/50 group-hover/abort:text-red-400" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {isCompleted && !isClaimed && (
                <div className="absolute -left-1 -top-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
            )}
        </GlassCard>
    );
};

export const SeasonView: React.FC = () => {
    const {
        appMode,
        userProfile,
        tasks,
        reports,
        activeCycle,
        seasons,
        seasonQuests,
        acceptSeasonQuest,
        abortSeasonQuest,
        claimSeasonQuest,
        getArenas,
        getActionsForArena,
        getClanQuestProgress,
        getClanQuestsForArena,
        clanQuestParticipants,
        fetchClanQuestParticipants,
        userMissionParticipations,
        addCompletedMission,
        applyExp,
        addChest,
        setAchievementUnlocked,
        showToast,
    } = useGame();
    const [selectedQuest, setSelectedQuest] = useState<SelectableQuest | null>(null);
    const [isSeasonDetailOpen, setSeasonDetailOpen] = useState(false);
    const [isSeasonTransitionOpen, setSeasonTransitionOpen] = useState(false);
    const lastClaimableToastRef = useRef<number | null>(null);

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
    const hasClearedArena = clearedArenaCount > 0;
    const hasCompletedCycle = reports.length > 0;

    const getSystemQuestProgress = (quest: SystemQuest): number => {
        if (completedFlags.has(quest.id)) return 100;

        switch (quest.id) {
            case 'tutorial-quest':
                return tutorialCompleted ? 100 : 0;
            case 'system-first-campaign':
                return hasInstalledCampaign ? 100 : 0;
            case 'system-first-cycle':
                return hasCreatedCycle ? 100 : 0;
            case 'system-first-arena-clear':
                return hasClearedArena ? 100 : 0;
            case 'system-first-cycle-report':
                return hasCompletedCycle ? 100 : 0;
            default:
                return 0;
        }
    };

    const activeSystemQuests = useMemo(
        () => SYSTEM_QUESTS.filter((quest) => !completedFlags.has(quest.id)),
        [completedFlags]
    );

    const individualQuests = useMemo(
        () => quests.filter((quest) => quest.type === 'individual' && !completedFlags.has(quest.id)),
        [quests, completedFlags]
    );
    const clanQuests = useMemo(
        () => quests.filter((quest) => quest.type === 'clan' && !completedFlags.has(quest.id)),
        [quests, completedFlags]
    );

    const totalClaimableQuests = useMemo(() => {
        const systemReady = activeSystemQuests.filter((quest) => getSystemQuestProgress(quest) >= 100).length;
        const seasonReady = [...individualQuests, ...clanQuests].filter((quest) => calculateQuestProgress(quest) >= 100).length;
        return systemReady + seasonReady;
    }, [activeSystemQuests, individualQuests, clanQuests, completedFlags, reports.length, Boolean(activeCycle), hasInstalledCampaign, hasClearedArena, tutorialCompleted]);

    useEffect(() => {
        if (appMode !== 'GAME') return;

        const previousCount = lastClaimableToastRef.current;
        if (totalClaimableQuests > 0 && previousCount !== totalClaimableQuests) {
            const label = totalClaimableQuests === 1 ? 'missao completa' : 'missoes completas';
            showToast(`Voce tem ${totalClaimableQuests} ${label} para resgatar.`, 'success');
        }

        lastClaimableToastRef.current = totalClaimableQuests;
    }, [appMode, totalClaimableQuests, showToast]);

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

    const handleClaimSystemQuest = async (quest: SystemQuest) => {
        if (completedFlags.has(quest.id)) {
            setSelectedQuest(null);
            return;
        }

        const markerMission: SeasonMission = {
            id: quest.id,
            season_id: activeSeason?.id || 'system',
            title: quest.title,
            description: quest.description,
            goal_type: 'actions_completed',
            goal_value: 1,
            reward_type: 'exp',
            reward_value: 0,
            type: 'individual',
            action_name: quest.actionTemplate.name,
            icon: quest.actionTemplate.icon,
            requirements: quest.requirements,
        };

        addCompletedMission(markerMission);
        applyExp(quest.rewards.xp);
        const chestGranted = await addChest(quest.rewardChest);

        setAchievementUnlocked({
            type: 'QUEST_COMPLETED',
            data: {
                title: quest.title,
                reward: {
                    exp: quest.rewards.xp,
                    items: [SYSTEM_QUEST_INSIGNIA_ID],
                    chest: chestGranted ? quest.rewardChest : null,
                },
            },
        });
        setSelectedQuest(null);
    };

    const handleClaimSeasonQuest = async (quest: SeasonQuest) => {
        await claimSeasonQuest(quest.id);
        setSelectedQuest(null);
    };

    const selectedQuestProgress = selectedQuest
        ? (isSystemQuest(selectedQuest) ? getSystemQuestProgress(selectedQuest) : calculateQuestProgress(selectedQuest))
        : 0;
    const selectedQuestCanClaim = Boolean(selectedQuest) && selectedQuestProgress >= 100 && !completedFlags.has(selectedQuest.id);
    const selectedQuestIsActive = selectedQuest ? (isSystemQuest(selectedQuest) ? true : isQuestAccepted(selectedQuest)) : false;

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

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1 border-b border-white/10 pb-2">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Quests do sistema</h3>
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--skin-accent-color)]">
                                {activeSystemQuests.length} abertas
                            </span>
                        </div>
                        <div className="space-y-2">
                            {activeSystemQuests.map((quest) => (
                                <SeasonQuestCard
                                    key={quest.id}
                                    title={quest.title}
                                    icon={quest.actionTemplate.icon}
                                    metaLabel="Auto"
                                    isAccepted={true}
                                    isClaimed={false}
                                    progress={getSystemQuestProgress(quest)}
                                    onClick={() => setSelectedQuest(quest)}
                                />
                            ))}
                            {activeSystemQuests.length === 0 && (
                                <GlassCard variant="neutral" className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                                    Quests do sistema concluidas
                                </GlassCard>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1 border-b border-white/10 pb-2">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Quests da temporada</h3>
                        </div>
                        <div className="space-y-2">
                            {individualQuests.map((quest) => {
                                const isAccepted = isQuestAccepted(quest);
                                const progress = isAccepted ? calculateQuestProgress(quest) : 0;

                                return (
                                    <SeasonQuestCard
                                        key={quest.id}
                                        title={quest.title}
                                        icon={quest.actionTemplate.icon}
                                        metaLabel="Individual"
                                        isAccepted={isAccepted}
                                        isClaimed={false}
                                        progress={progress}
                                        onClick={() => setSelectedQuest(quest)}
                                        onAbort={isAccepted ? () => { void abortSeasonQuest(quest.id); } : undefined}
                                    />
                                );
                            })}
                            {individualQuests.length === 0 && (
                                <GlassCard variant="neutral" className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                                    Nada pendente por aqui
                                </GlassCard>
                            )}
                        </div>
                    </div>

                    {clanQuests.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold accent-text uppercase tracking-widest px-1 border-b border-[var(--skin-accent-color)]/20 pb-2">Quests do grupo</h3>
                            <div className="space-y-2">
                                {clanQuests.map((quest) => {
                                    const isAccepted = isQuestAccepted(quest);
                                    const progress = isAccepted ? calculateQuestProgress(quest) : 0;
                                    const participantsCount = clanQuestParticipants[quest.id] || 0;

                                    return (
                                        <SeasonQuestCard
                                            key={quest.id}
                                            title={quest.title}
                                            icon={quest.actionTemplate.icon}
                                            metaLabel="Grupo"
                                            isAccepted={isAccepted}
                                            isClaimed={false}
                                            progress={progress}
                                            participants={participantsCount}
                                            onClick={() => setSelectedQuest(quest)}
                                            onAbort={isAccepted ? () => { void abortSeasonQuest(quest.id); } : undefined}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {selectedQuest && (
                <QuestDetailModal
                    quest={selectedQuest}
                    progress={selectedQuestProgress}
                    isActive={selectedQuestIsActive}
                    participants={!isSystemQuest(selectedQuest) && selectedQuest.type === 'clan' ? (clanQuestParticipants[selectedQuest.id] || 0) : undefined}
                    onClose={() => setSelectedQuest(null)}
                    onTake={() => {
                        if (!isSystemQuest(selectedQuest)) {
                            void acceptSeasonQuest(selectedQuest.id);
                            setSelectedQuest(null);
                        }
                    }}
                    onAbandon={!isSystemQuest(selectedQuest) && selectedQuestIsActive ? () => {
                        void abortSeasonQuest(selectedQuest.id);
                        setSelectedQuest(null);
                    } : undefined}
                    onClaim={() => {
                        if (isSystemQuest(selectedQuest)) {
                            void handleClaimSystemQuest(selectedQuest);
                            return;
                        }
                        void handleClaimSeasonQuest(selectedQuest);
                    }}
                    canClaim={selectedQuestCanClaim}
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
