import React, { useMemo, useState } from 'react';
import { Asset } from '../types';
import { useGame } from '../contexts/GameContext';
import { ArenaCard } from './ArenaCard';
import { ArenaDetailModal } from './ArenaDetailModal';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';

const hexToRgb = (hex: string): [number, number, number] | null => {
    const normalized = hex.replace('#', '').trim();
    if (normalized.length !== 6) return null;
    const value = Number.parseInt(normalized, 16);
    if (Number.isNaN(value)) return null;
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const rgbaString = (rgb: [number, number, number] | null, alpha: number): string =>
    rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})` : `rgba(255, 215, 0, ${alpha})`;

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
const emptyClass = 'rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-4 text-center text-xs text-white/45';

export const AssetArenaBoard: React.FC<AssetArenaBoardProps> = ({ asset, showArchived = true, interactive = true }) => {
    const { getActionsForArena, userProfile, appMode } = useGame();
    const [viewingArenaId, setViewingArenaId] = useState<string | null>(null);
    const assetAccent = ASSET_ACCENT_COLORS[asset.id as keyof typeof ASSET_ACCENT_COLORS] || '#F0C843';
    const assetAccentRgb = hexToRgb(assetAccent);
    const isRestrainedMetal = appMode === 'BASIC' || userProfile.skin === 'BASIC' || userProfile.skin === 'default';
    const sectionStyle: React.CSSProperties = {
        backgroundImage: isRestrainedMetal
            ? `radial-gradient(circle at 18% 0%, rgba(255,255,255,0.12), transparent 26%),
               linear-gradient(145deg, rgba(226,192,98,0.12) 0%, rgba(255,255,255,0.03) 28%, rgba(0,0,0,0.22) 68%, ${rgbaString(assetAccentRgb, 0.14)} 100%)`
            : `radial-gradient(circle at 18% 0%, rgba(255,255,255,0.16), transparent 24%),
               linear-gradient(145deg, rgba(226,192,98,0.16) 0%, rgba(255,255,255,0.04) 28%, rgba(0,0,0,0.22) 68%, ${rgbaString(assetAccentRgb, 0.18)} 100%)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 18px rgba(226,192,98,0.06)',
    };

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
                    <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] px-4 py-3" style={sectionStyle}>
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
                                            className={`w-[4.65rem] shrink-0 ${index > 0 ? '-ml-3.5' : ''}`}
                                            style={{ transform: pileTransform(index) }}
                                        >
                                            <div className="pointer-events-none h-[5.85rem] w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.32)]">
                                                <ArenaCard
                                                    arena={arena}
                                                    actions={getActionsForArena(arena.id)}
                                                    onClick={interactive ? () => setViewingArenaId(arena.id) : undefined}
                                                    variant="compact"
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

                <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] px-4 py-3" style={sectionStyle}>
                    <p className={sectionTitleClass}>Ativas</p>

                    {activeArenas.length > 0 ? (
                        <div className="mt-2.5 overflow-x-auto pb-1.5">
                            <div className="flex min-w-max gap-2 pr-1">
                                {activeArenas.map((arena) => (
                                    <div key={arena.id} className="h-[6.15rem] w-[4.9rem] shrink-0">
                                        <ArenaCard
                                            arena={arena}
                                            actions={getActionsForArena(arena.id)}
                                            onClick={interactive ? () => setViewingArenaId(arena.id) : undefined}
                                            variant="compact"
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
