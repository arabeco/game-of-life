import React, { useEffect, useState } from 'react';
import { Portal } from './Portal';
import { GlassCard } from './GlassCard';
import { exportElementAsImage } from './Share';
import { LegacyProjectionScene } from './LegacyProjectionScene';
import type { LegacyEraSummary } from './LegacyExportDocument';

interface LegacyProjectionModalProps {
    eras: LegacyEraSummary[];
    sovereignName: string;
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
    onClose,
    onToast,
    onOpenCycle,
    onOpenEra,
    onOpenPlaque,
    onExportRecord,
}) => {
    const [projectionActive, setProjectionActive] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [shakeFrame, setShakeFrame] = useState(0);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (!isShaking) return;

        let frame = 0;
        const timer = window.setInterval(() => {
            frame += 1;
            setShakeFrame(frame);
            if (frame >= 8) {
                window.clearInterval(timer);
                setIsShaking(false);
                setShakeFrame(0);
                setProjectionActive(true);
            }
        }, 45);

        return () => window.clearInterval(timer);
    }, [isShaking]);

    const handleActivatePlaque = () => {
        if (projectionActive) {
            onOpenPlaque?.();
            return;
        }
        if (!isShaking) setIsShaking(true);
    };

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

    const plaqueTransform = isShaking
        ? `translateX(${shakeFrame % 2 === 0 ? -5 : 5}px) rotate(${shakeFrame % 2 === 0 ? -0.9 : 0.9}deg)`
        : undefined;

    return (
        <Portal>
            <div className="fixed inset-0 z-[10003] bg-black/92 backdrop-blur-xl" onClick={onClose}>
                <div className="flex h-full w-full items-center justify-center p-4" onClick={(event) => event.stopPropagation()}>
                    <GlassCard variant="neutral" className="flex h-[min(94vh,980px)] w-full max-w-[min(96vw,1640px)] flex-col overflow-hidden border-white/10">
                        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--skin-accent-color)]">Gerar Legado</p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Placa e projecao horizontal</h2>
                                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
                                    O historico continua vertical. O legado nasce aqui: a placa condensa a trajetoria e projeta a linha Era por Era, ciclo por ciclo.
                                </p>
                            </div>
                            <div className="flex shrink-0 gap-3">
                                <button type="button" onClick={onClose} className="rounded-xl luxe-button-secondary px-4 py-3 text-xs">Fechar</button>
                                <button
                                    type="button"
                                    onClick={() => { void onExportRecord?.(); }}
                                    className="rounded-xl luxe-button-secondary px-4 py-3 text-xs"
                                >
                                    Registro completo
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportLegacyImage}
                                    disabled={isExporting}
                                    className="rounded-xl luxe-skin-button px-4 py-3 text-xs disabled:opacity-50"
                                >
                                    {isExporting ? 'EXPORTANDO...' : 'Baixar legado'}
                                </button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            <div style={{ transform: plaqueTransform, transition: isShaking ? 'none' : 'transform 260ms ease' }}>
                                <LegacyProjectionScene
                                    eras={eras}
                                    sovereignName={sovereignName}
                                    projectionActive={projectionActive}
                                    interactive
                                    onActivatePlaque={handleActivatePlaque}
                                    onOpenCycle={onOpenCycle}
                                    onOpenEra={onOpenEra}
                                />
                            </div>
                        </div>
                    </GlassCard>
                </div>

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
