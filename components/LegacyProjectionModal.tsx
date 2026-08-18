import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReportIdentitySnapshot } from '../types';
import { Portal } from './Portal';
import { LegacyProjectionScene } from './LegacyProjectionScene';
import { buildLegacyPlaqueSummary } from './LegacyPlaqueArtifact';
import { LegacyGrandPlaque } from './LegacyGrandPlaque';
import { LegacyProjectionConfirmModal } from './LegacyProjectionConfirmModal';
import { LegacyExportKit, type LegacyExportKitHandle } from './LegacyExportKit';
import type { LegacyEraSummary } from './LegacyExportDocument';
import { getGoldMechanicPrice } from '../constants/goldCatalog';
import { DEFAULT_LEGACY_BACKDROP_SKIN_ID, getLegacyBackdropSkin, type LegacyBackdropSkinId } from '../constants/legacyBackdropSkins';
import { useLegacyPreviewLayoutConfig } from '../hooks/useLegacyPreviewLayoutConfig';
import {
    LEGACY_PREVIEW_PLAQUE_BASE_WIDTH,
    getLegacyPreviewPlaqueScale,
    setStoredLegacyPreviewLayoutConfig,
    type LegacyPreviewLayoutConfig,
} from '../utils/legacyLayoutLab';
import './legacy-ui.css';

interface LegacyProjectionModalProps {
    eras: LegacyEraSummary[];
    sovereignName: string;
    isPremium: boolean;
    showLayoutEditors?: boolean;
    fallbackIdentity?: ReportIdentitySnapshot;
    onClose: () => void;
    onToast: (message: string) => void;
    onOpenCycle?: (cycleId: string) => void;
    onOpenEra?: (era: LegacyEraSummary) => void;
    onOpenPlaque?: () => void;
    sceneGoldCost?: number | null;
    onPurchaseProjection?: () => Promise<boolean>;
    sceneButtonLabel?: string;
    confirmKickerLabel?: string;
    confirmTitle?: string;
    confirmDescription?: string;
    confirmButtonLabel?: string;
}

const LEGACY_PROJECTION_CAPTURE_ID = 'legacy-projection-capture';
const LEGACY_PREVIEW_BACKDROP_URL = '/legacy-skins/10.jpg';
const LEGACY_SCENE_GOLD_COST = getGoldMechanicPrice('legacy_projection_scene', 50);
const LEGACY_PREVIEW_STAGE_WIDTH = 390;
const LEGACY_PREVIEW_STAGE_HEIGHT = 844;
// A cena vive num palco de tamanho fixo e e reduzida para caber na tela.
// O desconto abaixo e o cromo do modal em volta do palco. Sem ele a conta usa
// a tela inteira, o palco sai maior que a caixa que o segura e o overflow-hidden
// come o rodape - era a "cena cortada". Os dois estagios tem cromo diferente.
const LEGACY_STAGE_INSET_X = 60;         // px-6 (48) + p-1.5 (12)
const LEGACY_PREVIEW_INSET_Y = 108;      // pb-24 (96) + p-1.5 (12)
const LEGACY_COMPLETION_INSET_Y = 172;   // py-20 (160) + p-1.5 (12)

const LayoutSlider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
    <label className="space-y-1">
        <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/82">{label}</span>
            <span className="text-[11px] font-bold text-white/72">{value.toFixed(step < 1 ? 2 : 0)}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="h-3 w-full cursor-pointer appearance-none rounded-full bg-white/14 accent-[var(--skin-accent-color)]"
        />
    </label>
);

export const LegacyProjectionModal: React.FC<LegacyProjectionModalProps> = ({
    eras,
    sovereignName,
    isPremium,
    showLayoutEditors = false,
    fallbackIdentity,
    onClose,
    onToast,
    onOpenCycle,
    onOpenEra,
    onOpenPlaque,
    sceneGoldCost = LEGACY_SCENE_GOLD_COST,
    onPurchaseProjection,
    sceneButtonLabel = 'Gerar a cena',
    confirmKickerLabel = 'Legado premium',
    confirmTitle = 'Gerar a cena do legado?',
    confirmDescription = 'Escolha a pele de fundo da projeção. A placa e a timeline serão abertas sobre esse ambiente.',
    confirmButtonLabel = 'Gerar a cena',
}) => {
    const [projectionActive, setProjectionActive] = useState(false);
    const [showProjectionConfirm, setShowProjectionConfirm] = useState(false);
    const [selectedBackdropSkinId, setSelectedBackdropSkinId] = useState<LegacyBackdropSkinId>(DEFAULT_LEGACY_BACKDROP_SKIN_ID);
    const [isProjectionTransitioning, setIsProjectionTransitioning] = useState(false);
    const [sequenceComplete, setSequenceComplete] = useState(false);
    const [isPurchasingProjection, setIsPurchasingProjection] = useState(false);
    const [previewLayoutEditorOpen, setPreviewLayoutEditorOpen] = useState(false);
    const [previewLayoutCopyState, setPreviewLayoutCopyState] = useState<'idle' | 'copied' | 'prompt'>('idle');
    const [viewportSize, setViewportSize] = useState(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : LEGACY_PREVIEW_STAGE_WIDTH,
        height: typeof window !== 'undefined' ? window.innerHeight : LEGACY_PREVIEW_STAGE_HEIGHT,
    }));
    const exportKitRef = useRef<LegacyExportKitHandle | null>(null);
    const previewLayoutCopyTimeoutRef = useRef<number | null>(null);

    const summary = useMemo(() => buildLegacyPlaqueSummary(eras), [eras]);
    const previewLayout = useLegacyPreviewLayoutConfig();
    const previewPlaqueWidth = LEGACY_PREVIEW_PLAQUE_BASE_WIDTH;
    const previewPlaqueScale = getLegacyPreviewPlaqueScale(previewLayout);
    const selectedBackdropSkin = useMemo(() => getLegacyBackdropSkin(selectedBackdropSkinId), [selectedBackdropSkinId]);
    const fitStageScale = (insetY: number) => Math.min(
        Math.max((viewportSize.width - LEGACY_STAGE_INSET_X) / LEGACY_PREVIEW_STAGE_WIDTH, 0.1),
        Math.max((viewportSize.height - insetY) / LEGACY_PREVIEW_STAGE_HEIGHT, 0.1),
    );
    const previewStageScale = fitStageScale(LEGACY_PREVIEW_INSET_Y);
    const previewStageWidth = LEGACY_PREVIEW_STAGE_WIDTH * previewStageScale;
    const previewStageHeight = LEGACY_PREVIEW_STAGE_HEIGHT * previewStageScale;
    const completionStageScale = fitStageScale(LEGACY_COMPLETION_INSET_Y);
    const completionStageWidth = LEGACY_PREVIEW_STAGE_WIDTH * completionStageScale;
    const completionStageHeight = LEGACY_PREVIEW_STAGE_HEIGHT * completionStageScale;
    const updatePreviewLayout = useCallback((patch: Partial<LegacyPreviewLayoutConfig>) => {
        setStoredLegacyPreviewLayoutConfig({ ...previewLayout, ...patch });
    }, [previewLayout]);

    const handleCopyPreviewLayoutJson = useCallback(async () => {
        const json = JSON.stringify(previewLayout, null, 2);
        let usedPromptFallback = false;

        try {
            await navigator.clipboard.writeText(json);
        } catch {
            usedPromptFallback = true;
            window.prompt('Copie o JSON do layout da previa', json);
        }

        if (previewLayoutCopyTimeoutRef.current !== null) {
            window.clearTimeout(previewLayoutCopyTimeoutRef.current);
        }
        setPreviewLayoutCopyState(usedPromptFallback ? 'prompt' : 'copied');
        previewLayoutCopyTimeoutRef.current = window.setTimeout(() => setPreviewLayoutCopyState('idle'), 1400);
    }, [previewLayout]);

    useEffect(() => () => {
        if (previewLayoutCopyTimeoutRef.current !== null) {
            window.clearTimeout(previewLayoutCopyTimeoutRef.current);
        }
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setViewportSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handlePromptProjection = () => {
        if (!isPremium) {
            onToast('Abrir a projecao completa do legado e um recurso premium.');
            return;
        }
        if (summary.totalCycles === 0) {
            onToast('Feche pelo menos um ciclo para abrir o legado.');
            return;
        }
        setShowProjectionConfirm(true);
    };

    const startProjection = () => {
        setSequenceComplete(false);
        setIsProjectionTransitioning(true);
        window.setTimeout(() => {
            setProjectionActive(true);
            setIsProjectionTransitioning(false);
        }, 260);
    };

    const handleConfirmProjection = async () => {
        if (isPurchasingProjection) return;
        setIsPurchasingProjection(true);
        try {
            if (onPurchaseProjection) {
                const unlocked = await onPurchaseProjection();
                if (!unlocked) return;
            }
            setShowProjectionConfirm(false);
            startProjection();
        } finally {
            setIsPurchasingProjection(false);
        }
    };

    const handleProjectionSequenceComplete = () => {
        setProjectionActive(false);
        setSequenceComplete(true);
    };

    const handleExportProjection = useCallback(async () => {
        onToast('Preparando exportacao da cena...', 'info');
        try {
            const { exportElementAsImage, shouldPreferNativeShare } = await import('./Share');
            const preferShare = shouldPreferNativeShare();
            const result = await exportElementAsImage(LEGACY_PROJECTION_CAPTURE_ID, {
                fileName: `glyph-cena-do-legado-${new Date().toISOString().slice(0, 10)}.png`,
                title: `Cena do Legado - ${sovereignName}`,
                backgroundColor: '#050505',
                preferShare,
                pixelRatio: 3,
            });

            onToast(
                result === 'shared'
                    ? 'Cena do legado compartilhada.'
                    : result === 'cancelled'
                        ? 'Compartilhamento cancelado.'
                        : 'Cena do legado exportada.',
                result === 'cancelled' ? 'info' : 'success',
            );
        } catch (error) {
            console.error('Erro ao exportar cena do legado:', error);
            onToast('Nao foi possivel exportar a cena do legado.', 'error');
        }
    }, [onToast, sovereignName]);

    const renderPreviewStage = () => (
        <div className="relative flex min-h-full w-full flex-col items-center justify-start overflow-hidden bg-[linear-gradient(180deg,_#080b11,_#020304)] px-6 pb-24">
            <div
                className="pointer-events-none absolute inset-0 opacity-100"
                style={{
                    backgroundImage: `url(${LEGACY_PREVIEW_BACKDROP_URL})`,
                    // 'cover' + zoom + overflow-hidden do pai: a arte enche a tela do
                    // aparelho e o que sobra e cortado. Nao encolhe para caber, porque
                    // cada aparelho tem uma proporcao e encaixar deixava faixa vazia.
                    // Em tablet o corte vertical e grande - e aceito de proposito.
                    backgroundPosition: 'center center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    transform: `scale(${previewLayout.backdropZoom})`,
                    transformOrigin: 'center center',
                    filter: 'saturate(0.96) brightness(0.82)',
                }}
            />

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.30),rgba(0,0,0,0.12)_38%,rgba(0,0,0,0.52)_100%)]" />

            {showLayoutEditors && (
                <div className="absolute right-20 top-4 z-20 flex flex-col items-end gap-2">
                    <button
                        type="button"
                        onClick={() => setPreviewLayoutEditorOpen((current) => !current)}
                        className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-xl transition ${previewLayoutEditorOpen ? 'border-[var(--skin-accent-color)]/35 bg-[var(--skin-accent-color)]/12 text-[var(--skin-accent-color)]' : 'border-white/10 bg-black/35 text-white/56 hover:text-white/82'}`}
                    >
                        {previewLayoutEditorOpen ? 'Fechar ajuste' : 'Ajustar capa'}
                    </button>
                    {previewLayoutEditorOpen && (
                        <div className="w-[236px] rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(6,10,14,0.82),rgba(3,6,10,0.7))] px-3.5 py-3.5 shadow-[0_16px_30px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl">
                            <div className="space-y-2.5">
                                <LayoutSlider label="Zoom do fundo" value={previewLayout.backdropZoom} min={1} max={1.22} step={0.01} onChange={(value) => updatePreviewLayout({ backdropZoom: value })} />
                                <LayoutSlider label="Zoom da placa" value={previewLayout.plaqueZoom} min={0.82} max={1.6} step={0.01} onChange={(value) => updatePreviewLayout({ plaqueZoom: value })} />
                                <LayoutSlider label="Y da placa" value={previewLayout.plaqueOffsetY} min={-180} max={320} step={1} onChange={(value) => updatePreviewLayout({ plaqueOffsetY: value })} />
                            </div>
                            <button
                                type="button"
                                onClick={handleCopyPreviewLayoutJson}
                                className="mt-3 w-full rounded-full border border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--skin-accent-color)] transition hover:bg-[var(--skin-accent-color)]/16"
                            >
                                {previewLayoutCopyState === 'copied' ? 'JSON copiado' : previewLayoutCopyState === 'prompt' ? 'JSON aberto' : 'Gravar JSON'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="relative z-10 flex min-h-full w-full items-center justify-center p-1.5">
                <div
                    className="relative overflow-hidden"
                    style={{ width: `${previewStageWidth}px`, height: `${previewStageHeight}px` }}
                >
                    <div
                        className="relative flex h-full w-full flex-col overflow-hidden px-6 pb-24 pt-5 text-white"
                        style={{ width: `${LEGACY_PREVIEW_STAGE_WIDTH}px`, height: `${LEGACY_PREVIEW_STAGE_HEIGHT}px`, transform: `scale(${previewStageScale})`, transformOrigin: 'top left' }}
                    >
                        <div
                            className="relative z-10 mx-auto w-full"
                            style={{
                                marginTop: '102px',
                                width: `${previewPlaqueWidth}px`,
                                maxWidth: `${LEGACY_PREVIEW_STAGE_WIDTH - 48}px`,
                                transform: `translate(0px, ${previewLayout.plaqueOffsetY}px) scale(${previewPlaqueScale})`,
                                transformOrigin: 'top center',
                            }}
                        >
                            <LegacyGrandPlaque
                                eras={eras}
                                sovereignName={sovereignName}
                                identity={fallbackIdentity}
                                identityMode="current"
                                compact
                                portrait
                            />
                        </div>

                        <div className="absolute inset-x-4 bottom-5 z-20 flex justify-center">
                            <button
                                type="button"
                                onClick={handlePromptProjection}
                                disabled={!isPremium || summary.totalCycles === 0}
                                className={`min-w-[248px] rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.24em] ${isPremium && summary.totalCycles > 0 ? 'luxe-skin-button' : 'cursor-not-allowed border border-white/10 bg-white/5 text-gray-500'}`}
                            >
                                {!isPremium ? (
                                    'Legado premium'
                                ) : summary.totalCycles === 0 ? (
                                    'Feche 1 ciclo'
                                ) : (
                                    <span className="flex flex-col items-center gap-1 leading-none">
                                        <span>{sceneButtonLabel}</span>
                                        {typeof sceneGoldCost === 'number' && sceneGoldCost > 0 && (
                                            <span className="rounded-full border border-black/15 bg-black/20 px-2.5 py-1 text-[9px] tracking-[0.18em] text-black/80">
                                                {sceneGoldCost} ouro
                                            </span>
                                        )}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCompletionStage = () => (
        <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(180deg,_#070a10,_#010203)] px-6 py-20">
            <div
                className="pointer-events-none absolute inset-0 opacity-100"
                style={{
                    backgroundImage: `url(${LEGACY_PREVIEW_BACKDROP_URL})`,
                    backgroundPosition: 'center center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    transform: 'scale(1.08)',
                    transformOrigin: 'center center',
                    filter: 'saturate(0.96) brightness(0.78)',
                }}
            />

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.34),rgba(0,0,0,0.16)_38%,rgba(0,0,0,0.56)_100%)]" />

            <div className="relative z-10 flex min-h-full w-full items-center justify-center p-1.5">
                <div
                    className="relative overflow-hidden"
                    style={{ width: `${completionStageWidth}px`, height: `${completionStageHeight}px` }}
                >
                    <div
                        className="relative flex h-full w-full flex-col overflow-hidden px-6 pb-14 pt-5 text-white"
                        style={{ width: `${LEGACY_PREVIEW_STAGE_WIDTH}px`, height: `${LEGACY_PREVIEW_STAGE_HEIGHT}px`, transform: `scale(${completionStageScale})`, transformOrigin: 'top left' }}
                    >
                        <div className="relative z-10 flex h-full flex-col items-center">
                            <div className="mt-[92px] rounded-full border border-[var(--skin-accent-color)]/24 bg-black/42 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-amber-200/90 backdrop-blur-xl">
                                Sequencia concluida
                            </div>

                            <div
                                className="mt-4 mx-auto w-full"
                                style={{
                                    width: `${previewPlaqueWidth}px`,
                                    maxWidth: `${LEGACY_PREVIEW_STAGE_WIDTH - 36}px`,
                                    transform: 'scale(1.12)',
                                    transformOrigin: 'top center',
                                }}
                            >
                                <LegacyGrandPlaque
                                    eras={eras}
                                    sovereignName={sovereignName}
                                    identity={fallbackIdentity}
                                    identityMode="current"
                                    compact
                                    portrait
                                />
                            </div>

                            <div className="mt-4 w-full max-w-[332px] rounded-[24px] border border-white/10 bg-black/34 px-4 py-4 text-center shadow-[0_18px_42px_rgba(0,0,0,0.32)] backdrop-blur-md">
                                <h2 className="text-[1.28rem] font-black tracking-tight text-white">Legado projetado com sucesso</h2>
                                <p className="mt-2 text-sm leading-relaxed text-gray-300">
                                    A cena terminou. Agora voce pode exportar o quadro ou seguir para a placa final.
                                </p>
                            </div>

                            <div className="mt-auto w-full max-w-[320px] space-y-2 pb-4">
                                <button
                                    type="button"
                                    onClick={handleExportProjection}
                                    className="w-full rounded-full border border-white/16 bg-black/45 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white transition hover:border-white/24 hover:bg-black/60"
                                >
                                    Exportar cena
                                </button>
                                <button
                                    type="button"
                                    onClick={startProjection}
                                    className="w-full rounded-full border border-white/16 bg-black/45 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white transition hover:border-white/24 hover:bg-black/60"
                                >
                                    Repetir projecao
                                </button>
                                {onOpenPlaque && (
                                    <button
                                        type="button"
                                        onClick={onOpenPlaque}
                                        className="w-full rounded-full px-6 py-3 text-[11px] font-black uppercase tracking-[0.22em] luxe-skin-button"
                                    >
                                        OK
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const hiddenCaptureScene = (
        <div className="pointer-events-none fixed left-[-20000px] top-0 z-[-1]" aria-hidden="true">
            <LegacyProjectionScene
                id={LEGACY_PROJECTION_CAPTURE_ID}
                eras={eras}
                sovereignName={sovereignName}
                projectionActive
                showLayoutEditor={showLayoutEditors}
                fallbackIdentity={fallbackIdentity}
                backdropSkinId={selectedBackdropSkinId}
            />
            <LegacyExportKit
                ref={exportKitRef}
                eras={eras}
                sovereignName={sovereignName}
                fallbackIdentity={fallbackIdentity}
                backdropSkinId={selectedBackdropSkinId}
            />
        </div>
    );

    return (
        <Portal>
            <div className="fixed inset-0 z-[10003] bg-black/94 backdrop-blur-xl" onClick={onClose}>
                <div className="relative h-full w-full overflow-hidden" onClick={(event) => event.stopPropagation()}>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/45 text-[26px] font-black leading-none text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-white/25 hover:bg-black/55"
                        aria-label="Fechar legado"
                    >
                        x
                    </button>

                    <div className="h-full w-full overflow-hidden">
                        {sequenceComplete ? renderCompletionStage() : projectionActive ? (
                            <div className="flex h-full min-h-full flex-col">
                                <LegacyProjectionScene
                                    eras={eras}
                                    sovereignName={sovereignName}
                                    projectionActive
                                    interactive
                                    showLayoutEditor={showLayoutEditors}
                                    autoAdvance={false}
                                    enteringProjection={isProjectionTransitioning}
                                    fallbackIdentity={fallbackIdentity}
                                    backdropSkinId={selectedBackdropSkinId}
                                    onActivatePlaque={onOpenPlaque}
                                    onOpenCycle={onOpenCycle}
                                    onOpenEra={onOpenEra}
                                    onSequenceComplete={handleProjectionSequenceComplete}
                                />
                            </div>
                        ) : renderPreviewStage()}
                    </div>

                    {isProjectionTransitioning && (
                        <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,_rgba(170,220,255,0.08),_rgba(0,0,0,0.9)_64%)] transition-opacity duration-300" />
                    )}
                </div>

                {showProjectionConfirm && (
                    <LegacyProjectionConfirmModal
                        selectedSkinId={selectedBackdropSkinId}
                        sceneGoldCost={sceneGoldCost}
                        isProcessing={isPurchasingProjection}
                        kickerLabel={confirmKickerLabel}
                        title={confirmTitle}
                        description={confirmDescription}
                        confirmLabel={confirmButtonLabel}
                        onSelectSkin={setSelectedBackdropSkinId}
                        onConfirm={() => { void handleConfirmProjection(); }}
                        onCancel={() => setShowProjectionConfirm(false)}
                    />
                )}

                {hiddenCaptureScene}
            </div>
        </Portal>
    );
};
