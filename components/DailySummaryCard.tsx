import React, { useLayoutEffect, useRef, useState } from 'react';
import type { DailyFeedSnapshot } from '../types';
import { EmojiGlyph } from './EmojiGlyph';
import { ShareIcon } from './Icons';
import { getOperationalDateString } from '../utils/operationalDay.js';
import './daily-review.css';
import { DIRECOES, DIRECAO_PADRAO } from '../constants/rewardPlateStyles';
import { safeDailyActionBackground } from '../utils/dailyFeedSnapshot';
import { buildDailyStats, dailyHeroLabel } from '../utils/dailyStats';
export const DailySummaryCard: React.FC<{snapshot: DailyFeedSnapshot; captureId?: string; isToday?: boolean; onShare?: () => void}> = ({snapshot, captureId, isToday = snapshot.date === getOperationalDateString(), onShare}) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const [tileCapacity, setTileCapacity] = useState(0);
    useLayoutEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;
        const measure = () => {
            const style = getComputedStyle(grid);
            const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
            const tileWidth = rootFont * 2.35;
            const gap = parseFloat(style.columnGap) || 0;
            const rowGap = parseFloat(style.rowGap) || gap;
            const rowHeight = parseFloat(style.gridAutoRows) || (tileWidth + 15);
            /*
             * A ALTURA DISPONIVEL VEM DO TETO DECLARADO, NUNCA DE clientHeight.
             *
             * Ler a altura do proprio elemento era um impasse fechado. A grade
             * e `flex: 0 1 auto`, ou seja nao cresce: a altura dela vem so dos
             * filhos. No primeiro render a capacidade e 0, entao nao ha filho,
             * entao clientHeight e 0, entao rows da 0, entao a capacidade
             * continua 0 — e o ResizeObserver nunca socorre porque nada nunca
             * muda de tamanho. O painel ficava vazio pra sempre, e o card do
             * feed junto com ele.
             *
             * O `max-height` do CSS ja diz quantas fileiras cabem. Perguntar a
             * ele em vez de ao layout tira a resposta do circulo, e mantem o
             * limite de duas fileiras morando num lugar so: a folha de estilo.
             */
            const declaredCap = parseFloat(style.maxHeight);
            const available = Number.isFinite(declaredCap) ? declaredCap : grid.clientHeight;
            const columns = Math.max(1, Math.floor((grid.clientWidth + gap) / (tileWidth + gap)));
            const rows = Math.max(1, Math.floor((available + rowGap) / (rowHeight + rowGap)));
            setTileCapacity(columns * rows);
        };
        const observer = new ResizeObserver(measure);
        observer.observe(grid);
        measure();
        return () => observer.disconnect();
    }, []);
    const visibleRows = snapshot.actions.slice(0, tileCapacity);
    const hiddenCount = snapshot.actions.length - visibleRows.length;

    return (
            <article id={captureId} className="daily-postcard" style={DIRECOES[DIRECAO_PADRAO].placa('214,177,92')} aria-label={`Resumo diário ${snapshot.dateLabel}`}>
                <header className="daily-postcard-header">
                    <span className="daily-postcard-brand">MEU DIA</span>
                    <time dateTime={snapshot.date}>{snapshot.dateLabel}</time>
                </header>
                <section className="daily-postcard-hero">
                    <div className="daily-postcard-number">+{snapshot.xp}</div>
                    <p>{dailyHeroLabel(isToday)}</p>
                </section>
                {/* A MESMA lista do painel, da MESMA funcao.
                    Antes a placa montava duas estatisticas proprias — tempo e
                    acoes — e o painel montava outras quatro. Ninguem tinha
                    escrito nada errado; havia dois donos da mesma decisao. */}
                <div className="daily-postcard-stats">
                    {buildDailyStats(snapshot).map(stat => (
                        <div key={stat.id}><strong>{stat.value}</strong><span>{stat.label}</span></div>
                    ))}
                </div>
                <section className="daily-postcard-actions" aria-label="Ações do dia">
                    <div className="daily-postcard-section-label"><span>Ações do dia</span><span>{hiddenCount > 0 ? `${visibleRows.length} de ${snapshot.total} · +${hiddenCount}` : `${snapshot.total} ações`}</span></div>
                    <div ref={gridRef} className="daily-postcard-grid">
                        {visibleRows.map(row => <div key={row.id} className={`daily-postcard-tile ${row.completed ? 'is-complete' : ''}`} title={`${row.name} — ${row.completed ? 'Concluída' : 'Pendente'}`}>
                            <div className="daily-postcard-tile-art" style={{background: safeDailyActionBackground(row.background)}}>
                                <EmojiGlyph symbol={row.icon || '📝'} size="action" />
                                {row.completed && <span className="daily-postcard-check" aria-label="Concluída">✓</span>}
                            </div>
                            <span className="daily-postcard-tile-name">{row.name}</span>
                        </div>)}
                    </div>
                    {snapshot.total === 0 && <p className="daily-postcard-empty">{'Sem ações registradas neste dia.'}</p>}
                </section>
                {snapshot.comparisonLabel && <p className="daily-comparison-badge">{snapshot.comparisonLabel}</p>}
                {snapshot.reading && <p className="daily-postcard-reading">{snapshot.reading}</p>}
                <footer className="daily-postcard-footer">
                    <span>{snapshot.total - snapshot.completed} pendentes · {snapshot.bayCount} na baía</span>
                    {!isToday && onShare && <button type="button" className="daily-postcard-share" aria-label="Compartilhar resumo diário" title="Compartilhar" data-html2canvas-ignore="true" onClick={onShare}><ShareIcon className="h-5 w-5" /></button>}
                </footer>
            </article>
    );
};
