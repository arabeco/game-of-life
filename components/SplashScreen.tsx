import React, { useState, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { Portal } from './Portal';

interface SplashScreenProps {
    onComplete: () => void;
    isLoading?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, isLoading }) => {
    const videoSrc = '/videos/intro.mp4';
    const splashFadeStart = 3200;
    const splashMaxDuration = 3600;
    const [progress, setProgress] = useState(0);
    const [videoEnded, setVideoEnded] = useState(false);
    const [maxTimeReached, setMaxTimeReached] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
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
        const fadeTimer = window.setTimeout(() => {
            setProgress(100);
            setIsFadingOut(true);
        }, splashFadeStart);
        const timer = window.setTimeout(() => {
            setMaxTimeReached(true);
        }, splashMaxDuration);

        return () => {
            window.clearTimeout(fadeTimer);
            window.clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        if (!videoEnded && !maxTimeReached) return;
        setProgress(100);
        setIsFadingOut(true);
    }, [videoEnded, maxTimeReached]);

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
                    <VideoPlayer
                        src={videoSrc}
                        onEnd={handleVideoEnd}
                        className="w-full h-full object-cover"
                        placeholderLabel="GOL 1.0"
                        duration={1500}
                        maxDuration={splashMaxDuration}
                        playbackRate={1.0}
                        preload="metadata"
                    />
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
