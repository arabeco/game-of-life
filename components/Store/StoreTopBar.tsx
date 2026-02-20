import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';

export const StoreTopBar: React.FC = () => {
    const { userProfile } = useGame();
    const { gold, fragments } = userProfile.wallet || { gold: 0, fragments: 0 };

    return (
        <GlassCard className="flex items-center justify-between p-4 mb-6 bg-black/40 border-white/10 sticky top-0 z-50 backdrop-blur-md">
            <div className="flex items-center space-x-4">
                {/* Logo or Title could go here if not in parent */}
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Saldo</span>
            </div>
            
            <div className="flex items-center space-x-6">
                {/* Gold Display */}
                <div className="flex items-center space-x-2">
                    <div className="text-2xl">🪙</div>
                    <div className="flex flex-col items-end">
                        <span className="text-lg font-black text-[var(--gold)] leading-none">
                            {gold.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Ouro</span>
                    </div>
                    <button className="w-6 h-6 rounded-full bg-[var(--gold)]/20 text-[var(--gold)] flex items-center justify-center hover:bg-[var(--gold)]/30 transition-colors border border-[var(--gold)]/30">
                        <span className="text-xs font-bold">+</span>
                    </button>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-white/10"></div>

                {/* Fragments Display */}
                <div className="flex items-center space-x-2">
                    <div className="text-2xl">💎</div>
                    <div className="flex flex-col items-end">
                        <span className="text-lg font-black text-cyan-400 leading-none">
                            {fragments.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Fragmentos</span>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};
