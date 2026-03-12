import React from 'react';
import { Arena } from '../types';
import { useGame } from '../contexts/GameContext';
import { ArenaCard } from './ArenaCard';

interface CampaignArenaStackProps {
    arenas: Arena[];
    size?: 'sm' | 'md';
}

const STACK_SIZE = {
    sm: {
        scale: 0.72,
        step: 34,
        width: 132,
        height: 90,
        badgeClass: 'text-[9px] px-1.5 py-0.5',
    },
    md: {
        scale: 0.82,
        step: 40,
        width: 152,
        height: 100,
        badgeClass: 'text-[10px] px-2 py-0.5',
    },
};

export const CampaignArenaStack: React.FC<CampaignArenaStackProps> = ({ arenas, size = 'sm' }) => {
    const { actions } = useGame();
    const settings = STACK_SIZE[size];
    const visibleArenas = arenas.slice(0, 3);
    const hiddenCount = Math.max(0, arenas.length - visibleArenas.length);

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
                    <div className="h-[6.15rem] w-[4.9rem] drop-shadow-[0_12px_20px_rgba(0,0,0,0.38)]">
                        <ArenaCard
                            arena={arena}
                            actions={actions.filter(action => action.arenaId === arena.id)}
                            onClick={() => {}}
                            variant="compact"
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
