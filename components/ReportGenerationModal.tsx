import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
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

    const currentPhrase = PHRASES.find(p => progress <= p.threshold)?.text || 'Relatório pronto';

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center animate-fade-in p-4">
            <div className="w-full max-w-xs relative">
                <GlassCard variant="neutral" className="p-6 flex flex-col items-center space-y-6">
                    {/* Video Container */}
                    <div className="w-full aspect-[9/16] max-h-[60vh] bg-black/50 rounded-lg overflow-hidden relative border border-white/10 shadow-2xl">
                        <VideoPlayer
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/report_seal.mp4`}
                            onEnd={() => {}} // Progress controls completion
                            className="w-full h-full object-cover"
                            placeholderLabel="Gerando Relatório..."
                            duration={5000}
                            playbackRate={0.85} // Slow down by 15%
                            startTime={0.5} // Start 0.5s late
                        />
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full space-y-2">
                        <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/10">
                            <div 
                                className="h-full bg-gradient-to-r from-[var(--bronze)] via-[var(--gold)] to-[var(--skin-accent-color)] transition-all duration-100 ease-linear shadow-[0_0_10px_var(--gold)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-center text-xs font-mono text-[var(--gold)] uppercase tracking-widest animate-pulse">
                            {currentPhrase}
                        </p>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};
