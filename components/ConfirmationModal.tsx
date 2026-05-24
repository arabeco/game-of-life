import React from 'react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';

interface ConfirmationModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    eyebrow?: string;
    variant?: 'default' | 'danger';
    icon?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'CONFIRMAR',
    cancelLabel = 'CANCELAR',
    eyebrow = 'CONFIRMACAO',
    variant = 'default',
    icon,
}) => {
    const isDanger = variant === 'danger';

    return (
        <Portal>
            <div className="ui-modal-backdrop z-[50000]" style={{ zIndex: 50000 }} onClick={onCancel}>
                <GlassCard
                    variant="neutral"
                    className={`ui-modal-panel max-w-sm overflow-hidden p-0 ${isDanger ? 'border-[var(--skin-accent-color)]/25 shadow-[0_0_42px_rgba(212,175,55,0.14)]' : ''}`}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="relative">
                        <div
                            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.18),transparent_70%)]"
                        />
                        <div className="relative ui-modal-panel-content ui-modal-stack">
                            <div className="flex justify-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--skin-accent-color)]/30 bg-white/[0.04] text-[var(--skin-accent-color)] shadow-[0_14px_34px_rgba(0,0,0,0.35)]">
                                    {icon || <span className="text-lg font-black">{isDanger ? '!' : '?'}</span>}
                                </div>
                            </div>
                            <div className="ui-modal-header text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[var(--skin-accent-color)]/80">{eyebrow}</p>
                                <h2 className="ui-modal-title mt-2">{title}</h2>
                            </div>
                            <p className="ui-modal-copy text-center">{message}</p>
                            <div className="ui-modal-actions">
                                <button onClick={onCancel} className="ui-modal-button luxe-button-secondary">
                                    {cancelLabel}
                                </button>
                                <button onClick={onConfirm} className="ui-modal-button luxe-skin-button">
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
