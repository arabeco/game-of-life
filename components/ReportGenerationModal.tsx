import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { VideoPlayer } from './VideoPlayer';

interface ReportGenerationModalProps {
    onComplete: () => void; // Triggered when video ends/progress 100%
    onOpen: () => void;     // Triggered when user clicks [Abrir]
    onClose: () => void;    // Triggered when user clicks [Fechar]
}

const PHRASES = [
    { threshold: 20, text: 'Consultando registros...' },
    { threshold: 40, text: 'Analisando arenas...' },
    { threshold: 60, text: 'Contabilizando ações...' },
    { threshold: 80, text: 'Calculando score...' },
    { threshold: 100, text: 'Selando pergaminho...' },
];

export const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({ onComplete, onOpen, onClose }) => {
    const [progress, setProgress] = useState(0);
    const [isReady, setIsReady] = useState(false);
    
    // Simulate progress alongside video
    useEffect(() => {
        const duration = 6000; // Increased to 6s (slower by ~20%)
        const intervalTime = 50; // Update every 50ms
        const steps = duration / intervalTime;
        const increment = 100 / steps;

        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev + increment;
                if (next >= 100) {
                    clearInterval(timer);
                    setIsReady(true);
                    onComplete(); // Notify parent that report is generated
                    onOpen(); // Automatically open report
                    onClose(); // Close this modal
                    return 100;
                }
                return next;
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, [onComplete, onOpen, onClose]);

    if (progress >= 100) return null;

    const currentPhrase = PHRASES.find(p => progress <= p.threshold)?.text || 'Relatório pronto';

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] flex items-center justify-center animate-fade-in">
                <GlassCard className="w-full max-w-[280px] aspect-[9/16] relative overflow-hidden border-[var(--skin-accent-color)]/30 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                    <VideoPlayer
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/report_seal.mp4`}
                        onEnd={() => {}} // Progress controls completion
                        className="w-full h-full object-cover"
                        placeholderLabel="Sincronizando..."
                        duration={5000}
                        playbackRate={0.85}
                        startTime={0.5}
                    />
                    
                    {/* Overlay with subtle progress */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none flex flex-col justify-end p-6">
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--skin-accent-color)] text-center animate-pulse drop-shadow-lg">
                                {currentPhrase}
                            </p>
                            <div className="w-full bg-black/40 h-1 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
                                <div 
                                    className="h-full bg-[var(--skin-accent-color)] transition-all duration-100 ease-linear shadow-[0_0_8px_var(--skin-accent-color)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
