
import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { CheckIcon } from './Icons';
import { useGame } from '../contexts/GameContext';
import { Arena, Season, SeasonMission, SeasonQuest } from '../types';
import { ArenaDetailModal } from './ArenaDetailModal';
import { MissionCompletionModal } from './MissionCompletionModal';

// Helper to determine icon shape and style
const ActionSymbol: React.FC<{ isMilestone?: boolean; icon?: string; count?: number; className?: string }> = ({ isMilestone, icon, count, className }) => {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className={`relative flex items-center justify-center ${isMilestone ? 'w-4 h-4 rotate-45 border-2 border-[var(--skin-accent-color)] bg-black/50' : 'w-4 h-4 border border-gray-400 rounded-sm bg-black/30'}`}>
                <span className={`text-[8px] ${isMilestone ? '-rotate-45' : ''}`}>{icon || (isMilestone ? '◆' : '●')}</span>
            </div>
            {count !== undefined && count > 1 && (
                <span className="text-[10px] font-mono font-bold text-gray-400">x{count}</span>
            )}
        </div>
    );
};

const ActionPreviewBlock: React.FC<{ icon: string, label: string, isMilestone?: boolean, type?: string, count?: number }> = ({ icon, label, isMilestone, type, count }) => {
    // Mimic getActionBackgroundStyle logic
    const backgroundStyle = React.useMemo(() => {
        if (type === 'clan') return { background: 'var(--quest-grad-clan)' };
        // Default for season quests/missions
        return { background: 'var(--quest-grad-season)' };
    }, [type]);

    return (
        <div className="flex flex-col items-center justify-center w-full py-4 bg-black/20 rounded-xl border border-white/5 backdrop-blur-sm">
            <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-3">
                {isMilestone ? 'Marco a Conquistar' : 'Ação Necessária'}
            </div>
            
            <div className="relative flex items-center justify-center mb-3">
                 {/* Visual Container */}
                <div className={`w-16 h-16 transform transition-all duration-500 hover:scale-105 ${isMilestone ? 'rotate-45' : ''}`}>
                    <div 
                        style={backgroundStyle}
                        className={`w-full h-full border ${isMilestone ? 'border-[var(--skin-accent-color)]' : 'border-[var(--accent-bronze)]'} rounded-xl relative shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center`}
                    >
                        <div className={`transform flex flex-col items-center justify-center h-full w-full ${isMilestone ? '-rotate-45' : ''}`}>
                            <span className="text-3xl drop-shadow-md filter">{icon}</span>
                        </div>
                    </div>
                     {/* Counter Badge */}
                     {count && count > 1 && (
                        <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-black border border-white/20 flex items-center justify-center z-10 ${isMilestone ? '-rotate-45' : ''}`}>
                            <span className="text-[10px] font-bold text-white">x{count}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="text-xs font-bold text-gray-300 uppercase tracking-wider text-center max-w-[80%] leading-tight">
                {label}
            </div>
        </div>
    );
};

export const MissionCard: React.FC<{ mission: SeasonMission; progress: number; isCompleted: boolean; canClaim: boolean; onComplete: () => void; onSelect: () => void; isShimmering?: boolean }> = ({ mission, progress, isCompleted, canClaim, onComplete, onSelect, isShimmering }) => {
    const isMilestone = mission.requirements?.milestone;
    const count = mission.goal_value;

    return (
        <GlassCard variant="neutral" className={`p-3 cursor-pointer relative overflow-hidden transition-all hover:bg-white/5 ${isShimmering ? 'shimmer-effect' : ''}`} onClick={onSelect}>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm line-clamp-1">{mission.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ActionSymbol isMilestone={isMilestone} icon={mission.icon} count={count} />
                        {isCompleted && (
                            <div className="w-5 h-5 rounded-full border-2 border-green-500/50 flex items-center justify-center bg-green-500/20">
                                <CheckIcon className="w-3 h-3 text-green-400" />
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-black/30 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-[var(--skin-accent-color)]'}`} style={{ width: `${Math.min(100, progress)}%` }}></div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 w-8 text-right">{Math.round(progress)}%</span>
                </div>

                {canClaim && (
                    <button onClick={(event) => { event.stopPropagation(); onComplete(); }} className="w-full py-1.5 mt-1 rounded-lg bg-[var(--skin-accent-color)] hover:brightness-110 text-black text-[10px] font-bold tracking-wider uppercase shadow-lg animate-pulse">
                        Resgatar
                    </button>
                )}
            </div>
        </GlassCard>
    );
};

export const MissionDetailModal: React.FC<{ mission: SeasonMission; progress: number; isCompleted: boolean; onClose: () => void; onClaim: () => void; isShimmering?: boolean }> = ({ mission, progress, isCompleted, onClose, onClaim, isShimmering }) => {
    const isMilestone = mission.requirements?.milestone;
    
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[80] flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
            <div className={`w-full max-w-sm aspect-[9/16] max-h-[80vh] rounded-[32px] overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[var(--skin-accent-color)]/30 flex flex-col ${isShimmering ? 'shimmer-effect' : ''}`} onClick={e => e.stopPropagation()}>
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1968&auto=format&fit=crop" 
                        alt="Background" 
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full p-6">
                    {/* Header */}
                    <div className="flex justify-end">
                        <button onClick={onClose} className="p-2 bg-black/40 rounded-full text-white/80 hover:bg-black/60 transition-colors backdrop-blur-md border border-white/10">
                            <span className="text-xl leading-none">&times;</span>
                        </button>
                    </div>

                    <div className="mt-8 text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black/40 backdrop-blur-md border border-[var(--skin-accent-color)]/50 mb-4 shadow-[0_0_20px_var(--skin-accent-color)]">
                            <span className="text-3xl">{mission.icon || (isMilestone ? '◆' : '●')}</span>
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-lg leading-tight">{mission.title}</h3>
                        <div className="flex justify-center gap-2 mt-2">
                             <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider text-gray-300 border border-white/5">
                                {mission.type === 'clan' ? 'Missão de Clã' : 'Individual'}
                             </span>
                             {isMilestone && (
                                <span className="px-3 py-1 rounded-full bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)] text-[10px] font-bold uppercase tracking-wider border border-[var(--skin-accent-color)]/30">
                                    Marco
                                </span>
                             )}
                        </div>
                    </div>

                    <div className="flex-1 mt-8 space-y-4 overflow-y-auto custom-scrollbar">
                        <GlassCard variant="neutral" className="p-4 bg-black/40 border-white/5 backdrop-blur-md">
                            <p className="text-sm text-gray-200 text-center leading-relaxed italic">"{mission.description}"</p>
                        </GlassCard>

                        {/* Action Preview */}
                        <ActionPreviewBlock 
                            icon={mission.icon || (isMilestone ? '◆' : '●')}
                            label={mission.action_name || mission.title}
                            isMilestone={isMilestone}
                            type={mission.type}
                            count={mission.goal_value}
                        />

                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3 backdrop-blur-md">
                            <div className="flex items-center justify-between text-xs text-gray-400 uppercase font-bold tracking-wider">
                                <span>Progresso</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-black/50 rounded-full h-3 overflow-hidden border border-white/5">
                                <div className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-[var(--skin-accent-color)] shadow-[0_0_10px_var(--skin-accent-color)]'}`} style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-xs text-gray-500">{mission.goal_type === 'actions_completed' ? 'Ações' : 'Progresso'}</span>
                                <div className="flex items-center gap-2 text-white font-mono text-sm">
                                    <span>{Math.round((progress / 100) * mission.goal_value)}</span>
                                    <span className="text-gray-500">/</span>
                                    <span>{mission.goal_value}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/40 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1 backdrop-blur-md">
                                <span className="text-[10px] uppercase font-bold text-gray-500">Recompensa</span>
                                <span className="text-lg font-bold text-white">+{mission.reward_value} XP</span>
                            </div>
                            {/* Placeholder for item reward if exists */}
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10">
                        {!isCompleted && progress >= 100 ? (
                            <button onClick={onClaim} className="w-full py-4 rounded-xl text-sm font-black tracking-[0.2em] bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse transition-all">
                                RESGATAR
                            </button>
                        ) : (
                            <button onClick={onClose} className="w-full py-4 rounded-xl text-xs font-bold tracking-widest bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/5">
                                VOLTAR
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const QuestCard: React.FC<{ quest: SeasonQuest; progress: number; onSelect: () => void }> = ({ quest, progress, onSelect }) => {
    const isMilestone = quest.actionTemplate?.isMilestone || quest.requirements?.milestone;
    const count = quest.actionTemplate?.repetitions || quest.requirements?.totalReps;

    return (
        <GlassCard variant="neutral" className="p-3 cursor-pointer transition-all hover:bg-white/5" onClick={onSelect}>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <span className="font-semibold text-sm line-clamp-1">{quest.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ActionSymbol isMilestone={isMilestone} icon={quest.actionTemplate?.icon} count={count} />
                        <div className="w-5 h-5 rounded-full border-2 border-gray-500/50 flex items-center justify-center bg-black/20">
                            {progress >= 100 && <CheckIcon className="w-3 h-3 text-green-400" />}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-black/30 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[var(--gold)] h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, progress)}%` }}></div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 w-8 text-right">{Math.round(progress)}%</span>
                </div>
            </div>
        </GlassCard>
    );
};

export const QuestDetailModal: React.FC<{ quest: SeasonQuest; progress: number; isActive: boolean; participants?: number; onClose: () => void; onTake: () => void; onAbandon?: () => void; onClaim?: () => void; canClaim?: boolean }> = ({ quest, progress, isActive, participants, onClose, onTake, onAbandon, onClaim, canClaim }) => {
    const isMilestone = quest.actionTemplate?.isMilestone || quest.requirements?.milestone;
    const count = quest.actionTemplate?.repetitions || quest.requirements?.totalReps;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[80] flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
            <div className="w-full max-w-sm aspect-[9/16] max-h-[80vh] rounded-[32px] overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[var(--gold)]/30 flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1535905557558-afc4877a26fc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                        alt="Quest Background" 
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full p-6">
                    {/* Header */}
                    <div className="flex justify-end">
                        <button onClick={onClose} className="p-2 bg-black/40 rounded-full text-white/80 hover:bg-black/60 transition-colors backdrop-blur-md border border-white/10">
                            <span className="text-xl leading-none">&times;</span>
                        </button>
                    </div>

                    <div className="mt-8 text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black/40 backdrop-blur-md border border-[var(--gold)]/50 mb-4 shadow-[0_0_20px_var(--gold)]">
                            <span className="text-3xl">{quest.actionTemplate?.icon || (isMilestone ? '◆' : '●')}</span>
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-lg leading-tight">{quest.title}</h3>
                         <div className="flex justify-center gap-2 mt-2">
                             <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider text-gray-300 border border-white/5">
                                {quest.type === 'clan' ? 'Quest de Clã' : 'Quest Pessoal'}
                             </span>
                             {isActive && (
                                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-500/30 animate-pulse">
                                    Em Andamento
                                </span>
                             )}
                        </div>
                    </div>

                    <div className="flex-1 mt-8 space-y-4 overflow-y-auto custom-scrollbar">
                        <GlassCard variant="neutral" className="p-4 bg-black/40 border-white/5 backdrop-blur-md">
                            <p className="text-sm text-gray-200 text-center leading-relaxed italic">"{quest.description}"</p>
                        </GlassCard>

                         {/* Action Preview */}
                        <ActionPreviewBlock 
                            icon={quest.actionTemplate?.icon || (isMilestone ? '◆' : '●')}
                            label={quest.actionTemplate?.name || quest.title}
                            isMilestone={isMilestone}
                            type={quest.type}
                            count={count}
                        />

                        {participants !== undefined && (
                            <div className="flex justify-center items-center gap-2 text-xs text-gray-400 bg-white/5 py-2 px-4 rounded-full mx-auto w-fit border border-white/5">
                                <span>👥</span>
                                <span>{participants} guerreiros ativos</span>
                            </div>
                        )}

                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3 backdrop-blur-md">
                            <div className="flex items-center justify-between text-xs text-gray-400 uppercase font-bold tracking-wider">
                                <span>Progresso Atual</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-black/50 rounded-full h-3 overflow-hidden border border-white/5">
                                <div className="bg-[var(--gold)] h-full rounded-full transition-all duration-700 shadow-[0_0_10px_var(--gold)]" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/40 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1 backdrop-blur-md">
                                <span className="text-[10px] uppercase font-bold text-gray-500">XP</span>
                                <span className="text-lg font-bold text-white">+{quest.rewards.xp}</span>
                            </div>
                            {quest.rewards.gold && (
                                <div className="bg-black/40 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1 backdrop-blur-md">
                                    <span className="text-[10px] uppercase font-bold text-gray-500">Gold</span>
                                    <span className="text-lg font-bold text-[var(--gold)]">+{quest.rewards.gold}</span>
                                </div>
                            )}
                            {quest.rewards.items && quest.rewards.items.length > 0 && (
                                <div className="col-span-2 bg-black/40 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1 backdrop-blur-md">
                                    <span className="text-[10px] uppercase font-bold text-gray-500">Item</span>
                                    <span className="text-sm font-bold text-purple-300">{quest.rewards.items.join(', ')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                        {canClaim ? (
                            <button onClick={onClaim} className="w-full py-4 rounded-xl text-sm font-black tracking-[0.2em] bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse transition-all">
                                RESGATAR RECOMPENSA
                            </button>
                        ) : (
                            <>
                                {!isActive ? (
                                    <button onClick={onTake} className="w-full py-4 rounded-xl text-sm font-black tracking-[0.2em] luxe-skin-button text-black shadow-[0_0_20px_var(--sephirot-glow-color)] transition-all hover:scale-[1.02]">
                                        {quest.type === 'clan' ? 'JUNTAR-SE À FESTA' : 'ACEITAR MISSÃO'}
                                    </button>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="py-4 rounded-xl text-xs font-bold bg-white/10 text-gray-400 cursor-not-allowed border border-white/5">
                                            EM ANDAMENTO
                                        </button>
                                        <button onClick={onAbandon} className="py-4 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors">
                                            ABANDONAR
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SeasonDetailModal: React.FC<{ season: Season, onClose: () => void }> = ({ season, onClose }) => {
    const { seasonMissions, seasonQuests, addCompletedMission, claimSeasonQuestReward, showToast, userProfile, tasks, assets, getArenas, getActionsForArena, addArena, addAction, deleteAction } = useGame();
    const [selectedMission, setSelectedMission] = useState<SeasonMission | null>(null);
    const [selectedQuest, setSelectedQuest] = useState<SeasonQuest | null>(null);
    const [questArena, setQuestArena] = useState<Arena | null>(null);
    const [completedMission, setCompletedMission] = useState<SeasonMission | null>(null);
    const [shimmerMissionId, setShimmerMissionId] = useState<string | null>(null);
    const missionsForSeason = seasonMissions.filter(m => m.season_id === season.id);
    const questsForSeason = seasonQuests.filter(q => q.season_id === season.id && q.scope === 'season');
    const completedMissions = new Set(userProfile.completedSeasonMissions || []);
    const completedTasksInSeason = tasks.filter(task => task.completed && task.date >= season.start_date && task.date <= season.end_date).length;

    const getMissionProgress = (mission: SeasonMission) => {
        if (mission.goal_type !== 'actions_completed') return 0;
        if (mission.goal_value <= 0) return 0;
        return Math.min(100, Math.round((completedTasksInSeason / mission.goal_value) * 100));
    };
    
    const endDate = new Date(season.end_date);
    const daysRemaining = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const questArenaName = `Quests - Season ${season.id}`;

    const ensureQuestArena = () => {
        const existing = getArenas().find(arena => arena.name === questArenaName);
        if (existing) return existing;
        const fallbackAssetId = assets.find(asset => asset.id === 'geral')?.id || assets[0]?.id || '';
        return addArena(fallbackAssetId, { name: questArenaName, description: 'Missões da season', icon: '🧭' });
    };

    const getQuestAction = (quest: SeasonQuest) => {
        const arena = getArenas().find(arena => arena.name === questArenaName);
        if (!arena) return null;
        return getActionsForArena(arena.id).find(a => a.name === quest.title);
    };

    const isQuestActive = (quest: SeasonQuest) => {
        return !!getQuestAction(quest);
    };

    const getQuestProgress = (quest: SeasonQuest) => {
        const action = getQuestAction(quest);
        if (!action) return 0;
        const completed = tasks.filter(task => task.completed && task.actionId === action.id).length;
        return quest.goal_value > 0 ? Math.min(100, Math.round((completed / quest.goal_value) * 100)) : 0;
    };

    const handleTakeQuest = (quest: SeasonQuest) => {
        const arena = ensureQuestArena();
        const exists = getActionsForArena(arena.id).some(action => action.name === quest.title);
        
        if (!exists) {
            addAction({
                arenaId: arena.id,
                name: quest.title,
                description: quest.description,
                icon: quest.actionTemplate.icon || '🎯',
                duration: quest.actionTemplate.duration || 30,
                repetitions: Math.max(1, quest.goal_value || 1),
                actionType: quest.actionTemplate.isMilestone ? 'Marco' : 'Ação Recorrente',
                difficulty: 3
            });
        }
        
        // Refresh local state context implicitly via useGame hooks triggering re-renders, 
        // but we might need to force update if state is lagging. 
        // For now, let's just close the modal or update the selected quest state.
        setQuestArena(arena);
        // Don't close immediately, let user see status change
    };

    const handleAbandonQuest = (quest: SeasonQuest) => {
        const action = getQuestAction(quest);
        if (action) {
            if (window.confirm('Tem certeza que deseja abandonar esta missão? Todo o progresso será perdido.')) {
                deleteAction(action.id);
                setSelectedQuest(null); // Close modal
            }
        }
    };

    const handleMissionComplete = (mission: SeasonMission) => {
        if (completedMissions.has(mission.id)) return;
        addCompletedMission(mission);
        
        // Show modal with video and reward
        setCompletedMission(mission);

        const xp = mission.reward_value || 0;
        let msg = `✦ +${xp} XP computados`;
        if (mission.reward_type === 'item_id') {
             msg = `✦ Item adicionado ao inventário · +${xp} XP computados`;
        }
        // Toast is redundant if modal opens, but keeping it for feedback
        // showToast(msg); 

        setShimmerMissionId(mission.id);
        window.setTimeout(() => {
            setShimmerMissionId(prev => (prev === mission.id ? null : prev));
        }, 1600);
    };

    const handleClaimQuest = (quest: SeasonQuest) => {
        if (completedMissions.has(quest.id)) return;
        claimSeasonQuestReward(quest.id);

        const xp = quest.rewards.xp;
        const items = quest.rewards.items || [];
        let msg = `✦ +${xp} XP computados`;
        if (items.length > 0) {
            msg = `✦ ${items.join(', ')} adicionado ao inventário · +${xp} XP computados`;
        }
        showToast(msg);
        setSelectedQuest(null);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
            <div className="w-full max-w-sm h-[85vh] rounded-[32px] animate-slide-up overflow-hidden border border-[var(--skin-accent-color)] shadow-[0_0_30px_var(--sephirot-glow-color)] relative bg-black" onClick={e => e.stopPropagation()}>
                {/* Background */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-60 transition-opacity duration-1000" 
                    style={{ backgroundImage: `url('${season.background_png_url || 'https://images.unsplash.com/photo-1468657988500-aca2be09f4c6?q=80&w=2070&auto=format&fit=crop'}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/70 to-black/90" />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Header Section (Fixed) */}
                    <div className="p-6 pb-4 text-center shrink-0">
                        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors backdrop-blur-sm border border-white/10">
                            <span className="text-xl leading-none">&times;</span>
                        </button>

                        <div className="inline-block px-3 py-1 rounded-full bg-[var(--skin-accent-color)]/10 backdrop-blur-md border border-[var(--skin-accent-color)]/30 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--skin-accent-color)] mb-3 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                            TEMPORADA ATUAL
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-widest luxe-title-shadow drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] leading-none mb-1">{season.name}</h2>
                        <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Termina em {daysRemaining} dias</p>
                    </div>
                    
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 custom-scrollbar">
                        <div>
                            <GlassCard variant="neutral" className="p-4 text-center text-xs italic text-gray-300/90 border-white/5 bg-black/30 backdrop-blur-md">
                                "{season.lore_text}"
                            </GlassCard>
                        </div>
                        
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--skin-accent-color)] flex items-center gap-2">
                                <span className="w-1 h-4 bg-[var(--skin-accent-color)] rounded-full"></span>
                                Missões Básicas
                            </h3>
                            <div className="space-y-3">
                                {missionsForSeason.map(mission => (
                                    <MissionCard
                                        key={mission.id}
                                        mission={mission}
                                        progress={completedMissions.has(mission.id) ? 100 : getMissionProgress(mission)}
                                        isCompleted={completedMissions.has(mission.id)}
                                        canClaim={!completedMissions.has(mission.id) && getMissionProgress(mission) >= 100}
                                        onComplete={() => handleMissionComplete(mission)}
                                        onSelect={() => setSelectedMission(mission)}
                                        isShimmering={shimmerMissionId === mission.id}
                                    />
                                ))}
                            </div>
                        </div>

                        {questsForSeason.length > 0 && (
                            <div className="space-y-3 pb-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] flex items-center gap-2">
                                    <span className="w-1 h-4 bg-[var(--gold)] rounded-full"></span>
                                    Quests da Season
                                </h3>
                                <div className="space-y-3">
                                    {questsForSeason.map(quest => (
                                        <QuestCard
                                            key={quest.id}
                                            quest={quest}
                                            progress={getQuestProgress(quest)}
                                            onSelect={() => setSelectedQuest(quest)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedMission && (
                <MissionDetailModal
                    mission={selectedMission}
                    progress={completedMissions.has(selectedMission.id) ? 100 : getMissionProgress(selectedMission)}
                    isCompleted={completedMissions.has(selectedMission.id)}
                    onClose={() => setSelectedMission(null)}
                    onClaim={() => handleMissionComplete(selectedMission)}
                    isShimmering={shimmerMissionId === selectedMission.id}
                />
            )}
            {completedMission && (
                <MissionCompletionModal
                    mission={completedMission}
                    onOk={() => {
                        setCompletedMission(null);
                        setSelectedMission(null);
                    }}
                    onClose={() => setCompletedMission(null)}
                />
            )}
            {selectedQuest && (
                <QuestDetailModal
                    quest={selectedQuest}
                    progress={getQuestProgress(selectedQuest)}
                    isActive={isQuestActive(selectedQuest)}
                    onClose={() => setSelectedQuest(null)}
                    onTake={() => handleTakeQuest(selectedQuest)}
                    onAbandon={() => handleAbandonQuest(selectedQuest)}
                    onClaim={() => handleClaimQuest(selectedQuest)}
                    canClaim={!completedMissions.has(selectedQuest.id) && getQuestProgress(selectedQuest) >= 100}
                />
            )}
            {questArena && (
                <ArenaDetailModal
                    arena={questArena}
                    onClose={() => setQuestArena(null)}
                />
            )}
        </div>
    );
};
