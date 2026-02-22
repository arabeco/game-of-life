import React from 'react';
import { GlassCard } from './GlassCard';
import { SeasonMission } from '../types';

interface MissionCompletionModalProps {
    mission: SeasonMission;
    onOpen: () => void;
    onClose: () => void;
}

export const MissionCompletionModal: React.FC<MissionCompletionModalProps> = ({ mission, onOpen, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center animate-fade-in">
            <GlassCard variant="accent" className="w-full max-w-sm p-6 text-center space-y-6 m-4 border-[var(--skin-accent-color)] shadow-[0_0_30px_var(--skin-accent-color)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-[var(--skin-accent-color)]/20 flex items-center justify-center border-2 border-[var(--skin-accent-color)] animate-bounce-slow">
                        <span className="text-4xl">⚔️</span>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-[var(--skin-accent-color)] uppercase tracking-widest mb-1">Missão Completa</h2>
                        <h3 className="text-2xl font-black text-white leading-tight">{mission.title}</h3>
                    </div>
                    <p className="text-gray-300 text-sm italic">"Parabéns! Você superou este desafio."</p>
                </div>

                <div className="flex gap-3 pt-4">
                    <button 
                        onClick={onOpen}
                        className="flex-1 py-3 bg-[var(--skin-accent-color)] text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[var(--skin-accent-color)]/20 uppercase tracking-wider"
                    >
                        Abrir Recompensa
                    </button>
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 bg-white/10 text-gray-300 font-bold rounded-xl hover:bg-white/20 transition-all border border-white/5 uppercase tracking-wider"
                    >
                        Fechar
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};
