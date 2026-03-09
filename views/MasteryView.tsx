

import React, { Suspense, useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { Asset } from '../types';
import { MASTERY_LEVEL_DESCRIPTIONS } from '../constants';
import { GlassCard } from '../components/GlassCard';
import { Portal } from '../components/Portal';
import { ShareIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '../components/Icons';
import { handleShare } from '../components/Share';
const AssetDecagon = React.lazy(() => import('../components/AssetDecagon').then((m) => ({ default: m.AssetDecagon })));

type MasteryMode = 'LEGADO' | 'SOBERANO';

export const MasteryView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { assets, userProfile, updateAllAssetLevels } = useGame();
    const [mode, setMode] = useState<MasteryMode>('LEGADO');
    const [tempLevels, setTempLevels] = useState<Record<string, number>>({});
    const [tempPhrases, setTempPhrases] = useState<Record<string, string[]>>({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Novo estado para o questionário passo-a-passo
    const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
    const filteredAssets = assets.filter(a => a.id !== 'geral');
    const currentAsset = filteredAssets[currentAssetIndex];

    useEffect(() => {
        if (Object.keys(tempLevels).length > 0) return;
        if (assets.length === 0) return;

        const initialLevels = assets.reduce((acc, asset) => ({ ...acc, [asset.id]: asset.level || 1 }), {});
        const initialPhrases = assets.reduce((acc, asset) => {
            const fullPhrases = MASTERY_LEVEL_DESCRIPTIONS[asset.id] || [];
            return { ...acc, [asset.id]: fullPhrases };
        }, {});

        setTempLevels(initialLevels);
        setTempPhrases(initialPhrases);
    }, [assets]);

    const handleLevelChange = (assetId: string, level: number) => {
        setTempLevels(prev => ({ ...prev, [assetId]: level }));
    };

    const handleSave = () => {
        const levelsToSave = { ...tempLevels };
        Object.keys(levelsToSave).forEach(assetId => {
            if (levelsToSave[assetId] === 0) {
                levelsToSave[assetId] = 1;
            }
        });

        const success = updateAllAssetLevels(levelsToSave, mode === 'SOBERANO' ? tempPhrases : undefined);
        if (success) {
            setShowConfirmModal(false);
            if (onClose) onClose();
        }
    };

    const totalLevel = Object.entries(tempLevels)
        .filter(([assetId]) => assetId !== 'geral')
        .reduce((sum: number, [, level]: [string, number]) => sum + (level === 0 ? 1 : level), 0);

    const nextStep = () => {
        if (currentAssetIndex < filteredAssets.length - 1) {
            setCurrentAssetIndex(prev => prev + 1);
        } else {
            setShowConfirmModal(true);
        }
    };

    const prevStep = () => {
        if (currentAssetIndex > 0) {
            setCurrentAssetIndex(prev => prev - 1);
        }
    };

    if (!currentAsset) return null;

    const currentLevel = tempLevels[currentAsset.id] || 1;
    const descriptions = MASTERY_LEVEL_DESCRIPTIONS[currentAsset.id] || [];

    return (
        <div className="flex flex-col h-full bg-black relative" id="mastery-capture-area">
            {/* Header Fixo com Decágono e Progressão */}
            <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-md pb-1 pt-4 px-4 border-b border-white/5 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-2">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeftIcon className="w-5 h-5 text-gray-400" />
                    </button>
                    <div className="flex items-center bg-white/5 rounded-full p-0.5">
                        <button onClick={() => setMode('LEGADO')} className={`px-3 py-1 text-[8px] font-black rounded-full transition-all ${mode === 'LEGADO' ? 'bg-[var(--skin-accent-color)] text-black' : 'text-gray-500'}`}>LEGADO</button>
                        <button onClick={() => setMode('SOBERANO')} className={`px-3 py-1 text-[8px] font-black rounded-full transition-all ${mode === 'SOBERANO' ? 'bg-[var(--skin-accent-color)] text-black' : 'text-gray-500'}`}>SOBERANO</button>
                    </div>
                    <div className="w-9" /> {/* Spacer */}
                </div>

                {/* Decágono Centralizado e Visível */}
                <div className="mb-2 w-full flex justify-center h-[160px] relative overflow-visible">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px]">
                        <Suspense fallback={<div className="w-full h-full" />}>
                            <AssetDecagon
                                assets={assets}
                                tempLevels={tempLevels}
                                size="100%"
                            />
                        </Suspense>
                    </div>
                </div>

                <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-1">{currentAsset.name}</h2>

                <div className="w-full max-w-[200px] flex flex-col gap-1 mb-2">
                    <div className="flex justify-between items-center text-[8px] font-black text-gray-500 uppercase tracking-tighter">
                        <span>{currentAssetIndex + 1} de {filteredAssets.length}</span>
                        <span className="text-[var(--skin-accent-color)]">{Math.round(((currentAssetIndex + 1) / filteredAssets.length) * 100)}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--skin-accent-color)] transition-all duration-500"
                            style={{ width: `${((currentAssetIndex + 1) / filteredAssets.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Área da Pergunta Atual - Super Compacta para caber as 10 */}
            <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1.5 custom-scrollbar">
                {descriptions.map((desc, index) => {
                    const level = index + 1;
                    const isSelected = currentLevel === level;

                    return (
                        <button
                            key={`${currentAsset.id}-${level}`}
                            onClick={() => handleLevelChange(currentAsset.id, level)}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 ${isSelected
                                    ? 'bg-[var(--skin-accent-color)]/10 border-[var(--skin-accent-color)] shadow-[0_0_10px_rgba(var(--skin-accent-color-rgb),0.1)]'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                }`}
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black text-[10px] border ${isSelected
                                    ? 'bg-[var(--skin-accent-color)] text-black border-transparent'
                                    : 'bg-black/40 text-gray-600 border-white/5'
                                }`}>
                                {level}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[11px] leading-tight line-clamp-2 ${isSelected ? 'text-white font-bold' : 'text-gray-400'}`}>
                                    {desc}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Navegação Inferior Fixo */}
            <div className="sticky bottom-0 bg-black/90 backdrop-blur-md pt-2 pb-6 px-4 border-t border-white/5 z-30 flex gap-3">
                <button
                    onClick={prevStep}
                    disabled={currentAssetIndex === 0}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-20 transition-all active:scale-90"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>

                <button
                    onClick={nextStep}
                    className="flex-1 py-3 rounded-xl luxe-skin-button font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                >
                    {currentAssetIndex === filteredAssets.length - 1 ? 'FINALIZAR' : 'PRÓXIMO'}
                    <ChevronRightIcon className="w-4 h-4" />
                </button>

                <button
                    onClick={() => handleShare('mastery-capture-area', 'Minha Maestria - Life OS')}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 text-white transition-all active:scale-90"
                    data-html2canvas-ignore
                >
                    <ShareIcon className="w-5 h-5" />
                </button>
            </div>

            {showConfirmModal && (
                <Portal>
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10100] flex items-center justify-center animate-fade-in" onClick={() => setShowConfirmModal(false)}>
                        <GlassCard variant="accent" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                            <h2 className="text-lg font-bold uppercase tracking-wider text-center">Confirmar Atualização</h2>
                            <p className="text-center">Seu nível geral será atualizado para: <span className="font-bold text-2xl" style={{ color: 'var(--skin-accent-color)' }}>{totalLevel}</span></p>
                            <p className="text-center text-sm text-gray-400">
                                {mode === 'LEGADO' ? 'Deseja atualizar seu nível? Você só poderá fazer isso novamente em 72 horas.' : 'Deseja salvar as alterações? Você pode editar as frases a qualquer momento, mas só poderá editar seu nível novamente em 72 horas.'}
                            </p>
                            <div className="flex space-x-2">
                                <button onClick={() => setShowConfirmModal(false)} className="w-full py-2 rounded-xl luxe-button-secondary">
                                    CANCELAR
                                </button>
                                <button onClick={handleSave} className="w-full py-2 rounded-xl luxe-skin-button">
                                    CONFIRMAR
                                </button>
                            </div>
                        </GlassCard>
                    </div>
                </Portal>
            )}
        </div>
    );
};
