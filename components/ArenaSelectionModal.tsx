import React from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { CheckIcon } from './Icons';

interface ArenaSelectionModalProps {
    currentArenaId: string;
    onSelect: (arenaId: string) => void;
    onClose: () => void;
}

export const ArenaSelectionModal: React.FC<ArenaSelectionModalProps> = ({ currentArenaId, onSelect, onClose }) => {
    const { assets } = useGame();

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-center">Selecionar Arena</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
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
            </GlassCard>
        </div>
    );
}