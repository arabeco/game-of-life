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
            className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[10000] transition-all duration-700 pointer-events-none ${
                isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
            }`}
        >
            <div 
                className="bg-black/90 backdrop-blur-xl border px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 w-max max-w-[400px] overflow-hidden relative group"
                style={{ 
                    borderColor: 'var(--skin-accent-color)', 
                    borderWidth: '0.5px',
                    boxShadow: '0 4px 15px -5px rgba(0,0,0,0.8), 0 0 8px var(--sephirot-glow-color)'
                }}
            >
                {/* Subtle internal glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--skin-accent-color)]/5 to-transparent pointer-events-none" />
                
                <div className="flex items-center justify-center w-5 h-5 rounded-lg bg-[var(--skin-accent-color)]/10 border border-[var(--skin-accent-color)]/30 shadow-[0_0_8px_var(--sephirot-glow-color)] shrink-0 self-start mt-0.5">
                    <span className="text-[var(--skin-accent-color)] text-[10px] animate-pulse drop-shadow-[0_0_2px_var(--skin-accent-color)]">✦</span>
                </div>
                
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-white font-black text-[9px] tracking-[0.1em] uppercase font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] leading-tight break-words whitespace-pre-line text-left">
                        {message}
                    </span>
                </div>
            </div>
        </div>
    );
};
