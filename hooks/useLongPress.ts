

import React, { useCallback, useRef, useEffect } from 'react';
import { lockTouchHoldSelection } from '../utils/touchHoldSelection';
import { maoEntrouNaTela, maoSaiuDaTela } from '../utils/oracleSpeech';

interface LongPressOptions {
    onLongPress?: (event: React.MouseEvent | React.TouchEvent) => void;
    onLongPressCancel?: () => void;
    onLongPressRelease?: () => void;
    onClick?: (event: React.MouseEvent | React.TouchEvent) => void;
    onDragStart?: (event: MouseEvent | TouchEvent) => void;
    delay?: number;
    dragThreshold?: number;
    preventDefaultOnTouch?: boolean;
    touchDragRequiresLongPress?: boolean;
    dragIntent?: 'any' | 'vertical' | 'horizontal';
    /**
     * O PEGAR, separado do segurar.
     *
     * Sem esta opcao o hook tem um tempo so: `delay` dispara `onLongPress`, e
     * e esse mesmo instante que libera o arrasto no toque. No planner isso
     * colava dois gestos num: o hold que libera o arrasto era o MESMO que
     * comecava a encher a conclusao — para arrastar, a pessoa via a tarefa
     * comecar a se concluir.
     *
     * Com `armDelay`, o gesto tem dois tempos. Em `armDelay` a peca e PEGA
     * (`onArm`) e o arrasto fica liberado; so se o dedo continuar parado ate
     * `delay` e que `onLongPress` dispara. Soltar depois de pegar, sem mexer,
     * devolve a peca (`onArmCancel`) — nao e toque, e nao abre nada.
     */
    armDelay?: number;
    onArm?: () => void;
    onArmCancel?: () => void;
}

const isTouchEvent = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): e is TouchEvent | React.TouchEvent => 'touches' in e;

export const useLongPress = (options: LongPressOptions) => {
    const optionsRef = useRef(options);
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const armTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const state = useRef<'idle' | 'pending' | 'armed' | 'longpress' | 'drag'>('idle');
    const downAt = useRef(0);
    const startPos = useRef({ x: 0, y: 0 });
    const releaseSelectionLockRef = useRef<(() => void) | null>(null);

    const shouldPreventTouchDefault = () => optionsRef.current.preventDefaultOnTouch ?? true;

    const getCoords = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
        return isTouchEvent(e) ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
    };
    
    let handleMove: (e: MouseEvent | TouchEvent) => void;
    let handleUp: (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => void;

    const maoNaTelaRef = useRef(false);

    const cleanup = useCallback(() => {
        if (maoNaTelaRef.current) {
            maoNaTelaRef.current = false;
            maoSaiuDaTela();
        }
        if (timeout.current) {
            clearTimeout(timeout.current);
            timeout.current = null;
        }
        if (armTimeout.current) {
            clearTimeout(armTimeout.current);
            armTimeout.current = null;
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
        if (state.current !== 'pending' && state.current !== 'armed' && state.current !== 'longpress') return;

        const {
            dragThreshold = 10, onDragStart, onLongPressCancel, touchDragRequiresLongPress,
            dragIntent = 'any', armDelay, onArm, onArmCancel,
        } = optionsRef.current;
        if (shouldPreventTouchDefault() && isTouchEvent(e) && e.cancelable) {
            e.preventDefault();
        }
        const currentPos = getCoords(e);
        const dx = currentPos.x - startPos.current.x;
        const dy = currentPos.y - startPos.current.y;

        if (Math.sqrt(dx * dx + dy * dy) > dragThreshold) {
            const isHorizontalIntent = Math.abs(dx) >= Math.abs(dy);
            const matchesDragIntent =
                dragIntent === 'any'
                || (dragIntent === 'horizontal' && isHorizontalIntent)
                || (dragIntent === 'vertical' && !isHorizontalIntent);

            if (!matchesDragIntent) {
                if (state.current === 'armed') onArmCancel?.();
                state.current = 'idle';
                cleanup();
                onLongPressCancel?.();
                return;
            }

            /*
             * O PEGAR VALE PELO TEMPO QUE PASSOU, NAO PELO TIMER.
             *
             * `setTimeout` e promessa de "no minimo", nunca de "na hora". Com a
             * thread ocupada — o balao do Oraculo digitando uma letra a cada
             * 22ms e o mais comum — o timer do pegar dispara atrasado. A pessoa
             * mexe o dedo no tempo certo, o hook ainda acha que esta esperando,
             * e o arrasto e cancelado em silencio. Era o "enquanto o Oraculo ta
             * falando nao da pra arrastar".
             *
             * Se o tempo de pegar JA PASSOU quando o dedo se move, a peca esta
             * pega, tenha o timer chegado ou nao.
             */
            if (
                state.current === 'pending'
                && armDelay !== undefined
                && performance.now() - downAt.current >= armDelay
            ) {
                state.current = 'armed';
                onArm?.();
            }

            if (touchDragRequiresLongPress && isTouchEvent(e) && state.current === 'pending') {
                state.current = 'idle';
                cleanup();
                onLongPressCancel?.();
                return;
            }
            // If a drag is detected, cancel any long-press that might have just started.
            if (state.current === 'longpress') {
                onLongPressCancel?.();
            }
            if (state.current === 'armed') {
                onArmCancel?.();
            }
            state.current = 'drag';
            cleanup();
            if (onDragStart) {
                onDragStart(e);
            }
        }
    }, [cleanup]);

    handleUp = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const { onClick, onLongPressRelease, onArmCancel } = optionsRef.current;
        if (state.current === 'pending') {
            if (onClick) {
                onClick(e as any);
            }
        } else if (state.current === 'armed') {
            // Pegou e devolveu sem mexer: a peca desce, e nada abre.
            onArmCancel?.();
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

        /* ENQUANTO A MAO ESTIVER AQUI, O ORACULO ESPERA.
           Concluir arrastando dispara uma reacao, e ela entrava no ar no meio
           do gesto seguinte. Quem arrasta esta fazendo; quem fala esta
           comentando, e comentario espera. O par entra/sai fica no ciclo de
           vida do gesto — `cleanup` roda em toda saida, inclusive cancelamento
           e desmontagem, entao nao ha caminho que deixe a contagem presa. */
        maoEntrouNaTela();
        maoNaTelaRef.current = true;

        state.current = 'pending';
        downAt.current = performance.now();
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

        const { delay = 300, onLongPress, armDelay, onArm } = optionsRef.current;

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);

        if (armDelay !== undefined) {
            armTimeout.current = setTimeout(() => {
                if (state.current === 'pending') {
                    state.current = 'armed';
                    onArm?.();
                }
            }, armDelay);
        }

        timeout.current = setTimeout(() => {
            // Com o pegar ligado, o segurar so vale para quem ja foi pego e
            // continuou parado. Sem ele, o comportamento e o de sempre.
            const podeSegurar = armDelay !== undefined
                ? state.current === 'armed'
                : state.current === 'pending';
            if (podeSegurar) {
                state.current = 'longpress';
                onLongPress?.(e);
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
