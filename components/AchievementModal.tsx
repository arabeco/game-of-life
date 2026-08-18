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

type AchievementRewardDetail = {
    category?: string;
    itemId?: string;
    name?: string;
};

const BASIC_VISIBLE_ACHIEVEMENTS: FeedEventType[] = [
    'MILESTONE_COMPLETED',
    'QUEST_COMPLETED',
    'REPORT_COMPLETED',
    'COMPETITION_COMPLETED',
];

const getAchievementDetails = (type: FeedEventType, data: any, isBasicMode: boolean) => {
    switch (type) {
        case 'MILESTONE_COMPLETED':
            return { title: 'Marco concluído', icon: data.icon || '\u{1F3C1}', message: `Você concluiu o marco "${data.name}".` };
        case 'ARENA_COMPLETED':
            return { title: 'Arena concluída', icon: data.icon || '\u{1F3DF}\uFE0F', message: `Você concluiu a arena "${data.name}".` };
        case 'PLAYER_RANK_UP':
            return { title: 'Parabéns', icon: '\u{1F451}', message: `Você subiu de patente para ${data.name}!` };
        case 'QUEST_COMPLETED': {
            const isStreakMilestone = data.title === 'Sete Dias em Movimento';
            return isStreakMilestone
                ? {
                    title: 'Sequência consolidada',
                    icon: data.icon || '\u{1F525}',
                    message: 'Você se manteve em movimento por sete dias seguidos. Não foi sobre perfeição: foi constância suficiente para continuar.',
                }
                : { title: 'Desafio concluído', icon: data.icon || '\u{1F3AF}', message: `Você concluiu o desafio "${data.title}".` };
        }
        case 'REPORT_COMPLETED':
            return { title: 'Relatório concluído', icon: '\u{1F4DC}', message: 'Você fechou seu relatório de ciclo com sucesso.' };
        case 'COMPETITION_COMPLETED': {
            const score = `${Number(data.selfCompleted || 0)}/${Number(data.selfTarget || 0)} contra ${Number(data.rivalCompleted || 0)}/${Number(data.rivalTarget || 0)}`;
            if (data.result === 'winner') {
                return { title: 'DESAFIO VENCIDO', icon: '\u{1F3C6}', message: `Você venceu "${data.challengeName || 'Desafio'}" contra @${data.opponentNickname || 'seu rival'}. ${score}.` };
            }
            if (data.result === 'draw') {
                return { title: 'EMPATE', icon: '\u{2696}\uFE0F', message: `"${data.challengeName || 'Desafio'}" terminou empatado. ${score}.` };
            }
            return { title: 'DESAFIO ENCERRADO', icon: '\u{1F3C1}', message: `@${data.opponentNickname || 'Seu rival'} venceu "${data.challengeName || 'Desafio'}". Você chegou a ${score}.` };
        }
        case 'CLAN_RANK_UP':
            return { title: 'Grupo avançou', icon: '\u{1F6E1}\uFE0F', message: `Seu grupo agora e um ${data.name}!` };
        default:
            return { title: 'Concluído', icon: '\u2728', message: 'Você realizou um feito notável.' };
    }
};

export const AchievementModal: React.FC<AchievementModalProps> = ({ achievement, onClose }) => {
    const { addFeedEvent, userProfile, showToast, appMode, oraclePreferences } = useGame();
    // Quem desliga as telas de comemoracao nao perde nada: a recompensa continua
    // entrando e o aviso vira toast. So a tela cheia deixa de tomar o aparelho.
    const celebrationScreensEnabled = oraclePreferences?.celebrationScreensEnabled !== false;
    const isBasicMode = appMode === 'BASIC';
    const { title, icon, message } = getAchievementDetails(achievement.type, achievement.data, isBasicMode);
    const cardRef = useRef<HTMLDivElement>(null);
    const isArenaComplete = achievement.type === 'ARENA_COMPLETED';
    const isCompetitionResult = achievement.type === 'COMPETITION_COMPLETED';
    const isGM = userProfile.role === 'gm' || userProfile.role === 'admin';
    const canRenderAchievement =
        achievement.type !== 'ARENA_COMPLETED' &&
        (appMode === 'GAME' || isGM || BASIC_VISIBLE_ACHIEVEMENTS.includes(achievement.type));
    const canShareAchievement = !isCompetitionResult && (appMode === 'GAME' || isGM);

    useEffect(() => {
        if (!canRenderAchievement) {
            onClose();
            return;
        }
        if (!celebrationScreensEnabled) {
            // Sem tela cheia o feito ainda se anuncia, e handleClose entrega os
            // toasts de recompensa antes de fechar. Nada se perde por desligar.
            showToast(`${title} - ${message}`, 'success');
            handleClose();
        }
        // handleClose e recriado a cada render; entrar na lista repetiria o anuncio.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canRenderAchievement, celebrationScreensEnabled, onClose]);

    if (!canRenderAchievement || !celebrationScreensEnabled) return null;

    const userSkin = SKINS_DATA.find((skin) => skin.id === userProfile.skin);
    const skinColor = userSkin?.color || '#ffffff';
    const isRankUp = achievement.type === 'PLAYER_RANK_UP';
    const isQuestComplete = achievement.type === 'QUEST_COMPLETED';
    const isStreakMilestone = isQuestComplete && achievement.data.title === 'Sete Dias em Movimento';
    const isReportComplete = achievement.type === 'REPORT_COMPLETED';
    const showVideo = !isBasicMode && (isRankUp || isQuestComplete || isReportComplete);
    const { showVideoStage, showContentStage, isVideoFading, triggerReveal } = useVideoStageTransition({
        enabled: showVideo,
        revealDelayMs: 4500,
        fadeDurationMs: 320,
    });

    const rawRewards = achievement.data.rewards || achievement.data.reward || {};
    const rewardDetails: AchievementRewardDetail[] = Array.isArray(rawRewards.rewardDetails)
        ? rawRewards.rewardDetails
        : [];
    const normalizedRewards = {
        exp: rawRewards.exp,
        gold: rawRewards.gold,
        chest: rawRewards.chest,
        ornament: rawRewards.ornament,
        items: rawRewards.items || (rawRewards.item ?[rawRewards.item] : []),
        rewardDetails,
        uiSkins: rawRewards.uiSkins || [],
    };
    const visibleRewardDetails: AchievementRewardDetail[] = normalizedRewards.rewardDetails.length > 0
        ? normalizedRewards.rewardDetails
        : normalizedRewards.items.map((itemId: string) => ({ itemId }));

    const getRewardDetailLabel = (detail: AchievementRewardDetail) => {
        const category = String(detail.category || '').toLowerCase();
        if (category === 'ui_skins') return 'Tema';
        if (category === 'insignias') return 'Insignia';
        if (category === 'borders') return 'Borda';
        if (category === 'banners') return 'Banner';
        if (category === 'glyphs') return 'Glyph';
        if (category === 'skins') return 'Skin';
        if (category === 'orbs') return 'Orbe';
        if (category === 'artifacts') return 'Artefato';
        if (category === 'auras') return 'Aura';
        return 'Item';
    };
    const headingClass = isCompetitionResult
        ? 'text-xl font-black uppercase leading-tight tracking-[0.16em] text-white'
        : isBasicMode
        ? 'text-[1.35rem] font-bold leading-tight tracking-[0.14em] text-white'
        : 'text-2xl font-black uppercase leading-tight tracking-[0.3em] text-white';
    const messageClass = isCompetitionResult
        ? 'mx-auto max-w-[92%] text-xs font-semibold leading-relaxed text-white/72'
        : isBasicMode
        ? 'mx-auto max-w-[85%] text-[11px] font-medium leading-relaxed tracking-[0.04em] text-gray-300/88'
        : 'mx-auto max-w-[85%] text-[10px] font-bold uppercase italic leading-relaxed tracking-[0.1em] text-gray-400 opacity-70';
    const primaryButtonLabel = achievement.data.buttonLabel || (isBasicMode || isCompetitionResult ? 'Continuar' : (isArenaComplete ? 'OK' : 'Prosseguir'));
    const primaryButtonClass = isBasicMode
        ? 'luxe-skin-button group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl py-4 text-[11px] font-bold tracking-[0.16em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]'
        : 'luxe-skin-button group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl py-4 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]';

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

            if (Array.isArray(rewards.rewardDetails) && rewards.rewardDetails.length > 0) {
                const detailLines = rewards.rewardDetails
                    .filter((detail: AchievementRewardDetail) => detail?.category === 'ui_skins')
                    .map((detail: AchievementRewardDetail) => `Tema ${detail.name || detail.itemId} liberado`);
                messages.push(...detailLines);
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

            if (rewards.gold && rewards.gold > 0) {
                messages.push(`+${rewards.gold} de ouro`);
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
                    className={`relative flex w-full flex-col overflow-hidden border-x border-t bg-[#050505] shadow-[0_0_80px_rgba(0,0,0,0.9)] transition-all duration-700 ${isCompetitionResult ? 'max-w-xs' : 'max-w-sm'}`}
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
                                        ?`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/report_seal.mp4`
                                        : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/quest.mp4`}
                                onEnd={triggerReveal}
                                className="h-full w-full object-cover"
                                videoClassName="scale-[1.08]"
                                placeholderLabel={isRankUp ? 'Nova patente!' : isReportComplete ? 'Relatório!' : 'Desafio!'}
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

                            <div className={`relative z-20 px-8 text-center ${isCompetitionResult ? 'pb-3 pt-7' : 'pb-6 pt-10'}`}>
                                {isStreakMilestone && (
                                    <p className="mb-2 text-[9px] font-black uppercase tracking-[0.24em] text-[var(--skin-accent-color)]">
                                        Bônus de sequência
                                    </p>
                                )}
                                <h2
                                    className={headingClass}
                                    style={{ textShadow: `0 0 20px ${skinColor}40` }}
                                >
                                    {title}
                                </h2>
                                <div className="mx-auto mt-4 h-0.5 w-12 bg-[var(--skin-accent-color)] shadow-[0_0_10px_var(--skin-accent-color)]" />
                            </div>

                            <div className={`relative z-10 flex w-full items-center justify-center ${isCompetitionResult ? 'h-20' : 'h-32'}`}>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--skin-accent-color)_0%,_transparent_70%)] opacity-10" />
                                <div
                                    className={`group relative flex rotate-45 items-center justify-center overflow-hidden rounded-2xl border shadow-2xl transition-all duration-700 ${isCompetitionResult ? 'h-14 w-14' : 'h-20 w-20'}`}
                                    style={{ borderColor: `${skinColor}40`, backgroundColor: `${skinColor}05` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                                    <div className="absolute inset-0 -m-1 rounded-2xl border border-white/5 animate-pulse" />
                                    <span className={`-rotate-45 transition-transform duration-700 group-hover:scale-110 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] ${isCompetitionResult ? 'text-2xl' : 'text-4xl'}`}>
                                        {icon}
                                    </span>
                                </div>
                            </div>

                            <div className={`relative z-10 text-center ${isCompetitionResult ? 'space-y-4 p-5 pt-2' : 'space-y-6 p-6'}`}>
                                <div className="relative py-2">
                                    <p className={messageClass}>
                                        {message}
                                    </p>
                                </div>

                                {(normalizedRewards.exp || normalizedRewards.gold || normalizedRewards.chest || normalizedRewards.ornament || visibleRewardDetails.length > 0) && (
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

                                        {(normalizedRewards.gold || normalizedRewards.chest || normalizedRewards.ornament || visibleRewardDetails.length > 0) && (
                                            <div className="flex flex-[2] flex-col gap-2">
                                                {normalizedRewards.gold > 0 && (
                                                    <div className="min-w-0 overflow-hidden rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-2.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-300/10 text-sm">G</div>
                                                            <div className="min-w-0 text-left">
                                                                <p className="text-[6px] font-black uppercase tracking-[0.2em] text-amber-200/55">Ouro</p>
                                                                <p className="text-[9px] font-black text-amber-100">+{normalizedRewards.gold}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {visibleRewardDetails.map((detail, index: number) => {
                                                    const itemId = detail.itemId || '';
                                                    const itemDef = itemId ? resolveItemDef(itemId) : undefined;
                                                    return (
                                                        <div key={`${itemId}-${index}`} className="min-w-0 overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5 transition-all hover:bg-white/[0.04]">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--skin-accent-color)]/20 bg-gradient-to-br from-[var(--skin-accent-color)]/20 to-transparent">
                                                                    <span className="text-sm filter drop-shadow-[0_0_8px_var(--skin-accent-color)]">{itemDef?.icon || (detail.category === 'ui_skins' ? 'T' : 'I')}</span>
                                                                </div>
                                                                <div className="min-w-0 overflow-hidden text-left">
                                                                    <p className="truncate text-[6px] font-black uppercase tracking-[0.2em] text-gray-500">
                                                                        {itemDef?.category === 'insignia' ?'Insignia' : getRewardDetailLabel(detail)}
                                                                    </p>
                                                                    <p className="truncate whitespace-nowrap text-[9px] font-black tracking-tight text-white">
                                                                        {itemDef?.name || detail.name || itemId.replace(/_/g, ' ')}
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
                                        className={primaryButtonClass}
                                    >
                                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                                        {primaryButtonLabel}
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
