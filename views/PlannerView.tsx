


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, FolderIcon, DollarSignIcon, FolderStarIcon, FlameIcon, LightbulbIcon, PlusIcon, MinusIcon } from '../components/Icons';
import { useGame } from '../contexts/GameContext';
import { Action, ScheduledTask, Arena, ActionType, DayOfWeek } from '../types';
import { ChecklistModal } from '../components/ChecklistModal';
import { WeeklyPlannerGrid } from '../components/WeeklyPlannerGrid';
import { PoolAction } from '../components/PoolAction';
import { DropIndicator } from '../components/DropIndicator';
import { SitrepModal } from '../components/SitrepModal';
import { MilestonePoolAction } from '../components/MilestonePoolAction';
import { ActionModal } from '../components/ActionModal';
import { GlassCard } from '../components/GlassCard';
import { useTutorial } from '../contexts/TutorialContext';
import { useLongPress } from '../hooks/useLongPress';

const DayHeader: React.FC<{ currentDate: Date }> = ({ currentDate }) => {
    const day = currentDate.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase();
    return (
        <div className="text-center text-sm font-bold text-gray-400 py-2 bg-[#111111] sticky z-10 top-0">
            {day}
        </div>
    );
};

const Sparkles: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
            <div
                key={i}
                className="absolute w-2 h-2 bg-[var(--gold)] rounded-full animate-ping"
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

const TaskSlot: React.FC<{ task: ScheduledTask, action?: Action, scaleFactor: number, onCustomDragStart: (event: MouseEvent | TouchEvent, item: any, ghost: React.ReactNode, ref: React.RefObject<HTMLDivElement>) => void }> = ({ task, action, scaleFactor, onCustomDragStart }) => {
    const { getActionBackgroundStyle, toggleTaskCompletion } = useGame();
    const { isTutorialActive, currentStep, nextStep, setSpotlight } = useTutorial();
    const [isHolding, setIsHolding] = useState(false);
    const [showSparkles, setShowSparkles] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const taskRef = useRef<HTMLDivElement>(null);
    const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handleDragMove = (e: MouseEvent | TouchEvent) => {
            // A small delay to ensure the element is positioned after drop
            setTimeout(() => {
                if (taskRef.current) {
                     setSpotlight(taskRef.current.getBoundingClientRect(), {
                        title: "Passo 8: Complete a Ação",
                        text: "Segure o card (Long Press) para marcar a ação como concluída e ganhar XP.",
                    });
                }
            }, 300);
        }
    }, [isTutorialActive, currentStep, setSpotlight, task.id]);

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

    const backgroundStyle = action ? getActionBackgroundStyle(action.id) : { background: 'var(--asset-grad-default)' };
    const isMilestone = action?.actionType === 'Marco';

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
            if (isTutorialActive && currentStep === 8) {
                nextStep();
            }
            setIsHolding(false);
            setIsTransitioning(false);
        }, 3000);
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
        if (task.completed) {
            toggleTaskCompletion(task.id);
        }
    };
    
    const handleDragStart = (e: MouseEvent | TouchEvent) => {
        const ghost = (
            <div style={{...backgroundStyle, height: '40px', width: '100px'}} className={`p-2 flex items-center space-x-2 rounded-2xl text-left opacity-80`}>
                <div className="text-lg z-10">{ action?.icon === '$' ? <DollarSignIcon className="w-5 h-5"/> : action?.icon === '🔥' ? <FlameIcon className="w-5 h-5" /> : <span className="text-xl">{action?.icon}</span> }</div>
                <div className="text-sm font-semibold truncate w-full z-10">{action?.name}</div>
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
    });

    const top = (task.startTime - (4 * 60)) * scaleFactor; // Time is in minutes, view starts at 4am (240 mins)
    
    if (isMilestone) {
        const height = Math.max(15 * scaleFactor, task.duration * scaleFactor);

        return (
             <div
                ref={taskRef}
                {...longPressEvents}
                className="absolute w-[calc(100%-0.5rem)] left-0 right-2 cursor-pointer flex items-center justify-center"
                style={{ top: `${top}px`, height: `${height}px`, touchAction: 'none' }}
            >
                <div className="relative w-full h-full">
                    <div className="absolute inset-0 w-full h-full" style={{ ...backgroundStyle, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                    {task.completed && <div className="absolute inset-0 bg-black/60" style={{clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'}} />}
                    <div className={`absolute inset-0 border-2 ${task.completed ? 'border-[var(--accent-silver)]' : 'border-dashed border-gray-600'}`} style={{clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'}} />
                    <div className={`relative z-10 w-full h-full flex flex-col items-center justify-center text-center p-1 ${task.completed ? 'opacity-70' : ''}`}>
                        <div className="text-xl">{action?.icon}</div>
                        <div className="text-xs font-semibold truncate max-w-full px-1">{action?.name}</div>
                    </div>
                    {isHolding && (<div className="absolute inset-0 bg-black/50 animate-pulse" style={{clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'}}><div className={`h-full w-full ${task.completed ? 'bg-red-800/50 animate-[unfill_3s_linear_forwards]' : 'bg-gray-500/50 animate-[fill_3s_linear_forwards]'}`}></div></div>)}
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
            className="absolute w-[calc(100%-0.5rem)] left-0 right-2 cursor-pointer" 
            style={{ top: `${top}px`, height: `${height}px`, minHeight: `${30 * scaleFactor}px`, touchAction: 'none' }}
        >
            <div 
                className={`h-full p-2 flex items-center space-x-2 rounded-2xl text-left relative overflow-hidden transition-all ${task.completed ? 'text-white/80 font-bold' : 'text-orange-200'}`}
                style={backgroundStyle}
            >
                 <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${task.completed ? 'opacity-100' : 'opacity-0'}`}></div>
                 <div className={`absolute inset-0 border-2 rounded-2xl transition-all ${task.completed ? 'border-[var(--bronze)]' : 'border-dashed border-gray-600'}`}></div>
                 <div className="text-lg z-10">{ action?.icon === '$' ? <DollarSignIcon className="w-5 h-5"/> : action?.icon === '🔥' ? <FlameIcon className="w-5 h-5" /> : <span className="text-xl">{action?.icon}</span> }</div>
                 <div className="text-sm font-semibold truncate w-full z-10">{action?.name}</div>
                 {isHolding && (<div className="absolute inset-0 bg-black/50 rounded-2xl animate-pulse"><div className={`h-full w-full ${task.completed ? 'bg-red-800/50 animate-[unfill_3s_linear_forwards]' : 'bg-gray-500/50 animate-[fill_3s_linear_forwards]'}`}></div></div>)}
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

const DailyView: React.FC<{ tasks: ScheduledTask[], actions: Action[], scaleFactor: number, onCustomDragStart: (event: MouseEvent | TouchEvent, item: any, ghost: React.ReactNode, ref: React.RefObject<HTMLDivElement>) => void, dropIndicator: { top: number, height: number } | null, isToday: boolean, currentTime: Date, timeIndicatorRef: React.Ref<HTMLDivElement> }> = ({ tasks, actions, scaleFactor, onCustomDragStart, dropIndicator, isToday, currentTime, timeIndicatorRef }) => {
    const hours = Array.from({ length: 21 }, (_, i) => i + 4);
    const getActionById = (id: string) => actions.find(a => a.id === id);

    let timeIndicatorTop = -1;
    if (isToday) {
        const currentTotalMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        timeIndicatorTop = (currentTotalMinutes - (4 * 60)) * scaleFactor;
    }

    return (
        <div className="flex-grow relative bg-[#111] border border-white/10 rounded-3xl p-2 h-full" data-testid="daily-timeline">
            <div className="flex h-full">
                <div className="w-12 flex-shrink-0">
                    {hours.map(hour => (<div key={hour} className="text-right pr-2" style={{height: `${60 * scaleFactor}px`}}><span className="text-xs font-mono text-gray-500">{`${hour.toString().padStart(2, '0')}:00`}</span></div>))}
                </div>
                <div className="flex-grow relative border-l border-white/10 h-full">
                    {hours.slice(0).map((hour, i) => (<div key={hour} className={`relative ${i > 0 ? 'border-t border-white/10' : ''}`} style={{height: `${60 * scaleFactor}px`}}><div className="absolute w-full border-t border-white/5" style={{ top: `${15 * scaleFactor}px` }}></div><div className="absolute w-full border-t border-white/5" style={{ top: `${30 * scaleFactor}px` }}></div><div className="absolute w-full border-t border-white/5" style={{ top: `${45 * scaleFactor}px` }}></div></div>))}
                    {tasks.map((task) => <TaskSlot key={task.id} task={task} action={getActionById(task.actionId)} scaleFactor={scaleFactor} onCustomDragStart={onCustomDragStart} />)}
                    {dropIndicator && <DropIndicator top={dropIndicator.top} height={dropIndicator.height} className="w-[calc(100%-0.5rem)] right-2" />}
                    {isToday && timeIndicatorTop >= 0 && <CurrentTimeIndicator ref={timeIndicatorRef} top={timeIndicatorTop} />}
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
        userProfile,
        getActionBackgroundStyle
    } = useGame();
    const { isTutorialActive, currentStep, nextStep, setSpotlight } = useTutorial();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const [isChecklistVisible, setChecklistVisible] = useState(false);
    const [isSitrepVisible, setIsSitrepVisible] = useState(false);
    const [showOracleInput, setShowOracleInput] = useState(false);
    const [oracleInput, setOracleInput] = useState('');
    const oracleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (showOracleInput && oracleInputRef.current) {
            oracleInputRef.current.focus();
        }
    }, [showOracleInput]);

    const toDateString = (value: Date) => value.toISOString().split('T')[0];
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
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
                const cost = ai === b.charCodeAt(j - 1) ? 0 : 1;
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
        return Number.isFinite(n) ? n : null;
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
        const mm = m[2] ? Number(m[2]) : 0;
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
        const withoutQuote = quoteMatch ? input.replace(quoteMatch[0], '').trim() : input;

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

        const cut = cutPoints.length > 0 ? Math.min(...cutPoints) : normalizedAfter.length;
        const arenaName = normalizedAfter.slice(0, cut).trim();
        const remainder = normalizedAfter.slice(cut).trim();
        const base = `${before} ${remainder}`.trim();

        return { base, arenaName, description };
    };

    const handleOracleSubmit = () => {
        if (!oracleInput.trim()) return;

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
        const nameEnd = cutPoints.length > 0 ? Math.min(...cutPoints) : normalizedBase.length;
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
                const prefixBonus = candName.startsWith(normalizedQuery) || normalizedQuery.startsWith(candName) ? 0.08 : 0;
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
                const newArena = addArena(geralAsset.id, {
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
                const newArena = addArena(geralAsset.id, {
                    name: 'Outros',
                    icon: '📦',
                    description: 'Arena criada pelo Oráculo'
                });
                targetArenaId = newArena.id;
            }
        }

        // 4. Create Action
        if (!targetArenaId || !actionName) return;

        const actionType: ActionType = startTimeInMinutes !== null && selectedDays.length === 0 ? 'Compromisso' : 'Ação Recorrente';

        const created = addAction({
            name: actionName,
            description: actionDescription || undefined,
            arenaId: targetArenaId,
            icon: '📝',
            duration,
            difficulty: 1,
            actionType,
            repetitions: actionType === 'Ação Recorrente' ? Math.max(1, repetitions) : 1,
        });

        if (actionType === 'Compromisso' && startTimeInMinutes !== null) {
            const dateString = currentDate.toISOString().split('T')[0];
            scheduleTask(created.id, dateString, startTimeInMinutes);
        }

        if (actionType === 'Ação Recorrente' && selectedDays.length > 0 && startTimeInMinutes !== null) {
            scheduleMultipleTasks(created.id, selectedDays, startTimeInMinutes);
        }

        setOracleInput('');
        setShowOracleInput(false);
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
    const [zoomLevel, setZoomLevel] = useState<3 | 2 | 1>(3);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);
    const lastScrollTopRef = useRef<number>(0);
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
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

    const handleCustomDragStart = ( event: MouseEvent | TouchEvent, item: { type: string; payload: any; duration: number; }, ghostElement: React.ReactNode, draggedElementRef: React.RefObject<HTMLDivElement> ) => {
        const isTouchEvent = 'touches' in event;
        const pos = isTouchEvent ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : { x: event.clientX, y: event.clientY };
        const elemRect = draggedElementRef.current?.getBoundingClientRect();
        const offset = elemRect ? { x: pos.x - elemRect.left, y: pos.y - elemRect.top } : { x: 0, y: 0 };
        if (isTutorialActive && (currentStep === 7 || currentStep === 8)) setSpotlight(null, null);
        setIsMilestonePoolOpen(false);
        refreshDragTargets();
        if (scrollContainerRef.current) {
            lastScrollTopRef.current = scrollContainerRef.current.scrollTop;
        }
        lastPointerPosRef.current = pos;
        dragOffsetRef.current = offset;
        setDragState({ isDragging: true, item, ghostElement, pointerOffset: offset, currentPosition: pos });
    };

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
            const pos = isTouchEvent ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
            setDragState(prev => ({ ...prev, currentPosition: pos }));
            lastPointerPosRef.current = pos;
            
            if (!bayAreaElRef.current || !dailyGridElRef.current || !weeklyGridElRef.current) {
                refreshDragTargets();
            }
            const bayAreaRect = bayAreaElRef.current?.getBoundingClientRect();
            const isOverBayAreaCheck = (rect: DOMRect | undefined) => rect ? (pos.y > rect.top && pos.y < rect.bottom && pos.x > rect.left && pos.x < rect.right) : false;

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
                    
                    // Calcular dropY relativo ao topo do grid rolável
                    let dropY = pos.y - gridRect.top + scrollContainerRef.current.scrollTop;
                    dropY = Math.max(0, dropY); // Impedir valores negativos
                    
                    const minutesFromViewStart = dropY / scaleFactor;
                    const snappedMinutes = Math.round(minutesFromViewStart / 15) * 15;
                    setDailyDropIndicator({ top: snappedMinutes * scaleFactor, height: dragState.item.duration * scaleFactor });
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
                            let dropY = pos.y - containerRect.top - headerHeight + scrollContainerRef.current.scrollTop;
                            if (dropY < 0) dropY = 0;
                            const minutesFromViewStart = dropY / scaleFactor;
                        const snappedMinutes = Math.round(minutesFromViewStart / 15) * 15;
                        setWeeklyDropIndicator({ dayIndex, top: snappedMinutes * scaleFactor, height: dragState.item.duration * scaleFactor });
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
                    const action = task ? getActionById(task.actionId) : undefined;
                    if (action && action.actionType !== 'Marco') {
                        returnTaskToPool(payload);
                    } else if (task) {
                        deleteTask(payload);
                    }
                }
            } else if (isOver(dailyTimelineRect, 150) && viewMode === 'day' && dailyDropIndicator) {
                const dateString = currentDate.toISOString().split('T')[0];
                const minutesFromViewStart = dailyDropIndicator.top / scaleFactor;
                const startTimeInMinutes = minutesFromViewStart + (4 * 60);
                const { type, payload } = dragState.item;
                const scheduledTask = type === 'new_action' ? scheduleTask(payload.actionId, dateString, startTimeInMinutes) : rescheduleTask(payload, dateString, startTimeInMinutes);
                if (scheduledTask && isTutorialActive && currentStep === 7) nextStep();
            } else if (isOver(weeklyGridRect, 150) && viewMode === 'week' && weeklyDropIndicator) {
                const dayIndex = weeklyDropIndicator.dayIndex;
                const startOfWeek = new Date(currentDate);
                const dayOfWeek = startOfWeek.getDay();
                const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                startOfWeek.setDate(diff);
                const dropDate = new Date(startOfWeek);
                dropDate.setDate(dropDate.getDate() + dayIndex);
                const dateString = dropDate.toISOString().split('T')[0];
                const minutesFromViewStart = weeklyDropIndicator.top / scaleFactor;
                const startTimeInMinutes = minutesFromViewStart + (4 * 60);
                const { type, payload } = dragState.item;
                const scheduledTask = type === 'new_action' ? scheduleTask(payload.actionId, dateString, startTimeInMinutes) : rescheduleTask(payload, dateString, startTimeInMinutes);
                if (scheduledTask && isTutorialActive && currentStep === 7) nextStep();
            }
            
            if (scrollContainerRef.current) {
                scrollContainerRef.current.style.overflow = '';
            }

            setDragState({ isDragging: false, item: null, ghostElement: null, pointerOffset: {x: 0, y: 0}, currentPosition: {x: 0, y: 0} });
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
    }, [dragState.isDragging, currentDate, scaleFactor, viewMode, dailyDropIndicator, weeklyDropIndicator]);

    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timerId);
    }, []);

    // Auto-scroll useEffects
     useEffect(() => { if (viewMode === 'day' && scrollContainerRef.current) { const isToday = currentDate.toDateString() === new Date().toDateString(); if (isToday) { const now = new Date(); const currentHour = now.getHours(); if (currentHour < 4) { setTimeout(() => { scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, 200); } else { setTimeout(() => { dailyTimeIndicatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 200); } } } }, [viewMode, currentDate, zoomLevel, currentTime]);
     useEffect(() => { if (viewMode === 'week' && scrollContainerRef.current) { const startOfWeek = new Date(currentDate); const day = startOfWeek.getDay(); const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); startOfWeek.setDate(diff); startOfWeek.setHours(0, 0, 0, 0); const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23, 59, 59, 999); const today = new Date(); if (today >= startOfWeek && today <= endOfWeek) { const currentHour = today.getHours(); if (currentHour < 4) { setTimeout(() => { scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, 200); } else { setTimeout(() => { weeklyTimeIndicatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 200); } } } }, [viewMode, currentDate, zoomLevel, currentTime]);
    
    const milestoneActions = actions.filter(a => a.actionType === 'Marco' && !tasks.some(task => task.actionId === a.id));
    const groupedTaskPool = taskPool.reduce((acc, item) => {
        const existing = acc[item.actionId] || { count: 0, isUnlimited: false };
        const nextUnlimited = existing.isUnlimited || !!item.unlimited;
        const nextCount = nextUnlimited ? 0 : existing.count + 1;
        acc[item.actionId] = { count: nextCount, isUnlimited: nextUnlimited };
        return acc;
    }, {} as Record<string, { count: number; isUnlimited: boolean }>);
    const getActionById = (id: string) => actions.find(a => a.id === id);
    const changeDate = (amount: number) => setCurrentDate(prev => { const newDate = new Date(prev); newDate.setDate(newDate.getDate() + amount); return newDate; });
    const dailyTasks = getTasksForDate(currentDate).filter(t => t.startTime >= 0);
    const allTasksCompleted = checklistItems.every(item => item.completed);
    const isToday = currentDate.toDateString() === new Date().toDateString();

    return (
        <div className="p-2 flex flex-col flex-1 min-h-0 relative">
            {dragState.isDragging && (
                <div style={{ position: 'fixed', top: dragState.currentPosition.y, left: dragState.currentPosition.x, transform: `translate(-${dragState.pointerOffset.x}px, -${dragState.pointerOffset.y}px)`, pointerEvents: 'none', zIndex: 1000 }}>
                    {dragState.ghostElement}
                </div>
            )}
            <div className="flex-shrink-0 z-30 bg-black sticky top-20">
                <div className="relative flex items-center justify-between px-2 text-lg font-bold h-16">
                    <div className="flex items-center space-x-1"><button onClick={() => setChecklistVisible(true)} className="p-1 rounded-full hover:bg-white/10 relative">{allTasksCompleted ? <FolderStarIcon className="w-4 h-4" /> : <FolderIcon className="w-4 h-4" />}</button><button onClick={() => setIsSitrepVisible(true)} className="p-1 rounded-full hover:bg-white/10"><LightbulbIcon className="w-4 h-4" /></button><button onClick={onReportsClick} className="p-1 rounded-full hover:bg-white/10"><ClockIcon className="w-4 h-4" /></button></div>
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center space-x-1"><button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-white/10"><ChevronLeftIcon /></button><span className="uppercase tracking-wider text-base w-32 text-center">{currentDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}</span><button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-white/10"><ChevronRightIcon /></button></div>
                    <div className="flex items-center bg-black/20 rounded-full p-1 text-sm"><button onClick={() => setViewMode('day')} className={`px-2 py-1 rounded-full ${viewMode === 'day' ? 'bg-white/10' : ''}`}>D</button><button onClick={() => setViewMode('week')} className={`px-2 py-1 rounded-full ${viewMode === 'week' ? 'bg-white/10' : ''}`}>S</button></div>
                </div>

                <div className="flex items-center space-x-2 my-0">
                    <div 
                        data-testid="bay-area" 
                        className={`flex-grow bg-black/20 border border-white/10 rounded-3xl p-2 h-[60px] transition-all duration-300 ${isOverBayArea ? 'border-[var(--gold)] ring-2 ring-[var(--gold)] shadow-lg shadow-[var(--gold)]/20' : ''}`}
                    >
                        <div className="flex space-x-2 h-full overflow-x-auto">
                            {Object.entries(groupedTaskPool).length > 0 ? Object.entries(groupedTaskPool).map(([actionId, payload]) => {
                                const action = getActionById(actionId);
                                if (!action) return null;
                                return (<PoolAction key={actionId} action={action} count={payload.count} isUnlimited={payload.isUnlimited} onComplete={scheduleAndCompleteNow} onCustomDragStart={handleCustomDragStart} />);
                            }) : (<div className="w-full h-full flex items-center justify-center text-sm text-gray-500">Sem ações no pool.</div>)}
                        </div>
                    </div>
                    <div className="relative flex-shrink-0">
                        <button onClick={() => setIsMilestonePoolOpen(prev => !prev)} className="w-14 h-[60px] bg-black/20 border border-white/10 rounded-3xl flex items-center justify-center hover:border-white/20 transition-colors"><svg viewBox="0 0 24 24" className="w-6 h-6 text-[var(--accent-silver)] transform rotate-45"><rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor"/></svg></button>
                        {isMilestonePoolOpen && (<div className="absolute top-full right-0 mt-2 w-52 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-2 space-y-1 z-20 animate-fade-in"><h4 className="text-xs font-bold text-center text-gray-400 pb-1 border-b border-white/10">MARCOS</h4>{milestoneActions.length > 0 ? milestoneActions.map(action => (<MilestonePoolAction key={action.id} action={action} onCustomDragStart={handleCustomDragStart} onComplete={scheduleAndCompleteMilestoneNow}/>)) : (<p className="text-xs text-center text-gray-500 py-2">Nenhum marco disponível.</p>)}</div>)}
                    </div>
                </div>
            </div>

            <div ref={scrollContainerRef} className={`flex-grow overflow-y-auto ${dragState.isDragging ? 'touch-none select-none' : ''} relative min-h-0`}>
                <div className={dragState.isDragging ? 'pointer-events-auto' : ''}>
                    {viewMode === 'day' ? (
                        <div>
                            <DayHeader currentDate={currentDate} />
                            <DailyView tasks={dailyTasks} actions={actions} scaleFactor={scaleFactor} onCustomDragStart={handleCustomDragStart} dropIndicator={dailyDropIndicator} isToday={isToday} currentTime={currentTime} timeIndicatorRef={dailyTimeIndicatorRef} />
                        </div>
                    ) : (
                        <WeeklyPlannerGrid currentDate={currentDate} tasks={tasks} actions={actions} onCustomDragStart={handleCustomDragStart} scaleFactor={scaleFactor} stickyHeaderOffset={'0rem'} currentTime={currentTime} timeIndicatorRef={weeklyTimeIndicatorRef} dropIndicator={weeklyDropIndicator} />
                    )}
                </div>
            </div>
            
            {/* Floating Action Button */}
            <div className="fixed bottom-20 right-4 z-20 flex flex-col items-center space-y-2">
                
                {/* Oracle Input Panel */}
                {showOracleInput && (
                    <div className="absolute bottom-full mb-4 right-0 w-72 z-30">
                        <GlassCard variant="gold" className="p-2 backdrop-blur-xl border border-[var(--gold)]/30 shadow-2xl">
                            <div className="flex flex-col space-y-2">
                                <label className="text-[10px] uppercase font-bold text-[var(--gold)] tracking-wider ml-1">Oráculo</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        ref={oracleInputRef}
                                        type="text"
                                        value={oracleInput}
                                        onChange={(e) => setOracleInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ação @ Arena..."
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--gold)]/50 placeholder-gray-500"
                                    />
                                    <button 
                                        onClick={handleOracleSubmit}
                                        className="p-2 bg-[var(--gold)] text-black rounded-lg hover:bg-yellow-400 transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="text-[10px] text-gray-400 px-1">
                                    Ex: "Ler Livro @ Estudos" ou apenas "Ler Livro"
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                )}

                <div className="flex flex-col items-center bg-black/50 backdrop-blur-lg border border-[var(--glass-border)] rounded-full p-1 space-y-1">
                    <button 
                        onClick={() => setShowOracleInput(!showOracleInput)} 
                        className={`p-2 rounded-full transition-all ${showOracleInput ? 'bg-[var(--gold)] text-black' : 'text-white hover:bg-white/10'}`}
                        title="Adicionar por texto"
                    >
                        <span className="text-lg">📝</span>
                    </button>
                    <div className="w-full h-px bg-white/10 my-1"></div>
                    <button onClick={() => setZoomLevel(prev => Math.min(3, prev + 1) as 1 | 2 | 3)} disabled={zoomLevel === 3} className="p-2 disabled:opacity-50"><PlusIcon className="w-5 h-5" /></button>
                    <span className="font-bold text-xs text-white">{zoomLevel}x</span>
                    <button onClick={() => setZoomLevel(prev => Math.max(1, prev - 1) as 1 | 2 | 3)} disabled={zoomLevel === 1} className="p-2 disabled:opacity-50"><MinusIcon className="w-5 h-5" /></button>
                </div>
                <button onClick={() => setIsActionModalOpen(true)} className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-black/50 transform hover:scale-110 transition-transform"><PlusIcon className="w-8 h-8 text-black" /></button>
            </div>
            {isChecklistVisible && <ChecklistModal onClose={() => setChecklistVisible(false)} />}
            {isSitrepVisible && <SitrepModal onClose={() => setIsSitrepVisible(false)} />}
            {isActionModalOpen && <ActionModal arenaId="" action={null} initialMode="edit" onClose={() => setIsActionModalOpen(false)} />}
        </div>
    );
};
