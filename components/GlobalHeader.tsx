
import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { MOODS_DATA, SKINS_DATA, BORDERS_DATA } from '../constants';
import { MoodModal } from './MoodModal';

export const GlobalHeader: React.FC<{ onProfileClick: () => void; topOffsetPx?: number }> = ({ onProfileClick, topOffsetPx = 0 }) => {
    const { userProfile } = useGame();
    const [isMoodModalOpen, setMoodModalOpen] = useState(false);
    const date = new Date();
    const day = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
    const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '');
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const avatarUrl = userProfile.avatarUrl?.trim();

    const currentMood = MOODS_DATA.find(m => userProfile.mood >= m.min && userProfile.mood < m.max) || MOODS_DATA[MOODS_DATA.length - 1];
    const selectedBorder = [...SKINS_DATA, ...BORDERS_DATA].find(s => s.id === userProfile.border);

    return (
        <>
            <header className="fixed left-0 right-0 z-40 bg-gradient-to-b from-black/90 via-black/70 to-black/40 backdrop-blur-lg border-b border-white/10" style={{ top: topOffsetPx }}>
                <div className="max-w-7xl mx-auto flex items-center justify-between h-20 px-4 text-xs font-semibold text-gray-300">
                    <span className="text-center w-24 flex-shrink-0 text-[10px] uppercase tracking-[0.2em] bg-white/5 border border-white/10 px-3 py-1 rounded-full">{day} • {dateStr}</span>
                    
                    <div className="flex-grow flex items-center justify-center relative mx-2">
                        {/* Clickable Mood Bar (positioned behind the avatar) */}
                        <button 
                            onClick={() => setMoodModalOpen(true)} 
                            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-8 w-full z-0 flex items-center"
                            aria-label="Adjust mood"
                        >
                             <div className="w-full h-1.5 rounded-full p-px bg-[var(--skin-accent-color)]/40 shadow-[0_0_12px_rgba(0,0,0,0.35)]">
                                <div className="relative h-full w-full bg-black/40 rounded-full">
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
                            <div className="relative w-16 h-16 group-hover:scale-105 transition-transform">
                                {/* Avatar Image */}
                                <div className="w-full h-full flex items-center justify-center">
                                    {avatarUrl ? (
                                        <img 
                                            src={avatarUrl} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover rounded-full"
                                            style={{
                                                width: selectedBorder?.imageUrl ? '75%' : 'calc(100% - 6px)',
                                                height: selectedBorder?.imageUrl ? '75%' : 'calc(100% - 6px)',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full rounded-full bg-black/40"
                                            style={{
                                                width: selectedBorder?.imageUrl ? '75%' : 'calc(100% - 6px)',
                                                height: selectedBorder?.imageUrl ? '75%' : 'calc(100% - 6px)',
                                            }}
                                        />
                                    )}
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
                                            border: `2px solid ${selectedBorder?.color || 'var(--skin-accent-color)'}`,
                                            borderRadius: '50%',
                                        }
                                    }
                                />
                            </div>
                            <div className="absolute top-[3.3rem] bg-gray-900/90 rounded-full w-6 h-6 flex items-center justify-center border group-hover:scale-110 transition-transform z-10" style={{borderColor: 'var(--skin-accent-color)'}}>
                                <span className="text-[11px] font-black text-white">{userProfile.level}</span>
                            </div>
                        </button>
                    </div>

                    <span className="text-center w-20 flex-shrink-0 text-[11px] tracking-[0.2em] bg-white/5 border border-white/10 px-3 py-1 rounded-full">{timeStr}</span>
                </div>
            </header>
            {isMoodModalOpen && <MoodModal onClose={() => setMoodModalOpen(false)} />}
        </>
    );
};
