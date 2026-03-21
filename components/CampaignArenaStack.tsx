import React from 'react';
import { Action, Arena } from '../types';
import { useGame } from '../contexts/GameContext';
import { ArenaCard } from './ArenaCard';

interface CampaignArenaStackProps {
    arenas: Arena[];
    size?: 'sm' | 'md';
    actions?: Action[];
}

const STACK_SIZE = {
    sm: {
        scale: 0.7,
        step: 58,
        width: 184,
        height: 92,
        badgeClass: 'text-[9px] px-1.5 py-0.5',
    },
    md: {
        scale: 0.82,
        step: 76,
        width: 252,
        height: 106,
        badgeClass: 'text-[10px] px-2 py-0.5',
    },
};

export const CampaignArenaStack: React.FC<CampaignArenaStackProps> = ({ arenas, size = 'sm', actions: actionsOverride }) => {
    const { actions } = useGame();
    const settings = STACK_SIZE[size];
    const visibleArenas = arenas.slice(0, 3);
    const hiddenCount = Math.max(0, arenas.length - visibleArenas.length);
    const actionSource = actionsOverride || actions;

    return (
        <div
            className="relative overflow-hidden"
            style={{ width: `${settings.width}px`, height: `${settings.height}px` }}
        >
            {visibleArenas.map((arena, index) => (
                <div
                    key={arena.id}
                    className="absolute top-0"
                    style={{
                        left: `${index * settings.step}px`,
                        zIndex: index + 1,
                        transform: `scale(${settings.scale})`,
                        transformOrigin: 'top left',
                    }}
                >
                    <div className="h-[6.9rem] w-[10.75rem] drop-shadow-[0_12px_20px_rgba(0,0,0,0.38)]">
                        <ArenaCard
                            arena={arena}
                            actions={actionSource.filter(action => action.arenaId === arena.id)}
                            tasks={[]}
                            onClick={() => {}}
                            variant="overview"
                        />
                    </div>
                </div>
            ))}

            {hiddenCount > 0 && (
                <div className={`absolute bottom-0 right-0 rounded-full border border-white/15 bg-black/75 font-bold text-gray-200 shadow-lg ${settings.badgeClass}`}>
                    +{hiddenCount}
                </div>
            )}
        </div>
    );
};
