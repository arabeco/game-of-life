
import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { MOODS_DATA, SKINS_DATA, BORDERS_DATA } from '../constants';
import { MoodModal } from './MoodModal';
import { OracleFeed } from './OracleFeed';
import { SparklesIcon } from './Icons';

export const GlobalHeader: React.FC<{ onProfileClick: () => void; topOffsetPx?: number }> = ({ onProfileClick, topOffsetPx = 0 }) => {
    const { userProfile, oracleMessages, notifications, appMode, clan } = useGame();
    const [isMoodModalOpen, setMoodModalOpen] = useState(false);
    const [isOracleOpen, setOracleOpen] = useState(false);
    const isBasicMode = appMode === 'BASIC';
    
    const unreadNotificationsCount = notifications.filter(n => !n.read).length;
    const hasUnreadMessages = oracleMessages.some(m => !m.read);
    const hasUnread = hasUnreadMessages || unreadNotificationsCount > 0;
    const date = new Date();
    const day = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
    const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '');
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const avatarUrl = userProfile.avatarUrl?.trim();

    const currentMood = MOODS_DATA.find(m => userProfile.mood >= m.min && userProfile.mood < m.max) || MOODS_DATA[MOODS_DATA.length - 1];
    const selectedBorder = [...SKINS_DATA, ...BORDERS_DATA].find(s => s.id === userProfile.border);

    const renderAvatarContent = () => {
        if (avatarUrl) {
            return (
                <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                    style={{
                        width: selectedBorder?.imageUrl ? '75%' : 'calc(100% - 6px)',
                        height: selectedBorder?.imageUrl ? '75%' : 'calc(100% - 6px)',
                    }}
                />
            );
        }

        // Fallback placeholder
        return (
            <div
                className="w-full h-full rounded-full bg-black/40"
                style={{
                    width: selectedBorder?.imageUrl ? '75%' : 'calc(100% - 6px)',
                    height: selectedBorder?.imageUrl ? '75%' : 'calc(100% - 6px)',
                }}
            />
        );
    };

    const handleOracleClick = () => {
        setOracleOpen(true);
    };

    return (
        <>
            <header className="fixed left-0 right-0 z-40 bg-gradient-to-b from-black/90 via-black/70 to-black/40 backdrop-blur-lg border-b safe-area-top" style={{ top: topOffsetPx, borderColor: 'var(--skin-accent-color)' }}>
                <div className="max-w-7xl mx-auto relative flex items-center justify-between h-20 px-4 text-xs font-semibold text-gray-300">
                    <span className="text-center w-24 flex-shrink-0 text-[10px] uppercase tracking-[0.2em] bg-white/5 border px-3 py-1 rounded-full" style={{ borderColor: 'var(--skin-accent-color)' }}>{day} • {dateStr}</span>
                    
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[calc(100%-14rem)] flex items-center justify-center pointer-events-none">
                        <div className="relative w-full flex items-center justify-center pointer-events-auto">
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
                            <div className="relative z-30 flex items-center justify-center">
                                <button onClick={onProfileClick} className="flex flex-col items-center relative group flex-shrink-0">
                                    <div className="relative w-16 h-16 group-hover:scale-105 transition-transform">
                                        {/* Avatar Image */}
                                        <div className="w-full h-full flex items-center justify-center">
                                            {renderAvatarContent()}
                                        </div>

                                        {/* Border as Overlay */}
                                        {!isBasicMode && (
                                        <div 
                                            className="absolute inset-0 w-full h-full pointer-events-none z-40"
                                            style={
                                                selectedBorder?.imageUrl
                                                ? {
                                                    backgroundImage: `url(${selectedBorder.imageUrl})`,
                                                    backgroundSize: 'contain',
                                                    backgroundPosition: 'center',
                                                    backgroundRepeat: 'no-repeat',
                                                }
                                                : {
                                                    border: '2px solid var(--skin-accent-color)',
                                                    borderRadius: '50%',
                                                }
                                            }
                                        />
                                        )}
                                    </div>
                                    <div className="absolute top-[3.3rem] bg-gray-900/90 rounded-full w-6 h-6 flex items-center justify-center border group-hover:scale-110 transition-transform z-10" style={{borderColor: 'var(--skin-accent-color)'}}>
                                        <span className="text-[11px] font-black text-white">{userProfile.level}</span>
                                    </div>
                                </button>

                                {/* Oracle Button */}
                                <button
                                    id="header-oracle"
                                    onClick={handleOracleClick}
                                    className={`absolute left-full ml-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 border border-white/10 hover:bg-white/10 hover:border-amber-500/50 transition-all group shadow-lg backdrop-blur-sm ${hasUnread ? 'animate-pulse ring-1 ring-amber-500/50' : ''}`}
                                    aria-label="Oracle Assistant"
                                >
                                    <SparklesIcon className={`w-5 h-5 transition-all ${hasUnread ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-amber-200/80 group-hover:text-amber-100 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'}`} />
                                    {unreadNotificationsCount > 0 && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border border-black">
                                            <span className="text-[9px] font-bold text-white">{unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <span className="text-center w-20 flex-shrink-0 text-[11px] tracking-[0.2em] bg-white/5 border px-3 py-1 rounded-full" style={{ borderColor: 'var(--skin-accent-color)' }}>{timeStr}</span>
                </div>
            </header>
            {isMoodModalOpen && <MoodModal onClose={() => setMoodModalOpen(false)} />}
            {isOracleOpen && <OracleFeed onClose={() => setOracleOpen(false)} />}
        </>
    );
};
