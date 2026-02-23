import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { XIcon, ShareIcon, CheckIcon } from './Icons';
import { FeedEventType } from '../types';
import { SKINS_DATA } from '../constants/GMboard';
import { VideoPlayer } from './VideoPlayer';

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
            return { title: "PARABÉNS!", icon: '👑', message: `Você subiu de patente para ${data.name}!` };
        case 'CLAN_RANK_UP':
            return { title: "Patente do Clã Aumentou!", icon: '🏛️', message: `Seu clã agora é um ${data.name}!` };
        default:
            return { title: "Conquista!", icon: '🏆', message: "Você realizou um feito notável." };
    }
};

export const AchievementModal: React.FC<AchievementModalProps> = ({ achievement, onClose }) => {
    const { addFeedEvent, userProfile } = useGame();
    const { title, icon, message } = getAchievementDetails(achievement.type, achievement.data);
    const [showContent, setShowContent] = useState(false);

    // Get user skin color
    const userSkinId = userProfile.skin;
    const userSkin = SKINS_DATA.find(s => s.id === userSkinId);
    const skinColor = userSkin?.color || '#ffffff';

    const isRankUp = achievement.type === 'PLAYER_RANK_UP';

    // For Rank Up, we want to show the video and content together
    useEffect(() => {
        setShowContent(true); // Always show content
    }, []);

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
        alert("Compartilhamento de PNG para esta conquista ainda não implementado.");
    };

    const canShare = achievement.type === 'ARENA_COMPLETED';

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10001] flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
            <GlassCard 
                variant="accent" 
                className="w-full max-w-sm overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col border border-white/10 bg-gradient-to-b from-gray-900 via-[#0a0a0a] to-black"
                style={{ borderColor: skinColor, boxShadow: `0 0 30px ${skinColor}20` }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header Title - Hide for Rank Up as it appears in video */}
                {!isRankUp && (
                    <div className="pt-6 pb-4 px-6 text-center z-20 relative">
                        <h2 
                            className="text-xl font-bold text-white uppercase tracking-widest"
                            style={{ textShadow: `0 0 15px ${skinColor}40` }}
                        >
                            {title}
                        </h2>
                    </div>
                )}

                {isRankUp ? (
                    <div className="relative w-full aspect-video bg-black border-y border-white/5 group mt-0">
                         <VideoPlayer
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/rank_up.mp4`}
                            onEnd={() => {}} 
                            className="w-full h-full object-cover opacity-90"
                            placeholderLabel="Level Up!"
                            duration={4000}
                            playbackRate={1.0}
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 pointer-events-none" />
                         
                         <div className="absolute bottom-4 left-0 right-0 text-center z-20">
                            <h2 
                                className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-pulse"
                                style={{ textShadow: `0 0 15px ${skinColor}` }}
                            >
                                {title}
                            </h2>
                        </div>
                    </div>
                 ) : (
                    <div className="relative w-full h-32 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-center border-y border-white/5">
                        <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center border-2 animate-bounce-slow shadow-lg"
                            style={{ borderColor: skinColor, backgroundColor: `${skinColor}10` }}
                        >
                            <span className="text-3xl filter drop-shadow-lg">{icon}</span>
                        </div>
                    </div>
                 )}

                {/* Content Section */}
                <div className="p-6 text-center space-y-4 relative z-10">
                    <div>
                        <p className="text-gray-400 text-xs font-medium leading-relaxed max-w-[90%] mx-auto">{message}</p>
                    </div>

                    {/* Reward Miniature for Rank Up */}
                    {isRankUp && achievement.data.rewards && (
                        <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 justify-center mb-2 animate-fade-in-up">
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-lg border border-yellow-500/30 flex items-center justify-center">
                                <span className="text-lg filter drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">✨</span>
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Recompensa</p>
                                <p className="text-xs font-bold text-white">
                                    {achievement.data.rewards.exp ? `+${achievement.data.rewards.exp} XP` : 'Recompensa de Nível'}
                                </p>
                            </div>
                            {achievement.data.rewards.chest && (
                                <>
                                    <div className="w-px h-6 bg-white/10 mx-1"></div>
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-transparent rounded-lg border border-purple-500/30 flex items-center justify-center">
                                        <span className="text-lg">📦</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] text-gray-500 uppercase tracking-wider">Bônus</p>
                                        <p className="text-xs font-bold text-white">
                                            {achievement.data.rewards.chest}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="space-y-3 pt-2">
                         <div className="flex gap-2">
                            {canShare && (
                                <button 
                                    onClick={handleSharePNG} 
                                    className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"
                                >
                                    <ShareIcon className="w-4 h-4"/>
                                </button>
                            )}
                            <button 
                                onClick={handlePostToFeed} 
                                className="flex-1 py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all hover:brightness-110 flex items-center justify-center gap-2"
                                style={{ backgroundColor: `${skinColor}15`, border: `1px solid ${skinColor}40`, color: skinColor }}
                            >
                                <ShareIcon className="w-3 h-3" />
                                Postar no Feed
                            </button>
                        </div>
                        
                        <button 
                            onClick={onClose} 
                            className="w-full py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px] bg-white/5 text-gray-400 hover:bg-white/10 transition-all border border-white/5 hover:text-white"
                        >
                            OK
                        </button>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
