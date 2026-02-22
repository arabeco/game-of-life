import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { XIcon, SparklesIcon, MessageIcon, TrashIcon } from './Icons';
import { OracleChat } from './OracleChat';
import { Notification } from '../types';

interface OracleFeedProps {
    onClose: () => void;
}

type Tab = 'chat' | 'notifications';

export const OracleFeed: React.FC<OracleFeedProps> = ({ onClose }) => {
    const { notifications, markNotificationRead, deleteNotification, oracleMessages } = useGame();
    const [activeTab, setActiveTab] = useState<Tab>('chat');
    
    // Calculate unread counts for badges
    const unreadNotifications = notifications.filter(n => !n.read).length;
    // For chat, we might want to check if there's a new planted message or just use the general unread
    // But per instructions, the badge on the header is for notifications. 
    // Inside the modal, we can show a dot for unread chat messages too.
    const unreadChat = oracleMessages.some(m => !m.read);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            {/* Header / Tabs */}
            <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 gap-4">
                <div className="flex-1 flex p-1 bg-white/5 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${activeTab === 'chat' ? 'bg-[var(--skin-accent-color)] text-black shadow-lg font-bold' : 'text-gray-400 hover:text-white'}`}
                    >
                        <SparklesIcon className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-wider">ORÁCULO</span>
                        {unreadChat && activeTab !== 'chat' && <div className="w-2 h-2 rounded-full bg-amber-400 ml-1" />}
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('notifications')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all relative ${activeTab === 'notifications' ? 'bg-[var(--skin-accent-color)] text-black shadow-lg font-bold' : 'text-gray-400 hover:text-white'}`}
                    >
                        <MessageIcon className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-wider">NOTIFICAÇÕES</span>
                        {unreadNotifications > 0 && (
                            <div className={`ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full min-w-[1.25rem] text-center ${activeTab === 'notifications' ? 'bg-black/20 text-black' : 'bg-red-500 text-white'}`}>
                                {unreadNotifications > 9 ? '9+' : unreadNotifications}
                            </div>
                        )}
                    </button>
                </div>

                <button 
                    onClick={onClose}
                    className="flex-none w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'chat' ? (
                    <OracleChat onClose={onClose} hideHeader={true} isEmbedded={true} />
                ) : (
                    <NotificationsList 
                        notifications={notifications} 
                        onRead={markNotificationRead} 
                        onDelete={deleteNotification} 
                    />
                )}
            </div>
        </div>
    );
};

// --- Notifications Sub-Component ---

interface NotificationsListProps {
    notifications: Notification[];
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ notifications, onRead, onDelete }) => {
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
                />
            ))}
        </div>
    );
};

const NotificationItem: React.FC<{ 
    notification: Notification; 
    onRead: (id: string) => void; 
    onDelete: (id: string) => void; 
}> = ({ notification, onRead, onDelete }) => {
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [isSwiped, setIsSwiped] = useState(false);
    
    // Minimum swipe distance
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
        } else if (!notification.read) {
            onRead(notification.id);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(notification.id);
    };

    // Format relative time
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

    // Icon based on type
    const getIcon = () => {
        switch (notification.type) {
            case 'friend_request':
            case 'friend_accepted': return '👤';
            case 'clan_invite':
            case 'clan_join':
            case 'clan_mission_update': return '🛡️';
            case 'cycle_ending':
            case 'season_ending': return '⏰';
            case 'level_up': return '⬆️';
            case 'title_unlocked': return '👑';
            case 'mission_redeemable': return '🎁';
            default: return '📢';
        }
    };

    return (
        <div 
            className="relative overflow-hidden rounded-xl group select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Delete Background Layer */}
            <div className="absolute inset-0 bg-red-900/50 flex items-center justify-end px-4 rounded-xl">
                <TrashIcon className="w-5 h-5 text-red-200" />
            </div>

            {/* Foreground Card */}
            <div 
                onClick={handleTap}
                className={`
                    relative bg-black/60 border backdrop-blur-sm p-4 rounded-xl flex items-start gap-3 transition-all duration-300 ease-out
                    ${notification.read ? 'border-white/5 opacity-50 bg-black/40' : 'border-amber-500/30 bg-black/80'}
                    ${isSwiped ? '-translate-x-16' : 'translate-x-0'}
                    hover:bg-white/5 active:scale-[0.98]
                `}
            >
                <div className="text-xl flex-shrink-0 mt-0.5">{getIcon()}</div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${notification.read ? 'text-gray-400 font-normal' : 'text-gray-100 font-medium'}`}>
                        {notification.content}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                        {getTimeAgo(notification.createdAt)}
                    </p>
                </div>
            </div>

            {/* Delete Button (Visible when swiped or hover on desktop) */}
            <button
                onClick={handleDelete}
                className={`
                    absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center bg-red-600/80 hover:bg-red-500 transition-all duration-300
                    ${isSwiped ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'}
                `}
                aria-label="Delete"
            >
                <TrashIcon className="w-5 h-5 text-white" />
            </button>
        </div>
    );
};
