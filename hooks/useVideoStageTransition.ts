import { useCallback, useEffect, useRef, useState } from 'react';

interface UseVideoStageTransitionOptions {
    enabled: boolean;
    revealDelayMs?: number;
    fadeDurationMs?: number;
}

export const useVideoStageTransition = ({
    enabled,
    revealDelayMs = 4500,
    fadeDurationMs = 320,
}: UseVideoStageTransitionOptions) => {
    const [showVideoStage, setShowVideoStage] = useState(enabled);
    const [showContentStage, setShowContentStage] = useState(!enabled);
    const [isVideoFading, setIsVideoFading] = useState(false);
    const revealStartedRef = useRef(false);
    const safetyTimerRef = useRef<number | null>(null);
    const transitionTimerRef = useRef<number | null>(null);

    const clearTimers = useCallback(() => {
        if (safetyTimerRef.current !== null) {
            window.clearTimeout(safetyTimerRef.current);
            safetyTimerRef.current = null;
        }
        if (transitionTimerRef.current !== null) {
            window.clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
        }
    }, []);

    const triggerReveal = useCallback(() => {
        if (!enabled || revealStartedRef.current) return;

        revealStartedRef.current = true;
        clearTimers();
        setIsVideoFading(true);
        transitionTimerRef.current = window.setTimeout(() => {
            setShowVideoStage(false);
            setShowContentStage(true);
            setIsVideoFading(false);
            transitionTimerRef.current = null;
        }, fadeDurationMs);
    }, [clearTimers, enabled, fadeDurationMs]);

    useEffect(() => {
        clearTimers();
        revealStartedRef.current = false;

        if (!enabled) {
            setShowVideoStage(false);
            setShowContentStage(true);
            setIsVideoFading(false);
            return;
        }

        setShowVideoStage(true);
        setShowContentStage(false);
        setIsVideoFading(false);
        safetyTimerRef.current = window.setTimeout(triggerReveal, revealDelayMs);

        return clearTimers;
    }, [clearTimers, enabled, revealDelayMs, triggerReveal]);

    return {
        showVideoStage,
        showContentStage,
        isVideoFading,
        triggerReveal,
    };
};
