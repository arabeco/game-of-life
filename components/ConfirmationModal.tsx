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
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'CONFIRMAR',
    cancelLabel = 'CANCELAR',
}) => {
    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10002] flex items-center justify-center animate-fade-in" onClick={onCancel}>
                <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-center">{title}</h2>
                    <p className="text-center text-gray-300">{message}</p>
                    <div className="flex space-x-2">
                        <button onClick={onCancel} className="w-full py-2 rounded-xl luxe-button-secondary">
                            {cancelLabel}
                        </button>
                        <button onClick={onConfirm} className="w-full py-2 rounded-xl luxe-skin-button">
                            {confirmLabel}
                        </button>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
