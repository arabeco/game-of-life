import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { MASTERY_LEVEL_DESCRIPTIONS } from '../constants';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';
import { GlassCard } from '../components/GlassCard';
import { ShareIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/Icons';
import { shareElementWithFeedback } from '../components/Share';
import './mastery-quiz.css';

const AssetDecagon = React.lazy(() => import('../components/AssetDecagon').then((m) => ({ default: m.AssetDecagon })));

type MasteryMode = 'LEGADO' | 'SOBERANO';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const MasteryView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { assets, updateAllAssetLevels, showToast } = useGame();
    const [mode, setMode] = useState<MasteryMode>('LEGADO');
    const [tempLevels, setTempLevels] = useState<Record<string, number>>({});
    const [tempPhrases, setTempPhrases] = useState<Record<string, string[]>>({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [currentAssetIndex, setCurrentAssetIndex] = useState(0);

    const filteredAssets = useMemo(() => assets.filter((asset) => asset.id !== 'geral'), [assets]);
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
    }, [assets, tempLevels]);

    useEffect(() => {
        if (!currentAsset) return;
        const maxLevel = Math.max(1, (MASTERY_LEVEL_DESCRIPTIONS[currentAsset.id] || []).length || 10);
        const currentLevel = tempLevels[currentAsset.id] || 1;
        if (currentLevel > maxLevel) {
            setTempLevels((prev) => ({ ...prev, [currentAsset.id]: maxLevel }));
        }
    }, [currentAsset, tempLevels]);

    const totalLevel = useMemo(() => (
        Object.entries(tempLevels)
            .filter(([assetId]) => assetId !== 'geral')
            .reduce((sum, [, level]) => sum + (level === 0 ? 1 : Number(level || 1)), 0)
    ), [tempLevels]);

    const currentDescriptions = useMemo(() => (
        currentAsset ? (MASTERY_LEVEL_DESCRIPTIONS[currentAsset.id] || []) : []
    ), [currentAsset]);

    if (!currentAsset) return null;

    const accentColor = (ASSET_ACCENT_COLORS as Record<string, string>)[currentAsset.id] || '#C9A84C';
    const sliderMax = Math.max(1, currentDescriptions.length || 10);
    const currentLevel = clamp(tempLevels[currentAsset.id] || 1, 1, sliderMax);
    const currentPhrase = currentDescriptions[currentLevel - 1] || 'Escolha como esta essa area hoje.';
    const currentProgress = filteredAssets.length > 0 ? Math.round(((currentAssetIndex + 1) / filteredAssets.length) * 100) : 0;

    const handleLevelChange = (nextLevel: number) => {
        setTempLevels((prev) => ({ ...prev, [currentAsset.id]: clamp(nextLevel, 1, sliderMax) }));
    };

    const handleSave = () => {
        if (Object.keys(tempLevels).length === 0) {
            showToast('Ajuste pelo menos um nivel antes de salvar.', 'warning');
            return;
        }

        const levelsToSave = { ...tempLevels };
        Object.keys(levelsToSave).forEach((assetId) => {
            if (levelsToSave[assetId] === 0) levelsToSave[assetId] = 1;
        });

        const success = updateAllAssetLevels(levelsToSave, mode === 'SOBERANO' ? tempPhrases : undefined);
        if (success) {
            setShowConfirmModal(false);
            onClose?.();
        }
    };

    const nextStep = () => {
        if (currentAssetIndex < filteredAssets.length - 1) {
            setCurrentAssetIndex((prev) => prev + 1);
            return;
        }
        setShowConfirmModal(true);
    };

    const prevStep = () => {
        if (currentAssetIndex > 0) {
            setCurrentAssetIndex((prev) => prev - 1);
        }
    };

    return (
        <div
            id="mastery-capture-area"
            className="mastery-quiz-backdrop"
            style={{
                ['--mastery-accent' as string]: accentColor,
                ['--mastery-accent-soft' as string]: `${accentColor}66`,
            }}
        >
            <div className="mastery-quiz-shell">
                <div className="mastery-quiz-topbar">
                    <button
                        onClick={onClose}
                        className="mastery-quiz-icon-button"
                        aria-label="Fechar quiz de maestria"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>

                    <div className="mastery-quiz-mode-switch">
                        <button
                            onClick={() => setMode('LEGADO')}
                            className={`mastery-quiz-mode-pill ${mode === 'LEGADO' ? 'is-active' : ''}`}
                        >
                            Legado
                        </button>
                        <button
                            onClick={() => setMode('SOBERANO')}
                            className={`mastery-quiz-mode-pill ${mode === 'SOBERANO' ? 'is-active' : ''}`}
                        >
                            Soberano
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            void shareElementWithFeedback(showToast, 'mastery-capture-area', {
                                title: 'Minha Maestria - Life OS',
                                preparingMessage: 'Preparando compartilhamento da maestria...',
                                sharedMessage: 'Maestria compartilhada.',
                                cancelledMessage: 'Compartilhamento cancelado.',
                                errorMessage: 'Nao foi possivel preparar a maestria para compartilhar.',
                            });
                        }}
                        className="mastery-quiz-icon-button"
                        data-html2canvas-ignore
                        aria-label="Compartilhar maestria"
                    >
                        <ShareIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="mastery-quiz-panel">
                    <div className="mastery-quiz-panel-inner">
                        <div className="mastery-quiz-decagon-frame">
                            <div className="mastery-quiz-decagon-square">
                                <Suspense fallback={<div className="h-full w-full rounded-[1.4rem] bg-white/5" />}>
                                    <AssetDecagon assets={assets} tempLevels={tempLevels} size="100%" />
                                </Suspense>
                            </div>
                        </div>

                        <div className="mastery-quiz-meta">
                            <div>
                                <div className="mastery-quiz-kicker">Area atual</div>
                                <h1 className="mastery-quiz-asset-name">{currentAsset.name}</h1>
                            </div>
                            <div className="mastery-quiz-meta-side">
                                <div className="mastery-quiz-total-label">Nivel total</div>
                                <div className="mastery-quiz-total-value">{totalLevel}</div>
                            </div>
                        </div>

                        <div className="mastery-quiz-progress">
                            <div className="mastery-quiz-progress-labels">
                                <span>{String(currentAssetIndex + 1).padStart(2, '0')} / {String(filteredAssets.length).padStart(2, '0')}</span>
                                <span>{currentProgress}%</span>
                            </div>
                            <div className="mastery-quiz-progress-track">
                                <div className="mastery-quiz-progress-fill" style={{ width: `${currentProgress}%` }} />
                            </div>
                        </div>

                        <div className="mastery-quiz-phrase-shell">
                            <div className="mastery-quiz-level-chip">Nivel {currentLevel}</div>
                            <div className="mastery-quiz-phrase">
                                {currentPhrase}
                            </div>
                        </div>

                        <div className="mastery-quiz-slider-shell">
                            <div className="mastery-quiz-slider-label-row">
                                <span>Baixo</span>
                                <span>Ajuste pelo deslize</span>
                                <span>Alto</span>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={sliderMax}
                                value={currentLevel}
                                onChange={(event) => handleLevelChange(parseInt(event.target.value, 10))}
                                className="mastery-quiz-range"
                            />
                            <div className="mastery-quiz-slider-scale">
                                {Array.from({ length: sliderMax }).map((_, index) => (
                                    <span key={`${currentAsset.id}-${index + 1}`} className={currentLevel === index + 1 ? 'is-active' : ''}>
                                        {index + 1}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mastery-quiz-actions">
                            <button
                                onClick={prevStep}
                                disabled={currentAssetIndex === 0}
                                className="luxe-skin-button mastery-quiz-nav-button disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeftIcon className="w-4 h-4" />
                                Anterior
                            </button>
                            <button
                                onClick={nextStep}
                                className="luxe-skin-button mastery-quiz-nav-button"
                            >
                                {currentAssetIndex === filteredAssets.length - 1 ? 'Finalizar' : 'Proximo'}
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showConfirmModal && (
                <div className="mastery-quiz-confirm-overlay" onClick={() => setShowConfirmModal(false)}>
                    <GlassCard variant="accent" className="mastery-quiz-confirm-card" onClick={(event) => event.stopPropagation()}>
                        <h2 className="mastery-quiz-confirm-title">Confirmar atualizacao</h2>
                        <p className="mastery-quiz-confirm-copy">
                            Seu nivel geral sera atualizado para <strong>{totalLevel}</strong>.
                        </p>
                        <p className="mastery-quiz-confirm-note">
                            {mode === 'LEGADO'
                                ? 'Deseja atualizar seu nivel agora? Voce so podera fazer isso novamente em 72 horas.'
                                : 'Deseja salvar as alteracoes? As frases podem mudar depois, mas o nivel geral so pode ser editado novamente em 72 horas.'}
                        </p>
                        <div className="mastery-quiz-confirm-actions">
                            <button onClick={() => setShowConfirmModal(false)} className="luxe-button-secondary w-full py-3 rounded-2xl">
                                Cancelar
                            </button>
                            <button onClick={handleSave} className="luxe-skin-button w-full py-3 rounded-2xl">
                                Confirmar
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
