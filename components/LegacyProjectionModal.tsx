import React, { useMemo, useState } from 'react';
import type { LegacyRenderJobStatus, ReportIdentitySnapshot } from '../types';
import { Portal } from './Portal';
import { GlassCard } from './GlassCard';
import { exportElementAsImage, shouldPreferNativeShare } from './Share';
import { LegacyProjectionScene } from './LegacyProjectionScene';
import { LegacyPlaqueArtifact, buildLegacyPlaqueSummary } from './LegacyPlaqueArtifact';
import { LegacyGenerationModal } from './LegacyGenerationModal';
import type { LegacyEraSummary } from './LegacyExportDocument';
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
    onCreateRenderJob?: () => Promise<void> | void;
    latestRenderJob?: LegacyRenderJobStatus | null;
    isLoadingRenderJob?: boolean;
    onRefreshRenderJobStatus?: () => Promise<void> | void;
    onDownloadRenderVideo?: () => Promise<void> | void;
    isDownloadingRenderVideo?: boolean;
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
    onCreateRenderJob,
    latestRenderJob,
    isLoadingRenderJob = false,
    onRefreshRenderJobStatus,
    onDownloadRenderVideo,
    isDownloadingRenderVideo = false,
}) => {
    const preferNativeShare = shouldPreferNativeShare();
    const [projectionActive, setProjectionActive] = useState(false);
    const [projectionCompleted, setProjectionCompleted] = useState(false);
    const [showGenerationVideo, setShowGenerationVideo] = useState(false);
    const [isProjectionTransitioning, setIsProjectionTransitioning] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isCreatingRenderJob, setIsCreatingRenderJob] = useState(false);

    const summary = useMemo(() => buildLegacyPlaqueSummary(eras), [eras]);

    const renderStatusTone = latestRenderJob?.status === 'completed'
        ? 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10'
        : latestRenderJob?.status === 'failed'
            ? 'text-rose-300 border-rose-500/25 bg-rose-500/10'
            : latestRenderJob?.status === 'processing'
                ? 'text-amber-200 border-amber-400/25 bg-amber-400/10'
                : 'text-gray-300 border-white/10 bg-white/5';

    const renderStatusLabel = latestRenderJob?.status === 'completed'
        ? 'Video pronto no storage'
        : latestRenderJob?.status === 'failed'
            ? 'Falha no render'
            : latestRenderJob?.status === 'processing'
                ? 'Worker renderizando'
                : latestRenderJob?.status === 'pending'
                    ? 'Na fila de render'
                    : 'Sem render enfileirado';

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

    const handleStartRecording = () => {
        if (!isPremium) {
            onToast('Gravar legado completo e um recurso premium.');
            return;
        }
        if (summary.totalCycles === 0) {
            onToast('Feche pelo menos um ciclo para gravar o legado.');
            return;
        }
        setShowGenerationVideo(true);
    };
    const handleCreateRenderJob = async () => {
        if (!isPremium) {
            onToast('Render em video do legado e um recurso premium.');
            return;
        }
        if (summary.totalCycles === 0) {
            onToast('Feche pelo menos um ciclo para gerar o video do legado.');
            return;
        }
        if (!onCreateRenderJob) {
            onToast('Fila de render do legado ainda nao esta configurada.');
            return;
        }

        setIsCreatingRenderJob(true);
        try {
            await onCreateRenderJob();
        } finally {
            setIsCreatingRenderJob(false);
        }
    };

    const renderStatusPanel = (
        <div className={`legacy-panel p-4 text-left ${renderStatusTone}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="legacy-kicker">Render server-side</p>
                    <p className="mt-2 text-sm font-black">{renderStatusLabel}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-400">
                        {latestRenderJob
                            ? `Job ${latestRenderJob.id.slice(0, 8)} criado em ${new Date(latestRenderJob.createdAt).toLocaleString('pt-BR')}.`
                            : 'Quando voce enfileirar o video, o worker vai processar o legado no background e subir o mp4 no Supabase Storage.'}
                    </p>
                    {latestRenderJob?.errorMessage && (
                        <p className="mt-2 text-xs leading-relaxed text-rose-200">{latestRenderJob.errorMessage}</p>
                    )}
                    {latestRenderJob?.videoPath && (
                        <p className="mt-2 text-[11px] text-gray-300">Arquivo: {latestRenderJob.videoPath}</p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => { void onRefreshRenderJobStatus?.(); }}
                    disabled={isLoadingRenderJob}
                    className="rounded-xl luxe-button-secondary px-3 py-2 text-[11px] disabled:opacity-50"
                >
                    {isLoadingRenderJob ? 'ATUALIZANDO...' : 'Atualizar status'}
                </button>
            </div>
        </div>
    );

    const beginProjection = () => {
        setProjectionCompleted(false);
        setIsProjectionTransitioning(true);
        window.setTimeout(() => {
            setProjectionActive(true);
            setIsProjectionTransitioning(false);
        }, 900);
    };

    const renderPreviewStage = () => (
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 py-6">
            <div className="w-full max-w-[520px]">
                <LegacyPlaqueArtifact eras={eras} sovereignName={sovereignName} plaqueUnlocked={isPremium} />
            </div>

            <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="legacy-panel-soft p-4 text-center">
                    <p className="legacy-kicker legacy-kicker-muted">Eras</p>
                    <p className="mt-2 text-3xl font-black text-white">{eras.length}</p>
                </div>
                <div className="legacy-panel-soft p-4 text-center">
                    <p className="legacy-kicker legacy-kicker-muted">Ciclos</p>
                    <p className="mt-2 text-3xl font-black text-white">{summary.totalCycles}</p>
                </div>
                <div className="legacy-panel-soft p-4 text-center">
                    <p className="legacy-kicker legacy-kicker-muted">Score medio</p>
                    <p className="mt-2 text-3xl font-black text-white">{summary.weightedAverageScore}</p>
                </div>
                <div className="legacy-panel-soft p-4 text-center">
                    <p className="legacy-kicker legacy-kicker-muted">Horas</p>
                    <p className="mt-2 text-3xl font-black text-white">{Number.isInteger(summary.totalHours) ? summary.totalHours : summary.totalHours.toFixed(1)}</p>
                </div>
            </div>

            <div className="w-full max-w-3xl">{renderStatusPanel}</div>

            <div className="flex flex-col items-center gap-3">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full border ${isPremium ? 'border-[var(--skin-accent-color)]/45 bg-[var(--skin-accent-color)]/10 text-[var(--skin-accent-color)]' : 'border-white/10 bg-white/5 text-gray-500'}`}>
                    <span className="text-xs font-black uppercase tracking-[0.22em]">GL</span>
                </div>
                <button type="button" onClick={handleStartRecording} disabled={!isPremium || summary.totalCycles === 0} className={`rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.24em] ${isPremium && summary.totalCycles > 0 ? 'luxe-skin-button' : 'cursor-not-allowed border border-white/10 bg-white/5 text-gray-500'}`}>
                    Gravar legado
                </button>
                <p className="max-w-md text-center text-[11px] leading-relaxed text-gray-500">
                    {isPremium
                        ? 'A gravacao abre a placa no topo e percorre a timeline uma unica vez, do primeiro ao ultimo ciclo.'
                        : 'Nao premium enxerga so o condensado final. A projecao completa da linha viva fica no premium.'}
                </p>
            </div>
        </div>
    );

    return (
        <Portal>
            <div className="fixed inset-0 z-[10003] bg-black/92 backdrop-blur-xl" onClick={onClose}>
                <div className="flex h-full w-full items-center justify-center p-4" onClick={(event) => event.stopPropagation()}>
                    <GlassCard variant="neutral" className="relative flex h-[min(94vh,980px)] w-full max-w-[min(96vw,1640px)] flex-col overflow-hidden border-white/10">
                        <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--skin-accent-color)]">Legado</p>
                            <div className="flex shrink-0 gap-3">
                                <button type="button" onClick={onClose} className="rounded-xl luxe-button-secondary px-4 py-3 text-xs">Fechar</button>
                                <button type="button" onClick={() => { void onExportRecord?.(); }} className="rounded-xl luxe-button-secondary px-4 py-3 text-xs">Registro completo</button>
                                {projectionActive && (
                                    <button type="button" onClick={handleExportLegacyImage} disabled={isExporting} className="rounded-xl luxe-skin-button px-4 py-3 text-xs disabled:opacity-50">
                                        {isExporting ? 'EXPORTANDO...' : preferNativeShare ? 'Compartilhar imagem' : 'Baixar imagem'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {projectionActive ? (
                                <>
                                    <LegacyProjectionScene
                                        eras={eras}
                                        sovereignName={sovereignName}
                                        projectionActive
                                        interactive
                                        autoAdvance={projectionActive}
                                        enteringProjection={isProjectionTransitioning}
                                        fallbackIdentity={fallbackIdentity}
                                        onSequenceComplete={() => setProjectionCompleted(true)}
                                        onActivatePlaque={onOpenPlaque}
                                        onOpenCycle={onOpenCycle}
                                        onOpenEra={onOpenEra}
                                    />

                                    {projectionCompleted && (
                                        <div className="mt-5 flex flex-col items-center gap-3 border-t border-white/10 pt-5 text-center">
                                            <p className="legacy-kicker legacy-kicker-accent">Fechamento</p>
                                            <p className="text-sm leading-relaxed text-gray-300">A projecao terminou. Agora voce pode fechar, baixar a imagem ou enfileirar o render em video para o worker gerar no background.</p>
                                            <div className="w-full max-w-3xl">{renderStatusPanel}</div>
                                            <div className="flex flex-wrap justify-center gap-3">
                                                <button type="button" onClick={onClose} className="rounded-xl luxe-button-secondary px-4 py-3 text-xs">Fechar</button>
                                                {latestRenderJob?.status === 'completed' && latestRenderJob.videoPath ? (
                                                    <button type="button" onClick={() => { void onDownloadRenderVideo?.(); }} disabled={isDownloadingRenderVideo} className="rounded-xl luxe-button-secondary px-4 py-3 text-xs disabled:opacity-50">{isDownloadingRenderVideo ? 'GERANDO LINK...' : 'Baixar video'}</button>
                                                ) : (
                                                    <button type="button" onClick={() => { void handleCreateRenderJob(); }} disabled={isCreatingRenderJob} className="rounded-xl luxe-button-secondary px-4 py-3 text-xs disabled:opacity-50">{isCreatingRenderJob ? 'ENFILEIRANDO...' : 'Gerar video'}</button>
                                                )}
                                                <button type="button" onClick={handleExportLegacyImage} disabled={isExporting} className="rounded-xl luxe-skin-button px-4 py-3 text-xs disabled:opacity-50">{isExporting ? 'EXPORTANDO...' : preferNativeShare ? 'Compartilhar imagem' : 'Baixar imagem'}</button>
                                            </div>
                                        </div>
                                    )}
                                </>
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
                    </GlassCard>
                </div>

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
                    />
                </div>
            </div>
        </Portal>
    );
};
