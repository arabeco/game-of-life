import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { MASTERY_LEVEL_DESCRIPTIONS } from '../constants';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';
import { MASTERY_TOTAL_MAX_LEVEL, PONTOS_POR_DEGRAU, getMasteryIndexFromAssets } from '../constants/lifeAreas';
import { GlassCard } from '../components/GlassCard';
import { ShareIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/Icons';
import { shareElementWithFeedback } from '../components/Share';
import './mastery-quiz.css';

import { MasteryWheel } from '../components/MasteryWheel';

const AssetPentagon = React.lazy(() => import('../components/AssetPentagon').then((m) => ({ default: m.AssetPentagon })));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const MasteryView: React.FC<{ onClose?: () => void; embedded?: boolean }> = ({ onClose, embedded = false }) => {
    const { assets, updateAllAssetLevels, showToast, userProfile, oraclePreferences } = useGame();
    const [tempLevels, setTempLevels] = useState<Record<string, number>>({});
    /**
     * Previa fracionaria enquanto o dedo arrasta a roda.
     *
     * A roda avisa o degrau que esta passando ANTES de soltar, e e isso que faz o
     * pentagono responder ao movimento. Nunca vira resposta: quem grava e
     * `onSelecionar`, no snap.
     */
    const [preview, setPreview] = useState<{ assetId: string; level: number } | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
    const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
    const [isAssessmentActive, setIsAssessmentActive] = useState(false);

    const buildDraftFromAssets = () => {
        const initialLevels = assets.reduce((acc, asset) => ({ ...acc, [asset.id]: asset.level ?? 0 }), {});
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
        const maxLevel = Math.max(1, ((MASTERY_LEVEL_DESCRIPTIONS[currentAsset.id] || []).length || 11) - 1);
        const currentLevel = tempLevels[currentAsset.id] ?? 0;
        if (currentLevel > maxLevel) {
            setTempLevels((prev) => ({ ...prev, [currentAsset.id]: maxLevel }));
        }
    }, [currentAsset, tempLevels]);

    const masteryIndex = useMemo(
        () => getMasteryIndexFromAssets(
            Object.entries(tempLevels).map(([id, level]) => ({ id, level: Number(level) })),
        ),
        [tempLevels],
    );

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

    if (!currentAsset) return null;

    const accentColor = (ASSET_ACCENT_COLORS as Record<string, string>)[currentAsset.id] || '#C9A84C';
    // A lista tem ONZE frases, do degrau 0 ao 10 — o teto e o ultimo indice, e
    // nao a quantidade. Enquanto era `length`, o quiz oferecia um degrau 11 que
    // nao existe em lugar nenhum.
    const sliderMax = Math.max(1, (currentDescriptions.length || 11) - 1);
    const currentLevel = clamp(tempLevels[currentAsset.id] ?? 0, 0, sliderMax);

    const handleLevelChange = (nextLevel: number) => {
        setTempLevels((prev) => ({ ...prev, [currentAsset.id]: clamp(nextLevel, 0, sliderMax) }));
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
            setIsAssessmentActive(false);
            showToast('Avaliação salva.', 'success');
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
        if (isMasteryLocked) {
            showToast(`Nova avaliação disponível em ${remainingHours}h.`, 'info');
            return;
        }
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
            className={`mastery-quiz-backdrop ${embedded ? 'mastery-quiz-embedded' : ''}`}
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
                                text: 'Minha maestria no Glyph.',
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
                    <div className="mastery-quiz-panel-inner mastery-quiz-inline">
                        <div className="mastery-quiz-stable-summary">
                                <button type="button" className="mastery-quiz-pentagon-frame mastery-quiz-pentagon-trigger" onClick={() => { if (!isAssessmentActive) startAssessment(); }} aria-label="Abrir perguntas da avaliação" aria-expanded={isAssessmentActive}>
                                    <div className="mastery-quiz-pentagon-square">
                                        <Suspense fallback={<div className="h-full w-full rounded-[1.4rem] bg-white/5" />}>
                                            <AssetPentagon assets={assets} tempLevels={isAssessmentActive && preview?.assetId === currentAsset.id ? { ...tempLevels, [currentAsset.id]: preview.level } : tempLevels} centralStyle="plain" destacarPontas={isAssessmentActive} activeAreaId={isAssessmentActive ? currentAsset.id : undefined} size="100%" />
                                        </Suspense>
                                    </div>
                                </button>

                        </div>
                        <div className="mastery-quiz-lower">
                            {!isAssessmentActive ? <>
                                <p className="mastery-quiz-start-hint">{isMasteryLocked ? `Nova avaliação em ${remainingHours}h` : 'Toque no pentágono para avaliar suas cinco áreas.'}</p>
                            </> : <>
                                <div className="mastery-quiz-meta">
                                    <div>
                                        <h1 className="mastery-quiz-asset-name">{currentAsset.name}</h1>
                                    </div>
                                    <span className="mastery-quiz-step">{currentAssetIndex + 1}/{filteredAssets.length}</span>
                                </div>
                                {/*
                                  * A RODA VOLTA. O slider cru era uma regressao, nao uma decisao.
                                  *
                                  * O commit 94107c7 trocou <MasteryWheel> por um <input
                                  * type="range"> e um paragrafo solto: a frase perdeu o degrau ao
                                  * lado dela, o pentagono parou de responder ao arraste e o
                                  * componente ficou orfao no repositorio, vivo so na bancada.
                                  *
                                  * A roda mostra a frase escolhida inteira, as vizinhas de leve e
                                  * o resto ao fundo, com snap degrau a degrau. A escala e a MESMA:
                                  * `niveis={sliderMax}` continua sendo 10, e o degrau 0 — o do
                                  * abandono — continua sendo o primeiro item da lista.
                                  */}
                                <MasteryWheel
                                    key={currentAsset.id}
                                    compacto
                                    onVisualizar={level => setPreview({ assetId: currentAsset.id, level })}
                                    niveis={sliderMax}
                                    selecionado={currentLevel}
                                    frases={currentDescriptions}
                                    onSelecionar={handleLevelChange}
                                    hapticos={oraclePreferences?.hapticsEnabled !== false}
                                />

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
                            </>}
                        </div>
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
                            <button onClick={handleSave} className="luxe-skin-button luxe-bico w-full py-3">
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
                            <button onClick={discardAssessmentDraft} className="luxe-skin-button rounded-2xl w-full py-3">
                                OK
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
