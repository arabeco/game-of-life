import React, { useEffect, useMemo, useState } from 'react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { VideoPlayer } from './VideoPlayer';

interface LegacyGenerationModalProps {
    onComplete: () => Promise<void> | void;
    onClose: () => void;
}

const PHRASES = [
    { threshold: 18, text: 'Consultando eras...' },
    { threshold: 38, text: 'Agrupando ciclos...' },
    { threshold: 58, text: 'Condensando acoes dominantes...' },
    { threshold: 78, text: 'Calculando score historico...' },
    { threshold: 100, text: 'Selando registro de soberania...' },
];

export const LegacyGenerationModal: React.FC<LegacyGenerationModalProps> = ({ onComplete, onClose }) => {
    const [progress, setProgress] = useState(0);
    const [isFinalizing, setIsFinalizing] = useState(false);

    useEffect(() => {
        const duration = 6800;
        const intervalTime = 50;
        const steps = duration / intervalTime;
        const increment = 100 / steps;

        const timer = window.setInterval(() => {
            setProgress((prev) => {
                const next = prev + increment;
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
        if (progress < 100 || isFinalizing) return;

        let isMounted = true;
        const finalize = async () => {
            setIsFinalizing(true);
            try {
                await onComplete();
            } finally {
                if (isMounted) {
                    onClose();
                }
            }
        };

        finalize();

        return () => {
            isMounted = false;
        };
    }, [progress, isFinalizing, onComplete, onClose]);

    const currentPhrase = useMemo(() => {
        if (isFinalizing) return 'Gravando registro final...';
        return PHRASES.find((phrase) => progress <= phrase.threshold)?.text || 'Legado pronto';
    }, [isFinalizing, progress]);

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] flex items-center justify-center animate-fade-in">
                <GlassCard className="w-full max-w-[300px] aspect-[9/16] relative overflow-hidden border-[var(--skin-accent-color)]/30 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                    <VideoPlayer
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/legado.mp4`}
                        onEnd={() => {}}
                        className="w-full h-full object-cover"
                        placeholderLabel="Selando legado..."
                        duration={6500}
                        playbackRate={0.9}
                        startTime={0}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent pointer-events-none flex flex-col justify-end p-6">
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--skin-accent-color)] text-center animate-pulse drop-shadow-lg">
                                {currentPhrase}
                            </p>
                            <div className="w-full bg-black/40 h-1 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
                                <div
                                    className="h-full bg-[var(--skin-accent-color)] transition-all duration-100 ease-linear shadow-[0_0_8px_var(--skin-accent-color)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-center text-gray-400 uppercase tracking-[0.25em]">
                                Registro de soberania em consolidacao
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
