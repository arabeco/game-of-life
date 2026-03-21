
import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { MOODS_DATA, SKINS_DATA, BORDERS_DATA } from '../constants';
import { getUnreadBadgeCount, getVisibleNotificationsForProfile } from '../constants/oracleNotificationPolicy';
import { SparklesIcon, LockIcon } from './Icons';
import './global-header.css';
import { REST_SCREEN_ACTION_SESSION_EVENT, RestScreenActionSessionDetail } from '../utils/restScreenActionSession';

const MoodModal = React.lazy(() => import('./MoodModal').then(m => ({ default: m.MoodModal })));
const OracleFeed = React.lazy(() => import('./OracleFeed').then(m => ({ default: m.OracleFeed })));
const ClanDetailModal = React.lazy(() => import('./ClanDetailModal').then(m => ({ default: m.ClanDetailModal })));
const RestScreen = React.lazy(() => import('./RestScreen').then(m => ({ default: m.RestScreen })));

export const GlobalHeader: React.FC<{ onProfileClick: () => void; topOffsetPx?: number; defaultRestScreenOpen?: boolean }> = ({ onProfileClick, topOffsetPx = 0, defaultRestScreenOpen = true }) => {
    const { userProfile, oracleMessages, notifications, appMode, clan, oraclePreferences } = useGame();
    const [isMoodModalOpen, setMoodModalOpen] = useState(false);
    const [isOracleOpen, setOracleOpen] = useState(false);
    const [oracleInitialTab, setOracleInitialTab] = useState<'chat' | 'notifications' | 'clan' | 'dms'>('chat');
    const [isClanOpen, setClanOpen] = useState(false);
    const [isDeepWorkOpen, setDeepWorkOpen] = useState(false);
    const [isRestScreenOpen, setRestScreenOpen] = useState(defaultRestScreenOpen);
    const [restScreenActionSession, setRestScreenActionSession] = useState<RestScreenActionSessionDetail | null>(null);
    const hiddenAtRef = useRef<number | null>(null);
    const isBasicMode = appMode === 'BASIC';
    
    const visibleNotifications = getVisibleNotificationsForProfile(
        notifications,
        appMode,
        oraclePreferences?.activeMode || 'neutro',
    );
    const unreadNotificationsCount = getUnreadBadgeCount(visibleNotifications);
    const unreadVisibleNotificationsCount = visibleNotifications.filter(notification => !notification.read).length;
    const hasUnreadMessages = oracleMessages.some(m => !m.read);
    const hasUnread = hasUnreadMessages || unreadVisibleNotificationsCount > 0;
    
    // Time state
    const [currentDate, setCurrentDate] = useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentDate(new Date()), 10000); // Update every 10s to be safe
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleTutorialRestScreen = (e: any) => {
            if (e.detail?.open !== undefined) {
                setRestScreenOpen(e.detail.open);
            }
        };
        window.addEventListener('tutorialRestScreen', handleTutorialRestScreen);
        return () => window.removeEventListener('tutorialRestScreen', handleTutorialRestScreen);
    }, []);

    useEffect(() => {
        if (!defaultRestScreenOpen) {
            setRestScreenOpen(false);
        }
    }, [defaultRestScreenOpen]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                hiddenAtRef.current = Date.now();
                return;
            }

            const hiddenAt = hiddenAtRef.current;
            hiddenAtRef.current = null;
            if (!defaultRestScreenOpen || isRestScreenOpen || !hiddenAt) return;

            const hiddenDuration = Date.now() - hiddenAt;
            if (hiddenDuration >= 15000) {
                setRestScreenOpen(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [defaultRestScreenOpen, isRestScreenOpen]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const oracleTarget = params.get('oracle');
        if (oracleTarget === 'notifications' || oracleTarget === 'chat') {
            setOracleInitialTab(oracleTarget === 'notifications' ? 'notifications' : 'chat');
            setOracleOpen(true);
            params.delete('oracle');
            const nextSearch = params.toString();
            const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
            window.history.replaceState(window.history.state, '', nextUrl);
        }
    }, []);

    useEffect(() => {
        const handleOpenOracleNotifications = () => {
            setOracleInitialTab('notifications');
            setOracleOpen(true);
        };

        const handleOpenOracleChat = () => {
            setOracleInitialTab('chat');
            setOracleOpen(true);
        };

        window.addEventListener('openOracleNotifications', handleOpenOracleNotifications);
        window.addEventListener('openOracleChat', handleOpenOracleChat);
        return () => {
            window.removeEventListener('openOracleNotifications', handleOpenOracleNotifications);
            window.removeEventListener('openOracleChat', handleOpenOracleChat);
        };
    }, []);

    useEffect(() => {
        const handleRestScreenActionSession = (event: Event) => {
            const customEvent = event as CustomEvent<RestScreenActionSessionDetail>;
            if (!customEvent.detail) return;
            setRestScreenActionSession(customEvent.detail);
            setRestScreenOpen(true);
        };

        window.addEventListener(REST_SCREEN_ACTION_SESSION_EVENT, handleRestScreenActionSession as EventListener);
        return () => window.removeEventListener(REST_SCREEN_ACTION_SESSION_EVENT, handleRestScreenActionSession as EventListener);
    }, []);

    const day = currentDate.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
    const dateStr = currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); // 02/03
    const timeStr = currentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
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
        setOracleInitialTab(unreadVisibleNotificationsCount > 0 ? 'notifications' : 'chat');
        setOracleOpen(true);
    };

    // Common style for header chips
    const chipStyle = "shell-chip";

    return (
        <>
            <header className="shell-header fixed left-0 right-0 z-40 safe-area-top" style={{ top: topOffsetPx }}>
                <div className="max-w-7xl mx-auto relative flex items-center justify-between h-[76px] px-4 text-xs font-semibold text-gray-300">
                    {/* Date Chip */}
                    <div className={chipStyle}>
                        <span className="text-[10px] font-semibold tracking-[0.12em] text-[var(--skin-accent-color)] uppercase leading-none mb-0.5">{day}</span>
                        <span className="text-[12px] font-semibold text-[var(--skin-accent-color)] tracking-[0.08em] leading-none">{dateStr}</span>
                    </div>
                    
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[calc(100%-12rem)] flex items-center justify-center pointer-events-none">
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
                                {/* Rest Screen Button (Left) */}
                                <button
                                    id="lock-icon-button"
                                    onClick={() => setRestScreenOpen(true)}
                                    className="shell-float-button absolute right-full mr-2 group border border-[var(--skin-accent-color)]/30 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),rgba(0,0,0,0.82))] shadow-[0_0_18px_rgba(212,175,55,0.22)] hover:shadow-[0_0_24px_rgba(212,175,55,0.32)]"
                                    aria-label="Tela de Descanso"
                                >
                                    <LockIcon className="w-4 h-4 text-[var(--skin-accent-color)] group-hover:text-white transition-colors drop-shadow-[0_0_8px_var(--skin-accent-color)]" />
                                </button>

                                <button onClick={onProfileClick} className="flex flex-col items-center relative group flex-shrink-0" id="nobility-badge">
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
                                    <div className="shell-level-badge absolute top-[3.3rem] z-[60] group-hover:scale-110" style={{borderColor: 'var(--skin-accent-color)'}} id="oracle-pro-badge">
                                        <span className="text-[11px] font-black text-white">{userProfile.level}</span>
                                    </div>
                                </button>

                                {/* Oracle Button */}
                                <button
                                    id="header-oracle"
                                    onClick={handleOracleClick}
                                    className={`shell-float-button absolute left-full ml-2 group ${hasUnread ? 'animate-pulse ring-1 ring-amber-500/50' : ''}`}
                                    aria-label="Oracle Assistant"
                                >
                                    <SparklesIcon className={`w-5 h-5 transition-all ${hasUnread ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-amber-200/80 group-hover:text-amber-100 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'}`} />
                                    {unreadNotificationsCount > 0 && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border border-black">
                                            <span className="text-[9px] font-bold text-white">{unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}</span>
                                        </div>
                                    )}
                                    {unreadNotificationsCount === 0 && hasUnread && (
                                        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/70"></span>
                                            <span className="relative inline-flex h-3 w-3 rounded-full border border-black bg-amber-400"></span>
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Time Chip */}
                    <div className={chipStyle}>
                        <span className="text-[15px] font-semibold tracking-[0.08em] text-[var(--skin-accent-color)] leading-none">{timeStr}</span>
                    </div>
                </div>
            </header>
            <Suspense fallback={null}>
                {isMoodModalOpen && <MoodModal onClose={() => setMoodModalOpen(false)} />}
                {isOracleOpen && <OracleFeed initialTab={oracleInitialTab} onClose={() => setOracleOpen(false)} />}
                {isClanOpen && clan && <ClanDetailModal clanName={clan.name} onClose={() => setClanOpen(false)} />}
                {isRestScreenOpen && (
                    <RestScreen 
                        onClose={() => {
                            setRestScreenOpen(false);
                        }} 
                        onOpenMood={() => setMoodModalOpen(true)}
                        onOpenOracle={() => setOracleOpen(true)}
                        onOpenClan={() => setClanOpen(true)}
                        onOpenDeepWork={() => setDeepWorkOpen(true)}
                        actionSession={restScreenActionSession}
                        onClearActionSession={() => {
                            setRestScreenActionSession(null);
                            setRestScreenOpen(false);
                        }}
                    />
                )}
            </Suspense>
        </>
    );
};


