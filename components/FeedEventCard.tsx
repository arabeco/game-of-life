import React from 'react';
import { FeedEvent, FeedEventType } from '../types';
import { GlassCard, GlassCardVariant } from './GlassCard';
import { useGame } from '../contexts/GameContext';
import { ArrowRightIcon, CheckCircleIcon, CrownIcon, ShareIcon, SparklesIcon, TrophyIcon, ZapIcon } from './Icons';
import { shareElementWithFeedback } from './Share';

type FeedTone = 'major' | 'social' | 'progress';

interface FeedEventPresentation {
    message: string;
    title: string;
    badge: string;
    tone: FeedTone;
    variant: GlassCardVariant;
    icon: React.ReactNode;
}

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}a`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}m`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}min`;
    return `${Math.max(seconds, 1)}s`;
};

const getFeedPresentation = (event: FeedEvent): FeedEventPresentation => {
    const title = event.content.title?.trim() || 'Feito sem titulo';
    const score = event.content.score ?? null;
    const rankName = event.content.rankName?.trim() || 'Novo patamar';
    const fallbackGlyph = event.content.icon ? (
        <span className="text-lg leading-none">{event.content.icon}</span>
    ) : null;

    const iconByType: Record<FeedEventType, React.ReactNode> = {
        MILESTONE_COMPLETED: fallbackGlyph ?? <TrophyIcon className="h-5 w-5" />,
        ARENA_COMPLETED: fallbackGlyph ?? <CheckCircleIcon className="h-5 w-5" />,
        CYCLE_COMPLETED: fallbackGlyph ?? <SparklesIcon className="h-5 w-5" />,
        PLAYER_RANK_UP: fallbackGlyph ?? <CrownIcon className="h-5 w-5" />,
        CLAN_RANK_UP: fallbackGlyph ?? <CrownIcon className="h-5 w-5" />,
        LEVEL_UP: fallbackGlyph ?? <ZapIcon className="h-5 w-5" />,
        QUEST_COMPLETED: fallbackGlyph ?? <ArrowRightIcon className="h-5 w-5" />,
        REPORT_COMPLETED: fallbackGlyph ?? <SparklesIcon className="h-5 w-5" />,
        COMPETITION_COMPLETED: fallbackGlyph ?? <TrophyIcon className="h-5 w-5" />,
    };

    switch (event.type) {
        case 'MILESTONE_COMPLETED':
            return {
                title,
                message: 'fechou um marco importante',
                badge: 'Marco',
                tone: 'major',
                variant: 'gold',
                icon: iconByType[event.type],
            };
        case 'ARENA_COMPLETED':
            return {
                title,
                message: 'concluiu uma arena',
                badge: 'Arena',
                tone: 'progress',
                variant: 'accent',
                icon: iconByType[event.type],
            };
        case 'CYCLE_COMPLETED':
            return {
                title: score !== null ? `${title} · Score ${score}` : title,
                message: 'encerrou um ciclo',
                badge: 'Ciclo',
                tone: 'major',
                variant: 'gold',
                icon: iconByType[event.type],
            };
        case 'REPORT_COMPLETED':
            return {
                title,
                message: 'publicou um relato no reino',
                badge: 'Relato',
                tone: 'social',
                variant: 'silver',
                icon: iconByType[event.type],
            };
        case 'PLAYER_RANK_UP':
            return {
                title: rankName,
                message: 'subiu de patente pessoal',
                badge: 'Ascensao',
                tone: 'major',
                variant: 'gold',
                icon: iconByType[event.type],
            };
        case 'CLAN_RANK_UP':
            return {
                title: rankName,
                message: 'elevou o grupo para uma nova patente',
                badge: 'Grupo',
                tone: 'social',
                variant: 'silver',
                icon: iconByType[event.type],
            };
        case 'LEVEL_UP':
            return {
                title,
                message: 'evoluiu de nivel',
                badge: 'Nivel',
                tone: 'progress',
                variant: 'accent',
                icon: iconByType[event.type],
            };
        case 'QUEST_COMPLETED':
            return {
                title,
                message: 'fechou uma quest',
                badge: 'Quest',
                tone: 'progress',
                variant: 'accent',
                icon: iconByType[event.type],
            };
        case 'COMPETITION_COMPLETED':
            return {
                title,
                message: 'encerrou um desafio entre aliados',
                badge: 'Desafio',
                tone: 'social',
                variant: 'silver',
                icon: iconByType[event.type],
            };
        default:
            return {
                title,
                message: 'teve um momento digno de nota',
                badge: 'Feito',
                tone: 'progress',
                variant: 'neutral',
                icon: fallbackGlyph ?? <SparklesIcon className="h-5 w-5" />,
            };
    }
};

const toneClasses: Record<FeedTone, { badge: string; iconWrap: string; title: string }> = {
    major: {
        badge: 'border-amber-400/30 bg-amber-400/12 text-amber-200',
        iconWrap: 'border-amber-400/20 bg-amber-400/12 text-amber-100',
        title: 'text-amber-50',
    },
    social: {
        badge: 'border-sky-400/30 bg-sky-400/12 text-sky-100',
        iconWrap: 'border-sky-400/20 bg-sky-400/12 text-sky-100',
        title: 'text-white',
    },
    progress: {
        badge: 'border-emerald-400/30 bg-emerald-400/12 text-emerald-100',
        iconWrap: 'border-emerald-400/20 bg-emerald-400/12 text-emerald-100',
        title: 'text-white',
    },
};

export const FeedEventCard: React.FC<{ event: FeedEvent }> = ({ event }) => {
    const { friends, userProfile, showToast } = useGame();
    const allUsers = [userProfile, ...friends];
    const author = allUsers.find((user) => user.id === event.userId);
    const authorName = event.authorNickname || author?.nickname || 'Soberano';
    const authorAvatar = event.authorAvatarUrl || author?.avatarUrl || '';
    const authorClanName = event.authorClanName?.trim() || author?.clanName || '';

    if (!author && !event.authorNickname) return null;

    const presentation = getFeedPresentation(event);
    const palette = toneClasses[presentation.tone];

    return (
        <GlassCard
            id={`feed-event-${event.id}`}
            variant={presentation.variant}
            className="animate-fade-in overflow-hidden p-0"
        >
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_45%)]" />
                {/* Eram TRES blocos empilhados com respiro de 4, e o do meio repetia a
                    estrutura do de cima: outro icone de 44px so para carregar um
                    titulo. Autor-e-acao numa linha e o objeto em outra, cada uma com
                    seu proprio icone grande, davam quase 200px por evento — quatro
                    eventos nao cabiam numa tela.

                    Agora o objeto entra como uma FAIXA de uma linha, com o icone
                    pequeno: continua sendo o destaque do cartao, sem ser um cartao
                    dentro do cartao. */}
                {/* O feito no centro, o resto na margem.
                    Alinhado a esquerda, o titulo terminava no meio do cartao e o
                    que sobrava a direita lia como espaco esquecido. Centralizado,
                    a mesma largura vira moldura — e num feed de AVANCOS o item
                    concluido merece ser apresentado como placa, nao como linha de
                    registro.
                    Tudo que e secundario — autor, acao, horario e os dois botoes —
                    desce para uma unica linha miuda por cima. Os icones estavam
                    quebrando a simetria do centro so para ficarem ao lado do
                    titulo, e nenhum dos dois e o motivo do cartao existir. */}
                <div className="relative space-y-1 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                        {authorAvatar ? (
                            <img
                                src={authorAvatar}
                                alt={authorName}
                                className="h-5 w-5 shrink-0 rounded-full border border-white/15 object-cover"
                            />
                        ) : (
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[8px] font-semibold text-white/80">
                                {authorName.slice(0, 2).toUpperCase()}
                            </div>
                        )}

                        <p className="min-w-0 flex-1 truncate text-[10px] leading-tight text-white/40">
                            <span className="font-semibold text-white/70">{authorName}</span>
                            <span> · {presentation.message}</span>
                        </p>

                        <span className="shrink-0 text-[9px] uppercase tracking-[0.12em] text-white/25">
                            {timeAgo(new Date(event.timestamp))}
                        </span>

                        <button
                            className="shrink-0 rounded-full p-1 text-white/20 transition-colors hover:bg-white/5 hover:text-[var(--skin-accent-color)]"
                            data-html2canvas-ignore
                        >
                            <CrownIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => {
                                void shareElementWithFeedback(showToast, `feed-event-${event.id}`, {
                                    title: `Conquista de ${authorName} - Life OS`,
                                    preparingMessage: 'Preparando compartilhamento da conquista...',
                                    sharedMessage: 'Conquista compartilhada.',
                                    cancelledMessage: 'Compartilhamento cancelado.',
                                    errorMessage: 'Nao foi possivel preparar a conquista para compartilhar.',
                                });
                            }}
                            className="shrink-0 rounded-full p-1 text-white/20 transition-colors hover:bg-white/5 hover:text-white"
                            data-html2canvas-ignore
                        >
                            <ShareIcon className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <p className={`flex items-center justify-center gap-2 pb-0.5 text-center text-[17px] font-black leading-tight ${palette.title}`}>
                        <span className="shrink-0 text-xl leading-none" aria-hidden>{presentation.icon}</span>
                        <span className="truncate">{presentation.title}</span>
                    </p>
                </div>
            </div>
        </GlassCard>
    );
};
