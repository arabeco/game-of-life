import React, { useEffect, useMemo, useState } from 'react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { VideoPlayer } from './VideoPlayer';

interface LegacyGenerationModalProps {
    onComplete: () => Promise<void> | void;
    onClose: () => void;
}

const PHRASES = [
    { threshold: 18, text: 'Consultando historico...' },
    { threshold: 38, text: 'Agrupando eras...' },
    { threshold: 58, text: 'Condensando ciclos...' },
    { threshold: 78, text: 'Acionando a placa...' },
    { threshold: 100, text: 'Projetando legado...' },
];

export const LegacyGenerationModal: React.FC<LegacyGenerationModalProps> = ({ onComplete, onClose }) => {
    const [progress, setProgress] = useState(0);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const duration = 6800;
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

            await new Promise((resolve) => window.setTimeout(resolve, 320));

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
    }, [isClosing, isFinalizing, onClose, onComplete, progress]);

    const currentPhrase = useMemo(() => {
        if (isFinalizing) return 'Abrindo linha de projecao...';
        return PHRASES.find((phrase) => progress <= phrase.threshold)?.text || 'Legado pronto';
    }, [isFinalizing, progress]);

    return (
        <Portal>
            <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'animate-fade-in opacity-100'}`}>
                <GlassCard className={`relative aspect-[9/16] w-full max-w-[300px] overflow-hidden border-[var(--skin-accent-color)]/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-300 ${isClosing ? 'scale-[0.985] opacity-0' : 'scale-100 opacity-100'}`}>
                    <VideoPlayer
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/legado.mp4`}
                        onEnd={() => {}}
                        className="h-full w-full object-cover"
                        videoClassName="scale-[1.08]"
                        placeholderLabel="Projetando legado..."
                        duration={6500}
                        playbackRate={0.9}
                        startTime={0}
                        preload="auto"
                    />

                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/10 to-transparent p-6">
                        <div className="space-y-3">
                            <p className="animate-pulse text-center text-[10px] font-black uppercase tracking-[0.3em] text-[var(--skin-accent-color)] drop-shadow-lg">
                                {currentPhrase}
                            </p>
                            <div className="h-1 w-full overflow-hidden rounded-full border border-white/5 bg-black/40 backdrop-blur-sm">
                                <div
                                    className="h-full bg-[var(--skin-accent-color)] shadow-[0_0_8px_var(--skin-accent-color)] transition-all duration-100 ease-linear"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-center text-[10px] uppercase tracking-[0.25em] text-gray-400">
                                Preparando a projecao horizontal do legado
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
