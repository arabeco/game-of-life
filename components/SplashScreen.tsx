import React, { useState, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { Portal } from './Portal';

interface SplashScreenProps {
    onComplete: () => void;
    isLoading?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, isLoading }) => {
    // Tenta carregar do public folder primeiro.
    const videoSrc = '/videos/intro.mp4'; 
    const [progress, setProgress] = useState(0);
    const [videoEnded, setVideoEnded] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    
    // Simulate progress while video plays or loading
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                // If finished, jump to 100
                if (videoEnded && !isLoading) {
                    return 100;
                }
                
                // If waiting for video or loading, progress faster but cap at 95%
                // Increment ~2-4% every 100ms = 20-40% per second. Reaches 90% in ~3-4s
                if (prev < 95) {
                    return prev + (2 + Math.random() * 2); 
                }
                return prev;
            });
        }, 100);
        return () => clearInterval(interval);
    }, [isLoading, videoEnded]);

    useEffect(() => {
        if (progress >= 100 && videoEnded && !isLoading && !isFadingOut) {
            // Start fade out sequence
            const fadeTimeout = setTimeout(() => {
                setIsFadingOut(true);
            }, 500); // Wait 0.5s at 100% before starting fade

            // Complete after fade animation
            const completeTimeout = setTimeout(onComplete, 1200); // 0.5s wait + 0.7s fade

            return () => {
                clearTimeout(fadeTimeout);
                clearTimeout(completeTimeout);
            };
        }
    }, [progress, videoEnded, isLoading, onComplete, isFadingOut]);

    const handleVideoEnd = () => {
        setVideoEnded(true);
    };
    
    return (
        <Portal>
            <div className={`fixed inset-0 z-[10000] bg-black flex items-center justify-center transition-opacity duration-700 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {/* Container com tamanho fixo menor, mantendo fundo preto */}
                <div className="relative w-full max-w-[300px] aspect-[9/16] max-h-[60vh] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                    <VideoPlayer
                        src={videoSrc}
                        onEnd={handleVideoEnd}
                        className="w-full h-full object-cover"
                        placeholderLabel="GOL 1.0"
                        duration={1500} // Se não carregar em 1.5s, pula (mais liso)
                        maxDuration={10000} // Aumentado para permitir video completo se usuario quiser
                        playbackRate={1.0} // Normal speed for better experience
                    />
                </div>
                
                {/* Progress Bar Overlay - Agora fixo no rodapé da tela */}
                <div className="absolute bottom-10 left-10 right-10 z-[10001] max-w-md mx-auto">
                    <div className="flex justify-between text-[10px] font-mono text-white/50 mb-1 uppercase tracking-widest">
                        <span>Sincronizando...</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                        <div 
                            className="h-full shadow-[0_0_15px_rgba(255,215,0,0.6)] transition-all duration-200 ease-out relative overflow-hidden"
                            style={{ 
                                width: `${progress}%`,
                                background: 'linear-gradient(90deg, #C5A000 0%, #FFD700 50%, #C5A000 100%)'
                            }}
                        >
                            {/* Shine effect */}
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
