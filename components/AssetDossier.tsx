

import React, { useState, useEffect } from 'react';
import { Asset, Arena, Slot, SlotValue, SlotLayoutType } from '../types';
import { useGame } from '../contexts/GameContext';
import { EditIcon, PlusIcon } from './Icons';
import { InputModal } from './inputs/InputModal';
import { ArenaDetailModal } from './ArenaDetailModal';
import { NewArenaModal } from './NewArenaModal';
import { ArenaCard } from './ArenaCard';

const SlotWidget: React.FC<{ slot: Slot, isEditing: boolean, onClick: () => void }> = ({ slot, isEditing, onClick }) => {
    const editableClasses = isEditing ? "hover:bg-black/80 cursor-pointer ring-1 ring-[var(--skin-accent-color)]/50 bg-[var(--skin-accent-color)]/5" : "cursor-default";

    const getGridClasses = (type: SlotLayoutType) => {
        switch(type) {
            case 1: return 'col-span-6'; // Wide
            case 2: return 'col-span-2 aspect-square'; // Square
            case 3: return 'col-span-3'; // Rect
            default: return 'col-span-6';
        }
    }

    const rarity = slot.rarity || (typeof slot.value === 'object' && 'rarity' in slot.value ? slot.value.rarity : undefined);
    const getRarityDotColor = (r?: string) => {
        if (!r) return null;
        const lower = r.toLowerCase();
        if (lower === 'uncommon' || lower === 'incomum') return 'bg-white';
        if (lower === 'rare' || lower === 'raro') return 'bg-[#CD7F32]';
        if (lower === 'epic' || lower === 'épico' || lower === 'epico') return 'bg-[#C0C0C0]';
        if (lower === 'legendary' || lower === 'lendário' || lower === 'lendario') return 'bg-[#F0C843]';
        return null;
    };
    const rarityDotColor = getRarityDotColor(rarity);

    const valueDisplay = typeof slot.value === 'object' && slot.value.imageUrl ? (
         <div className="relative w-full h-full rounded-xl overflow-hidden group">
             <img src={slot.value.imageUrl} alt={slot.value.caption} className="w-full h-full object-cover" />
             <div className="absolute bottom-0 inset-x-0 bg-black/70 p-1 text-[9px] text-white font-bold truncate text-center">
                 {slot.value.caption}
             </div>
         </div>
    ) : (
        <span className="truncate font-semibold text-white">{String(slot.value)}</span>
    );

    return (
        <div className={`text-center space-y-1 flex flex-col ${getGridClasses(slot.type)}`}>
            <h3 className="text-[10px] font-semibold text-white uppercase tracking-wider">{slot.label}</h3>
            <button
                onClick={isEditing ? onClick : undefined}
                className={`relative w-full flex-grow mx-auto p-2 rounded-xl bg-black/40 border border-[color:var(--skin-accent-color)] transition-colors flex items-center justify-center ${editableClasses}`}
            >
                {valueDisplay}
                {rarityDotColor && (
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${rarityDotColor} shadow-sm z-10`} />
                )}
            </button>
        </div>
    );
}

export const AssetDossier: React.FC<{ asset: Asset; onBack: () => void; }> = ({ asset, onBack }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
    const [viewingArenaId, setViewingArenaId] = useState<string | null>(null);
    const [isCreatingArena, setIsCreatingArena] = useState(false);
    const [playShimmer, setPlayShimmer] = useState(true);
    const { updateAssetSlotValue, getActionsForArena } = useGame();

    useEffect(() => {
        const timer = setTimeout(() => {
            setPlayShimmer(false);
        }, 1500); // Animation duration
        return () => clearTimeout(timer);
    }, [asset.id]); // Re-trigger animation if asset changes

    const handleSave = (value: SlotValue) => {
        if (editingSlot) updateAssetSlotValue(asset.id, editingSlot.id, value);
        setEditingSlot(null);
    }
    
    const handleMainButton = () => {
        if(isEditing) {
            setIsEditing(false);
        } else {
            onBack();
        }
    }
    
    const viewingArena = asset.arenas.find(a => a.id === viewingArenaId);

    return (
        <>
            <div className="animate-fade-in h-full">
                <div className={`dossier-bg border border-[color:var(--skin-accent-color)] rounded-2xl p-4 h-full flex flex-col shadow-2xl shadow-black/50 relative overflow-hidden ${playShimmer ? 'shimmer-effect' : ''} ${isEditing ? 'ring-2 ring-[var(--skin-accent-color)]/40 shadow-[0_0_25px_rgba(212,175,55,0.25)]' : ''}`}>
                    {/* Fixed Header */}
                    <div className="flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-full transition-colors border border-white/20 ${isEditing ? 'bg-[var(--skin-accent-color)]/20 border-[var(--skin-accent-color)]/40' : 'bg-transparent'}`}>
                                <EditIcon className={`w-5 h-5 ${isEditing ? 'text-white' : 'text-gray-300'}`} />
                            </button>
                            <h2 className="luxe-title-ornate text-xl font-black uppercase tracking-widest text-[color:var(--skin-accent-color)] luxe-title-shadow">{asset.name}</h2>
                            <button onClick={handleMainButton} className="px-5 py-2 text-sm font-bold rounded-xl luxe-skin-button">
                                OK
                            </button>
                        </div>

                        <div className="bg-black/35 rounded-xl p-2 flex items-center justify-center border border-[color:var(--skin-accent-color)] my-2 relative min-h-[3.5rem]">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-lg text-white border-2 border-[color:var(--skin-accent-color)] bg-black shadow-lg">
                                {asset.level}
                            </div>
                            <p className="px-12 text-sm font-bold text-gray-100 text-center leading-tight m-0 -translate-y-[1px]">
                                {(asset.levelDescriptions[asset.level] || 'Descrição não disponível.').replace(/^Nível\s+\d+:\s*/, '')}
                            </p>
                        </div>
                    </div>
                    
                    {/* Scrollable Slots Area */}
                    <div className="flex-grow overflow-y-auto pr-2 -mr-4 pl-1">
                        <div className="grid grid-cols-6 gap-1">
                             {asset.slots.map(slot => <SlotWidget key={slot.id} slot={slot} isEditing={isEditing} onClick={() => setEditingSlot(slot)} />)}
                        </div>
                    </div>

                    {/* Fixed Arenas Footer */}
                    <div className="flex-shrink-0 pt-2">
                        <div className='relative text-center mb-2'>
                                <hr className="border-t border-[color:var(--skin-accent-color)]" />
                                <h3 className="luxe-title-ornate text-sm font-semibold text-[color:var(--skin-accent-color)] uppercase tracking-wider absolute -top-3 left-1/2 -translate-x-1/2 bg-[#101010] px-2">Arenas</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {asset.arenas.map(arena => {
                                const arenaActions = getActionsForArena(arena.id);
                                return (
                                    <ArenaCard
                                        key={arena.id}
                                        arena={arena}
                                        actions={arenaActions}
                                        onClick={() => setViewingArenaId(arena.id)}
                                        variant="dossier"
                                    />
                                );
                            })}
                            <button onClick={() => setIsCreatingArena(true)} className="w-full h-40 flex-shrink-0 border-2 border-dashed border-[color:var(--accent-silver-soft)] rounded-xl flex flex-col items-center justify-center hover:border-[color:var(--accent-silver)] transition-colors text-gray-500 hover:text-gray-300">
                                <PlusIcon className="w-8 h-8"/>
                                <span className="text-xs font-bold mt-1">ADD ARENA</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {editingSlot && <InputModal slot={editingSlot} onClose={() => setEditingSlot(null)} onSave={handleSave} />}
            {viewingArena && <ArenaDetailModal arena={viewingArena} onClose={() => setViewingArenaId(null)} />}
            {isCreatingArena && <NewArenaModal assetId={asset.id} onClose={() => setIsCreatingArena(false)} />}
        </>
    );
};
