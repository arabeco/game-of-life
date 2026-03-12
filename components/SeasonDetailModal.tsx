import React, { useEffect, useMemo, useState } from 'react';
import { GlassCard } from './GlassCard';
import { CheckIcon, XIcon } from './Icons';
import { useGame } from '../contexts/GameContext';
import { Season, SeasonMission, SeasonQuest } from '../types';
import { MissionCompletionModal } from './MissionCompletionModal';
import { resolveItemDef } from '../constants/items';
import { Portal } from './Portal';

const ActionPreviewBlock: React.FC<{ icon: string; label: string; type?: string; count?: number; isMilestone?: boolean }> = ({ icon, label, type, count, isMilestone }) => {
    const backgroundStyle = type === 'clan' ? { background: 'var(--quest-grad-clan)' } : { background: 'var(--quest-grad-season)' };

    return (
        <div className="w-full rounded-xl border border-white/5 bg-black/20 py-4 backdrop-blur-sm">
            <div className="mb-3 text-center text-[9px] font-black uppercase tracking-widest text-gray-500">
                {isMilestone ? 'Marco a conquistar' : 'Acao necessaria'}
            </div>
            <div className="relative mb-3 flex items-center justify-center">
                <div className={`h-16 w-16 transform transition-all duration-500 hover:scale-105 ${isMilestone ? 'rotate-45' : ''}`}>
                    <div
                        style={backgroundStyle}
                        className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border shadow-[0_0_20px_rgba(0,0,0,0.5)] ${isMilestone ? 'border-[var(--skin-accent-color)]' : 'border-[var(--accent-bronze)]'}`}
                    >
                        <div className={`flex h-full w-full transform flex-col items-center justify-center ${isMilestone ? '-rotate-45' : ''}`}>
                            <span className="text-3xl drop-shadow-md">{icon}</span>
                        </div>
                    </div>
                    {count && count > 1 && (
                        <div className={`absolute -bottom-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black ${isMilestone ? '-rotate-45' : ''}`}>
                            <span className="text-[10px] font-bold text-white">x{count}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="mx-auto max-w-[80%] text-center text-xs font-bold uppercase tracking-wider text-gray-300">
                {label}
            </div>
        </div>
    );
};

interface QuestDetailModalProps {
    quest: SeasonQuest;
    progress: number;
    isActive: boolean;
    participants?: number;
    onClose: () => void;
    onTake: () => void;
    onAbandon?: () => void;
    onClaim?: () => void;
    canClaim?: boolean;
}

export const QuestDetailModal: React.FC<QuestDetailModalProps> = ({ quest, progress, isActive, participants, onClose, onTake, onAbandon, onClaim, canClaim }) => {
    const isMilestone = quest.actionTemplate?.isMilestone || quest.requirements?.milestone;
    const count = quest.actionTemplate?.repetitions || quest.requirements?.totalReps;

    return (
        <Portal>
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in" onClick={onClose}>
                <div className="relative flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-[32px] border border-[var(--gold)]/30 shadow-[0_0_50px_rgba(0,0,0,0.8)]" onClick={e => e.stopPropagation()}>
                    <div className="absolute inset-0 z-0">
                        <img src="https://images.unsplash.com/photo-1535905557558-afc4877a26fc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Quest background" className="h-full w-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
                    </div>
                    <div className="relative z-10 flex h-full flex-col p-6">
                        <div className="flex justify-end">
                            <button onClick={onClose} className="rounded-full border border-white/10 bg-black/40 p-2 text-white/80 transition-colors hover:bg-black/60">
                                <span className="text-xl leading-none">&times;</span>
                            </button>
                        </div>
                        <div className="mt-8 space-y-2 text-center">
                            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--gold)]/50 bg-black/40 shadow-[0_0_20px_var(--gold)]">
                                <span className="text-3xl">{quest.actionTemplate?.icon || (isMilestone ? '◆' : '●')}</span>
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-lg">{quest.title}</h3>
                            <div className="mt-2 flex justify-center gap-2">
                                <span className="rounded-full border border-white/5 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-300">
                                    {quest.type === 'clan' ? 'Quest de cla' : 'Quest pessoal'}
                                </span>
                                {isActive && (
                                    <span className="rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400 animate-pulse">
                                        Em andamento
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="custom-scrollbar mt-8 flex-1 space-y-4 overflow-y-auto">
                            <GlassCard variant="neutral" className="border-white/5 bg-black/40 p-4 backdrop-blur-md">
                                <p className="text-center text-sm italic leading-relaxed text-gray-200">"{quest.description}"</p>
                            </GlassCard>
                            <ActionPreviewBlock
                                icon={quest.actionTemplate?.icon || (isMilestone ? '◆' : '●')}
                                label={quest.actionTemplate?.name || quest.title}
                                type={quest.type}
                                count={count}
                                isMilestone={isMilestone}
                            />
                            {participants !== undefined && (
                                <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-xs text-gray-400">
                                    <span>👥</span>
                                    <span>{participants} ativos</span>
                                </div>
                            )}
                            <div className="space-y-3 rounded-2xl border border-white/5 bg-black/40 p-4 backdrop-blur-md">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                                    <span>Progresso atual</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full border border-white/5 bg-black/50">
                                    <div className="h-full rounded-full bg-[var(--gold)] shadow-[0_0_10px_var(--gold)] transition-all duration-700" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/5 bg-black/40 p-3 backdrop-blur-md">
                                    <span className="text-[10px] font-bold uppercase text-gray-500">XP</span>
                                    <span className="text-lg font-bold text-white">+{quest.rewards.xp}</span>
                                </div>
                                {quest.rewards.items && quest.rewards.items.length > 0 && (
                                    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/5 bg-black/40 p-3 backdrop-blur-md">
                                        <span className="text-[10px] font-bold uppercase text-gray-500">Recompensas</span>
                                        <div className="flex flex-col items-center gap-1">
                                            {quest.rewards.items.map(itemId => {
                                                const itemDef = resolveItemDef(itemId);
                                                return (
                                                    <span key={itemId} className="flex items-center gap-1 text-center text-xs font-bold leading-tight text-purple-300">
                                                        {itemDef?.icon && <span>{itemDef.icon}</span>}
                                                        {itemDef?.name || itemId}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
                            {canClaim ? (
                                <button onClick={onClaim} className="w-full rounded-xl bg-green-600 py-4 text-sm font-black tracking-[0.2em] text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-green-500 animate-pulse">
                                    RESGATAR RECOMPENSA
                                </button>
                            ) : !isActive ? (
                                quest.type === 'clan' ? (
                                    <div className="flex w-full flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 py-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                        <span>Junte-se pelo menu do cla</span>
                                        <span className="text-[9px] normal-case opacity-60">A ativacao coletiva acontece por la</span>
                                    </div>
                                ) : (
                                    <button onClick={onTake} className="w-full rounded-xl py-4 text-sm font-black tracking-[0.2em] text-black shadow-[0_0_20px_var(--sephirot-glow-color)] transition-all hover:scale-[1.02] luxe-skin-button">
                                        ACEITAR MISSAO
                                    </button>
                                )
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="cursor-not-allowed rounded-xl border border-white/5 bg-white/10 py-4 text-xs font-bold text-gray-400">
                                        EM ANDAMENTO
                                    </button>
                                    <button onClick={onAbandon} className="rounded-xl border border-red-500/20 bg-red-500/10 py-4 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20">
                                        ABANDONAR
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

const RowCard: React.FC<{
    title: string;
    icon?: string;
    progress: number;
    isCompleted: boolean;
    canClaim: boolean;
    onSelect: () => void;
    onClaim: () => void;
}> = ({ title, icon, progress, isCompleted, canClaim, onSelect, onClaim }) => (
    <GlassCard variant="neutral" className="cursor-pointer p-3 transition-all hover:bg-white/5" onClick={onSelect}>
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{icon || '🏅'}</span>
                    <span className="line-clamp-1 text-sm font-semibold">{title}</span>
                </div>
                {isCompleted && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-green-500/50 bg-green-500/20">
                        <CheckIcon className="h-3 w-3 text-green-400" />
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/30">
                    <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-[var(--skin-accent-color)]'}`} style={{ width: `${Math.min(100, progress)}%` }} />
                </div>
                <span className="w-8 text-right font-mono text-[10px] text-gray-400">{Math.round(progress)}%</span>
            </div>
            {canClaim && (
                <button
                    onClick={(event) => {
                        event.stopPropagation();
                        onClaim();
                    }}
                    className="mt-1 w-full rounded-lg bg-[var(--skin-accent-color)] py-1.5 text-[10px] font-bold uppercase tracking-wider text-black shadow-lg animate-pulse hover:brightness-110"
                >
                    Resgatar
                </button>
            )}
        </div>
    </GlassCard>
);

const MissionDetailModal: React.FC<{
    mission: SeasonMission;
    progress: number;
    isCompleted: boolean;
    onClose: () => void;
    onClaim: () => void;
}> = ({ mission, progress, isCompleted, onClose, onClaim }) => {
    const isMilestone = mission.requirements?.milestone;
    const goal = mission.requirements?.clanGoal || mission.goal_value || 1;

    return (
        <Portal>
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in" onClick={onClose}>
                <div className="relative flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-[32px] border border-[var(--skin-accent-color)]/30 shadow-[0_0_50px_rgba(0,0,0,0.8)]" onClick={e => e.stopPropagation()}>
                    <div className="absolute inset-0 z-0">
                        <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1968&auto=format&fit=crop" alt="Mission background" className="h-full w-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
                    </div>
                    <div className="relative z-10 flex h-full flex-col p-6">
                        <div className="flex justify-end">
                            <button onClick={onClose} className="rounded-full border border-white/10 bg-black/40 p-2 text-white/80 transition-colors hover:bg-black/60">
                                <span className="text-xl leading-none">&times;</span>
                            </button>
                        </div>
                        <div className="mt-8 space-y-2 text-center">
                            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--skin-accent-color)]/50 bg-black/40 shadow-[0_0_20px_var(--skin-accent-color)]">
                                <span className="text-3xl">{mission.icon || (isMilestone ? '◆' : '●')}</span>
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-lg">{mission.title}</h3>
                            <div className="mt-2 flex justify-center gap-2">
                                <span className="rounded-full border border-white/5 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-300">
                                    {mission.type === 'clan' ? 'Missao de cla' : 'Individual'}
                                </span>
                            </div>
                        </div>
                        <div className="custom-scrollbar mt-8 flex-1 space-y-4 overflow-y-auto">
                            <GlassCard variant="neutral" className="border-white/5 bg-black/40 p-4 backdrop-blur-md">
                                <p className="text-center text-sm italic leading-relaxed text-gray-200">"{mission.description}"</p>
                            </GlassCard>
                            <ActionPreviewBlock
                                icon={mission.icon || (isMilestone ? '◆' : '●')}
                                label={mission.action_name || mission.title}
                                type={mission.type}
                                count={mission.goal_value}
                                isMilestone={isMilestone}
                            />
                            <div className="space-y-3 rounded-2xl border border-white/5 bg-black/40 p-4 backdrop-blur-md">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                                    <span>Progresso</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full border border-white/5 bg-black/50">
                                    <div className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-[var(--skin-accent-color)] shadow-[0_0_10px_var(--skin-accent-color)]'}`} style={{ width: `${progress}%` }} />
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs text-gray-500">{mission.goal_type === 'actions_completed' ? 'Acoes' : 'Progresso'}</span>
                                    <div className="flex items-center gap-2 text-sm font-mono text-white">
                                        <span>{Math.round((progress / 100) * goal)}</span>
                                        <span className="text-gray-500">/</span>
                                        <span>{goal}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 border-t border-white/10 pt-4">
                            {!isCompleted && progress >= 100 ? (
                                <button onClick={onClaim} className="w-full rounded-xl bg-green-600 py-4 text-sm font-black tracking-[0.2em] text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-green-500 animate-pulse">
                                    RESGATAR
                                </button>
                            ) : (
                                <button onClick={onClose} className="w-full rounded-xl border border-white/5 bg-white/5 py-4 text-xs font-bold tracking-widest text-gray-300 transition-colors hover:bg-white/10">
                                    VOLTAR
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export const SeasonDetailModal: React.FC<{ season: Season; onClose: () => void }> = ({ season, onClose }) => {
    const {
        claimSeasonMission,
        claimSeasonQuest,
        acceptSeasonQuest,
        abortSeasonQuest,
        userProfile,
        seasonMissions,
        seasonQuests,
        tasks,
        getArenas,
        getActionsForArena,
        getClanQuestProgress,
        userMissionParticipations,
        clanQuestParticipants,
        fetchClanQuestParticipants,
    } = useGame();

    const [selectedMission, setSelectedMission] = useState<SeasonMission | null>(null);
    const [selectedQuest, setSelectedQuest] = useState<SeasonQuest | null>(null);
    const [viewMode, setViewMode] = useState<'missions' | 'quests'>('missions');
    const [completedMission, setCompletedMission] = useState<SeasonMission | null>(null);
    const [earnedInsignia, setEarnedInsignia] = useState<string | null>(null);

    const missionItems = useMemo(() => seasonMissions.filter(mission => mission.season_id === season.id), [seasonMissions, season.id]);
    const questItems = useMemo(() => seasonQuests.filter(quest => !quest.season_id || quest.season_id === season.id), [seasonQuests, season.id]);
    const allArenas = getArenas();
    const allActions = useMemo(() => allArenas.flatMap(arena => getActionsForArena(arena.id)), [allArenas, getActionsForArena]);

    useEffect(() => {
        questItems.filter(quest => quest.type === 'clan').forEach(quest => {
            if (quest.actionTemplate?.name) {
                fetchClanQuestParticipants?.(quest.id, quest.actionTemplate.name);
            }
        });
    }, [questItems, fetchClanQuestParticipants]);

    const countCompletedTasksForActionName = (actionName?: string, fallbackTitle?: string) => {
        const matchingActionIds = new Set(
            allActions
                .filter(action => action.name === actionName || action.name === fallbackTitle)
                .map(action => action.id)
        );

        if (matchingActionIds.size === 0) return 0;
        return tasks.filter(task => matchingActionIds.has(task.actionId) && task.completed).length;
    };

    const hasQuestAction = (actionName?: string, fallbackTitle?: string) => allActions.some(action => action.name === actionName || action.name === fallbackTitle);

    const getMissionProgress = (mission: SeasonMission) => {
        const goal = mission.requirements?.clanGoal || mission.goal_value || 1;
        if ((mission.type || 'individual') === 'clan') {
            const current = getClanQuestProgress?.(mission.id) || 0;
            return Math.min(100, Math.round((current / goal) * 100));
        }
        if (mission.goal_type === 'actions_completed') {
            const completedCount = countCompletedTasksForActionName(mission.action_name, mission.title);
            return Math.min(100, Math.round((completedCount / goal) * 100));
        }
        return userProfile.completedSeasonMissions?.includes(mission.id) ? 100 : 0;
    };

    const getQuestProgress = (quest: SeasonQuest) => {
        const goal = quest.requirements?.clanGoal || quest.goal_value || quest.actionTemplate?.repetitions || 1;
        if (quest.type === 'clan') {
            const current = getClanQuestProgress?.(quest.id) || 0;
            return Math.min(100, Math.round((current / goal) * 100));
        }
        const completedCount = countCompletedTasksForActionName(quest.actionTemplate?.name, quest.title);
        return Math.min(100, Math.round((completedCount / goal) * 100));
    };

    const isMissionCompleted = (mission: SeasonMission) => userProfile.completedSeasonMissions?.includes(mission.id) || false;
    const isQuestCompleted = (quest: SeasonQuest) => userProfile.completedSeasonMissions?.includes(quest.id) || false;
    const canClaimMission = (mission: SeasonMission) => getMissionProgress(mission) >= 100 && !isMissionCompleted(mission);
    const canClaimQuest = (quest: SeasonQuest) => getQuestProgress(quest) >= 100 && !isQuestCompleted(quest);

    const isQuestActive = (quest: SeasonQuest) => {
        if (quest.type === 'clan') {
            return !!userMissionParticipations?.[quest.id] || hasQuestAction(quest.actionTemplate?.name, quest.title);
        }
        return hasQuestAction(quest.actionTemplate?.name, quest.title);
    };

    const handleClaimMission = async (mission: SeasonMission) => {
        await claimSeasonMission(mission.id);
        setEarnedInsignia('insignia_quest_master');
        setCompletedMission(mission);
        setSelectedMission(null);
    };

    const handleClaimQuest = async (quest: SeasonQuest) => {
        await claimSeasonQuest(quest.id);
        setEarnedInsignia('insignia_quest_incomum');
        setCompletedMission({
            id: quest.id,
            season_id: season.id,
            title: quest.title,
            description: quest.description,
            icon: quest.actionTemplate.icon,
            reward_type: 'exp',
            reward_value: quest.rewards.xp || 0,
            goal_value: quest.goal_value || quest.requirements.totalReps || 1,
            goal_type: 'actions_completed',
            type: quest.type,
            requirements: quest.requirements,
        });
        setSelectedQuest(null);
    };

    const totalTrackableIds = new Set([...missionItems, ...questItems].map(item => item.id));
    const totalClaimed = Array.from(totalTrackableIds).filter(id => userProfile.completedSeasonMissions?.includes(id)).length;
    const seasonProgressPercent = totalTrackableIds.size > 0 ? Math.round((totalClaimed / totalTrackableIds.size) * 100) : 0;

    return (
        <Portal>
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in" onClick={onClose}>
                <div className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-6 md:flex-row" onClick={e => e.stopPropagation()}>
                    <div className="flex w-full flex-col gap-4 md:w-1/3">
                        <GlassCard variant="gold" className="relative overflow-hidden p-6 text-center">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-700 hover:opacity-100" />
                            <h2 className="mb-2 text-2xl font-black uppercase tracking-widest text-yellow-500 drop-shadow-lg">{season.name}</h2>
                            <p className="text-xs italic text-yellow-200/80">"{season.lore_text}"</p>
                            <div className="relative my-6">
                                <div className="relative z-10 mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-yellow-500/30 bg-black/40">
                                    <span className="text-2xl font-black text-white">{totalClaimed}/{Math.max(totalTrackableIds.size, 1)}</span>
                                </div>
                                <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-500/10 blur-xl animate-pulse" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-yellow-500/80">
                                    <span>Concluidas</span>
                                    <span>{seasonProgressPercent}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full border border-white/5 bg-black/40">
                                    <div className="relative h-full bg-yellow-500" style={{ width: `${seasonProgressPercent}%` }}>
                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                    </div>
                                </div>
                                <div className="flex justify-between pt-1 text-[10px] text-yellow-100/70">
                                    <span>Inicio: {new Date(season.start_date).toLocaleDateString('pt-BR')}</span>
                                    <span>Fim: {new Date(season.end_date).toLocaleDateString('pt-BR')}</span>
                                </div>
                            </div>
                        </GlassCard>
                        <div className="flex gap-2 rounded-xl border border-white/5 bg-black/40 p-1">
                            <button onClick={() => setViewMode('missions')} className={`flex-1 rounded-lg py-3 text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'missions' ? 'bg-[var(--skin-accent-color)] text-black shadow-[0_0_15px_rgba(var(--skin-accent-rgb),0.3)]' : 'text-gray-400 hover:bg-white/5'}`}>
                                Missoes
                            </button>
                            <button onClick={() => setViewMode('quests')} className={`flex-1 rounded-lg py-3 text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'quests' ? 'bg-[var(--skin-accent-color)] text-black shadow-[0_0_15px_rgba(var(--skin-accent-rgb),0.3)]' : 'text-gray-400 hover:bg-white/5'}`}>
                                Jornada
                            </button>
                        </div>
                    </div>

                    <GlassCard variant="neutral" className="flex flex-1 flex-col overflow-hidden bg-black/40 p-0 backdrop-blur-md">
                        <div className="flex items-center justify-between border-b border-white/5 bg-black/20 p-4">
                            <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider text-white">
                                {viewMode === 'missions' ? (
                                    <>
                                        <span className="h-2 w-2 rounded-full bg-[var(--skin-accent-color)]" />
                                        Missoes da temporada
                                    </>
                                ) : (
                                    <>
                                        <span className="h-2 w-2 rounded-full bg-purple-500" />
                                        Jornada epica
                                    </>
                                )}
                            </h3>
                            <button onClick={onClose} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
                                <XIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
                            {viewMode === 'missions'
                                ? missionItems.map(mission => (
                                    <RowCard
                                        key={mission.id}
                                        title={mission.title}
                                        icon={mission.icon}
                                        progress={getMissionProgress(mission)}
                                        isCompleted={isMissionCompleted(mission)}
                                        canClaim={canClaimMission(mission)}
                                        onSelect={() => setSelectedMission(mission)}
                                        onClaim={() => handleClaimMission(mission)}
                                    />
                                ))
                                : questItems.map(quest => (
                                    <RowCard
                                        key={quest.id}
                                        title={quest.title}
                                        icon={quest.actionTemplate?.icon}
                                        progress={getQuestProgress(quest)}
                                        isCompleted={isQuestCompleted(quest)}
                                        canClaim={canClaimQuest(quest)}
                                        onSelect={() => setSelectedQuest(quest)}
                                        onClaim={() => handleClaimQuest(quest)}
                                    />
                                ))}

                            {((viewMode === 'missions' && missionItems.length === 0) || (viewMode === 'quests' && questItems.length === 0)) && (
                                <div className="flex h-full flex-col items-center justify-center gap-4 py-12 text-gray-500 opacity-50">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                                        <span className="text-2xl">?</span>
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-widest">Nenhum item disponivel</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {selectedMission && (
                    <MissionDetailModal
                        mission={selectedMission}
                        progress={getMissionProgress(selectedMission)}
                        isCompleted={isMissionCompleted(selectedMission)}
                        onClose={() => setSelectedMission(null)}
                        onClaim={() => handleClaimMission(selectedMission)}
                    />
                )}

                {selectedQuest && (
                    <QuestDetailModal
                        quest={selectedQuest}
                        progress={getQuestProgress(selectedQuest)}
                        isActive={isQuestActive(selectedQuest)}
                        participants={clanQuestParticipants[selectedQuest.id]}
                        onClose={() => setSelectedQuest(null)}
                        onTake={() => {
                            acceptSeasonQuest(selectedQuest.id);
                            setSelectedQuest(null);
                        }}
                        onAbandon={() => {
                            abortSeasonQuest(selectedQuest.id);
                            setSelectedQuest(null);
                        }}
                        onClaim={() => handleClaimQuest(selectedQuest)}
                        canClaim={canClaimQuest(selectedQuest)}
                    />
                )}

                {completedMission && (
                    <MissionCompletionModal
                        mission={completedMission}
                        insignia={earnedInsignia}
                        onOk={() => {
                            setCompletedMission(null);
                            setEarnedInsignia(null);
                        }}
                        onClose={() => {
                            setCompletedMission(null);
                            setEarnedInsignia(null);
                        }}
                    />
                )}
            </div>
        </Portal>
    );
};
