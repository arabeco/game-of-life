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
    /**
     * A PORCENTAGEM VEM DE FORA, e de proposito.
     *
     * Calcular `completed / total` aqui dentro criaria uma segunda copia da mesma
     * verdade: o painel diria 78% enquanto quem chamou diria outra coisa. Quem
     * manda o par manda a conta.
     */
    percent: number;
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
    percent,
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
    const safePercent = Math.max(0, Math.min(100, percent));
    const arenasFechadas = arenas.filter((arena) => arena.total > 0 && arena.completed >= arena.total).length;

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
              * O NUMERAO E O QUE FOI FEITO, NAO UMA NOTA CONTRA O QUE FOI MARCADO.
              *
              * Quem nao agenda nada e faz cinco coisas nao tem denominador: o
              * "100%" que sobrava pra essa pessoa nao dizia nada, e pra quem
              * agendou muito e fez pouco a porcentagem virava boletim na primeira
              * linha do painel. As duas leituras sao ruins pelo mesmo motivo — o
              * plano estava no lugar do feito.
              *
              * Entao o hero conta acoes concluidas, que e verdade pra todo mundo.
              */}
            <section className="daily-board-hero" aria-label="O que foi feito">
                <div className="daily-board-done">{completed}</div>
                <p className="daily-board-done-label">{completed === 1 ? 'ação concluída' : 'ações concluídas'}</p>
                {(durationLabel || xp > 0) && (
                    <p className="daily-board-pair">
                        {durationLabel}
                        {durationLabel && xp > 0 ? ' · ' : ''}
                        {xp > 0 ? `+${xp} EXP` : ''}
                    </p>
                )}
            </section>

            {/*
              * A BARRA SO EXISTE QUANDO HA PLANO PRA MEDIR.
              *
              * Sem nada pendente nao ha o que comparar, e uma barra cheia nesse
              * caso seria um elogio a um esforco que ninguem pediu. Com pendente,
              * ela responde uma pergunta real — "sobrou o que?" — e ai a
              * porcentagem cabe, pequena, do lado.
              */}
            {pending > 0 && (
                <section className="daily-board-plano" aria-label="Do que estava marcado">
                    <div className="daily-board-bar" role="presentation">
                        <span style={{ width: `${safePercent}%` }} />
                    </div>
                    <p className="daily-board-plano-linha">
                        <span><strong>{completed}</strong> de <strong>{total}</strong> do que estava marcado</span>
                        <span className="daily-board-plano-pct">{safePercent}%</span>
                    </p>
                </section>
            )}

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
                    {/* O que SOBROU, e nao quantas arenas existem: o numero de
                        arenas se conta olhando, o que ficou pendente nao. */}
                    <div className="daily-board-label">
                        <span>{isToday ? 'O dia por arena' : 'O que foi feito'}</span>
                        <span>{pending > 0 ? `${pending} ${pending === 1 ? 'pendente' : 'pendentes'}` : `${arenasFechadas} ${arenasFechadas === 1 ? 'arena fechada' : 'arenas fechadas'}`}</span>
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
