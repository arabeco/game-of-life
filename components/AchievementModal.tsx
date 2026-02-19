import React from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { XIcon, ShareIcon } from './Icons';
import { FeedEventType } from '../types';

interface AchievementModalProps {
    achievement: { type: FeedEventType; data: any; };
    onClose: () => void;
}

const getAchievementDetails = (type: FeedEventType, data: any) => {
    switch (type) {
        case 'MILESTONE_COMPLETED':
            return { title: "Marco Concluído!", icon: data.icon, message: `Você concluiu o marco "${data.name}".` };
        case 'ARENA_COMPLETED':
            return { title: "Meta da Arena Atingida!", icon: data.icon, message: `Você cumpriu todas as ações da arena "${data.name}".` };
        case 'PLAYER_RANK_UP':
            return { title: "Promoção de Patente!", icon: '👑', message: `Você foi promovido para ${data.name}!` };
        case 'CLAN_RANK_UP':
            return { title: "Patente do Clã Aumentou!", icon: '🏛️', message: `Seu clã agora é um ${data.name}!` };
        default:
            return { title: "Conquista!", icon: '🏆', message: "Você realizou um feito notável." };
    }
};


export const AchievementModal: React.FC<AchievementModalProps> = ({ achievement, onClose }) => {
    const { addFeedEvent } = useGame();
    const { title, icon, message } = getAchievementDetails(achievement.type, achievement.data);

    const handlePostToFeed = () => {
        let content;
        switch(achievement.type) {
            case 'MILESTONE_COMPLETED':
            case 'ARENA_COMPLETED':
                content = { title: achievement.data.name, icon: achievement.data.icon };
                break;
            case 'PLAYER_RANK_UP':
            case 'CLAN_RANK_UP':
                content = { rankName: achievement.data.name, icon };
                break;
            default:
                content = { title: 'Feito notável' };
        }
        addFeedEvent({ type: achievement.type, content });
        onClose();
    };

    const handleSharePNG = () => {
        // This is complex. For now, let's just alert the user.
        alert("Compartilhamento de PNG para esta conquista ainda não implementado.");
    };

    const canShare = achievement.type === 'ARENA_COMPLETED';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="accent" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-end">
                     <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5"/></button>
                </div>
                <div className="text-center space-y-3">
                    <div className="w-24 h-24 bg-black/20 rounded-full flex items-center justify-center mx-auto border-4 border-[var(--skin-accent-color)]">
                        <span className="text-5xl animate-pulse">{icon}</span>
                    </div>
                    <h2 className="text-2xl font-black text-white luxe-title-shadow">{title}</h2>
                    <p className="text-gray-300">{message}</p>
                </div>
                <div className="space-y-2">
                    <div className="flex space-x-2">
                        {canShare && (
                            <button onClick={handleSharePNG} className="py-3 rounded-xl luxe-button-secondary flex-shrink-0 px-4">
                                <ShareIcon className="w-5 h-5"/>
                            </button>
                        )}
                        <button onClick={handlePostToFeed} className="w-full py-3 rounded-xl luxe-button-secondary">
                            Postar no Feed
                        </button>
                    </div>
                    <button onClick={onClose} className="w-full py-3 rounded-xl luxe-skin-button">
                        OK
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};
