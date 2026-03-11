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
    resetStoredLegacyLayoutConfig,
    setStoredLegacyLayoutConfig,
    type LegacyLayoutConfig,
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
    onExportRecord?: () => Promise<void> | void;
    showLayoutLab?: boolean;
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
    showLayoutLab = false,
}) => {
    const [projectionActive, setProjectionActive] = useState(false);
    const [showProjectionConfirm, setShowProjectionConfirm] = useState(false);
    const [selectedBackdropSkinId, setSelectedBackdropSkinId] = useState<LegacyBackdropSkinId>(DEFAULT_LEGACY_BACKDROP_SKIN_ID);
    const [isProjectionTransitioning, setIsProjectionTransitioning] = useState(false);
    const exportKitRef = useRef<LegacyExportKitHandle | null>(null);

    const summary = useMemo(() => buildLegacyPlaqueSummary(eras), [eras]);
    const layout = useLegacyLayoutConfig();
    const previewPlaqueWidth = getLegacyPlaqueWidthPx('preview', layout);
    const previewPlaqueScale = getLegacyPlaqueScale('preview', layout);

    const updateLayout = <K extends keyof LegacyLayoutConfig>(key: K, value: number) => {
        setStoredLegacyLayoutConfig({ ...layout, [key]: value });
    };

    const copyLayoutJson = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(layout, null, 2));
            onToast('JSON do layout copiado.');
        } catch {
            onToast('Nao foi possivel copiar o JSON.');
        }
    };

    const resetLayout = () => {
        resetStoredLegacyLayoutConfig();
        onToast('Layout do legado resetado.');
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
        setIsProjectionTransitioning(true);
        window.setTimeout(() => {
            setProjectionActive(true);
            setIsProjectionTransitioning(false);
        }, 260);
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
                    transform: `translateY(${layout.plaqueOffsetY}px) scale(${previewPlaqueScale})`,
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
                                    onActivatePlaque={onOpenPlaque}
                                    onOpenCycle={onOpenCycle}
                                    onOpenEra={onOpenEra}
                                    showLayoutLab={showLayoutLab}
                                />
                            </div>
                        ) : renderPreviewStage()}
                    </div>

                    {showLayoutLab && (
                        <div className="absolute left-3 top-16 z-40 w-[170px] rounded-2xl border border-cyan-400/20 bg-black/75 p-3 text-white shadow-[0_18px_45px_rgba(0,0,0,0.38)] backdrop-blur-md">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-200">Layout lab</p>
                                <button type="button" onClick={copyLayoutJson} className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100/80">JSON</button>
                            </div>
                            <div className="space-y-2">
                                {(projectionActive
                                    ? [
                                        ['plaqueOffsetY', 'Placa Y', -120, 120, 1],
                                        ['plaqueZoom', 'Placa zoom', 0.55, 1.6, 0.01],
                                        ['plaqueWidth', 'Placa largura', 0.72, 1.28, 0.01],
                                        ['cyclesOffsetY', 'Ciclos Y', -240, 140, 1],
                                        ['cyclesZoom', 'Ciclos zoom', 0.55, 1.8, 0.01],
                                        ['playerOffsetY', 'Info Y', -140, 140, 1],
                                        ['playerZoom', 'Info zoom', 0.55, 1.35, 0.01],
                                    ]
                                    : [
                                        ['plaqueOffsetY', 'Placa Y', -120, 120, 1],
                                        ['plaqueZoom', 'Placa zoom', 0.55, 1.6, 0.01],
                                        ['plaqueWidth', 'Placa largura', 0.72, 1.28, 0.01],
                                    ]).map(([key, label, min, max, step]) => (
                                    <label key={String(key)} className="block">
                                        <div className="mb-1 flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/80">{label}</span>
                                            <span className="text-[10px] font-black text-cyan-200">{layout[key as keyof LegacyLayoutConfig]}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={Number(min)}
                                            max={Number(max)}
                                            step={Number(step)}
                                            value={Number(layout[key as keyof LegacyLayoutConfig])}
                                            onChange={(event) => updateLayout(key as keyof LegacyLayoutConfig, Number(event.target.value))}
                                            className="w-full accent-cyan-400"
                                        />
                                    </label>
                                ))}
                            </div>
                            <div className="mt-2 flex justify-end">
                                <button type="button" onClick={resetLayout} className="text-[9px] font-black uppercase tracking-[0.16em] text-white/60">Resetar</button>
                            </div>
                        </div>
                    )}

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
