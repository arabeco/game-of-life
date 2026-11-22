import React, { useState, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { Portal } from './Portal';
import { hasActivePersistedRestScreenActionSession } from '../utils/restScreenActionSession';
import { consumeNativeBackgroundSplashHint } from '../utils/appResumeSplashHint';

interface SplashScreenProps {
    onComplete: () => void;
    isLoading?: boolean;
    /** A troca Imersivo/Essencial: toca o video mesmo com acao rodando ou volta do fundo pendente. */
    sempreComVideo?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, isLoading, sempreComVideo }) => {
    const [preferQuietResume] = useState(() => !sempreComVideo && (consumeNativeBackgroundSplashHint() || hasActivePersistedRestScreenActionSession()));
    /*
     * UMA TELA SO ATE O APP ESTAR PRONTO (22/11/2026, com o Afonso).
     *
     * A abertura tinha teto de 5,2s e saia mesmo com o app ainda carregando:
     * por baixo apareciam "Preparando o ambiente" e depois "Carregando", tres
     * telas de espera seguidas. Agora o video (ou a logo, na volta do fundo)
     * fica ate o app estar pronto, com a barrinha andando devagar, e so entao
     * some. O teto vira uma rede de seguranca longa: se algo travar, o app
     * aparece com o aviso dele em vez de a abertura prender a pessoa.
     */
    const splashMaxDuration = preferQuietResume ? 0 : 5200;
    const splashSafetyCap = 20000;
    const splashFadeDuration = preferQuietResume ? 260 : 520;
    const splashMinDuration = 0;
    const [progress, setProgress] = useState(0);
    const [videoEnded, setVideoEnded] = useState(false);
    const [maxTimeReached, setMaxTimeReached] = useState(false);
    const [safetyCapReached, setSafetyCapReached] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [minTimeReached, setMinTimeReached] = useState(true);
    const videoSrc = preferQuietResume ? undefined : '/videos/intro.mp4';
    const shouldHideProgress = isFadingOut || (!isLoading && !videoEnded && !maxTimeReached);

    // A barrinha anda rapido no comeco e cada vez mais devagar perto do fim,
    // entao nunca parece parada enquanto espera; so chega a 100 quando sai.
    useEffect(() => {
        if (isFadingOut) return;
        const interval = window.setInterval(() => {
            setProgress((prev) => Math.min(94, prev + Math.max(0.04, (94 - prev) * 0.008)));
        }, 45);
        return () => window.clearInterval(interval);
    }, [isFadingOut]);

    useEffect(() => {
        if (splashMaxDuration <= 0) { setMaxTimeReached(true); return; }
        const timer = window.setTimeout(() => setMaxTimeReached(true), splashMaxDuration);
        return () => window.clearTimeout(timer);
    }, [splashMaxDuration]);

    useEffect(() => {
        const timer = window.setTimeout(() => setSafetyCapReached(true), splashSafetyCap);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (splashMinDuration <= 0) {
            setMinTimeReached(true);
            return;
        }

        const timer = window.setTimeout(() => {
            setMinTimeReached(true);
        }, splashMinDuration);

        return () => {
            window.clearTimeout(timer);
        };
    }, [splashMinDuration]);

    useEffect(() => {
        if (preferQuietResume) {
            setVideoEnded(true);
        }
    }, [preferQuietResume]);

    useEffect(() => {
        if (!minTimeReached || isFadingOut) return;
        const aberturaTerminou = videoEnded || maxTimeReached;
        if (!safetyCapReached && (!aberturaTerminou || isLoading)) return;
        setProgress(100);
        setIsFadingOut(true);
    }, [isFadingOut, isLoading, maxTimeReached, minTimeReached, safetyCapReached, videoEnded]);

    useEffect(() => {
        if (!isFadingOut) return;

        const completeTimeout = window.setTimeout(onComplete, splashFadeDuration);
        return () => window.clearTimeout(completeTimeout);
    }, [isFadingOut, onComplete, splashFadeDuration]);

    const handleVideoEnd = () => {
        setVideoEnded(true);
    };

    return (
        <Portal>
            <div
                className={`fixed inset-0 z-[10000] bg-black flex items-center justify-center transition-all ease-out ${preferQuietResume ? 'duration-300' : 'duration-500'} ${isFadingOut ? 'opacity-0 scale-[0.992] pointer-events-none' : 'opacity-100 scale-100'}`}
            >
                <div className="relative w-full max-w-[300px] aspect-[9/16] max-h-[60vh] bg-black rounded-2xl overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.45)] border border-white/5">
                    {preferQuietResume || (videoEnded && isLoading) ? (
                        <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,#120d09_0%,#050505_48%,#000000_100%)]">
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_58%)]" />
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_30%,rgba(0,0,0,0.18)_100%)]" />
                                <div className="absolute left-1/2 top-[44%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,215,0,0.14),transparent_68%)] blur-3xl" />
                            </div>
                            <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
                                <div className="relative h-24 w-24">
                                    <img src="/logo-diamond.png" alt="GLYPH" className="h-full w-full drop-shadow-[0_0_24px_rgba(255,215,0,0.28)]" />
                                    <div className="absolute inset-0 opacity-85">
                                        <img src="/logo-core.png" alt="" className="h-full w-full" />
                                    </div>
                                </div>
                                {/* Volta do fundo: so a logo, sem texto de "retomando" (22/11/2026). */}
                            </div>
                        </div>
                    ) : (
                        <VideoPlayer
                            src={videoSrc}
                            onEnd={handleVideoEnd}
                            className="w-full h-full object-cover"
                            placeholderLabel=""
                            duration={1500}
                            maxDuration={splashMaxDuration}
                            playbackRate={1.0}
                            preload="auto"
                        />
                    )}
                </div>

                <div className={`absolute bottom-10 left-10 right-10 z-[10001] max-w-md mx-auto transition-opacity duration-500 ${shouldHideProgress ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="flex justify-between text-[10px] font-mono text-white/50 mb-1 uppercase tracking-widest">
                        <span>Sincronizando...</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full shadow-[0_0_12px_rgba(255,215,0,0.45)] transition-all duration-150 ease-out relative overflow-hidden"
                            style={{
                                width: `${progress}%`,
                                background: 'linear-gradient(90deg, #C5A000 0%, #FFD700 50%, #C5A000 100%)'
                            }}
                        >
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
