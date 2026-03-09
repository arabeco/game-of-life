import React, { useEffect, useMemo, useState } from 'react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { VideoPlayer } from './VideoPlayer';

interface ReportGenerationModalProps {
    onFinish: () => Promise<void> | void;
}

const PHRASES = [
    { threshold: 20, text: 'Consultando registros...' },
    { threshold: 40, text: 'Analisando arenas...' },
    { threshold: 60, text: 'Contabilizando acoes...' },
    { threshold: 80, text: 'Calculando score...' },
    { threshold: 100, text: 'Selando pergaminho...' },
];

export const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({ onFinish }) => {
    const [progress, setProgress] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    const [finishError, setFinishError] = useState<string | null>(null);

    useEffect(() => {
        const duration = 6000;
        const intervalTime = 50;
        const steps = duration / intervalTime;
        const increment = 100 / steps;

        const timer = window.setInterval(() => {
            setProgress((previous) => {
                const next = previous + increment;
                if (next >= 100) {
                    window.clearInterval(timer);
                    setIsReady(true);
                    return 100;
                }
                return next;
            });
        }, intervalTime);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!isReady || isFinishing) return;

        let isMounted = true;
        const finalize = async () => {
            setIsFinishing(true);
            setIsClosing(true);
            await new Promise((resolve) => window.setTimeout(resolve, 320));

            try {
                await onFinish();
            } catch (error) {
                console.error('Erro ao finalizar geracao do relatorio:', error);
                if (isMounted) {
                    setFinishError('Nao foi possivel abrir o relatorio.');
                    setIsClosing(false);
                    setIsFinishing(false);
                }
            }
        };

        finalize();

        return () => {
            isMounted = false;
        };
    }, [isFinishing, isReady, onFinish]);

    const currentPhrase = useMemo(() => {
        if (finishError) return finishError;
        if (isFinishing) return 'Abrindo relatorio...';
        return PHRASES.find((phrase) => progress <= phrase.threshold)?.text || 'Relatorio pronto';
    }, [finishError, isFinishing, progress]);

    return (
        <Portal>
            <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'animate-fade-in opacity-100'}`}>
                <GlassCard className={`relative aspect-[9/16] w-full max-w-[280px] overflow-hidden border-[var(--skin-accent-color)]/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-300 ${isClosing ? 'scale-[0.985] opacity-0' : 'scale-100 opacity-100'}`}>
                    <VideoPlayer
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/report_seal.mp4`}
                        onEnd={() => {}}
                        className="h-full w-full object-cover"
                        placeholderLabel="Sincronizando..."
                        duration={5000}
                        playbackRate={0.85}
                        startTime={0.5}
                        preload="auto"
                    />

                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-6">
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
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
