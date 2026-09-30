import React from 'react';
import { EmojiGlyph } from './EmojiGlyph';
import { OracleSpeakerMark } from './OracleSpeakerMark';
import { ShareIcon } from './Icons';
import { safeDailyActionBackground } from '../utils/dailyFeedSnapshot';
import './daily-board.css';

/**
 * O PAINEL, QUE NAO E O CARTAO.
 *
 * Por duas semanas os dois foram a mesma peca: `DailySummaryCard` desenhava a
 * placa de compartilhar E era o que a pessoa abria pra ler o dia. Isso obrigava
 * o painel a caber numa caixa de tamanho fixo — a placa precisa de borda
 * definida pra virar PNG — e foi dai que nasceu a medicao de capacidade que
 * travou em zero e deixou a tela vazia.
 *
 * Aqui nao existe medicao. O painel ROLA: quantas acoes couberem, cabem, e o
 * resto desce. Nenhum numero desta tela depende de outro ter sido pintado
 * primeiro, que era a raiz do travamento.
 *
 * Ele tambem nao inventa conta nenhuma. Tudo que aparece aqui ja era calculado
 * por `DailyPanelContent` desde 08/09 e vinha sendo jogado fora a cada render.
 */

export interface DailyBoardStat {
    /** Chave estavel: o rotulo muda entre hoje e um dia fechado. */
    id: string;
    label: string;
    value: string;
    /** Linha de apoio, quando o numero sozinho nao se explica. */
    hint?: string;
}

export interface DailyBoardArena {
    id: string;
    name: string;
    completed: number;
    total: number;
    exp: number;
    /**
     * AS ACOES DELA, dentro dela.
     *
     * Antes havia duas listas: as arenas resumidas em cima e todas as pastilhas
     * numa grade unica embaixo. Pra saber quais acoes eram da Academia era
     * preciso casar cor com cor entre as duas. Uma lista so, com as pastilhas
     * dentro da arena a que pertencem, responde isso sem trabalho nenhum.
     */
    actions: DailyBoardAction[];
    /** O emoji da propria arena, o mesmo que ela mostra em qualquer outra tela. */
    icon?: string;
    /**
     * O MESMO fundo das pastilhas dela, e nao uma cor derivada por fora.
     *
     * Quem monta passa o gradiente que `getActionBackgroundStyle` devolve para
     * uma acao desta arena. Assim a tarja da linha e as pastilhas logo abaixo
     * sao a mesma cor por construcao — inclusive nas arenas de missao, que nao
     * tiram cor de area da vida e sim de `--quest-grad-*`.
     */
    background?: string;
}

export interface DailyBoardAction {
    id: string;
    name: string;
    icon: string;
    completed: boolean;
    background?: string;
}

export interface DailyPanelBoardProps {
    date: string;
    dateLabel: string;
    isToday: boolean;
    completed: number;
    total: number;
    durationLabel: string;
    xp: number;
    stats: DailyBoardStat[];
    arenas: DailyBoardArena[];
    cycleName?: string;
    cycleDayLabel?: string;
    greeting?: string | null;
    reading?: string | null;
    comparisonLabel?: string | null;
    onShare?: () => void;
}

export const DailyPanelBoard: React.FC<DailyPanelBoardProps> = ({
    date,
    dateLabel,
    isToday,
    completed,
    total,
    durationLabel,
    xp,
    stats,
    arenas,
    cycleName,
    cycleDayLabel,
    greeting,
    reading,
    comparisonLabel,
    onShare,
}) => {
    const pending = Math.max(0, total - completed);

    return (
        <div className="daily-board" aria-label={`Painel do dia ${dateLabel}`}>
            <header className="daily-board-head">
                <div className="daily-board-when">
                    <span className="daily-board-eyebrow">{isToday ? 'Andamento de hoje' : 'Como o dia fechou'}</span>
                    <time className="daily-board-date" dateTime={date}>{dateLabel}</time>
                </div>
                <div className="daily-board-head-side">
                    {cycleDayLabel && (
                        <span className="daily-board-cycle" title={cycleName}>
                            {cycleName && <b>{cycleName}</b>}
                            <span>{cycleDayLabel}</span>
                        </span>
                    )}
                    {onShare && (
                        <button
                            type="button"
                            className="daily-board-share"
                            onClick={onShare}
                            aria-label="Compartilhar o dia"
                            title="Compartilhar"
                        >
                            <ShareIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </header>

            {/* <div> e nao <p>: a marca do Oraculo e um <div>, e <div> dentro de <p>
                e HTML invalido — o navegador fecha o paragrafo sozinho e a fala sai
                fora da caixa. */}
            {greeting && (
                <div className="daily-board-greeting">
                    {/* A marca menor nasce de `sm` (44px) reduzida por CSS, e nao de
                        um tamanho novo no componente: a marca do Oraculo e a mesma
                        em todo o app, e criar um quarto tamanho so por causa desta
                        linha faria a identidade depender de quem chama. */}
                    <span className="daily-board-mark"><OracleSpeakerMark size="sm" pulse={false} /></span>
                    <span>{greeting}</span>
                </div>
            )}

            {/*
              * O NUMERAO E O QUE FOI FEITO, E SO ISSO.
              *
              * Nao ha porcentagem nem barra de progresso em lugar nenhum deste
              * painel. Toda barra precisa de um denominador, e o unico
              * denominador disponivel aqui e o que a pessoa marcou — o que
              * transforma quem nao marca nada em "100%" e quem marca muito em
              * boletim. O painel conta acoes, tempo e EXP, que sao verdade sem
              * plano nenhum por tras.
              */}
            <section className="daily-board-hero" aria-label="O que foi feito">
                <div className="daily-board-done">{completed}</div>
                <p className="daily-board-done-label">{completed === 1 ? 'ação concluída' : 'ações concluídas'}</p>
            </section>

            {/*
              * UM QUADRADO, UMA UNIDADE.
              *
              * Quem monta e responsavel por isso: dois quadrados contando acoes
              * em escopos diferentes, ao lado de um contando EXP, fazem a fileira
              * parecer tres respostas pra mesma pergunta. Cada um aqui mede uma
              * grandeza que nenhum outro mede — e nenhum repete a contagem que ja
              * esta no numerao logo acima.
              */}
            {stats.length > 0 && (
                <div className="daily-board-stats">
                    {stats.map((stat) => (
                        <div key={stat.id} className="daily-board-stat">
                            <strong>{stat.value}</strong>
                            <span>{stat.label}</span>
                            {stat.hint && <small>{stat.hint}</small>}
                        </div>
                    ))}
                </div>
            )}

            {arenas.length > 0 && (
                <section className="daily-board-section" aria-label="Arenas do dia">
                    {/* So o que SOBROU, e so quando sobrou.
                        O numero de arenas se conta olhando a lista, e "tudo
                        fechado" e elogio a um plano — que nem todo mundo fez. */}
                    <div className="daily-board-label">
                        <span>{isToday ? 'O dia por arena' : 'O que foi feito'}</span>
                        {pending > 0 && <span>{pending} {pending === 1 ? 'pendente' : 'pendentes'}</span>}
                    </div>
                    <ul className="daily-board-arenas">
                        {arenas.map((arena) => {
                            const full = arena.total > 0 && arena.completed >= arena.total;
                            return (
                                <li key={arena.id} className={`daily-board-grupo ${full ? 'is-full' : ''}`}>
                                    <div className="daily-board-grupo-head">
                                        <span className="daily-board-arena-mark" style={{ background: safeDailyActionBackground(arena.background) }}>
                                            <EmojiGlyph symbol={arena.icon || '🎯'} size="badge" />
                                        </span>
                                        <span className="daily-board-arena-name">{arena.name}</span>
                                        <span className="daily-board-arena-count">{arena.completed}<i>/{arena.total}</i></span>
                                        <span className="daily-board-arena-exp">{arena.exp > 0 ? `+${arena.exp}` : '—'}</span>
                                    </div>
                                    <div className="daily-board-tiles">
                                        {arena.actions.map((action) => (
                                            <div
                                                key={action.id}
                                                className={`daily-board-tile ${action.completed ? 'is-complete' : ''}`}
                                                title={`${action.name} — ${action.completed ? 'Concluída' : 'Pendente'}`}
                                            >
                                                <div className="daily-board-tile-art" style={{ background: safeDailyActionBackground(action.background) }}>
                                                    <EmojiGlyph symbol={action.icon || '📝'} size="action" />
                                                    {action.completed && <span className="daily-board-check" aria-label="Concluída">✓</span>}
                                                </div>
                                                <span className="daily-board-tile-name">{action.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {total === 0 && (
                <p className="daily-board-empty">
                    {isToday ? 'Nenhuma ação no dia ainda. Puxe algo da baía pra começar.' : 'Nenhuma ação registrada neste dia.'}
                </p>
            )}

            {comparisonLabel && <p className="daily-board-badge">{comparisonLabel}</p>}
            {reading && <blockquote className="daily-board-reading">{reading}</blockquote>}
        </div>
    );
};
