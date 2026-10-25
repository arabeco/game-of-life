import React from 'react';

/**
 * Marca única para algo novo que pede abertura. Estados permanentes (humor,
 * foco ligado, progresso etc.) não usam esta marca: eles já são visíveis por
 * si e não devem competir com uma notificação.
 */
export const AttentionBadge: React.FC<{
    count?: number;
    label: string;
    compact?: boolean;
    className?: string;
}> = ({ count = 1, label, compact = false, className = '' }) => {
    if (count <= 0) return null;

    if (compact) {
        return (
            <span
                aria-label={label}
                className={`pointer-events-none inline-flex h-2.5 w-2.5 shrink-0 rounded-full border border-red-100/90 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.66)] ${className}`}
            />
        );
    }

    return (
        <span
            aria-label={label}
            className={`pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-red-100/90 bg-red-500 px-1 text-[9px] font-black leading-none text-white shadow-[0_0_12px_rgba(239,68,68,0.55)] ${className}`}
        >
            {count > 9 ? '9+' : count}
        </span>
    );
};
