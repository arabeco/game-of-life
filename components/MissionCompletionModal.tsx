import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { SeasonMission } from '../types';
import { useGame } from '../contexts/GameContext';
import { SKINS_DATA } from '../constants/GMboard';
import { VideoPlayer } from './VideoPlayer';
import { ShareIcon } from './Icons';
import { Portal } from './Portal';
import { useSensoryFeedback } from '../hooks/useSensoryFeedback';
import { resolveItemDef } from '../constants/items';

interface MissionCompletionModalProps {
    mission: SeasonMission;
    onOk: () => void; // Used as "OK" or "Confirm"
    onClose: () => void;
    insignia?: string | null;
}

export const MissionCompletionModal: React.FC<MissionCompletionModalProps> = ({ mission, onOk, onClose, insignia }) => {
    const { userProfile, showToast } = useGame();
    const { trigger } = useSensoryFeedback();
    const [showContent, setShowContent] = useState(false);
    const userSkinId = userProfile.skin;
    const userSkin = SKINS_DATA.find(s => s.id === userSkinId);
    const skinColor = userSkin?.color || '#ffffff';

    useEffect(() => {
        trigger('fanfare');
        
        // Safety timeout to show content if video fails
        const timer = setTimeout(() => {
            setShowContent(true);
        }, 4500);
        return () => clearTimeout(timer);
    }, [trigger]);

    const handleConfirm = () => {
        // Calculate items to show in toast
        const itemId = mission.reward_type === 'item_id' ? String(mission.reward_value) : null;
        let toastMsg = '';

        if (itemId) {
            const itemDef = resolveItemDef(itemId);
            toastMsg = itemDef?.category === 'insignia' || itemDef?.category === 'insignias'
                ? `✦ Insígnia ${itemDef?.name || itemId} adicionada`
                : `✦ Item ${itemDef?.name || itemId} adicionado`;
        } else if (mission.reward_type === 'exp') {
            toastMsg = `✦ +${mission.reward_value} XP computados`;
        }

        // Only add secondary insignia msg if it's different from the primary reward
        if (insignia && insignia !== itemId) {
            const insDef = resolveItemDef(insignia);
            const insMsg = `✦ Insígnia ${insDef?.name || insignia.replace(/_/g, ' ')} recebida`;
            toastMsg = toastMsg ? `${toastMsg}\n${insMsg}` : insMsg;
        }

        if (toastMsg) {
            showToast(toastMsg);
        }
        onOk();
    };

    return (
        <Portal>
            <div 
                className="fixed inset-0 z-[10001] flex items-center justify-center p-4 transition-all duration-500 bg-black/90 backdrop-blur-md"
            >
                <GlassCard 
                    variant="neutral" 
                    className="w-full max-w-xs overflow-hidden relative shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col border-t border-x bg-[#050505] transition-all duration-700"
                    style={{ 
                        borderColor: `${skinColor}30`, 
                        boxShadow: `0 0 60px ${skinColor}10, inset 0 0 30px ${skinColor}05` 
                    }}
                    onClick={e => e.stopPropagation()}
                >
                            {/* Header Video Section */}
                    {!showContent && (
                        <div className="relative aspect-[9/16] w-full bg-black overflow-hidden">
                            <VideoPlayer
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/quest.mp4`}
                                onEnd={() => setShowContent(true)} 
                                className="w-full h-full object-cover"
                                placeholderLabel="Missão!"
                                duration={4000}
                                playbackRate={1.0}
                                loop={false}
                                audioFadeOut={true}
                                maxDuration={4500}
                            />
                        </div>
                    )}

                    {/* Reveal Content */}
                    {showContent && (
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
                                    MISSÃO CONCLUÍDA!
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
                                        {mission.icon || '📜'}
                                    </span>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="p-6 text-center space-y-6 relative z-10">
                                <div className="relative py-2">
                                    <p className="text-gray-400 text-[10px] font-bold leading-relaxed max-w-[85%] mx-auto tracking-[0.1em] uppercase italic opacity-70">
                                        {mission.description || mission.title}
                                    </p>
                                </div>

                                {/* Reward Miniature - Side by Side Pattern */}
                                <div className="w-full flex gap-2 justify-center mb-4">
                                    {/* Primary Reward (XP or Item) */}
                                    <div className="flex-1 flex items-center gap-2.5 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05] group hover:bg-white/[0.04] transition-all overflow-hidden min-w-0">
                                        <div className="w-8 h-8 bg-gradient-to-br from-[var(--skin-accent-color)]/20 to-transparent rounded-lg border border-[var(--skin-accent-color)]/20 flex items-center justify-center shrink-0">
                                            <span className="text-sm filter drop-shadow-[0_0_8px_var(--skin-accent-color)]">
                                                {mission.reward_type === 'exp' ? '✨' : (mission.reward_type === 'item_id' && resolveItemDef(String(mission.reward_value))?.icon) || '📦'}
                                            </span>
                                        </div>
                                        <div className="text-left overflow-hidden min-w-0">
                                            <p className="text-[6px] text-gray-500 uppercase tracking-[0.2em] font-black truncate">Recompensa</p>
                                            <p className="text-[9px] font-black text-white whitespace-nowrap tracking-tight truncate">
                                                {mission.reward_type === 'exp' 
                                                    ? `+${mission.reward_value} XP` 
                                                    : (mission.reward_type === 'item_id' 
                                                        ? resolveItemDef(String(mission.reward_value))?.name || 'Item' 
                                                        : 'Item')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Secondary Reward (Insignia) - Show only if different from primary reward */}
                                    {insignia && (mission.reward_type !== 'item_id' || String(mission.reward_value) !== insignia) && (
                                        <div className="flex-1 flex items-center gap-2.5 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05] group hover:bg-white/[0.04] transition-all overflow-hidden min-w-0">
                                            <div className="w-8 h-8 bg-gradient-to-br from-[var(--skin-accent-color)]/20 to-transparent rounded-lg border border-[var(--skin-accent-color)]/20 flex items-center justify-center shrink-0">
                                                <span className="text-sm filter drop-shadow-[0_0_8px_var(--skin-accent-color)]">
                                                    {resolveItemDef(insignia)?.icon || '🎖️'}
                                                </span>
                                            </div>
                                            <div className="text-left overflow-hidden min-w-0">
                                                <p className="text-[6px] text-gray-500 uppercase tracking-[0.2em] font-black truncate">Insígnia</p>
                                                <p className="text-[9px] font-black text-white whitespace-nowrap tracking-tight truncate">
                                                    {resolveItemDef(insignia)?.name || insignia.replace(/_/g, ' ')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <button 
                                        onClick={handleConfirm}
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
