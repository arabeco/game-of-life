import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { XIcon, CheckIcon } from './Icons';

const MissionCard: React.FC<{ title: string; progress: number; }> = ({ title, progress }) => (
    <GlassCard variant="neutral" className="p-3 cursor-pointer">
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{title}</span>
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono">{progress}%</span>
                    <div className="w-5 h-5 rounded-full border-2 border-gray-500 flex items-center justify-center">
                        {progress === 100 && <CheckIcon className="w-3 h-3 text-green-400" />}
                    </div>
                </div>
            </div>
            <div className="w-full bg-black/30 rounded-full h-1"><div className="bg-[var(--gold)] h-1 rounded-full" style={{width: `${progress}%`}}></div></div>
        </div>
    </GlassCard>
);

export const ClanMissionsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [missions, setMissions] = useState([
        { id: 1, title: 'Raid Semanal: Acumular 50h de Foco', progress: 75, pledged: false, totalPledges: 4, requiredPledges: 5 },
        { id: 2, title: 'Desafio do Clã: Completar 100 Ações', progress: 42, pledged: false, totalPledges: 2, requiredPledges: 5 },
    ]);

    const handlePledge = (id: number) => {
        setMissions(prev => prev.map(m => {
            if (m.id === id) {
                return { ...m, pledged: true, totalPledges: m.totalPledges + 1 };
            }
            return m;
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold uppercase tracking-wider">Missões do Clã</h2>
                    <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5"/></button>
                </div>
                
                <div className="space-y-4">
                    {missions.map(mission => {
                        const isFullyPledged = mission.totalPledges >= mission.requiredPledges;
                        const isCompleted = mission.progress >= 100;

                        return (
                            <GlassCard key={mission.id} variant={isCompleted ? 'gold' : 'neutral'} className={`p-4 transition-all duration-300 ${isCompleted ? 'border-[var(--gold)] shadow-[0_0_15px_rgba(212,175,55,0.3)]' : ''}`}>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm w-2/3">{mission.title}</span>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs font-mono">{mission.progress}%</span>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isCompleted ? 'border-[var(--gold)] bg-[var(--gold)] text-black' : 'border-gray-500'}`}>
                                                {isCompleted && <CheckIcon className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-[var(--gold)]' : 'bg-gray-500'}`} style={{width: `${mission.progress}%`}}></div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                                            <span className={isFullyPledged ? 'text-[var(--gold)]' : ''}>{mission.totalPledges}/{mission.requiredPledges}</span>
                                            <span>Pactos</span>
                                        </div>
                                        
                                        {!mission.pledged ? (
                                            <button 
                                                onClick={() => handlePledge(mission.id)}
                                                className="px-3 py-1 rounded-lg text-xs font-bold border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-black transition-colors"
                                            >
                                                FIRMAR PACTO
                                            </button>
                                        ) : (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold)] flex items-center gap-1 bg-[var(--gold)]/10 px-2 py-1 rounded">
                                                <div className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full animate-pulse"></div>
                                                Pacto Ativo
                                            </span>
                                        )}
                                    </div>
                                    
                                    {isCompleted && (
                                        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 flex items-center justify-center bg-[var(--gold)] text-black rounded-full shadow-lg font-black text-xs border-2 border-white transform rotate-12 animate-bounce-slow z-10">
                                            SELO
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            </GlassCard>
        </div>
    );
};
