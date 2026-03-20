
import React, { useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { MOODS_DATA } from '../constants';
import { XIcon } from './Icons';
import { Portal } from './Portal';

export const MoodModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { userProfile, dailyCommitment, updateMood, updateOperationalScratch } = useGame();
    const [localMood, setLocalMood] = useState(userProfile.mood);

    const resolveMood = (value: number) => 
        MOODS_DATA.find(m => value >= m.min && value < m.max) || MOODS_DATA[MOODS_DATA.length - 1];

    const currentMoodInfo = resolveMood(localMood);
    const sliderTrackStyle = useMemo(() => {
        const clamped = Math.max(0, Math.min(100, localMood));
        return {
            background: `linear-gradient(90deg, ${currentMoodInfo.trackStart} 0%, ${currentMoodInfo.trackEnd} ${clamped}%, rgba(255, 255, 255, 0.12) ${clamped}%, rgba(255, 255, 255, 0.12) 100%)`,
        } satisfies React.CSSProperties;
    }, [currentMoodInfo.trackEnd, currentMoodInfo.trackStart, localMood]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        setLocalMood(newValue);
        updateMood(newValue);
    };
    
    const moodLabels = ['VERGONHA', 'CORAGEM', 'AMOR', 'PAZ', 'ILUMINADO'];

    return (
        <Portal>
        <div className="fixed inset-0 z-[10000] pointer-events-none flex items-start justify-center pt-24 px-4 animate-fade-in" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto" onClick={onClose} />
            <GlassCard 
                variant="neutral" 
                className="w-full max-w-sm pointer-events-auto space-y-4 rounded-3xl shadow-2xl border border-white/10 relative !bg-[linear-gradient(180deg,rgba(11,13,18,0.94),rgba(7,8,12,0.92))] backdrop-blur-xl" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold uppercase tracking-wider text-[var(--skin-accent-color)]">Humor</h2>
                    <button onClick={onClose} className="p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <XIcon className="w-5 h-5 text-gray-400"/>
                    </button>
                </div>
                
                <div className="text-center py-2 min-h-[48px] flex items-center justify-center">
                    <p className="text-xl font-semibold transition-colors duration-200" style={{ color: currentMoodInfo.trackEnd }}>
                        {currentMoodInfo.label}
                    </p>
                </div>

                <div className="space-y-2">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={localMood}
                        onChange={handleSliderChange}
                        className="mood-slider"
                        style={sliderTrackStyle}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold px-1">
                        {moodLabels.map(label => <span key={label}>{label}</span>)}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/56">
                            Rascunho operacional
                        </p>
                        <p className="text-[10px] text-white/35">zera no proximo dia operacional</p>
                    </div>
                    <textarea
                        value={dailyCommitment.operationalScratch || ''}
                        onChange={(event) => updateOperationalScratch(event.target.value)}
                        rows={4}
                        placeholder="Anotacoes rapidas, pendencias, lembretes do dia..."
                        className="w-full resize-none rounded-2xl border border-white/12 bg-black/55 px-3 py-3 text-sm text-white/88 placeholder:text-white/25 focus:outline-none focus:border-[var(--skin-accent-color)]"
                    />
                </div>
            </GlassCard>
        </div>
        </Portal>
    );
};
