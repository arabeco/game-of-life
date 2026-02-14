

import React, { useRef, useState, useEffect } from 'react';
import { Action } from '../types';
import { useGame } from '../contexts/GameContext';
import { useTutorial } from '../contexts/TutorialContext';
import { useLongPress } from '../hooks/useLongPress';

interface PoolActionProps {
    action: Action;
    count: number;
    onComplete: (actionId: string) => void;
    onCustomDragStart: (event: MouseEvent | TouchEvent, item: any, ghost: React.ReactNode, ref: React.RefObject<HTMLDivElement>) => void;
}

export const PoolAction: React.FC<PoolActionProps> = ({ action, count, onComplete, onCustomDragStart }) => {
    const { getAssetForAction } = useGame();
    const { isTutorialActive, currentStep, setSpotlight } = useTutorial();
    const [isHolding, setIsHolding] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const poolActionRef = useRef<HTMLDivElement>(null);
    const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isTutorialActive && currentStep === 7 && poolActionRef.current) {
             const rect = poolActionRef.current.getBoundingClientRect();
             setSpotlight(rect, {
                title: "Passo 7: Agende sua Ação",
                text: "Arraste esta ação para a sua linha do tempo para agendá-la em um horário específico.",
            });
        }
    }, [isTutorialActive, currentStep, setSpotlight]);

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

    const asset = getAssetForAction(action.id);
    const backgroundStyle = { background: `var(--asset-grad-${asset?.id || 'default'})` };

    const handleLongPress = () => {
        if (isTransitioning) return;
        setIsHolding(true);
        setIsTransitioning(true);
        if (completionTimeout.current) clearTimeout(completionTimeout.current);
        completionTimeout.current = setTimeout(() => {
            onComplete(action.id);
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
            {count > 1 && <div className="absolute -top-1 -right-1 bg-[var(--bronze)] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">x{count}</div>}
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
