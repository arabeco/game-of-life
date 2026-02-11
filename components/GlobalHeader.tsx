
import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { MOODS_DATA, SKINS_DATA, BORDERS_DATA } from '../constants';
import { MoodModal } from './MoodModal';

export const GlobalHeader: React.FC<{ onProfileClick: () => void }> = ({ onProfileClick }) => {
    const { userProfile } = useGame();
    const [isMoodModalOpen, setMoodModalOpen] = useState(false);
    const date = new Date();
    const day = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
    const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '');
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const currentMood = MOODS_DATA.find(m => userProfile.mood >= m.min && userProfile.mood < m.max) || MOODS_DATA[MOODS_DATA.length - 1];
    const selectedBorder = [...SKINS_DATA, ...BORDERS_DATA].find(s => s.id === userProfile.border);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-40 bg-[#111111]/80 backdrop-blur-lg">
                <div className="max-w-[420px] mx-auto flex items-center justify-between h-20 px-4 text-xs font-bold text-gray-400">
                    <span className="text-center w-20 flex-shrink-0">{day}, {dateStr}</span>
                    
                    <div className="flex-grow flex items-center justify-center relative mx-2">
                        {/* Clickable Mood Bar (positioned behind the avatar) */}
                        <button 
                            onClick={() => setMoodModalOpen(true)} 
                            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-10 w-full z-0 flex items-center"
                            aria-label="Adjust mood"
                        >
                            {/* The visual bar itself - a container acting as the border */}
                             <div className="w-full h-1 rounded-full p-px bg-[var(--skin-accent-color)]/50">
                                {/* The inner track */}
                                <div className="relative h-full w-full bg-black/30 rounded-full">
                                    {/* The colored fill */}
                                    <div 
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ 
                                            width: `${userProfile.mood}%`,
                                            background: currentMood.color
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </button>

                        {/* Avatar and Level Button (on top of the bar) */}
                        <button onClick={onProfileClick} className="flex flex-col items-center relative group flex-shrink-0 z-10">
                            <div className="relative w-20 h-20 group-hover:scale-105 transition-transform">
                                {/* Avatar Image */}
                                <div className="w-full h-full flex items-center justify-center">
                                    <img 
                                        src={userProfile.avatarUrl} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover rounded-full"
                                        style={{
                                            width: selectedBorder?.imageUrl ? '75%' : 'calc(100% - 6px)',
                                            height: selectedBorder?.imageUrl ? '75%' : 'calc(100% - 6px)',
                                        }}
                                    />
                                </div>

                                {/* Border as Overlay */}
                                <div 
                                    className="absolute inset-0 w-full h-full pointer-events-none"
                                    style={
                                        selectedBorder?.imageUrl
                                        ? {
                                            backgroundImage: `url(${selectedBorder.imageUrl})`,
                                            backgroundSize: 'contain',
                                            backgroundPosition: 'center',
                                            backgroundRepeat: 'no-repeat',
                                        }
                                        : {
                                            border: `3px solid ${selectedBorder?.color || 'var(--skin-accent-color)'}`,
                                            borderRadius: '50%',
                                        }
                                    }
                                />
                            </div>
                            <div className="absolute top-[4.25rem] bg-gray-800 rounded-full w-7 h-7 flex items-center justify-center border-2 group-hover:scale-110 transition-transform z-10" style={{borderColor: 'var(--skin-accent-color)'}}>
                                <span className="text-sm font-black text-white">{userProfile.level}</span>
                            </div>
                        </button>
                    </div>

                    <span className="text-center w-20 flex-shrink-0">{timeStr}</span>
                </div>
            </header>
            {isMoodModalOpen && <MoodModal onClose={() => setMoodModalOpen(false)} />}
        </>
    );
};