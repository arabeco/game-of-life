

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
            case 4: return 'col-span-6 w-2/3 mx-auto'; // Centered Wide
            default: return 'col-span-6';
        }
    }

    const rarity = slot.rarity || (typeof slot.value === 'object' && 'rarity' in slot.value ? slot.value.rarity : undefined);
    const getRarityDotColor = (r?: string) => {
        if (!r) return null;
        const lower = r.toLowerCase();
        // Comum: Marrom
        if (lower === 'common' || lower === 'comum') return 'bg-[#A0522D]';
        // Incomum: Prata
        if (lower === 'uncommon' || lower === 'incomum') return 'bg-[#C0C0C0]';
        // Raro: Ouro
        if (lower === 'rare' || lower === 'raro') return 'bg-[#FFD700]';
        // Épico: Azul
        if (lower === 'epic' || lower === 'épico' || lower === 'epico') return 'bg-blue-500';
        // Lendário: Roxo
        if (lower === 'legendary' || lower === 'lendário' || lower === 'lendario') return 'bg-purple-500';
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
        <div className={`text-center space-y-0.5 flex flex-col ${getGridClasses(slot.type)}`}>
            <h3 className="text-[9px] font-semibold text-white/80 uppercase tracking-wider">{slot.label}</h3>
            <button
                onClick={isEditing ? onClick : undefined}
                className={`relative w-full flex-grow mx-auto p-1 rounded-lg bg-black/40 border border-[color:var(--skin-accent-color)] transition-colors flex items-center justify-center ${editableClasses} min-h-[2rem]`}
            >
                {valueDisplay}
                {rarityDotColor && (
                    <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${rarityDotColor} shadow-sm z-10`} />
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
            <div className="animate-fade-in h-full flex flex-col">
                <div className={`dossier-bg border border-[color:var(--skin-accent-color)] rounded-2xl p-4 h-auto max-h-full flex flex-col shadow-2xl shadow-black/50 relative overflow-hidden ${playShimmer ? 'shimmer-effect' : ''} ${isEditing ? 'ring-2 ring-[var(--skin-accent-color)]/40 shadow-[0_0_25px_rgba(212,175,55,0.25)]' : ''}`}>
                    {/* Fixed Header */}
                    <div className="flex-shrink-0 mb-2">
                        <div className="flex justify-between items-center mb-1">
                            <button onClick={() => setIsEditing(!isEditing)} className={`p-1.5 rounded-full transition-colors border border-white/20 ${isEditing ? 'bg-[var(--skin-accent-color)]/20 border-[var(--skin-accent-color)]/40' : 'bg-transparent'}`}>
                                <EditIcon className={`w-4 h-4 ${isEditing ? 'text-white' : 'text-gray-300'}`} />
                            </button>
                            <h2 className="luxe-title-ornate text-lg font-black uppercase tracking-widest text-[color:var(--skin-accent-color)] luxe-title-shadow truncate px-2">{asset.name}</h2>
                            <button onClick={handleMainButton} className="px-4 py-1.5 text-xs font-bold rounded-lg luxe-skin-button">
                                OK
                            </button>
                        </div>

                        <div className="bg-black/35 rounded-lg p-1.5 flex items-center justify-center border border-[color:var(--skin-accent-color)] relative min-h-[3rem]">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-base text-white border-2 border-[color:var(--skin-accent-color)] bg-black shadow-lg">
                                {asset.level}
                            </div>
                            <p className="pl-10 pr-2 text-xs font-medium text-gray-100 text-center leading-tight m-0 line-clamp-2">
                                {(asset.levelDescriptions[asset.level] || 'Descrição não disponível.').replace(/^Nível\s+\d+:\s*/, '')}
                            </p>
                        </div>
                    </div>
                    
                    {/* Scrollable Slots Area - Flexible but doesn't force expansion */}
                    <div className="flex-shrink-0 overflow-y-auto pr-1 -mr-2 pl-1 pb-2 custom-scrollbar min-h-0">
                        <div className="grid grid-cols-6 gap-1.5">
                             {asset.slots.map(slot => (
                                <SlotWidget 
                                    key={slot.id} 
                                    slot={slot} 
                                    isEditing={isEditing} 
                                    onClick={() => setEditingSlot(slot)} 
                                />
                             ))}
                        </div>
                    </div>

                    {/* Fixed Arenas Footer - Takes only necessary space */}
                    <div className="flex-shrink-0 flex flex-col min-h-0 pt-3 border-t border-[var(--skin-accent-color)]/30 relative mt-auto">
                        <h3 className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#101010] px-2 text-[10px] font-black text-[var(--skin-accent-color)] uppercase tracking-widest z-10 border border-[var(--skin-accent-color)]/30 rounded-full">
                            Arenas
                        </h3>
                        
                        <div className="overflow-y-auto pr-1 pt-2 custom-scrollbar">
                            <div className="grid grid-cols-3 gap-2 pb-1">
                                {asset.arenas.map(arena => {
                                    const arenaActions = getActionsForArena(arena.id);
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
                                >
                                    <PlusIcon className="w-5 h-5 text-gray-500 group-hover:text-[var(--skin-accent-color)] transition-colors mb-1"/>
                                    <span className="text-[8px] font-bold text-gray-500 group-hover:text-[var(--skin-accent-color)] uppercase tracking-wider text-center leading-tight px-1">Add<br/>Arena</span>
                                </button>
                            </div>
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
