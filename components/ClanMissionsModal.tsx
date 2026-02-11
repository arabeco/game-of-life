import React from 'react';
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
     const clanMissions = [
        { title: 'Raid Semanal: Acumular 50h de Foco', progress: 75 },
        { title: 'Desafio do Clã: Completar 100 Ações', progress: 42 },
    ];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold uppercase tracking-wider">Missões do Clã</h2>
                    <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5"/></button>
                </div>
                <div className="space-y-2">
                    {clanMissions.map(mission => (
                        <MissionCard key={mission.title} title={mission.title} progress={mission.progress} />
                    ))}
                </div>
            </GlassCard>
        </div>
    );
};
