
import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { MOODS_DATA } from '../constants';
import { XIcon } from './Icons';

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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold uppercase tracking-wider">Humor</h2>
                    <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5"/></button>
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
    );
};