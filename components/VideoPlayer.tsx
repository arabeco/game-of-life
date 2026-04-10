import React, { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
    src?: string;
    onEnd: () => void;
    className?: string;
    placeholderLabel?: string;
    duration?: number;
    playbackRate?: number;
    startTime?: number;
    maxDuration?: number;
    loop?: boolean;
    audioFadeOut?: boolean;
    preload?: 'none' | 'metadata' | 'auto';
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    src,
    onEnd,
    className = '',
    placeholderLabel = 'Playing Video...',
    duration = 4000,
    playbackRate = 1.0,
    startTime = 0,
    maxDuration,
    loop = false,
    audioFadeOut = false,
    preload = 'metadata',
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasError, setHasError] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const hasEndedRef = useRef(false);

    const handleEnd = () => {
        if (hasEndedRef.current) return;
        hasEndedRef.current = true;
        onEnd();
    };

    useEffect(() => {
        setHasError(false);
        setIsReady(false);
        hasEndedRef.current = false;
    }, [src]);

    useEffect(() => {
        if (!videoRef.current) return;

        videoRef.current.muted = true;
        videoRef.current.defaultMuted = true;
        videoRef.current.volume = 0;
        videoRef.current.playbackRate = playbackRate;
        if (startTime > 0 && videoRef.current.currentTime === 0) {
            videoRef.current.currentTime = startTime;
        }

        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch((error) => {
                console.warn('Auto-play was prevented:', error);
            });
        }
    }, [playbackRate, startTime, src]);

    useEffect(() => {
        if (!src || hasError) {
            const timer = window.setTimeout(handleEnd, duration);
            return () => window.clearTimeout(timer);
        }
    }, [src, hasError, duration]);

    useEffect(() => {
        if (src && maxDuration && !hasError) {
            const timer = window.setTimeout(handleEnd, maxDuration);
            return () => window.clearTimeout(timer);
        }
    }, [src, maxDuration, hasError]);

    const handleError = () => {
        console.warn(`Failed to load video: ${src}`);
        setHasError(true);
    };

    const handleReady = () => {
        setIsReady(true);
    };

    if (!src || hasError) {
        return (
            <div className={`flex flex-col items-center justify-center bg-black text-gray-400 ${className}`}>
                <div className="w-16 h-16 border-4 border-gray-600 border-t-white rounded-full animate-spin mb-4" />
                {placeholderLabel ? <p className="text-sm font-mono animate-pulse">{placeholderLabel}</p> : null}
            </div>
        );
    }

    return (
        <div className={`relative bg-black transform-gpu ${className}`}>
            {!isReady && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,#050505_0%,#000000_100%)] text-gray-300">
                    <div className="mb-4 h-14 w-14 animate-pulse rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(255,215,0,0.18),transparent_72%)] shadow-[0_0_28px_rgba(255,215,0,0.18)]" />
                    {placeholderLabel ? (
                        <p className="text-[11px] font-black uppercase tracking-[0.34em] text-white/50">{placeholderLabel}</p>
                    ) : null}
                </div>
            )}
            <video
                ref={videoRef}
                src={src}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}
                autoPlay
                playsInline
                muted
                preload={preload}
                loop={loop}
                onEnded={handleEnd}
                onError={handleError}
                onLoadedData={handleReady}
                onCanPlay={handleReady}
                controls={false}
                disablePictureInPicture
            />
        </div>
    );
};

