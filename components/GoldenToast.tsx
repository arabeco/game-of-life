import React, { useEffect, useState } from 'react';

interface GoldenToastProps {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    onClose: () => void;
}

export const GoldenToast: React.FC<GoldenToastProps> = ({ message, type = 'info', duration = 4000, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    const chrome = type === 'success'
        ? {
            borderColor: 'rgba(212,175,55,0.72)',
            glow: '0 4px 15px -5px rgba(0,0,0,0.8), 0 0 10px rgba(212,175,55,0.34)',
            iconBg: 'rgba(212,175,55,0.10)',
            iconBorder: 'rgba(212,175,55,0.28)',
            iconColor: '#f3d37a',
        }
        : type === 'warning'
            ? {
                borderColor: 'rgba(196,143,86,0.72)',
                glow: '0 4px 15px -5px rgba(0,0,0,0.8), 0 0 10px rgba(196,143,86,0.28)',
                iconBg: 'rgba(196,143,86,0.10)',
                iconBorder: 'rgba(196,143,86,0.28)',
                iconColor: '#d6a46d',
            }
            : type === 'error'
                ? {
                    borderColor: 'rgba(150,126,110,0.72)',
                    glow: '0 4px 15px -5px rgba(0,0,0,0.8), 0 0 10px rgba(150,126,110,0.24)',
                    iconBg: 'rgba(150,126,110,0.10)',
                    iconBorder: 'rgba(150,126,110,0.24)',
                    iconColor: '#ccb39f',
                }
                : {
                    borderColor: 'var(--skin-accent-color)',
                    glow: '0 4px 15px -5px rgba(0,0,0,0.8), 0 0 8px var(--sephirot-glow-color)',
                    iconBg: 'rgba(255,255,255,0.06)',
                    iconBorder: 'rgba(255,255,255,0.12)',
                    iconColor: 'var(--skin-accent-color)',
                };

    useEffect(() => {
        const timerIn = setTimeout(() => setIsVisible(true), 50);
        const timerOut = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 500);
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
                    borderColor: chrome.borderColor,
                    borderWidth: '0.5px',
                    boxShadow: chrome.glow,
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--skin-accent-color)]/5 to-transparent pointer-events-none" />

                <div
                    className="flex items-center justify-center w-5 h-5 rounded-lg shrink-0 self-start mt-0.5"
                    style={{ background: chrome.iconBg, border: `1px solid ${chrome.iconBorder}` }}
                >
                    <span className="text-[10px] animate-pulse" style={{ color: chrome.iconColor }}>✦</span>
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
