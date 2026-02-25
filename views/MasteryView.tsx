

import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { Asset } from '../types';
import { MASTERY_LEVEL_DESCRIPTIONS } from '../constants';
import { GlassCard } from '../components/GlassCard';
import { Portal } from '../components/Portal';

type MasteryMode = 'LEGADO' | 'SOBERANO';

const MasterySlider: React.FC<{
    asset: Asset;
    mode: MasteryMode;
    tempLevel: number;
    tempPhrase: string;
    onLevelChange: (assetId: string, level: number) => void;
    onPhraseChange: (assetId: string, phrase: string) => void;
}> = ({ asset, mode, tempLevel, tempPhrase, onLevelChange, onPhraseChange }) => {
    
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        onLevelChange(asset.id, newValue);
    };

    return (
        <GlassCard variant="neutral" className="space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider">{asset.name}</h3>
                <span className="text-xl font-black" style={{ color: 'var(--skin-accent-color)'}}>{tempLevel}</span>
            </div>
             <input
                type="range"
                min={1}
                max={10}
                value={tempLevel}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg"
                style={{ accentColor: 'var(--skin-accent-color)'}}
            />
            {mode === 'SOBERANO' ? (
                <textarea
                    value={tempPhrase}
                    onChange={(e) => onPhraseChange(asset.id, e.target.value)}
                    rows={2}
                    className="w-full text-sm text-center bg-black/20 p-2 rounded-lg border border-transparent focus:outline-none focus:border-white/20"
                />
            ) : (
                 <p className="text-sm text-center text-gray-400 italic h-10">"{tempPhrase}"</p>
            )}
        </GlassCard>
    );
};


export const MasteryView: React.FC = () => {
    const { assets, userProfile, updateAllAssetLevels } = useGame();
    const [mode, setMode] = useState<MasteryMode>('LEGADO');
    const [tempLevels, setTempLevels] = useState<Record<string, number>>({});
    const [tempPhrases, setTempPhrases] = useState<Record<string, string[]>>({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        // Initialize temporary state from global context
        // Only initialize if we haven't set them up yet, to prevent slider jumping during background updates
        if (Object.keys(tempLevels).length > 0) return;
        
        if (assets.length === 0) return;

        const initialLevels = assets.reduce((acc, asset) => ({ ...acc, [asset.id]: asset.level }), {});
        const initialPhrases = assets.reduce((acc, asset) => {
            const fullPhrases = MASTERY_LEVEL_DESCRIPTIONS[asset.id];
            return { ...acc, [asset.id]: fullPhrases };
        }, {});

        setTempLevels(initialLevels);
        setTempPhrases(initialPhrases);
    }, [assets]);

    const handleLevelChange = (assetId: string, level: number) => {
        setTempLevels(prev => ({ ...prev, [assetId]: level }));
    };

    const handlePhraseChange = (assetId: string, phrase: string, level: number) => {
       setTempPhrases(prev => {
            const newPhrases = [...(prev[assetId] || [])];
            newPhrases[level - 1] = phrase;
            return { ...prev, [assetId]: newPhrases };
       });
    };

    const handleSave = () => {
        const levelsToSave = { ...tempLevels };
        // Ensure no level is saved as 0
        Object.keys(levelsToSave).forEach(assetId => {
            if (levelsToSave[assetId] === 0) {
                levelsToSave[assetId] = 1;
            }
        });

        const success = updateAllAssetLevels(levelsToSave, mode === 'SOBERANO' ? tempPhrases : undefined);
        if (success) {
            setShowConfirmModal(false);
        }
    };
    
    // FIX: Changed level calculation from average to sum to create a 0-100 scale.
    const totalLevel = Object.entries(tempLevels).filter(([assetId]) => assetId !== 'geral').reduce((sum: number, [, level]: [string, number]) => sum + (level === 0 ? 1 : level), 0);


    return (
        <div className="space-y-4">
            <div className="flex items-center justify-center bg-black/20 rounded-full p-1">
                <button onClick={() => setMode('LEGADO')} className={`w-1/2 py-2 text-sm font-bold rounded-full transition-colors ${mode === 'LEGADO' ? 'bg-white/10' : 'text-gray-500'}`}>LEGADO</button>
                <button onClick={() => setMode('SOBERANO')} className={`w-1/2 py-2 text-sm font-bold rounded-full transition-colors ${mode === 'SOBERANO' ? 'bg-white/10' : 'text-gray-500'}`}>SOBERANO</button>
            </div>

            <div className="space-y-4">
                {assets.filter(a => a.id !== 'geral').map(asset => {
                    const currentLevel = tempLevels[asset.id] === 0 ? 1 : (tempLevels[asset.id] || 1);
                    const phrase = tempPhrases[asset.id]?.[currentLevel - 1]?.replace(`Nível ${currentLevel}: `, '') || '';
                    return (
                        <MasterySlider
                            key={asset.id}
                            asset={asset}
                            mode={mode}
                            tempLevel={currentLevel}
                            tempPhrase={phrase}
                            onLevelChange={handleLevelChange}
                            onPhraseChange={(assetId, phrase) => handlePhraseChange(assetId, phrase, currentLevel)}
                        />
                    );
                })}
            </div>

            <button onClick={() => setShowConfirmModal(true)} className="w-full py-3 rounded-xl luxe-skin-button transition-transform hover:scale-105">
                SALVAR NÍVEIS
            </button>
            
            {showConfirmModal && (
                <Portal>
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={() => setShowConfirmModal(false)}>
                        <GlassCard variant="accent" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                            <h2 className="text-lg font-bold uppercase tracking-wider text-center">Confirmar Atualização</h2>
                            <p className="text-center">Seu nível geral será atualizado para: <span className="font-bold text-2xl" style={{color: 'var(--skin-accent-color)'}}>{totalLevel}</span></p>
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
