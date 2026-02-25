import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { XIcon, CheckIcon, ShareIcon } from './Icons';
import { FeedEventType } from '../types';
import { SKINS_DATA } from '../constants/GMboard';
import { VideoPlayer } from './VideoPlayer';
import { Portal } from './Portal';

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
    const { addFeedEvent, userProfile, showToast } = useGame();
    const { title, icon, message } = getAchievementDetails(achievement.type, achievement.data);
    const [showContent, setShowContent] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Get user skin color
    const userSkinId = userProfile.skin;
    const userSkin = SKINS_DATA.find(s => s.id === userSkinId);
    const skinColor = userSkin?.color || '#ffffff';

    const isRankUp = achievement.type === 'PLAYER_RANK_UP';

    // For Rank Up, we want to show the video first, then content
    useEffect(() => {
        if (isRankUp) {
            // trigger('level_up'); // TODO: Implement trigger or remove
            setShowContent(false); // Hide initially for rank-up
            
            // Safety timeout: if video doesn't end or fails to load, show content after 4.5s
            // Video duration is 4s
            const timer = setTimeout(() => {
                setShowContent(true);
            }, 4500);
            return () => clearTimeout(timer);
        } else {
            setShowContent(true); // Show immediately for non-rank-up
        }
    }, [isRankUp]);

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

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10001] flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
                <GlassCard 
                    ref={cardRef}
                    variant="neutral" 
                    className="w-full max-w-sm aspect-[9/16] overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col justify-center border bg-gradient-to-b from-gray-900 via-[#0a0a0a] to-black"
                    style={{ borderColor: skinColor, boxShadow: `0 0 30px ${skinColor}20` }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Video Background for Rank Up */}
                {isRankUp && (
                    <div className="absolute inset-0 z-0 bg-black">
                         <VideoPlayer
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/levelup.mp4`}
                            onEnd={() => setShowContent(true)} 
                            className={`w-full h-full object-cover transition-opacity duration-1000 ${showContent ? 'opacity-10' : 'opacity-100'}`}
                            placeholderLabel="Level Up!"
                            duration={4000}
                            playbackRate={1.0}
                            loop={false}
                            audioFadeOut={true}
                        />
                         <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/60 to-[#0a0a0a] transition-opacity duration-1000 ${showContent ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                )}

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

                {!isRankUp && (
                    <div className="relative w-full h-32 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-center border-y border" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center border-2 animate-bounce-slow shadow-lg"
                            style={{ borderColor: skinColor, backgroundColor: `${skinColor}10` }}
                        >
                            <span className="text-3xl filter drop-shadow-lg">{icon}</span>
                        </div>
                    </div>
                )}

                {/* Content Section */}
                <div className={`p-6 text-center space-y-4 relative z-10 ${isRankUp ? 'mt-8' : ''} transition-opacity duration-1000 ${isRankUp && !showContent ? 'opacity-0' : 'opacity-100'}`}>
                    {isRankUp && (
                         <div className="text-center z-20 mb-4">
                            <h2 
                                className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-pulse"
                                style={{ textShadow: `0 0 15px ${skinColor}` }}
                            >
                                {title}
                            </h2>
                        </div>
                    )}
                    
                    <div>
                        <p className="text-gray-400 text-xs font-medium leading-relaxed max-w-[90%] mx-auto">{message}</p>
                    </div>

                    {/* Reward Miniature for Rank Up */}
                    {isRankUp && achievement.data.rewards && (
                        <div className="w-full bg-white/5 border rounded-xl p-3 flex flex-wrap gap-3 justify-center mb-2 animate-fade-in-up" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                            {/* XP Reward */}
                            <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5 min-w-[120px] justify-center flex-1">
                                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-lg border border-yellow-500/30 flex items-center justify-center shrink-0">
                                    <span className="text-lg filter drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">✨</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] text-gray-500 uppercase tracking-wider">Recompensa</p>
                                    <p className="text-xs font-bold text-white whitespace-nowrap">
                                        {achievement.data.rewards.exp ? `+${achievement.data.rewards.exp} XP` : 'Level Up'}
                                    </p>
                                </div>
                            </div>

                            {/* Chest Reward */}
                            {achievement.data.rewards.chest && (
                                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5 min-w-[120px] justify-center flex-1">
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-transparent rounded-lg border border-purple-500/30 flex items-center justify-center shrink-0">
                                        <span className="text-lg">📦</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] text-gray-500 uppercase tracking-wider">Bônus</p>
                                        <p className="text-xs font-bold text-white whitespace-nowrap">
                                            {achievement.data.rewards.chest}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Ornament Reward */}
                            {achievement.data.rewards.ornament && (
                                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5 min-w-[120px] justify-center flex-1">
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-transparent rounded-lg border border-purple-500/30 flex items-center justify-center shrink-0">
                                        <span className="text-lg">🎖️</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] text-gray-500 uppercase tracking-wider">Patente</p>
                                        <p className="text-xs font-bold text-white whitespace-nowrap">
                                            {achievement.data.rewards.ornament}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-3 pt-2">
                         <div className="flex gap-2">
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
                            className="w-full py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px] bg-white/5 text-gray-400 hover:bg-white/10 transition-all border hover:text-white"
                            style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            </GlassCard>
            </div>
        </Portal>
    );
};
