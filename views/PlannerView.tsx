
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, FolderIcon, FolderStarIcon, ListRowsIcon, PlusIcon, MinusIcon } from '../components/Icons';
import { useGame, getLocalDateString } from '../contexts/GameContext';
import { Action, ScheduledTask, DayOfWeek, Arena, DailyCommitment, SeasonQuest, ActionType } from '../types';
import { ChecklistModal } from '../components/ChecklistModal';
import { WeeklyPlannerGrid } from '../components/WeeklyPlannerGrid';
import { PoolAction } from '../components/PoolAction';
import { DropIndicator } from '../components/DropIndicator';
import { SitrepModal } from '../components/SitrepModal';
import { MilestonePoolAction } from '../components/MilestonePoolAction';
import { ActionModal } from '../components/ActionModal';
import { GlassCard } from '../components/GlassCard';
import { useTutorial } from '../contexts/TutorialContext';
import { buildActionPoolByDate } from '../utils/coreLoopUtils.js';
import { OPERATIONAL_DAY_END_HOUR, OPERATIONAL_DAY_START_MINUTE, OPERATIONAL_DAY_TOTAL_MINUTES, buildLocalDateFromString, formatLocalDateString, getActualDateStringForOperationalMinutes, getActualStartTimeForOperationalMinutes, getOperationalDateString, getOperationalDisplayMinutes, getTaskDisplayStartTime } from '../utils/operationalDay.js';
import { hasScheduledTime, isTaskInPool } from '../utils/taskDomain.js';
import { useLongPress } from '../hooks/useLongPress';
import '../components/core-ui.css';
import { EmojiGlyph } from '../components/EmojiGlyph';

const DayHeader: React.FC<{ currentDate: Date }> = ({ currentDate }) => {
    const day = currentDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    return (
        <div className="planner-day-header text-center text-[12px] font-semibold text-gray-400 py-2 bg-[#0f0f10] tracking-[0.04em] capitalize border-b border-white/6">
            {day}
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
    const isFreeAction = action?.actionType === 'Livre';
    const displayStartTime = getTaskDisplayStartTime(task, operationalDate);
    const top = (displayStartTime - OPERATIONAL_DAY_START_MINUTE) * scaleFactor;

    // Handle corrupted tasks (missing action)
    if (!action) {
        const height = Math.max(30 * scaleFactor, task.duration * scaleFactor);
        return (
            <div
                ref={taskRef}
                className="absolute w-[calc(100%-0.5rem)] left-0 right-2 cursor-pointer z-10"
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
        }, 1000); // Reduced to 1s for better UX
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
                style={isFreeAction ?{ height: '40px', width: '100px' } : { ...backgroundStyle, height: '40px', width: '100px' }}
                className={`p-2 flex items-center space-x-2 rounded-2xl text-left opacity-80 ${isFreeAction ?'free-action-shell free-action-outline' : ''}`}
            >
                <div className="text-lg z-10"><EmojiGlyph symbol={action?.icon || '\u{1F4DD}'} size="action" className="text-white" /></div>
                <div className="text-sm font-semibold truncate w-full z-10">{action?.name}</div>
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
        delay: 300,
        dragThreshold: 20, // Increased to prevent accidental drags during long press
    });

    if (isMilestone) {
        const height = Math.max(15 * scaleFactor, task.duration * scaleFactor);

        return (
            <div
                ref={taskRef}
                {...longPressEvents}
                className="absolute w-[calc(100%-0.5rem)] left-0 right-2 cursor-pointer select-none flex items-center justify-center"
                style={{ top: `${top}px`, height: `${height}px`, touchAction: 'none' }}
            >
                <div className="relative w-full h-full">
                    <div className="absolute inset-0 w-full h-full" style={{ ...backgroundStyle, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                    {task.completed && <div className="absolute inset-0 bg-black/60" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />}
                    <div className={`absolute inset-0 border-2 ${task.completed ?'border-[var(--accent-silver)]' : 'border-dashed border-gray-600'}`} style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                    <div className={`relative z-10 w-full h-full flex flex-col items-center justify-center text-center p-1 ${task.completed ?'opacity-70' : ''}`}>
                        <EmojiGlyph symbol={action?.icon || "🏆"} size="milestone" className="text-white" />
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
            className="absolute w-[calc(100%-0.5rem)] left-0 right-2 cursor-pointer select-none"
            style={{ top: `${top}px`, height: `${height}px`, minHeight: `${30 * scaleFactor}px`, touchAction: 'none' }}
        >
            <div
                className={`h-full p-2 flex items-center space-x-2 rounded-2xl text-left relative overflow-hidden transition-all ${isFreeAction ?'free-action-shell text-slate-100' : task.completed ?'text-white/80 font-bold' : 'text-[var(--ui-card-text)]'}`}
                style={isFreeAction ?undefined : backgroundStyle}
            >
                <div className={`absolute inset-0 transition-opacity duration-300 ${isFreeAction ?'bg-black/45' : 'bg-black/60'} ${task.completed ?'opacity-100' : 'opacity-0'}`}></div>
                <div className={`absolute inset-0 border-2 rounded-2xl transition-all ${isFreeAction ?`free-action-outline ${task.completed ?'opacity-95' : 'opacity-80'}` : task.completed ?'border-[var(--bronze)]' : 'border-dashed border-gray-600'}`}></div>
                <div className="text-lg z-10"><EmojiGlyph symbol={action?.icon || '\u{1F4DD}'} size="action" className="text-white" /></div>
                <div className={`text-sm font-semibold truncate w-full z-10 ${isFreeAction && task.completed ?'text-slate-200/85' : ''}`}>{action?.name}</div>
                {isFreeAction && (
                    <div className={`z-10 shrink-0 ${task.completed ?'opacity-100' : 'opacity-45 saturate-50'}`}>
                        <div className="free-action-complete-dot scale-[0.82]" />
                    </div>
                )}
                {isHolding && (<div className={`absolute inset-0 animate-pulse ${isFreeAction ?'bg-black/40 rounded-2xl' : 'bg-black/50 rounded-2xl'}`}><div className={`h-full w-full ${task.completed ?'bg-red-800/50 animate-[unfill_3s_linear_forwards]' : isFreeAction ?'bg-slate-200/25 animate-[fill_3s_linear_forwards]' : 'bg-gray-500/50 animate-[fill_3s_linear_forwards]'}`}></div></div>)}
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

const DailyView: React.FC<{ tasks: ScheduledTask[], actions: Action[], scaleFactor: number, operationalDate: string, onCustomDragStart: (event: MouseEvent | TouchEvent, item: any, ghost: React.ReactNode, ref: React.RefObject<HTMLDivElement>) => void, dropIndicator: { top: number, height: number } | null, isToday: boolean, currentTime: Date, timeIndicatorRef: React.Ref<HTMLDivElement> }> = ({ tasks, actions, scaleFactor, operationalDate, onCustomDragStart, dropIndicator, isToday, currentTime, timeIndicatorRef }) => {
    const hours = Array.from({ length: (OPERATIONAL_DAY_END_HOUR - 4) + 1 }, (_, i) => i + 4);
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
                    {hours.map(hour => (<div key={hour} className="text-right pr-2" style={{ height: `${60 * scaleFactor}px` }}><span className="daily-hour-label text-xs font-mono text-gray-500">{`${hour.toString().padStart(2, '0')}:00`}</span></div>))}
                </div>
                <div className="daily-grid-column flex-grow relative border-l border-white/10 h-full">
                    {hours.slice(0).map((hour, i) => (<div key={hour} className={`daily-hour-slice relative ${i > 0 ?'border-t border-white/10' : ''}`} style={{ height: `${60 * scaleFactor}px` }}><div className="daily-quarter-line absolute w-full border-t border-white/5" style={{ top: `${15 * scaleFactor}px` }}></div><div className="daily-quarter-line absolute w-full border-t border-white/5" style={{ top: `${30 * scaleFactor}px` }}></div><div className="daily-quarter-line absolute w-full border-t border-white/5" style={{ top: `${45 * scaleFactor}px` }}></div></div>))}
                    {tasks.map((task) => <TaskSlot key={task.id} task={task} action={getActionById(task.actionId)} scaleFactor={scaleFactor} operationalDate={operationalDate} onCustomDragStart={onCustomDragStart} onTaskClick={handleTaskClick} />)}
                    {dropIndicator && <DropIndicator top={dropIndicator.top} height={dropIndicator.height} className="w-[calc(100%-0.5rem)] right-2" />}
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

const TacticalHUD: React.FC = () => {
    const { userProfile, activeCycle, nobilityRanks } = useGame();

    // Nobility Progress
    const currentExp = userProfile.nobility.exp;
    const currentRank = nobilityRanks.slice().reverse().find(r => currentExp >= r.expTotalRequired) || nobilityRanks[0];
    const nextRank = nobilityRanks.find(r => r.expTotalRequired > currentExp);

    let progress = 0;
    if (nextRank) {
        const prevRankExp = currentRank.expTotalRequired;
        const nextRankExp = nextRank.expTotalRequired;
        progress = ((currentExp - prevRankExp) / (nextRankExp - prevRankExp)) * 100;
    } else {
        progress = 100; // Max rank
    }

    return (
        <div className="px-3 py-2 bg-black/80 border-b border-white/10 flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-400 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-black/50">
            <div className="flex items-center space-x-3">
                <div className="flex flex-col">
                    <span className="text-[var(--skin-accent-color)] font-black text-xs leading-none">LVL {userProfile.level}</span>
                    <span className="text-[8px] text-gray-500 leading-none mt-0.5">MAESTRIA</span>
                </div>

                <div className="h-6 w-px bg-white/10 mx-1"></div>

                <div className="flex flex-col w-24">
                    <div className="flex justify-between text-[9px] mb-0.5">
                        <span className="text-white font-bold">{currentRank.name}</span>
                        <span className="text-[var(--skin-accent-color)]">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--ui-button-primary-bg)] transition-all duration-500 shadow-[0_0_10px_var(--skin-accent-color)]" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <div className="flex flex-col items-center">
                    <span className="text-white font-black text-xs">{/* Streak placeholder */ (userProfile as any).streak || 0} 🔥</span>
                    <span className="text-[8px]">DIAS</span>
                </div>
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
        rescheduleTask,
        returnTaskToPool,
        deleteTask,
        scheduleAndCompleteNow,
        scheduleAndCompleteMilestoneNow,
        addAction,
        assets,
        addArena,
        activeCycle,
        userProfile,
        getActionBackgroundStyle
    } = useGame();
    const { isTutorialActive, currentStep, nextStep } = useTutorial();
    const [currentDate, setCurrentDate] = useState(() => buildLocalDateFromString(getOperationalDateString()));
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const [isChecklistVisible, setChecklistVisible] = useState(false);
    const [isSitrepVisible, setIsSitrepVisible] = useState(false);

    useEffect(() => {
        const handleOpenSitrep = () => {
            setIsSitrepVisible(true);
        };
        window.addEventListener('openSitrep', handleOpenSitrep);
        return () => window.removeEventListener('openSitrep', handleOpenSitrep);
    }, []);

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
            normalizedAfter.search(/\s[-—]\s/),
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
                        description: 'Arena criada pelo Oráculo'
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
                        description: 'Arena criada pelo Oráculo'
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
    const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);
    const lastScrollTopRef = useRef<number>(0);
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const dropAnchorOffsetRef = useRef(20);
    const bayAreaElRef = useRef<HTMLElement | null>(null);
    const dailyGridElRef = useRef<HTMLElement | null>(null);
    const weeklyGridElRef = useRef<HTMLElement | null>(null);
    const weeklyDaysContainerRef = useRef<HTMLElement | null>(null);
    const pointerDisabledElsRef = useRef<HTMLElement[]>([]);

    // Custom Drag State
    const [dragState, setDragState] = useState({
        isDragging: false,
        item: null as { type: string, payload: any, duration: number } | null,
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

    const handleCustomDragStart = (event: MouseEvent | TouchEvent, item: { type: string; payload: any; duration: number; }, ghostElement: React.ReactNode, draggedElementRef: React.RefObject<HTMLDivElement>) => {
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

            const maxSpeed = 40;
            const step = () => {
                if (scrollContainerRef.current && lastPointerPosRef.current) {
                    const p = lastPointerPosRef.current;
                    const rect = scrollContainerRef.current.getBoundingClientRect();
                    let dy = 0;

                    // Zonas de Trigger
                    const containerTop = rect.top;
                    const containerBottom = rect.bottom;
                    const draggedElementTop = p.y - dragOffsetRef.current.y;

                    // Lógica Dupla para Subir:
                    // 1. Se o topo do elemento tocar o topo do container (precisão)
                    // 2. OU se o ponteiro estiver nos primeiros 200px da tela (fallback de segurança)
                    const isTopZone = draggedElementTop < (containerTop + 80) || p.y < 200;

                    // Lógica para Descer:
                    // 1. Ponteiro nos últimos 150px do container ou da tela
                    const isBottomZone = p.y > (containerBottom - 100) || p.y > (window.innerHeight - 150);

                    if (isTopZone) {
                        // Calcula intensidade baseada no quão "pra cima" está
                        const distElement = (containerTop + 80) - draggedElementTop;
                        const distPointer = 200 - p.y;
                        const dist = Math.max(distElement, distPointer);

                        const intensity = Math.min(3.0, dist / 100);
                        dy = -Math.max(15, intensity * maxSpeed);
                    }
                    else if (isBottomZone) {
                        const distPointer = p.y - (containerBottom - 100);
                        const distScreen = p.y - (window.innerHeight - 150);
                        const dist = Math.max(distPointer, distScreen);

                        const intensity = Math.min(3.0, dist / 100);
                        dy = Math.max(15, intensity * maxSpeed);
                    }

                    if (dy !== 0) {
                        scrollContainerRef.current.style.scrollBehavior = 'auto';

                        let handledByWindow = false;
                        // Prioritize bringing the container into view
                        if (dy < 0 && rect.top < 0) {
                            // Container top is above viewport, scroll window up to show it
                            window.scrollBy(0, dy);
                            handledByWindow = true;
                        } else if (dy > 0 && rect.bottom > window.innerHeight) {
                            // Container bottom is below viewport, scroll window down to show it
                            window.scrollBy(0, dy);
                            handledByWindow = true;
                        }

                        if (!handledByWindow) {
                            scrollContainerRef.current.scrollTop += dy;
                            lastScrollTopRef.current = scrollContainerRef.current.scrollTop;
                        }
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

            if (dragState.item?.type === 'reschedule_task' && isOverBayAreaCheck(bayAreaRect)) {
                setIsOverBayArea(true);
                setDailyDropIndicator(null);
                setWeeklyDropIndicator(null);
            } else {
                setIsOverBayArea(false);
                if (viewMode === 'day' && scrollContainerRef.current && dragState.item) {
                    setWeeklyDropIndicator(null);
                    const dailyViewEl = dailyGridElRef.current;
                    if (!dailyViewEl) return;
                    const gridRect = dailyViewEl.getBoundingClientRect();

                    // Permitir margem para manter o indicador visível durante o auto-scroll nas bordas
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
                if (type === 'reschedule_task') {
                    const task = tasks.find(t => t.id === payload);
                    const action = task ?getActionById(task.actionId) : undefined;
                    if (action && action.actionType !== 'Marco') {
                        returnTaskToPool(payload);
                    } else if (task) {
                        deleteTask(payload);
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
            setIsOverBayArea(false);
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
    }, [buildClampedDropIndicator, currentDate, dailyDropIndicator, dragState.isDragging, resolveOperationalDropSlot, scaleFactor, viewMode, weeklyDropIndicator]);

    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timerId);
    }, []);

    // Auto-scroll useEffects
    useEffect(() => {
        if (viewMode === 'day' && scrollContainerRef.current) {
            const isOperationalToday = formatLocalDateString(currentDate) === getOperationalDateString();
            if (isOperationalToday) {
                setTimeout(() => {
                    dailyTimeIndicatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 200);
            }
        }
    }, [viewMode, currentDate, zoomLevel, currentTime]);
    useEffect(() => {
        if (viewMode === 'week' && scrollContainerRef.current) {
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
                    weeklyTimeIndicatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 200);
            }
        }
    }, [viewMode, currentDate, zoomLevel, currentTime]);

    const cycleScopedTasks = useMemo(() => {
        if (!activeCycle) return tasks;
        return tasks.filter(task => task.date >= activeCycle.startDate && task.date <= activeCycle.endDate);
    }, [activeCycle, tasks]);

    // Marco availability is cycle-scoped. Old completions must not block a new cycle.
    const milestoneActions = actions.filter(
        action => action.actionType === 'Marco' && !cycleScopedTasks.some(task => task.actionId === action.id)
    );

    // Planner bay is global stock: changing day cannot create a second count for the same action.
    const availableTaskPool = useMemo(() => buildActionPoolByDate(actions, taskPool, tasks, null), [actions, taskPool, tasks]);

    const getActionById = (id: string) => actions.find(a => a.id === id);
    const changeDate = (amount: number) => setCurrentDate(prev => { const newDate = new Date(prev); newDate.setDate(newDate.getDate() + amount); return newDate; });
    
    const dailyTasks = getTasksForDate(currentDate);
    const bayAreaTasks = tasks.filter(isTaskInPool); // Global waiting bay, independent of selected day
    const scheduledTasks = dailyTasks.filter(hasScheduledTime); // For DailyView
    
    const allTasksCompleted = checklistItems.every(item => item.completed);
    const isToday = formatLocalDateString(currentDate) === getOperationalDateString();

    // UNIFY POOL AND BAY AREA TASKS FOR DISPLAY
    // "Estoque e Espera é a mesma coisa"
    const unifiedBayAreaItems = useMemo(() => {
        const unified = { ...availableTaskPool };
        
        bayAreaTasks.forEach(task => {
            // These are tasks that are instantiated but sit in Bay Area.
            // They should NOT add to the count if they are already counted in the "remaining" logic?
            // Wait. Logic above: Stock = Total - (Scheduled + Completed).
            // BayAreaTask is NOT scheduled and NOT completed. So it is NOT subtracted.
            // So 'remaining' ALREADY INCLUDES the potential for this task.
            // We just need to attach the taskId to the slot so we can drag it.
            
            if (!unified[task.actionId]) {
                 // Should exist from pool init, but just in case
                 unified[task.actionId] = { count: 0, isUnlimited: false, taskIds: [] };
            }
            
            // We do NOT add to count here because 'remaining' calculation already includes this "slot".
            // Actually, if I have 3 slots, and 1 is a BayAreaTask, 'remaining' is 3.
            // If I display '3', and one of them is this task...
            // It means I have 1 Concrete Task + 2 Virtual Slots.
            
            if (!unified[task.actionId].taskIds) unified[task.actionId].taskIds = [];
            unified[task.actionId].taskIds!.push(task.id);
        });
        
        return unified;
    }, [availableTaskPool, bayAreaTasks]);

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

        return (Object.entries(unifiedBayAreaItems) as [string, { count: number; isUnlimited: boolean; taskIds?: string[] }][] )
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

    // Keep bay height in sync with what is actually rendered, not with every hidden pool key.
    const poolItemCount = visibleBayAreaEntries.length;
    const isSingleRow = poolItemCount <= 8;
    // Reduced heights as requested
    const bayAreaHeight = isSingleRow ?'h-[42px]' : 'h-[84px]';
    const bayGridRows = isSingleRow ?'grid-rows-1' : 'grid-rows-2';

    return (
        <div id="planner-container" className="planner-root relative flex flex-col h-full min-h-0 bg-[#0d0d0e] overflow-visible">
            {dragState.isDragging && (
                <div style={{ position: 'fixed', top: dragState.currentPosition.y, left: dragState.currentPosition.x, transform: `translate(-${dragState.pointerOffset.x}px, -${dragState.pointerOffset.y}px)`, pointerEvents: 'none', zIndex: 1000 }}>
                    {dragState.ghostElement}
                </div>
            )}

            <div className="planner-top-shell sticky top-0 z-30 flex-shrink-0 bg-[#0f0f10]/95 backdrop-blur-md border-b border-white/6 transition-all duration-300 relative pt-2 shadow-[0_10px_24px_rgba(0,0,0,0.28)]">
                <div className="bg-transparent">
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 text-lg font-bold h-11 mt-1">
                        <div className="flex items-center space-x-1 min-w-0" id="planner-tools">
                            <button onClick={() => setChecklistVisible(true)} className="planner-soft-control p-1.5 rounded-full hover:bg-white/8 relative text-gray-400 hover:text-white transition-colors">
                                {allTasksCompleted ?<FolderStarIcon className="w-4 h-4 text-[var(--skin-accent-color)]" /> : <FolderIcon className="w-4 h-4" />}
                            </button>
                            <button id="sitrep-button" onClick={() => setIsSitrepVisible(true)} className="planner-soft-control p-1.5 rounded-full hover:bg-white/8 text-gray-400 hover:text-white transition-colors" title="Painel diario">
                                <ListRowsIcon className="w-4 h-4" />
                            </button>
                            <button id="report-button" onClick={onReportsClick} className="planner-soft-control p-1.5 rounded-full hover:bg-white/8 text-gray-400 hover:text-white transition-colors">
                                <ClockIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex min-w-0 items-center justify-center space-x-0.5" id="cycle-hud">
                            <button onClick={() => changeDate(-1)} className="planner-soft-control p-1 rounded-full hover:bg-white/8 text-gray-400 hover:text-white"><ChevronLeftIcon className="w-4 h-4" /></button>
                            <span className="planner-date-label tracking-[0.06em] text-[12px] font-semibold w-[5.75rem] text-center text-gray-200 capitalize truncate">{currentDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}</span>
                            <button onClick={() => changeDate(1)} className="planner-soft-control p-1 rounded-full hover:bg-white/8 text-gray-400 hover:text-white"><ChevronRightIcon className="w-4 h-4" /></button>
                        </div>
                        <div className="planner-pill-switch flex items-center justify-self-end bg-white/[0.03] rounded-full p-0.5 text-[10px] border border-white/6" id="view-mode-selector">
                            <button data-active={viewMode === 'day'} onClick={() => setViewMode('day')} className={`planner-view-btn px-2.5 py-1 rounded-full transition-colors ${viewMode === 'day' ?'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Dia</button>
                            <button data-active={viewMode === 'week'} id="eras-button" onClick={() => setViewMode('week')} className={`planner-view-btn px-2.5 py-1 rounded-full transition-colors ${viewMode === 'week' ?'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Semana</button>
                        </div>
                    </div>

                    <div className={`flex items-center space-x-2 my-0 w-full overflow-visible pb-1 px-2 transition-all duration-300`}>
                        <div
                            id="planner-pool"
                            data-testid="bay-area"
                            className={`flex-grow min-w-0 core-surface rounded-2xl p-0.5 ${bayAreaHeight} transition-all duration-300 ${isOverBayArea ?'border-[var(--skin-accent-color)] ring-1 ring-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/5' : ''}`}
                        >
                            <div className={`grid ${bayGridRows} grid-flow-col auto-cols-max gap-0.5 h-full overflow-x-auto overflow-y-hidden pr-2 scrollbar-hide items-center`}>
                                {visibleBayAreaEntries.length > 0 ?
                                     visibleBayAreaEntries.map(([actionId, payload]) => {
                                         const action = getActionById(actionId);
                                         if (!action) return null;
                                         // Use the first available taskId (FIFO) if any exist in Bay Area
                                         const nextTaskId = payload.taskIds && payload.taskIds.length > 0 ?payload.taskIds[0] : undefined;
                                         
                                         return (<PoolAction key={actionId} action={action} count={payload.count} isUnlimited={payload.isUnlimited} taskId={nextTaskId} onComplete={(aid, tid) => scheduleAndCompleteNow(aid, tid)} onCustomDragStart={handleCustomDragStart} onActionClick={(a) => setModalData({ action: a, taskId: nextTaskId })} />);
                                     }) : (<div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600 tracking-[0.12em] row-span-full col-span-full">{'Sem a\u00E7\u00F5es'}</div>)}
                            </div>
                        </div>
                        <div className={`relative flex-shrink-0 ${bayAreaHeight} transition-all duration-300`}>
                            <button onClick={() => setIsMilestonePoolOpen(prev => !prev)} className="w-10 h-full core-surface rounded-2xl flex items-center justify-center hover:bg-white/[0.05] transition-colors"><svg viewBox="0 0 24 24" className="w-5 h-5 text-[var(--accent-silver)] transform rotate-45 opacity-70"><rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" /></svg></button>
                            {isMilestonePoolOpen && (<div className="absolute top-full right-0 mt-2 w-52 core-surface-strong rounded-xl p-2 space-y-1 z-50 animate-fade-in"><h4 className="core-label text-center pb-1 border-b border-white/6">Marcos</h4>{milestoneActions.length > 0 ?milestoneActions.map(action => (<MilestonePoolAction key={action.id} action={action} onCustomDragStart={handleCustomDragStart} onComplete={scheduleAndCompleteMilestoneNow} onActionClick={(a) => setModalData({ action: a })} />)) : (<p className="text-[10px] text-center text-gray-600 py-2">Vazio</p>)}</div>)}
                        </div>
                    </div>
                </div>
                {viewMode === 'day' && <DayHeader currentDate={currentDate} />}
            </div>

            <div
                ref={scrollContainerRef}
                className="planner-scroll-surface flex-grow min-h-0 overflow-y-auto overflow-x-hidden relative bg-[#111111]"
                style={{ scrollBehavior: 'smooth' }}
            >
                <div className={dragState.isDragging ?'pointer-events-auto' : ''}>
                    {viewMode === 'day' ?(
                        <div>
                            <DailyView tasks={scheduledTasks} actions={actions} scaleFactor={scaleFactor} operationalDate={formatLocalDateString(currentDate)} onCustomDragStart={handleCustomDragStart} dropIndicator={dailyDropIndicator} isToday={isToday} currentTime={currentTime} timeIndicatorRef={dailyTimeIndicatorRef} />
                        </div>
                    ) : (
                        <WeeklyPlannerGrid currentDate={currentDate} tasks={tasks} actions={actions} onCustomDragStart={handleCustomDragStart} onTaskClick={handleTaskClick} scaleFactor={scaleFactor} stickyHeaderOffset={'0rem'} currentTime={currentTime} timeIndicatorRef={weeklyTimeIndicatorRef} dropIndicator={weeklyDropIndicator} />
                    )}
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

            {/* Floating Action Button */}
            <div className="fixed bottom-20 right-4 z-20 flex flex-col items-center space-y-2">

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

                <div className="planner-floating-stack flex flex-col items-center bg-black/50 backdrop-blur-lg border border-white/8 rounded-full p-1 space-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                    <button
                        id="focus-mode-button"
                        onClick={() => setShowOracleInput(!showOracleInput)}
                        className={`planner-soft-control p-2 rounded-full transition-all ${showOracleInput ?'bg-[var(--ui-button-primary-bg)] text-[var(--ui-text-on-accent)]' : 'text-white hover:bg-white/10'}`}
                        title="Adicionar por texto"
                    >
                        <span className="text-lg">{'\u{1F4DD}'}</span>
                    </button>
                    <div className="w-full h-px bg-white/10 my-1"></div>
                    <button onClick={() => setZoomLevel(prev => Math.min(3, prev + 1) as 1 | 2 | 3)} disabled={zoomLevel === 3} className="planner-soft-control p-2 disabled:opacity-50"><PlusIcon className="w-5 h-5" /></button>
                    <span className="planner-date-label font-bold text-xs text-white">{zoomLevel}x</span>
                    <button onClick={() => setZoomLevel(prev => Math.max(1, prev - 1) as 1 | 2 | 3)} disabled={zoomLevel === 1} className="planner-soft-control p-2 disabled:opacity-50"><MinusIcon className="w-5 h-5" /></button>
                </div>
                <button onClick={() => setIsActionModalOpen(true)} className="w-12 h-12 rounded-full luxe-skin-button flex items-center justify-center shadow-lg shadow-black/50 transform hover:scale-110 transition-transform"><PlusIcon className="w-6 h-6 text-black" /></button>
            </div>
            {isChecklistVisible && <ChecklistModal onClose={() => setChecklistVisible(false)} />}
            {isSitrepVisible && <SitrepModal onClose={() => setIsSitrepVisible(false)} />}
            {isActionModalOpen && <ActionModal arenaId="" action={null} initialMode="edit" onClose={() => setIsActionModalOpen(false)} />}
        </div>
    );
};
