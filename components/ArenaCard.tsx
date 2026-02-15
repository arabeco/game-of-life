import React from 'react';
import { Arena, Action } from '../types';
import { DollarSignIcon, FlameIcon, CheckIcon } from './Icons';
import { useGame } from '../contexts/GameContext';

const ActionIcon: React.FC<{ action: Action }> = ({ action }) => {
    const { getActionBackgroundStyle } = useGame();
    const backgroundStyle = getActionBackgroundStyle(action.id);

    const renderIcon = () => {
        switch (action.icon) {
            case '$': return <DollarSignIcon className="w-4 h-4 text-white/80" />;
            case '🔥': return <FlameIcon className="w-4 h-4 text-white/80" />;
            default: return <span className="text-sm text-white">{action.icon}</span>;
        }
    };
    return (
        <div style={backgroundStyle} className="w-6 h-6 border border-[var(--accent-bronze)] rounded-md flex items-center justify-center flex-shrink-0">
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
    const { tasks, getActionBackgroundStyle } = useGame();

    const milestoneActions = actions.filter(a => a.actionType === 'Marco');
    const bronzeActions = actions.filter(a => a.actionType !== 'Marco');

    const scheduledTasksForArena = tasks.filter(t => actions.some(a => a.id === t.actionId));
    const completedTasks = scheduledTasksForArena.filter(t => t.completed);
    
    const progress = scheduledTasksForArena.length > 0
        ? (completedTasks.length / scheduledTasksForArena.length) * 100
        : 0;

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
                <h3 className="font-bold uppercase mt-2 text-xs text-white">{arena.name}</h3>
                {isOverview && assetName && <p className="text-[10px] text-gray-500 uppercase">{assetName}</p>}
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
                        className="h-full rounded-full" 
                        style={{ 
                            width: `${progress}%`,
                            backgroundColor: 'var(--accent-silver)'
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
};
