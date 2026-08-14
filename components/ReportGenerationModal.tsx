import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { VideoPlayer } from './VideoPlayer';
import { emitAppSensoryCue } from '../utils/sensoryCue';

interface ReportGenerationModalProps {
    onFinish: () => Promise<unknown> | void;
    onComplete: () => void;
}

const PHRASES = [
    { threshold: 20, text: 'Consultando registros...' },
    { threshold: 40, text: 'Analisando arenas...' },
    { threshold: 60, text: 'Contabilizando acoes...' },
    { threshold: 80, text: 'Calculando resultado...' },
    { threshold: 100, text: 'Selando ciclo...' },
];

const EXPECTED_VIDEO_DURATION_MS = 5000;
const MIN_SEAL_DURATION_MS = 1800;
const VIDEO_FALLBACK_DURATION_MS = 5600;
const EXIT_DURATION_MS = 360;

export const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({ onFinish, onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isFinishing, setIsFinishing] = useState(true);
    const [finishError, setFinishError] = useState<string | null>(null);
    const startedRef = useRef(false);
    const onFinishRef = useRef(onFinish);
    const onCompleteRef = useRef(onComplete);
    const videoCompletionRef = useRef<{ promise: Promise<void>; resolve: () => void } | null>(null);
    if (!videoCompletionRef.current) {
        let resolveVideo = () => {};
        const promise = new Promise<void>((resolve) => {
            resolveVideo = resolve;
        });
        videoCompletionRef.current = { promise, resolve: resolveVideo };
    }

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        let isMounted = true;
        let animationFrame = 0;
        const startedAt = performance.now();
        emitAppSensoryCue('cycle_seal_start');

        const animateProgress = (now: number) => {
            if (!isMounted) return;
            const elapsedRatio = Math.min(1, (now - startedAt) / EXPECTED_VIDEO_DURATION_MS);
            const easedRatio = 1 - Math.pow(1 - elapsedRatio, 2.4);
            setProgress(Math.min(92, easedRatio * 92));
            animationFrame = window.requestAnimationFrame(animateProgress);
        };
        animationFrame = window.requestAnimationFrame(animateProgress);

        const finalize = async () => {
            try {
                await Promise.all([
                    Promise.resolve(onFinishRef.current()),
                    new Promise((resolve) => window.setTimeout(resolve, MIN_SEAL_DURATION_MS)),
                    videoCompletionRef.current?.promise,
                ]);
                if (!isMounted) return;

                window.cancelAnimationFrame(animationFrame);
                setProgress(100);
                setIsReady(true);
                setIsFinishing(false);
                await new Promise((resolve) => window.setTimeout(resolve, 260));
                if (!isMounted) return;

                setIsClosing(true);
                await new Promise((resolve) => window.setTimeout(resolve, EXIT_DURATION_MS));
                if (isMounted) onCompleteRef.current();
            } catch (error) {
                console.error('Erro ao finalizar geracao do relatorio:', error);
                if (isMounted) {
                    window.cancelAnimationFrame(animationFrame);
                    setFinishError('Nao foi possivel selar o ciclo. Tente novamente.');
                    setIsClosing(false);
                    setIsFinishing(false);
                }
            }
        };

        void finalize();
        return () => {
            isMounted = false;
            window.cancelAnimationFrame(animationFrame);
        };
    }, []);

    const currentPhrase = useMemo(() => {
        if (finishError) return finishError;
        if (isReady) return 'Ciclo selado';
        if (isFinishing && progress > 91) return 'Confirmando registro...';
        return PHRASES.find((phrase) => progress <= phrase.threshold)?.text || 'Ciclo pronto';
    }, [finishError, isFinishing, isReady, progress]);

    return (
        <Portal>
            <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'animate-fade-in opacity-100'}`}>
                <GlassCard className={`relative aspect-[9/16] w-full max-w-[280px] overflow-hidden border-[var(--skin-accent-color)]/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-300 ${isClosing ? 'scale-[0.985] opacity-0' : 'scale-100 opacity-100'}`}>
                    <VideoPlayer
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/report_seal.mp4`}
                        onEnd={() => videoCompletionRef.current?.resolve()}
                        className="h-full w-full object-cover"
                        placeholderLabel="Sincronizando..."
                        duration={EXPECTED_VIDEO_DURATION_MS}
                        playbackRate={1}
                        startTime={0}
                        maxDuration={VIDEO_FALLBACK_DURATION_MS}
                        preload="auto"
                    />

                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-6">
                        <div className="space-y-3">
                            <p className="animate-pulse text-center text-[10px] font-black uppercase tracking-[0.3em] text-[var(--skin-accent-color)] drop-shadow-lg">
                                {currentPhrase}
                            </p>
                            <div className="h-1 w-full overflow-hidden rounded-full border border-white/5 bg-black/40 backdrop-blur-sm">
                                <div
                                    className="h-full bg-[var(--skin-accent-color)] shadow-[0_0_8px_var(--skin-accent-color)] transition-[width] duration-150 ease-out"
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
