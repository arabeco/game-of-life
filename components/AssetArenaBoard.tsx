import React, { useMemo, useState } from 'react';
import { Asset } from '../types';
import { useGame } from '../contexts/GameContext';
import { ArenaCard } from './ArenaCard';
import { ArenaDetailModal } from './ArenaDetailModal';

interface AssetArenaBoardProps {
    asset: Asset;
    showArchived?: boolean;
    interactive?: boolean;
}

const pileTransform = (index: number) => {
    const rotation = [-4, 2, -2, 3, -3, 2][index % 6];
    const offsetY = [0, 8, 4, 10, 6, 12][index % 6];
    return `translateY(${offsetY}px) rotate(${rotation}deg)`;
};

const sectionTitleClass = 'text-center text-[10px] font-black uppercase tracking-[0.28em] text-[var(--skin-accent-color)]';
const emptyClass = 'px-4 py-4 text-center text-xs text-white/45';

export const AssetArenaBoard: React.FC<AssetArenaBoardProps> = ({ asset, showArchived = true, interactive = true }) => {
    const { getActionsForArena } = useGame();
    const [viewingArenaId, setViewingArenaId] = useState<string | null>(null);

    const sortedArenas = useMemo(() => {
        return [...(asset.arenas || [])].sort((a, b) => {
            const aOrder = a.order ?? 9999;
            const bOrder = b.order ?? 9999;
            return aOrder - bOrder || a.name.localeCompare(b.name);
        });
    }, [asset.arenas]);

    const archivedArenas = useMemo(
        () => sortedArenas.filter((arena) => arena.isArchived),
        [sortedArenas],
    );

    const activeArenas = useMemo(
        () => sortedArenas.filter((arena) => !arena.isArchived),
        [sortedArenas],
    );

    const viewingArena = sortedArenas.find((arena) => arena.id === viewingArenaId) || null;

    return (
        <>
            <div className="flex flex-col gap-2.5">
                {showArchived && (
                    <section className="border-t border-white/12 px-3 py-3">
                        <p className={sectionTitleClass}>Arquivadas</p>

                        {archivedArenas.length > 0 ? (
                            <div className="mt-2.5 overflow-x-auto pb-1.5">
                                <div className="flex min-w-max items-end px-1.5">
                                    {archivedArenas.map((arena, index) => (
                                        <button
                                            key={arena.id}
                                            type="button"
                                            onClick={interactive ? () => setViewingArenaId(arena.id) : undefined}
                                            disabled={!interactive}
                                            className={`w-[9.25rem] shrink-0 ${index > 0 ? '-ml-6' : ''}`}
                                            style={{ transform: pileTransform(index) }}
                                        >
                                            <div className="pointer-events-none h-[4.75rem] w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.32)]">
                                                <ArenaCard
                                                    arena={arena}
                                                    actions={getActionsForArena(arena.id)}
                                                    onClick={interactive ? () => setViewingArenaId(arena.id) : undefined}
                                                    variant="overview"
                                                />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2.5">
                                <div className={emptyClass}>Nenhuma arena arquivada ainda.</div>
                            </div>
                        )}
                    </section>
                )}

                <section className="border-t border-white/12 px-3 py-3">
                    {showArchived && <p className={sectionTitleClass}>Ativas</p>}

                    {activeArenas.length > 0 ? (
                        <div className={`${showArchived ? 'mt-2.5 ' : ''}overflow-x-auto pb-1.5`}>
                            <div className="flex min-w-max gap-2.5 pr-1">
                                {activeArenas.map((arena) => (
                                    <div key={arena.id} className="h-[4.75rem] w-[9.25rem] shrink-0">
                                        <ArenaCard
                                            arena={arena}
                                            actions={getActionsForArena(arena.id)}
                                            onClick={interactive ? () => setViewingArenaId(arena.id) : undefined}
                                            variant="overview"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2.5">
                            <div className={emptyClass}>Nenhuma arena ainda.</div>
                        </div>
                    )}
                </section>
            </div>

            {interactive && viewingArena && (
                <ArenaDetailModal
                    arena={viewingArena}
                    onClose={() => setViewingArenaId(null)}
                />
            )}
        </>
    );
};
