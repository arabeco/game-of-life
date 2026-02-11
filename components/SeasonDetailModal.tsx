
import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { CheckIcon } from './Icons';
import { useGame } from '../contexts/GameContext';
import { Season, SeasonMission } from '../types';

const MissionCard: React.FC<{ mission: SeasonMission, onClick?: () => void }> = ({ mission, onClick }) => {
    // Mock progress for now
    const progress = Math.floor(Math.random() * 101);

    return (
        <GlassCard variant="neutral" className={`p-3 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{mission.title}</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono">{progress}%</span>
                        <div className="w-5 h-5 rounded-full border-2 border-gray-500 flex items-center justify-center">
                            {progress === 100 && <CheckIcon className="w-3 h-3 text-green-400" />}
                        </div>
                    </div>
                </div>
                <div className="w-full bg-black/30 rounded-full h-1">
                    <div className="bg-[var(--gold)] h-1 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </GlassCard>
    );
};


export const SeasonDetailModal: React.FC<{ season: Season, onClose: () => void }> = ({ season, onClose }) => {
    const { seasonMissions } = useGame();
    const missionsForSeason = seasonMissions.filter(m => m.season_id === season.id);
    
    const endDate = new Date(season.end_date);
    const daysRemaining = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-sm m-4 h-[90vh] rounded-3xl" onClick={e => e.stopPropagation()}>
                <div 
                    className="relative w-full h-full p-4 flex flex-col justify-between text-white rounded-3xl border border-white/20 bg-cover bg-center" 
                    style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.8) 100%), url('${season.background_png_url}')` }}
                >
                    <div className="text-center">
                        <h2 className="text-2xl font-black uppercase tracking-widest luxe-title-shadow">{season.name}</h2>
                        <p className="text-sm text-gray-300">Termina em: {daysRemaining} dias</p>
                    </div>
                    
                    <div>
                        <GlassCard variant="neutral" className="p-3 text-center text-sm max-h-24 overflow-y-auto">
                            {season.lore_text}
                        </GlassCard>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                        <h3 className="text-sm font-bold text-center uppercase tracking-wider">Missões da Season</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {missionsForSeason.map(mission => (
                                <MissionCard key={mission.id} mission={mission} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
