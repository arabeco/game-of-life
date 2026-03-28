import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { CheckIcon, PlusIcon, XIcon } from './Icons';
import { Portal } from './Portal';
import { buildArenaLimitMessage, getArenaCapacitySummary } from '../utils/arenaCapacity';

interface ArenaSelectionModalProps {
    currentArenaId: string;
    onSelect: (arenaId: string) => void;
    onClose: () => void;
}

export const ArenaSelectionModal: React.FC<ArenaSelectionModalProps> = ({ currentArenaId, onSelect, onClose }) => {
    const { assets, addArena, userProfile, showToast } = useGame();
    const [isCreating, setIsCreating] = useState(false);
    const [newArenaName, setNewArenaName] = useState('');
    const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || 'geral');
    const arenaCapacity = getArenaCapacitySummary(assets, userProfile);
    const canCreateArena = !arenaCapacity.isAtLimit;
    const [newArenaIcon, setNewArenaIcon] = useState('🏟️');

    const handleCreateArena = async () => {
        if (!newArenaName.trim()) return;
        if (!canCreateArena) {
            showToast(buildArenaLimitMessage(arenaCapacity), 'warning');
            return;
        }
        
        try {
            const newArena = await addArena(selectedAssetId, {
                name: newArenaName,
                description: '',
                icon: newArenaIcon
            });

            onSelect(newArena.id);
            setIsCreating(false);
        } catch (error) {
            console.error("Error creating arena:", error);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold uppercase tracking-wider text-center flex-1">{isCreating ? 'Nova Arena' : 'Selecionar Arena'}</h2>
                    {isCreating && (
                        <button onClick={() => setIsCreating(false)} className="p-1 rounded-full hover:bg-white/10">
                            <XIcon className="w-5 h-5 text-gray-400" />
                        </button>
                    )}
                </div>

                {isCreating ? (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                            Arenas ativas: {arenaCapacity.active}/{arenaCapacity.limit}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase">Nome</label>
                            <input 
                                type="text" 
                                value={newArenaName}
                                onChange={e => setNewArenaName(e.target.value)}
                                placeholder="Ex: Musculação, Leitura..."
                                className="w-full bg-black/20 rounded-xl px-3 py-3 text-white focus:outline-none border border-white/10 focus:border-[var(--gold)]/50 mt-1"
                                autoFocus
                            />
                        </div>
                        
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase">Asset (Pilar)</label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                {assets.filter(a => a.id !== 'geral').map(asset => (
                                    <button
                                        key={asset.id}
                                        onClick={() => setSelectedAssetId(asset.id)}
                                        className={`p-2 rounded-xl text-xs font-bold border transition-all ${selectedAssetId === asset.id ? 'bg-[var(--gold)]/20 border-[var(--gold)] text-[var(--gold)]' : 'bg-black/20 border-transparent text-gray-400 hover:bg-white/5'}`}
                                    >
                                        {asset.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2">
                            <button 
                                onClick={handleCreateArena}
                                disabled={!newArenaName.trim() || !canCreateArena}
                                className="w-full py-3 rounded-xl luxe-skin-button disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Criar Arena
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                            {assets.map(asset => (
                                <div key={asset.id}>
                                    <h3 className="font-bold text-sm text-gray-400 px-3 pb-1 border-b border-white/10">{asset.name}</h3>
                                    <div className="pt-1">
                                        {asset.arenas.map(arena => (
                                            <button
                                                key={arena.id}
                                                onClick={() => { onSelect(arena.id); }}
                                                className={`w-full p-3 rounded-xl text-left flex justify-between items-center transition-colors ${currentArenaId === arena.id ? 'bg-white/20' : 'bg-black/20 hover:bg-white/10'}`}
                                            >
                                                <span>{arena.icon} {arena.name}</span>
                                                {currentArenaId === arena.id && <CheckIcon className="w-5 h-5 text-[var(--gold)]" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => canCreateArena ? setIsCreating(true) : showToast(buildArenaLimitMessage(arenaCapacity), 'warning')}
                            disabled={!canCreateArena}
                            className="w-full py-3 rounded-xl border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center space-x-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span className="font-bold uppercase text-sm">Criar Nova Arena</span>
                        </button>
                    </>
                )}
            </GlassCard>
        </div>
        </Portal>
    );
}
