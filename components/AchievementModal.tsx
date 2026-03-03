import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { XIcon, CheckIcon, ShareIcon } from './Icons';
import { FeedEventType } from '../types';
import { SKINS_DATA } from '../constants/GMboard';
import { VideoPlayer } from './VideoPlayer';
import { Portal } from './Portal';
import { resolveItemDef } from '../constants/items';

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
        case 'QUEST_COMPLETED':
            return { title: "MISSÃO CONCLUÍDA!", icon: data.icon || '📜', message: `Você concluiu a missão "${data.title}".` };
        case 'REPORT_COMPLETED':
            return { title: "RELATÓRIO CONCLUÍDO!", icon: '📊', message: `Você enviou seu relatório diário com sucesso!` };
        case 'CLAN_RANK_UP':
            return { title: "Patente do Clã Aumentou!", icon: '🏛️', message: `Seu clã agora é um ${data.name}!` };
        default:
            return { title: "Conquista!", icon: '🏆', message: "Você realizou um feito notável." };
    }
};

export const AchievementModal: React.FC<AchievementModalProps> = ({ achievement, onClose }) => {
    const { addFeedEvent, userProfile, showToast, appMode } = useGame();
    const { title, icon, message } = getAchievementDetails(achievement.type, achievement.data);
    const [showContent, setShowContent] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Only show in GAME mode if requested (User requirement: "notificações de bau e nivel de patente sao aenas no modo game")
    // Note: AchievementModal is mounted in App.tsx or MainApp based on achievementUnlocked state.
    // If we return null here, it effectively hides it.
    if (appMode !== 'GAME') {
        // We should probably close it automatically so it doesn't get stuck in state
        // But we can't call onClose inside render. 
        // We'll handle this with a useEffect.
    }

    useEffect(() => {
        if (appMode !== 'GAME') {
            onClose();
        }
    }, [appMode, onClose]);

    if (appMode !== 'GAME') return null;

    // Get user skin color
    const userSkinId = userProfile.skin;
    const userSkin = SKINS_DATA.find(s => s.id === userSkinId);
    const skinColor = userSkin?.color || '#ffffff';

    const isRankUp = achievement.type === 'PLAYER_RANK_UP';
    const isQuestComplete = achievement.type === 'QUEST_COMPLETED';
    const isReportComplete = achievement.type === 'REPORT_COMPLETED';
    const showVideo = isRankUp || isQuestComplete || isReportComplete;

    // Normalize rewards
    const rawRewards = achievement.data.rewards || achievement.data.reward || {};
    const normalizedRewards = {
        exp: rawRewards.exp,
        chest: rawRewards.chest,
        ornament: rawRewards.ornament,
        items: rawRewards.items || (rawRewards.item ? [rawRewards.item] : [])
    };

    // For Rank Up and Quest Complete, we want to show the video first, then content
    useEffect(() => {
        if (showVideo) {
            // trigger('level_up'); // TODO: Implement trigger or remove
            setShowContent(false); // Hide initially for video types
            
            // Safety timeout: if video doesn't end or fails to load, show content after 4.5s
            // Video duration is 4s
            const timer = setTimeout(() => {
                setShowContent(true);
            }, 4500);
            return () => clearTimeout(timer);
        } else {
            setShowContent(true); // Show immediately for non-video types
        }
    }, [showVideo]);

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
            case 'QUEST_COMPLETED':
            case 'REPORT_COMPLETED':
                content = { title: achievement.data.title || 'Relatório Diário', icon };
                break;
            default:
                content = { title: 'Feito notável' };
        }
        addFeedEvent({ type: achievement.type, content });
        handleClose();
    };

    const handleClose = () => {
        // Show toast with rewards if any
        if (achievement.data.rewards || achievement.data.reward) {
            const rewards = achievement.data.rewards || achievement.data.reward;
            let messages: string[] = [];
            
            // Handle multiple items if present, otherwise handle single item
            const items = rewards.items || (rewards.item ? [rewards.item] : []);
            
            if (items.length > 0) {
                // Deduplicate items for toast summary
                const uniqueItems = [...new Set(items)];
                
                // Map each item to a toast line
                const itemLines = uniqueItems.map((itemId: unknown) => {
                    const id = String(itemId);
                    const itemDef = resolveItemDef(id);
                    if (itemDef?.category === 'insignia' || itemDef?.category === 'insignias') {
                        return `✦ Insígnia ${itemDef.name} adicionada`;
                    } else {
                        return `✦ Item ${itemDef?.name || id} adicionado`;
                    }
                });

                // Add up to 3 individual item lines, then summarize
                const maxIndividualLines = 3;
                if (itemLines.length <= maxIndividualLines) {
                    messages.push(...itemLines);
                } else {
                    messages.push(...itemLines.slice(0, maxIndividualLines));
                    messages.push(`✦ ...e mais ${itemLines.length - maxIndividualLines} itens`);
                }
            } 
            
            if (rewards.chest) {
                messages.push(`✦ Baú ${rewards.chest} adicionado`);
            } 
            
            if (rewards.ornament) {
                const itemDef = resolveItemDef(rewards.ornament);
                messages.push(`✦ Ornamento ${itemDef?.name || rewards.ornament} adicionado`);
            }

            if (rewards.exp && rewards.exp > 0) {
                messages.push(`✦ +${rewards.exp} XP computados`);
            }

            if (messages.length > 0) {
                showToast(messages.join('\n'));
            }
        }
        onClose();
    };

    return (
        <Portal>
            <div 
                className="fixed inset-0 z-[10001] flex items-center justify-center p-4 transition-all duration-500 bg-black/90 backdrop-blur-md"
                onClick={handleClose}
            >
                <GlassCard 
                    ref={cardRef}
                    variant="neutral" 
                    className="w-full max-w-sm overflow-hidden relative shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col border-t border-x bg-[#050505] transition-all duration-700"
                    style={{ 
                        borderColor: `${skinColor}30`, 
                        boxShadow: `0 0 60px ${skinColor}10, inset 0 0 30px ${skinColor}05` 
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header Video Section (Only for Video types before revealing content) */}
                    {showVideo && !showContent && (
                        <div className="relative aspect-[9/16] w-full bg-black overflow-hidden">
                            <VideoPlayer
                                src={isRankUp 
                                    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/levelup.mp4`
                                    : (isReportComplete 
                                        ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/report.mp4`
                                        : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/quest.mp4`)
                                }
                                onEnd={() => setShowContent(true)} 
                                className="w-full h-full object-cover"
                                placeholderLabel={isRankUp ? "Level Up!" : (isReportComplete ? "Relatório!" : "Missão!")}
                                duration={4000}
                                playbackRate={1.0}
                                loop={false}
                                audioFadeOut={true}
                            />
                        </div>
                    )}

                    {/* Reveal Content (After video or if no video) */}
                    {(showContent || !showVideo) && (
                        <div className="animate-fade-in flex flex-col">
                            {/* Premium border gradient effect */}
                            <div className="absolute inset-0 pointer-events-none z-50">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--skin-accent-color)]/40 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--skin-accent-color)]/10 to-transparent" />
                            </div>

                            {/* Background decoration */}
                            <div className="absolute inset-0 z-0 bg-black">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-[radial-gradient(circle_at_50%_0%,_var(--skin-accent-color)_0%,_transparent_70%)] opacity-20" />
                            </div>

                            {/* Header Title */}
                            <div className="pt-10 pb-6 px-8 text-center z-20 relative">
                                <h2 
                                    className="text-2xl font-black text-white uppercase tracking-[0.3em] leading-tight"
                                    style={{ textShadow: `0 0 20px ${skinColor}40` }}
                                >
                                    {title}
                                </h2>
                                <div className="h-0.5 w-12 bg-[var(--skin-accent-color)] mx-auto mt-4 shadow-[0_0_10px_var(--skin-accent-color)]" />
                            </div>

                            {/* Icon Section */}
                            <div className="relative w-full h-32 flex items-center justify-center z-10">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--skin-accent-color)_0%,_transparent_70%)] opacity-10" />
                                <div 
                                    className="w-20 h-20 rounded-2xl flex items-center justify-center border rotate-45 transition-all duration-700 shadow-2xl relative group overflow-hidden"
                                    style={{ borderColor: `${skinColor}40`, backgroundColor: `${skinColor}05` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                                    <div className="absolute inset-0 border border-white/5 rounded-2xl -m-1 animate-pulse" />
                                    <span className="text-4xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] -rotate-45 group-hover:scale-110 transition-transform duration-700">
                                        {icon}
                                    </span>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="p-6 text-center space-y-6 relative z-10">
                                <div className="relative py-2">
                                    <p className="text-gray-400 text-[10px] font-bold leading-relaxed max-w-[85%] mx-auto tracking-[0.1em] uppercase italic opacity-70">
                                        {message}
                                    </p>
                                </div>

                                {/* Reward Miniature - Standardized Pattern */}
                            {(normalizedRewards.exp || normalizedRewards.chest || normalizedRewards.ornament || normalizedRewards.items.length > 0) && (
                                <div className="w-full flex gap-2 justify-center mb-4">
                                    {/* XP Reward */}
                                    {normalizedRewards.exp && (
                                        <div className="flex-1 flex items-center gap-2.5 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05] group hover:bg-white/[0.04] transition-all overflow-hidden min-w-0">
                                            <div className="w-8 h-8 bg-gradient-to-br from-[var(--skin-accent-color)]/20 to-transparent rounded-lg border border-[var(--skin-accent-color)]/20 flex items-center justify-center shrink-0">
                                                <span className="text-sm filter drop-shadow-[0_0_8px_var(--skin-accent-color)]">✨</span>
                                            </div>
                                            <div className="text-left overflow-hidden min-w-0">
                                                <p className="text-[6px] text-gray-500 uppercase tracking-[0.2em] font-black truncate">Experiência</p>
                                                <p className="text-[9px] font-black text-white whitespace-nowrap tracking-tight truncate">
                                                    +{normalizedRewards.exp} <span className="text-[var(--skin-accent-color)] opacity-70">XP</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Reward Item (Insignia, Chest, Ornament) */}
                                    {(normalizedRewards.chest || normalizedRewards.ornament || normalizedRewards.items.length > 0) && (
                                        <div className="flex-[2] flex flex-col gap-2">
                                            {/* Handle array of items if present */}
                                            {normalizedRewards.items.map((itemId: string, idx: number) => {
                                                const def = resolveItemDef(itemId);
                                                return (
                                                    <div key={`${itemId}-${idx}`} className="flex items-center gap-2.5 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05] group hover:bg-white/[0.04] transition-all overflow-hidden min-w-0">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-[var(--skin-accent-color)]/20 to-transparent rounded-lg border border-[var(--skin-accent-color)]/20 flex items-center justify-center shrink-0">
                                                            <span className="text-sm filter drop-shadow-[0_0_8px_var(--skin-accent-color)]">
                                                                {def?.icon || '🎖️'}
                                                            </span>
                                                        </div>
                                                        <div className="text-left overflow-hidden min-w-0">
                                                            <p className="text-[6px] text-gray-500 uppercase tracking-[0.2em] font-black truncate">
                                                                {def?.category === 'insignias' || def?.category === 'insignia' ? 'Insígnia' : 'Item'}
                                                            </p>
                                                            <p className="text-[9px] font-black text-white whitespace-nowrap tracking-tight truncate">
                                                                {def?.name || itemId.replace(/_/g, ' ')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Handle single chest if present */}
                                            {normalizedRewards.chest && (
                                                <div className="flex items-center gap-2.5 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05] group hover:bg-white/[0.04] transition-all overflow-hidden min-w-0">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-[var(--skin-accent-color)]/20 to-transparent rounded-lg border border-[var(--skin-accent-color)]/20 flex items-center justify-center shrink-0">
                                                        <span className="text-sm filter drop-shadow-[0_0_8px_var(--skin-accent-color)]">📦</span>
                                                    </div>
                                                    <div className="text-left overflow-hidden min-w-0">
                                                        <p className="text-[6px] text-gray-500 uppercase tracking-[0.2em] font-black truncate">Baú</p>
                                                        <p className="text-[9px] font-black text-white whitespace-nowrap tracking-tight truncate">
                                                            {normalizedRewards.chest}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Handle single ornament if present */}
                                            {normalizedRewards.ornament && (
                                                <div className="flex items-center gap-2.5 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05] group hover:bg-white/[0.04] transition-all overflow-hidden min-w-0">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-[var(--skin-accent-color)]/20 to-transparent rounded-lg border border-[var(--skin-accent-color)]/20 flex items-center justify-center shrink-0">
                                                        <span className="text-sm filter drop-shadow-[0_0_8px_var(--skin-accent-color)]">
                                                            {resolveItemDef(normalizedRewards.ornament)?.icon || '🎖️'}
                                                        </span>
                                                    </div>
                                                    <div className="text-left overflow-hidden min-w-0">
                                                        <p className="text-[6px] text-gray-500 uppercase tracking-[0.2em] font-black truncate">Ornamento</p>
                                                        <p className="text-[9px] font-black text-white whitespace-nowrap tracking-tight truncate">
                                                            {resolveItemDef(normalizedRewards.ornament)?.name || 'Ornamento'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                                <div className="space-y-3">
                                    <button 
                                        onClick={handlePostToFeed} 
                                        className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden shadow-2xl luxe-skin-button"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        <ShareIcon className="w-4 h-4" />
                                        Compartilhar Feito
                                    </button>
                                    
                                    <button 
                                        onClick={handleClose} 
                                        className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden shadow-2xl luxe-skin-button"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        Prosseguir
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </GlassCard>
            </div>
        </Portal>
    );
};
