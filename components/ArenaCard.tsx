import React, { useEffect } from 'react';
import { Arena, Action } from '../types';
import { DollarSignIcon, FlameIcon, CheckIcon, UsersIcon } from './Icons';
import { useGame } from '../contexts/GameContext';

const ActionIcon: React.FC<{ action: Action }> = ({ action }) => {
    const { getActionBackgroundStyle, getArenas, seasonQuests, getClanQuestProgress } = useGame();
    const backgroundStyle = getActionBackgroundStyle(action.id);
    
    const arena = getArenas().find(ar => ar.id === action.arenaId);
    const normalizedArena = arena?.name ? arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
    const isClanQuest = normalizedArena.includes('quests - cla');
    const isSeasonQuest = normalizedArena.includes('quests - season');
    const displayIcon = isClanQuest ? '🛡️' : (isSeasonQuest ? '🌟' : action.icon);

    const quest = isClanQuest ? seasonQuests.find(q => q.scope === 'clan' && (q.title === action.name || q.action?.name === action.name)) : null;
    const currentProgress = quest ? getClanQuestProgress(quest.id) : 0;
    const actionsRemaining = quest ? Math.max(0, quest.goal_value - currentProgress) : 0;

    const renderIcon = () => {
        // Override for special quests
        if (isClanQuest) {
             return (
                 <div className="relative w-full h-full flex items-center justify-center">
                     <span className="text-sm text-white">{displayIcon}</span>
                     {actionsRemaining > 0 && (
                         <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[12px] text-center border border-black">
                             {actionsRemaining}
                         </div>
                     )}
                 </div>
             );
        }
        if (isSeasonQuest) return <span className="text-sm text-white">{displayIcon}</span>;

        switch (action.icon) {
            case '$': return <DollarSignIcon className="w-4 h-4 text-white/80" />;
            case '🔥': return <FlameIcon className="w-4 h-4 text-white/80" />;
            default: return <span className="text-sm text-white">{displayIcon}</span>;
        }
    };
    return (
        <div style={backgroundStyle} className="w-6 h-6 border border-[var(--accent-bronze)] rounded-md flex items-center justify-center flex-shrink-0 relative overflow-visible">
            {renderIcon()}
        </div>
    );
};

interface ArenaCardProps {
    arena: Arena;
    actions: Action[];
    onClick: () => void;
    assetName?: string; // For overview
    variant: 'overview' | 'dossier';
}

export const ArenaCard: React.FC<ArenaCardProps> = ({ arena, actions, onClick, assetName, variant }) => {
    const { tasks, getActionBackgroundStyle, seasonQuests, getClanQuestProgress, getArenas, clanQuestParticipants, fetchClanQuestParticipants } = useGame();

    const milestoneActions = actions.filter(a => a.actionType === 'Marco');
    const bronzeActions = actions.filter(a => a.actionType !== 'Marco');

    // Check if it's a clan arena
    const normalizedArena = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const isClanQuestArena = normalizedArena.includes('quests - cla');
    const isSeasonQuestArena = normalizedArena.includes('quests - season');
    
    let progress = 0;
    const isGold = isClanQuestArena; // Default to gold if clan arena
    
    // Clan Quest Data
    const quest = isClanQuestArena ? seasonQuests.find(q => q.scope === 'clan' && (q.title === arena.name || q.action?.name === arena.name)) : null;
    
    useEffect(() => {
        if (isClanQuestArena && quest && quest.actionTemplate?.name) {
             fetchClanQuestParticipants(quest.id, quest.actionTemplate.name);
        }
    }, [isClanQuestArena, quest?.id, quest?.actionTemplate?.name, fetchClanQuestParticipants]);

    const participants = quest ? (clanQuestParticipants[quest.id] || 0) : 0;
    const currentProgress = quest ? getClanQuestProgress(quest.id) : 0;
    const actionsRemaining = quest ? Math.max(0, quest.goal_value - currentProgress) : 0;

    if (isClanQuestArena) {
        // Calculate clan progress
        const clanQuestTotals = actions.reduce((acc, action) => {
            if (!quest) return acc;
            return {
                totalProgress: acc.totalProgress + currentProgress,
                totalGoal: acc.totalGoal + (quest.goal_value > 0 ? quest.goal_value : 0)
            };
        }, { totalProgress: 0, totalGoal: 0 });
        
        progress = clanQuestTotals.totalGoal > 0 
            ? (clanQuestTotals.totalProgress / clanQuestTotals.totalGoal) * 100
            : (clanQuestTotals.totalProgress > 0 ? 100 : 0);
            
    } else {
        // Standard progress: Completed vs Planned (Repetitions)
        const totalPlanned = actions.reduce((acc, a) => acc + (a.repetitions || 0), 0);
        const totalCompleted = tasks.filter(t => actions.some(a => a.id === t.actionId) && t.completed).length;
        progress = totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0;
    }
    
    progress = Math.min(100, Math.max(0, progress));

    const getIcon = () => {
        return <span className="text-2xl">{arena.icon}</span>;
    };

    const isOverview = variant === 'overview';
    const baseClasses = `p-3 rounded-xl flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300`;
    const styleClasses = isOverview 
        ? 'bg-[#181818] gradient-border gradient-border-silver h-48' 
        : 'bg-black/35 border border-[color:var(--accent-silver-soft)] h-40';
    const archivedClasses = arena.isArchived ? 'opacity-50 saturate-50' : '';
    
    return (
        <div onClick={onClick} className={`${baseClasses} ${styleClasses} ${archivedClasses}`}>
            <div className="text-center">
                {getIcon()}
                <h3 className="luxe-title-ornate font-bold uppercase mt-2 text-xs text-[color:var(--skin-accent-color)] luxe-title-shadow">{arena.name}</h3>
                {isOverview && assetName && <p className="text-[10px] text-gray-500 uppercase">{assetName}</p>}
                
                {isClanQuestArena && (
                    <div className="flex justify-center gap-2 mt-1">
                         <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded text-[10px] text-[var(--gold)]">
                            <UsersIcon className="w-3 h-3" />
                            <span className="font-mono">{participants}</span>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex flex-col items-center space-y-2 flex-shrink-0">
                 {milestoneActions.length > 0 && (
                    <div className="w-full flex items-center justify-center h-8 gap-2">
                        {milestoneActions.map(action => {
                            const backgroundStyle = getActionBackgroundStyle(action.id);
                            const task = tasks.find(t => t.actionId === action.id);
                            const isCompleted = !!task?.completed;

                            return (
                                <div key={action.id} className="relative w-7 h-7 flex-shrink-0" title={action.name}>
                                    <div className="w-full h-full transform rotate-45">
                                        <div 
                                            style={backgroundStyle}
                                            className="w-full h-full border border-[var(--accent-bronze)] rounded-sm relative"
                                        >
                                            <div className="transform flex items-center justify-center h-full w-full">
                                                <span className="transform -rotate-45 text-sm">{action.icon}</span>
                                            </div>
                                            {isCompleted && (
                                                <div className="absolute inset-0 bg-black/60 rounded-sm flex items-center justify-center">
                                                    <CheckIcon className="w-4 h-4 text-white transform -rotate-45"/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                <div className="w-full flex items-center justify-center h-6 overflow-x-auto gap-1.5 hide-scrollbar">
                    {bronzeActions.map(action => <ActionIcon key={action.id} action={action} />)}
                </div>
                <div className="w-full h-1 bg-black/30 rounded-full">
                    <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                            width: `${progress}%`,
                            backgroundColor: isGold ? 'var(--gold)' : 'var(--accent-silver)'
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
};
