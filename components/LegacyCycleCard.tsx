import React from 'react';
import { formatDate } from '../utils/dateUtils';
import { getMetalRankPalette } from './MetalReportCard';

interface LegacyCycleCardProps {
    rank: string;
    score: number;
    title: string;
    startDate: string;
    endDate: string;
    progress: number;
    avgHoursPerDay: number;
    maxStreak: number;
    activeDays: number;
    totalHours: number;
    totalActions: number;
    className?: string;
    style?: React.CSSProperties;
}

const formatHours = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

export const LegacyCycleCard: React.FC<LegacyCycleCardProps> = ({
    rank,
    score,
    title,
    startDate,
    endDate,
    progress,
    avgHoursPerDay,
    maxStreak,
    activeDays,
    totalHours,
    totalActions,
    className = '',
    style,
}) => {
    const palette = getMetalRankPalette(rank);

    return (
        <article
            className={`legacy-cycle-card ${className}`.trim()}
            style={{
                ['--legacy-cycle-base' as string]: palette.base,
                ['--legacy-cycle-base-deep' as string]: palette.baseDeep,
                ['--legacy-cycle-highlight' as string]: palette.highlight,
                ['--legacy-cycle-edge' as string]: palette.edge,
                ['--legacy-cycle-trim' as string]: palette.trim,
                ['--legacy-cycle-text' as string]: palette.text,
                ...style,
            }}
        >
            <span className="legacy-cycle-card__frame" />
            <span className="legacy-cycle-card__inner-frame" />

            <header className="legacy-cycle-card__header">
                <span className="legacy-cycle-card__date">{formatDate(startDate)}</span>
                <h4 className="legacy-cycle-card__title">{title}</h4>
                <span className="legacy-cycle-card__date legacy-cycle-card__date--end">{formatDate(endDate)}</span>
            </header>

            <div className="legacy-cycle-card__hero">
                <div className="legacy-cycle-card__rank">{rank}</div>
                <div className="legacy-cycle-card__score">{score}</div>
            </div>

            <div className="legacy-cycle-card__metrics">
                <div className="legacy-cycle-card__metric">
                    <span className="legacy-cycle-card__metric-label">Progresso</span>
                    <span className="legacy-cycle-card__metric-value">{progress}%</span>
                </div>
                <div className="legacy-cycle-card__metric">
                    <span className="legacy-cycle-card__metric-label">Horas/AÃ§Ãµes</span>
                    <span className="legacy-cycle-card__metric-value">{formatHours(totalHours)}h Â· {totalActions}</span>
                </div>
                <div className="legacy-cycle-card__metric">
                    <span className="legacy-cycle-card__metric-label">Horas/dia</span>
                    <span className="legacy-cycle-card__metric-value">{avgHoursPerDay.toFixed(1)}</span>
                </div>
                <div className="legacy-cycle-card__metric">
                    <span className="legacy-cycle-card__metric-label">Streak/Dias</span>
                    <span className="legacy-cycle-card__metric-value">{maxStreak} Â· {activeDays}</span>
                </div>
            </div>
        </article>
    );
};

