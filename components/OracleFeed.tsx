import React, { Suspense, lazy, useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { XIcon, SparklesIcon, MessageIcon, TrashIcon, UsersIcon } from './Icons';
import { ClanChat } from './ClanChat';
import { DirectMessages } from './DirectMessages';
import { Notification, OracleMode } from '../types';
import { Portal } from './Portal';
import {
    getNotificationBody,
    getNotificationIcon,
    getNotificationLabel,
    getNotificationLane,
    getNotificationLaneLabel,
    getNotificationTitle,
    getUnreadBadgeCount,
    getVisibleNotificationsForProfile,
} from '../constants/oracleNotificationPolicy';

const OracleChat = lazy(() =>
    import('./OracleChat').then((module) => ({ default: module.OracleChat }))
);

interface OracleFeedProps {
    onClose: () => void;
    initialTab?: Tab;
}

type Tab = 'chat' | 'notifications' | 'clan' | 'dms';

export const OracleFeed: React.FC<OracleFeedProps> = ({ onClose, initialTab = 'chat' }) => {
    const { notifications, markNotificationRead, deleteNotification, oracleMessages, clan, dmConversations, appMode, oraclePreferences } = useGame();
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const activeOracleMode = oraclePreferences?.activeMode || 'neutro';
    const visibleNotifications = getVisibleNotificationsForProfile(notifications, appMode, activeOracleMode);
    const unreadNotifications = getUnreadBadgeCount(visibleNotifications);
    const unreadDMs = dmConversations.reduce((acc, conv) => acc + conv.unreadCount, 0);
    // For chat, we might want to check if there's a new planted message or just use the general unread
    // But per instructions, the badge on the header is for notifications. 
    // Inside the modal, we can show a dot for unread chat messages too.
    const unreadChat = oracleMessages.some(m => !m.read);

    return (
        <Portal>
            <div className="fixed inset-0 z-[10000] pointer-events-none flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto" onClick={onClose} />
            <GlassCard 
                variant="neutral" 
                className="w-full max-w-lg h-[80vh] pointer-events-auto rounded-3xl flex flex-col overflow-hidden !p-0 border border-white/10 shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header / Tabs */}
                <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 gap-4">
                    <div className="flex-1 flex p-1 bg-white/5 rounded-xl overflow-hidden overflow-x-auto no-scrollbar">
                        <button 
                            onClick={() => setActiveTab('chat')}
                            className={`flex-none sm:flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${activeTab === 'chat' ? 'bg-[var(--skin-accent-color)] text-black shadow-lg font-bold' : 'text-gray-400 hover:text-white'}`}
                        >
                            <SparklesIcon className="w-4 h-4" />
                            <span className="text-[10px] font-bold tracking-wider hidden sm:inline">ORÁCULO</span>
                            {unreadChat && activeTab !== 'chat' && <div className="w-2 h-2 rounded-full bg-amber-400 ml-1" />}
                        </button>

                        <button 
                            onClick={() => setActiveTab('clan')}
                            className={`flex-none sm:flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all relative ${activeTab === 'clan' ? 'bg-[var(--skin-accent-color)] text-black shadow-lg font-bold' : 'text-gray-400 hover:text-white'}`}
                        >
                            <UsersIcon className="w-4 h-4" />
                            <span className="text-[10px] font-bold tracking-wider hidden sm:inline">CLÃ</span>
                        </button>

                        <button 
                            onClick={() => setActiveTab('dms')}
                            className={`flex-none sm:flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all relative ${activeTab === 'dms' ? 'bg-[var(--skin-accent-color)] text-black shadow-lg font-bold' : 'text-gray-400 hover:text-white'}`}
                        >
                            <MessageIcon className="w-4 h-4" />
                            <span className="text-[10px] font-bold tracking-wider hidden sm:inline">MENSAGENS</span>
                            {unreadDMs > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white shadow-lg border border-black/20 animate-in zoom-in-50 duration-300">
                                  {unreadDMs}
                                </span>
                            )}
                        </button>
                        
                        <button 
                            onClick={() => setActiveTab('notifications')}
                            className={`flex-none sm:flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all relative ${activeTab === 'notifications' ? 'bg-[var(--skin-accent-color)] text-black shadow-lg font-bold' : 'text-gray-400 hover:text-white'}`}
                        >
                            <MessageIcon className="w-4 h-4" />
                            <span className="text-[10px] font-bold tracking-wider hidden sm:inline">AVISOS</span>
                            {unreadNotifications > 0 && (
                                <span className="absolute top-1 right-1 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}
                        </button>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative">
                    {activeTab === 'chat' && (
                        <div className="absolute inset-0 animate-in slide-in-from-left-4 duration-200">
                            <Suspense fallback={<div className="absolute inset-0 bg-black/30 animate-pulse" />}>
                                <OracleChat onClose={onClose} isEmbedded={true} />
                            </Suspense>
                        </div>
                    )}

                    {activeTab === 'clan' && (
                        <div className="absolute inset-0 animate-in slide-in-from-right-4 duration-200 bg-black/20 p-2">
                             <ClanChat />
                        </div>
                    )}

                    {activeTab === 'dms' && (
                        <div className="absolute inset-0 animate-in slide-in-from-right-4 duration-200">
                             <DirectMessages />
                        </div>
                    )}
                    
                    {activeTab === 'notifications' && (
                        <NotificationsList 
                            notifications={visibleNotifications} 
                            onRead={markNotificationRead} 
                            onDelete={deleteNotification} 
                            oracleMode={activeOracleMode}
                        />
                    )}
                </div>
            </GlassCard>
        </div>
        </Portal>
    );
};

// --- Notifications Sub-Component ---

interface NotificationsListProps {
    notifications: Notification[];
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
    oracleMode: OracleMode;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ notifications, onRead, onDelete, oracleMode }) => {
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                <MessageIcon className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">Nenhuma notificação no momento.</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-4 space-y-3 pb-20">
            {notifications.map(notification => (
                <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onRead={onRead} 
                    onDelete={onDelete} 
                    onOpen={setSelectedNotification}
                />
            ))}
            {selectedNotification && (
                <NotificationDetailModal
                    notification={selectedNotification}
                    oracleMode={oracleMode}
                    onClose={() => setSelectedNotification(null)}
                    onRead={onRead}
                    onDelete={onDelete}
                />
            )}
        </div>
    );
};

const NotificationItem: React.FC<{
    notification: Notification;
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
    onOpen: (notification: Notification) => void;
}> = ({ notification, onRead, onDelete, onOpen }) => {
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [isSwiped, setIsSwiped] = useState(false);

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            setIsSwiped(true);
        } else if (isRightSwipe) {
            setIsSwiped(false);
        }
    };

    const handleTap = () => {
        if (isSwiped) {
            setIsSwiped(false);
            return;
        }

        if (!notification.read) {
            onRead(notification.id);
        }
        onOpen(notification);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(notification.id);
    };

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'agora';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `há ${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `há ${hours}h`;
        const days = Math.floor(hours / 24);
        return `há ${days}d`;
    };

    const lane = getNotificationLane(notification.type);
    const label = getNotificationLabel(notification.type);
    const laneLabel = getNotificationLaneLabel(notification.type);
    const icon = getNotificationIcon(notification.type);
    const title = getNotificationTitle(notification);
    const readStateLabel = notification.read ? 'Lida' : 'Nao lida';

    const laneVisuals = {
        essential: {
            accent: '#D9A84F',
            tint: 'rgba(217, 168, 79, 0.12)',
            border: notification.read ? 'rgba(217, 168, 79, 0.10)' : 'rgba(217, 168, 79, 0.28)',
            rail: 'rgba(217, 168, 79, 0.90)',
        },
        progress: {
            accent: '#8AA0FF',
            tint: 'rgba(138, 160, 255, 0.12)',
            border: notification.read ? 'rgba(138, 160, 255, 0.10)' : 'rgba(138, 160, 255, 0.24)',
            rail: 'rgba(138, 160, 255, 0.88)',
        },
        feed: {
            accent: '#6BD1C2',
            tint: 'rgba(107, 209, 194, 0.10)',
            border: notification.read ? 'rgba(107, 209, 194, 0.08)' : 'rgba(107, 209, 194, 0.18)',
            rail: 'rgba(107, 209, 194, 0.82)',
        },
    } as const;

    const visual = laneVisuals[lane];

    return (
        <div
            className="relative overflow-hidden rounded-[24px] group select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div className="absolute inset-0 rounded-[24px] border border-red-500/30 bg-[linear-gradient(90deg,rgba(83,12,12,0.86),rgba(148,24,24,0.86))] flex items-center justify-end px-5">
                <TrashIcon className="w-5 h-5 text-red-200" />
            </div>

            <div
                onClick={handleTap}
                className={`relative overflow-hidden rounded-[24px] transition-all duration-300 ease-out ${isSwiped ? '-translate-x-16' : 'translate-x-0'} active:scale-[0.985]`}
                style={{
                    backgroundImage: `linear-gradient(90deg, rgba(4,7,12,0.96) 0%, ${visual.tint} 100%)`,
                    border: `1px solid ${visual.border}`,
                    boxShadow: notification.read
                        ? '0 10px 26px -22px rgba(0,0,0,0.75)'
                        : `0 14px 34px -26px ${visual.tint}, inset 0 1px 0 rgba(255,255,255,0.04)`,
                    opacity: notification.read ? 0.72 : 1,
                }}
            >
                <div
                    className="absolute left-3 top-3 bottom-3 w-[2px] rounded-full"
                    style={{ backgroundColor: visual.rail, boxShadow: `0 0 14px ${visual.rail}` }}
                />
                {!notification.read && (
                    <div
                        className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: visual.accent, boxShadow: `0 0 10px ${visual.accent}` }}
                    />
                )}

                <div className="relative flex items-start gap-3 px-5 py-3 pl-7">
                    <div
                        className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border text-xs font-black tracking-[0.22em]"
                        style={{
                            color: visual.accent,
                            borderColor: visual.border,
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 18px -16px ${visual.tint}`,
                        }}
                    >
                        {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: visual.accent }}>
                                        {label}
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/30">
                                        {laneLabel}
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${notification.read ? 'text-white/25' : 'text-white/55'}`}>
                                        {readStateLabel}
                                    </span>
                                </div>
                                <p className={`mt-1 text-sm leading-snug ${notification.read ? 'text-gray-300 font-medium' : 'text-white font-semibold'}`}>
                                    {title}
                                </p>
                            </div>
                            <span className="mt-0.5 flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
                                {getTimeAgo(notification.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleDelete}
                className={`absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center bg-red-600/80 transition-all duration-300 hover:bg-red-500 ${isSwiped ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'}`}
                aria-label="Excluir"
            >
                <TrashIcon className="w-5 h-5 text-white" />
            </button>
        </div>
    );
};

const NotificationDetailModal: React.FC<{
    notification: Notification;
    oracleMode: OracleMode;
    onClose: () => void;
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ notification, oracleMode, onClose, onRead, onDelete }) => {
    const lane = getNotificationLane(notification.type);
    const label = getNotificationLabel(notification.type);
    const laneLabel = getNotificationLaneLabel(notification.type);
    const icon = getNotificationIcon(notification.type);
    const title = getNotificationTitle(notification);
    const body = getNotificationBody(notification, oracleMode);

    const accentByLane = {
        essential: '#D9A84F',
        progress: '#8AA0FF',
        feed: '#6BD1C2',
    } as const;

    const accent = accentByLane[lane];

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/65 backdrop-blur-[3px]" />
            <div
                className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,11,17,0.98),rgba(5,7,11,0.97))] p-5 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{ backgroundColor: accent, boxShadow: `0 0 16px ${accent}` }}
                />
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                        <div
                            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border text-sm font-black tracking-[0.22em]"
                            style={{
                                color: accent,
                                borderColor: `${accent}44`,
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
                            }}
                        >
                            {icon}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: accent }}>
                                    {label}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/35">
                                    {laneLabel}
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${notification.read ? 'text-white/30' : 'text-white/60'}`}>
                                    {notification.read ? 'Lida' : 'Nao lida'}
                                </span>
                            </div>
                            <h3 className="mt-2 text-lg font-black leading-tight text-white">
                                {title}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full bg-white/5 p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Fechar"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                    <p className="text-sm leading-relaxed text-white/88">
                        {body}
                    </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                        Toque fora para fechar
                    </div>
                    <div className="flex items-center gap-2">
                        {!notification.read && (
                            <button
                                onClick={() => onRead(notification.id)}
                                className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/75 transition-colors hover:bg-white/5"
                            >
                                Marcar lida
                            </button>
                        )}
                        <button
                            onClick={() => {
                                onDelete(notification.id);
                                onClose();
                            }}
                            className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-200 transition-colors hover:bg-red-500/15"
                        >
                            Excluir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

