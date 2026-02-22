import React, { useEffect, useState } from 'react';

interface GoldenToastProps {
    message: string;
    duration?: number;
    onClose: () => void;
}

export const GoldenToast: React.FC<GoldenToastProps> = ({ message, duration = 4000, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Fade in
        const timerIn = setTimeout(() => setIsVisible(true), 50);
        
        // Auto close
        const timerOut = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 500); // Wait for fade out
        }, duration);

        return () => {
            clearTimeout(timerIn);
            clearTimeout(timerOut);
        };
    }, [duration, onClose]);

    return (
        <div 
            className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-500 pointer-events-none ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
            <div className="bg-black/80 backdrop-blur-md border border-[var(--skin-accent-color)]/30 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.15)] flex items-center gap-3">
                <span className="text-[var(--skin-accent-color)] text-lg animate-pulse">✦</span>
                <span className="text-[var(--skin-accent-color)] font-medium text-xs tracking-wider uppercase font-mono">
                    {message}
                </span>
            </div>
        </div>
    );
};
