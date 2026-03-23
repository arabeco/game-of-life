import React from 'react';
import { FeedEvent } from '../types';
import { GlassCard } from './GlassCard';
import { useGame } from '../contexts/GameContext';
import { CrownIcon, ShareIcon } from './Icons';
import { shareElementWithFeedback } from './Share';

const getEventMessage = (event: FeedEvent): string => {
    switch (event.type) {
        case 'MILESTONE_COMPLETED':
            return `completou o marco: "${event.content.title}"`;
        case 'ARENA_COMPLETED':
            return `concluiu a meta da arena: "${event.content.title}"`;
        case 'CYCLE_COMPLETED':
            return `encerrou o ciclo "${event.content.title}" com Score ${event.content.score}!`;
        case 'PLAYER_RANK_UP':
            return `alcançou a patente de Nobreza: ${event.content.rankName}!`;
        case 'CLAN_RANK_UP':
            return `ajudou o grupo a alcancar a patente: ${event.content.rankName}!`;
        default:
            return 'realizou um feito notável.';
    }
};

const getEventIcon = (event: FeedEvent): string => {
    if (event.content.icon) return event.content.icon;
    switch (event.type) {
        case 'PLAYER_RANK_UP': return '👑';
        case 'CLAN_RANK_UP': return '🏛️';
        case 'CYCLE_COMPLETED': return '📜';
        default: return '🏆';
    }
}

export const FeedEventCard: React.FC<{ event: FeedEvent }> = ({ event }) => {
    const { friends, userProfile, showToast } = useGame();
    const allUsers = [userProfile, ...friends];
    const author = allUsers.find(u => u.id === event.userId);

    if (!author) return null; // Don't render event if we can't find the author

    const timeAgo = (date: Date): string => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "a";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "m";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "min";
        return Math.floor(seconds) + "s";
    }

    return (
        <GlassCard id={`feed-event-${event.id}`} variant="neutral" className="p-3 animate-fade-in relative">
            <div className="flex items-start space-x-3">
                <img src={author.avatarUrl} alt={author.nickname} className="w-10 h-10 rounded-full border-2 border-white/20"/>
                <div className="flex-grow">
                    <div className="flex justify-between items-baseline">
                        <p className="text-sm pr-6">
                            <span className="font-bold text-white">{author.nickname}</span>
                            <span className="text-gray-400"> {getEventMessage(event)}</span>
                        </p>
                        <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{timeAgo(new Date(event.timestamp))}</p>
                    </div>
                     <div className="flex items-center space-x-4 mt-2">
                        <span className="text-2xl">{getEventIcon(event)}</span>
                        <div className="flex items-center gap-2">
                            <button className="p-1 text-gray-400 hover:text-[var(--skin-accent-color)] transition-colors" data-html2canvas-ignore>
                                <CrownIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => {
                                    void shareElementWithFeedback(showToast, `feed-event-${event.id}`, {
                                        title: `Conquista de ${author.nickname} - Life OS`,
                                        preparingMessage: 'Preparando compartilhamento da conquista...',
                                        sharedMessage: 'Conquista compartilhada.',
                                        cancelledMessage: 'Compartilhamento cancelado.',
                                        errorMessage: 'Nao foi possivel preparar a conquista para compartilhar.',
                                    });
                                }}
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                data-html2canvas-ignore
                            >
                                <ShareIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};
