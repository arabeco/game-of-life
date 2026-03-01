import React, { useState } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { Portal } from './Portal';

interface SplashScreenProps {
    onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    // Tenta carregar do public folder primeiro.
    // O usuário pode colocar o vídeo em /public/videos/intro.mp4
    const videoSrc = '/videos/intro.mp4'; 
    
    return (
        <Portal>
            <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center">
                <VideoPlayer
                    src={videoSrc}
                    onEnd={onComplete}
                    className="w-full h-full object-cover"
                    placeholderLabel="Carregando Abertura..."
                    duration={5000} // Timeout de segurança se o video travar
                    playbackRate={1.0}
                />
            </div>
        </Portal>
    );
};
