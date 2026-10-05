

import React, { useRef, useState, useEffect } from 'react';
import { Action } from '../types';
import { useGame } from '../contexts/GameContext';
import { usePlannerDragHold, BAIA_ENCHER_MS } from '../hooks/usePlannerDragHold';
import { EmojiGlyph } from './EmojiGlyph';

interface MilestonePoolActionProps {
    action: Action;
    onComplete: (actionId: string) => void;
    onCustomDragStart: (event: MouseEvent | TouchEvent, item: any, ghost: React.ReactNode, ref: React.RefObject<HTMLDivElement>) => void;
    onActionClick?: (action: Action) => void;
}

export const MilestonePoolAction: React.FC<MilestonePoolActionProps> = ({ action, onComplete, onCustomDragStart, onActionClick }) => {
    const { getActionBackgroundStyle } = useGame();
    const [isHolding, setIsHolding] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const milestoneRef = useRef<HTMLDivElement>(null);
    const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const el = milestoneRef.current;
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
        }, BAIA_ENCHER_MS);
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
             <div style={backgroundStyle} className="w-10 h-10 flex-shrink-0 flex items-center justify-center transform rotate-45 bg-gray-700 rounded-md border border-[var(--accent-bronze)] opacity-80">
                <EmojiGlyph symbol={action.icon || '🏆'} size="milestone" className="transform -rotate-45 text-white" />
            </div>
        );
        const duration = action.actionType === 'Marco' ? Math.max(15, action.duration) : action.duration;
        const item = { type: 'new_action', payload: { actionId: action.id }, duration };
        onCustomDragStart(e, item, ghost, milestoneRef);
    };

    // O marco da baia arrastava ao primeiro movimento: varrer a baia para o
    // lado arrastava o marco em vez de rolar. Agora pega como as outras pecas.
    const { events: longPressEvents, erguido } = usePlannerDragHold({
        onTap: handleClick,
        onDrag: handleDragStart,
        onHoldStart: handleLongPress,
        onHoldCancel: cancelLongPress,
        dragThreshold: 20,
    });

    return (
        <div
            ref={milestoneRef}
            {...longPressEvents}
            className={`flex items-center space-x-2 p-1 rounded-lg hover:bg-white/10 cursor-grab relative select-none${erguido ? ' planner-erguido' : ''}`}
        >
            <div
                style={backgroundStyle}
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center transform rotate-45 bg-gray-700 rounded-md border border-[var(--accent-bronze)]"
            >
                <EmojiGlyph symbol={action.icon || '🏆'} size="milestone" className="transform -rotate-45 text-white" />
            </div>
            <span className="text-xs truncate">{action.name}</span>

            {isHolding && (
                <div className="absolute inset-0 bg-black/50 rounded-lg animate-pulse">
                    <div className="h-full w-full bg-[var(--accent-bronze)] opacity-50 animate-[fill_3s_linear_forwards]" style={{ clipPath: 'inset(100% 0 0 0)', animationDuration: `${BAIA_ENCHER_MS}ms` }}></div>
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
