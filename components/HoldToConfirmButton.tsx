import React, { useEffect, useRef, useState } from 'react';

interface HoldToConfirmButtonProps {
    onConfirm: () => void;
    children: React.ReactNode;
    className?: string;
    /** Quanto tempo segurar, em ms. */
    duration?: number;
    hint?: string;
}

/**
 * SEGURAR PARA CONFIRMAR (26/10/2026). Para o que nao deve sair num toque sem
 * querer, como concluir a meta final de uma arena: a pessoa segura e o botao
 * enche com um brilho leve; soltar antes cancela. Teclado: segurar Espaco ou Enter.
 */
export const HoldToConfirmButton: React.FC<HoldToConfirmButtonProps> = ({
    onConfirm,
    children,
    className = '',
    duration = 3000,
    hint = 'Segure para confirmar',
}) => {
    const [holding, setHolding] = useState(false);
    const timer = useRef<number | null>(null);

    const stop = () => {
        if (timer.current !== null) window.clearTimeout(timer.current);
        timer.current = null;
        setHolding(false);
    };
    const start = () => {
        if (timer.current !== null) return;
        setHolding(true);
        timer.current = window.setTimeout(() => {
            timer.current = null;
            setHolding(false);
            onConfirm();
        }, duration);
    };
    useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

    return (
        <button
            type="button"
            className={`hold-confirm ${holding ? 'is-holding' : ''} ${className}`}
            style={{ '--hold-duration': `${duration}ms` } as React.CSSProperties}
            aria-label={`${typeof children === 'string' ? children : ''} (${hint.toLowerCase()})`.trim()}
            onPointerDown={(e) => { if (e.button === 0) start(); }}
            onPointerUp={stop}
            onPointerLeave={stop}
            onPointerCancel={stop}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } }}
            onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') stop(); }}
            onBlur={stop}
        >
            <span className="hold-confirm-fill" aria-hidden="true" />
            <span className="hold-confirm-label">{children}</span>
            <small className="hold-confirm-hint">{holding ? 'Continue segurando…' : hint}</small>
        </button>
    );
};
