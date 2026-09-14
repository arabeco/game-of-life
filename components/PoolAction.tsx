

import React, { useRef, useState, useEffect } from 'react';
import { Action } from '../types';
import { useGame } from '../contexts/GameContext';
import { useTutorial } from '../contexts/TutorialContext';
import { useLongPress } from '../hooks/useLongPress';
import { EmojiGlyph } from './EmojiGlyph';

interface PoolActionProps {
    action: Action;
    count: number;
    isUnlimited?: boolean;
    taskId?: string; // Optional taskId for existing tasks in Bay Area
    onComplete: (actionId: string, taskId?: string) => void;
    onCustomDragStart: (event: MouseEvent | TouchEvent, item: any, ghost: React.ReactNode, ref: React.RefObject<HTMLDivElement>) => void;
    onActionClick?: (action: Action) => void;
}

const getFreeActionColorStyle = (
    backgroundStyle: React.CSSProperties,
    extra: React.CSSProperties = {},
): React.CSSProperties => ({
    ...extra,
    ['--free-action-bg' as string]: String(backgroundStyle.background || 'var(--asset-grad-default)'),
});

export const PoolAction: React.FC<PoolActionProps> = ({ action, count, isUnlimited, taskId, onComplete, onCustomDragStart, onActionClick }) => {
    const { getActionBackgroundStyle, getClanQuestProgress, getClanQuestForActionName } = useGame();
    const [isHolding, setIsHolding] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const poolActionRef = useRef<HTMLDivElement>(null);
    const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isDisabled = false; 

    const clanQuest = getClanQuestForActionName(action.name);
    let clanProgressDisplay = null;
    let isCompleted = false;

    if (clanQuest) {
        const current = getClanQuestProgress(clanQuest.id);
        const target = clanQuest.requirements?.clanGoal || clanQuest.goal_value || 50;
        const remaining = Math.max(0, target - current);
        clanProgressDisplay = `${remaining}`; 
        isCompleted = current >= target;
    }

    useEffect(() => {
        return () => {
            if (completionTimeout.current) {
                clearTimeout(completionTimeout.current);
            }
        };
    }, []);

    const backgroundStyle = getActionBackgroundStyle(action.id);
    const isFreeAction = action.actionType === 'Livre';
    // Marco mora na bay junto das outras acoes, mas nao se parece com elas: a
    // aba separada saiu e a forma passou a ser o que o distingue. Ver o bloco
    // MARCO em index.css.
    const isMilestone = action.actionType === 'Marco';

    const handleLongPress = () => {
        if (isTransitioning) return;
        setIsHolding(true);
        setIsTransitioning(true);
        if (completionTimeout.current) clearTimeout(completionTimeout.current);
        completionTimeout.current = setTimeout(() => {
            onComplete(action.id, taskId); // Pass taskId if available
            setIsHolding(false);
            setIsTransitioning(false);
        }, 1000);
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
        onActionClick?.(action);
    };

    const handleDragStart = (e: MouseEvent | TouchEvent) => {
        const ghost = (
            <div
                style={isMilestone ? { width: '48px', height: '48px' } : isFreeAction ?getFreeActionColorStyle(backgroundStyle, { width: '48px', height: '48px' }) : { ...backgroundStyle, width: '48px', height: '48px' }}
                className={`aspect-square flex items-center justify-center p-1 opacity-80 ${isMilestone ?'marco-losango' : isFreeAction ?'free-action-shell free-action-outline rounded-2xl' : 'border border-[var(--accent-bronze)] rounded-xl'}`}
            >
                <EmojiGlyph symbol={action.icon || (isMilestone ? '\u{1F3C1}' : '\u{1F4DD}')} size="picker" className={isMilestone ? 'text-[#241a07]' : 'text-white'} />
            </div>
        );
        const duration = action.actionType === 'Marco' ?Math.max(15, action.duration) : action.duration;
        
        // Se temos um taskId (tarefa na espera), o tipo deve ser 'reschedule_task' para que o Planner saiba que é uma tarefa existente
        // e não crie uma nova. Se for 'new_action', ele cria uma nova.
        const item = taskId 
            ?{ type: 'reschedule_task', payload: taskId, duration } // Mudado de 'task' para 'reschedule_task'
            : { type: 'new_action', payload: { actionId: action.id }, duration };
            
        onCustomDragStart(e, item, ghost, poolActionRef);
    };

    const longPressEvents = useLongPress({
        onLongPress: handleLongPress, // Habilitado sempre
        onLongPressCancel: cancelLongPress,
        onLongPressRelease: cancelLongPress,
        onDragStart: handleDragStart,
        onClick: handleClick,
        delay: 300,
        dragThreshold: 20,
        preventDefaultOnTouch: false,
        touchDragRequiresLongPress: true,
    });

    return (
        <div
            ref={poolActionRef}
            data-action-id={action.id}
            {...longPressEvents}
            style={isMilestone ? undefined : isFreeAction ?getFreeActionColorStyle(backgroundStyle) : backgroundStyle}
            className={`
                h-full aspect-square flex items-center justify-center p-1 flex-shrink-0 relative transition-all duration-300 select-none
                ${isMilestone ?'marco-losango marco-halo-wrap marco-borda-interna' : isFreeAction ?'free-action-shell free-action-outline rounded-2xl' : 'border border-[var(--accent-bronze)]/50 rounded-xl'}
                ${isDisabled ?'border-gray-700' : isMilestone ?'cursor-grab active:cursor-grabbing hover:scale-110 active:scale-95' : isFreeAction ?'cursor-grab active:cursor-grabbing hover:border-white/35 hover:scale-[1.03] active:scale-95' : 'cursor-grab active:cursor-grabbing hover:border-[var(--skin-accent-color)]/50 hover:scale-105 active:scale-95'}
            `}
        >
            <EmojiGlyph symbol={action.icon || (isMilestone ? '\u{1F3C1}' : '\u{1F4DD}')} size={isMilestone ? 'milestone' : 'action'} className={`${isHolding ?'scale-110' : ''} transition-transform ${isMilestone ?'relative z-10 text-[#241a07] drop-shadow-[0_1px_1px_rgba(253,241,196,0.55)]' : 'text-white'} ${isFreeAction ?'drop-shadow-[0_0_8px_rgba(191,205,223,0.16)]' : ''}`.trim()} />

            {!clanProgressDisplay && !isFreeAction && !isMilestone && (isUnlimited || count >= 1) && (
                <div className={`absolute -top-1 -right-1 text-[9px] font-black rounded-full min-w-[14px] h-[14px] px-0.5 flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 ${isFreeAction ?'free-action-chip text-[rgba(234,239,246,0.92)]' : `${count <= 0 ?'bg-gray-500/80' : 'bg-[var(--bronze)]'} text-black border border-black/20`}`}>
                    {isUnlimited ?'∞' : `${count}`}
                </div>
            )}


            {clanProgressDisplay && (
                <div className={`absolute -top-1 -right-1 ${isCompleted ?'bg-green-500' : 'bg-yellow-500'} text-black text-[9px] font-bold px-1 rounded-full border border-black min-w-[20px] text-center shadow-lg z-10`}>
                    {clanProgressDisplay}
                </div>
            )}

            {/* Progress bar logic if holding */}
            {isTransitioning && (
                <div className={`absolute inset-0 overflow-hidden pointer-events-none ${isMilestone ?'marco-losango bg-green-500/25' : isFreeAction ?'rounded-2xl bg-white/10' : 'bg-green-500/20 rounded-xl'}`} style={isMilestone ? { background: 'rgba(34,197,94,0.25)' } : undefined}>
                    <div className={`h-full animate-progress-fill origin-left ${isFreeAction ?'bg-white/20' : 'bg-green-500/40'}`} />
                </div>
            )}

            {isHolding && (
                <div className={`absolute inset-0 bg-black/50 animate-pulse pointer-events-none ${isMilestone ?'marco-losango' : isFreeAction ?'rounded-2xl' : 'rounded-xl'}`} style={isMilestone ? { background: 'rgba(0,0,0,0.5)' } : undefined}>
                    <div className={`h-full w-full opacity-50 animate-[fill_3s_linear_forwards] ${isFreeAction ?'bg-slate-200/40' : 'bg-[var(--bronze)]'}`} style={{ clipPath: 'inset(100% 0 0 0)' }}></div>
                </div>
            )}
            <style>{`
                @keyframes fill {
                    to { clip-path: inset(0% 0 0 0); }
                }
            `}</style>
        </div>
    );
};




