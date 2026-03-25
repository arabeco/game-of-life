import React, { useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { ShareIcon } from './Icons';
import { FeedEventType } from '../types';
import { SKINS_DATA } from '../constants/GMboard';
import { VideoPlayer } from './VideoPlayer';
import { Portal } from './Portal';
import { resolveItemDef } from '../constants/items';
import { useVideoStageTransition } from '../hooks/useVideoStageTransition';

interface AchievementModalProps {
    achievement: { type: FeedEventType; data: any };
    onClose: () => void;
}

const getAchievementDetails = (type: FeedEventType, data: any) => {
    switch (type) {
        case 'MILESTONE_COMPLETED':
            return { title: 'Marco concluído!', icon: data.icon || '\u{1F3C1}', message: `Você concluiu o marco "${data.name}".` };
        case 'ARENA_COMPLETED':
            return { title: 'ARENA COMPLETA', icon: data.icon || '\u{1F3DF}\uFE0F', message: `Você concluiu a arena "${data.name}".` };
        case 'PLAYER_RANK_UP':
            return { title: 'PARABÉNS!', icon: '\u{1F451}', message: `Você subiu de patente para ${data.name}!` };
        case 'QUEST_COMPLETED':
            return { title: 'MISSÃO CONCLUÍDA!', icon: data.icon || '\u{1F3AF}', message: `Você concluiu a missão "${data.title}".` };
        case 'REPORT_COMPLETED':
            return { title: 'RELATÓRIO CONCLUÍDO!', icon: '\u{1F4DC}', message: 'Você selou seu relatório de ciclo com sucesso!' };
        case 'CLAN_RANK_UP':
            return { title: 'Patente do grupo aumentou!', icon: '\u{1F6E1}\uFE0F', message: `Seu grupo agora e um ${data.name}!` };
        default:
            return { title: 'Conquista!', icon: '\u2728', message: 'Você realizou um feito notável.' };
    }
};

export const AchievementModal: React.FC<AchievementModalProps> = ({ achievement, onClose }) => {
    const { addFeedEvent, userProfile, showToast, appMode } = useGame();
    const { title, icon, message } = getAchievementDetails(achievement.type, achievement.data);
    const cardRef = useRef<HTMLDivElement>(null);
    const isArenaComplete = achievement.type === 'ARENA_COMPLETED';
    const isGM = userProfile.role === 'gm' || userProfile.role === 'admin';
    const canRenderAchievement = appMode === 'GAME' || isGM || isArenaComplete;
    const canShareAchievement = appMode === 'GAME' || isGM;

    useEffect(() => {
        if (!canRenderAchievement) {
            onClose();
        }
    }, [canRenderAchievement, onClose]);

    if (!canRenderAchievement) return null;

    const userSkin = SKINS_DATA.find((skin) => skin.id === userProfile.skin);
    const skinColor = userSkin?.color || '#ffffff';
    const isRankUp = achievement.type === 'PLAYER_RANK_UP';
    const isQuestComplete = achievement.type === 'QUEST_COMPLETED';
    const isReportComplete = achievement.type === 'REPORT_COMPLETED';
    const showVideo = isRankUp || isQuestComplete || isReportComplete;
    const { showVideoStage, showContentStage, isVideoFading, triggerReveal } = useVideoStageTransition({
        enabled: showVideo,
        revealDelayMs: 4500,
        fadeDurationMs: 320,
    });

    const rawRewards = achievement.data.rewards || achievement.data.reward || {};
    const normalizedRewards = {
        exp: rawRewards.exp,
        chest: rawRewards.chest,
        ornament: rawRewards.ornament,
        items: rawRewards.items || (rawRewards.item ?[rawRewards.item] : []),
    };

    const handlePostToFeed = () => {
        if (!canShareAchievement) return;

        let content;
        switch (achievement.type) {
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
                content = { title: achievement.data.title || 'Relatório de Ciclo', icon };
                break;
            default:
                content = { title: 'Feito notável' };
        }
        addFeedEvent({ type: achievement.type, content });
        handleClose();
    };

    const handleClose = () => {
        if (achievement.data.rewards || achievement.data.reward) {
            const rewards = achievement.data.rewards || achievement.data.reward;
            const messages: string[] = [];
            const items = rewards.items || (rewards.item ?[rewards.item] : []);

            if (items.length > 0) {
                const uniqueItems = [...new Set(items)];
                const itemLines = uniqueItems.map((itemId: unknown) => {
                    const id = String(itemId);
                    const itemDef = resolveItemDef(id);
                    if (itemDef?.category === 'insignia') {
                        return `\u{1F3C5} Insígnia ${itemDef.name} adicionada`;
                    }
                    return `\u{1F381} Item ${itemDef?.name || id} adicionado`;
                });

                const maxIndividualLines = 3;
                if (itemLines.length <= maxIndividualLines) {
                    messages.push(...itemLines);
                } else {
                    messages.push(...itemLines.slice(0, maxIndividualLines));
                    messages.push(`+ ${itemLines.length - maxIndividualLines} item(ns)`);
                }
            }

            if (rewards.chest) {
                messages.push(`\u{1F4E6} Baú ${rewards.chest} adicionado`);
            }

            if (rewards.ornament) {
                const itemDef = resolveItemDef(rewards.ornament);
                messages.push(`\u2728 Ornamento ${itemDef?.name || rewards.ornament} adicionado`);
            }

            if (rewards.exp && rewards.exp > 0) {
                messages.push(`\u2728 +${rewards.exp} XP computados`);
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
                className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md transition-all duration-500"
                onClick={handleClose}
            >
                <GlassCard
                    ref={cardRef}
                    variant="neutral"
                    className="relative flex w-full max-w-sm flex-col overflow-hidden border-x border-t bg-[#050505] shadow-[0_0_80px_rgba(0,0,0,0.9)] transition-all duration-700"
                    style={{
                        borderColor: `${skinColor}30`,
                        boxShadow: `0 0 60px ${skinColor}10, inset 0 0 30px ${skinColor}05`,
                    }}
                    onClick={(event) => event.stopPropagation()}
                >
                    {showVideoStage && (
                        <div className={`relative aspect-[9/16] w-full overflow-hidden bg-black transition-all duration-300 ease-out ${isVideoFading ?'scale-[0.985] opacity-0' : 'scale-100 opacity-100'}`}>
                            <VideoPlayer
                                src={isRankUp
                                    ?`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/levelup.mp4`
                                    : isReportComplete
                                        ?`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/report.mp4`
                                        : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/quest.mp4`}
                                onEnd={triggerReveal}
                                className="h-full w-full object-cover"
                                placeholderLabel={isRankUp ? 'Level Up!' : isReportComplete ? 'Relatório!' : 'Missão!'}
                                duration={4000}
                                playbackRate={1.0}
                                loop={false}
                                audioFadeOut={true}
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
                                    className="text-2xl font-black uppercase leading-tight tracking-[0.3em] text-white"
                                    style={{ textShadow: `0 0 20px ${skinColor}40` }}
                                >
                                    {title}
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
                                        {icon}
                                    </span>
                                </div>
                            </div>

                            <div className="relative z-10 space-y-6 p-6 text-center">
                                <div className="relative py-2">
                                    <p className="mx-auto max-w-[85%] text-[10px] font-bold uppercase italic leading-relaxed tracking-[0.1em] text-gray-400 opacity-70">
                                        {message}
                                    </p>
                                </div>

                                {(normalizedRewards.exp || normalizedRewards.chest || normalizedRewards.ornament || normalizedRewards.items.length > 0) && (
                                    <div className="mb-4 flex w-full justify-center gap-2">
                                        {normalizedRewards.exp && (
                                            <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5 transition-all hover:bg-white/[0.04]">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--skin-accent-color)]/20 bg-gradient-to-br from-[var(--skin-accent-color)]/20 to-transparent">
                                                        <span className="text-sm filter drop-shadow-[0_0_8px_var(--skin-accent-color)]">?</span>
                                                    </div>
                                                    <div className="min-w-0 overflow-hidden text-left">
                                                        <p className="truncate text-[6px] font-black uppercase tracking-[0.2em] text-gray-500">Experiencia</p>
                                                        <p className="truncate whitespace-nowrap text-[9px] font-black tracking-tight text-white">
                                                            +{normalizedRewards.exp} <span className="text-[var(--skin-accent-color)] opacity-70">XP</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {(normalizedRewards.chest || normalizedRewards.ornament || normalizedRewards.items.length > 0) && (
                                            <div className="flex flex-[2] flex-col gap-2">
                                                {normalizedRewards.items.map((itemId: string, index: number) => {
                                                    const itemDef = resolveItemDef(itemId);
                                                    return (
                                                        <div key={`${itemId}-${index}`} className="min-w-0 overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5 transition-all hover:bg-white/[0.04]">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--skin-accent-color)]/20 bg-gradient-to-br from-[var(--skin-accent-color)]/20 to-transparent">
                                                                    <span className="text-sm filter drop-shadow-[0_0_8px_var(--skin-accent-color)]">{itemDef?.icon || '📝'}</span>
                                                                </div>
                                                                <div className="min-w-0 overflow-hidden text-left">
                                                                    <p className="truncate text-[6px] font-black uppercase tracking-[0.2em] text-gray-500">
                                                                        {itemDef?.category === 'insignia' ?'Insignia' : 'Item'}
                                                                    </p>
                                                                    <p className="truncate whitespace-nowrap text-[9px] font-black tracking-tight text-white">
                                                                        {itemDef?.name || itemId.replace(/_/g, ' ')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {normalizedRewards.chest && (
                                                    <div className="min-w-0 overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5 transition-all hover:bg-white/[0.04]">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--skin-accent-color)]/20 bg-gradient-to-br from-[var(--skin-accent-color)]/20 to-transparent">
                                                                <span className="text-sm filter drop-shadow-[0_0_8px_var(--skin-accent-color)]">{'\u{1F4E6}'}</span>
                                                            </div>
                                                            <div className="min-w-0 overflow-hidden text-left">
                                                                <p className="truncate text-[6px] font-black uppercase tracking-[0.2em] text-gray-500">Baú</p>
                                                                <p className="truncate whitespace-nowrap text-[9px] font-black tracking-tight text-white">{normalizedRewards.chest}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {normalizedRewards.ornament && (
                                                    <div className="min-w-0 overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5 transition-all hover:bg-white/[0.04]">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--skin-accent-color)]/20 bg-gradient-to-br from-[var(--skin-accent-color)]/20 to-transparent">
                                                                <span className="text-sm filter drop-shadow-[0_0_8px_var(--skin-accent-color)]">{resolveItemDef(normalizedRewards.ornament)?.icon || '?'}</span>
                                                            </div>
                                                            <div className="min-w-0 overflow-hidden text-left">
                                                                <p className="truncate text-[6px] font-black uppercase tracking-[0.2em] text-gray-500">Ornamento</p>
                                                                <p className="truncate whitespace-nowrap text-[9px] font-black tracking-tight text-white">
                                                                    {resolveItemDef(normalizedRewards.ornament)?.name || 'Ornamento'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {canShareAchievement && (
                                        <button
                                            onClick={handlePostToFeed}
                                            className="luxe-skin-button group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl py-4 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                                            <ShareIcon className="h-4 w-4" />
                                            Compartilhar no Feed
                                        </button>
                                    )}

                                    <button
                                        onClick={handleClose}
                                        className="luxe-skin-button group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl py-4 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                                        {isArenaComplete ? 'OK' : 'Prosseguir'}
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

