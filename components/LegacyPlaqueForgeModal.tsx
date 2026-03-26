import React, { useEffect, useMemo, useState } from 'react';
import { Portal } from './Portal';
import { GlassCard } from './GlassCard';
import { LegacyPlaqueArtifact } from './LegacyPlaqueArtifact';
import type { LegacyEraSummary } from './LegacyExportDocument';

interface LegacyPlaqueForgeModalProps {
    eras: LegacyEraSummary[];
    sovereignName: string;
    onComplete: () => void;
    onClose: () => void;
}

const PHRASES = [
    { threshold: 20, text: 'Condensando a base...' },
    { threshold: 42, text: 'Organizando as Eras...' },
    { threshold: 66, text: 'Gravando score e memoria...' },
    { threshold: 88, text: 'Selando o registro...' },
    { threshold: 100, text: 'Placa do Legado pronta.' },
];

export const LegacyPlaqueForgeModal: React.FC<LegacyPlaqueForgeModalProps> = ({ eras, sovereignName, onComplete, onClose }) => {
    const [progress, setProgress] = useState(0);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const duration = 5400;
        const intervalTime = 50;
        const steps = duration / intervalTime;
        const increment = 100 / steps;

        const timer = window.setInterval(() => {
            setProgress((previous) => {
                const next = previous + increment;
                if (next >= 100) {
                    window.clearInterval(timer);
                    return 100;
                }
                return next;
            });
        }, intervalTime);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (progress < 100 || isFinalizing || isClosing) return;

        let isMounted = true;
        const finalize = async () => {
            setIsFinalizing(true);
            setIsClosing(true);
            await new Promise((resolve) => window.setTimeout(resolve, 420));
            if (!isMounted) return;
            onComplete();
            onClose();
        };

        finalize();
        return () => {
            isMounted = false;
        };
    }, [isClosing, isFinalizing, onClose, onComplete, progress]);

    const currentPhrase = useMemo(() => {
        if (isFinalizing) return 'Artefato estabilizado.';
        return PHRASES.find((phrase) => progress <= phrase.threshold)?.text || 'Placa pronta';
    }, [isFinalizing, progress]);

    return (
        <Portal>
            <div className={`fixed inset-0 z-[10002] flex items-center justify-center bg-black/92 backdrop-blur-xl transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
                <GlassCard variant="neutral" className={`relative m-4 max-h-[92vh] w-full max-w-4xl overflow-y-auto border-[var(--skin-accent-color)]/20 transition-all duration-500 ${isClosing ? 'scale-[0.985] opacity-0' : 'scale-100 opacity-100'}`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.14),_transparent_42%),radial-gradient(circle_at_center,_rgba(255,255,255,0.04),_transparent_60%)]" />
                    <div className="relative z-10 grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:p-8">
                        <div className="flex flex-col justify-between gap-5">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.38em] text-[var(--skin-accent-color)]">Placa do Legado</p>
                                <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Forjando o registro final</h2>
                                <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-300">
                                    Suas Eras estao sendo condensadas em uma unica placa. Depois disso, ela fica pronta para abrir e compartilhar quando voce quiser.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-100/90">{currentPhrase}</p>
                                <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/10 bg-black/40">
                                    <div
                                        className="h-full bg-[var(--skin-accent-color)] shadow-[0_0_12px_var(--skin-accent-color)] transition-all duration-100 ease-linear"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Preparando a placa final</p>
                            </div>
                        </div>

                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 rounded-[34px] bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.18),_transparent_55%)] blur-2xl" />
                            <div className="w-full max-w-[280px] sm:max-w-[520px]">
                                <LegacyPlaqueArtifact
                                    eras={eras}
                                    sovereignName={sovereignName}
                                    plaqueUnlocked={true}
                                    compact={true}
                                    className={`mx-auto transition-all duration-500 ${isClosing ? 'scale-[1.02] blur-[1px]' : 'scale-100'}`}
                                />
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
