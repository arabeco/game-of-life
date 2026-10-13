import React, { useState } from 'react';
import { FeedEvent, UserProfile } from '../types';
import { useGame } from '../contexts/GameContext';
import { useConfirmation } from '../hooks/useConfirmation';
import { ShareIcon, StarIcon, TrashIcon } from './Icons';
import { shareElementWithFeedback } from './Share';
import { DailySummaryCard } from './DailySummaryCard';
import { UserAvatar } from './UserAvatar';
import { readDailyFeedSnapshot } from '../utils/dailyFeedSnapshot';
import { acaoDoFeito, getFeedAppearance, numerosDoFeito, tituloDoFeito } from '../utils/feedAppearance';
import './feed-cards.css';

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

/**
 * O CARD DO FEITO (12/10/2026, fechado na bancada tools/feitos-bancada.html).
 *
 * Sem icone de tipo: quem diz o tipo e o fundo (utils/feedAppearance.ts). No
 * lugar do icone, a foto da pessoa com a borda dela. Primeira linha
 * centralizada, "NOME • ação"; o titulo entre os risquinhos dourados; os
 * numeros embaixo. O nome e a foto abrem o perfil.
 *
 * O NOME E O DE HOJE: vem do perfil atual (o proprio, os amigos, ou o cartao
 * publico que o feed busca para os outros). O guardado no post fica so de
 * reserva — trocar de nome nao deixa os posts antigos com o nome velho.
 */
export const FeedEventCard: React.FC<{ event: FeedEvent; onAbrirPerfil?: (perfil: UserProfile) => void }> = ({ event, onAbrirPerfil }) => {
    const { friends, userProfile, showToast, deleteFeedEvent, toggleFeedLike, autoresDoFeed } = useGame();
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
    const autor: UserProfile | undefined = event.userId === userProfile?.id
        ? userProfile
        : friends.find((user) => user.id === event.userId) || autoresDoFeed[event.userId];
    const authorName = autor?.nickname || event.authorNickname || 'Soberano';

    if (!autor && !event.authorNickname) return null;

    const abrirPerfil = autor && onAbrirPerfil ? () => onAbrirPerfil(autor) : undefined;
    const numeros = numerosDoFeito(event);

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
                    <button type="button" className="feat-retrato" onClick={abrirPerfil} disabled={!abrirPerfil} aria-label={`Ver o perfil de ${authorName}`}>
                        <UserAvatar
                            avatarUrl={autor?.avatarUrl || event.authorAvatarUrl}
                            nickname={authorName}
                            borderId={autor?.border}
                            className="h-11 w-11"
                        />
                    </button>
                    <p className="feat-author">
                        <button type="button" className="feat-nome" onClick={abrirPerfil} disabled={!abrirPerfil}>{authorName}</button>
                        <span className="feat-ponto" aria-hidden="true">•</span>
                        <span className="feat-acao">{acaoDoFeito(event)}</span>
                    </p>
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
                    <div className="feat-titulo-riscado">
                        <span className="feat-category-line" aria-hidden="true" />
                        <h3 className="feed-achievement-title">{tituloDoFeito(event)}</h3>
                        <span className="feat-category-line" aria-hidden="true" />
                    </div>
                    {numeros.length > 0 && (
                        <dl className="feat-details">
                            {numeros.map((n) => (
                                <div key={n.rotulo}>
                                    <dd style={n.cor ? { color: `color-mix(in srgb, ${n.cor} 62%, #ffffff)` } : undefined}>{n.valor.toLocaleString('pt-BR')}</dd>
                                    <dt>{n.rotulo}</dt>
                                </div>
                            ))}
                        </dl>
                    )}
                </div>
            </article>
            {confirmationElement}
        </>
    );
};
