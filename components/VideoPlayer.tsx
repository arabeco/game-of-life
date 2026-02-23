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
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
    src, 
    onEnd, 
    className = "", 
    placeholderLabel = "Playing Video...",
    duration = 4000,
    playbackRate = 1.0,
    startTime = 0
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackRate;
            // Only set currentTime once on mount if startTime > 0 to avoid loops
            if (startTime > 0 && videoRef.current.currentTime === 0) {
                videoRef.current.currentTime = startTime;
            }
        }
    }, [playbackRate, startTime]);

    useEffect(() => {
        if (!src || hasError) {
            const timer = setTimeout(onEnd, duration);
            return () => clearTimeout(timer);
        }
    }, [src, hasError, duration, onEnd]);

    const handleError = () => {
        console.warn(`Failed to load video: ${src}`);
        setHasError(true);
    };

    if (!src || hasError) {
        return (
            <div className={`flex flex-col items-center justify-center bg-black text-gray-400 ${className}`}>
                <div className="w-16 h-16 border-4 border-gray-600 border-t-white rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-mono animate-pulse">{placeholderLabel}</p>
                <button onClick={onEnd} className="mt-8 text-xs text-gray-600 hover:text-white transition-colors">
                    (Skip - Placeholder)
                </button>
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
                onEnded={onEnd}
                onError={handleError}
                controls={false}
            />
            {/* Hidden skip for dev/emergency */}
            <button 
                onClick={onEnd}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/60 rounded-full text-white/20 hover:text-white transition-colors z-50"
            >
                <XIcon className="w-4 h-4" />
            </button>
        </div>
    );
};
