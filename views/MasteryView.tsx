import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { MASTERY_LEVEL_DESCRIPTIONS } from '../constants';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';
import { MASTERY_TOTAL_MAX_LEVEL, toMasteryIndex } from '../constants/lifeAreas';
import { GlassCard } from '../components/GlassCard';
import { ShareIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/Icons';
import { shareElementWithFeedback } from '../components/Share';
import './mastery-quiz.css';

const AssetPentagon = React.lazy(() => import('../components/AssetPentagon').then((m) => ({ default: m.AssetPentagon })));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const MasteryView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { assets, updateAllAssetLevels, showToast, userProfile } = useGame();
    const [tempLevels, setTempLevels] = useState<Record<string, number>>({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
    const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
    const [isAssessmentActive, setIsAssessmentActive] = useState(false);

    const buildDraftFromAssets = () => {
        const initialLevels = assets.reduce((acc, asset) => ({ ...acc, [asset.id]: asset.level || 1 }), {});
        return { initialLevels };
    };

    const filteredAssets = useMemo(() => assets.filter((asset) => asset.id !== 'geral'), [assets]);
    const currentAsset = filteredAssets[currentAssetIndex];

    useEffect(() => {
        if (Object.keys(tempLevels).length > 0) return;
        if (assets.length === 0) return;

        const { initialLevels } = buildDraftFromAssets();

        setTempLevels(initialLevels);
    }, [assets, tempLevels]);

    useEffect(() => {
        if (!currentAsset) return;
        const maxLevel = Math.max(1, (MASTERY_LEVEL_DESCRIPTIONS[currentAsset.id] || []).length || 10);
        const currentLevel = tempLevels[currentAsset.id] || 1;
        if (currentLevel > maxLevel) {
            setTempLevels((prev) => ({ ...prev, [currentAsset.id]: maxLevel }));
        }
    }, [currentAsset, tempLevels]);

    const totalLevel = useMemo(
        () =>
            Object.entries(tempLevels)
                .filter(([assetId]) => assetId !== 'geral')
                .reduce((sum, [, level]) => sum + (level === 0 ? 1 : Number(level || 1)), 0),
        [tempLevels],
    );
    const masteryIndex = toMasteryIndex(totalLevel);

    const currentDescriptions = useMemo(
        () => (currentAsset ? (MASTERY_LEVEL_DESCRIPTIONS[currentAsset.id] || []) : []),
        [currentAsset],
    );

    const lastUpdate = userProfile.lastLevelUpdate || 0;
    const threeDays = 72 * 60 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;
    const tutorialCompletedAt = userProfile.tutorialCompletedAt || 0;
    const isTutorialActive =
        typeof window !== 'undefined' &&
        (window.location.search.includes('tutorial=true') || (window as any).__GOL_TUTORIAL_ACTIVE__);
    const isGracePeriod = Date.now() - tutorialCompletedAt < oneHour && tutorialCompletedAt > 0;
    const bypassMasteryLock =
        userProfile.role === 'admin' ||
        userProfile.role === 'gm' ||
        userProfile.role === 'admin_gm' ||
        isTutorialActive ||
        isGracePeriod;
    const isMasteryLocked = !bypassMasteryLock && lastUpdate > 0 && Date.now() - lastUpdate < threeDays;
    const remainingHours = isMasteryLocked
        ? Math.ceil((threeDays - (Date.now() - lastUpdate)) / (60 * 60 * 1000))
        : 0;

    const lastAssessmentLabel = userProfile.lastLevelUpdate
        ? new Date(userProfile.lastLevelUpdate).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          })
        : null;

    const overviewNote = !lastUpdate
        ? 'Faça sua primeira avaliação. Depois disso, você poderá recalibrar sua maestria a cada 72 horas.'
        : isMasteryLocked
          ? `A cada 72 horas, você pode mudar sua maestria. Próxima liberação em ${remainingHours}h.`
          : 'A cada 72 horas, você pode mudar sua maestria.';

    if (!currentAsset) return null;

    const accentColor = (ASSET_ACCENT_COLORS as Record<string, string>)[currentAsset.id] || '#C9A84C';
    const sliderMax = Math.max(1, currentDescriptions.length || 10);
    const currentLevel = clamp(tempLevels[currentAsset.id] || 1, 1, sliderMax);
    const currentProgress = filteredAssets.length > 0 ? Math.round(((currentAssetIndex + 1) / filteredAssets.length) * 100) : 0;

    const handleLevelChange = (nextLevel: number) => {
        setTempLevels((prev) => ({ ...prev, [currentAsset.id]: clamp(nextLevel, 1, sliderMax) }));
    };

    const handleSave = () => {
        if (Object.keys(tempLevels).length === 0) {
            showToast('Ajuste pelo menos um nível antes de salvar.', 'warning');
            return;
        }

        const levelsToSave = { ...tempLevels };
        Object.keys(levelsToSave).forEach((assetId) => {
            if (levelsToSave[assetId] === 0) levelsToSave[assetId] = 1;
        });

        const success = updateAllAssetLevels(levelsToSave);
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

    const startAssessment = () => {
        setCurrentAssetIndex(0);
        setIsAssessmentActive(true);
    };

    const discardAssessmentDraft = () => {
        const { initialLevels } = buildDraftFromAssets();
        setTempLevels(initialLevels);
        setCurrentAssetIndex(0);
        setIsAssessmentActive(false);
        setShowExitConfirmModal(false);
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
                        onClick={() => {
                            if (isAssessmentActive) {
                                setShowExitConfirmModal(true);
                                return;
                            }
                            onClose?.();
                        }}
                        className="mastery-quiz-icon-button"
                        aria-label={isAssessmentActive ? 'Voltar da avaliação' : 'Fechar quiz de maestria'}
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>

                    <div className="mastery-quiz-mode-switch">
                        <span className="mastery-quiz-mode-pill is-active">Avaliação</span>
                    </div>

                    <button
                        onClick={() => {
                            void shareElementWithFeedback(showToast, 'mastery-capture-area', {
                                title: 'Minha Maestria - Life OS',
                                preparingMessage: 'Preparando compartilhamento da maestria...',
                                sharedMessage: 'Maestria compartilhada.',
                                cancelledMessage: 'Compartilhamento cancelado.',
                                errorMessage: 'Não foi possível preparar a maestria para compartilhar.',
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
                        {!isAssessmentActive ? (
                            <div className="mastery-quiz-overview">
                                <div className="mastery-quiz-pentagon-frame">
                                    <div className="mastery-quiz-pentagon-square">
                                        <Suspense fallback={<div className="h-full w-full rounded-[1.4rem] bg-white/5" />}>
                                            <AssetPentagon assets={assets} tempLevels={tempLevels} size="100%" />
                                        </Suspense>
                                    </div>
                                </div>

                                <div className="mastery-quiz-overview-copy">
                                    <div className="mastery-quiz-kicker">Maestria atual</div>
                                    <h1 className="mastery-quiz-overview-title">Seu pentágono atual</h1>
                                    <p className="mastery-quiz-overview-note">{overviewNote}</p>
                                </div>

                                <div className="mastery-quiz-overview-metrics mastery-quiz-overview-metrics--compact">
                                    <div className="mastery-quiz-overview-metric">
                                        <div className="mastery-quiz-total-label">Índice Glyph</div>
                                        <div className="mastery-quiz-total-value mastery-quiz-total-value--hero">{masteryIndex}/{MASTERY_TOTAL_MAX_LEVEL}</div>
                                    </div>
                                    <div className="mastery-quiz-overview-metric">
                                        <div className="mastery-quiz-total-label">Última avaliação</div>
                                        <div className="mastery-quiz-overview-stat">{lastAssessmentLabel || 'Ainda não feita'}</div>
                                    </div>
                                </div>

                                <div className="mastery-quiz-actions mastery-quiz-actions--single">
                                    <button
                                        onClick={startAssessment}
                                        disabled={isMasteryLocked}
                                        className="luxe-skin-button mastery-quiz-nav-button disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isMasteryLocked ? `Disponível em ${remainingHours}h` : 'Iniciar avaliação'}
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="mastery-quiz-pentagon-frame">
                                    <div className="mastery-quiz-pentagon-square">
                                        <Suspense fallback={<div className="h-full w-full rounded-[1.4rem] bg-white/5" />}>
                                            <AssetPentagon assets={assets} tempLevels={tempLevels} size="100%" />
                                        </Suspense>
                                    </div>
                                </div>

                                <div className="mastery-quiz-meta">
                                    <div>
                                        <div className="mastery-quiz-kicker">Área atual</div>
                                        <h1 className="mastery-quiz-asset-name">{currentAsset.name}</h1>
                                    </div>
                                    <div className="mastery-quiz-meta-side">
                                        <div className="mastery-quiz-total-label">Índice Glyph</div>
                                        <div className="mastery-quiz-total-value">{masteryIndex}/{MASTERY_TOTAL_MAX_LEVEL}</div>
                                    </div>
                                </div>

                                <div className="mastery-quiz-progress">
                                    <div className="mastery-quiz-progress-labels">
                                        <span>
                                            {String(currentAssetIndex + 1).padStart(2, '0')} / {String(filteredAssets.length).padStart(2, '0')}
                                        </span>
                                        <span>{currentProgress}%</span>
                                    </div>
                                    <div className="mastery-quiz-progress-track">
                                        <div className="mastery-quiz-progress-fill" style={{ width: `${currentProgress}%` }} />
                                    </div>
                                </div>

                                <div className="mastery-quiz-level-options" role="radiogroup" aria-label={`Nível de ${currentAsset.name}`}>
                                    {currentDescriptions.map((description, index) => {
                                        const level = index + 1;
                                        const isSelected = currentLevel === level;
                                        return (
                                            <button
                                                key={`${currentAsset.id}-${level}`}
                                                type="button"
                                                role="radio"
                                                aria-checked={isSelected}
                                                onClick={() => handleLevelChange(level)}
                                                className={`mastery-quiz-level-option ${isSelected ? 'is-selected' : ''}`}
                                            >
                                                <span className="mastery-quiz-level-number">{level}</span>
                                                <span className="mastery-quiz-level-description">{description}</span>
                                            </button>
                                        );
                                    })}
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
                                    <button onClick={nextStep} className="luxe-skin-button mastery-quiz-nav-button">
                                        {currentAssetIndex === filteredAssets.length - 1 ? 'Finalizar' : 'Próximo'}
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showConfirmModal && (
                <div className="mastery-quiz-confirm-overlay" onClick={() => setShowConfirmModal(false)}>
                    <GlassCard variant="accent" className="mastery-quiz-confirm-card" onClick={(event) => event.stopPropagation()}>
                        <h2 className="mastery-quiz-confirm-title">Confirmar atualização</h2>
                        <p className="mastery-quiz-confirm-copy">
                            Seu Índice Glyph será atualizado para <strong>{masteryIndex}/{MASTERY_TOTAL_MAX_LEVEL}</strong>.
                        </p>
                        <p className="mastery-quiz-confirm-note">
                            Deseja atualizar sua maestria agora? Você só poderá fazer isso novamente em 72 horas.
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

            {showExitConfirmModal && (
                <div className="mastery-quiz-confirm-overlay" onClick={() => setShowExitConfirmModal(false)}>
                    <GlassCard variant="accent" className="mastery-quiz-confirm-card" onClick={(event) => event.stopPropagation()}>
                        <h2 className="mastery-quiz-confirm-title">Tem certeza?</h2>
                        <p className="mastery-quiz-confirm-copy">Sua edição em andamento será perdida.</p>
                        <p className="mastery-quiz-confirm-note">Se quiser voltar depois, você pode recomeçar a avaliação do início.</p>
                        <div className="mastery-quiz-confirm-actions mastery-quiz-confirm-actions--split">
                            <button onClick={() => setShowExitConfirmModal(false)} className="luxe-button-secondary w-full py-3 rounded-2xl">
                                Cancelar
                            </button>
                            <button onClick={discardAssessmentDraft} className="luxe-skin-button w-full py-3 rounded-2xl">
                                OK
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
