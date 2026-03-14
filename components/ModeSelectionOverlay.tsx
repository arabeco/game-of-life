import React, { useState } from 'react';
import { Portal } from './Portal';
import { useGame } from '../contexts/GameContext';
import { AssetIcon, ConfigIcon } from './Icons';
import { AppMode } from '../types';

export const ModeSelectionOverlay: React.FC = () => {
    const { userProfile, setAppMode, isProfileLoaded, showToast } = useGame();
    const [selectedMode, setSelectedMode] = useState<AppMode | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    // Only show if profile is loaded and appMode is not set
    const shouldShow = isProfileLoaded && userProfile.id !== 'placeholder_user' && !userProfile.appMode;

    if (!shouldShow) return null;

    const handleSelect = (mode: AppMode) => {
        setSelectedMode(mode);
    };

    const handleConfirm = async () => {
        if (!selectedMode) return;
        setIsConfirming(true);
        try {
            await setAppMode(selectedMode);
            if (selectedMode === 'GAME' && !userProfile.vanguardWelcomePending) {
                showToast('Pacote inicial do Vagante adicionado ao seu inventário.', 'success');
            }
        } catch (error) {
            console.error('Error setting app mode:', error);
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black animate-fade-in">
                {/* Background Aura */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,var(--skin-accent-color)_0%,transparent_70%)] opacity-10 blur-[120px]" />
                </div>

                <div className="relative w-full max-w-2xl mx-auto space-y-6 animate-fade-in-up max-h-[90vh] overflow-y-auto custom-scrollbar py-4 px-2">
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-4">
                            <div className="relative w-16 h-16">
                                <img src="/logo-diamond.png" alt="GLYPH" className="w-full h-full drop-shadow-[0_0_15px_var(--skin-accent-color)]" />
                                <div className="absolute inset-0 animate-spin-slow">
                                    <img src="/logo-core.png" alt="Core" className="w-full h-full" />
                                </div>
                            </div>
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-[0.3em] text-white luxe-title-ornate">
                            O DESPERTAR
                        </h2>
                        <p className="text-gray-400 text-[10px] tracking-widest uppercase max-w-xs mx-auto leading-relaxed">
                            Escolha sua interface inicial de soberania.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* GAME MODE CARD */}
                        <div
                            onClick={() => handleSelect('GAME')}
                            className={`group relative p-5 rounded-[24px] border-2 transition-all duration-500 cursor-pointer overflow-hidden ${selectedMode === 'GAME'
                                ? 'bg-[var(--skin-accent-color)]/20 border-[var(--skin-accent-color)] shadow-[0_0_30px_rgba(var(--skin-accent-color-rgb),0.2)] scale-[1.02]'
                                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                }`}
                        >
                            <div className="relative z-10 space-y-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${selectedMode === 'GAME' ? 'bg-[var(--skin-accent-color)] text-black shadow-[0_0_15px_var(--skin-accent-color)]' : 'bg-black/40 text-gray-400'
                                    }`}>
                                    <AssetIcon className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className={`text-base font-black tracking-widest uppercase ${selectedMode === 'GAME' ? 'text-[var(--skin-accent-color)]' : 'text-white'}`}>
                                        MODO GAME
                                        <span className="block text-[8px] opacity-70 mt-0.5">Soberania Total</span>
                                    </h3>
                                    <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                                        Interface RPG completa. Progressão, Ativos e Inventário. Sua vida como um épico.
                                    </p>
                                </div>
                                <ul className="space-y-1">
                                    {['Sistema de RPG & XP', 'Economia de Ouro', 'Clãs & Multiplayer'].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-2 text-[8px] font-bold tracking-widest text-gray-500 uppercase">
                                            <div className="w-1 h-1 rounded-full bg-[var(--skin-accent-color)]" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* BASIC MODE CARD */}
                        <div
                            onClick={() => handleSelect('BASIC')}
                            className={`group relative p-5 rounded-[24px] border-2 transition-all duration-500 cursor-pointer overflow-hidden ${selectedMode === 'BASIC'
                                ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)] scale-[1.02]'
                                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                }`}
                        >
                            <div className="relative z-10 space-y-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${selectedMode === 'BASIC' ? 'bg-blue-500 text-black shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-black/40 text-gray-400'
                                    }`}>
                                    <ConfigIcon className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className={`text-base font-black tracking-widest uppercase ${selectedMode === 'BASIC' ? 'text-blue-400' : 'text-white'}`}>
                                        MODO BÁSICO
                                        <span className="block text-[8px] opacity-70 mt-0.5">Foco e Execução</span>
                                    </h3>
                                    <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                                        Interface minimalista "Style Office". Foco em Arenas, Planner e Ações.
                                    </p>
                                </div>
                                <ul className="space-y-1">
                                    {['Interface Clean', 'Planner Tático', 'Gestão de Hábitos'].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-2 text-[8px] font-bold tracking-widest text-gray-500 uppercase">
                                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center pt-2">
                        <button
                            disabled={!selectedMode || isConfirming}
                            onClick={handleConfirm}
                            className={`w-full max-w-xs py-3 rounded-xl font-black tracking-[0.3em] text-xs uppercase transition-all duration-500 ${selectedMode
                                ? 'bg-white text-black hover:scale-105 shadow-xl active:scale-95'
                                : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                                }`}
                        >
                            {isConfirming ? 'VINCULANDO...' : 'CONFIRMAR'}
                        </button>
                    </div>

                    <p className="text-center text-[10px] text-gray-600 uppercase tracking-widest">
                        * você pode alterar sua escolha a qualquer momento nas configurações.
                    </p>
                </div>
            </div>
        </Portal>
    );
};
