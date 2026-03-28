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
            <div className="ui-modal-backdrop" onClick={onCancel}>
                <GlassCard variant="neutral" className="ui-modal-panel max-w-sm p-0" onClick={e => e.stopPropagation()}>
                    <div className="ui-modal-panel-content ui-modal-stack">
                        <div className="ui-modal-header">
                            <h2 className="ui-modal-title">{title}</h2>
                        </div>
                        <p className="ui-modal-copy">{message}</p>
                        <div className="ui-modal-actions">
                            <button onClick={onCancel} className="ui-modal-button luxe-button-secondary">
                            {cancelLabel}
                            </button>
                            <button onClick={onConfirm} className="ui-modal-button luxe-skin-button">
                            {confirmLabel}
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
