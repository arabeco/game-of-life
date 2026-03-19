

import React, { useRef } from 'react';
import { Action, ScheduledTask } from '../types';
import { EmojiGlyph } from './EmojiGlyph';
import { useGame } from '../contexts/GameContext';
import { DropIndicator } from './DropIndicator';
import { useLongPress } from '../hooks/useLongPress';
import { OPERATIONAL_DAY_END_HOUR, OPERATIONAL_DAY_START_MINUTE, formatLocalDateString, getOperationalDateString, getOperationalDisplayMinutes, getTaskDisplayStartTime, taskMatchesOperationalDate } from '../utils/operationalDay.js';

interface WeeklyPlannerGridProps {
    currentDate: Date;
    tasks: ScheduledTask[];
    actions: Action[];
    onCustomDragStart: (event: MouseEvent | TouchEvent, item: any, ghost: React.ReactNode, ref: React.RefObject<HTMLDivElement>) => void;
    onTaskClick: (task: ScheduledTask) => void;
    scaleFactor: number;
    stickyHeaderOffset: string;
    currentTime: Date;
    timeIndicatorRef: React.Ref<HTMLDivElement>;
    dropIndicator: { dayIndex: number, top: number, height: number } | null;
}

const hours = Array.from({ length: (OPERATIONAL_DAY_END_HOUR - 4) + 1 }, (_, i) => i + 4);

const Sparkles: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none">
        {[...Array(3)].map((_, i) => (
            <div
                key={i}
                className="absolute w-1 h-1 bg-[var(--gold)] rounded-full animate-ping"
                style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                    animationDelay: `${Math.random() * 0.2}s`,
                }}
            />
        ))}
    </div>
);

const CurrentTimeIndicator = React.forwardRef<HTMLDivElement, { top: number }>(({ top }, ref) => (
    <div ref={ref} className="absolute w-full left-0 right-0 z-20 pointer-events-none px-1" style={{ top: `${top}px` }}>
        <div className="relative flex items-center">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_4px_1px_rgba(255,0,0,0.7)] -ml-1"></div>
            <div className="w-full h-px bg-red-500 shadow-[0_0_4px_1px_rgba(255,0,0,0.7)]"></div>
        </div>
    </div>
));
CurrentTimeIndicator.displayName = 'CurrentTimeIndicator';

const WeeklyTask: React.FC<{ task: ScheduledTask; action?: Action; scaleFactor: number; operationalDate: string; onCustomDragStart: (event: MouseEvent | TouchEvent, item: any, ghost: React.ReactNode, ref: React.RefObject<HTMLDivElement>) => void; onTaskClick: (task: ScheduledTask) => void; }> = ({ task, action, scaleFactor, operationalDate, onCustomDragStart, onTaskClick }) => {
    const { getAssetForAction, toggleTaskCompletion } = useGame();
    const [isHolding, setIsHolding] = React.useState(false);
    const [showSparkles, setShowSparkles] = React.useState(false);
    const [isTransitioning, setIsTransitioning] = React.useState(false);
    const taskRef = React.useRef<HTMLDivElement>(null);
    const completionTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        const el = taskRef.current;
        if (!el) return;
        const preventScroll = (e: TouchEvent) => {
            // Se o usuário está segurando (para drag ou long press), impedimos o scroll
            if (e.cancelable) e.preventDefault();
        };
        el.addEventListener('touchmove', preventScroll, { passive: false });
        return () => {
            el.removeEventListener('touchmove', preventScroll);
            if (completionTimeout.current) {
                clearTimeout(completionTimeout.current);
            }
        };
    }, []);

    const asset = action ? getAssetForAction(action.id) : undefined;
    const backgroundStyle = { background: `var(--asset-grad-${asset?.id || 'default'})` };
    const isFreeAction = action?.actionType === 'Livre';

    const handleLongPress = () => {
        if (isTransitioning) return;
        setIsHolding(true);
        setIsTransitioning(true);
        if (completionTimeout.current) clearTimeout(completionTimeout.current);
        completionTimeout.current = setTimeout(() => {
            if (!task.completed) {
                setShowSparkles(true);
                setTimeout(() => setShowSparkles(false), 1000);
            }
            toggleTaskCompletion(task.id);
            setIsHolding(false);
            setIsTransitioning(false);
        }, 1000); // Changed to 1s for consistency
    };

    const cancelLongPress = () => {
        if (completionTimeout.current) {
            clearTimeout(completionTimeout.current);
            completionTimeout.current = null;
        }
        setIsHolding(false);
        setIsTransitioning(false);
    };

    const handleClick = () => {
        if (isTransitioning) return;
        onTaskClick(task);
    };

    const handleDragStart = (e: MouseEvent | TouchEvent) => {
        const ghost = (
            <div style={isFreeAction ? { height: '40px', width: '100px' } : {...backgroundStyle, height: '40px', width: '100px'}} className={`p-2 flex items-center space-x-2 text-left opacity-80 ${isFreeAction ? 'free-action-shell free-action-outline rounded-xl' : 'rounded-r-lg border-l-2 border-[var(--bronze)]'}`}>
                <div className="text-xl z-10"><EmojiGlyph symbol={action?.icon || '\u{1F4DD}'} size="picker" className="text-white" /></div>
            </div>
        );
        const duration = action?.actionType === 'Marco' ? Math.max(15, task.duration) : task.duration;
        const item = { type: 'reschedule_task', payload: task.id, duration };
        onCustomDragStart(e, item, ghost, taskRef);
    };

    const longPressEvents = useLongPress({
        onLongPress: handleLongPress,
        onLongPressCancel: cancelLongPress,
        onLongPressRelease: cancelLongPress,
        onClick: handleClick,
        onDragStart: handleDragStart,
        delay: 300,
        dragThreshold: 20,
    });

    const top = (getTaskDisplayStartTime(task, operationalDate) - OPERATIONAL_DAY_START_MINUTE) * scaleFactor; 
    const height = task.duration * scaleFactor;

    return (
        <div 
            key={task.id} 
            ref={taskRef}
            className="absolute w-full px-1 cursor-pointer select-none" 
            style={{ top: `${top}px`, height: `${height}px`, minHeight: `${30 * scaleFactor}px`, touchAction: 'none' }}
            {...longPressEvents}
        >
            <div 
                className={`relative h-full p-1 flex items-center justify-center text-center overflow-hidden ${isFreeAction ? `free-action-shell free-action-outline rounded-xl ${task.completed ? 'text-slate-200/75' : 'text-slate-100'}` : `border-l-2 border-[var(--bronze)] rounded-r-lg ${task.completed ? 'text-white/80' : 'text-white'}`}`}
                style={isFreeAction ? undefined : backgroundStyle}
            >
                <div className={`absolute inset-0 transition-opacity duration-300 ${isFreeAction ? 'bg-black/40' : 'bg-black/50'} ${task.completed ? 'opacity-100' : 'opacity-0'}`}></div>

                <div className="text-xl z-10">
                    <EmojiGlyph symbol={action?.icon || '\u{1F4DD}'} size="action" className="text-white" />
                </div>

                {isHolding && (
                    <div className={`absolute inset-0 animate-pulse ${isFreeAction ? 'bg-black/35 rounded-xl' : 'bg-black/50 rounded-r-lg'}`}>
                        <div className={`h-full w-full ${task.completed ? 'bg-red-800/50 animate-[unfill_3s_linear_forwards]' : isFreeAction ? 'bg-slate-200/25 animate-[fill_3s_linear_forwards]' : 'bg-gray-500/50 animate-[fill_3s_linear_forwards]'}`}></div>
                    </div>
                )}
                {showSparkles && <Sparkles />}
            </div>
             <style>{`
                @keyframes fill {
                    from { clip-path: inset(100% 0 0 0); }
                    to { clip-path: inset(0% 0 0 0); }
                }
                @keyframes unfill {
                    from { clip-path: inset(0% 0 0 0); }
                    to { clip-path: inset(100% 0 0 0); }
                }
            `}</style>
        </div>
    );
};


export const WeeklyPlannerGrid: React.FC<WeeklyPlannerGridProps> = ({ currentDate, tasks, actions, onCustomDragStart, onTaskClick, scaleFactor, stickyHeaderOffset, currentTime, timeIndicatorRef, dropIndicator }) => {
    const gridRef = useRef<HTMLDivElement>(null);

    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday (0) to show Monday
    startOfWeek.setDate(diff);

    const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        return date;
    });

    const getActionById = (id: string) => actions.find(a => a.id === id);

    const getTasksForDay = (day: Date) => {
        const operationalDateString = formatLocalDateString(day);
        return tasks.filter(t => taskMatchesOperationalDate(t, operationalDateString));
    };
    
    const todayForCheck = getOperationalDateString();

    return (
        <div className="flex dark-card-bg rounded-3xl p-1 depth-grid" ref={gridRef} data-testid="weekly-grid">
            <div className="w-12 flex-shrink-0 pt-8">
                {hours.map(hour => (
                    <div key={hour} style={{ height: `${60 * scaleFactor}px` }} className="text-right pr-2">
                        <span className="text-xs font-mono text-gray-500">{`${hour.toString().padStart(2, '0')}:00`}</span>
                    </div>
                ))}
            </div>
            <div className="flex-grow grid grid-cols-7">
                {days.map((day, dayIndex) => {
                    const operationalDateString = formatLocalDateString(day);
                    const isToday = operationalDateString === todayForCheck;
                    let timeIndicatorTop = -1;
                    if (isToday) {
                        const currentTotalMinutes = getOperationalDisplayMinutes(currentTime);
                        timeIndicatorTop = (currentTotalMinutes - OPERATIONAL_DAY_START_MINUTE) * scaleFactor;
                    }
                    
                    return (
                        <div 
                            key={dayIndex} 
                            className="relative border-l border-white/10"
                            data-day-index={dayIndex}
                        >
                            <div className="h-8 text-center text-xs font-bold text-gray-400 sticky bg-black/50 z-10 flex flex-col justify-center" style={{ top: stickyHeaderOffset }}>
                                <div>{day.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.','')}</div>
                                <div className="font-normal">{day.getDate()}</div>
                            </div>
                            <div className="relative">
                                {hours.map((hour, i) => (
                                    <div key={hour} className={`relative ${i > 0 ? 'border-t border-white/10' : ''}`} style={{ height: `${60 * scaleFactor}px` }}>
                                        <div className="absolute w-full border-t border-white/5" style={{ top: `${15 * scaleFactor}px` }}></div>
                                        <div className="absolute w-full border-t border-white/5" style={{ top: `${30 * scaleFactor}px` }}></div>
                                        <div className="absolute w-full border-t border-white/5" style={{ top: `${45 * scaleFactor}px` }}></div>
                                    </div>
                                ))}
                                {getTasksForDay(day).map(task => {
                                    const action = getActionById(task.actionId);
                                    return (
                                        <WeeklyTask 
                                            key={task.id}
                                            task={task}
                                            action={action}
                                            scaleFactor={scaleFactor}
                                            operationalDate={operationalDateString}
                                            onCustomDragStart={onCustomDragStart}
                                            onTaskClick={onTaskClick}
                                        />
                                    );
                                })}
                                {dropIndicator && dropIndicator.dayIndex === dayIndex && (
                                    <DropIndicator top={dropIndicator.top} height={dropIndicator.height} className="px-1" />
                                )}
                                {isToday && timeIndicatorTop >= 0 && <CurrentTimeIndicator ref={timeIndicatorRef} top={timeIndicatorTop} />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
