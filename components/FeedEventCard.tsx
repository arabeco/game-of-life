import React, { useState } from 'react';
import { FeedEvent, FeedEventType } from '../types';
import type { GlassCardVariant } from './GlassCard';
import { useGame } from '../contexts/GameContext';
import { useConfirmation } from '../hooks/useConfirmation';
import { ArrowRightIcon, CheckCircleIcon, CrownIcon, ShareIcon, SparklesIcon, StarIcon, TrashIcon, TrophyIcon, ZapIcon } from './Icons';
import { shareElementWithFeedback } from './Share';
import { DailySummaryCard } from './DailySummaryCard';
import { readDailyFeedSnapshot } from '../utils/dailyFeedSnapshot';
import { getFeedAppearance } from '../utils/feedAppearance';
import './feed-cards.css';

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
    const title = event.content.title?.trim() || 'Feito sem título';
    const score = event.content.score ?? null;
    const rankName = event.content.rankName?.trim() || 'Novo patamar';
    // Vector symbols inherit the metal color; color emoji cannot do that.

    const iconByType: Record<FeedEventType, React.ReactNode> = {
        MILESTONE_COMPLETED: <TrophyIcon className="h-5 w-5" />,
        ARENA_COMPLETED: <CheckCircleIcon className="h-5 w-5" />,
        CYCLE_COMPLETED: <SparklesIcon className="h-5 w-5" />,
        PLAYER_RANK_UP: <CrownIcon className="h-5 w-5" />,
        CLAN_RANK_UP: <CrownIcon className="h-5 w-5" />,
        LEVEL_UP: <ZapIcon className="h-5 w-5" />,
        QUEST_COMPLETED: <ArrowRightIcon className="h-5 w-5" />,
        REPORT_COMPLETED: <SparklesIcon className="h-5 w-5" />,
        COMPETITION_COMPLETED: <TrophyIcon className="h-5 w-5" />,
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
                badge: 'Ascensão',
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
                message: 'evoluiu de nível',
                badge: 'Nível',
                tone: 'progress',
                variant: 'accent',
                icon: iconByType[event.type],
            };
        case 'QUEST_COMPLETED':
            return {
                title,
                message: event.content.seasonId ? 'concluiu uma missão de temporada' : 'concluiu uma missão',
                badge: event.content.seasonId ? 'Missão de temporada' : 'Missão',
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
                icon: <SparklesIcon className="h-5 w-5" />,
            };
    }
};

export const FeedEventCard: React.FC<{ event: FeedEvent }> = ({ event }) => {
    const { friends, userProfile, showToast, deleteFeedEvent, toggleFeedLike } = useGame();
    const { confirm, confirmationElement } = useConfirmation();
    const [removendo, setRemovendo] = useState(false);

    /**
     * O botao so existe quando a base sabe contar curtidas.
     *
     * `likes` chega indefinido em base sem a tabela — e ai o cartao desenha sem o
     * botao, em vez de mostrar um zero que na verdade e "nao sei".
     */
    const temCurtidas = typeof event.likes === 'number';
    const curtidas = Number(event.likes) || 0;
    const curtido = Boolean(event.likedByMe);

    /* QUEM CURTIU NAO APARECE, e isso e escolha, nao limitacao: o numero diz
       "alguem viu e achou bom", e basta. A lista diria "fulano viu e beltrano
       nao", e transformaria o Hall num lugar de cobrar presenca. */
    const botaoDeCurtir = temCurtidas ? (
        <button
            type="button"
            onClick={() => void toggleFeedLike(event.id)}
            aria-pressed={curtido}
            aria-label={curtido ? `Tirar curtida. ${curtidas} no total` : `Curtir. ${curtidas} no total`}
            className={`feed-like-button ${curtido ? 'is-curtido' : ''}`}
            data-html2canvas-ignore
        >
            <StarIcon className="h-3.5 w-3.5" />
            <span className="feed-like-count">{curtidas}</span>
        </button>
    ) : null;
    /**
     * So o autor apaga, e a decisao final e da RLS.
     *
     * Este booleano decide o que DESENHAR. Quem decide o que acontece e a
     * politica no banco — o botao escondido nunca foi seguranca, e a checagem
     * la continua valendo mesmo que esta aqui erre.
     */
    const souOAutor = Boolean(userProfile?.id) && event.userId === userProfile.id;

    const removerDoMural = async () => {
        if (removendo) return;
        if (!(await confirm({
            title: 'Tirar do mural',
            message: 'Este feito sai do seu mural e da aba Feitos. A conquista em si continua sua.',
            confirmLabel: 'TIRAR',
            variant: 'danger',
        }))) return;
        setRemovendo(true);
        try { await deleteFeedEvent(event.id); } finally { setRemovendo(false); }
    };

    const botaoDeRemover = souOAutor ? (
        <button
            type="button"
            className="feed-share-control"
            aria-label="Tirar este feito do mural"
            disabled={removendo}
            onClick={() => void removerDoMural()}
        >
            <TrashIcon className="h-4 w-4" /> {removendo ? 'Tirando…' : 'Tirar do mural'}
        </button>
    ) : null;
    const allUsers = [userProfile, ...friends];
    const author = allUsers.find((user) => user.id === event.userId);
    const authorName = event.authorNickname || author?.nickname || 'Soberano';



    if (!author && !event.authorNickname) return null;

    const presentation = getFeedPresentation(event);

    /**
     * Os numeros gravados no evento, se houver.
     *
     * Ausentes em tudo que aconteceu antes destes campos existirem — e ai a linha
     * some, em vez de mostrar zeros. Zero entregas numa arena concluida seria
     * mentira; nao ter o dado e so nao ter o dado.
     */
    const numerosDoFeito = [
        { value: event.content.actionCount, label: 'ações' },
        { value: event.content.deliveries, label: 'entregas' },
        { value: event.content.days, label: 'dias ativos' },
        { value: event.content.exp, label: 'EXP ganhos' },
        { value: event.content.minutes, label: 'min registrados' },
    ].filter((stat) => typeof stat.value === 'number' && Number.isFinite(stat.value) && stat.value >= 0);
    const dailySnapshot = readDailyFeedSnapshot(event.content.dailySummary);
    if (dailySnapshot) return (
        <div className="feed-daily-post">
            <div id={`feed-event-${event.id}`}>
                <div className="feed-daily-author"><strong>{authorName}</strong><span> · {dailySnapshot.dateLabel}</span></div>
                <div className="daily-review daily-postcard-layout" style={{height: 480}}>
                    <DailySummaryCard snapshot={dailySnapshot} />
                </div>
            </div>
            <div className="feed-daily-controls">
                <button className="feed-share-control" aria-label="Compartilhar cartão diário" onClick={() => void shareElementWithFeedback(showToast, `feed-event-${event.id}`, {title: `Dia de ${authorName} — GLYPH`, text: `O dia de @${authorName} no Glyph.`})}>
                    <ShareIcon className="h-4 w-4" /> Compartilhar imagem
                </button>
                {botaoDeCurtir}
                {botaoDeRemover}
            </div>
            {confirmationElement}
        </div>
    );

    return (
        <>
            <article id={`feed-event-${event.id}`} className="feed-achievement-card" data-feat-type={event.type} style={getFeedAppearance(event)}>
                <div className="feat-topline">
                    <div className="feat-medallion" aria-hidden="true">{presentation.icon}</div>
                    <p className="feat-author"><strong>{authorName}</strong></p>
                    <div className="feat-controls">
                        <time dateTime={event.timestamp} className="feat-time">{timeAgo(new Date(event.timestamp))}</time>
                        {botaoDeCurtir}
                        {souOAutor && (
                            <button type="button" aria-label="Tirar este feito do mural" disabled={removendo}
                                onClick={() => void removerDoMural()} className="feat-remove" data-html2canvas-ignore>
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="feat-body">
                    <div className="feat-category"><span className="feat-category-line" aria-hidden="true" /><span className="feat-category-label">{presentation.message}</span><span className="feat-category-line" aria-hidden="true" /></div>
                    <h3 className="feed-achievement-title">{presentation.title}</h3>
                    {numerosDoFeito.length > 0 && <dl className="feat-details">{numerosDoFeito.map(stat => <div key={stat.label}><dd>{stat.value!.toLocaleString('pt-BR')}</dd><dt>{stat.label}</dt></div>)}</dl>}
                </div>
            </article>
            {confirmationElement}
        </>
    );
};
