
import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { MOODS_DATA } from '../constants';
import { XIcon } from './Icons';
import { Portal } from './Portal';

export const MoodModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { userProfile, updateMood } = useGame();
    const [localMood, setLocalMood] = useState(userProfile.mood);
    const sliderRef = useRef<HTMLInputElement>(null);

    const resolveMood = (value: number) => 
        MOODS_DATA.find(m => value >= m.min && value < m.max) || MOODS_DATA[MOODS_DATA.length - 1];

    const currentMoodInfo = resolveMood(localMood);

    useEffect(() => {
        const updateSliderTrack = () => {
            if (!sliderRef.current) return;
            const mood = resolveMood(localMood);
            const clamped = Math.max(0, Math.min(100, localMood));
            sliderRef.current.style.background = `linear-gradient(90deg, ${mood.trackStart} 0%, ${mood.trackEnd} ${clamped}%, rgba(255, 255, 255, 0.12) ${clamped}%, rgba(255, 255, 255, 0.12) 100%)`;
        };
        updateSliderTrack();
    }, [localMood]);

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
                className="w-full max-w-sm pointer-events-auto space-y-4 rounded-3xl shadow-2xl border border-white/10 relative" 
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
                        ref={sliderRef}
                        type="range"
                        min="0"
                        max="100"
                        value={localMood}
                        onChange={handleSliderChange}
                        className="mood-slider"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold px-1">
                        {moodLabels.map(label => <span key={label}>{label}</span>)}
                    </div>
                </div>
            </GlassCard>
        </div>
        </Portal>
    );
};