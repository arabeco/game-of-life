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
                <div className="relative space-y-4 p-4">
                    <div className="flex items-start gap-3">
                        {authorAvatar ? (
                            <img
                                src={authorAvatar}
                                alt={authorName}
                                className="h-11 w-11 rounded-2xl border border-white/15 object-cover shadow-[0_10px_30px_rgba(0,0,0,0.22)]"
                            />
                        ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white/80">
                                {authorName.slice(0, 2).toUpperCase()}
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-white">{authorName}</p>
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${palette.badge}`}>
                                    {presentation.badge}
                                </span>
                                <span className="ml-auto text-[11px] uppercase tracking-[0.18em] text-white/35">
                                    {timeAgo(new Date(event.timestamp))}
                                </span>
                            </div>

                            <p className="mt-1 text-sm text-white/60">
                                {presentation.message}
                                {authorClanName ? <span className="text-white/35"> · {authorClanName}</span> : null}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-[20px] border border-white/8 bg-black/15 p-3">
                        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border ${palette.iconWrap}`}>
                            {presentation.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Sinal do reino</p>
                            <p className={`mt-1 text-base font-semibold leading-tight ${palette.title}`}>{presentation.title}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-1">
                        <p className="text-xs text-white/35">
                            Evento social recente{authorClanName ? ` de ${authorClanName}` : ''}.
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                className="rounded-full p-2 text-white/35 transition-colors hover:bg-white/5 hover:text-[var(--skin-accent-color)]"
                                data-html2canvas-ignore
                            >
                                <CrownIcon className="h-4 w-4" />
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
                                className="rounded-full p-2 text-white/35 transition-colors hover:bg-white/5 hover:text-white"
                                data-html2canvas-ignore
                            >
                                <ShareIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};
