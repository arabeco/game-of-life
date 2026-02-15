
import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { CheckIcon } from './Icons';
import { useGame } from '../contexts/GameContext';
import { Arena, Season, SeasonMission, SeasonQuest } from '../types';
import { ArenaDetailModal } from './ArenaDetailModal';

const MissionCard: React.FC<{ mission: SeasonMission; progress: number; isCompleted: boolean; canClaim: boolean; onComplete: () => void; onSelect: () => void; isShimmering?: boolean }> = ({ mission, progress, isCompleted, canClaim, onComplete, onSelect, isShimmering }) => {
    return (
        <GlassCard variant="neutral" className={`p-3 cursor-pointer relative overflow-hidden ${isShimmering ? 'shimmer-effect' : ''}`} onClick={onSelect}>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{mission.title}</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono">{progress}%</span>
                        <div className="w-5 h-5 rounded-full border-2 border-gray-500 flex items-center justify-center">
                            {isCompleted && <CheckIcon className="w-3 h-3 text-green-400" />}
                        </div>
                    </div>
                </div>
                <div className="w-full bg-black/30 rounded-full h-1">
                    <div className="bg-[var(--gold)] h-1 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                {canClaim && (
                    <button onClick={(event) => { event.stopPropagation(); onComplete(); }} className="w-full py-2 rounded-xl luxe-button-primary text-xs font-bold">
                        CONCLUIR
                    </button>
                )}
            </div>
        </GlassCard>
    );
};

const MissionDetailModal: React.FC<{ mission: SeasonMission; progress: number; isCompleted: boolean; onClose: () => void; onClaim: () => void; isShimmering?: boolean }> = ({ mission, progress, isCompleted, onClose, onClaim, isShimmering }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center animate-fade-in" onClick={onClose}>
        <GlassCard variant="neutral" className={`w-full max-w-sm m-4 space-y-4 rounded-3xl p-4 relative overflow-hidden ${isShimmering ? 'shimmer-effect' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-1">
                <h3 className="text-lg font-black uppercase tracking-widest">{mission.title}</h3>
                <p className="text-xs text-gray-300">{mission.description}</p>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Progresso</span>
                    <span className="text-xs font-mono">{progress}%</span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-1.5">
                    <div className="bg-[var(--gold)] h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <div className="space-y-2">
                {!isCompleted && progress >= 100 && (
                    <button onClick={onClaim} className="w-full py-2 rounded-xl text-xs font-bold border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-black transition-colors">
                        CONCLUIR
                    </button>
                )}
                <button onClick={onClose} className="w-full py-2 rounded-xl text-xs font-bold bg-black/30 text-gray-300 hover:bg-black/50">
                    FECHAR
                </button>
            </div>
        </GlassCard>
    </div>
);

const QuestCard: React.FC<{ quest: SeasonQuest; progress: number; onSelect: () => void }> = ({ quest, progress, onSelect }) => {
    return (
        <GlassCard variant="neutral" className="p-3 cursor-pointer" onClick={onSelect}>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{quest.title}</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono">{progress}%</span>
                        <div className="w-5 h-5 rounded-full border-2 border-gray-500 flex items-center justify-center">
                            {progress >= 100 && <CheckIcon className="w-3 h-3 text-green-400" />}
                        </div>
                    </div>
                </div>
                <div className="w-full bg-black/30 rounded-full h-1">
                    <div className="bg-[var(--gold)] h-1 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </GlassCard>
    );
};

const QuestDetailModal: React.FC<{ quest: SeasonQuest; progress: number; isActive: boolean; onClose: () => void; onTake: () => void }> = ({ quest, progress, isActive, onClose, onTake }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center animate-fade-in" onClick={onClose}>
        <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl p-4" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-1">
                <h3 className="text-lg font-black uppercase tracking-widest">{quest.title}</h3>
                <p className="text-xs text-gray-300">{quest.description}</p>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Progresso</span>
                    <span className="text-xs font-mono">{progress}%</span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-1.5">
                    <div className="bg-[var(--gold)] h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <div className="space-y-2">
                <button onClick={onTake} disabled={isActive} className={`w-full py-2 rounded-xl text-xs font-bold ${isActive ? 'bg-white/10 text-gray-400' : 'luxe-button-primary'}`}>
                    {isActive ? 'QUEST ATIVA' : 'PEGAR QUEST'}
                </button>
                <button onClick={onClose} className="w-full py-2 rounded-xl text-xs font-bold bg-black/30 text-gray-300 hover:bg-black/50">
                    FECHAR
                </button>
            </div>
        </GlassCard>
    </div>
);


export const SeasonDetailModal: React.FC<{ season: Season, onClose: () => void }> = ({ season, onClose }) => {
    const { seasonMissions, seasonQuests, completeSeasonMission, userProfile, tasks, assets, getArenas, getActionsForArena, addArena, addAction } = useGame();
    const [selectedMission, setSelectedMission] = useState<SeasonMission | null>(null);
    const [selectedQuest, setSelectedQuest] = useState<SeasonQuest | null>(null);
    const [questArena, setQuestArena] = useState<Arena | null>(null);
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

    const isQuestActive = (quest: SeasonQuest) => {
        const arena = getArenas().find(arena => arena.name === questArenaName);
        if (!arena) return false;
        return getActionsForArena(arena.id).some(action => action.name === quest.title);
    };

    const getQuestProgress = (quest: SeasonQuest) => {
        const arena = getArenas().find(arena => arena.name === questArenaName);
        if (!arena) return 0;
        const action = getActionsForArena(arena.id).find(a => a.name === quest.title);
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
                icon: '🎯',
                duration: 30,
                repetitions: Math.max(1, quest.goal_value || 1),
                actionType: quest.goal_type === 'milestones_completed' ? 'Marco' : 'Ação Recorrente',
                difficulty: 3
            });
        }
        setQuestArena(arena);
        setSelectedQuest(null);
    };

    const handleMissionComplete = (mission: SeasonMission) => {
        if (completedMissions.has(mission.id)) return;
        completeSeasonMission(mission);
        setShimmerMissionId(mission.id);
        window.setTimeout(() => {
            setShimmerMissionId(prev => (prev === mission.id ? null : prev));
        }, 1600);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-sm m-4 h-[90vh] rounded-3xl" onClick={e => e.stopPropagation()}>
                <div 
                    className="relative w-full h-full p-4 flex flex-col justify-between text-white rounded-3xl border border-white/20 bg-cover bg-center" 
                    style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.8) 100%), url('${season.background_png_url}')` }}
                >
                    <div className="text-center">
                        <h2 className="text-2xl font-black uppercase tracking-widest luxe-title-shadow">{season.name}</h2>
                        <p className="text-sm text-gray-300">Termina em: {daysRemaining} dias</p>
                    </div>
                    
                    <div>
                        <GlassCard variant="neutral" className="p-3 text-center text-sm max-h-24 overflow-y-auto">
                            {season.lore_text}
                        </GlassCard>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                        <h3 className="text-sm font-bold text-center uppercase tracking-wider">Missões Básicas</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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
                        <div className="space-y-2 mt-4">
                            <h3 className="text-sm font-bold text-center uppercase tracking-wider">Quests da Season</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
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
            {selectedQuest && (
                <QuestDetailModal
                    quest={selectedQuest}
                    progress={getQuestProgress(selectedQuest)}
                    isActive={isQuestActive(selectedQuest)}
                    onClose={() => setSelectedQuest(null)}
                    onTake={() => handleTakeQuest(selectedQuest)}
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
