

import React, { useState, useEffect } from 'react';
import { Asset, Arena, Slot, SlotValue, SlotLayoutType } from '../types';
import { useGame } from '../contexts/GameContext';
import { EditIcon, PlusIcon } from './Icons';
import { InputModal } from './inputs/InputModal';
import { ArenaDetailModal } from './ArenaDetailModal';
import { NewArenaModal } from './NewArenaModal';
import { ArenaCard } from './ArenaCard';
import { getRarityVisual } from '../constants/rarityVisuals';
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

const getSlotTextValue = (value: SlotValue | Record<string, unknown> | null | undefined): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value !== 'object') return '';

    const record = value as Record<string, unknown>;
    const preferredKeys = ['caption', 'label', 'name', 'title', 'value', 'text', 'content'];

    for (const key of preferredKeys) {
        const candidate = record[key];
        if (typeof candidate === 'string' || typeof candidate === 'number') {
            return String(candidate);
        }
    }

    for (const candidate of Object.values(record)) {
        if (typeof candidate === 'string' || typeof candidate === 'number') {
            return String(candidate);
        }
    }

    return '';
};

const SlotWidget: React.FC<{
    slot: Slot;
    isEditing: boolean;
    onClick: () => void;
    metallicStyle: React.CSSProperties;
}> = ({ slot, isEditing, onClick, metallicStyle }) => {
    if (!slot) return null;
    const editableClasses = isEditing ? "hover:bg-black/80 cursor-pointer ring-1 ring-[var(--skin-accent-color)]/50 bg-[var(--skin-accent-color)]/5" : "cursor-default";

    const getGridClasses = (type: SlotLayoutType) => {
        switch (type) {
            case 1: return 'col-span-6'; // Wide
            case 2: return 'col-span-2 aspect-square'; // Square
            case 3: return 'col-span-3'; // Rect
            case 4: return 'col-span-6 w-2/3 mx-auto'; // Centered Wide
            default: return 'col-span-6';
        }
    }

    const rarity = slot.rarity || (typeof slot.value === 'object' && 'rarity' in slot.value ? slot.value.rarity : undefined);
    const rarityVisual = rarity ? getRarityVisual(rarity) : null;

    const valueDisplay = typeof slot.value === 'object' && slot.value.imageUrl ? (
        <div className="relative w-full h-full rounded-xl overflow-hidden group">
            <img src={slot.value.imageUrl} alt={slot.value.caption} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-black/70 p-1 text-[9px] text-white font-bold truncate text-center">
                {slot.value.caption}
            </div>
        </div>
    ) : (
        <span className="line-clamp-3 px-1 text-center font-semibold text-white">
            {getSlotTextValue(slot.value) || 'Sem valor'}
        </span>
    );

    return (
        <div className={`text-center space-y-0.5 flex flex-col ${getGridClasses(slot.type)}`}>
            <h3 className="text-[9px] font-semibold text-white/80 uppercase tracking-wider">{slot.label}</h3>
            <button
                onClick={isEditing ? onClick : undefined}
                className={`relative w-full flex-grow mx-auto p-1 rounded-lg bg-black/40 border border-[color:var(--skin-accent-color)] transition-colors flex items-center justify-center ${editableClasses} min-h-[2rem]`}
                style={metallicStyle}
            >
                {valueDisplay}
                {rarityVisual && (
                    <div className="absolute top-1 right-1 z-10 h-1.5 w-1.5 rounded-full shadow-sm" style={{ backgroundColor: rarityVisual.hex }} />
                )}
            </button>
        </div>
    );
}

export const AssetDossier: React.FC<{
    asset: Asset;
    onBack: () => void;
    embedded?: boolean;
    showArenas?: boolean;
    showHeader?: boolean;
    showLevelPanel?: boolean;
    showEditButton?: boolean;
    isEditingOverride?: boolean;
    onToggleEditing?: () => void;
}> = ({
    asset,
    onBack,
    embedded = false,
    showArenas = true,
    showHeader = true,
    showLevelPanel = true,
    showEditButton = true,
    isEditingOverride,
    onToggleEditing,
}) => {
    const [internalIsEditing, setInternalIsEditing] = useState(false);
    const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
    const [viewingArenaId, setViewingArenaId] = useState<string | null>(null);
    const [isCreatingArena, setIsCreatingArena] = useState(false);
    const [playShimmer, setPlayShimmer] = useState(true);
    const { updateAssetSlotValue, getActionsForArena } = useGame();
    const isEditing = isEditingOverride ?? internalIsEditing;
    const assetAccent = ASSET_ACCENT_COLORS[asset.id as keyof typeof ASSET_ACCENT_COLORS] || '#F0C843';
    const assetAccentRgb = hexToRgb(assetAccent);
    const isEmbeddedWidgetsMode = embedded && !showArenas;
    const shellStyle: React.CSSProperties = {
        backgroundImage: isEmbeddedWidgetsMode
            ? `radial-gradient(circle at 18% 0%, rgba(255,255,255,0.08), transparent 28%),
               linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)),
               linear-gradient(180deg, rgba(12,12,12,0.88), rgba(6,6,6,0.98))`
            : `radial-gradient(circle at 18% 0%, rgba(255,252,235,0.28), transparent 30%),
               radial-gradient(circle at 86% 12%, rgba(255,238,180,0.12), transparent 24%),
               linear-gradient(138deg, rgba(243,210,118,0.48) 0%, rgba(255,247,222,0.18) 16%, rgba(223,186,88,0.34) 36%, rgba(24,20,14,0.22) 68%, ${rgbaString(assetAccentRgb, 0.34)} 100%),
               linear-gradient(180deg, rgba(12,12,12,0.9), rgba(6,6,6,0.98))`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 48px rgba(0,0,0,0.42)`,
    };

    const panelStyle: React.CSSProperties = {
        backgroundImage: isEmbeddedWidgetsMode
            ? `linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))`
            : `linear-gradient(145deg, rgba(255,245,214,0.18) 0%, rgba(255,255,255,0.06) 20%, rgba(214,174,78,0.18) 42%, rgba(0,0,0,0.24) 72%, ${rgbaString(assetAccentRgb, 0.18)} 100%)`,
        borderColor: 'rgba(255,255,255,0.12)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
    };

    const slotStyle: React.CSSProperties = {
        backgroundImage: isEmbeddedWidgetsMode
            ? `linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))`
            : `linear-gradient(150deg, rgba(255,245,220,0.16) 0%, rgba(255,255,255,0.05) 24%, rgba(209,169,80,0.15) 44%, rgba(0,0,0,0.28) 74%, ${rgbaString(assetAccentRgb, 0.16)} 100%)`,
    };

    const toggleEditing = () => {
        if (onToggleEditing) {
            onToggleEditing();
            return;
        }
        setInternalIsEditing((value) => !value);
    };

    useEffect(() => {
        if (!asset?.id) return;
        const timer = setTimeout(() => {
            setPlayShimmer(false);
        }, 1500); // Animation duration
        return () => clearTimeout(timer);
    }, [asset?.id]); // Re-trigger animation if asset changes

    if (!asset) {
        return (
            <div className="dossier-bg border border-red-500/30 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="text-4xl text-red-500/50">!</div>
                <h2 className="text-xl font-bold text-white uppercase italic">Ativo nao encontrado</h2>
                <p className="text-sm text-gray-400">Os dados deste dossie estao indisponiveis ou incompletos.</p>
                <button onClick={onBack} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-colors border border-white/20">
                    VOLTAR
                </button>
            </div>
        );
    }

    const handleSave = (value: SlotValue) => {
        if (editingSlot) updateAssetSlotValue(asset.id, editingSlot.id, value);
        setEditingSlot(null);
    }

    const handleMainButton = () => {
        if (isEditing) {
            if (onToggleEditing) {
                onToggleEditing();
            } else {
                setInternalIsEditing(false);
            }
        } else {
            onBack();
        }
    }

    const viewingArena = asset.arenas.find(a => a.id === viewingArenaId);
    const containerClasses = embedded
        ? `min-h-0 flex flex-col overflow-hidden ${isEditing ? 'ring-1 ring-[var(--skin-accent-color)]/25 rounded-2xl' : ''}`
        : `dossier-bg border border-[color:var(--skin-accent-color)] rounded-2xl p-4 h-auto max-h-full flex flex-col shadow-2xl shadow-black/50 relative overflow-hidden ${playShimmer ? 'shimmer-effect' : ''} ${isEditing ? 'ring-2 ring-[var(--skin-accent-color)]/40 shadow-[0_0_25px_rgba(212,175,55,0.25)]' : ''}`;

    return (
        <>
            <div className={`animate-fade-in ${embedded ? 'h-auto' : 'h-full'} flex flex-col`}>
                <div className={containerClasses} style={shellStyle}>
                    {!isEmbeddedWidgetsMode && (
                        <div
                            className="modal-aura-overlay"
                            style={{ '--modal-aura-color': 'rgba(229, 191, 88, 0.16)' } as React.CSSProperties}
                        />
                    )}
                    <div
                        className="modal-sheen-overlay"
                        style={{
                            '--modal-sheen-color': 'rgba(255, 222, 120, 0.82)',
                            zIndex: 24,
                            opacity: 0.01,
                            mixBlendMode: 'screen',
                        } as React.CSSProperties}
                    />
                    <div className="relative z-10 flex flex-col min-h-0 h-full">
                    {/* Fixed Header */}
                    {(showHeader || embedded) && (
                        <div className={`flex-shrink-0 ${embedded ? (showHeader ? 'mb-3 px-1 pt-1' : 'mb-2') : 'mb-2'}`}>
                            {(showHeader || showEditButton) && (
                                <div className={`flex items-center ${showHeader ? 'justify-between' : 'justify-end'} mb-2`}>
                                    {showEditButton ? (
                                        <button onClick={toggleEditing} className={`p-1.5 rounded-full transition-colors border border-white/20 ${isEditing ? 'bg-[var(--skin-accent-color)]/20 border-[var(--skin-accent-color)]/40' : 'bg-transparent'}`}>
                                            <EditIcon className={`w-4 h-4 ${isEditing ? 'text-white' : 'text-gray-300'}`} />
                                        </button>
                                    ) : null}
                                    {showHeader && (
                                        <>
                                            <h2
                                                className={`${embedded ? 'text-base' : 'text-lg'} luxe-title-ornate font-black uppercase tracking-widest luxe-title-shadow truncate px-2 text-center`}
                                                style={{ color: 'var(--ui-card-text)' }}
                                            >
                                                {asset.name}
                                            </h2>
                                            {embedded ? (
                                                <div className="w-[3.75rem]" />
                                            ) : (
                                                <button onClick={handleMainButton} className="px-4 py-1.5 text-xs font-bold rounded-lg luxe-skin-button">
                                                    OK
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                            {embedded && !showHeader && showEditButton && <div className="mb-2 border-t border-white/10" />}

                            {showLevelPanel && (
                                embedded && !showHeader ? (
                                    <div className="rounded-lg border border-[color:var(--skin-accent-color)]/35 bg-black/20 px-3 py-2" style={panelStyle}>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[color:var(--skin-accent-color)] bg-black text-lg font-black text-white shadow-lg">
                                                {asset.level}
                                            </div>
                                            <p className="m-0 text-xs font-medium leading-tight text-center text-gray-100">
                                                {(asset.levelDescriptions[asset.level] || 'Descricao nao disponivel.').replace(/^Nivel\s+\d+:\s*/, '')}
                                            </p>
                                        </div>
                                    </div>
                                ) : embedded ? (
                                    <div className="mx-auto mt-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--skin-accent-color)]/40 bg-black/20 px-4 py-1.5" style={panelStyle}>
                                        <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45">Nivel</span>
                                        <span className="text-sm font-black text-white">{asset.level}</span>
                                    </div>
                                ) : (
                                    <div className="bg-black/35 rounded-lg p-1.5 flex items-center justify-center border border-[color:var(--skin-accent-color)] relative min-h-[3rem]" style={panelStyle}>
                                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-base text-white border-2 border-[color:var(--skin-accent-color)] bg-black shadow-lg">
                                            {asset.level}
                                        </div>
                                        <p className="pl-10 pr-2 text-xs font-medium text-gray-100 text-center leading-tight m-0 line-clamp-2">
                                            {(asset.levelDescriptions[asset.level] || 'Descricao nao disponivel.').replace(/^Nivel\s+\d+:\s*/, '')}
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    )}

                    {/* Scrollable Slots Area - Flexible but doesn't force expansion */}
                    <div className={`overflow-y-auto custom-scrollbar min-h-0 ${embedded ? 'px-1 pb-1' : 'pr-1 -mr-2 pl-1 pb-2'}`}>
                        <div className="grid grid-cols-6 gap-1.5">
                            {asset.slots?.map(slot => (
                                <SlotWidget
                                    key={slot.id}
                                    slot={slot}
                                    isEditing={isEditing}
                                    onClick={() => setEditingSlot(slot)}
                                    metallicStyle={slotStyle}
                                />
                            ))}
                            {(!asset.slots || asset.slots.length === 0) && (
                                <div className="col-span-6 py-6 text-center text-[10px] text-gray-500 uppercase tracking-widest border border-dashed border-white/5 rounded-xl">
                                    Nenhum espaco de dado configurado.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fixed Arenas Footer - Takes only necessary space */}
                    {showArenas && (
                    <div className="flex-shrink-0 flex flex-col min-h-0 pt-3 border-t border-[var(--skin-accent-color)]/30 relative mt-auto" style={panelStyle}>
                        <h3 className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#101010] px-2 text-[10px] font-black uppercase tracking-widest z-10 border border-[var(--skin-accent-color)]/30 rounded-full" style={{ color: 'var(--ui-card-text)' }}>
                            Arenas
                        </h3>

                        <div className="overflow-y-auto pr-1 pt-2 custom-scrollbar">
                            <div className="grid grid-cols-3 gap-2 pb-1">
                                {asset.arenas?.map(arena => {
                                    const arenaActions = typeof getActionsForArena === 'function' ? getActionsForArena(arena.id) : [];
                                    return (
                                        <div key={arena.id} className="aspect-[3/4] w-full">
                                            <ArenaCard
                                                arena={arena}
                                                actions={arenaActions}
                                                onClick={() => setViewingArenaId(arena.id)}
                                                variant="dossier"
                                            />
                                        </div>
                                    );
                                })}

                                <button
                                    onClick={() => setIsCreatingArena(true)}
                                    className="aspect-[3/4] w-full border border-dashed border-[var(--skin-accent-color)]/40 rounded-lg flex flex-col items-center justify-center hover:border-[var(--skin-accent-color)] hover:bg-[var(--skin-accent-color)]/5 transition-all group bg-black/20"
                                    style={slotStyle}
                                >
                                    <PlusIcon className="w-5 h-5 text-gray-500 group-hover:text-[var(--skin-accent-color)] transition-colors mb-1" />
                                    <span className="text-[8px] font-bold text-gray-500 group-hover:text-[var(--skin-accent-color)] uppercase tracking-wider text-center leading-tight px-1">Add<br />Arena</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    )}
                    </div>
                </div>
            </div>

            {editingSlot && <InputModal slot={editingSlot} onClose={() => setEditingSlot(null)} onSave={handleSave} />}
            {viewingArena && <ArenaDetailModal arena={viewingArena} onClose={() => setViewingArenaId(null)} />}
            {isCreatingArena && <NewArenaModal assetId={asset.id} onClose={() => setIsCreatingArena(false)} />}
        </>
    );
};


