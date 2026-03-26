import React from 'react';
import { Portal } from './Portal';
import { GlassCard } from './GlassCard';
import { exportElementAsImage, shareElementWithFeedback, shouldPreferNativeShare } from './Share';
import { LegacyPlaqueArtifact } from './LegacyPlaqueArtifact';
import type { LegacyEraSummary } from './LegacyExportDocument';

interface LegacyPlaqueModalProps {
    eras: LegacyEraSummary[];
    sovereignName: string;
    plaqueForged: boolean;
    shareUnlocked: boolean;
    onClose: () => void;
    onToast: (message: string) => void;
}

const PLAQUE_CAPTURE_ID = 'legacy-plaque-artifact-capture';

export const LegacyPlaqueModal: React.FC<LegacyPlaqueModalProps> = ({ eras, sovereignName, plaqueForged, shareUnlocked, onClose, onToast }) => {
    const preferNativeShare = shouldPreferNativeShare();
    const allowNativeShare = preferNativeShare && shareUnlocked;

    const handleExport = async () => {
        try {
            if (allowNativeShare) {
                onToast('Preparando compartilhamento da placa...');
            }
            const result = await exportElementAsImage(PLAQUE_CAPTURE_ID, {
                fileName: `glyph-placa-do-legado-${new Date().toISOString().slice(0, 10)}.png`,
                title: `Placa do Legado - ${sovereignName}`,
                backgroundColor: '#0a0907',
                preferShare: allowNativeShare,
            });
            onToast(
                result === 'shared'
                    ? 'Placa do Legado compartilhada.'
                    : result === 'cancelled'
                        ? 'Compartilhamento cancelado.'
                        : 'Placa do Legado exportada.'
            );
        } catch (error) {
            console.error('Erro ao exportar a Placa do Legado:', error);
            onToast('Nao foi possivel exportar a Placa do Legado.');
        }
    };

    const handleSharePlaque = async () => {
        await shareElementWithFeedback(
            (message) => onToast(message),
            PLAQUE_CAPTURE_ID,
            {
                title: `Placa do Legado - ${sovereignName}`,
                preparingMessage: 'Preparando compartilhamento da placa...',
                sharedMessage: 'Placa do Legado compartilhada.',
                cancelledMessage: 'Compartilhamento cancelado.',
                errorMessage: 'Nao foi possivel preparar a Placa do Legado para compartilhar.',
            }
        );
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/88 backdrop-blur-xl" onClick={onClose}>
                <GlassCard variant="neutral" className="m-4 w-full max-w-3xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
                    <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--skin-accent-color)]">Placa do Legado</p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight">Artefato final da trajetoria</h2>
                                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
                                    Registro fisico e visual do Glyph. A mesma placa pode virar export, share e ritual raro de consagracao.
                                </p>
                            </div>
                            <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${plaqueForged ? 'border-amber-300/30 bg-amber-400/10 text-amber-100' : 'border-white/10 bg-white/5 text-gray-400'}`}>
                                {plaqueForged ? 'Forjada' : 'Nao forjada'}
                            </div>
                        </div>

                        <div className="mt-6">
                            <LegacyPlaqueArtifact
                                id={PLAQUE_CAPTURE_ID}
                                eras={eras}
                                sovereignName={sovereignName}
                                plaqueUnlocked={true}
                                compact={false}
                            />
                        </div>

                        <div className="mt-5 flex gap-3">
                            <button type="button" onClick={onClose} className="flex-1 rounded-xl luxe-button-secondary py-3 text-xs">Fechar</button>
                            {shareUnlocked && <button type="button" onClick={handleSharePlaque} className="flex-1 rounded-xl luxe-button-secondary py-3 text-xs">Compartilhar legado</button>}
                            <button id="legacy-plaque-export-button" type="button" onClick={handleExport} className="flex-1 rounded-xl luxe-skin-button py-3 text-xs">{allowNativeShare ? 'Compartilhar Placa' : 'Baixar Placa'}</button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
