import React, { useMemo, useState } from 'react';
import { Portal } from './Portal';
import { GlassCard } from './GlassCard';
import { exportElementAsImage } from './Share';
import { LegacyProjectionScene } from './LegacyProjectionScene';
import { LegacyPlaqueArtifact, buildLegacyPlaqueSummary } from './LegacyPlaqueArtifact';
import { LegacyGenerationModal } from './LegacyGenerationModal';
import type { LegacyEraSummary } from './LegacyExportDocument';

interface LegacyProjectionModalProps {
    eras: LegacyEraSummary[];
    sovereignName: string;
    isPremium: boolean;
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
    onClose,
    onToast,
    onOpenCycle,
    onOpenEra,
    onOpenPlaque,
    onExportRecord,
}) => {
    const [projectionActive, setProjectionActive] = useState(false);
    const [showGenerationVideo, setShowGenerationVideo] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const summary = useMemo(() => buildLegacyPlaqueSummary(eras), [eras]);

    const handleExportLegacyImage = async () => {
        setIsExporting(true);
        try {
            await exportElementAsImage(LEGACY_PROJECTION_CAPTURE_ID, {
                fileName: `glyph-legado-projetado-${new Date().toISOString().slice(0, 10)}.png`,
                title: `Legado Projetado - ${sovereignName}`,
                backgroundColor: '#050505',
                preferShare: false,
            });
            onToast('Legado projetado exportado.');
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
        setShowGenerationVideo(true);
    };

    const renderPreviewStage = () => (
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 py-6">
            <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--skin-accent-color)]">Ver Legado</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Resumo condensado da trajetoria</h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
                    Aqui entra so o acumulado geral. A projecao completa com placa, ciclos, timeline e mini planner fica liberada quando o legado e gravado.
                </p>
            </div>

            <div className="w-full max-w-[520px]">
                <LegacyPlaqueArtifact
                    eras={eras}
                    sovereignName={sovereignName}
                    plaqueUnlocked={isPremium}
                />
            </div>

            <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Eras</p>
                    <p className="mt-2 text-3xl font-black text-white">{eras.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Ciclos</p>
                    <p className="mt-2 text-3xl font-black text-white">{summary.totalCycles}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Score medio</p>
                    <p className="mt-2 text-3xl font-black text-white">{summary.weightedAverageScore}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Horas</p>
                    <p className="mt-2 text-3xl font-black text-white">{Number.isInteger(summary.totalHours) ? summary.totalHours : summary.totalHours.toFixed(1)}</p>
                </div>
            </div>

            <div className="flex flex-col items-center gap-3">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full border ${isPremium ? 'border-[var(--skin-accent-color)]/45 bg-[var(--skin-accent-color)]/10 text-[var(--skin-accent-color)]' : 'border-white/10 bg-white/5 text-gray-500'}`}>
                    <span className="text-xs font-black uppercase tracking-[0.22em]">GL</span>
                </div>
                <button
                    type="button"
                    onClick={handleStartRecording}
                    disabled={!isPremium}
                    className={`rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.24em] ${isPremium ? 'luxe-skin-button' : 'cursor-not-allowed border border-white/10 bg-white/5 text-gray-500'}`}
                >
                    Gravar legado
                </button>
                <p className="max-w-md text-center text-[11px] leading-relaxed text-gray-500">
                    {isPremium
                        ? 'Rodar o ritual abre a placa no topo e projeta a timeline horizontal com Eras, ciclos e mini planner.'
                        : 'Nao premium enxerga apenas o condensado do legado. A gravacao completa da linha viva fica reservada ao premium.'}
                </p>
            </div>
        </div>
    );

    return (
        <Portal>
            <div className="fixed inset-0 z-[10003] bg-black/92 backdrop-blur-xl" onClick={onClose}>
                <div className="flex h-full w-full items-center justify-center p-4" onClick={(event) => event.stopPropagation()}>
                    <GlassCard variant="neutral" className="flex h-[min(94vh,980px)] w-full max-w-[min(96vw,1640px)] flex-col overflow-hidden border-white/10">
                        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--skin-accent-color)]">Legado</p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                                    {projectionActive ? 'Placa, timeline e ciclos' : 'Resumo e gravacao do legado'}
                                </h2>
                                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
                                    {projectionActive
                                        ? 'A placa domina o topo. No miolo corre a timeline de Eras e ciclos. Embaixo, a memoria condensada do planner de cada ciclo.'
                                        : 'O historico continua vertical. Aqui voce decide se fica no resumo condensado ou grava a versao horizontal completa do legado.'}
                                </p>
                            </div>
                            <div className="flex shrink-0 gap-3">
                                <button type="button" onClick={onClose} className="rounded-xl luxe-button-secondary px-4 py-3 text-xs">Fechar</button>
                                <button type="button" onClick={() => { void onExportRecord?.(); }} className="rounded-xl luxe-button-secondary px-4 py-3 text-xs">
                                    Registro completo
                                </button>
                                {projectionActive && (
                                    <button
                                        type="button"
                                        onClick={handleExportLegacyImage}
                                        disabled={isExporting}
                                        className="rounded-xl luxe-skin-button px-4 py-3 text-xs disabled:opacity-50"
                                    >
                                        {isExporting ? 'EXPORTANDO...' : 'Baixar legado'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {projectionActive ? (
                                <LegacyProjectionScene
                                    eras={eras}
                                    sovereignName={sovereignName}
                                    projectionActive
                                    interactive
                                    onActivatePlaque={onOpenPlaque}
                                    onOpenCycle={onOpenCycle}
                                    onOpenEra={onOpenEra}
                                />
                            ) : renderPreviewStage()}
                        </div>
                    </GlassCard>
                </div>

                {showGenerationVideo && (
                    <LegacyGenerationModal
                        onComplete={() => {
                            setProjectionActive(true);
                        }}
                        onClose={() => setShowGenerationVideo(false)}
                    />
                )}

                <div className="pointer-events-none fixed left-[-20000px] top-0 z-[-1]" aria-hidden="true">
                    <LegacyProjectionScene
                        id={LEGACY_PROJECTION_CAPTURE_ID}
                        eras={eras}
                        sovereignName={sovereignName}
                        projectionActive
                    />
                </div>
            </div>
        </Portal>
    );
};
