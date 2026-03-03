import React, { useState } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { Portal } from './Portal';

interface SplashScreenProps {
    onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    // Tenta carregar do public folder primeiro.
    const videoSrc = '/videos/intro.mp4'; 
    
    return (
        <Portal>
            <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center">
                <VideoPlayer
                    src={videoSrc}
                    onEnd={onComplete}
                    className="w-full h-full object-cover"
                    placeholderLabel="GOL 1.0"
                    duration={1500} // Se não carregar em 1.5s, pula (mais liso)
                    maxDuration={6000} // Pula no máximo em 6s
                    playbackRate={1.2} // Um pouco mais rápido pra ser "liso"
                />
            </div>
        </Portal>
    );
};
