import React, { useEffect, useMemo, useRef } from 'react';
import { ReportAtlasTaskItem, ReportAtlasWeek } from '../types';

interface CycleAtlasPanelProps {
    weeks: ReportAtlasWeek[];
}

const PALETTE = ['#EAB308', '#22C55E', '#3B82F6', '#F97316', '#EC4899', '#14B8A6', '#A855F7', '#F43F5E'];
const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const HOURS = Array.from({ length: 21 }, (_, i) => i + 4);
const HOUR_SCALE = 0.55;
const DAY_COLUMN_WIDTH = 92;

const formatShortDate = (dateString: string) => new Date(`${dateString}T00:00:00Z`).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
});

const getArenaColor = (arenaKey: string) => {
    const input = arenaKey || 'glyph';
    let hash = 0;
    for (let index = 0; index < input.length; index += 1) {
        hash = ((hash << 5) - hash) + input.charCodeAt(index);
        hash |= 0;
    }
    return PALETTE[Math.abs(hash) % PALETTE.length];
};

const getCompletionRatio = (completed: number, planned: number) => {
    if (planned <= 0) return 0;
    return completed / planned;
};

const getTaskTop = (startTime: number) => (startTime - (4 * 60)) * HOUR_SCALE;
const getTaskHeight = (duration: number) => Math.max(18, duration * HOUR_SCALE);

const TaskPill: React.FC<{ item: ReportAtlasTaskItem; compact?: boolean }> = ({ item, compact = false }) => {
    const color = getArenaColor(item.arenaId || item.arenaName);
    const height = compact ? 18 : getTaskHeight(item.duration);

    return (
        <div
            className={`rounded-r-xl border-l-2 px-1.5 overflow-hidden flex items-center gap-1 text-left shadow-[0_10px_20px_rgba(0,0,0,0.22)] ${item.completed ? 'text-white/75' : 'text-white'}`}
            style={{
                height,
                borderColor: color,
                background: `linear-gradient(135deg, ${color}55 0%, rgba(5,5,5,0.94) 88%)`,
                opacity: item.completed ? 0.7 : 1,
            }}
            title={`${item.actionName} • ${item.arenaName}`}
        >
            <span className="text-[11px] leading-none shrink-0">{item.actionIcon}</span>
            <span className={`font-black tracking-tight truncate ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                {item.actionName}
            </span>
        </div>
    );
};

export const CycleAtlasPanel: React.FC<CycleAtlasPanelProps> = ({ weeks }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const flatDays = useMemo(() => weeks.flatMap((week) => week.days.map((day, dayIndex) => ({
        ...day,
        weekIndex: week.weekIndex,
        weekStartDate: week.startDate,
        weekEndDate: week.endDate,
        dominantArenaName: week.dominantArenaName,
        isWeekStart: dayIndex === 0,
        cycleDayNumber: weeks
            .slice(0, week.weekIndex - 1)
            .reduce((sum, currentWeek) => sum + currentWeek.days.length, 0) + dayIndex + 1,
    }))), [weeks]);

    const firstScheduledMinute = useMemo(() => {
        const minutes = flatDays.flatMap((day) => day.scheduledItems.map((item) => item.startTime));
        if (minutes.length === 0) return 4 * 60;
        return Math.max(4 * 60, Math.min(...minutes) - 60);
    }, [flatDays]);

    const totalPlanned = useMemo(() => flatDays.reduce((sum, day) => sum + day.plannedCount, 0), [flatDays]);
    const totalCompleted = useMemo(() => flatDays.reduce((sum, day) => sum + day.completedCount, 0), [flatDays]);
    const totalCompletedHours = useMemo(() => Math.round((flatDays.reduce((sum, day) => sum + day.completedMinutes, 0) / 60) * 10) / 10, [flatDays]);
    const activeDays = useMemo(() => flatDays.filter((day) => day.completedCount > 0).length, [flatDays]);

    useEffect(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTop = Math.max(0, getTaskTop(firstScheduledMinute));
    }, [firstScheduledMinute]);

    if (weeks.length === 0) {
        return (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] p-5 text-center text-[10px] uppercase tracking-[0.2em] text-gray-500">
                Sem atlas disponivel para este ciclo.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-5 p-6">
            <div className="text-center">
                <h3 className="text-2xl font-black text-white uppercase tracking-[0.3em] mb-2">Atlas</h3>
                <div className="h-0.5 w-12 bg-[var(--skin-accent-color)] mx-auto shadow-[0_0_10px_var(--skin-accent-color)]" />
                <p className="text-[9px] text-gray-500 uppercase tracking-[0.24em] mt-3">Ciclo continuo, dia a dia</p>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-3">
                    <p className="text-[8px] text-gray-500 uppercase tracking-[0.18em]">Dias</p>
                    <p className="text-lg font-black text-white">{flatDays.length}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-3">
                    <p className="text-[8px] text-gray-500 uppercase tracking-[0.18em]">Ativos</p>
                    <p className="text-lg font-black text-white">{activeDays}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-3">
                    <p className="text-[8px] text-gray-500 uppercase tracking-[0.18em]">Feitas</p>
                    <p className="text-lg font-black text-white">{totalCompleted}<span className="text-gray-600">/{totalPlanned}</span></p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-3">
                    <p className="text-[8px] text-gray-500 uppercase tracking-[0.18em]">Horas</p>
                    <p className="text-lg font-black text-white">{totalCompletedHours}</p>
                </div>
            </div>

            <div className="bg-white/[0.03] rounded-[28px] border border-white/[0.05] overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.24)] flex-1 min-h-0">
                <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between gap-3 bg-black/30">
                    <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.22em]">Registro continuo</p>
                        <p className="text-xs text-white font-bold truncate">Deslize na horizontal para atravessar o ciclo inteiro</p>
                    </div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-[0.16em]">{weeks.length} semanas</p>
                </div>

                <div ref={scrollRef} className="overflow-auto h-full max-h-[460px] bg-[#090909]">
                    <div className="min-w-max flex p-2">
                        <div className="sticky left-0 z-30 w-12 flex-shrink-0 pt-[4.85rem] bg-[#090909] border-r border-white/[0.05]">
                            {HOURS.map((hour) => (
                                <div key={hour} className="text-right pr-2" style={{ height: `${60 * HOUR_SCALE}px` }}>
                                    <span className="text-[10px] font-mono text-gray-500">{`${hour.toString().padStart(2, '0')}:00`}</span>
                                </div>
                            ))}
                        </div>

                        <div className="grid" style={{ gridTemplateColumns: `repeat(${flatDays.length}, ${DAY_COLUMN_WIDTH}px)` }}>
                            {flatDays.map((day) => {
                                const ratio = getCompletionRatio(day.completedCount, day.plannedCount);
                                const dayIndex = new Date(`${day.date}T00:00:00Z`).getUTCDay();

                                return (
                                    <div
                                        key={day.date}
                                        className={`relative bg-black/10 ${day.isWeekStart ? 'border-l border-[var(--skin-accent-color)]/30' : 'border-l border-white/10'}`}
                                        style={{ width: `${DAY_COLUMN_WIDTH}px` }}
                                    >
                                        <div className="h-[4.85rem] sticky top-0 z-20 border-b border-white/[0.04] bg-[#090909]/95 backdrop-blur-sm px-1.5 py-1.5 flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.16em] text-gray-600">
                                                <span>C{day.cycleDayNumber}</span>
                                                {day.isWeekStart ? <span className="text-[var(--skin-accent-color)]">S{day.weekIndex}</span> : <span />}
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.18em]">{DAY_LABELS[dayIndex]}</div>
                                                <div className="text-[12px] font-black text-white tabular-nums">{day.date.slice(-2)}</div>
                                            </div>
                                            <div className="min-h-[18px] flex flex-wrap gap-1 justify-center">
                                                {day.unscheduledItems.length === 0 ? (
                                                    <span className="text-[8px] text-gray-700 uppercase tracking-[0.16em]">-</span>
                                                ) : (
                                                    day.unscheduledItems.slice(0, 2).map((item) => (
                                                        <div key={item.taskId} className="max-w-full">
                                                            <TaskPill item={item} compact />
                                                        </div>
                                                    ))
                                                )}
                                                {day.unscheduledItems.length > 2 && (
                                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.16em]">+{day.unscheduledItems.length - 2}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="relative">
                                            {HOURS.map((hour, hourIndex) => (
                                                <div key={hour} className={`relative ${hourIndex > 0 ? 'border-t border-white/10' : ''}`} style={{ height: `${60 * HOUR_SCALE}px` }}>
                                                    <div className="absolute w-full border-t border-white/5" style={{ top: `${15 * HOUR_SCALE}px` }} />
                                                    <div className="absolute w-full border-t border-white/5" style={{ top: `${30 * HOUR_SCALE}px` }} />
                                                    <div className="absolute w-full border-t border-white/5" style={{ top: `${45 * HOUR_SCALE}px` }} />
                                                </div>
                                            ))}

                                            {day.scheduledItems.map((item) => (
                                                <div
                                                    key={item.taskId}
                                                    className="absolute left-1 right-1"
                                                    style={{ top: `${getTaskTop(item.startTime)}px`, height: `${getTaskHeight(item.duration)}px` }}
                                                >
                                                    <TaskPill item={item} />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="px-1.5 py-2 border-t border-white/[0.04] bg-black/20 text-center">
                                            <p className="text-[10px] font-black text-white tabular-nums">{day.completedCount}<span className="text-gray-600">/{day.plannedCount}</span></p>
                                            <p className="text-[8px] text-gray-600 uppercase tracking-[0.14em]">{Math.round(ratio * 100)}%</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
