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
        scale: 0.58,
        step: 42,
        width: 142,
        height: 52,
        cardWidth: 176,
        cardHeight: 79,
        badgeClass: 'text-[8px] px-1.5 py-0.5',
    },
    sm: {
        scale: 0.94,
        step: 68,
        width: 246,
        height: 88,
        cardWidth: 176,
        cardHeight: 79,
        badgeClass: 'text-[9px] px-1.5 py-0.5',
    },
    md: {
        scale: 1,
        step: 78,
        width: 278,
        height: 92,
        cardWidth: 176,
        cardHeight: 79,
        badgeClass: 'text-[10px] px-2 py-0.5',
    },
};

export const CampaignArenaStack: React.FC<CampaignArenaStackProps> = ({ arenas, size = 'sm', actions: actionsOverride }) => {
    const { actions } = useGame();
    const settings = STACK_SIZE[size];
    const visibleArenas = arenas.slice(0, 3);
    const hiddenCount = Math.max(0, arenas.length - visibleArenas.length);
    const actionSource = actionsOverride || actions;

    if (size === 'xs') {
        return (
            <div className="relative grid h-[3.25rem] w-full grid-cols-3 gap-1.5 overflow-hidden">
                {visibleArenas.length > 0 ? visibleArenas.map((arena) => {
                    const actionCount = actionSource.filter((action) => action.arenaId === arena.id).length;

                    return (
                        <div
                            key={arena.id}
                            className="flex min-w-0 items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-1.5 py-1"
                        >
                            <span className="shrink-0 text-base leading-none" aria-hidden>{arena.icon || '\u25c7'}</span>
                            <span className="min-w-0">
                                <span className="block truncate text-[8px] font-black uppercase tracking-[0.06em] text-white/85">
                                    {arena.name}
                                </span>
                                <span className="block text-[7px] font-bold uppercase tracking-[0.08em] text-white/45">
                                    {actionCount} {actionCount === 1 ? 'ação' : 'ações'}
                                </span>
                            </span>
                        </div>
                    );
                }) : (
                    <div className="col-span-3 flex items-center justify-center text-[8px] font-black uppercase tracking-[0.14em] text-white/35">
                        Sem arenas
                    </div>
                )}

                {hiddenCount > 0 && (
                    <div className="absolute bottom-0 right-0 rounded-full border border-white/15 bg-black/85 px-1.5 py-0.5 text-[7px] font-black text-white/75">
                        +{hiddenCount}
                    </div>
                )}
            </div>
        );
    }

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
