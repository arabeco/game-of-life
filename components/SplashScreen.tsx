import React, { useState, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { Portal } from './Portal';
import { hasActivePersistedRestScreenActionSession } from '../utils/restScreenActionSession';
import { hasRecentActiveMediaHint } from '../utils/mediaResumeHint';

interface SplashScreenProps {
    onComplete: () => void;
    isLoading?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, isLoading }) => {
    const splashMaxDuration = 5200;
    const [progress, setProgress] = useState(0);
    const [videoEnded, setVideoEnded] = useState(false);
    const [maxTimeReached, setMaxTimeReached] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [preferQuietResume] = useState(() => hasRecentActiveMediaHint() || hasActivePersistedRestScreenActionSession());
    const videoSrc = preferQuietResume ? undefined : '/videos/intro.mp4';
    const shouldHideProgress = isFadingOut || (!isLoading && !videoEnded && !maxTimeReached);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setProgress((prev) => {
                if (videoEnded || maxTimeReached) {
                    return 100;
                }

                const cappedProgress = 94;
                if (prev >= cappedProgress) {
                    return cappedProgress;
                }

                return Math.min(cappedProgress, prev + 1.4);
            });
        }, 45);

        return () => window.clearInterval(interval);
    }, [isLoading, videoEnded, maxTimeReached]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setMaxTimeReached(true);
        }, splashMaxDuration);

        return () => {
            window.clearTimeout(timer);
        };
    }, [splashMaxDuration]);

    useEffect(() => {
        if (preferQuietResume) {
            setVideoEnded(true);
        }
    }, [preferQuietResume]);

    useEffect(() => {
        if (!maxTimeReached && (!videoEnded || isLoading)) return;
        setProgress(100);
        setIsFadingOut(true);
    }, [isLoading, videoEnded, maxTimeReached]);

    useEffect(() => {
        if (!isFadingOut) return;

        const completeTimeout = window.setTimeout(onComplete, 520);
        return () => window.clearTimeout(completeTimeout);
    }, [isFadingOut, onComplete]);

    const handleVideoEnd = () => {
        setVideoEnded(true);
    };

    return (
        <Portal>
            <div
                className={`fixed inset-0 z-[10000] bg-black flex items-center justify-center transition-all duration-500 ease-out ${isFadingOut ? 'opacity-0 scale-[0.985] pointer-events-none' : 'opacity-100 scale-100'}`}
            >
                <div className="relative w-full max-w-[300px] aspect-[9/16] max-h-[60vh] bg-black rounded-2xl overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.45)] border border-white/5">
                    {preferQuietResume ? (
                        <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,#050505_0%,#000000_100%)]">
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_62%)]" />
                                <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,215,0,0.10),transparent_68%)] blur-3xl" />
                            </div>
                            <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
                                <div className="relative h-20 w-20">
                                    <img src="/logo-diamond.png" alt="GLYPH" className="h-full w-full drop-shadow-[0_0_18px_rgba(255,215,0,0.24)]" />
                                    <div className="absolute inset-0 animate-spin-slow opacity-80">
                                        <img src="/logo-core.png" alt="" className="h-full w-full" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.34em] text-white/55">Retomando</p>
                                    <p className="text-sm font-medium text-white/80">Sessao silenciosa para nao cortar sua musica.</p>
                                </div>
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
