
import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { CheckIcon, XIcon } from './Icons';
import { useGame } from '../contexts/GameContext';
import { Arena, Season, SeasonMission, SeasonQuest } from '../types';
import { ArenaDetailModal } from './ArenaDetailModal';
import { MissionCompletionModal } from './MissionCompletionModal';

import { Portal } from './Portal';

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
        <Portal>
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
        </Portal>
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
        seasonPassLevel,
        seasonPassXp,
        userMissions,
        userQuests,
        getArenas,
        getActionsForArena,
        userMissionParticipations,
        clanQuestParticipants,
        fetchClanQuestParticipants
    } = useGame();
    
    const [selectedMission, setSelectedMission] = useState<SeasonMission | null>(null);
    const [selectedQuest, setSelectedQuest] = useState<SeasonQuest | null>(null);
    const [viewMode, setViewMode] = useState<'missions' | 'quests'>('missions');

    const seasonArenaName = `Quests - ${season.name}`;
    const seasonArena = getArenas().find(a => a.name === seasonArenaName);
    const seasonActions = seasonArena ? getActionsForArena(seasonArena.id) : [];

    const clanArena = getArenas().find(a => a.name === 'Quests - Clã');
    const clanActions = clanArena ? getActionsForArena(clanArena.id) : [];

    const getMissionProgress = (mission: SeasonMission) => {
        const userMission = userMissions.find(m => m.mission_id === mission.id);
        if (!userMission) return 0;
        return Math.min(100, (userMission.progress / mission.goal_value) * 100);
    };

    const isMissionCompleted = (mission: SeasonMission) => {
        const userMission = userMissions.find(m => m.mission_id === mission.id);
        return userMission?.completed || false;
    };
    
    const canClaimMission = (mission: SeasonMission) => {
        const progress = getMissionProgress(mission);
        const completed = isMissionCompleted(mission);
        return progress >= 100 && !completed;
    };

    const getQuestProgress = (quest: SeasonQuest) => {
        const userQuest = userQuests.find(q => q.quest_id === quest.id);
        if (!userQuest) return 0;
        return Math.min(100, (userQuest.progress / quest.goal_value) * 100);
    };

    const isQuestCompleted = (quest: SeasonQuest) => {
        const userQuest = userQuests.find(q => q.quest_id === quest.id);
        return userQuest?.completed || false;
    };
    
    const canClaimQuest = (quest: SeasonQuest) => {
        const progress = getQuestProgress(quest);
        const completed = isQuestCompleted(quest);
        return progress >= 100 && !completed;
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
                <div className="w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row gap-6" onClick={e => e.stopPropagation()}>
                    
                    {/* Left Panel: Season Info */}
                    <div className="w-full md:w-1/3 flex flex-col gap-4">
                        <GlassCard variant="gold" className="p-6 text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <h2 className="text-2xl font-black uppercase tracking-widest text-yellow-500 mb-2 drop-shadow-lg">{season.name}</h2>
                            <p className="text-xs text-yellow-200/80 font-serif italic">"{season.description}"</p>
                            
                            <div className="my-6 relative">
                                <div className="w-24 h-24 mx-auto rounded-full bg-black/40 border-2 border-yellow-500/30 flex items-center justify-center relative z-10">
                                    <span className="text-4xl font-black text-white">{seasonPassLevel}</span>
                                </div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-500/10 rounded-full blur-xl animate-pulse"></div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-yellow-500/80">
                                    <span>Nível {seasonPassLevel}</span>
                                    <span>{seasonPassXp} XP</span>
                                </div>
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-yellow-500 relative overflow-hidden" style={{ width: `${Math.min(100, (seasonPassXp / 1000) * 100)}%` }}>
                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                            <button 
                                onClick={() => setViewMode('missions')}
                                className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'missions' ? 'bg-[var(--skin-accent-color)] text-black shadow-[0_0_15px_rgba(var(--skin-accent-rgb),0.3)]' : 'hover:bg-white/5 text-gray-400'}`}
                            >
                                Missões
                            </button>
                            <button 
                                onClick={() => setViewMode('quests')}
                                className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'quests' ? 'bg-[var(--skin-accent-color)] text-black shadow-[0_0_15px_rgba(var(--skin-accent-rgb),0.3)]' : 'hover:bg-white/5 text-gray-400'}`}
                            >
                                Jornada
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Content */}
                    <GlassCard variant="neutral" className="flex-1 p-0 overflow-hidden flex flex-col bg-black/40 backdrop-blur-md">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                            <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                {viewMode === 'missions' ? (
                                    <><span className="w-2 h-2 rounded-full bg-[var(--skin-accent-color)]"></span> Missões da Temporada</>
                                ) : (
                                    <><span className="w-2 h-2 rounded-full bg-purple-500"></span> Jornada Épica</>
                                )}
                            </h3>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {viewMode === 'missions' ? (
                                season.missions?.map(mission => (
                                    <MissionCard 
                                        key={mission.id} 
                                        mission={mission} 
                                        progress={getMissionProgress(mission)}
                                        isCompleted={isMissionCompleted(mission)}
                                        canClaim={canClaimMission(mission)}
                                        onComplete={() => claimSeasonMission(mission.id)}
                                        onSelect={() => setSelectedMission(mission)}
                                    />
                                ))
                            ) : (
                                season.quests?.map(quest => (
                                    <QuestCard 
                                        key={quest.id} 
                                        quest={quest}
                                        progress={getQuestProgress(quest)}
                                        isCompleted={isQuestCompleted(quest)}
                                        canClaim={canClaimQuest(quest)}
                                        onComplete={() => claimSeasonQuest(quest.id)}
                                        onSelect={() => setSelectedQuest(quest)}
                                    />
                                ))
                            )}
                            
                            {((viewMode === 'missions' && (!season.missions || season.missions.length === 0)) || 
                              (viewMode === 'quests' && (!season.quests || season.quests.length === 0))) && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 opacity-50 py-12">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                        <span className="text-2xl">?</span>
                                    </div>
                                    <p className="text-sm uppercase tracking-widest font-bold">Nenhum item disponível</p>
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
                        onClaim={() => {
                            claimSeasonMission(selectedMission.id);
                            setSelectedMission(null);
                        }}
                    />
                )}

                {selectedQuest && (
                    <QuestDetailModal 
                        quest={selectedQuest}
                        progress={getQuestProgress(selectedQuest)}
                        isActive={seasonActions.some(a => a.name === selectedQuest.actionTemplate.name) || clanActions.some(a => a.name === selectedQuest.actionTemplate.name)}
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
                        onClaim={() => {
                            claimSeasonQuest(selectedQuest.id);
                            setSelectedQuest(null);
                        }}
                        canClaim={canClaimQuest(selectedQuest)}
                    />
                )}
            </div>
        </Portal>
    );
};
