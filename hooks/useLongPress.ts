

import React, { useCallback, useRef, useEffect } from 'react';
import { lockTouchHoldSelection } from '../utils/touchHoldSelection';

interface LongPressOptions {
    onLongPress: (event: React.MouseEvent | React.TouchEvent) => void;
    onLongPressCancel?: () => void;
    onLongPressRelease?: () => void;
    onClick?: (event: React.MouseEvent | React.TouchEvent) => void;
    onDragStart?: (event: MouseEvent | TouchEvent) => void;
    delay?: number;
    dragThreshold?: number;
    preventDefaultOnTouch?: boolean;
}

const isTouchEvent = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): e is TouchEvent | React.TouchEvent => 'touches' in e;

export const useLongPress = (options: LongPressOptions) => {
    const optionsRef = useRef(options);
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const state = useRef<'idle' | 'pending' | 'longpress' | 'drag'>('idle');
    const startPos = useRef({ x: 0, y: 0 });
    const releaseSelectionLockRef = useRef<(() => void) | null>(null);

    const shouldPreventTouchDefault = () => optionsRef.current.preventDefaultOnTouch ?? true;

    const getCoords = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
        return isTouchEvent(e) ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
    };
    
    let handleMove: (e: MouseEvent | TouchEvent) => void;
    let handleUp: (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => void;

    const cleanup = useCallback(() => {
        if (timeout.current) {
            clearTimeout(timeout.current);
            timeout.current = null;
        }
        if (releaseSelectionLockRef.current) {
            releaseSelectionLockRef.current();
            releaseSelectionLockRef.current = null;
        }
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('touchend', handleUp);
    }, []);

    handleMove = useCallback((e: MouseEvent | TouchEvent) => {
        // Allow move handler to run in 'longpress' state to detect a drag-after-longpress-trigger.
        if (state.current !== 'pending' && state.current !== 'longpress') return;

        const { dragThreshold = 10, onDragStart, onLongPressCancel } = optionsRef.current;
        if (shouldPreventTouchDefault() && isTouchEvent(e) && e.cancelable) {
            e.preventDefault();
        }
        const currentPos = getCoords(e);
        const dx = currentPos.x - startPos.current.x;
        const dy = currentPos.y - startPos.current.y;

        if (Math.sqrt(dx * dx + dy * dy) > dragThreshold) {
            // If a drag is detected, cancel any long-press that might have just started.
            if (state.current === 'longpress') {
                onLongPressCancel?.();
            }
            state.current = 'drag';
            cleanup();
            if (onDragStart) {
                onDragStart(e);
            }
        }
    }, [cleanup]);

    handleUp = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const { onClick, onLongPressRelease } = optionsRef.current;
        if (state.current === 'pending') {
            if (onClick) {
                onClick(e as any);
            }
        } else if (state.current === 'longpress') {
            if (onLongPressRelease) {
                onLongPressRelease();
            }
        }
        state.current = 'idle';
        cleanup();
    }, [cleanup]);
    
    const handleDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        cleanup();
        
        state.current = 'pending';
        startPos.current = getCoords(e);
        if (shouldPreventTouchDefault() && isTouchEvent(e) && e.cancelable) {
            e.preventDefault();
        }
        if (shouldPreventTouchDefault()) {
            window.getSelection?.()?.removeAllRanges();
        }
        if (isTouchEvent(e)) {
            releaseSelectionLockRef.current?.();
            releaseSelectionLockRef.current = lockTouchHoldSelection();
        }
        e.persist();

        const { delay = 300, onLongPress } = optionsRef.current;

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);

        timeout.current = setTimeout(() => {
            if (state.current === 'pending') {
                state.current = 'longpress';
                onLongPress(e);
                // DO NOT remove move listeners. This allows `handleMove` to still
                // detect a drag and cancel the long press if needed.
            }
        }, delay);

    }, [cleanup, handleMove, handleUp]);

    // Cleanup on unmount
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    return {
        onMouseDown: (e: React.MouseEvent) => {
            if (e.button === 0) handleDown(e);
        },
        onTouchStart: handleDown,
        onContextMenu: (e: React.MouseEvent) => {
            // Prevent context menu on mobile long press if it's a game action
            if (shouldPreventTouchDefault() || state.current === 'longpress' || state.current === 'drag') {
                e.preventDefault();
            }
        }
    };
};
