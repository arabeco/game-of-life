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
    const hasEndedRef = useRef(false);

    const handleEnd = () => {
        if (hasEndedRef.current) return;
        hasEndedRef.current = true;
        onEnd();
    };

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

    if (!src || hasError) {
        return (
            <div className={`flex flex-col items-center justify-center bg-black text-gray-400 ${className}`}>
                <div className="w-16 h-16 border-4 border-gray-600 border-t-white rounded-full animate-spin mb-4" />
                <p className="text-sm font-mono animate-pulse">{placeholderLabel}</p>
            </div>
        );
    }

    return (
        <div className={`relative bg-black transform-gpu ${className}`}>
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
                preload={preload}
                loop={loop}
                onEnded={handleEnd}
                onError={handleError}
                controls={false}
                disablePictureInPicture
            />
        </div>
    );
};

