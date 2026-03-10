import React, { useMemo, useRef, useState } from 'react';
import type { ReportIdentitySnapshot } from '../types';
import { Portal } from './Portal';
import { exportElementAsImage, exportLegadoKit, shouldPreferNativeShare } from './Share';
import { LegacyProjectionScene } from './LegacyProjectionScene';
import { buildLegacyPlaqueSummary } from './LegacyPlaqueArtifact';
import { LegacyGrandPlaque } from './LegacyGrandPlaque';
import { LegacyGenerationModal } from './LegacyGenerationModal';
import { LegacyProjectionConfirmModal } from './LegacyProjectionConfirmModal';
import { LegacyExportKit, type LegacyExportKitHandle } from './LegacyExportKit';
import type { LegacyEraSummary } from './LegacyExportDocument';
import { DEFAULT_LEGACY_BACKDROP_SKIN_ID, type LegacyBackdropSkinId } from '../constants/legacyBackdropSkins';
import './legacy-ui.css';

interface LegacyProjectionModalProps {
    eras: LegacyEraSummary[];
    sovereignName: string;
    isPremium: boolean;
    fallbackIdentity?: ReportIdentitySnapshot;
    onClose: () => void;
    onToast: (message: string) => void;
    onOpenCycle?: (cycleId: string) => void;
    onOpenEra?: (era: LegacyEraSummary) => void;
    onOpenPlaque?: () => void;
    onExportRecord?: () => Promise<void> | void;
}

const LEGACY_PROJECTION_CAPTURE_ID = 'legacy-projection-capture';

export const LegacyProjectionModal: React.FC<LegacyProjectionModalProps> = ({
    eras,
    sovereignName,
    isPremium,
    fallbackIdentity,
    onClose,
    onToast,
    onOpenCycle,
    onOpenEra,
    onOpenPlaque,
    onExportRecord,
}) => {
    const preferNativeShare = shouldPreferNativeShare();
    const [projectionActive, setProjectionActive] = useState(false);
    const [projectionCompleted, setProjectionCompleted] = useState(false);
    const [showGenerationVideo, setShowGenerationVideo] = useState(false);
    const [showProjectionConfirm, setShowProjectionConfirm] = useState(false);
    const [selectedBackdropSkinId, setSelectedBackdropSkinId] = useState<LegacyBackdropSkinId>(DEFAULT_LEGACY_BACKDROP_SKIN_ID);
    const [isProjectionTransitioning, setIsProjectionTransitioning] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingKit, setIsExportingKit] = useState(false);
    const exportKitRef = useRef<LegacyExportKitHandle | null>(null);

    const summary = useMemo(() => buildLegacyPlaqueSummary(eras), [eras]);
    const previewIdentity = useMemo(() => ({
        nickname: fallbackIdentity?.nickname || sovereignName,
        level: fallbackIdentity?.level || 1,
        clanName: fallbackIdentity?.clanName || 'Sem cla',
        title: fallbackIdentity?.nobilityRankName || fallbackIdentity?.title || 'Vagante',
    }), [fallbackIdentity, sovereignName]);

    const handleExportLegacyImage = async () => {
        setIsExporting(true);
        try {
            const result = await exportElementAsImage(LEGACY_PROJECTION_CAPTURE_ID, {
                fileName: `glyph-legado-projetado-${new Date().toISOString().slice(0, 10)}.png`,
                title: `Legado Projetado - ${sovereignName}`,
                backgroundColor: '#050505',
                preferShare: preferNativeShare,
            });
            onToast(result === 'shared' ? 'Legado projetado compartilhado.' : 'Legado projetado exportado.');
        } catch (error) {
            console.error('Erro ao exportar legado projetado:', error);
            onToast('Nao foi possivel exportar o legado projetado.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportLegacyKit = async () => {
        if (summary.totalCycles === 0) {
            onToast('Feche pelo menos um ciclo para exportar o kit do legado.');
            return;
        }

        const slides = exportKitRef.current?.getSlides() || [];
        if (slides.length === 0) {
            onToast('Os slides do legado ainda nao estao prontos para captura.');
            return;
        }

        setIsExportingKit(true);
        try {
            const exportedCount = await exportLegadoKit(
                slides.map((slide) => ({
                    elementId: slide.id,
                    fileName: slide.fileName,
                    title: slide.title,
                    backgroundColor: '#050505',
                    pixelRatio: 3,
                }))
            );
            onToast(`${exportedCount} slides do legado exportados.`);
        } catch (error) {
            console.error('Erro ao exportar kit do legado:', error);
            onToast('Nao foi possivel exportar o kit do legado.');
        } finally {
            setIsExportingKit(false);
        }
    };

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

    const handleConfirmProjection = () => {
        setShowProjectionConfirm(false);
        setShowGenerationVideo(true);
    };

    const beginProjection = () => {
        setProjectionCompleted(false);
        setIsProjectionTransitioning(true);
        window.setTimeout(() => {
            setProjectionActive(true);
            setIsProjectionTransitioning(false);
        }, 900);
    };

    const renderPreviewStage = () => (
        <div className="relative flex min-h-full w-full flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(66,86,120,0.18),_transparent_22%),linear-gradient(180deg,_#0b0d12,_#050607_56%,_#020203)] px-6 py-10">
            <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute inset-x-[8%] top-[8%] h-px bg-[linear-gradient(90deg,_transparent,_rgba(212,175,55,0.2),_transparent)]" />
                <div className="absolute inset-x-[8%] bottom-[14%] h-px bg-[linear-gradient(90deg,_transparent,_rgba(255,255,255,0.08),_transparent)]" />
                <div className="absolute inset-x-[14%] top-[14%] h-[32%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(102,182,255,0.08),_transparent_74%)] blur-2xl" />
            </div>

            <div className="relative z-10 w-full max-w-[540px]">
                <LegacyGrandPlaque eras={eras} sovereignName={sovereignName} />
            </div>

            <div className="legacy-panel-soft relative z-10 mt-6 w-full max-w-[760px] px-5 py-4">
                <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                        <p className="legacy-kicker legacy-kicker-muted">Soberano</p>
                        <p className="mt-2 text-base font-black text-white">{previewIdentity.nickname}</p>
                    </div>
                    <div>
                        <p className="legacy-kicker legacy-kicker-muted">Patente</p>
                        <p className="mt-2 text-base font-black text-white">{previewIdentity.title}</p>
                    </div>
                    <div>
                        <p className="legacy-kicker legacy-kicker-muted">Cla</p>
                        <p className="mt-2 text-base font-black text-white">{previewIdentity.clanName}</p>
                    </div>
                    <div>
                        <p className="legacy-kicker legacy-kicker-muted">Nivel</p>
                        <p className="mt-2 text-base font-black text-white">{previewIdentity.level}</p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3">
                <button type="button" onClick={handlePromptProjection} disabled={!isPremium || summary.totalCycles === 0} className={`rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.24em] ${isPremium && summary.totalCycles > 0 ? 'luxe-skin-button' : 'cursor-not-allowed border border-white/10 bg-white/5 text-gray-500'}`}>
                    Gerar legado
                </button>
                <button type="button" onClick={() => { void handleExportLegacyKit(); }} disabled={isExportingKit || summary.totalCycles === 0} className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-[0.24em] text-white disabled:cursor-not-allowed disabled:opacity-50">
                    {isExportingKit ? 'EXPORTANDO KIT...' : 'Exportar kit'}
                </button>
                {onExportRecord && (
                    <button type="button" onClick={() => { void onExportRecord(); }} className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-[0.24em] text-white">
                        Registro completo
                    </button>
                )}
            </div>
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
                        ×
                    </button>

                    <div className="h-full w-full overflow-hidden">
                        {projectionActive ? (
                            <div className="flex h-full min-h-full flex-col">
                                <LegacyProjectionScene
                                    eras={eras}
                                    sovereignName={sovereignName}
                                    projectionActive
                                    interactive
                                    autoAdvance={projectionActive}
                                    enteringProjection={isProjectionTransitioning}
                                    fallbackIdentity={fallbackIdentity}
                                    backdropSkinId={selectedBackdropSkinId}
                                    onSequenceComplete={() => setProjectionCompleted(true)}
                                    onActivatePlaque={onOpenPlaque}
                                    onOpenCycle={onOpenCycle}
                                    onOpenEra={onOpenEra}
                                />

                                {projectionCompleted && (
                                    <div className="pointer-events-auto absolute inset-x-4 bottom-4 z-20 flex flex-wrap items-center justify-center gap-3 text-center sm:inset-x-6">
                                        <button type="button" onClick={() => { void handleExportLegacyKit(); }} disabled={isExportingKit} className="rounded-full luxe-button-secondary px-5 py-3 text-xs disabled:opacity-50">
                                            {isExportingKit ? 'EXPORTANDO KIT...' : 'Exportar kit'}
                                        </button>
                                        {onExportRecord && (
                                            <button type="button" onClick={() => { void onExportRecord(); }} className="rounded-full luxe-button-secondary px-5 py-3 text-xs">
                                                Registro completo
                                            </button>
                                        )}
                                        <button type="button" onClick={handleExportLegacyImage} disabled={isExporting} className="rounded-full luxe-skin-button px-5 py-3 text-xs disabled:opacity-50">
                                            {isExporting ? 'EXPORTANDO...' : preferNativeShare ? 'Compartilhar imagem' : 'Baixar imagem'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : renderPreviewStage()}
                    </div>

                    {isProjectionTransitioning && (
                        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.12),_rgba(0,0,0,0.78)_58%)]">
                            <div className="rounded-[28px] border border-[var(--skin-accent-color)]/30 bg-black/55 px-8 py-6 text-center shadow-[0_0_48px_rgba(212,175,55,0.2)]">
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--skin-accent-color)]">Ritual de forja</p>
                                <h3 className="mt-3 text-2xl font-black tracking-tight text-white">A placa grava e projeta a linha viva</h3>
                                <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-300">
                                    Condensando eras, alinhando ciclos e liberando a memoria operacional do soberano.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {showProjectionConfirm && (
                    <LegacyProjectionConfirmModal
                        selectedSkinId={selectedBackdropSkinId}
                        onSelectSkin={setSelectedBackdropSkinId}
                        onConfirm={handleConfirmProjection}
                        onCancel={() => setShowProjectionConfirm(false)}
                    />
                )}

                {showGenerationVideo && (
                    <LegacyGenerationModal
                        onComplete={beginProjection}
                        onClose={() => setShowGenerationVideo(false)}
                    />
                )}

                <div className="pointer-events-none fixed left-[-20000px] top-0 z-[-1]" aria-hidden="true">
                    <LegacyProjectionScene
                        id={LEGACY_PROJECTION_CAPTURE_ID}
                        eras={eras}
                        sovereignName={sovereignName}
                        projectionActive
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
            </div>
        </Portal>
    );
};
