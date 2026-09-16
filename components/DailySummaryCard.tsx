import React, { useLayoutEffect, useRef, useState } from 'react';
import type { DailyFeedSnapshot } from '../types';
import { EmojiGlyph } from './EmojiGlyph';
import { ShareIcon } from './Icons';
import { getOperationalDateString } from '../utils/operationalDay.js';
import './daily-review.css';
import { DIRECOES, DIRECAO_PADRAO } from '../constants/rewardPlateStyles';
import { safeDailyActionBackground } from '../utils/dailyFeedSnapshot';
const formatDuration = (minutes: number) => { const n = Math.max(0, Math.round(minutes)); return n >= 60 ? `${Math.floor(n/60)}h${n%60 ? String(n%60).padStart(2,'0') : ''}` : `${n}min`; };
export const DailySummaryCard: React.FC<{snapshot: DailyFeedSnapshot; captureId?: string; isToday?: boolean; onShare?: () => void}> = ({snapshot, captureId, isToday = snapshot.date === getOperationalDateString(), onShare}) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const [tileCapacity, setTileCapacity] = useState(0);
    useLayoutEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;
        const measure = () => {
            const style = getComputedStyle(grid);
            const tileWidth = parseFloat(getComputedStyle(document.documentElement).fontSize) * 2.35;
            const gap = parseFloat(style.columnGap) || 0;
            const rowHeight = parseFloat(style.gridAutoRows);
            const columns = Math.floor((grid.clientWidth + gap) / (tileWidth + gap));
            const rows = Math.floor((grid.clientHeight + gap) / (rowHeight + gap));
            setTileCapacity(Math.max(0, columns * rows));
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
                    <p>{isToday ? 'XP acumulado' : 'XP registrado'}</p>
                </section>
                <div className="daily-postcard-stats">
                    <div><strong>{formatDuration(snapshot.minutes)}</strong><span>tempo registrado</span></div>
                    <div><strong>{snapshot.completed}</strong><span>ações concluídas</span></div>
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
