import React, { useMemo, useRef, useState } from 'react';
import type { ReportIdentitySnapshot } from '../types';
import { Portal } from './Portal';
import { LegacyProjectionScene } from './LegacyProjectionScene';
import { buildLegacyPlaqueSummary } from './LegacyPlaqueArtifact';
import { LegacyGrandPlaque } from './LegacyGrandPlaque';
import { LegacyProjectionConfirmModal } from './LegacyProjectionConfirmModal';
import { LegacyExportKit, type LegacyExportKitHandle } from './LegacyExportKit';
import type { LegacyEraSummary } from './LegacyExportDocument';
import { DEFAULT_LEGACY_BACKDROP_SKIN_ID, getLegacyBackdropSkin, type LegacyBackdropSkinId } from '../constants/legacyBackdropSkins';
import { useLegacyLayoutConfig } from '../hooks/useLegacyLayoutConfig';
import {
    getLegacyPlaqueScale,
    getLegacyPlaqueWidthPx,
} from '../utils/legacyLayoutLab';
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
}

const LEGACY_PROJECTION_CAPTURE_ID = 'legacy-projection-capture';
const LEGACY_PREVIEW_BACKDROP_URL = '/legacy-skins/10.jpg';

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
}) => {
    const [projectionActive, setProjectionActive] = useState(false);
    const [showProjectionConfirm, setShowProjectionConfirm] = useState(false);
    const [selectedBackdropSkinId, setSelectedBackdropSkinId] = useState<LegacyBackdropSkinId>(DEFAULT_LEGACY_BACKDROP_SKIN_ID);
    const [isProjectionTransitioning, setIsProjectionTransitioning] = useState(false);
    const [sequenceComplete, setSequenceComplete] = useState(false);
    const exportKitRef = useRef<LegacyExportKitHandle | null>(null);

    const summary = useMemo(() => buildLegacyPlaqueSummary(eras), [eras]);
    const layout = useLegacyLayoutConfig();
    const previewPlaqueWidth = getLegacyPlaqueWidthPx('preview', layout);
    const previewPlaqueScale = getLegacyPlaqueScale('preview', layout);
    const selectedBackdropSkin = useMemo(() => getLegacyBackdropSkin(selectedBackdropSkinId), [selectedBackdropSkinId]);

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

    const handleConfirmProjection = () => {
        setShowProjectionConfirm(false);
        startProjection();
    };

    const handleProjectionSequenceComplete = () => {
        setProjectionActive(false);
        setSequenceComplete(true);
    };

    const renderPreviewStage = () => (
        <div className="relative flex min-h-full w-full flex-col items-center justify-start overflow-hidden bg-[linear-gradient(180deg,_#080b11,_#020304)] px-6 pb-24">
            <div
                className="pointer-events-none absolute inset-0 opacity-100"
                style={{
                    backgroundImage: `url(${LEGACY_PREVIEW_BACKDROP_URL})`,
                    backgroundPosition: 'center top',
                    backgroundSize: 'cover',
                }}
            />

            <div
                className="relative z-10 w-full"
                style={{
                    marginTop: '13vh',
                    width: `${previewPlaqueWidth}px`,
                    maxWidth: 'calc(100vw - 3rem)',
                    transform: `translate(${layout.plaqueOffsetX}px, ${layout.plaqueOffsetY}px) scale(${previewPlaqueScale})`,
                    transformOrigin: 'top center',
                }}
            >
                <LegacyGrandPlaque eras={eras} sovereignName={sovereignName} compact />
            </div>

            <div className="absolute inset-x-4 bottom-5 z-20 flex justify-center">
                <button
                    type="button"
                    onClick={handlePromptProjection}
                    disabled={!isPremium || summary.totalCycles === 0}
                    className={`min-w-[220px] rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.24em] ${isPremium && summary.totalCycles > 0 ? 'luxe-skin-button' : 'cursor-not-allowed border border-white/10 bg-white/5 text-gray-500'}`}
                >
                    {!isPremium ? 'Legado premium' : summary.totalCycles === 0 ? 'Feche 1 ciclo' : 'Gerar legado'}
                </button>
            </div>
        </div>
    );

    const renderCompletionStage = () => (
        <div className="relative flex min-h-full w-full flex-col items-center justify-start overflow-hidden bg-[linear-gradient(180deg,_#070a10,_#010203)] px-6 pb-24">
            <div
                className="pointer-events-none absolute inset-0 opacity-100"
                style={{
                    backgroundImage: `url(${selectedBackdropSkin.imageUrl})`,
                    backgroundPosition: 'center center',
                    backgroundSize: 'cover',
                }}
            />

            <div className="relative z-10 mt-[10vh] w-full max-w-3xl rounded-[28px] border border-white/12 bg-black/48 p-6 shadow-[0_22px_62px_rgba(0,0,0,0.48)] backdrop-blur-md sm:p-7">
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-amber-200/90">Sequencia concluida</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-[2rem]">Legado projetado com sucesso</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">
                    Sua linha de ciclos foi exibida ate o fim. Toque em OK para voltar para a placa final e compartilhar a partir dela.
                </p>

                <div
                    className="mx-auto mt-5 w-full"
                    style={{
                        width: `${previewPlaqueWidth}px`,
                        maxWidth: '100%',
                        transform: `translate(${layout.plaqueOffsetX}px, ${layout.plaqueOffsetY}px) scale(${previewPlaqueScale})`,
                        transformOrigin: 'top center',
                    }}
                >
                    <LegacyGrandPlaque eras={eras} sovereignName={sovereignName} compact />
                </div>
            </div>

            <div className="absolute inset-x-4 bottom-5 z-20 flex flex-wrap items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={startProjection}
                    className="min-w-[210px] rounded-full border border-white/16 bg-black/45 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white transition hover:border-white/24 hover:bg-black/60"
                >
                    Repetir projecao
                </button>
                {onOpenPlaque && (
                    <button
                        type="button"
                        onClick={onOpenPlaque}
                        className="min-w-[220px] rounded-full px-6 py-3 text-[11px] font-black uppercase tracking-[0.22em] luxe-skin-button"
                    >
                        OK
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
                        onSelectSkin={setSelectedBackdropSkinId}
                        onConfirm={handleConfirmProjection}
                        onCancel={() => setShowProjectionConfirm(false)}
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
