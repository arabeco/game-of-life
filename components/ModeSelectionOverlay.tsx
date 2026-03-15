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
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/82 px-3 py-4 safe-area-top safe-area-bottom animate-fade-in">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.12),transparent_42%)]" />
                    <div className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,var(--skin-accent-color)_0%,transparent_72%)] opacity-10 blur-[110px]" />
                </div>

                <div className="relative w-full max-w-[23.5rem]">
                    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,14,10,0.98),rgba(7,7,9,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.58)] backdrop-blur-xl">
                        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.16),transparent_72%)] pointer-events-none" />
                        <div className="absolute inset-x-6 top-[78px] h-px bg-gradient-to-r from-transparent via-white/18 to-transparent pointer-events-none" />

                        <div className="relative max-h-[calc(100vh-1.5rem)] overflow-y-auto custom-scrollbar px-4 py-5 sm:px-5 sm:py-6">
                            <div className="flex items-start gap-3">
                                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--skin-accent-color)]/25 bg-[var(--skin-accent-color)]/10 shadow-[0_0_20px_rgba(212,175,55,0.14)]">
                                    <img src="/logo-diamond.png" alt="GLYPH" className="h-7 w-7 drop-shadow-[0_0_12px_var(--skin-accent-color)]" />
                                    <div className="absolute inset-0 animate-spin-slow opacity-70">
                                        <img src="/logo-core.png" alt="Core" className="h-full w-full" />
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-[var(--skin-accent-color)]">
                                        Interface inicial
                                    </div>
                                    <h2 className="luxe-title-ornate mt-3 text-[1.1rem] font-black uppercase tracking-[0.14em] text-white sm:text-[1.2rem]">
                                        Escolha seu modo
                                    </h2>
                                    <p className="mt-2 text-[12px] leading-relaxed text-white/62">
                                        Voce pode trocar isso depois em Configuracoes.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                <button
                                    type="button"
                                    onClick={() => handleSelect('GAME')}
                                    className={`group relative flex w-full items-start gap-3 overflow-hidden rounded-[22px] border p-4 text-left transition-all duration-300 ${selectedMode === 'GAME'
                                        ? 'border-[var(--skin-accent-color)]/55 bg-[linear-gradient(180deg,rgba(212,175,55,0.14),rgba(21,16,9,0.94))] shadow-[0_18px_34px_rgba(0,0,0,0.28)]'
                                        : 'border-white/10 bg-white/[0.04] hover:border-white/18 hover:bg-white/[0.06]'
                                        }`}
                                >
                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 ${selectedMode === 'GAME'
                                        ? 'border-[var(--skin-accent-color)]/45 bg-[var(--skin-accent-color)] text-black shadow-[0_0_16px_rgba(212,175,55,0.22)]'
                                        : 'border-white/10 bg-black/35 text-white/55'
                                        }`}>
                                        <AssetIcon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <div>
                                            <h3 className={`text-[13px] font-black uppercase tracking-[0.18em] ${selectedMode === 'GAME' ? 'text-[var(--skin-accent-color)]' : 'text-white'}`}>
                                                Game
                                            </h3>
                                            <p className="mt-1 text-[12px] leading-relaxed text-white/64">
                                                Camada completa de RPG, inventario, progresso e soberania expandida.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['XP e economia', 'Ativos e arenas', 'Loop completo'].map((feat) => (
                                                <span key={feat} className="rounded-full border border-white/10 bg-black/24 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/58">
                                                    {feat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleSelect('BASIC')}
                                    className={`group relative flex w-full items-start gap-3 overflow-hidden rounded-[22px] border p-4 text-left transition-all duration-300 ${selectedMode === 'BASIC'
                                        ? 'border-sky-300/40 bg-[linear-gradient(180deg,rgba(56,189,248,0.14),rgba(9,16,26,0.94))] shadow-[0_18px_34px_rgba(0,0,0,0.28)]'
                                        : 'border-white/10 bg-white/[0.04] hover:border-white/18 hover:bg-white/[0.06]'
                                        }`}
                                >
                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 ${selectedMode === 'BASIC'
                                        ? 'border-sky-300/35 bg-sky-300 text-slate-950 shadow-[0_0_16px_rgba(56,189,248,0.24)]'
                                        : 'border-white/10 bg-black/35 text-white/55'
                                        }`}>
                                        <ConfigIcon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <div>
                                            <h3 className={`text-[13px] font-black uppercase tracking-[0.18em] ${selectedMode === 'BASIC' ? 'text-sky-200' : 'text-white'}`}>
                                                Basic
                                            </h3>
                                            <p className="mt-1 text-[12px] leading-relaxed text-white/64">
                                                Interface mais limpa, mais leve e focada em executar sem excesso visual.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['Visual limpo', 'Planner direto', 'Menos camadas'].map((feat) => (
                                                <span key={feat} className="rounded-full border border-white/10 bg-black/24 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/58">
                                                    {feat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <div className="mt-5">
                                <button
                                    type="button"
                                    disabled={!selectedMode || isConfirming}
                                    onClick={handleConfirm}
                                    className={`w-full rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.24em] transition-all ${!selectedMode || isConfirming
                                        ? 'cursor-not-allowed border border-white/6 bg-white/[0.05] text-white/28'
                                        : selectedMode === 'BASIC'
                                            ? 'border border-sky-300/30 bg-[linear-gradient(180deg,rgba(125,211,252,0.18),rgba(11,20,32,0.96))] text-sky-50 shadow-[0_18px_34px_rgba(0,0,0,0.32)] hover:scale-[1.01] active:scale-[0.99]'
                                            : 'luxe-skin-button shadow-[0_18px_34px_rgba(0,0,0,0.32)] hover:scale-[1.01] active:scale-[0.99]'
                                        }`}
                                >
                                    {isConfirming ? 'Vinculando...' : 'OK'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
