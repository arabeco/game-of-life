import React, { useMemo } from 'react';
import type { ReportAtlasWeek, ReportAtlasTaskItem } from '../types';

interface MiniCyclePlannerSnapshotProps {
    weeks?: ReportAtlasWeek[];
    accentColor?: string;
    className?: string;
    compact?: boolean;
    style?: React.CSSProperties;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const START_MINUTE = 4 * 60;
const END_MINUTE = 24 * 60;
const TOTAL_MINUTES = END_MINUTE - START_MINUTE;

const palette = ['#EAB308', '#22C55E', '#3B82F6', '#F97316', '#EC4899', '#14B8A6', '#A855F7', '#F43F5E'];

const getArenaColor = (arenaKey: string) => {
    const input = arenaKey || 'glyph';
    let hash = 0;
    for (let index = 0; index < input.length; index += 1) {
        hash = ((hash << 5) - hash) + input.charCodeAt(index);
        hash |= 0;
    }
    return palette[Math.abs(hash) % palette.length];
};

const getTaskStyle = (item: ReportAtlasTaskItem) => {
    const startTime = Number.isFinite(item.startTime) ? item.startTime : START_MINUTE;
    const clampedStart = Math.max(START_MINUTE, Math.min(startTime, END_MINUTE));
    const duration = Math.max(12, Math.min(item.duration || 20, TOTAL_MINUTES));
    const top = ((clampedStart - START_MINUTE) / TOTAL_MINUTES) * 100;
    const height = Math.max(8, (duration / TOTAL_MINUTES) * 100);

    return {
        top: `${Math.min(top, 96)}%`,
        height: `${Math.min(height, 32)}%`,
        backgroundColor: getArenaColor(item.arenaId || item.arenaName),
        opacity: item.completed ? 0.7 : 1,
    };
};

export const MiniCyclePlannerSnapshot: React.FC<MiniCyclePlannerSnapshotProps> = ({
    weeks = [],
    accentColor = '#D4AF37',
    className = '',
    compact = false,
    style,
}) => {
    const days = useMemo(() => weeks.flatMap((week) => week.days.map((day, dayIndex) => ({
        ...day,
        weekIndex: week.weekIndex,
        isWeekStart: dayIndex === 0,
    }))), [weeks]);

    const dayWidth = days.length >= 28 ? 8 : days.length >= 21 ? 10 : days.length >= 14 ? 12 : 14;
    const totalCompleted = useMemo(() => days.reduce((sum, day) => sum + day.completedCount, 0), [days]);
    const totalPlanned = useMemo(() => days.reduce((sum, day) => sum + day.plannedCount, 0), [days]);

    if (days.length === 0) {
        return (
            <div className={`${compact ? 'px-1 py-1.5' : 'rounded-2xl border border-white/10 bg-black/25 p-3'} ${className}`} style={style}>
                <p className={`${compact ? 'text-[8px] text-gray-600' : 'text-[10px] text-gray-500'} font-black uppercase tracking-[0.22em]`}>Sem planner consolidado</p>
            </div>
        );
    }

    const compactTimelineGridStyle = compact
        ? {
            display: 'grid',
            gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
            alignItems: 'end',
            gap: '2px',
            width: '100%',
        } satisfies React.CSSProperties
        : undefined;

    const expandedTimelineStyle = !compact
        ? {
            minWidth: `${(dayWidth + 2) * days.length}px`,
        } satisfies React.CSSProperties
        : undefined;

    return (
        <div className={`${compact ? 'px-0 py-0' : 'rounded-[22px] border border-white/10 bg-black/35 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]'} ${className}`} style={style}>
            {!compact && (
                <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Planner mini</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{totalCompleted}/{totalPlanned}</p>
                </div>
            )}
            <div className={`${compact ? 'overflow-hidden rounded-[6px] border border-white/6 bg-transparent px-[2px] py-[2px]' : 'overflow-hidden rounded-[18px] border border-white/5 bg-[#060606] px-2 py-2'}`}>
                <div
                    className={compact ? '' : 'flex items-end gap-[2px]'}
                    style={compact ? compactTimelineGridStyle : expandedTimelineStyle}
                >
                    {days.map((day) => {
                        const completionRatio = day.plannedCount > 0 ? day.completedCount / day.plannedCount : 0;
                        return (
                            <div key={day.date} className="flex min-w-0 flex-col items-center gap-1" style={compact ? undefined : { width: `${dayWidth}px` }}>
                                <div className={`${compact ? 'text-[6px]' : 'text-[7px]'} font-black leading-none text-gray-600`}>{day.date.slice(-2)}</div>
                                <div
                                    className={`relative ${compact ? 'h-[26px] rounded-[4px]' : 'h-[88px] rounded-[10px]'} w-full overflow-hidden border border-white/6 bg-white/[0.01]`}
                                    style={{ boxShadow: day.isWeekStart ? `inset 1px 0 0 ${accentColor}` : undefined }}
                                    title={`${day.date} - ${day.completedCount}/${day.plannedCount}`}
                                >
                                    <div
                                        className="absolute inset-x-0 bottom-0 bg-white/5"
                                        style={{ height: `${Math.max(6, completionRatio * 100)}%`, background: `linear-gradient(180deg, ${accentColor}22 0%, ${accentColor}55 100%)` }}
                                    />
                                    {day.scheduledItems.slice(0, 4).map((item) => (
                                        <div
                                            key={item.taskId}
                                            className="absolute left-[2px] right-[2px] rounded-sm"
                                            style={getTaskStyle(item)}
                                        />
                                    ))}
                                    {day.unscheduledItems.length > 0 && (
                                        <div className="absolute inset-x-[2px] bottom-[2px] flex flex-wrap justify-center gap-[2px]">
                                            {day.unscheduledItems.slice(0, 3).map((item) => (
                                                <span
                                                    key={item.taskId}
                                                    className="h-[4px] w-[4px] rounded-full"
                                                    style={{ backgroundColor: getArenaColor(item.arenaId || item.arenaName) }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className={`${compact ? 'text-[6px]' : 'text-[7px]'} font-black leading-none text-gray-500`}>{day.isWeekStart ? `S${day.weekIndex}` : '-'}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

