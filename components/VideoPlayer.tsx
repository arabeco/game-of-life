import React, { useEffect, useRef, useState } from 'react';
import { XIcon } from './Icons';

interface VideoPlayerProps {
    src?: string;
    onEnd: () => void;
    className?: string;
    placeholderLabel?: string;
    duration?: number; // Duration for placeholder
    playbackRate?: number; // Control video speed (default 1.0)
    startTime?: number; // Start playing from this time (in seconds)
    maxDuration?: number; // Force end after this duration (safety timeout)
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    src,
    onEnd,
    className = "",
    placeholderLabel = "Playing Video...",
    duration = 4000,
    playbackRate = 1.0,
    startTime = 0,
    maxDuration
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
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackRate;
            // Only set currentTime once on mount if startTime > 0 to avoid loops
            if (startTime > 0 && videoRef.current.currentTime === 0) {
                videoRef.current.currentTime = startTime;
            }

            // Ensure play is triggered
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Auto-play was prevented:", error);
                    // Fallback handled by user interaction or just visual placeholder if needed
                });
            }
        }
    }, [playbackRate, startTime, src]);

    // Placeholder timeout
    useEffect(() => {
        if (!src || hasError) {
            const timer = setTimeout(handleEnd, duration);
            return () => clearTimeout(timer);
        }
    }, [src, hasError, duration]);

    // Safety timeout for video if maxDuration is provided
    useEffect(() => {
        if (src && maxDuration && !hasError) {
            const timer = setTimeout(handleEnd, maxDuration);
            return () => clearTimeout(timer);
        }
    }, [src, maxDuration, hasError]);

    const handleError = () => {
        console.warn(`Failed to load video: ${src}`);
        setHasError(true);
    };

    if (!src || hasError) {
        return (
            <div className={`flex flex-col items-center justify-center bg-black text-gray-400 ${className}`}>
                <div className="w-16 h-16 border-4 border-gray-600 border-t-white rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-mono animate-pulse">{placeholderLabel}</p>
            </div>
        );
    }

    return (
        <div className={`relative bg-black ${className}`}>
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
                preload="none"
                onEnded={handleEnd}
                onError={handleError}
                controls={false}
            />
        </div>
    );
};
