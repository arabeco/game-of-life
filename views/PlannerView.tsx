import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, PlusIcon, MinusIcon, SquareCheckIcon, PanelIcon, FlameIcon, ArchiveBoxIcon, ZapIcon } from '../components/Icons';
import { useGame, getLocalDateString } from '../contexts/GameContext';
import { Action, ScheduledTask, DayOfWeek, Arena, DailyCommitment, SeasonQuest, ActionType, PlannerMatrixQuadrant, Report } from '../types';
import { ChecklistModal } from '../components/ChecklistModal';
import { WeeklyPlannerGrid } from '../components/WeeklyPlannerGrid';
import { PoolAction } from '../components/PoolAction';
import { DropIndicator } from '../components/DropIndicator';
import { SitrepModal } from '../components/SitrepModal';
import { MilestonePoolAction } from '../components/MilestonePoolAction';
import { ActionModal } from '../components/ActionModal';
import { GlassCard } from '../components/GlassCard';
import { useTutorial } from '../contexts/TutorialContext';
import { buildActionPoolByDate, buildDailyExpSnapshot, filterCycleTasksByScope, getInitialDailyCommitmentTaskIds, getVisiblePoolTaskIdsForAction } from '../utils/coreLoopUtils.js';
import { OPERATIONAL_DAY_START_MINUTE, OPERATIONAL_DAY_TOTAL_MINUTES, buildLocalDateFromString, formatLocalDateString, formatOperationalHourLabel, getActualDateStringForOperationalMinutes, getActualStartTimeForOperationalMinutes, getOperationalDateString, getOperationalDisplayMinutes, getOperationalHourTicks, getTaskDisplayStartTime, getTaskOperationalDateString, taskMatchesOperationalDate } from '../utils/operationalDay.js';
import { hasScheduledTime, isClanQuestAction, isTaskInPool } from '../utils/taskDomain.js';
import { useLongPress } from '../hooks/useLongPress';
import { hasPremiumAccess } from '../utils/premiumAccess';
import { APP_SENSORY_CUE_EVENT, type AppSensoryCuePayload } from '../utils/sensoryCue';
import {
    PLANNER_OPEN_ACTION_MODAL_EVENT,
    REST_SCREEN_ACTION_SESSION_CLEAR_EVENT,
    RestScreenActionViewRequestDetail,
    loadPersistedRestScreenActionSession,
} from '../utils/restScreenActionSession';
import '../components/core-ui.css';
import { EmojiGlyph } from '../components/EmojiGlyph';

type BayEntryPayload = { count: number; isUnlimited: boolean; taskIds?: string[]; displayCount?: number };
type ExecutionDropTarget = { date: string; index: number } | null;
type PlannerExpSnapshot = {
    value: number;
    completedCount: number;
    totalCount: number;
    isDeposited: boolean;
};

const AnimatedExpCounter: React.FC<{ snapshot: PlannerExpSnapshot }> = ({ snapshot }) => {
    const [displayValue, setDisplayValue] = useState(snapshot.value);
    const [isPulsing, setIsPulsing] = useState(false);
    const previousValueRef = useRef(snapshot.value);

    useEffect(() => {
        const startValue = previousValueRef.current;
        const endValue = snapshot.value;
        previousValueRef.current = endValue;
        let frameId = 0;
        let cancelled = false;

        if (endValue > startValue) {
            setIsPulsing(true);
            window.setTimeout(() => setIsPulsing(false), 560);
        }

        const durationMs = 420;
        const startAt = performance.now();

        const tick = (now: number) => {
            if (cancelled) return;
            const progress = Math.min(1, (now - startAt) / durationMs);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.round(startValue + ((endValue - startValue) * eased)));
            if (progress < 1) {
                frameId = requestAnimationFrame(tick);
            }
        };

        frameId = requestAnimationFrame(tick);
        return () => {
            cancelled = true;
            cancelAnimationFrame(frameId);
        };
    }, [snapshot.value]);

    return (
        <div className={`planner-vital-orb min-w-0 transition-transform duration-300 ${isPulsing ? 'scale-[1.04]' : ''}`} aria-live="polite">
            <div className="planner-vital-orb__glow" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-0.5">
                <div className="flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.12em] text-white/36">
                    <ZapIcon className={`h-2 w-2 shrink-0 ${isPulsing ? 'text-[var(--skin-accent-color)] drop-shadow-[0_0_8px_var(--skin-accent-color)]' : 'text-white/30'}`} />
                    <span>EXP</span>
                </div>
                <div className={`tabular-nums text-[16px] font-black leading-none text-[var(--skin-accent-color)] transition-all duration-300 ${isPulsing ? 'drop-shadow-[0_0_10px_var(--skin-accent-color)]' : ''}`}>+{displayValue}</div>
            </div>
        </div>
    );
};

const compareExecutionTasks = (left: ScheduledTask, right: ScheduledTask) => {
    if (left.completed !== right.completed) return Number(left.completed) - Number(right.completed);

    const leftHasTime = hasScheduledTime(left);
    const rightHasTime = hasScheduledTime(right);
    if (leftHasTime !== rightHasTime) return Number(rightHasTime) - Number(leftHasTime);

    if (leftHasTime && rightHasTime && left.startTime !== right.startTime) {
        return left.startTime - right.startTime;
    }

    const leftCreatedAt = left.createdAt || '';
    const rightCreatedAt = right.createdAt || '';
    if (leftCreatedAt !== rightCreatedAt) return leftCreatedAt.localeCompare(rightCreatedAt);

    return left.id.localeCompare(right.id);
};

const getPlannerWeekDates = (anchorDate: Date) => {
    const weekStart = new Date(anchorDate);
    const dayOfWeek = weekStart.getDay();
    const distanceFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + distanceFromMonday);
    weekStart.setHours(12, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        return formatLocalDateString(date);
    });
};

const PLANNER_MATRIX_LAYOUT: Array<{ key: PlannerMatrixQuadrant; label: string; title: string }> = [
    { key: 'ui', label: 'UI', title: 'Urgente + Importante' },
    { key: 'nui', label: 'NUI', title: 'Nao urgente + Importante' },
    { key: 'uni', label: 'UNI', title: 'Urgente + Nao importante' },
    { key: 'nuni', label: 'NUNI', title: 'Nao urgente + Nao importante' },
];

const DayHeader: React.FC<{
    currentDate: Date;
    label?: string;
    canUseAdvancedPlannerMatrix?: boolean;
    isAdvancedPlannerMatrixEnabled?: boolean;
    onToggleAdvancedPlannerMatrix?: () => void;
    leftSlot?: React.ReactNode;
    rightSlot?: React.ReactNode;
}> = ({ currentDate, label, canUseAdvancedPlannerMatrix = false, isAdvancedPlannerMatrixEnabled = false, onToggleAdvancedPlannerMatrix, leftSlot, rightSlot }) => {
    const day = currentDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    return (
        <div className="planner-day-header planner-header-footer relative flex items-center justify-center py-2 text-center text-[12px] font-semibold tracking-[0.04em] text-gray-300 capitalize">            {(canUseAdvancedPlannerMatrix || leftSlot) && (
                <div className="absolute left-2 flex items-center gap-1">
                    {canUseAdvancedPlannerMatrix && (
                        <button
                            type="button"
                            onClick={onToggleAdvancedPlannerMatrix}
                            className={`flex h-4 w-4 items-center justify-center rounded-[4px] border transition-colors ${isAdvancedPlannerMatrixEnabled
                                ? 'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/18 text-[var(--skin-accent-color)]'
                                : 'border-white/14 bg-black/20 text-transparent hover:border-white/28'
                            }`}
                            title="Alternar matriz avancada"
                            aria-label="Alternar matriz avancada"
                            aria-pressed={isAdvancedPlannerMatrixEnabled}
                        >
                            <span className="text-[10px] font-black leading-none">✓</span>
                        </button>
                    )}
                    {leftSlot}
                </div>
            )}
            {label || day}
            {rightSlot && (
                <div className="absolute right-2 flex items-center gap-1">
                    {rightSlot}
                </div>
            )}
        </div>
    );
};

const Sparkles: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
            <div
                key={i}
                className="absolute w-2 h-2 bg-[var(--skin-accent-color)] rounded-full animate-ping"
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

const TaskSlot: React.FC<{ task: ScheduledTask, action?: Action, scaleFactor: number, operationalDate: string, onCustomDragStart: (event: MouseEvent | TouchEvent, item: any, ghost: React.ReactNode, ref: React.RefObject<HTMLDivElement>) => void, onTaskClick: (task: ScheduledTask) => void }> = ({ task, action, scaleFactor, operationalDate, onCustomDragStart, onTaskClick }) => {
    const { getActionBackgroundStyle, toggleTaskCompletion, deleteTask } = useGame();
    const [isHolding, setIsHolding] = useState(false);
    const [showSparkles, setShowSparkles] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const taskRef = useRef<HTMLDivElement>(null);
    const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Cleanup timeout on unmount
        const el = taskRef.current;
        const preventScroll = (e: TouchEvent) => {
            if (e.cancelable) e.preventDefault();
        };
        if (el) el.addEventListener('touchmove', preventScroll, { passive: false });

        return () => {
            if (el) el.removeEventListener('touchmove', preventScroll);
            if (completionTimeout.current) {
                clearTimeout(completionTimeout.current);
            }
        };
    }, []);

    const backgroundStyle = action ?getActionBackgroundStyle(action.id) : { background: 'var(--asset-grad-default)' };
    const isMilestone = action?.actionType === 'Marco';
    const standardTaskContentStyle = {
        color: '#f8fafc',
        textShadow: '0 1px 6px rgba(2, 6, 23, 0.82)',
    } as React.CSSProperties;
    const displayStartTime = getTaskDisplayStartTime(task, operationalDate);
    const top = (displayStartTime - OPERATIONAL_DAY_START_MINUTE) * scaleFactor;

    // Handle corrupted tasks (missing action)
    if (!action) {
        const height = Math.max(30 * scaleFactor, task.duration * scaleFactor);
        return (
            <div
                ref={taskRef}
                className="absolute inset-x-0 cursor-pointer z-10"
                style={{ top: `${top}px`, height: `${height}px` }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Tarefa corrompida detectada (sem a\u00E7\u00E3o vinculada). Deseja delet\u00E1-la?")) {
                        deleteTask(task.id);
                    }
                }}
            >
                <div className="h-full w-full bg-red-900/40 border border-red-500/30 rounded-lg flex flex-col items-center justify-center p-1 backdrop-blur-sm hover:bg-red-900/60 transition-colors">
                     <span className="text-lg">{'\u26A0\uFE0F'}</span>
                     <span className="text-[10px] text-red-200 font-bold text-center leading-tight mt-1">{'DADOS INV\u00C1LIDOS'}<br/>Toque para limpar</span>
                </div>
            </div>
        );
    }

    const handleLongPress = () => {
        if (isTransitioning) return;

        // Anti-exploit visual no PlannerView: nao animar completacao futura
        const now = new Date();
        const todayString = getLocalDateString(now);
        if (task.date > todayString && !task.completed) {
            // O proprio toggleTaskCompletion vai dar o aviso em toast. Aqui so abortamos a visual.
            toggleTaskCompletion(task.id);
            return;
        }

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
        }, task.completed ? 3000 : 1800);
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
        // Open modal on click
        onTaskClick(task);
    };

    const handleDragStart = (e: MouseEvent | TouchEvent) => {
        const ghost = (
            <div
                style={{ ...backgroundStyle, height: '40px', width: '100px' }}
                className="p-2 flex items-center space-x-2 rounded-2xl text-left opacity-80"
            >
                <div className="text-lg z-10 shrink-0"><EmojiGlyph symbol={action?.icon || '\u{1F4DD}'} size="action" className="text-white" /></div>
                <div className="text-sm font-semibold truncate min-w-0 flex-1 z-10 text-white [text-shadow:0_1px_6px_rgba(2,6,23,0.82)]">{action?.name}</div>
            </div>
        );
        const duration = action?.actionType === 'Marco' ?Math.max(15, task.duration) : task.duration;
        const item = { type: 'reschedule_task', payload: task.id, duration };
        onCustomDragStart(e, item, ghost, taskRef);
    };

    const longPressEvents = useLongPress({
        onLongPress: handleLongPress,
        onLongPressCancel: cancelLongPress,
        onLongPressRelease: cancelLongPress,
        onClick: handleClick,
        onDragStart: handleDragStart,
        delay: 420,
        dragThreshold: 14,
        preventDefaultOnTouch: false,
        touchDragRequiresLongPress: true,
    });

    if (isMilestone) {
        const height = Math.max(15 * scaleFactor, task.duration * scaleFactor);

        return (
            <div
                ref={taskRef}
                {...longPressEvents}
                className="absolute left-0 right-1 cursor-pointer select-none flex items-center justify-center"
                style={{ top: `${top}px`, height: `${height}px`, touchAction: 'none' }}
            >
                <div className="relative w-full h-full">
                    <div className="absolute inset-0 w-full h-full" style={{ ...backgroundStyle, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                    {task.completed && <div className="absolute inset-0" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.04) 58%, rgba(8,12,20,0.18) 100%)' }} />}
                    <div className={`absolute inset-0 border-2 ${task.completed ?'border-white/30 shadow-[0_0_14px_rgba(255,255,255,0.08)]' : 'border-dashed border-gray-600'}`} style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                    {task.completed && <div className="absolute right-2 top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-black/28 text-white shadow-[0_0_8px_rgba(255,255,255,0.12)]"><SquareCheckIcon className="h-3 w-3 text-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,0.55)]" /></div>}
                    <div className={`relative z-10 w-full h-full flex flex-col items-center justify-center text-center p-1 ${task.completed ?'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.08)]' : ''}`}>
                        <EmojiGlyph symbol={action?.icon || "🏁"} size="milestone" className="text-white" />
                        <div className="text-xs font-semibold truncate max-w-full px-1">{action?.name}</div>
                    </div>
                    {isHolding && (<div className="absolute inset-0 bg-black/50 animate-pulse" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}><div className={`h-full w-full ${task.completed ?'bg-red-800/50 animate-[unfill_3s_linear_forwards]' : 'bg-gray-500/50 animate-[fill_3s_linear_forwards]'}`}></div></div>)}
                    {showSparkles && <Sparkles />}
                </div>
                <style>{`@keyframes fill { from { clip-path: inset(100% 0 0 0); } to { clip-path: inset(0% 0 0 0); } } @keyframes unfill { from { clip-path: inset(0% 0 0 0); } to { clip-path: inset(100% 0 0 0); } }`}</style>
            </div>
        );
    }

    const height = task.duration * scaleFactor;

    return (
        <div
            ref={taskRef}
            {...longPressEvents}
            className="absolute left-0 right-1 cursor-pointer select-none overflow-hidden rounded-2xl"
            style={{ top: `${top}px`, height: `${height}px`, minHeight: `${30 * scaleFactor}px`, touchAction: 'none' }}
        >
            <div
                className={`h-full w-full rounded-2xl text-left relative overflow-hidden transition-all ${task.completed ?'font-bold' : ''}`}
                style={standardTaskContentStyle}
            >
                <div
                    className="absolute inset-[2px] rounded-[14px]"
                    style={backgroundStyle}
                />
                <div
                    className="absolute inset-[2px] rounded-[14px]"
                    style={{ background: 'linear-gradient(135deg, rgba(2,6,23,0.1), rgba(2,6,23,0.28) 74%)' }}
                />
                <div className={`absolute inset-[2px] rounded-[14px] transition-opacity duration-300 ${task.completed ?'opacity-100' : 'opacity-0'}`} style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05) 62%, rgba(0,0,0,0.16) 100%)' }}></div>
                <div className={`absolute inset-0 border-2 rounded-2xl transition-all ${task.completed ?'border-white/25 shadow-[0_0_14px_rgba(255,255,255,0.08)]' : 'border-dashed border-gray-600'}`}></div>
                <div className="relative z-10 flex h-full min-w-0 items-center space-x-2 p-2">
                    <div className="text-lg shrink-0"><EmojiGlyph symbol={action?.icon || '\u{1F4DD}'} size="action" className="text-white" /></div>
                    <div className="text-sm font-semibold truncate min-w-0 flex-1 text-white">{action?.name}</div>
                    {task.completed && <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/28 text-white shadow-[0_0_8px_rgba(255,255,255,0.12)]"><SquareCheckIcon className="h-3.5 w-3.5 text-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,0.55)]" /></div>}
                </div>
                {isHolding && (<div className="absolute inset-0 animate-pulse bg-black/50 rounded-2xl"><div className={`h-full w-full ${task.completed ?'bg-red-800/50 animate-[unfill_3s_linear_forwards]' : 'bg-gray-500/50 animate-[fill_3s_linear_forwards]'}`}></div></div>)}
                {showSparkles && <Sparkles />}
            </div>
            <style>{`@keyframes fill { from { clip-path: inset(100% 0 0 0); } to { clip-path: inset(0% 0 0 0); } } @keyframes unfill { from { clip-path: inset(0% 0 0 0); } to { clip-path: inset(100% 0 0 0); } }`}</style>
        </div>
    );
};

const CurrentTimeIndicator = React.forwardRef<HTMLDivElement, { top: number }>(({ top }, ref) => {
    return (
        <div ref={ref} className="absolute w-full left-0 right-0 z-20 pointer-events-none" style={{ top: `${top}px` }}>
            <div className="relative flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_4px_1px_rgba(255,0,0,0.7)] -ml-1"></div>
                <div className="w-full h-px bg-red-500 shadow-[0_0_4px_1px_rgba(255,0,0,0.7)]"></div>
            </div>
        </div>
    );
});
CurrentTimeIndicator.displayName = 'CurrentTimeIndicator';

const PlannerSegmentedToggle: React.FC<{
    value: string;
    options: Array<{ value: string; label: string; hint?: string; icon?: React.ReactNode }>;
    onChange: (value: string) => void;
    id?: string;
    iconOnly?: boolean;
}> = ({ value, options, onChange, id, iconOnly = false }) => (
    <div className={`planner-pill-switch flex items-center bg-white/[0.03] rounded-full p-0.5 border border-white/6 ${iconOnly ?'text-[0px]' : 'text-[10px]'}`} id={id}>
        {options.map(option => (
            <button
                key={option.value}
                type="button"
                data-active={value === option.value}
                onClick={() => onChange(option.value)}
                title={option.hint}
                aria-label={option.label}
                className={`planner-view-btn rounded-full transition-all duration-200 ${iconOnly ?'flex h-6 w-6 items-center justify-center px-0 py-0' : 'px-2.5 py-1'} ${value === option.value ?'bg-white/10 text-white shadow-[0_0_18px_rgba(255,255,255,0.06)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
                {iconOnly ?(
                    <span className="flex items-center justify-center">{option.icon}</span>
                ) : (
                    <span className="flex items-center gap-1.5">
                        {option.icon}
                        <span>{option.label}</span>
                    </span>
                )}
            </button>
        ))}
    </div>
);

const UnscheduledTaskCard: React.FC<{
    task: ScheduledTask;
    action?: Action;
    compact?: boolean;
    draggable?: boolean;
    executionCard?: boolean;
    isDragTarget?: boolean;
    onCustomDragStart: (event: MouseEvent | TouchEvent, item: any, ghost: React.ReactNode, ref: React.RefObject<HTMLDivElement>) => void;
    onTaskClick: (task: ScheduledTask) => void;
    onComplete: (actionId: string, taskId?: string) => void;
    onToggleTask?: (taskId: string) => void;
}> = ({ task, action, compact = false, draggable = true, executionCard = false, isDragTarget = false, onCustomDragStart, onTaskClick, onComplete, onToggleTask }) => {
    const { getActionBackgroundStyle, toggleTaskCompletion } = useGame();
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHolding, setIsHolding] = useState(false);
    const [showSparkles, setShowSparkles] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const backgroundStyle = action ?getActionBackgroundStyle(action.id) : { background: 'var(--asset-grad-default)' };
    const isScheduled = hasScheduledTime(task);
    const stateLabel = task.completed ?'Concluida' : isScheduled ?'Com horario' : 'Sem horario';
    const timeLabel = isScheduled
        ? `${String(Math.floor(task.startTime / 60)).padStart(2, '0')}:${String(task.startTime % 60).padStart(2, '0')}`
        : 'sem horario';

    const shouldUseActionSkin = Boolean(executionCard && action);
    const cardStyle = {
        touchAction: draggable ?'none' : 'auto',
        ...(shouldUseActionSkin ?backgroundStyle : {}),
    } as React.CSSProperties;

    useEffect(() => {
        const element = cardRef.current;
        const preventScroll = (event: TouchEvent) => {
            if (event.cancelable) event.preventDefault();
        };

        if (element && executionCard) {
            element.addEventListener('touchmove', preventScroll, { passive: false });
        }

        return () => {
            if (element && executionCard) {
                element.removeEventListener('touchmove', preventScroll);
            }
            if (completionTimeout.current) {
                clearTimeout(completionTimeout.current);
            }
        };
    }, [executionCard]);

    const completeLikePlanner = () => {
        if (onToggleTask) {
            onToggleTask(task.id);
            return;
        }
        if (action) {
            onComplete(action.id, task.id);
            return;
        }
        toggleTaskCompletion(task.id);
    };

    const handleLongPress = () => {
        if (!executionCard || isTransitioning) return;

        const now = new Date();
        const todayString = getLocalDateString(now);
        if (task.date > todayString && !task.completed) {
            completeLikePlanner();
            return;
        }

        setIsHolding(true);
        setIsTransitioning(true);
        if (completionTimeout.current) clearTimeout(completionTimeout.current);
        completionTimeout.current = setTimeout(() => {
            if (!task.completed) {
                setShowSparkles(true);
                setTimeout(() => setShowSparkles(false), 1000);
            }
            completeLikePlanner();
            setIsHolding(false);
            setIsTransitioning(false);
        }, task.completed ? 3000 : 1800);
    };

    const cancelLongPress = () => {
        if (completionTimeout.current) {
            clearTimeout(completionTimeout.current);
            completionTimeout.current = null;
        }
        setIsHolding(false);
        setIsTransitioning(false);
    };

    const handleDragStart = (event: MouseEvent | TouchEvent) => {
        if (!draggable || !action) return;
        const ghost = (
            <div
                style={shouldUseActionSkin ?backgroundStyle : undefined}
                className={`relative overflow-hidden rounded-2xl border px-3 py-2 text-left opacity-90 shadow-2xl backdrop-blur-md ${shouldUseActionSkin ?'border-white/20' : 'border-white/12 bg-black/80'}`}
            >
                {shouldUseActionSkin && <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.10),rgba(2,6,23,0.34)_76%)]" />}
                <div className="relative z-10 flex items-center gap-2">
                    <EmojiGlyph symbol={action.icon || '\u{1F4DD}'} size="action" className="text-white" />
                    <span className="max-w-[160px] truncate text-xs font-black uppercase tracking-[0.08em] text-white [text-shadow:0_1px_6px_rgba(2,6,23,0.82)]">{action.name}</span>
                </div>
            </div>
        );
        const duration = action.actionType === 'Marco' ?Math.max(15, task.duration) : task.duration;
        onCustomDragStart(event, { type: 'reschedule_task', payload: task.id, duration, source: executionCard ?'execution' : 'planner' }, ghost, cardRef);
    };

    const longPressEvents = useLongPress({
        onLongPress: executionCard ?handleLongPress : undefined,
        onLongPressCancel: executionCard ?cancelLongPress : undefined,
        onLongPressRelease: executionCard ?cancelLongPress : undefined,
        onDragStart: draggable ?handleDragStart : undefined,
        onClick: () => {
            if (isTransitioning) return;
            onTaskClick(task);
        },
        delay: executionCard ?420 : 260,
        dragThreshold: executionCard ?14 : 18,
        preventDefaultOnTouch: executionCard ?false : undefined,
        touchDragRequiresLongPress: executionCard,
    });

    return (
        <div
            ref={cardRef}
            {...longPressEvents}
            data-execution-task-id={executionCard ?task.id : undefined}
            className={`group relative select-none overflow-hidden border shadow-[0_16px_35px_rgba(0,0,0,0.24)] backdrop-blur-md transition-all duration-200 hover:border-white/18 active:scale-[0.99] ${shouldUseActionSkin ?'border-white/15 text-white' : 'bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018)_54%,rgba(0,0,0,0.28))] hover:bg-white/[0.055]'} ${isDragTarget ?'ring-1 ring-[var(--skin-accent-color)]/70 shadow-[0_0_28px_rgba(250,204,21,0.12)]' : ''} ${task.completed ?'opacity-82' : ''} ${compact ?'rounded-[18px] px-2.5 py-1.5' : 'rounded-[22px] px-4 py-3'}`}
            style={cardStyle}
        >
            {!shouldUseActionSkin && <div className="absolute inset-y-0 left-0 w-1 opacity-60" style={backgroundStyle} />}
            {shouldUseActionSkin && <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.10),rgba(2,6,23,0.30)_74%)]" />}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(255,255,255,0.13),transparent_34%)] opacity-70" />
            <div className={`absolute inset-0 border-2 transition-all ${compact ?'rounded-[18px]' : 'rounded-[22px]'} ${task.completed ?'border-white/25 shadow-[0_0_14px_rgba(255,255,255,0.08)]' : 'border-dashed border-gray-600'}`} />
            {task.completed && <div className="absolute inset-0 bg-emerald-300/[0.035]" />}
            <div className={`relative z-10 flex items-center ${compact ?'gap-2' : 'gap-3'}`}>
                <div className={`flex shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/28 ${compact ?'h-8 w-8' : 'h-11 w-11'}`}>
                    <EmojiGlyph symbol={action?.icon || '\u{1F4DD}'} size="action" className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className={`${compact ?'text-[12px]' : 'text-[13px]'} truncate font-black uppercase tracking-[0.08em] text-white [text-shadow:0_1px_6px_rgba(2,6,23,0.82)]`}>{action?.name || 'Acao sem vinculo'}</div>
                    <div className={`${compact ?'mt-0 text-[8px]' : 'mt-0.5 text-[10px]'} flex items-center gap-2 font-bold uppercase tracking-[0.14em] text-white/52`}>
                        <span className={task.completed ?'text-emerald-200/70' : ''}>{stateLabel}</span>
                        <span className="h-1 w-1 rounded-full bg-white/18" />
                        <span>{task.duration || action?.duration || 30} min</span>
                        <span className="h-1 w-1 rounded-full bg-white/18" />
                        <span>{timeLabel}</span>
                    </div>
                </div>
                {executionCard ?(
                    task.completed ?(
                        <div className="z-10 shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/28 text-white shadow-[0_0_8px_rgba(255,255,255,0.12)]">
                            <SquareCheckIcon className="h-3.5 w-3.5 text-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,0.55)]" />
                        </div>
                    ) : null
                ) : (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            completeLikePlanner();
                        }}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] transition-colors ${task.completed ?'border-white/10 bg-white/[0.035] text-white/50 hover:text-white' : 'border-emerald-300/20 bg-emerald-300/8 text-emerald-200 hover:bg-emerald-300/14'}`}
                    >
                        {task.completed ?'Reabrir' : 'Fechar'}
                    </button>
                )}
                {draggable && (
                    <div className="shrink-0 text-[13px] font-black leading-none tracking-[-0.18em] text-white/32" aria-hidden="true">::</div>
                )}
            </div>
            {executionCard && isHolding && (
                <div className={`absolute inset-0 animate-pulse bg-black/50 ${compact ?'rounded-[18px]' : 'rounded-[22px]'}`}>
                    <div className={`h-full w-full ${task.completed ?'bg-red-800/50 animate-[unfill_3s_linear_forwards]' : 'bg-gray-500/50 animate-[fill_3s_linear_forwards]'}`}></div>
                </div>
            )}
            {executionCard && showSparkles && <Sparkles />}
            {executionCard && <style>{`@keyframes fill { from { clip-path: inset(100% 0 0 0); } to { clip-path: inset(0% 0 0 0); } } @keyframes unfill { from { clip-path: inset(0% 0 0 0); } to { clip-path: inset(100% 0 0 0); } }`}</style>}
        </div>
    );
};

const PlannerSimpleList: React.FC<{
    date: string;
    tasks: ScheduledTask[];
    getActionById: (id: string) => Action | undefined;
    executionDropTarget: ExecutionDropTarget;
    onComplete: (actionId: string, taskId?: string) => void;
    onToggleTask: (taskId: string) => void;
    onCustomDragStart: (event: MouseEvent | TouchEvent, item: any, ghost: React.ReactNode, ref: React.RefObject<HTMLDivElement>) => void;
    onTaskClick: (task: ScheduledTask) => void;
    compactEmpty?: boolean;
}> = ({ date, tasks, getActionById, executionDropTarget, onComplete, onToggleTask, onCustomDragStart, onTaskClick, compactEmpty = false }) => {
    const showDropAt = (index: number) => executionDropTarget?.date === date && executionDropTarget.index === index;

    return (
        <div
            className={`${compactEmpty ? 'min-h-[88px] rounded-[20px] p-2' : 'min-h-[240px] rounded-[28px] p-3'} space-y-2 border border-dashed border-white/10 bg-black/12`}
            data-testid="planner-simple-list"
            data-execution-date={date}
        >
            {tasks.length > 0 ? (
                <>
                    {tasks.map((task, index) => (
                        <React.Fragment key={task.id}>
                            {showDropAt(index) && (
                                <div className="h-2 rounded-full bg-[var(--skin-accent-color)]/70 shadow-[0_0_18px_rgba(250,204,21,0.22)] transition-all duration-150" />
                            )}
                            <UnscheduledTaskCard
                                task={task}
                                action={getActionById(task.actionId)}
                                compact
                                draggable
                                executionCard
                                isDragTarget={showDropAt(index)}
                                onCustomDragStart={onCustomDragStart}
                                onTaskClick={onTaskClick}
                                onComplete={onComplete}
                                onToggleTask={onToggleTask}
                            />
                        </React.Fragment>
                    ))}
                    {showDropAt(tasks.length) && (
                        <div className="h-2 rounded-full bg-[var(--skin-accent-color)]/70 shadow-[0_0_18px_rgba(250,204,21,0.22)] transition-all duration-150" />
                    )}
                </>
            ) : (
                <div className={`flex flex-col items-center justify-center px-5 text-center text-white/34 ${compactEmpty ? 'min-h-[70px]' : 'min-h-[220px]'}`}>
                    {showDropAt(0) && (
                        <div className="mb-4 h-2 w-full rounded-full bg-[var(--skin-accent-color)]/70 shadow-[0_0_18px_rgba(250,204,21,0.22)]" />
                    )}
                    {!compactEmpty && <div className="text-3xl opacity-45">{'\u{1F4DD}'}</div>}
                    <div className={`${compactEmpty ? '' : 'mt-3'} text-[11px] font-black uppercase tracking-[0.16em]`}>{compactEmpty ? 'Sem acoes' : 'Lista vazia'}</div>
                    {!compactEmpty && (
                        <p className="mt-2 max-w-[14rem] text-[11px] leading-relaxed">
                            Arraste uma acao da baia para colocar na sua ordem.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

const PlannerSimpleWeek: React.FC<{
    dates: string[];
    tasksByDate: Record<string, ScheduledTask[]>;
    getActionById: (id: string) => Action | undefined;
    executionDropTarget: ExecutionDropTarget;
    onComplete: (actionId: string, taskId?: string) => void;
    onToggleTask: (taskId: string) => void;
    onCustomDragStart: (event: MouseEvent | TouchEvent, item: any, ghost: React.ReactNode, ref: React.RefObject<HTMLDivElement>) => void;
    onTaskClick: (task: ScheduledTask) => void;
}> = ({ dates, tasksByDate, getActionById, executionDropTarget, onComplete, onToggleTask, onCustomDragStart, onTaskClick }) => {
    const today = getOperationalDateString();

    return (
        <div className="space-y-3" data-testid="planner-simple-week">
            {dates.map((date) => {
                const localDate = buildLocalDateFromString(date);
                const dayLabel = localDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit' });
                const isToday = date === today;

                return (
                    <section key={date} className="space-y-1.5">
                        <div className="flex items-center justify-between px-2">
                            <h3 className={`text-[10px] font-black uppercase tracking-[0.16em] ${isToday ? 'text-[var(--skin-accent-color)]' : 'text-white/52'}`}>
                                {dayLabel}
                            </h3>
                            <span className="text-[9px] font-bold text-white/28">{tasksByDate[date]?.length || 0}</span>
                        </div>
                        <PlannerSimpleList
                            date={date}
                            tasks={tasksByDate[date] || []}
                            getActionById={getActionById}
                            executionDropTarget={executionDropTarget}
                            onComplete={onComplete}
                            onToggleTask={onToggleTask}
                            onCustomDragStart={onCustomDragStart}
                            onTaskClick={onTaskClick}
                            compactEmpty
                        />
                    </section>
                );
            })}
        </div>
    );
};

const DailyView: React.FC<{ tasks: ScheduledTask[], actions: Action[], scaleFactor: number, operationalDate: string, onCustomDragStart: (event: MouseEvent | TouchEvent, item: any, ghost: React.ReactNode, ref: React.RefObject<HTMLDivElement>) => void, dropIndicator: { top: number, height: number } | null, isToday: boolean, currentTime: Date, timeIndicatorRef: React.Ref<HTMLDivElement> }> = ({ tasks, actions, scaleFactor, operationalDate, onCustomDragStart, dropIndicator, isToday, currentTime, timeIndicatorRef }) => {
    const hours = getOperationalHourTicks();
    const getActionById = (id: string) => actions.find(a => a.id === id);
    const [modalData, setModalData] = useState<{ action: Action, taskId?: string } | null>(null);

    let timeIndicatorTop = -1;
    if (isToday) {
        const currentTotalMinutes = getOperationalDisplayMinutes(currentTime);
        timeIndicatorTop = (currentTotalMinutes - OPERATIONAL_DAY_START_MINUTE) * scaleFactor;
    }

    const handleTaskClick = (task: ScheduledTask) => {
        const action = getActionById(task.actionId);
        if (action) {
            setModalData({ action, taskId: task.id });
        }
    };

    return (
        <div className="daily-planner-surface flex-grow relative bg-[#111] border border-white/10 rounded-3xl p-2 h-full depth-grid" data-testid="daily-timeline">
            <div className="flex h-full">
                <div className="w-12 flex-shrink-0">
                    {hours.map(hour => (
                        <div key={hour} className="relative text-right pr-2" style={{ height: `${60 * scaleFactor}px` }}>
                            <span className="daily-hour-label absolute right-2 -top-[0.42rem] text-xs font-mono text-gray-500">{formatOperationalHourLabel(hour)}</span>
                        </div>
                    ))}
                </div>
                <div className="daily-grid-column flex-grow relative border-l border-white/10 h-full">
                    {hours.slice(0).map((hour, i) => (<div key={hour} className={`daily-hour-slice relative ${i > 0 ?'border-t border-white/10' : ''}`} style={{ height: `${60 * scaleFactor}px` }}><div className="daily-quarter-line absolute w-full border-t border-white/5" style={{ top: `${15 * scaleFactor}px` }}></div><div className="daily-quarter-line absolute w-full border-t border-white/5" style={{ top: `${30 * scaleFactor}px` }}></div><div className="daily-quarter-line absolute w-full border-t border-white/5" style={{ top: `${45 * scaleFactor}px` }}></div></div>))}
                    {tasks.map((task) => <TaskSlot key={task.id} task={task} action={getActionById(task.actionId)} scaleFactor={scaleFactor} operationalDate={operationalDate} onCustomDragStart={onCustomDragStart} onTaskClick={handleTaskClick} />)}
                    {dropIndicator && <DropIndicator top={dropIndicator.top} height={dropIndicator.height} className="w-full right-0" />}
                    {isToday && timeIndicatorTop >= 0 && <CurrentTimeIndicator ref={timeIndicatorRef} top={timeIndicatorTop} />}
                </div>
            </div>
            {modalData && (
                <ActionModal
                    action={modalData.action}
                    taskId={modalData.taskId}
                    arenaId={modalData.action.arenaId}
                    initialMode="view"
                    onClose={() => setModalData(null)}
                />
            )}
        </div>
    );
};

const PlannerFloatingVitals: React.FC<{ expSnapshot: PlannerExpSnapshot; cycleExpBanked: number }> = ({ expSnapshot, cycleExpBanked }) => {
    const { userProfile } = useGame();
    const [isStreakPulsing, setIsStreakPulsing] = useState(false);

    useEffect(() => {
        const handleSensoryCue = (event: Event) => {
            const detail = (event as CustomEvent<AppSensoryCuePayload>).detail;
            if (detail?.cue !== 'daily_streak') return;
            setIsStreakPulsing(true);
            window.setTimeout(() => setIsStreakPulsing(false), 900);
        };

        window.addEventListener(APP_SENSORY_CUE_EVENT, handleSensoryCue as EventListener);
        return () => window.removeEventListener(APP_SENSORY_CUE_EVENT, handleSensoryCue as EventListener);
    }, []);

    return (
        <div className="planner-floating-vitals pointer-events-none absolute bottom-[calc(0.15rem+var(--safe-area-bottom))] left-1/2 z-40 w-[min(9.35rem,calc(100%-10rem))] -translate-x-1/2">
            <div className="planner-floating-vitals__shell">
                <div className="grid grid-cols-2 items-center gap-2">
                    <AnimatedExpCounter snapshot={expSnapshot} />
                    <div className={`planner-vital-orb min-w-0 transition-transform duration-300 ${isStreakPulsing ? 'scale-[1.06]' : ''}`} aria-live="polite">
                        <div className="planner-vital-orb__glow" />
                        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-0.5">
                            <div className="flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.12em] text-white/36">
                                <FlameIcon className={`h-2 w-2 shrink-0 ${isStreakPulsing ? 'text-[var(--skin-accent-color)] drop-shadow-[0_0_8px_var(--skin-accent-color)]' : 'text-white/30'}`} />
                                <span>Seq.</span>
                            </div>
                            <div className={`tabular-nums text-[16px] font-black leading-none text-[var(--skin-accent-color)] transition-all duration-300 ${isStreakPulsing ? 'drop-shadow-[0_0_10px_var(--skin-accent-color)]' : ''}`}>
                                {userProfile.dailyProofStreak?.current || 0}
                            </div>
                        </div>
                    </div>
                </div>
                {cycleExpBanked > 0 && (
                    // Banked, not credited: this EXP only reaches the profile when the
                    // cycle closes. Reading as "Ciclo +150" made it look already earned,
                    // so a permanent badge plus an unchanged profile read as lost EXP.
                    <div
                        className="mt-1 truncate text-center text-[7px] font-black uppercase tracking-[0.12em] text-white/38"
                        title={`${cycleExpBanked} EXP guardada para quando o ciclo fechar`}
                    >
                        +{cycleExpBanked} ao fechar
                    </div>
                )}
                </div>
        </div>
    );
};

export const PlannerView: React.FC<{ onReportsClick: () => void }> = ({ onReportsClick }) => {
    const {
        actions,
        taskPool,
        scheduleTask,
        scheduleMultipleTasks,
        getTasksForDate,
        tasks,
        checklistItems,
        sequenceItems,
        dailyCommitment,
        reports,
        aldeiaSlots,
        rescheduleTask,
        returnTaskToPool,
        deleteTask,
        toggleTaskCompletion,
        setTaskExecutionOrder,
        scheduleAndCompleteNow,
        scheduleAndCompleteMilestoneNow,
        addAction,
        updateAction,
        assets,
        addArena,
        activeCycle,
        cycleExpBonus,
        userProfile,
        getActionBackgroundStyle,
        showToast,
    } = useGame();
    const { isTutorialActive, currentStep, nextStep } = useTutorial();
    const getActionById = useCallback((id: string) => actions.find(a => a.id === id), [actions]);
    const allArenas = useMemo(() => assets.flatMap(asset => asset.arenas || []), [assets]);
    const isClanQuestActionId = useCallback((actionId: string) => isClanQuestAction(actionId, actions, allArenas), [actions, allArenas]);
    const isTaskInClosedCycleScope = useCallback((task: ScheduledTask | undefined | null) => {
        if (!task) return false;
        const operationalDate = getTaskOperationalDateString(task);
        if (!operationalDate) return false;

        return (reports as Report[]).some((report) => {
            if (operationalDate < report.startDate || operationalDate > report.endDate) return false;
            const weeklyAtlas = report.metrics?.weeklyAtlas || [];
            const closedTaskIds = weeklyAtlas.flatMap((week) =>
                (week.days || []).flatMap((day) =>
                    [...(day.scheduledItems || []), ...(day.unscheduledItems || [])]
                        .map((item) => item.taskId)
                        .filter(Boolean)
                )
            );
            return closedTaskIds.length > 0 ? closedTaskIds.includes(task.id) : Boolean(task.completed);
        });
    }, [reports]);
    const [currentDate, setCurrentDate] = useState(() => buildLocalDateFromString(getOperationalDateString()));
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const isSimpleList = userProfile.plannerViewMode === 'list';
    const plannerArenaOptions = useMemo(() => assets.flatMap(asset => asset.arenas || []), [assets]);
    const defaultPlannerArenaId = plannerArenaOptions.find(arena => arena.id !== 'arena_outros')?.id || plannerArenaOptions[0]?.id || '';
    const [isAdvancedPlannerMatrixEnabled, setIsAdvancedPlannerMatrixEnabled] = useState(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get('planner_advanced') === '1') {
                localStorage.setItem('planner_advanced_matrix', '1');
                return true;
            }
            return localStorage.getItem('planner_advanced_matrix') === '1';
        } catch {
            return false;
        }
    });
    const normalizedPlannerRole = String(userProfile?.role || '').toLowerCase();
    const canUseAdvancedPlannerMatrix = Boolean(
        hasPremiumAccess(userProfile as any) ||
        normalizedPlannerRole.includes('gm') ||
        normalizedPlannerRole.includes('admin') ||
        normalizedPlannerRole.includes('sovereign')
    );
    const [isChecklistVisible, setChecklistVisible] = useState(false);
    const [isSitrepVisible, setIsSitrepVisible] = useState(false);
    const [sitrepDate, setSitrepDate] = useState<string | null>(null);

    const clearRestScreenSessionForTask = useCallback((taskId: string, actionId?: string) => {
        if (!userProfile?.id) return;

        const activeSession = loadPersistedRestScreenActionSession(userProfile.id);
        if (!activeSession) return;

        const matchesTask = activeSession.taskId === taskId;
        const matchesAction = Boolean(actionId) && activeSession.actionId === actionId;
        if (!matchesTask && !matchesAction) return;

        window.dispatchEvent(new CustomEvent(REST_SCREEN_ACTION_SESSION_CLEAR_EVENT));
    }, [userProfile?.id]);

    useEffect(() => {
        const handleOpenSitrep = (event: Event) => {
            const detail = (event as CustomEvent<{ date?: string | null }>).detail;
            setSitrepDate(detail?.date || null);
            setIsSitrepVisible(true);
        };
        window.addEventListener('openSitrep', handleOpenSitrep);
        return () => window.removeEventListener('openSitrep', handleOpenSitrep);
    }, []);

    useEffect(() => {
        const handleOpenActionModal = (event: Event) => {
            const customEvent = event as CustomEvent<RestScreenActionViewRequestDetail>;
            if (customEvent.detail?.createNew) {
                setModalData(null);
                setIsActionModalOpen(true);
                return;
            }
            const actionId = customEvent.detail?.actionId;
            if (!actionId) return;

            const nextAction = actions.find(action => action.id === actionId);
            if (!nextAction) return;

            setModalData({ action: nextAction, taskId: customEvent.detail?.taskId });
        };

        window.addEventListener(PLANNER_OPEN_ACTION_MODAL_EVENT, handleOpenActionModal as EventListener);
        return () => window.removeEventListener(PLANNER_OPEN_ACTION_MODAL_EVENT, handleOpenActionModal as EventListener);
    }, [actions]);

    useEffect(() => {
        const handlePlannerFocusDate = (event: Event) => {
            const customEvent = event as CustomEvent<{ dateString?: string; viewMode?: 'day' | 'week' }>;
            const dateString = customEvent.detail?.dateString;
            if (!dateString) return;
            setCurrentDate(buildLocalDateFromString(dateString));
            if (customEvent.detail?.viewMode) {
                setViewMode(customEvent.detail.viewMode);
            }
        };

        window.addEventListener('planner:focus-date', handlePlannerFocusDate as EventListener);
        return () => window.removeEventListener('planner:focus-date', handlePlannerFocusDate as EventListener);
    }, []);

    const [showOracleInput, setShowOracleInput] = useState(false);
    const [oracleInput, setOracleInput] = useState('');
    const oracleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (showOracleInput && oracleInputRef.current) {
            oracleInputRef.current.focus();
        }
    }, [showOracleInput]);

    const toDateString = (value: Date) => formatLocalDateString(value);
    const today = buildLocalDateFromString(getOperationalDateString());
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ?-6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const weekStart = toDateString(startOfWeek);
    const weekEnd = toDateString(endOfWeek);
    const completedTasksInWeek = tasks.filter(task => task.completed && task.date >= weekStart && task.date <= weekEnd);

    const normalizeText = (value: string) => value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const levenshteinDistance = (a: string, b: string) => {
        if (a === b) return 0;
        if (!a.length) return b.length;
        if (!b.length) return a.length;

        const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
        const curr = new Array(b.length + 1).fill(0);

        for (let i = 1; i <= a.length; i++) {
            curr[0] = i;
            const ai = a.charCodeAt(i - 1);
            for (let j = 1; j <= b.length; j++) {
                const cost = ai === b.charCodeAt(j - 1) ?0 : 1;
                curr[j] = Math.min(
                    curr[j - 1] + 1,
                    prev[j] + 1,
                    prev[j - 1] + cost
                );
            }
            for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
        }

        return prev[b.length];
    };

    const parseDurationMinutes = (raw: string): number | null => {
        const s = normalizeText(raw);
        const cleaned = s.replace(/\b\d{1,2}\s*(hora|horas)\s*(da|de)\s*(manha|tarde|noite)\b/i, ' ');

        const hm = cleaned.match(/\b(\d{1,2})\s*h\s*(\d{1,2})\b/);
        if (hm) {
            const h = Number(hm[1]);
            const m = Number(hm[2]);
            if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m;
        }

        const hOnly = cleaned.match(/\b(\d{1,2})\s*(h|hora|horas)\b/);
        if (hOnly) {
            const h = Number(hOnly[1]);
            if (Number.isFinite(h)) return h * 60;
        }

        const minOnly = cleaned.match(/\b(\d{1,3})\s*(m|min|mins|minuto|minutos)\b/);
        if (minOnly) {
            const m = Number(minOnly[1]);
            if (Number.isFinite(m)) return m;
        }

        return null;
    };

    const parseRepetitions = (raw: string): number | null => {
        const s = normalizeText(raw);
        const m = s.match(/\b(\d{1,2})\s*(x|vez|vezes)\b/);
        if (!m) return null;
        const n = Number(m[1]);
        return Number.isFinite(n) ?n : null;
    };

    const parseTimeMinutes = (raw: string): number | null => {
        const s = normalizeText(raw);

        const periodHour = s.match(/\b(\d{1,2})\s*(?:hora|horas)?\s*(?:da|de)\s*(manha|tarde|noite)\b/);
        if (periodHour) {
            const hhRaw = Number(periodHour[1]);
            if (!Number.isFinite(hhRaw) || hhRaw < 0 || hhRaw > 23) return null;
            const period = periodHour[2];
            let hh = hhRaw;
            if (period === 'tarde' || period === 'noite') {
                if (hh >= 1 && hh <= 11) hh += 12;
                if (hh === 24) hh = 0;
            }
            if (period === 'manha' && hh === 12) hh = 0;
            return hh * 60;
        }

        const periodOnly = s.match(/\b(?:de|da)\s*(manha|tarde|noite)\b/);
        if (periodOnly) {
            const period = periodOnly[1];
            if (period === 'manha') return 9 * 60;
            if (period === 'tarde') return 15 * 60;
            return 21 * 60;
        }

        const prefixed = s.match(/\b(?:as)\s*(\d{1,2})(?::(\d{2}))?\b/);
        const clock = s.match(/\b(\d{1,2})[:h](\d{2})\b/);
        const hourOnly = s.match(/\b(\d{1,2})h\b/);

        const m = prefixed || clock || hourOnly;
        if (!m) return null;
        const hh = Number(m[1]);
        const mm = m[2] ?Number(m[2]) : 0;
        if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
        if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
        return hh * 60 + mm;
    };

    const parseDaysOfWeek = (raw: string): DayOfWeek[] => {
        const s = normalizeText(raw);
        const tokens = s
            .replace(/[,/]/g, ' ')
            .replace(/\be\b/g, ' ')
            .split(/\s+/)
            .filter(Boolean);

        const map: Array<[RegExp, DayOfWeek]> = [
            [/^(seg|segunda)$/i, 'SEG'],
            [/^(ter|terca|terça)$/i, 'TER'],
            [/^(qua|quarta)$/i, 'QUA'],
            [/^(qui|quinta)$/i, 'QUI'],
            [/^(sex|sexta)$/i, 'SEX'],
            [/^(sab|sabado|sábado)$/i, 'SAB'],
            [/^(dom|domingo)$/i, 'DOM'],
        ];

        const out: DayOfWeek[] = [];
        for (const token of tokens) {
            for (const [rx, day] of map) {
                if (rx.test(token) && !out.includes(day)) {
                    out.push(day);
                    break;
                }
            }
        }
        return out;
    };

    const splitOracleInput = (raw: string) => {
        const input = raw.trim();
        const quoteMatch = input.match(/"([^"]+)"/);
        const description = quoteMatch?.[1]?.trim() || '';
        const withoutQuote = quoteMatch ?input.replace(quoteMatch[0], '').trim() : input;

        const findAtIndex = (value: string) => {
            for (let i = value.length - 1; i >= 0; i -= 1) {
                if (value[i] !== '@') continue;
                if (i === 0) return i;
                if (/\s/.test(value[i - 1])) return i;
            }
            return -1;
        };

        const atIndex = findAtIndex(withoutQuote);
        if (atIndex < 0) return { base: withoutQuote, arenaName: '', description };

        const before = withoutQuote.slice(0, atIndex).trim();
        const after = withoutQuote.slice(atIndex + 1).trim();
        if (!after) return { base: before, arenaName: '', description };

        const numeric = after.match(/^\s*(\d{1,3})\b/);
        if (numeric) {
            const arenaName = numeric[1];
            const remainder = after.slice(numeric[0].length).trim();
            const base = `${before} ${remainder}`.trim();
            return { base, arenaName, description };
        }

        const quotedArena = after.match(/^\s*"([^"]+)"\s*/);
        if (quotedArena) {
            const arenaName = quotedArena[1].trim();
            const remainder = after.slice(quotedArena[0].length).trim();
            const base = `${before} ${remainder}`.trim();
            return { base, arenaName, description };
        }

        const normalizedAfter = after;
        const cutPoints = [
            normalizedAfter.search(/\b\d+\s*(x|vez|vezes)\b/i),
            normalizedAfter.search(/\b(\d{1,2}\s*h\s*\d{1,2}|\d{1,2}\s*(h|hora|horas)|\d+\s*(m|min|mins|minuto|minutos))\b/i),
            normalizedAfter.search(/\b(\d{1,2}\s*(?:hora|horas)?\s*(?:da|de)\s*(manha|tarde|noite)|(?:de|da)\s*(manha|tarde|noite)|as\s*\d{1,2}(?::\d{2})?|\d{1,2}[:h]\d{2}|\d{1,2}h)\b/i),
            normalizedAfter.search(/\b(seg|segunda|ter|terca|terça|qua|quarta|qui|quinta|sex|sexta|sab|sabado|sábado|dom|domingo)\b/i),
            normalizedAfter.search(/\s[-–]\s/),
            normalizedAfter.search(/[|,;]/),
        ].filter(i => i >= 0);

        const cut = cutPoints.length > 0 ?Math.min(...cutPoints) : normalizedAfter.length;
        const arenaName = normalizedAfter.slice(0, cut).trim();
        const remainder = normalizedAfter.slice(cut).trim();
        const base = `${before} ${remainder}`.trim();

        return { base, arenaName, description };
    };

    const handleOracleSubmit = async () => {
        if (!oracleInput.trim()) return;

        try {
            const { base, arenaName, description } = splitOracleInput(oracleInput);
            const duration = parseDurationMinutes(base) ?? 30;
            const repetitions = parseRepetitions(base) ?? 1;
            const startTimeInMinutes = parseTimeMinutes(base);
            const selectedDays = parseDaysOfWeek(base);

            const normalizedBase = base;
            const cutPoints = [
                normalizedBase.search(/\b\d+\s*(x|vez|vezes)\b/i),
                normalizedBase.search(/\b(\d{1,2}\s*h\s*\d{1,2}|\d{1,2}\s*(h|hora|horas)|\d+\s*(m|min|mins|minuto|minutos))\b/i),
                normalizedBase.search(/\b(?:as\s*\d{1,2}(?::\d{2})?|\d{1,2}[:h]\d{2}|\d{1,2}h)\b/i),
                normalizedBase.search(/\b(seg|segunda|ter|terca|terça|qua|quarta|qui|quinta|sex|sexta|sab|sabado|sábado|dom|domingo)\b/i),
            ].filter(i => i >= 0);
            const nameEnd = cutPoints.length > 0 ?Math.min(...cutPoints) : normalizedBase.length;
            const parsedName = normalizedBase.slice(0, nameEnd).trim();
            const actionName = parsedName;
            const actionDescription = description;

            // 2. Find Target Arena
            let targetArenaId = '';

            const allArenas: Array<{ arena: Arena; assetId: string; normalizedName: string }> = assets.flatMap(asset =>
                asset.arenas.map(arena => ({ arena, assetId: asset.id, normalizedName: normalizeText(arena.name) }))
            );

            const findArena = (name: string): { arena: Arena, assetId: string } | null => {
                const normalizedQuery = normalizeText(name);
                const exact = allArenas.find(a => a.normalizedName === normalizedQuery);
                if (exact) return { arena: exact.arena, assetId: exact.assetId };

                let best: { arena: Arena; assetId: string; score: number; dist: number } | null = null;
                for (const candidate of allArenas) {
                    const candName = candidate.normalizedName;
                    const dist = levenshteinDistance(normalizedQuery, candName);
                    const maxLen = Math.max(normalizedQuery.length, candName.length) || 1;
                    const score = 1 - dist / maxLen;
                    const prefixBonus = candName.startsWith(normalizedQuery) || normalizedQuery.startsWith(candName) ?0.08 : 0;
                    const finalScore = Math.min(1, score + prefixBonus);
                    if (!best || finalScore > best.score) {
                        best = { arena: candidate.arena, assetId: candidate.assetId, score: finalScore, dist };
                    }
                }

                if (best && (best.dist <= 2 || best.score >= 0.82)) {
                    return { arena: best.arena, assetId: best.assetId };
                }

                return null;
            };

            const geralAsset = assets.find(a => a.id === 'geral') || assets[0];

            if (arenaName) {
                const found = findArena(arenaName);
                if (found) {
                    targetArenaId = found.arena.id;
                } else if (geralAsset) {
                    const newArena = await addArena(geralAsset.id, {
                        name: arenaName,
                        icon: '🏟️',
                        description: 'Arena criada pelo Oraculo'
                    });
                    targetArenaId = newArena.id;
                }
            }

            if (!targetArenaId) {
                const outros = findArena('Outros');
                if (outros) {
                    targetArenaId = outros.arena.id;
                } else if (geralAsset) {
                    const newArena = await addArena(geralAsset.id, {
                        name: 'Outros',
                        icon: '📦',
                        description: 'Arena criada pelo Oraculo'
                    });
                    targetArenaId = newArena.id;
                }
            }

            // 4. Create Action
            if (!targetArenaId || !actionName) return;

            const actionType: ActionType = startTimeInMinutes !== null && selectedDays.length === 0 ?'Compromisso' : 'Ação Recorrente';

            const created = await addAction({
                name: actionName,
                description: actionDescription || undefined,
                arenaId: targetArenaId,
                icon: '📝',
                duration,
                difficulty: 1,
                actionType,
                repetitions: actionType === 'Ação Recorrente' ?Math.max(1, repetitions) : 1,
            });

            if (actionType === 'Compromisso' && startTimeInMinutes !== null) {
                const operationalDateString = formatLocalDateString(currentDate);
                const displayMinutes = startTimeInMinutes < OPERATIONAL_DAY_START_MINUTE
                    ? startTimeInMinutes + (24 * 60)
                    : startTimeInMinutes;
                const dateString = getActualDateStringForOperationalMinutes(operationalDateString, displayMinutes);
                const actualStartTime = getActualStartTimeForOperationalMinutes(displayMinutes);
                await scheduleTask(created, dateString, actualStartTime);
            }

            if (actionType === 'Ação Recorrente' && selectedDays.length > 0 && startTimeInMinutes !== null) {
                await scheduleMultipleTasks(created, selectedDays, startTimeInMinutes);
            }

            setOracleInput('');
            setShowOracleInput(false);
        } catch (error) {
            console.error("Error in Oracle Submit:", error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleOracleSubmit();
        }
    };
    const [isMilestonePoolOpen, setIsMilestonePoolOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [dailyDropIndicator, setDailyDropIndicator] = useState<{ top: number, height: number } | null>(null);
    const [weeklyDropIndicator, setWeeklyDropIndicator] = useState<{ dayIndex: number; top: number; height: number; } | null>(null);
    const [isOverBayArea, setIsOverBayArea] = useState(false);
    const [hoveredBayQuadrant, setHoveredBayQuadrant] = useState<PlannerMatrixQuadrant | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const dailyTimeIndicatorRef = useRef<HTMLDivElement>(null);
    const weeklyTimeIndicatorRef = useRef<HTMLDivElement>(null);
    const [zoomLevel, setZoomLevel] = useState<3 | 2 | 1>(() => {
        if (typeof window === 'undefined') return 2;
        try {
            const saved = localStorage.getItem('planner_zoom_v3');
            return saved ?(Number(saved) as 3 | 2 | 1) : 2;
        } catch {
            return 2;
        }
    });

    useEffect(() => {
        localStorage.setItem('planner_zoom_v3', String(zoomLevel));
    }, [zoomLevel]);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [modalData, setModalData] = useState<{ action: Action, taskId?: string } | null>(null);

    const handleTaskClick = (task: ScheduledTask) => {
        const action = getActionById(task.actionId);
        if (action) {
            setModalData({ action, taskId: task.id });
        }
    };
    const selectedOperationalDateString = formatLocalDateString(currentDate);
    const simpleWeekDates = useMemo(() => getPlannerWeekDates(currentDate), [currentDate]);
    const simpleWeekDateSet = useMemo(() => new Set(simpleWeekDates), [simpleWeekDates]);
    const plannerHeaderLabel = useMemo(() => {
        if (viewMode !== 'week') return undefined;
        const firstDay = buildLocalDateFromString(simpleWeekDates[0]).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const lastDay = buildLocalDateFromString(simpleWeekDates[6]).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        return `${firstDay} - ${lastDay}`;
    }, [simpleWeekDates, viewMode]);
    const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);
    const lastScrollTopRef = useRef<number>(0);
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const dropAnchorOffsetRef = useRef(20);
    const bayAreaElRef = useRef<HTMLElement | null>(null);
    const dailyGridElRef = useRef<HTMLElement | null>(null);
    const weeklyGridElRef = useRef<HTMLElement | null>(null);
    const weeklyDaysContainerRef = useRef<HTMLElement | null>(null);
    const pointerDisabledElsRef = useRef<HTMLElement[]>([]);
    const [executionDropTarget, setExecutionDropTarget] = useState<ExecutionDropTarget>(null);

    // Custom Drag State
    const [dragState, setDragState] = useState({
        isDragging: false,
        item: null as { type: string, payload: any, duration: number; source?: string } | null,
        ghostElement: null as React.ReactNode | null,
        pointerOffset: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
    });

    const zoomFactors: Record<number, number> = { 3: 1, 2: 0.75, 1: 0.5 };
    const scaleFactor = zoomFactors[zoomLevel];

    const refreshDragTargets = useCallback(() => {
        bayAreaElRef.current = document.querySelector('[data-testid="bay-area"]') as HTMLElement | null;
        dailyGridElRef.current = scrollContainerRef.current?.querySelector('[data-testid="daily-timeline"] .flex-grow.relative.border-l') as HTMLElement | null;
        weeklyGridElRef.current = scrollContainerRef.current?.querySelector('[data-testid="weekly-grid"]') as HTMLElement | null;
        weeklyDaysContainerRef.current = weeklyGridElRef.current?.querySelector('.flex-grow.grid.grid-cols-7') as HTMLElement | null;
    }, []);

    const resolveBayQuadrantFromPosition = useCallback((pos: { x: number; y: number }, rect?: DOMRect | null): PlannerMatrixQuadrant | null => {
        if (!canUseAdvancedPlannerMatrix || !isAdvancedPlannerMatrixEnabled || !rect) return null;
        if (pos.x < rect.left || pos.x > rect.right || pos.y < rect.top || pos.y > rect.bottom) return null;

        const relativeX = pos.x - rect.left;
        const relativeY = pos.y - rect.top;
        const isLeft = relativeX < rect.width / 2;
        const isTop = relativeY < rect.height / 2;

        if (isTop && isLeft) return 'ui';
        if (isTop && !isLeft) return 'nui';
        if (!isTop && isLeft) return 'uni';
        return 'nuni';
    }, [canUseAdvancedPlannerMatrix, isAdvancedPlannerMatrixEnabled]);

    const handleCustomDragStart = (event: MouseEvent | TouchEvent, item: { type: string; payload: any; duration: number; source?: string; }, ghostElement: React.ReactNode, draggedElementRef: React.RefObject<HTMLDivElement>) => {
        const isTouchEvent = 'touches' in event;
        const pos = isTouchEvent ?{ x: event.touches[0].clientX, y: event.touches[0].clientY } : { x: event.clientX, y: event.clientY };
        const elemRect = draggedElementRef.current?.getBoundingClientRect();
        const offset = elemRect ?{ x: pos.x - elemRect.left, y: pos.y - elemRect.top } : { x: 0, y: 0 };
        const elementHeight = elemRect?.height || Math.max(40, item.duration * scaleFactor);
        dropAnchorOffsetRef.current = Math.min(Math.max(offset.y, 16), Math.min(32, elementHeight * 0.45));
        setIsMilestonePoolOpen(false);
        refreshDragTargets();
        if (scrollContainerRef.current) {
            lastScrollTopRef.current = scrollContainerRef.current.scrollTop;
        }
        lastPointerPosRef.current = pos;
        dragOffsetRef.current = offset;
        setDragState({ isDragging: true, item, ghostElement, pointerOffset: offset, currentPosition: pos });
    };

    const buildClampedDropIndicator = useCallback((dropY: number, durationMinutes: number) => {
        const totalMinutesInView = OPERATIONAL_DAY_TOTAL_MINUTES;
        const maxTopMinutes = Math.max(0, totalMinutesInView - durationMinutes);
        const rawMinutes = Math.max(0, dropY / scaleFactor);
        const snappedMinutes = Math.round(rawMinutes / 15) * 15;
        const clampedMinutes = Math.min(Math.max(0, snappedMinutes), maxTopMinutes);
        return {
            top: clampedMinutes * scaleFactor,
            height: durationMinutes * scaleFactor,
        };
    }, [scaleFactor]);

    const resolveOperationalDropSlot = useCallback((operationalDateString: string, indicatorTop: number) => {
        const minutesFromViewStart = indicatorTop / scaleFactor;
        const displayMinutes = minutesFromViewStart + OPERATIONAL_DAY_START_MINUTE;
        return {
            dateString: getActualDateStringForOperationalMinutes(operationalDateString, displayMinutes),
            startTimeInMinutes: getActualStartTimeForOperationalMinutes(displayMinutes),
        };
    }, [scaleFactor]);

    const resolveExecutionDropTarget = useCallback((pos: { x: number; y: number }): ExecutionDropTarget => {
        const stacks = Array.from(scrollContainerRef.current?.querySelectorAll('[data-testid="planner-simple-list"]') || []) as HTMLElement[];
        for (const stack of stacks) {
            const rect = stack.getBoundingClientRect();
            if (pos.x < rect.left || pos.x > rect.right || pos.y < rect.top - 90 || pos.y > rect.bottom + 90) continue;

            const date = stack.getAttribute('data-execution-date') || selectedOperationalDateString;
            const cards = Array.from(stack.querySelectorAll('[data-execution-task-id]')) as HTMLElement[];
            if (cards.length === 0) return { date, index: 0 };

            for (let index = 0; index < cards.length; index += 1) {
                const cardRect = cards[index].getBoundingClientRect();
                if (pos.y < cardRect.top + cardRect.height / 2) {
                    return { date, index };
                }
            }

            return { date, index: cards.length };
        }
        return null;
    }, [selectedOperationalDateString]);

    const placeExecutionTask = useCallback((taskId: string, targetDate: string, targetIndex: number, insertedTask?: ScheduledTask) => {
        const sourceTasks = insertedTask && !tasks.some(task => task.id === insertedTask.id)
            ? [...tasks, insertedTask]
            : tasks;
        const orderedIds = sourceTasks
            .filter(task => {
                if (task.id === taskId) return true;
                if (!taskMatchesOperationalDate(task, targetDate)) return false;
                return task.completed || hasScheduledTime(task) || task.executionOrder != null;
            })
            .sort((left, right) => {
                const leftOrder = left.executionOrder;
                const rightOrder = right.executionOrder;
                if (leftOrder != null || rightOrder != null) {
                    if (leftOrder == null) return 1;
                    if (rightOrder == null) return -1;
                    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
                }
                return compareExecutionTasks(left, right);
            })
            .map(task => task.id)
            .filter(id => id !== taskId);

        orderedIds.splice(Math.max(0, Math.min(targetIndex, orderedIds.length)), 0, taskId);
        orderedIds.forEach((id, index) => setTaskExecutionOrder(id, (index + 1) * 100));
    }, [setTaskExecutionOrder, tasks]);

    const removeExecutionTask = useCallback((taskId: string) => {
        setTaskExecutionOrder(taskId, null);
    }, [setTaskExecutionOrder]);

    useEffect(() => {
        if (!dragState.isDragging) return;
        refreshDragTargets();
    }, [dragState.isDragging, viewMode, refreshDragTargets]);

    useEffect(() => {
        if (!dragState.isDragging) return;
        const elements = Array.from(document.querySelectorAll('.grid-day-container')) as HTMLElement[];
        pointerDisabledElsRef.current = elements;
        elements.forEach(el => { el.style.pointerEvents = 'none'; });
        return () => {
            pointerDisabledElsRef.current.forEach(el => { el.style.pointerEvents = ''; });
            pointerDisabledElsRef.current = [];
        };
    }, [dragState.isDragging]);

    // Dedicated Auto-Scroll Effect
    useEffect(() => {
        let rafId: number | null = null;
        let wheelHandler: ((ev: WheelEvent) => void) | null = null;

        if (dragState.isDragging) {
            const scroller = scrollContainerRef.current;
            wheelHandler = (ev: WheelEvent) => { ev.preventDefault(); };
            scroller?.addEventListener('wheel', wheelHandler, { passive: false });

            const maxSpeed = 18;
            const step = () => {
                if (scrollContainerRef.current && lastPointerPosRef.current) {
                    const p = lastPointerPosRef.current;
                    const rect = scrollContainerRef.current.getBoundingClientRect();
                    let dy = 0;

                    // Zonas de Trigger
                    const containerTop = rect.top;
                    const containerBottom = rect.bottom;
                    const draggedElementTop = p.y - dragOffsetRef.current.y;

                    // Logica dupla para subir:
                    // 1. Se o topo do elemento tocar o topo do container (precisao)
                    // 2. OU se o ponteiro estiver nos primeiros 200px da tela (fallback de seguranca)
                    const isTopZone = draggedElementTop < (containerTop + 80) || p.y < 200;

                    // Logica para descer:
                    // 1. Ponteiro nos ultimos 150px do container ou da tela
                    const isBottomZone = p.y > (containerBottom - 100) || p.y > (window.innerHeight - 150);

                    if (isTopZone) {
                        // Calcula intensidade baseada no quanto "pra cima" esta
                        const distElement = (containerTop + 80) - draggedElementTop;
                        const distPointer = 200 - p.y;
                        const dist = Math.max(distElement, distPointer);

                        const intensity = Math.min(2.0, dist / 120);
                        dy = -Math.max(5, intensity * maxSpeed);
                    }
                    else if (isBottomZone) {
                        const distPointer = p.y - (containerBottom - 100);
                        const distScreen = p.y - (window.innerHeight - 150);
                        const dist = Math.max(distPointer, distScreen);

                        const intensity = Math.min(2.0, dist / 120);
                        dy = Math.max(5, intensity * maxSpeed);
                    }

                    if (dy !== 0) {
                        scrollContainerRef.current.style.scrollBehavior = 'auto';
                        scrollContainerRef.current.scrollTop += dy;
                        lastScrollTopRef.current = scrollContainerRef.current.scrollTop;
                    }
                }
                rafId = requestAnimationFrame(step);
            };
            rafId = requestAnimationFrame(step);
        }

        return () => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            if (wheelHandler) {
                const scroller = scrollContainerRef.current;
                scroller?.removeEventListener('wheel', wheelHandler as any);
            }
        };
    }, [dragState.isDragging]);

    useEffect(() => {
        const handleDragMove = (e: MouseEvent | TouchEvent) => {
            if ('touches' in e) {
                if (e.cancelable) {
                    e.preventDefault();
                }
            }
            e.stopPropagation();
            const isTouchEvent = 'touches' in e;
            const pos = isTouchEvent ?{ x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
            setDragState(prev => ({ ...prev, currentPosition: pos }));
            lastPointerPosRef.current = pos;

            if (!bayAreaElRef.current || !dailyGridElRef.current || !weeklyGridElRef.current) {
                refreshDragTargets();
            }
            const bayAreaRect = bayAreaElRef.current?.getBoundingClientRect();
            const isOverBayAreaCheck = (rect: DOMRect | undefined) => rect ?(pos.y > rect.top && pos.y < rect.bottom && pos.x > rect.left && pos.x < rect.right) : false;

            // Snap-back removed because overflow: hidden already prevents scroll. 
            // We rely on auto-scroll loop to update scrollTop programmatically.

            if (isSimpleList && (dragState.item?.type === 'reschedule_task' || dragState.item?.type === 'new_action')) {
                setDailyDropIndicator(null);
                setWeeklyDropIndicator(null);
                if (isOverBayAreaCheck(bayAreaRect)) {
                    setIsOverBayArea(true);
                    setHoveredBayQuadrant(resolveBayQuadrantFromPosition(pos, bayAreaRect));
                    setExecutionDropTarget(null);
                } else {
                    setIsOverBayArea(false);
                    setHoveredBayQuadrant(null);
                    setExecutionDropTarget(resolveExecutionDropTarget(pos));
                }
                return;
            }

            if (dragState.item?.type === 'reschedule_task' && isOverBayAreaCheck(bayAreaRect)) {
                setIsOverBayArea(true);
                setHoveredBayQuadrant(resolveBayQuadrantFromPosition(pos, bayAreaRect));
                setDailyDropIndicator(null);
                setWeeklyDropIndicator(null);
                setExecutionDropTarget(null);
            } else if (dragState.item?.type === 'new_action' && isOverBayAreaCheck(bayAreaRect)) {
                setIsOverBayArea(true);
                setHoveredBayQuadrant(resolveBayQuadrantFromPosition(pos, bayAreaRect));
                setDailyDropIndicator(null);
                setWeeklyDropIndicator(null);
                setExecutionDropTarget(null);
            } else {
                setIsOverBayArea(false);
                setHoveredBayQuadrant(null);
                setExecutionDropTarget(null);
                if (viewMode === 'day' && scrollContainerRef.current && dragState.item) {
                    setWeeklyDropIndicator(null);
                    const dailyViewEl = dailyGridElRef.current;
                    if (!dailyViewEl) return;
                    const gridRect = dailyViewEl.getBoundingClientRect();

                    // Permitir margem para manter o indicador visivel durante o auto-scroll nas bordas
                    const scrollMargin = 150;
                    if (pos.y < gridRect.top - scrollMargin || pos.y > gridRect.bottom + scrollMargin) {
                        setDailyDropIndicator(null);
                        return;
                    }

                    let dropY = (pos.y - gridRect.top) - dropAnchorOffsetRef.current;
                    dropY = Math.max(0, dropY);
                    setDailyDropIndicator(buildClampedDropIndicator(dropY, dragState.item.duration));
                } else if (viewMode === 'week' && scrollContainerRef.current && dragState.item) {
                    setDailyDropIndicator(null);
                    const daysContainer = weeklyDaysContainerRef.current;
                    if (!daysContainer) { setWeeklyDropIndicator(null); return; }
                    const containerRect = daysContainer.getBoundingClientRect();
                    const scrollMargin = 150;
                    if (pos.x > containerRect.left && pos.x < containerRect.right &&
                        pos.y > containerRect.top - scrollMargin && pos.y < containerRect.bottom + scrollMargin) {
                        const dayColumnWidth = containerRect.width / 7;
                        let dayIndex = Math.floor((pos.x - containerRect.left) / dayColumnWidth);
                        dayIndex = Math.max(0, Math.min(6, dayIndex));
                        const headerHeight = 32;
                        let dropY = (pos.y - containerRect.top - headerHeight) - dropAnchorOffsetRef.current;
                        if (dropY < 0) dropY = 0;
                        const indicator = buildClampedDropIndicator(dropY, dragState.item.duration);
                        setWeeklyDropIndicator({ dayIndex, top: indicator.top, height: indicator.height });
                    } else { setWeeklyDropIndicator(null); }
                } else {
                    setDailyDropIndicator(null);
                    setWeeklyDropIndicator(null);
                }
            }
        };

        const handleDragEnd = (e: MouseEvent | TouchEvent) => {
            if (!dragState.item) return;

            // Get final pointer position directly from the event to avoid state update lag
            let pos: { x: number; y: number };
            if (e.type === 'touchend' && (e as TouchEvent).changedTouches?.length > 0) {
                pos = { x: (e as TouchEvent).changedTouches[0].clientX, y: (e as TouchEvent).changedTouches[0].clientY };
            } else if ('clientX' in e) {
                pos = { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
            } else {
                // Fallback to the last known position from state
                pos = dragState.currentPosition;
            }

            if (!bayAreaElRef.current || !dailyGridElRef.current || !weeklyGridElRef.current) {
                refreshDragTargets();
            }

            const bayAreaRect = bayAreaElRef.current?.getBoundingClientRect();
            const dailyTimelineRect = dailyGridElRef.current?.getBoundingClientRect();
            const weeklyGridRect = weeklyGridElRef.current?.getBoundingClientRect();

            const isOver = (rect: DOMRect | undefined, verticalMargin = 0) => {
                if (!rect || !pos) return false;
                return pos.y > rect.top - verticalMargin && pos.y < rect.bottom + verticalMargin && pos.x > rect.left && pos.x < rect.right;
            };

            if (isOver(bayAreaRect)) {
                const { type, payload } = dragState.item;
                const targetQuadrant = resolveBayQuadrantFromPosition(pos, bayAreaRect);
                if (type === 'reschedule_task') {
                    const task = tasks.find(t => t.id === payload);
                    const action = task ?getActionById(task.actionId) : undefined;
                    if (action && targetQuadrant && action.context?.plannerQuadrant !== targetQuadrant) {
                        updateAction(action.id, {
                            context: {
                                ...(action.context || {}),
                                plannerQuadrant: targetQuadrant,
                            },
                        });
                    }
                    if (action && action.actionType !== 'Marco') {
                        removeExecutionTask(payload);
                        clearRestScreenSessionForTask(payload, action.id);
                        returnTaskToPool(payload, activeCycle ? undefined : selectedOperationalDateString);
                    } else if (task) {
                        removeExecutionTask(payload);
                        clearRestScreenSessionForTask(payload, action?.id);
                        deleteTask(payload);
                    }
                } else if (type === 'new_action' && payload?.actionId && targetQuadrant) {
                    const action = getActionById(String(payload.actionId));
                    if (action && action.context?.plannerQuadrant !== targetQuadrant) {
                        updateAction(action.id, {
                            context: {
                                ...(action.context || {}),
                                plannerQuadrant: targetQuadrant,
                            },
                        });
                    }
                }
            } else if (isSimpleList && (dragState.item.type === 'reschedule_task' || dragState.item.type === 'new_action')) {
                const target = executionDropTarget ?? resolveExecutionDropTarget(pos);
                if (target) {
                    const { type, payload } = dragState.item;
                    if (type === 'new_action' && payload?.actionId) {
                        void scheduleTask(payload.actionId, target.date, -1).then((task) => {
                            if (task) placeExecutionTask(task.id, target.date, target.index, task);
                        });
                    } else if (type === 'reschedule_task') {
                        const taskId = String(payload);
                        const task = tasksById.get(taskId);
                        const currentOperationalDate = task ? getTaskOperationalDateString(task) : null;
                        if (task && currentOperationalDate !== target.date) {
                            if (hasScheduledTime(task) && currentOperationalDate) {
                                const displayStartTime = getTaskDisplayStartTime(task, currentOperationalDate);
                                rescheduleTask(
                                    taskId,
                                    getActualDateStringForOperationalMinutes(target.date, displayStartTime),
                                    getActualStartTimeForOperationalMinutes(displayStartTime),
                                );
                            } else {
                                rescheduleTask(taskId, target.date, -1);
                            }
                        }
                        placeExecutionTask(taskId, target.date, target.index);
                    }
                }
            } else if (isOver(dailyTimelineRect, 150) && viewMode === 'day' && dailyDropIndicator) {
                const operationalDateString = formatLocalDateString(currentDate);
                const { dateString, startTimeInMinutes } = resolveOperationalDropSlot(operationalDateString, dailyDropIndicator.top);
                const { type, payload } = dragState.item;
                const scheduledTask = type === 'new_action' ?scheduleTask(payload.actionId, dateString, startTimeInMinutes) : rescheduleTask(payload, dateString, startTimeInMinutes);
                if (scheduledTask && isTutorialActive && currentStep === 7) nextStep();
            } else if (isOver(weeklyGridRect, 150) && viewMode === 'week' && weeklyDropIndicator) {
                const dayIndex = weeklyDropIndicator.dayIndex;
                const startOfWeek = new Date(currentDate);
                const dayOfWeek = startOfWeek.getDay();
                const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ?-6 : 1);
                startOfWeek.setDate(diff);
                const dropDate = new Date(startOfWeek);
                dropDate.setDate(dropDate.getDate() + dayIndex);
                const operationalDateString = formatLocalDateString(dropDate);
                const { dateString, startTimeInMinutes } = resolveOperationalDropSlot(operationalDateString, weeklyDropIndicator.top);
                const { type, payload } = dragState.item;
                const scheduledTask = type === 'new_action' ?scheduleTask(payload.actionId, dateString, startTimeInMinutes) : rescheduleTask(payload, dateString, startTimeInMinutes);
                if (scheduledTask && isTutorialActive && currentStep === 7) nextStep();
            }

            if (scrollContainerRef.current) {
                scrollContainerRef.current.style.overflow = '';
            }

            setDragState({ isDragging: false, item: null, ghostElement: null, pointerOffset: { x: 0, y: 0 }, currentPosition: { x: 0, y: 0 } });
            setDailyDropIndicator(null);
            setWeeklyDropIndicator(null);
            setExecutionDropTarget(null);
            setIsOverBayArea(false);
            setHoveredBayQuadrant(null);
        };

        if (dragState.isDragging) {
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            document.body.style.touchAction = 'none';
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove, { passive: false });
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            document.body.style.touchAction = '';
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);

            // Restaurar pointer-events
            const gridDays = document.querySelectorAll('.grid-day-container');
            gridDays.forEach(el => {
                (el as HTMLElement).style.pointerEvents = '';
            });
        };
    }, [buildClampedDropIndicator, clearRestScreenSessionForTask, currentDate, dailyDropIndicator, dragState, getActionById, isSimpleList, resolveBayQuadrantFromPosition, resolveExecutionDropTarget, resolveOperationalDropSlot, scaleFactor, selectedOperationalDateString, tasks, updateAction, viewMode, weeklyDropIndicator, executionDropTarget, placeExecutionTask, removeExecutionTask, activeCycle, returnTaskToPool, deleteTask, scheduleTask, rescheduleTask, isTutorialActive, currentStep, nextStep, refreshDragTargets]);

    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timerId);
    }, []);

    useLayoutEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
            lastScrollTopRef.current = 0;
        }
    }, []);

    const scrollPlannerToIndicator = useCallback((indicatorEl: HTMLDivElement | null) => {
        const scroller = scrollContainerRef.current;
        if (!scroller || !indicatorEl) return;

        const indicatorTop = indicatorEl.offsetTop;
        const targetTop = Math.max(0, indicatorTop - (scroller.clientHeight * 0.42));
        scroller.scrollTo({ top: targetTop, behavior: 'smooth' });
    }, []);

    // Auto-scroll useEffects
    useEffect(() => {
        if (!isSimpleList && viewMode === 'day' && scrollContainerRef.current) {
            const isOperationalToday = formatLocalDateString(currentDate) === getOperationalDateString();
            if (isOperationalToday) {
                setTimeout(() => {
                    scrollPlannerToIndicator(dailyTimeIndicatorRef.current);
                }, 200);
            }
        }
    }, [currentDate, currentTime, isSimpleList, scrollPlannerToIndicator, viewMode, zoomLevel]);
    useEffect(() => {
        if (!isSimpleList && viewMode === 'week' && scrollContainerRef.current) {
            const startOfWeek = new Date(currentDate);
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - day + (day === 0 ?-6 : 1);
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            const operationalToday = buildLocalDateFromString(getOperationalDateString());
            if (operationalToday >= startOfWeek && operationalToday <= endOfWeek) {
                setTimeout(() => {
                    scrollPlannerToIndicator(weeklyTimeIndicatorRef.current);
                }, 200);
            }
        }
    }, [currentDate, currentTime, isSimpleList, scrollPlannerToIndicator, viewMode, zoomLevel]);

    const plannerScopedTasks = useMemo(() => {
        if (activeCycle) {
            return tasks.filter(task => task.date >= activeCycle.startDate && task.date <= activeCycle.endDate);
        }

        // Outside a cycle, the planner must stay local to the day on screen.
        // Old historical tasks cannot consume stock or leak back into the bay area.
        return tasks.filter(task => taskMatchesOperationalDate(task, selectedOperationalDateString));
    }, [activeCycle, selectedOperationalDateString, tasks]);

    // Marco availability is cycle-scoped. Old completions must not block a new cycle.
    const milestoneActions = actions.filter(
        action => action.actionType === 'Marco' && !plannerScopedTasks.some(task => task.actionId === action.id)
    );

    const tasksById = useMemo(() => new Map(tasks.map(task => [task.id, task])), [tasks]);
    const sanitizedExecutionQueueByDate = useMemo(() => {
        const next: Record<string, string[]> = {};
        tasks.forEach(task => {
            if (task.executionOrder == null) return;
            const date = getTaskOperationalDateString(task);
            if (!date) return;
            if (!next[date]) next[date] = [];
            next[date].push(task.id);
        });
        Object.keys(next).forEach(date => {
            next[date].sort((leftId, rightId) => {
                const left = tasksById.get(leftId);
                const right = tasksById.get(rightId);
                return (left?.executionOrder ?? Number.MAX_SAFE_INTEGER) - (right?.executionOrder ?? Number.MAX_SAFE_INTEGER);
            });
        });
        return next;
    }, [tasks, tasksById]);

    const executionQueuedTaskIds = useMemo(
        () => isSimpleList
            ? new Set(Object.values(sanitizedExecutionQueueByDate).flat())
            : new Set<string>(),
        [isSimpleList, sanitizedExecutionQueueByDate]
    );

    // Planner bay is global only inside the current cycle window.
    // Old tasks from previous cycles must not consume stock in a new cycle.
    // Without an active cycle, keep stock scoped to the operational day currently on screen.
    const availableTaskPool = useMemo(
        () => buildActionPoolByDate(
            actions,
            taskPool,
            plannerScopedTasks,
            activeCycle ? null : selectedOperationalDateString,
            Array.from(executionQueuedTaskIds),
            Boolean(activeCycle)
        ),
        [actions, taskPool, plannerScopedTasks, activeCycle, selectedOperationalDateString, executionQueuedTaskIds]
    );

    const executionTasksByDate = useMemo(() => {
        const candidateTasksByDate: Record<string, ScheduledTask[]> = {};
        const simpleListScope = isSimpleList && viewMode === 'week' && !activeCycle
            ? tasks.filter((task) => simpleWeekDateSet.has(getTaskOperationalDateString(task)))
            : plannerScopedTasks;

        simpleListScope.forEach((task) => {
            const isQueuedForExecution = executionQueuedTaskIds.has(task.id);
            if (isTaskInPool(task) && !isQueuedForExecution) return;
            const operationalDate = getTaskOperationalDateString(task);
            if (!operationalDate) return;
            if (!candidateTasksByDate[operationalDate]) candidateTasksByDate[operationalDate] = [];
            candidateTasksByDate[operationalDate].push(task);
        });

        const grouped: Record<string, ScheduledTask[]> = {};

        const allDates = new Set([
            ...Object.keys(candidateTasksByDate),
            ...Object.keys(sanitizedExecutionQueueByDate),
        ]);

        allDates.forEach((date) => {
            const queuedIds = sanitizedExecutionQueueByDate[date] || [];
            const candidates = candidateTasksByDate[date] || [];
            const remainingById = new Map(candidates.map((task) => [task.id, task]));
            const ordered: ScheduledTask[] = [];

            queuedIds.forEach((id) => {
                const task = remainingById.get(id);
                if (!task) return;
                ordered.push(task);
                remainingById.delete(id);
            });

            const remaining = Array.from(remainingById.values()).sort(compareExecutionTasks);
            if (ordered.length > 0 || remaining.length > 0) {
                grouped[date] = [...ordered, ...remaining];
            }
        });

        return grouped;
    }, [activeCycle, executionQueuedTaskIds, isSimpleList, plannerScopedTasks, sanitizedExecutionQueueByDate, simpleWeekDateSet, tasks, viewMode]);
    const changeDate = (amount: number) => setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() + (amount * (viewMode === 'week' ? 7 : 1)));
        return newDate;
    });
    
    const isTaskAlreadyJudged = useCallback((task: ScheduledTask | undefined | null) => {
        return isTaskInClosedCycleScope(task);
    }, [isTaskInClosedCycleScope]);

    const canReuseBayTask = useCallback((task: ScheduledTask | undefined | null) =>
        Boolean(task && isTaskInPool(task) && !isTaskAlreadyJudged(task)),
        [isTaskAlreadyJudged]
    );

    const dailyTasks = getTasksForDate(currentDate);
    const bayAreaTasks = plannerScopedTasks.filter(task => canReuseBayTask(task) && !executionQueuedTaskIds.has(task.id)); // Waiting bay scoped to the active cycle or visible operational day
    const scheduledTasks = dailyTasks.filter(hasScheduledTime); // For DailyView
    const weeklyScheduledTasks = tasks.filter(hasScheduledTime);

    const allTasksCompleted = checklistItems.every(item => item.completed);
    const hasPendingChecklistItems = checklistItems.some(item => !item.completed);
    const shouldSurfaceChecklist = currentTime.getHours() >= 20 && hasPendingChecklistItems;
    const isToday = formatLocalDateString(currentDate) === getOperationalDateString();

    const plannerExpSnapshot = useMemo<PlannerExpSnapshot>(() => {
        const selectedDate = formatLocalDateString(currentDate);

        const scopedTasks = activeCycle
            ? filterCycleTasksByScope(tasks, actions, activeCycle, activeCycle.startDate, activeCycle.endDate)
            : tasks;

        const realTaskIdsForDate = getInitialDailyCommitmentTaskIds(scopedTasks, selectedDate, isClanQuestActionId);
        const fallbackTaskIds = realTaskIdsForDate.filter(taskId => !isTaskInClosedCycleScope(scopedTasks.find(task => task.id === taskId)));
        const expSnapshot = buildDailyExpSnapshot({
            tasks: scopedTasks,
            actions,
            operationalDate: selectedDate,
            taskIds: fallbackTaskIds,
            includePremium: hasPremiumAccess(userProfile as any),
        });

        return {
            value: expSnapshot.totalExp,
            completedCount: expSnapshot.completedCount,
            totalCount: expSnapshot.totalCount,
            isDeposited: false,
        };
    }, [activeCycle, actions, currentDate, isClanQuestActionId, isTaskInClosedCycleScope, tasks, userProfile]);

    // UNIFY POOL AND BAY AREA TASKS FOR DISPLAY
    // "Estoque e Espera e a mesma coisa"
    const unifiedBayAreaItems = useMemo(() => {
        const unified = Object.fromEntries(
            (Object.entries(availableTaskPool) as [string, BayEntryPayload][])
                .map(([actionId, payload]) => [actionId, { ...payload, taskIds: [...(payload.taskIds || [])] }])
        ) as Record<string, BayEntryPayload>;
        const bayTaskIdsByAction = new Map<string, string[]>();

        bayAreaTasks.forEach(task => {
            if (!unified[task.actionId]) {
                 // Should exist from pool init, but just in case
                 unified[task.actionId] = { count: 0, isUnlimited: false, taskIds: [] };
            }
            bayTaskIdsByAction.set(task.actionId, [...(bayTaskIdsByAction.get(task.actionId) || []), task.id]);
        });

        bayTaskIdsByAction.forEach((taskIds, actionId) => {
            const action = getActionById(actionId);
            if (!action) return;

            const visibleTaskIds = getVisiblePoolTaskIdsForAction(
                action,
                plannerScopedTasks,
                taskIds,
                Array.from(executionQueuedTaskIds),
            );
            unified[actionId].taskIds = visibleTaskIds;
            unified[actionId].displayCount = unified[actionId].isUnlimited
                ? unified[actionId].count
                : unified[actionId].count + visibleTaskIds.length;
        });
        
        return unified;
    }, [availableTaskPool, bayAreaTasks, executionQueuedTaskIds, getActionById, plannerScopedTasks]);

    const visibleBayAreaEntries = useMemo(() => {
        const arenaAssetIdByArenaId = new Map<string, string>();
        const arenaNameByArenaId = new Map<string, string>();
        assets.forEach(asset => {
            asset.arenas.forEach(arena => {
                arenaAssetIdByArenaId.set(arena.id, asset.id);
                arenaNameByArenaId.set(arena.id, arena.name || '');
            });
        });

        const reversedAssetOrder = [...assets].reverse().map(asset => asset.id);
        const assetPriority = new Map(reversedAssetOrder.map((assetId, index) => [assetId, index]));

        return (Object.entries(unifiedBayAreaItems) as [string, BayEntryPayload][])
            .filter(([_, payload]) => payload.count > 0 || (payload.taskIds && payload.taskIds.length > 0))
            .sort(([leftActionId], [rightActionId]) => {
                const leftAction = getActionById(leftActionId);
                const rightAction = getActionById(rightActionId);

                const leftAssetId = leftAction ? arenaAssetIdByArenaId.get(leftAction.arenaId) : undefined;
                const rightAssetId = rightAction ? arenaAssetIdByArenaId.get(rightAction.arenaId) : undefined;

                const leftPriority = leftAssetId ? assetPriority.get(leftAssetId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
                const rightPriority = rightAssetId ? assetPriority.get(rightAssetId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;

                if (leftPriority !== rightPriority) return leftPriority - rightPriority;

                const leftArenaName = leftAction ? arenaNameByArenaId.get(leftAction.arenaId) || '' : '';
                const rightArenaName = rightAction ? arenaNameByArenaId.get(rightAction.arenaId) || '' : '';
                const arenaCompare = leftArenaName.localeCompare(rightArenaName, 'pt-BR');
                if (arenaCompare !== 0) return arenaCompare;

                return (leftAction?.name || '').localeCompare(rightAction?.name || '', 'pt-BR');
            });
    }, [assets, unifiedBayAreaItems, actions]);

    const matrixBayAreaEntries = useMemo(() => {
        const grouped = {
            ui: [] as Array<[string, BayEntryPayload]>,
            nui: [] as Array<[string, BayEntryPayload]>,
            uni: [] as Array<[string, BayEntryPayload]>,
            nuni: [] as Array<[string, BayEntryPayload]>,
        };

        visibleBayAreaEntries.forEach(([actionId, payload]) => {
            const action = getActionById(actionId);
            const quadrant = action?.context?.plannerQuadrant || 'ui';
            grouped[quadrant].push([actionId, payload]);
        });

        return grouped;
    }, [getActionById, visibleBayAreaEntries]);

    // Keep bay height in sync with what is actually rendered, not with every hidden pool key.
    const bayAreaItemsPerRow = 7;
    const bayAreaItemsPerPage = bayAreaItemsPerRow * 2;
    const poolItemCount = visibleBayAreaEntries.length;
    const isSingleRow = poolItemCount <= bayAreaItemsPerRow;
    // Reduced heights as requested
    const bayAreaHeight = canUseAdvancedPlannerMatrix && isAdvancedPlannerMatrixEnabled ? 'h-[112px]' : (isSingleRow ?'h-[42px]' : 'h-[84px]');
    const bayAreaPages = useMemo(() => {
        const pageSize = isSingleRow ? bayAreaItemsPerRow : bayAreaItemsPerPage;
        const pages: Array<Array<[string, BayEntryPayload]>> = [];
        for (let index = 0; index < visibleBayAreaEntries.length; index += pageSize) {
            pages.push(visibleBayAreaEntries.slice(index, index + pageSize));
        }
        return pages;
    }, [bayAreaItemsPerPage, bayAreaItemsPerRow, isSingleRow, visibleBayAreaEntries]);
    const renderBayPoolAction = ([actionId, payload]: [string, BayEntryPayload]) => {
        const action = getActionById(actionId);
        if (!action) return null;
        // In an active cycle the bay is cycle-wide, so a concrete waiting task
        // must be reused even if its original operational date is not selected.
        // Outside a cycle, keep the bay local to the day on screen.
        const nextTaskId = payload.taskIds?.find(taskId => {
            const task = tasksById.get(taskId);
            if (!canReuseBayTask(task)) return false;
            return activeCycle
                ? task.date >= activeCycle.startDate && task.date <= activeCycle.endDate
                : taskMatchesOperationalDate(task, selectedOperationalDateString);
        });
        if (payload.count <= 0 && !nextTaskId) return null;

        return (
            <PoolAction
                key={actionId}
                action={action}
                count={payload.displayCount ?? payload.count}
                isUnlimited={payload.isUnlimited}
                taskId={nextTaskId}
                onComplete={(aid, tid) => scheduleAndCompleteNow(aid, tid)}
                onCustomDragStart={handleCustomDragStart}
                onActionClick={(a) => setModalData({ action: a, taskId: nextTaskId })}
            />
        );
    };
    const toggleAdvancedPlannerMatrix = () => {
        const nextValue = !isAdvancedPlannerMatrixEnabled;
        setIsAdvancedPlannerMatrixEnabled(nextValue);
        try {
            localStorage.setItem('planner_advanced_matrix', nextValue ? '1' : '0');
        } catch {
            // ignore storage errors
        }
    };

    return (
        <div id="planner-container" className="planner-root relative flex flex-col h-full min-h-0 overflow-hidden bg-[#0d0d0e]">
            {dragState.isDragging && (
                <div style={{ position: 'fixed', top: dragState.currentPosition.y, left: dragState.currentPosition.x, transform: `translate(-${dragState.pointerOffset.x}px, -${dragState.pointerOffset.y}px)`, pointerEvents: 'none', zIndex: 1000 }}>
                    {dragState.ghostElement}
                </div>
            )}

            <div className="planner-top-shell relative z-30 flex-shrink-0 px-2 pt-1 pb-1 transition-all duration-300">
                <div className="planner-header-plane relative overflow-hidden rounded-[30px] border border-white/10 shadow-[0_18px_38px_rgba(0,0,0,0.34)]">
                    <div className="planner-header-glow absolute inset-0 pointer-events-none" />
                    <div className="planner-header-noise absolute inset-0 pointer-events-none opacity-60" />
                    <div className="relative z-10">
                    <div className="relative flex h-11 items-center justify-center px-3 pt-2 text-lg font-bold">
                        <div className="absolute left-3 flex min-w-0 items-center space-x-1" id="planner-tools">
                            <button onClick={() => setChecklistVisible(true)} className={`planner-soft-control relative rounded-full border px-2 py-1.5 transition-colors ${shouldSurfaceChecklist ? 'border-[var(--skin-accent-color)]/38 bg-[var(--skin-accent-color)]/14 text-[var(--skin-accent-color)] shadow-[0_0_12px_rgba(212,175,55,0.14)]' : 'border-white/8 bg-white/[0.025] text-gray-500 hover:border-white/18 hover:bg-white/[0.055] hover:text-gray-200'}`} title={shouldSurfaceChecklist ? 'Checklist diario: pendencias da noite' : 'Checklist diario'} aria-label="Abrir checklist diario">
                                <SquareCheckIcon className={`h-4 w-4 ${allTasksCompleted ? 'text-[var(--skin-accent-color)]' : ''}`} />
                                {shouldSurfaceChecklist && (
                                    <ClockIcon className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-black/70 p-[1px] text-[var(--skin-accent-color)]" />
                                )}
                                {sequenceItems.length > 0 && (
                                    <span className="absolute -right-1 -top-1 flex min-w-[1rem] items-center justify-center gap-0.5 rounded-full border border-black/30 bg-[var(--skin-accent-color)] px-1 py-[1px] text-[9px] font-black leading-none text-black shadow-[0_4px_10px_rgba(0,0,0,0.25)]">
                                        <FlameIcon className="h-2.5 w-2.5" />
                                        {sequenceItems.length}
                                    </span>
                                )}
                            </button>
                            <button id="sitrep-button" onClick={() => setIsSitrepVisible(true)} className="planner-soft-control p-1.5 rounded-full hover:bg-white/8 text-gray-400 hover:text-white transition-colors" title="Resumo diario">
                                <PanelIcon className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="absolute right-3 flex items-center" id="planner-history-tool">
                            <button id="report-button" onClick={onReportsClick} className="planner-soft-control p-1.5 rounded-full hover:bg-white/8 text-gray-400 hover:text-white transition-colors" title="Historico do ciclo" aria-label="Abrir historico do ciclo">
                                <ArchiveBoxIcon className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="flex items-center justify-center space-x-0.5" id="cycle-hud">
                            <button onClick={() => changeDate(-1)} className="planner-soft-control p-1 rounded-full hover:bg-white/8 text-gray-400 hover:text-white"><ChevronLeftIcon className="w-4 h-4" /></button>
                            <span className="planner-date-label tracking-[0.06em] text-[12px] font-semibold w-[5.75rem] text-center text-gray-200 capitalize truncate">{currentDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}</span>
                            <button onClick={() => changeDate(1)} className="planner-soft-control p-1 rounded-full hover:bg-white/8 text-gray-400 hover:text-white"><ChevronRightIcon className="w-4 h-4" /></button>
                        </div>
                        <div className="hidden">
                            <PlannerSegmentedToggle
                                id="view-mode-selector-hidden"
                                value={viewMode}
                                onChange={(value) => setViewMode(value as 'day' | 'week')}
                                options={[
                                    { value: 'day', label: 'Dia', hint: 'Visao diaria', icon: <span className="text-[10px] font-black leading-none tracking-[0.08em]">D</span> },
                                    { value: 'week', label: 'Semana', hint: 'Visao semanal', icon: <span className="text-[10px] font-black leading-none tracking-[0.08em]">S</span> },
                                ]}
                                iconOnly
                            />
                        </div>
                    </div>

                    <div className={`planner-header-band flex items-center space-x-2 my-0 w-full overflow-visible px-2 pb-2 pt-1 transition-all duration-300`}>
                        <div
                            id="planner-pool"
                            data-testid="bay-area"
                            className={`planner-bay-surface flex-grow min-w-0 rounded-2xl p-0.5 ${bayAreaHeight} transition-all duration-300 ${isOverBayArea ?'border-[var(--skin-accent-color)] ring-1 ring-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/5' : ''}`}
                        >
                            {canUseAdvancedPlannerMatrix && isAdvancedPlannerMatrixEnabled ? (
                                <div className="grid h-full grid-cols-2 grid-rows-2 overflow-hidden rounded-[14px] border border-white/6 bg-black/12">
                                    {PLANNER_MATRIX_LAYOUT.map((quadrant, index) => {
                                        const entries = matrixBayAreaEntries[quadrant.key];
                                        const isHovered = hoveredBayQuadrant === quadrant.key;
                                        const borderClass = `${index % 2 === 1 ? 'border-l border-dashed border-white/10' : ''} ${index >= 2 ? 'border-t border-dashed border-white/10' : ''}`;
                                        return (
                                            <div key={quadrant.key} className={`relative min-w-0 px-1.5 py-1 transition-colors ${borderClass} ${isHovered ? 'bg-[var(--skin-accent-color)]/10' : ''}`}>
                                                <div className="mb-1 flex items-center justify-between gap-2">
                                                    <span className={`text-[9px] font-black uppercase tracking-[0.18em] ${isHovered ? 'text-[var(--skin-accent-color)]' : 'text-white/38'}`}>{quadrant.label}</span>
                                                    <span className="text-[9px] text-white/24">{entries.length || ''}</span>
                                                </div>
                                                <div className="flex h-[calc(100%-1rem)] items-center gap-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
                                                    {entries.length > 0 ? entries.map(([actionId, payload]) => {
                                                        const action = getActionById(actionId);
                                                        if (!action) return null;
                                                        const nextTaskId = payload.taskIds?.find(taskId => {
                                                            const task = tasksById.get(taskId);
                                                            if (!canReuseBayTask(task)) return false;
                                                            return activeCycle
                                                                ? Boolean(task && task.date >= activeCycle.startDate && task.date <= activeCycle.endDate)
                                                                : Boolean(task && taskMatchesOperationalDate(task, selectedOperationalDateString));
                                                        });

                                                        return (
                                                            <PoolAction
                                                                key={`${quadrant.key}-${actionId}`}
                                                                action={action}
                                                                count={payload.displayCount ?? payload.count}
                                                                isUnlimited={payload.isUnlimited}
                                                                taskId={nextTaskId}
                                                                onComplete={(aid, tid) => scheduleAndCompleteNow(aid, tid)}
                                                                onCustomDragStart={handleCustomDragStart}
                                                                onActionClick={(a) => setModalData({ action: a, taskId: nextTaskId })}
                                                            />
                                                        );
                                                    }) : (
                                                        <div className="flex h-full min-w-[4rem] items-center text-[9px] uppercase tracking-[0.14em] text-white/20">Vazio</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div
                                    className="flex h-full gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain pr-2 scrollbar-hide"
                                    style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
                                >
                                    {bayAreaPages.length > 0 ? bayAreaPages.map((pageEntries, pageIndex) => (
                                        <div
                                            key={`bay-page-${pageIndex}`}
                                            className={`grid h-full shrink-0 gap-0.5 ${isSingleRow ? 'grid-rows-1' : 'grid-rows-2'}`}
                                            style={{
                                                gridTemplateColumns: `repeat(${isSingleRow ? Math.max(1, pageEntries.length) : bayAreaItemsPerRow}, minmax(0, 2.35rem))`,
                                                gridAutoFlow: 'row',
                                            }}
                                        >
                                            {pageEntries.map(renderBayPoolAction)}
                                        </div>
                                    )) : (
                                        <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-600 tracking-[0.12em]">{'Sem a\u00E7\u00F5es'}</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={`relative flex-shrink-0 ${bayAreaHeight} transition-all duration-300`}>
                            <button onClick={() => setIsMilestonePoolOpen(prev => !prev)} className="planner-bay-surface w-10 h-full rounded-2xl flex items-center justify-center hover:bg-white/[0.05] transition-colors"><svg viewBox="0 0 24 24" className="w-5 h-5 text-[var(--accent-silver)] transform rotate-45 opacity-70"><rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" /></svg></button>
                            {isMilestonePoolOpen && (<div className="absolute top-full right-0 mt-2 max-h-[42vh] w-56 overflow-y-auto core-surface-strong rounded-xl p-2 space-y-1 z-[80] animate-fade-in shadow-[0_18px_44px_rgba(0,0,0,0.42)]"><h4 className="core-label text-center pb-1 border-b border-white/6">Marcos</h4>{milestoneActions.length > 0 ?milestoneActions.map(action => (<MilestonePoolAction key={action.id} action={action} onCustomDragStart={handleCustomDragStart} onComplete={scheduleAndCompleteMilestoneNow} onActionClick={(a) => setModalData({ action: a })} />)) : (<p className="text-[10px] text-center text-gray-600 py-2">Vazio</p>)}</div>)}
                        </div>
                    </div>
                    <DayHeader
                        currentDate={currentDate}
                        label={plannerHeaderLabel}
                        canUseAdvancedPlannerMatrix={canUseAdvancedPlannerMatrix}
                        isAdvancedPlannerMatrixEnabled={isAdvancedPlannerMatrixEnabled}
                        onToggleAdvancedPlannerMatrix={toggleAdvancedPlannerMatrix}
                        rightSlot={(
                            <PlannerSegmentedToggle
                                id="view-mode-selector"
                                value={viewMode}
                                onChange={(value) => setViewMode(value as 'day' | 'week')}
                                options={[
                                    { value: 'day', label: 'Dia', hint: 'Visao diaria', icon: <span className="text-[10px] font-black leading-none tracking-[0.08em]">D</span> },
                                    { value: 'week', label: 'Semana', hint: 'Visao semanal', icon: <span className="text-[10px] font-black leading-none tracking-[0.08em]">S</span> },
                                ]}
                                iconOnly
                            />
                        )}
                    />
                    </div>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="planner-scroll-surface flex-grow min-h-0 overflow-y-auto overflow-x-hidden relative bg-[#111111]"
                style={{ scrollBehavior: 'smooth', overscrollBehaviorY: 'contain' }}
            >
                <div className={dragState.isDragging ?'pointer-events-auto' : ''}>
                    {plannerArenaOptions.length === 0 ? (
                        <div className="flex min-h-[48vh] items-center justify-center px-6">
                            <div className="max-w-[18rem] rounded-[24px] border border-white/8 bg-black/20 px-5 py-5 text-center shadow-[0_14px_34px_rgba(0,0,0,0.18)]">
                                <div className="text-sm font-semibold text-white">Nada aqui ainda.</div>
                        <div className="mt-1 text-[12px] leading-relaxed text-white/54">Adicione uma arena para comecar a criar acoes e organizar o dia.</div>
                            </div>
                        </div>
                    ) : isSimpleList && viewMode === 'day' ?(
                        <div className="min-h-full px-3 py-4">
                            <PlannerSimpleList
                            date={selectedOperationalDateString}
                            tasks={executionTasksByDate[selectedOperationalDateString] || []}
                            getActionById={getActionById}
                            executionDropTarget={executionDropTarget}
                            onComplete={(actionId, taskId) => scheduleAndCompleteNow(actionId, taskId)}
                            onToggleTask={(taskId) => toggleTaskCompletion(taskId)}
                            onCustomDragStart={handleCustomDragStart}
                            onTaskClick={handleTaskClick}
                            />
                        </div>
                    ) : isSimpleList ? (
                        <div className="min-h-full px-3 py-4">
                            <PlannerSimpleWeek
                                dates={simpleWeekDates}
                                tasksByDate={executionTasksByDate}
                                getActionById={getActionById}
                                executionDropTarget={executionDropTarget}
                                onComplete={(actionId, taskId) => scheduleAndCompleteNow(actionId, taskId)}
                                onToggleTask={(taskId) => toggleTaskCompletion(taskId)}
                                onCustomDragStart={handleCustomDragStart}
                                onTaskClick={handleTaskClick}
                            />
                        </div>
                    ) : viewMode === 'day' ?(
                        <DailyView tasks={scheduledTasks} actions={actions} scaleFactor={scaleFactor} operationalDate={formatLocalDateString(currentDate)} onCustomDragStart={handleCustomDragStart} dropIndicator={dailyDropIndicator} isToday={isToday} currentTime={currentTime} timeIndicatorRef={dailyTimeIndicatorRef} />
                    ) : (
                        <WeeklyPlannerGrid currentDate={currentDate} tasks={weeklyScheduledTasks} actions={actions} onCustomDragStart={handleCustomDragStart} onTaskClick={handleTaskClick} scaleFactor={scaleFactor} stickyHeaderOffset={'0px'} currentTime={currentTime} timeIndicatorRef={weeklyTimeIndicatorRef} dropIndicator={weeklyDropIndicator} />
                    )}
                </div>
            </div>

            <PlannerFloatingVitals expSnapshot={plannerExpSnapshot} cycleExpBanked={cycleExpBonus || 0} />

            {modalData && (
                <ActionModal
                    action={modalData.action}
                    taskId={modalData.taskId}
                    arenaId={modalData.action.arenaId}
                    initialMode="view"
                    onClose={() => setModalData(null)}
                />
            )}

            {/* Floating Action Button */}
            <div className="fixed bottom-[calc(4.25rem+var(--safe-area-bottom))] right-4 z-20 flex flex-col items-center space-y-2">

                {/* Oracle Input Panel */}
                {showOracleInput && (
                    <div className="absolute bottom-full mb-4 right-0 w-72 z-30">
                        <GlassCard variant="gold" className="p-2 backdrop-blur-xl border border-[var(--skin-accent-color)]/20 shadow-[0_16px_40px_rgba(0,0,0,0.32)]">
                            <div className="flex flex-col space-y-2">
                                <label className="core-label text-[var(--skin-accent-color)] ml-1">{'Or\u00E1culo'}</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        ref={oracleInputRef}
                                        type="text"
                                        value={oracleInput}
                                        onChange={(e) => setOracleInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={'A\u00E7\u00E3o @ Arena...'}
                                        className="planner-oracle-input flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--skin-accent-color)]/50 placeholder-gray-500"
                                    />
                                    <button
                                        onClick={handleOracleSubmit}
                                        className="p-2 bg-[var(--ui-button-primary-bg)] text-[var(--ui-text-on-accent)] rounded-lg hover:brightness-110 transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="planner-oracle-helper text-[10px] text-gray-400 px-1">
                                    Ex: "Ler Livro @ Estudos" ou apenas "Ler Livro"
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                )}

                <div className="planner-floating-stack flex flex-col items-center bg-black/45 backdrop-blur-lg border border-white/8 rounded-full p-0.5 space-y-0.5 shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
                    <button
                        id="focus-mode-button"
                        onClick={() => setShowOracleInput(!showOracleInput)}
                        className={`planner-soft-control p-1.5 rounded-full transition-all ${showOracleInput ?'bg-[var(--ui-button-primary-bg)] text-[var(--ui-text-on-accent)]' : 'text-white hover:bg-white/10'}`}
                        title="Adicionar por texto"
                    >
                        <span className="text-sm">{'\u{1F4DD}'}</span>
                    </button>
                    <div className="w-6 h-px bg-white/10 my-0.5"></div>
                    <button onClick={() => setZoomLevel(prev => Math.min(3, prev + 1) as 1 | 2 | 3)} disabled={zoomLevel === 3} className="planner-soft-control p-1.5 disabled:opacity-50" title="Aproximar"><PlusIcon className="w-3.5 h-3.5" /></button>
                    <span className="planner-date-label font-bold text-[9px] leading-none text-white/72">{zoomLevel}x</span>
                    <button onClick={() => setZoomLevel(prev => Math.max(1, prev - 1) as 1 | 2 | 3)} disabled={zoomLevel === 1} className="planner-soft-control p-1.5 disabled:opacity-50" title="Afastar"><MinusIcon className="w-3.5 h-3.5" /></button>
                </div>
                <button onClick={() => setIsActionModalOpen(true)} className="w-12 h-12 rounded-full luxe-skin-button flex items-center justify-center shadow-lg shadow-black/50 transform hover:scale-110 transition-transform"><PlusIcon className="w-6 h-6 text-black" /></button>
            </div>
            {isChecklistVisible && <ChecklistModal onClose={() => setChecklistVisible(false)} />}
            {isSitrepVisible && <SitrepModal selectedDate={sitrepDate} onClose={() => setIsSitrepVisible(false)} />}
            {isActionModalOpen && <ActionModal arenaId={defaultPlannerArenaId} action={null} initialMode="edit" onClose={() => setIsActionModalOpen(false)} />}
        </div>
    );
};

