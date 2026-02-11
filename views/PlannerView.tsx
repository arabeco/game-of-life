


import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, FolderIcon, DollarSignIcon, FolderStarIcon, FlameIcon, LightbulbIcon, PlusIcon, MinusIcon } from '../components/Icons';
import { useGame } from '../contexts/GameContext';
import { Action, ScheduledTask } from '../types';
import { ChecklistModal } from '../components/ChecklistModal';
import { WeeklyPlannerGrid } from '../components/WeeklyPlannerGrid';
import { PoolAction } from '../components/PoolAction';
import { DropIndicator } from '../components/DropIndicator';
import { SitrepModal } from '../components/SitrepModal';
import { MilestonePoolAction } from '../components/MilestonePoolAction';
import { ActionModal } from '../components/ActionModal';
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
    const { getAssetForAction, toggleTaskCompletion } = useGame();
    const { isTutorialActive, currentStep, nextStep, setSpotlight } = useTutorial();
    const [isHolding, setIsHolding] = useState(false);
    const [showSparkles, setShowSparkles] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const taskRef = useRef<HTMLDivElement>(null);
    const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isTutorialActive && currentStep === 8 && taskRef.current) {
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
        return () => {
            if (completionTimeout.current) {
                clearTimeout(completionTimeout.current);
            }
        };
    }, []);

    const asset = action ? getAssetForAction(action.id) : undefined;
    const backgroundStyle = { background: `var(--asset-grad-${asset?.id || 'default'})` };
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
                style={{ top: `${top}px`, height: `${height}px` }}
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
            style={{ top: `${top}px`, height: `${height}px`, minHeight: `${30 * scaleFactor}px`}}
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
    const { actions, taskPool, scheduleTask, getTasksForDate, tasks, checklistItems, rescheduleTask, returnTaskToPool, deleteTask, scheduleAndCompleteNow, scheduleAndCompleteMilestoneNow } = useGame();
    const { isTutorialActive, currentStep, nextStep, setSpotlight } = useTutorial();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const [isChecklistVisible, setChecklistVisible] = useState(false);
    const [isSitrepVisible, setIsSitrepVisible] = useState(false);
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

    const handleCustomDragStart = ( event: MouseEvent | TouchEvent, item: { type: string; payload: any; duration: number; }, ghostElement: React.ReactNode, draggedElementRef: React.RefObject<HTMLDivElement> ) => {
        const isTouchEvent = 'touches' in event;
        const pos = isTouchEvent ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : { x: event.clientX, y: event.clientY };
        const elemRect = draggedElementRef.current?.getBoundingClientRect();
        const offset = elemRect ? { x: pos.x - elemRect.left, y: pos.y - elemRect.top } : { x: 0, y: 0 };
        if (isTutorialActive && (currentStep === 7 || currentStep === 8)) setSpotlight(null, null);
        setIsMilestonePoolOpen(false);
        setDragState({ isDragging: true, item, ghostElement, pointerOffset: offset, currentPosition: pos });
    };

    useEffect(() => {
        const handleDragMove = (e: MouseEvent | TouchEvent) => {
            if ('touches' in e) e.preventDefault();
            const isTouchEvent = 'touches' in e;
            const pos = isTouchEvent ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
            setDragState(prev => ({ ...prev, currentPosition: pos }));
            
            const bayAreaEl = document.querySelector('[data-testid="bay-area"]');
            const bayAreaRect = bayAreaEl?.getBoundingClientRect();
            const isOverBayAreaCheck = (rect: DOMRect | undefined) => rect ? (pos.y > rect.top && pos.y < rect.bottom && pos.x > rect.left && pos.x < rect.right) : false;

            if (dragState.item?.type === 'reschedule_task' && isOverBayAreaCheck(bayAreaRect)) {
                setIsOverBayArea(true);
                setDailyDropIndicator(null);
                setWeeklyDropIndicator(null);
            } else {
                setIsOverBayArea(false);
                if (viewMode === 'day' && scrollContainerRef.current && dragState.item) {
                    setWeeklyDropIndicator(null);
                    const dailyViewEl = scrollContainerRef.current.querySelector('[data-testid="daily-timeline"] .flex-grow.relative.border-l');
                    if (!dailyViewEl) return;
                    const gridRect = dailyViewEl.getBoundingClientRect();
                    if (pos.y < gridRect.top || pos.y > gridRect.bottom) { setDailyDropIndicator(null); return; }
                    let dropY = pos.y - gridRect.top;
                    const minutesFromViewStart = dropY / scaleFactor;
                    const snappedMinutes = Math.round(minutesFromViewStart / 15) * 15;
                    setDailyDropIndicator({ top: snappedMinutes * scaleFactor, height: dragState.item.duration * scaleFactor });
                } else if (viewMode === 'week' && scrollContainerRef.current && dragState.item) {
                    setDailyDropIndicator(null);
                    const weeklyGridEl = scrollContainerRef.current.querySelector('[data-testid="weekly-grid"]');
                    if (!weeklyGridEl) { setWeeklyDropIndicator(null); return; }
                    const daysContainer = weeklyGridEl.querySelector('.flex-grow.grid.grid-cols-7');
                    if (!daysContainer) { setWeeklyDropIndicator(null); return; }
                    const containerRect = daysContainer.getBoundingClientRect();
                    if (pos.x > containerRect.left && pos.x < containerRect.right && pos.y > containerRect.top && pos.y < containerRect.bottom) {
                        const dayColumnWidth = containerRect.width / 7;
                        let dayIndex = Math.floor((pos.x - containerRect.left) / dayColumnWidth);
                        dayIndex = Math.max(0, Math.min(6, dayIndex));
                        const headerHeight = 32;
                        let dropY = pos.y - containerRect.top - headerHeight;
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
            
            const dailyTimelineEl = scrollContainerRef.current?.querySelector('[data-testid="daily-timeline"] .flex-grow.relative.border-l');
            const weeklyGridEl = scrollContainerRef.current?.querySelector('[data-testid="weekly-grid"]');
            const bayAreaEl = document.querySelector('[data-testid="bay-area"]');
            
            const bayAreaRect = bayAreaEl?.getBoundingClientRect();
            const dailyTimelineRect = dailyTimelineEl?.getBoundingClientRect();
            const weeklyGridRect = weeklyGridEl?.getBoundingClientRect();

            const isOver = (rect: DOMRect | undefined) => {
                if (!rect || !pos) return false;
                return pos.y > rect.top && pos.y < rect.bottom && pos.x > rect.left && pos.x < rect.right;
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
            } else if (isOver(dailyTimelineRect) && viewMode === 'day' && dailyDropIndicator) {
                const dateString = currentDate.toISOString().split('T')[0];
                const minutesFromViewStart = dailyDropIndicator.top / scaleFactor;
                const startTimeInMinutes = minutesFromViewStart + (4 * 60);
                const { type, payload } = dragState.item;
                const scheduledTask = type === 'new_action' ? scheduleTask(payload.actionId, dateString, startTimeInMinutes) : rescheduleTask(payload, dateString, startTimeInMinutes);
                if (scheduledTask && isTutorialActive && currentStep === 7) nextStep();
            } else if (isOver(weeklyGridRect) && viewMode === 'week' && weeklyDropIndicator) {
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
            
            setDragState({ isDragging: false, item: null, ghostElement: null, pointerOffset: {x: 0, y: 0}, currentPosition: {x: 0, y: 0} });
            setDailyDropIndicator(null);
            setWeeklyDropIndicator(null);
            setIsOverBayArea(false);
        };

        if (dragState.isDragging) {
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove, { passive: false });
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
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
    const groupedTaskPool = taskPool.reduce((acc, item) => { acc[item.actionId] = (acc[item.actionId] || 0) + 1; return acc; }, {} as Record<string, number>);
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
            <div className="flex-shrink-0 z-20 bg-black">
                <div className="relative flex items-center justify-between px-2 text-lg font-bold h-16">
                    <div className="flex items-center space-x-1"><button onClick={() => setChecklistVisible(true)} className="p-1 rounded-full hover:bg-white/10 relative">{allTasksCompleted ? <FolderStarIcon className="w-5 h-5" /> : <FolderIcon className="w-5 h-5" />}</button><button onClick={() => setIsSitrepVisible(true)} className="p-1 rounded-full hover:bg-white/10"><LightbulbIcon className="w-5 h-5" /></button><button onClick={onReportsClick} className="p-1 rounded-full hover:bg-white/10"><ClockIcon className="w-5 h-5" /></button></div>
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center space-x-1"><button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-white/10"><ChevronLeftIcon /></button><span className="uppercase tracking-wider text-base w-32 text-center">{currentDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}</span><button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-white/10"><ChevronRightIcon /></button></div>
                    <div className="flex items-center bg-black/20 rounded-full p-1 text-sm"><button onClick={() => setViewMode('day')} className={`px-2 py-1 rounded-full ${viewMode === 'day' ? 'bg-white/10' : ''}`}>D</button><button onClick={() => setViewMode('week')} className={`px-2 py-1 rounded-full ${viewMode === 'week' ? 'bg-white/10' : ''}`}>S</button></div>
                </div>
            
                <div className="flex items-center space-x-2 my-4">
                    <div 
                        data-testid="bay-area" 
                        className={`flex-grow bg-black/20 border border-white/10 rounded-3xl p-2 h-[60px] transition-all duration-300 ${isOverBayArea ? 'border-[var(--gold)] ring-2 ring-[var(--gold)] shadow-lg shadow-[var(--gold)]/20' : ''}`}
                    >
                        <div className="flex space-x-2 h-full overflow-x-auto">
                            {Object.entries(groupedTaskPool).length > 0 ? Object.entries(groupedTaskPool).map(([actionId, count]) => {
                                const action = getActionById(actionId);
                                if (!action) return null;
                                return (<PoolAction key={actionId} action={action} count={count} onComplete={scheduleAndCompleteNow} onCustomDragStart={handleCustomDragStart} />);
                            }) : (<div className="w-full h-full flex items-center justify-center text-sm text-gray-500">Sem ações no pool.</div>)}
                        </div>
                    </div>
                    <div className="relative flex-shrink-0">
                        <button onClick={() => setIsMilestonePoolOpen(prev => !prev)} className="w-14 h-[60px] bg-black/20 border border-white/10 rounded-3xl flex items-center justify-center hover:border-white/20 transition-colors"><svg viewBox="0 0 24 24" className="w-6 h-6 text-[var(--accent-silver)] transform rotate-45"><rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor"/></svg></button>
                        {isMilestonePoolOpen && (<div className="absolute top-full right-0 mt-2 w-52 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-2 space-y-1 z-20 animate-fade-in"><h4 className="text-xs font-bold text-center text-gray-400 pb-1 border-b border-white/10">MARCOS</h4>{milestoneActions.length > 0 ? milestoneActions.map(action => (<MilestonePoolAction key={action.id} action={action} onCustomDragStart={handleCustomDragStart} onComplete={scheduleAndCompleteMilestoneNow}/>)) : (<p className="text-xs text-center text-gray-500 py-2">Nenhum marco disponível.</p>)}</div>)}
                    </div>
                </div>
            </div>

            <div ref={scrollContainerRef} className="flex-grow overflow-y-auto relative min-h-0">
                {viewMode === 'day' ? (
                     <div>
                        <DayHeader currentDate={currentDate} />
                        <DailyView tasks={dailyTasks} actions={actions} scaleFactor={scaleFactor} onCustomDragStart={handleCustomDragStart} dropIndicator={dailyDropIndicator} isToday={isToday} currentTime={currentTime} timeIndicatorRef={dailyTimeIndicatorRef} />
                    </div>
                ) : (
                    <WeeklyPlannerGrid currentDate={currentDate} tasks={tasks} actions={actions} onCustomDragStart={handleCustomDragStart} scaleFactor={scaleFactor} stickyHeaderOffset={'0rem'} currentTime={currentTime} timeIndicatorRef={weeklyTimeIndicatorRef} dropIndicator={weeklyDropIndicator} />
                )}
            </div>
            
            <div className="fixed bottom-20 right-4 z-20 flex flex-col items-center space-y-2">
                <div className="flex flex-col items-center bg-black/50 backdrop-blur-lg border border-[var(--glass-border)] rounded-full p-1 space-y-1"><button onClick={() => setZoomLevel(prev => Math.min(3, prev + 1) as 1 | 2 | 3)} disabled={zoomLevel === 3} className="p-2 disabled:opacity-50"><PlusIcon className="w-5 h-5" /></button><span className="font-bold text-xs text-white">{zoomLevel}x</span><button onClick={() => setZoomLevel(prev => Math.max(1, prev - 1) as 1 | 2 | 3)} disabled={zoomLevel === 1} className="p-2 disabled:opacity-50"><MinusIcon className="w-5 h-5" /></button></div>
                <button onClick={() => setIsActionModalOpen(true)} className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-black/50 transform hover:scale-110 transition-transform"><PlusIcon className="w-8 h-8 text-black" /></button>
            </div>
            {isChecklistVisible && <ChecklistModal onClose={() => setChecklistVisible(false)} />}
            {isSitrepVisible && <SitrepModal onClose={() => setIsSitrepVisible(false)} />}
            {isActionModalOpen && <ActionModal arenaId="" action={null} initialMode="edit" onClose={() => setIsActionModalOpen(false)} />}
        </div>
    );
};
