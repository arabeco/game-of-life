import React from 'react';
import { Action, Arena } from '../types';
import { useGame } from '../contexts/GameContext';
import { ArenaCard } from './ArenaCard';

interface CampaignArenaStackProps {
    arenas: Arena[];
    size?: 'xs' | 'sm' | 'md';
    actions?: Action[];
}

const STACK_SIZE = {
    xs: {
        scale: 0.56,
        step: 48,
        width: 156,
        height: 56,
        cardWidth: 132,
        cardHeight: 84,
        badgeClass: 'text-[8px] px-1.5 py-0.5',
    },
    sm: {
        scale: 0.98,
        step: 84,
        width: 298,
        height: 104,
        cardWidth: 204,
        cardHeight: 94,
        badgeClass: 'text-[9px] px-1.5 py-0.5',
    },
    md: {
        scale: 1.03,
        step: 100,
        width: 350,
        height: 112,
        cardWidth: 216,
        cardHeight: 98,
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
                    <div
                        className="drop-shadow-[0_12px_20px_rgba(0,0,0,0.38)]"
                        style={{ width: `${settings.cardWidth}px`, height: `${settings.cardHeight}px` }}
                    >
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
