import React, { useState } from 'react';
import { Portal } from './Portal';
import { useGame } from '../contexts/GameContext';
import { AssetIcon, ConfigIcon } from './Icons';
import { AppMode } from '../types';

export const ModeSelectionOverlay: React.FC = () => {
    const { userProfile, setAppMode, isProfileLoaded, showToast } = useGame();
    const [selectedMode, setSelectedMode] = useState<AppMode | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

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
                showToast('Pacote inicial do Vagante adicionado ao seu inventario.', 'success');
            }
        } catch (error) {
            console.error('Error setting app mode:', error);
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 px-3 py-4 safe-area-top safe-area-bottom animate-fade-in">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.12),transparent_58%)]" />
                    <div className="absolute top-1/2 left-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,var(--skin-accent-color)_0%,transparent_70%)] opacity-10 blur-[120px]" />
                </div>

                <div className="relative w-full max-w-[23rem] sm:max-w-2xl">
                    <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,14,16,0.98),rgba(5,5,6,0.96))] shadow-[0_24px_90px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
                        <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.16),transparent_72%)] pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                        <div className="relative max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar px-4 py-5 sm:max-h-[88vh] sm:px-6 sm:py-6">
                            <div className="text-center space-y-2">
                                <div className="mb-3 flex justify-center">
                                    <div className="relative h-14 w-14 sm:h-16 sm:w-16">
                                        <img src="/logo-diamond.png" alt="GLYPH" className="h-full w-full drop-shadow-[0_0_15px_var(--skin-accent-color)]" />
                                        <div className="absolute inset-0 animate-spin-slow">
                                            <img src="/logo-core.png" alt="Core" className="h-full w-full" />
                                        </div>
                                    </div>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-[0.24em] text-white luxe-title-ornate">
                                    O DESPERTAR
                                </h2>
                                <p className="mx-auto max-w-[17rem] text-[10px] sm:text-[11px] tracking-[0.22em] uppercase leading-relaxed text-gray-400">
                                    Escolha sua interface inicial de soberania.
                                </p>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
                                <div
                                    onClick={() => handleSelect('GAME')}
                                    className={`group relative cursor-pointer overflow-hidden rounded-[24px] border-2 p-4 transition-all duration-500 sm:p-5 ${selectedMode === 'GAME'
                                        ? 'bg-[var(--skin-accent-color)]/18 border-[var(--skin-accent-color)] shadow-[0_0_30px_rgba(var(--skin-accent-color-rgb),0.18)] scale-[1.01]'
                                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.12),transparent_72%)] pointer-events-none" />
                                    <div className="relative z-10 space-y-3 sm:space-y-4">
                                        <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition-all duration-500 ${selectedMode === 'GAME' ? 'bg-[var(--skin-accent-color)] text-black shadow-[0_0_15px_var(--skin-accent-color)]' : 'bg-black/40 text-gray-400'
                                            }`}>
                                            <AssetIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className={`text-sm sm:text-base font-black tracking-[0.18em] uppercase ${selectedMode === 'GAME' ? 'text-[var(--skin-accent-color)]' : 'text-white'}`}>
                                                MODO GAME
                                                <span className="mt-1 block text-[8px] sm:text-[9px] opacity-70">Soberania Total</span>
                                            </h3>
                                            <p className="text-[10px] sm:text-[11px] font-medium leading-relaxed text-gray-400">
                                                Interface RPG completa. Progressao, ativos e inventario para operar a vida como campanha.
                                            </p>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {['Sistema de RPG & XP', 'Economia de Ouro', 'Clas & Multiplayer'].map((feat, i) => (
                                                <li key={i} className="flex items-center gap-2 text-[8px] sm:text-[9px] font-bold tracking-[0.16em] text-gray-500 uppercase">
                                                    <div className="h-1 w-1 rounded-full bg-[var(--skin-accent-color)]" />
                                                    {feat}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div
                                    onClick={() => handleSelect('BASIC')}
                                    className={`group relative cursor-pointer overflow-hidden rounded-[24px] border-2 p-4 transition-all duration-500 sm:p-5 ${selectedMode === 'BASIC'
                                        ? 'bg-blue-500/18 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.18)] scale-[1.01]'
                                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.15),transparent_72%)] pointer-events-none" />
                                    <div className="relative z-10 space-y-3 sm:space-y-4">
                                        <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition-all duration-500 ${selectedMode === 'BASIC' ? 'bg-blue-500 text-black shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-black/40 text-gray-400'
                                            }`}>
                                            <ConfigIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className={`text-sm sm:text-base font-black tracking-[0.18em] uppercase ${selectedMode === 'BASIC' ? 'text-blue-400' : 'text-white'}`}>
                                                MODO BASICO
                                                <span className="mt-1 block text-[8px] sm:text-[9px] opacity-70">Foco e Execucao</span>
                                            </h3>
                                            <p className="text-[10px] sm:text-[11px] font-medium leading-relaxed text-gray-400">
                                                Interface mais limpa, com foco em arenas, planner e acoes sem tanta camada visual.
                                            </p>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {['Interface Clean', 'Planner Tatico', 'Gestao de Habitos'].map((feat, i) => (
                                                <li key={i} className="flex items-center gap-2 text-[8px] sm:text-[9px] font-bold tracking-[0.16em] text-gray-500 uppercase">
                                                    <div className="h-1 w-1 rounded-full bg-blue-500" />
                                                    {feat}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 sm:mt-6">
                                <button
                                    disabled={!selectedMode || isConfirming}
                                    onClick={handleConfirm}
                                    className={`w-full rounded-2xl py-3 sm:py-3.5 text-[11px] font-black tracking-[0.28em] uppercase transition-all duration-500 ${selectedMode
                                        ? 'bg-white text-black hover:scale-[1.01] shadow-xl active:scale-[0.98]'
                                        : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                                        }`}
                                >
                                    {isConfirming ? 'VINCULANDO...' : 'CONFIRMAR'}
                                </button>
                            </div>

                            <p className="mt-3 text-center text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-gray-600">
                                voce pode alterar essa escolha depois em Configuracoes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
