import React, { useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { SeasonMission } from '../types';
import { useGame } from '../contexts/GameContext';
import { SKINS_DATA } from '../constants/GMboard';
import { VideoPlayer } from './VideoPlayer';
import { Portal } from './Portal';
import { useSensoryFeedback } from '../hooks/useSensoryFeedback';
import { resolveItemDef } from '../constants/items';
import { useVideoStageTransition } from '../hooks/useVideoStageTransition';

interface MissionCompletionModalProps {
    mission: SeasonMission;
    onOk: () => void;
    onClose: () => void;
    insignia?: string | null;
}

export const MissionCompletionModal: React.FC<MissionCompletionModalProps> = ({ mission, onOk, onClose, insignia }) => {
    const { userProfile, showToast, appMode } = useGame();
    const { trigger } = useSensoryFeedback();
    const userSkin = SKINS_DATA.find((skin) => skin.id === userProfile.skin);
    const skinColor = userSkin?.color || '#ffffff';
    const isBasicMode = appMode === 'BASIC';
    const { showVideoStage, showContentStage, isVideoFading, triggerReveal } = useVideoStageTransition({
        enabled: !isBasicMode,
        revealDelayMs: 4500,
        fadeDurationMs: 320,
    });
    const headingClass = isBasicMode
        ? 'text-[1.35rem] font-bold leading-tight tracking-[0.14em] text-white'
        : 'text-2xl font-black uppercase leading-tight tracking-[0.3em] text-white';
    const descriptionClass = isBasicMode
        ? 'mx-auto max-w-[85%] text-[11px] font-medium leading-relaxed tracking-[0.04em] text-gray-300/88'
        : 'mx-auto max-w-[85%] text-[10px] font-bold uppercase italic leading-relaxed tracking-[0.1em] text-gray-400 opacity-70';
    const primaryButtonClass = isBasicMode
        ? 'luxe-skin-button group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl py-4 text-[11px] font-bold tracking-[0.16em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]'
        : 'luxe-skin-button group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl py-4 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]';

    useEffect(() => {
        trigger('fanfare');
    }, [trigger]);

    const handleConfirm = () => {
        const itemId = mission.reward_type === 'item_id' ? String(mission.reward_value) : null;
        let toastMsg = '';

        if (itemId) {
            const itemDef = resolveItemDef(itemId);
            toastMsg = itemDef?.category === 'insignia'
                ? `✦ Insignia ${itemDef?.name || itemId} adicionada`
                : `✦ Item ${itemDef?.name || itemId} adicionado`;
        } else if (mission.reward_type === 'exp') {
            toastMsg = `✦ +${mission.reward_value} XP computados`;
        }

        if (insignia && insignia !== itemId) {
            const insigniaDef = resolveItemDef(insignia);
            const insigniaMsg = `✦ Insignia ${insigniaDef?.name || insignia.replace(/_/g, ' ')} recebida`;
            toastMsg = toastMsg ? `${toastMsg}\n${insigniaMsg}` : insigniaMsg;
        }

        if (toastMsg) {
            showToast(toastMsg);
        }

        onOk();
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md transition-all duration-500">
                <GlassCard
                    variant="neutral"
                    className="relative flex w-full max-w-xs flex-col overflow-hidden border-x border-t bg-[#050505] shadow-[0_0_80px_rgba(0,0,0,0.9)] transition-all duration-700"
                    style={{
                        borderColor: `${skinColor}30`,
                        boxShadow: `0 0 60px ${skinColor}10, inset 0 0 30px ${skinColor}05`,
                    }}
                    onClick={(event) => event.stopPropagation()}
                >
                    {showVideoStage && (
                        <div className={`relative aspect-[9/16] w-full overflow-hidden bg-black transition-all duration-300 ease-out ${isVideoFading ? 'scale-[0.985] opacity-0' : 'scale-100 opacity-100'}`}>
                            <VideoPlayer
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/quest.mp4`}
                                onEnd={triggerReveal}
                                className="h-full w-full object-cover"
                                placeholderLabel="Missao!"
                                duration={4000}
                                playbackRate={1.0}
                                loop={false}
                                audioFadeOut={true}
                                maxDuration={4500}
                                preload="auto"
                            />
                        </div>
                    )}

                    {showContentStage && (
                        <div className="animate-fade-in flex flex-col">
                            <div className="pointer-events-none absolute inset-0 z-50">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--skin-accent-color)]/40 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--skin-accent-color)]/10 to-transparent" />
                            </div>

                            <div className="absolute inset-0 z-0 bg-black">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />
                                <div className="absolute left-0 top-0 h-1/2 w-full bg-[radial-gradient(circle_at_50%_0%,_var(--skin-accent-color)_0%,_transparent_70%)] opacity-20" />
                            </div>

                            <div className="relative z-20 px-8 pb-6 pt-10 text-center">
                                <h2
                                    className={headingClass}
                                    style={{ textShadow: `0 0 20px ${skinColor}40` }}
                                >
                                    {isBasicMode ? 'Missão concluída' : 'MISSAO CONCLUIDA!'}
                                </h2>
                                <div className="mx-auto mt-4 h-0.5 w-12 bg-[var(--skin-accent-color)] shadow-[0_0_10px_var(--skin-accent-color)]" />
                            </div>

                            <div className="relative z-10 flex h-32 w-full items-center justify-center">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--skin-accent-color)_0%,_transparent_70%)] opacity-10" />
                                <div
                                    className="group relative flex h-20 w-20 rotate-45 items-center justify-center overflow-hidden rounded-2xl border shadow-2xl transition-all duration-700"
                                    style={{ borderColor: `${skinColor}40`, backgroundColor: `${skinColor}05` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                                    <div className="absolute inset-0 -m-1 rounded-2xl border border-white/5 animate-pulse" />
                                    <span className="-rotate-45 text-4xl transition-transform duration-700 group-hover:scale-110 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                        {mission.icon || '📜'}
                                    </span>
                                </div>
                            </div>

                            <div className="relative z-10 space-y-6 p-6 text-center">
                                <div className="relative py-2">
                                    <p className={descriptionClass}>
                                        {mission.description || mission.title}
                                    </p>
                                </div>

                                <div className="mb-4 flex w-full justify-center gap-2">
                                    <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5 transition-all hover:bg-white/[0.04]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--skin-accent-color)]/20 bg-gradient-to-br from-[var(--skin-accent-color)]/20 to-transparent">
                                                <span className="text-sm filter drop-shadow-[0_0_8px_var(--skin-accent-color)]">
                                                    {mission.reward_type === 'exp'
                                                        ? '✨'
                                                        : (mission.reward_type === 'item_id' && resolveItemDef(String(mission.reward_value))?.icon) || '📦'}
                                                </span>
                                            </div>
                                            <div className="min-w-0 overflow-hidden text-left">
                                                <p className="truncate text-[6px] font-black uppercase tracking-[0.2em] text-gray-500">Recompensa</p>
                                                <p className="truncate whitespace-nowrap text-[9px] font-black tracking-tight text-white">
                                                    {mission.reward_type === 'exp'
                                                        ? `+${mission.reward_value} XP`
                                                        : mission.reward_type === 'item_id'
                                                            ? resolveItemDef(String(mission.reward_value))?.name || 'Item'
                                                            : 'Item'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {insignia && (mission.reward_type !== 'item_id' || String(mission.reward_value) !== insignia) && (
                                        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5 transition-all hover:bg-white/[0.04]">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--skin-accent-color)]/20 bg-gradient-to-br from-[var(--skin-accent-color)]/20 to-transparent">
                                                    <span className="text-sm filter drop-shadow-[0_0_8px_var(--skin-accent-color)]">{resolveItemDef(insignia)?.icon || '🎖️'}</span>
                                                </div>
                                                <div className="min-w-0 overflow-hidden text-left">
                                                    <p className="truncate text-[6px] font-black uppercase tracking-[0.2em] text-gray-500">Insignia</p>
                                                    <p className="truncate whitespace-nowrap text-[9px] font-black tracking-tight text-white">
                                                        {resolveItemDef(insignia)?.name || insignia.replace(/_/g, ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleConfirm}
                                        className={primaryButtonClass}
                                    >
                                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                                        Continuar
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
