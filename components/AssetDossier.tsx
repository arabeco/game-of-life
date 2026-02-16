

import React, { useState, useEffect } from 'react';
import { Asset, Arena, Slot, SlotValue, SlotLayoutType } from '../types';
import { useGame } from '../contexts/GameContext';
import { EditIcon, PlusIcon } from './Icons';
import { InputModal } from './inputs/InputModal';
import { ArenaDetailModal } from './ArenaDetailModal';
import { NewArenaModal } from './NewArenaModal';
import { ArenaCard } from './ArenaCard';

const SlotWidget: React.FC<{ slot: Slot, isEditing: boolean, onClick: () => void }> = ({ slot, isEditing, onClick }) => {
    const editableClasses = isEditing ? "hover:bg-black/80 cursor-pointer" : "cursor-default";

    const getGridClasses = (type: SlotLayoutType) => {
        switch(type) {
            case 1: return 'col-span-6'; // Wide
            case 2: return 'col-span-2 aspect-square'; // Square
            case 3: return 'col-span-3'; // Rect
            default: return 'col-span-6';
        }
    }

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
                        className={`w-full flex-grow mx-auto p-2 rounded-xl bg-black/40 border border-[color:var(--accent-gold-soft)] transition-colors flex items-center justify-center ${editableClasses}`}
            >
                {valueDisplay}
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
                <div className={`dossier-bg border border-[color:var(--accent-gold-soft)] rounded-2xl p-4 h-full flex flex-col shadow-2xl shadow-black/50 relative overflow-hidden ${playShimmer ? 'shimmer-effect' : ''}`}>
                    {/* Fixed Header */}
                    <div className="flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-full transition-colors border border-white/20 ${isEditing ? 'bg-white/20' : 'bg-transparent'}`}>
                                <EditIcon className={`w-5 h-5 ${isEditing ? 'text-white' : 'text-gray-300'}`} />
                            </button>
                            <h2 className="luxe-title-ornate text-xl font-black uppercase tracking-widest text-[color:var(--skin-accent-color)] luxe-title-shadow">{asset.name}</h2>
                            <button onClick={handleMainButton} className="px-5 py-2 text-sm font-bold rounded-xl luxe-gold-button">
                                OK
                            </button>
                        </div>

                        <div className="bg-black/35 rounded-xl p-2 flex items-center space-x-3 border border-[color:var(--accent-gold-soft)] my-2">
                            <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-lg text-white border-2 border-[color:var(--accent-gold)] bg-black">
                                {asset.level}
                            </div>
                            <p className="text-sm text-gray-300">{(asset.levelDescriptions[asset.level] || 'Descrição não disponível.').replace(/^Nível\s+\d+:\s*/, '')}</p>
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
                                <hr className="border-t border-[color:var(--accent-gold-soft)]" />
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
