import React, { useState, useEffect, useRef } from 'react';
import { Portal } from './Portal';
import { useGame } from '../contexts/GameContext';
import { LockIcon, UnlockIcon, CalendarIcon, CheckCircleIcon, XCircleIcon } from './Icons';

interface RestScreenProps {
    onClose: () => void;
}

export const RestScreen: React.FC<RestScreenProps> = ({ onClose }) => {
    const { activeCycle, dailyCommitment, tasks } = useGame();
    const [isClosing, setIsClosing] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const holdInterval = useRef<number | null>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);

    const isLocked = dailyCommitment.stage !== 'planning';
    const isCompleted = dailyCommitment.stage === 'judgment';
    const commitmentTasks = dailyCommitment.taskIds
        .map(id => tasks.find(t => t.id === id))
        .filter((t): t is NonNullable<typeof t> => !!t);
    const remainingTasksCount = commitmentTasks.filter(t => !t.completed).length;

    // Animation for mounting
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleStartHold = () => {
        if (holdInterval.current) return;
        
        const startTime = Date.now();
        const duration = 1000; // 1 second to unlock

        holdInterval.current = window.setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            setHoldProgress(progress);

            if (progress >= 100) {
                if (holdInterval.current) clearInterval(holdInterval.current);
                handleUnlock();
            }
        }, 16);
    };

    const handleEndHold = () => {
        if (holdInterval.current) {
            clearInterval(holdInterval.current);
            holdInterval.current = null;
        }
        if (!isUnlocked) {
            setHoldProgress(0);
        }
    };

    const handleUnlock = () => {
        setIsUnlocked(true);
        setIsClosing(true);
        setTimeout(onClose, 500); // Wait for slide up animation
    };

    // Calculate Cycle Progress
    const getCycleProgress = () => {
        if (!activeCycle) return 0;
        const start = new Date(activeCycle.startDate).getTime();
        const end = new Date(activeCycle.endDate).getTime();
        const now = new Date().getTime();
        const total = end - start;
        const current = now - start;
        return Math.min(Math.max((current / total) * 100, 0), 100);
    };

    const cycleProgress = getCycleProgress();
    const daysLeft = activeCycle ? Math.ceil((new Date(activeCycle.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return (
        <Portal>
            <div 
                className={`fixed inset-0 z-[9000] flex flex-col items-center justify-between bg-black/90 backdrop-blur-xl transition-transform duration-500 ease-in-out ${mounted && !isClosing ? 'translate-y-0' : '-translate-y-full'}`}
                style={{ touchAction: 'none' }} // Prevent scrolling
            >
                {/* Header Content */}
                <div className="w-full max-w-md p-8 pt-16 flex flex-col gap-8 animate-fade-in-down">
                    
                    {/* Cycle Status */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-[var(--gold)]">
                            <CalendarIcon className="w-6 h-6" />
                            <h2 className="text-xl font-bold uppercase tracking-widest">Ciclo Atual</h2>
                        </div>
                        
                        {activeCycle ? (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="text-2xl font-black text-white">{activeCycle.name}</h3>
                                    <span className="text-sm font-mono text-gray-400">{daysLeft} dias restantes</span>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-gray-500 uppercase tracking-wider">
                                        <span>Progresso</span>
                                        <span>{Math.round(cycleProgress)}%</span>
                                    </div>
                                    <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                        <div 
                                            className="h-full bg-[var(--gold)] shadow-[0_0_10px_var(--gold)] transition-all duration-1000"
                                            style={{ width: `${cycleProgress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-center text-gray-500 border border-white/5 rounded-xl border-dashed">
                                Nenhum ciclo ativo
                            </div>
                        )}
                    </div>

                    {/* SITREP Status */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-[var(--skin-accent-color)]">
                            <CheckCircleIcon className="w-6 h-6" />
                            <h2 className="text-xl font-bold uppercase tracking-widest">SITREP Diário</h2>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 font-medium">Estado Atual</span>
                                <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest ${
                                    isLocked 
                                        ? isCompleted 
                                            ? 'bg-green-500/20 border-green-500 text-green-400'
                                            : 'bg-blue-500/20 border-blue-500 text-blue-400'
                                        : 'bg-gray-500/20 border-gray-500 text-gray-400'
                                }`}>
                                    {isLocked 
                                        ? isCompleted ? 'Completado' : 'Em Andamento'
                                        : 'Planejamento'
                                    }
                                </div>
                            </div>
                            
                            {isLocked && !isCompleted && (
                                <div className="mt-4 p-3 bg-black/30 rounded-lg border border-white/5 text-center">
                                    <p className="text-sm text-gray-400">
                                        Faltam <span className="text-white font-bold">{remainingTasksCount}</span> tarefas para o debriefing.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Unlock Mechanism */}
                <div className="mb-12 flex flex-col items-center gap-4 animate-fade-in-up">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Segure para desbloquear</p>
                    
                    <button
                        onMouseDown={handleStartHold}
                        onMouseUp={handleEndHold}
                        onMouseLeave={handleEndHold}
                        onTouchStart={handleStartHold}
                        onTouchEnd={handleEndHold}
                        className="relative group"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        {/* Progress Ring Background */}
                        <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
                        
                        {/* Progress Ring Active */}
                        <svg className="absolute inset-0 -rotate-90 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="46"
                                fill="none"
                                stroke="var(--gold)"
                                strokeWidth="4"
                                strokeDasharray="289" // 2 * pi * 46
                                strokeDashoffset={289 - (289 * holdProgress) / 100}
                                className="transition-all duration-75 ease-linear"
                            />
                        </svg>

                        {/* Button Content */}
                        <div className="w-24 h-24 rounded-full bg-black border-2 border-white/10 flex items-center justify-center relative z-10 group-active:scale-95 transition-transform">
                            {isUnlocked ? (
                                <UnlockIcon className="w-8 h-8 text-[var(--gold)]" />
                            ) : (
                                <LockIcon className="w-8 h-8 text-gray-400 group-active:text-white transition-colors" />
                            )}
                        </div>
                    </button>
                </div>
            </div>
        </Portal>
    );
};
