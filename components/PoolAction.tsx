

import React, { useRef, useState, useEffect } from 'react';
import { Action } from '../types';
import { useGame } from '../contexts/GameContext';
import { useTutorial } from '../contexts/TutorialContext';
import { useLongPress } from '../hooks/useLongPress';
import { SEASONS, ACTIVE_SEASON_ID } from '../constants/GMboard';

interface PoolActionProps {
    action: Action;
    count: number;
    isUnlimited?: boolean;
    onComplete: (actionId: string) => void;
    onCustomDragStart: (event: MouseEvent | TouchEvent, item: any, ghost: React.ReactNode, ref: React.RefObject<HTMLDivElement>) => void;
    onActionClick?: (action: Action) => void;
}

export const PoolAction: React.FC<PoolActionProps> = ({ action, count, isUnlimited, onComplete, onCustomDragStart, onActionClick }) => {
    const { getActionBackgroundStyle, getArenas, seasonQuests, getClanQuestProgress } = useGame();
    const [isHolding, setIsHolding] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const poolActionRef = useRef<HTMLDivElement>(null);
    const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const arenas = getArenas() || [];
    const arena = arenas.find(a => a.id === action.arenaId);
    
    const quests = (Array.isArray(seasonQuests) ? seasonQuests : []) || [];
    
    // Improved detection: Check if action matches a clan quest template
    // Also check if the arena itself is a Clan Quest arena as a fallback
    let clanQuest = quests.length > 0 ? quests.find(q => 
        (q.type === 'clan' && q.actionTemplate?.name === action.name) ||
        (q.id === 'quest-clan-unity' && (action.name.includes('Socializar') || action.name.includes('socializar')))
    ) : undefined;
    
    if (!clanQuest && arena) {
        const normalizedArenaName = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (normalizedArenaName.includes('quests - cla')) {
             // If we are in a clan arena, try to find the quest by other means or assume it's the clan unity quest if name is similar
             if (action.name.includes('Socializar') || action.name.includes('socializar')) {
                 clanQuest = quests.find(q => q.id === 'quest-clan-unity');
             }
        }
    }

    let clanProgressDisplay = null;
    let isCompleted = false;

    if (clanQuest) {
        const current = getClanQuestProgress(clanQuest.id);
        const target = clanQuest.requirements?.clanGoal || 50;
        const remaining = Math.max(0, target - current);
        clanProgressDisplay = `${remaining}`; // Show remaining count
        isCompleted = current >= target;
    }

    useEffect(() => {
        const el = poolActionRef.current;
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

    const backgroundStyle = getActionBackgroundStyle(action.id);

    const handleLongPress = () => {
        if (isTransitioning) return;
        setIsHolding(true);
        setIsTransitioning(true);
        if (completionTimeout.current) clearTimeout(completionTimeout.current);
        completionTimeout.current = setTimeout(() => {
            onComplete(action.id);
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
            <div style={{...backgroundStyle, width: '48px', height: '48px'}} className="aspect-square border border-[var(--accent-bronze)] rounded-xl flex items-center justify-center p-1 opacity-80">
                 <span className="text-2xl">{action.icon}</span>
            </div>
        );
        const duration = action.actionType === 'Marco' ? Math.max(15, action.duration) : action.duration;
        const item = { type: 'new_action', payload: { actionId: action.id }, duration };
        onCustomDragStart(e, item, ghost, poolActionRef);
    };

    const longPressEvents = useLongPress({
      onLongPress: handleLongPress,
      onLongPressCancel: cancelLongPress,
      onLongPressRelease: cancelLongPress,
      onDragStart: handleDragStart,
      onClick: handleClick,
      delay: 300,
    });

    return (
        <div 
            ref={poolActionRef}
            {...longPressEvents}
            style={backgroundStyle}
            className="h-full aspect-square border border-[var(--accent-bronze)] rounded-xl flex items-center justify-center p-1 flex-shrink-0 cursor-grab active:cursor-grabbing relative"
        >
            <span className="text-2xl">{action.icon}</span>
            {!clanProgressDisplay && (isUnlimited || count > 1) && <div className="absolute -top-1 -right-1 bg-[var(--bronze)] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{isUnlimited ? '∞' : `x${count}`}</div>}
            {clanProgressDisplay && (
                <div className={`absolute -top-1 -right-1 ${isCompleted ? 'bg-green-500' : 'bg-yellow-500'} text-black text-[9px] font-bold px-1 rounded-full border border-black min-w-[24px] text-center shadow-lg z-10`}>
                    {clanProgressDisplay}
                </div>
            )}
            {isHolding && (
                <div className="absolute inset-0 bg-black/50 rounded-xl animate-pulse">
                    <div className="h-full w-full bg-[var(--bronze)] opacity-50 animate-[fill_3s_linear_forwards]" style={{clipPath: 'inset(100% 0 0 0)'}}></div>
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
