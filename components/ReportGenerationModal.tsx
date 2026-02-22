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
        const duration = 5000; // 5 seconds total
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
                    return 100;
                }
                return next;
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, [onComplete]);

    const currentPhrase = PHRASES.find(p => progress <= p.threshold)?.text || 'Relatório pronto';

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center animate-fade-in">
            <div className="w-full max-w-md p-4 relative">
                <GlassCard variant="neutral" className="p-6 flex flex-col items-center space-y-6">
                    {/* Video Container */}
                    <div className="w-full aspect-[9/16] max-h-[60vh] bg-black/50 rounded-lg overflow-hidden relative border border-white/10 shadow-2xl">
                        {!isReady ? (
                            <VideoPlayer
                                src="/assets/videos/report/report_seal.mp4"
                                onEnd={() => {}} // Progress controls completion
                                className="w-full h-full object-cover"
                                placeholderLabel="Gerando Relatório..."
                                duration={5000}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 animate-fade-in">
                                <div className="w-24 h-24 rounded-full border-4 border-[var(--skin-accent-color)] flex items-center justify-center mb-4 shadow-[0_0_30px_var(--skin-accent-color)]">
                                    <span className="text-4xl">📜</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Relatório Pronto</h2>
                                <p className="text-gray-400 text-sm mb-8 text-center px-4">Sua jornada foi registrada nos anais do tempo.</p>
                                
                                <div className="flex gap-3 w-full px-4">
                                    <button 
                                        onClick={onOpen}
                                        className="flex-1 py-3 bg-[var(--skin-accent-color)] text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[var(--skin-accent-color)]/20"
                                    >
                                        ABRIR
                                    </button>
                                    <button 
                                        onClick={onClose}
                                        className="flex-1 py-3 bg-white/10 text-gray-300 font-bold rounded-xl hover:bg-white/20 transition-all border border-white/5"
                                    >
                                        FECHAR
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar (Only while generating) */}
                    {!isReady && (
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
                    )}
                </GlassCard>
            </div>
        </div>
    );
};
