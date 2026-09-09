import React, { useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { ShareIcon } from './Icons';
import { FeedEventType } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { Portal } from './Portal';
import { resolveItemDef } from '../constants/items';
import { useVideoStageTransition } from '../hooks/useVideoStageTransition';
import { RewardPackBody } from './RewardPackBody';
import { buildAchievementRewardPayload } from '../utils/achievementRewardPayload';
import { getRewardEmblemUrl, getRewardToneRgb } from '../constants/rewardEmblems';
import { DIRECOES, REWARD_PLATE_VIEWPORT_STYLE } from '../constants/rewardPlateStyles';
import { SEASONS } from '../constants/seasonContent';

interface AchievementModalProps {
    achievement: { type: FeedEventType; data: any };
    onClose: () => void;
}

type AchievementRewardDetail = {
    category?: string;
    itemId?: string;
    name?: string;
};

const getAchievementDetails = (type: FeedEventType, data: any) => {
    switch (type) {
        case 'MILESTONE_COMPLETED':
            return { title: 'Conquista concluída!', subtitle: data.name, icon: data.icon || '\u{1F3C1}', message: 'Este marco foi registrado no seu perfil.' };
        case 'ARENA_COMPLETED':
            return { title: 'Arena concluída!', subtitle: data.name, icon: data.icon || '\u{1F3DF}\uFE0F', message: 'Todos os dados desta arena foram consolidados.' };
        case 'PLAYER_RANK_UP':
            return { title: 'Nova patente!', subtitle: data.name, icon: '\u{1F451}', message: 'Sua nova patente e as recompensas correspondentes foram liberadas.' };
        case 'QUEST_COMPLETED': {
            return {
                title: 'Missão concluída!',
                subtitle: data.title,
                icon: data.icon || '\u{1F3AF}',
                message: 'A recompensa desta missão já entrou.',
            };
        }
        case 'REPORT_COMPLETED':
            return { title: 'Relatório concluído', icon: '\u{1F4DC}', message: 'Você fechou seu relatório de ciclo com sucesso.' };
        case 'COMPETITION_COMPLETED': {
            // O placar saiu do texto e foi para os quadradinhos: "4/5 contra
            // 3/5" no meio de uma frase obrigava a ler a frase inteira para
            // saber quem ganhou. O titulo diz o resultado, os quadrados dizem
            // por quanto.
            const rival = data.opponentNickname ? '@' + data.opponentNickname : 'Rival';
            const desafio = data.challengeName || 'Desafio';
            if (data.result === 'winner') {
                return { title: 'DESAFIO VENCIDO', icon: '\u{1F3C6}', message: `Você venceu "${desafio}" contra ${rival}.` };
            }
            if (data.result === 'draw') {
                return { title: 'EMPATE', icon: '\u{2696}\uFE0F', message: `"${desafio}" terminou empatado com ${rival}.` };
            }
            return { title: 'DESAFIO ENCERRADO', icon: '\u{1F3C1}', message: `${rival} venceu "${desafio}".` };
        }
        case 'CLAN_RANK_UP':
            return { title: 'Conquista concluída!', subtitle: data.name, icon: '\u{1F6E1}\uFE0F', message: 'A evolução do grupo foi registrada.' };
        default:
            return { title: 'Concluído', icon: '\u2728', message: 'Você realizou um feito notável.' };
    }
};

export const AchievementModal: React.FC<AchievementModalProps> = ({ achievement, onClose }) => {
    const { addFeedEvent, showToast, oraclePreferences, updateOraclePreferences } = useGame();
    // Quem desliga as telas de comemoracao nao perde nada: a recompensa continua
    // entrando e o aviso vira toast. So a tela cheia deixa de tomar o aparelho.
    const celebrationScreensEnabled = oraclePreferences?.celebrationScreensEnabled !== false;
    const { title, subtitle, icon, message } = getAchievementDetails(achievement.type, achievement.data);
    const cardRef = useRef<HTMLDivElement>(null);
    const isArenaComplete = achievement.type === 'ARENA_COMPLETED';
    const isCompetitionResult = achievement.type === 'COMPETITION_COMPLETED';
    // ARENA_COMPLETED fazia parte do tipo e do texto, mas era excluida aqui e
    // fechava no primeiro efeito. Ela volta a usar a mesma placa dos demais.
    const canRenderAchievement = true;
    const canShareAchievement = !isCompetitionResult;

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

    const isRankUp = achievement.type === 'PLAYER_RANK_UP';
    const isQuestComplete = achievement.type === 'QUEST_COMPLETED';
    const isReportComplete = achievement.type === 'REPORT_COMPLETED';
    // `semVideo` existe para o encadeamento: quando a missao ja mostrou o video
    // dela, a patente que veio junto entra direto na placa. Dois videos
    // seguidos viram dez segundos de espera antes do primeiro OK.
    const showVideo = Boolean(oraclePreferences?.animationsEnabled)
        && (isRankUp || isQuestComplete || isReportComplete)
        && !achievement.data.semVideo;
    const { showVideoStage, showContentStage, isVideoFading, triggerReveal } = useVideoStageTransition({
        enabled: showVideo,
        revealDelayMs: 4500,
        fadeDurationMs: 320,
    });

    const rawRewards = achievement.data.rewards || achievement.data.reward || {};
    const rewardItemIds: string[] = rawRewards.items || (rawRewards.item ? [rawRewards.item] : []);
    const seloDaTemporada = Boolean(achievement.data.seloDaTemporada)
        || rewardItemIds.some((itemId) => String(itemId).startsWith('insignia_season_'));
    // A sobrancelha diz de onde o feito veio. Antes o modal so tinha titulo, e
    // "Parabens" sozinho nao distinguia subir de patente de fechar um ciclo.
    const sobrancelha = isCompetitionResult ? 'Resultado do desafio' : '';
    // O tipo do acontecimento decide DUAS coisas de uma vez: o emblema do topo
    // e o tom do reflexo. Antes o emblema era emoji escolhido no meio do JSX e
    // o reflexo era dourado fixo — subir de patente e fechar um ciclo saiam
    // com a mesma cara.
    const tipoDaRecompensa = isRankUp
        ? 'patente' as const
        : isReportComplete
            ? 'ciclo' as const
            : isQuestComplete
                ? (seloDaTemporada
                    ? (rewardItemIds.includes('insignia_season_genesis') ? 'genesis' as const : 'temporada' as const)
                    : achievement.data.origem && achievement.data.origem !== 'missao' ? 'temporada' as const : 'missao' as const)
                : 'geral' as const;
    const emblemaDoFeito = isCompetitionResult ? icon : getRewardEmblemUrl(tipoDaRecompensa, achievement.data.name);
    const tomDoFeito = getRewardToneRgb(tipoDaRecompensa, achievement.data.name);
    const inferredSeasonId = rewardItemIds.includes('insignia_season_aurora_1')
        ? 'season-aurora-1-2026'
        : 'season-genesis-0';
    const seasonBackground = seloDaTemporada
        ? SEASONS[achievement.data.seasonId || inferredSeasonId]?.backgroundUrl
        : undefined;
    const estiloDaPlaca = DIRECOES.B;

    const seasonName = SEASONS[achievement.data.seasonId || inferredSeasonId]?.name
        || String(subtitle || achievement.data.title || '').replace(/^Selo (?:da|de|do) /i, '');
    const payloadBase = {
        ...buildAchievementRewardPayload(
            seloDaTemporada ? 'Temporada concluída!' : title,
            message,
            sobrancelha,
            rawRewards,
        ),
        subtitle: seloDaTemporada ? seasonName : subtitle,
    };
    // O desafio nao paga premio: o que ele entrega e o placar. Sem isto o modal
    // dele ficava so com titulo e frase, e o numero — a unica coisa que a pessoa
    // quer conferir — nao aparecia com destaque nenhum.
    const payloadDoFeitoBase = isArenaComplete
        ? {
            ...payloadBase,
            itemIds: [],
            rewardHighlights: [],
            metricCards: [
                { label: 'Ações', value: String(Number(achievement.data.actionCount || 0)) },
                { label: 'Entregas', simbolo: 'acoes' as const, value: String(Number(achievement.data.deliveries || 0)) },
                { label: 'Dias ativos', value: String(Number(achievement.data.days || 0)) },
            ],
        }
        : isCompetitionResult
        ? {
            ...payloadBase,
            metricCards: [
                {
                    label: 'Você',
                    simbolo: 'acoes' as const,
                    value: `${Number(achievement.data.selfCompleted || 0)}/${Number(achievement.data.selfTarget || 0)}`,
                },
                {
                    label: achievement.data.opponentNickname ? '@' + achievement.data.opponentNickname : 'Rival',
                    simbolo: 'acoes' as const,
                    value: `${Number(achievement.data.rivalCompleted || 0)}/${Number(achievement.data.rivalTarget || 0)}`,
                },
            ],
        }
        : payloadBase;
    const payloadDoFeito = seloDaTemporada
        ? {
            ...payloadDoFeitoBase,
            summary: '',
            featuredItemId: rewardItemIds.find((itemId) => String(itemId).startsWith('insignia_season_')),
            repeatFeaturedItemInList: true,
            itemSectionTitle: 'Também recebido',
        }
        : payloadDoFeitoBase;
    const primaryButtonLabel = achievement.data.buttonLabel || (isCompetitionResult || seloDaTemporada || isArenaComplete ? 'OK' : 'Prosseguir');
    const primaryButtonClass = 'luxe-skin-button group relative flex w-full items-center justify-center gap-3 overflow-hidden py-4 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]';

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

            if (rewards.background?.name) {
                messages.push(`\u{1F5BC} ${rewards.background.name} liberado`);
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

    const handleDisableCelebrations = async () => {
        await updateOraclePreferences({ celebrationScreensEnabled: false });
        handleClose();
    };

    return (
        <Portal>
            <div
                className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md transition-all duration-500"
                onClick={showVideoStage ? triggerReveal : handleClose}
            >
                <div
                    ref={cardRef}
                    className={`relative flex flex-col overflow-hidden text-[#f5f3ed] transition-all duration-700 ${estiloDaPlaca.respiro}`}
                    style={{
                        ...estiloDaPlaca.placa(tomDoFeito),
                        ...REWARD_PLATE_VIEWPORT_STYLE,
                    }}
                    onClick={(event) => event.stopPropagation()}
                >
                    {showVideoStage && (
                        <button type="button" aria-label="Pular animação" onClick={triggerReveal} className={`relative aspect-[9/16] w-full overflow-hidden bg-black transition-all duration-300 ease-out ${isVideoFading ?'scale-[0.985] opacity-0' : 'scale-100 opacity-100'}`}>
                            <VideoPlayer
                                src={isRankUp
                                    ?`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/levelup.mp4`
                                    : isReportComplete
                                        ?`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/report_seal.mp4`
                                        : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/quest.mp4`}
                                onEnd={triggerReveal}
                                className="h-full w-full object-cover"
                                videoClassName="scale-[1.08]"
                                placeholderLabel={isRankUp ? 'Nova patente!' : isReportComplete ? 'Relatório!' : 'Missão!'}
                                duration={4000}
                                playbackRate={1.0}
                                loop={false}
                                audioFadeOut={true}
                                preload="auto"
                            />
                            <span className="absolute bottom-4 right-4 z-20 border border-white/20 bg-black/70 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/75">Toque para pular</span>
                        </button>
                    )}

                    {showContentStage && (
                        <div className="animate-fade-in flex min-h-0 flex-1 flex-col">
                            <div className="pointer-events-none absolute inset-0 z-50">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--skin-accent-color)]/40 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--skin-accent-color)]/10 to-transparent" />
                            </div>

                            <div className="absolute inset-0 z-0">
                                {seasonBackground && <img src={seasonBackground} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/70 to-[#050505]/95" />
                                <div
                                    className="absolute left-0 top-0 h-1/2 w-full opacity-20"
                                    style={{ background: `radial-gradient(circle at 50% 0%, rgba(${tomDoFeito},.82) 0%, transparent 70%)` }}
                                />
                            </div>

                            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                                <RewardPackBody
                                    payload={payloadDoFeito}
                                    emblema={seloDaTemporada ? undefined : emblemaDoFeito}
                                    tom={tomDoFeito}
                                    fallbackEyebrow={sobrancelha}
                                    fallbackTitle={title}
                                    fallbackSummary={seloDaTemporada ? '' : message}
                                    fallbackEmptyMessage=""
                                />
                            </div>

                            <div className={`relative z-10 mt-auto ${isCompetitionResult ? 'p-5 pt-3' : 'p-6 pt-4'}`}>
                                <div className="space-y-3">
                                    {canShareAchievement && !isArenaComplete && (
                                        <button
                                            onClick={handlePostToFeed}
                                            className="luxe-skin-button group relative flex w-full items-center justify-center gap-3 overflow-hidden py-4 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            style={{ ...estiloDaPlaca.botao, borderWidth: 2 }}
                                        >
                                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                                            <ShareIcon className="h-4 w-4" />
                                            Compartilhar no Feed
                                        </button>
                                    )}

                                    {isArenaComplete ? (
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={handleDisableCelebrations} className="flex min-h-10 flex-1 items-center gap-2 border border-white/10 bg-black/25 px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.11em] text-white/52 transition-colors hover:border-white/20 hover:text-white/75">
                                                <span className="grid h-4 w-4 shrink-0 place-items-center border border-white/25 bg-black/40" aria-hidden="true" />
                                                Não mostrar novamente
                                            </button>
                                            <button type="button" aria-label="Compartilhar no Feed" onClick={handlePostToFeed} className="grid h-10 w-10 shrink-0 place-items-center border border-white/15 bg-white/[0.045] text-white/68 transition-colors hover:border-white/28 hover:bg-white/[0.08] hover:text-white">
                                                <ShareIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (isQuestComplete || isReportComplete) && (
                                        <button type="button" onClick={handleDisableCelebrations} className="flex w-full items-center gap-2 border border-white/10 bg-black/25 px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.13em] text-white/52 transition-colors hover:border-white/20 hover:text-white/75">
                                            <span className="grid h-4 w-4 shrink-0 place-items-center border border-white/25 bg-black/40" aria-hidden="true" />
                                            Não mostrar novamente
                                        </button>
                                    )}

                                    <button
                                        onClick={handleClose}
                                        className={primaryButtonClass}
                                        style={{ ...estiloDaPlaca.botao, borderWidth: 2 }}
                                    >
                                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                                        {primaryButtonLabel}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Portal>
    );
};
