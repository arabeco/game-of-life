import React, { useState } from 'react';
import { Slot, SlotValue } from '../../types';
import { WheelPicker } from './WheelPicker';
import { SliderInput } from './SliderInput';
import { ImageUploadSlot } from './ImageUploadSlot';
import { GlassCard } from '../GlassCard';
import { ChevronRightIcon } from '../Icons';
import { Portal } from '../Portal';

interface InputModalProps {
    slot: Slot;
    onClose: () => void;
    onSave: (value: SlotValue) => void;
}

export const InputModal: React.FC<InputModalProps> = ({ slot, onClose, onSave }) => {
    const [currentValue, setCurrentValue] = useState(slot.value);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const handleSave = () => {
        onSave(currentValue);
    };

    const handleWheelSelect = (newValue: string) => {
        setCurrentValue(newValue);
    };

    const renderInput = () => {
        switch (slot.inputType) {
            case 'text':
                return (
                    <input
                        type="text"
                        value={currentValue as string}
                        onChange={e => setCurrentValue(e.target.value)}
                        className="ui-modal-input"
                    />
                );
            case 'textarea':
                return (
                    <textarea
                        value={currentValue as string}
                        onChange={e => setCurrentValue(e.target.value)}
                        rows={5}
                        className="ui-modal-input min-h-[7.5rem] resize-y"
                    />
                );
            case 'wheelpick':
                return (
                    <div>
                        <button
                            onClick={() => setIsPickerOpen(!isPickerOpen)}
                            className="ui-modal-input flex items-center justify-between gap-3 text-left"
                        >
                            <span>{currentValue as string}</span>
                            <ChevronRightIcon className={`w-5 h-5 text-gray-400 transition-transform ${isPickerOpen ? 'rotate-90' : ''}`} />
                        </button>
                        {isPickerOpen && (
                            <div
                                className="mt-2"
                                onMouseDown={e => e.stopPropagation()}
                                onPointerDown={e => e.stopPropagation()}
                                onTouchStart={e => e.stopPropagation()}
                                onClick={e => e.stopPropagation()}
                            >
                                <WheelPicker options={slot.options!} value={currentValue as string} onSelect={handleWheelSelect} />
                            </div>
                        )}
                    </div>
                );
            case 'slider':
                return <SliderInput range={slot.range!} value={currentValue as number} onChange={setCurrentValue} />;
            case 'image':
                return <ImageUploadSlot value={currentValue as { imageUrl: string, caption: string; }} onChange={setCurrentValue} />;
            default:
                return <div>Tipo de input não suportado.</div>;
        }
    };

    const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) onClose();
    };

    return (
        <Portal>
            <div
                className="ui-modal-backdrop overscroll-none"
                style={{ touchAction: 'none' }}
                onClick={handleBackdropClick}
            >
                <GlassCard
                    variant="neutral"
                    className="ui-modal-panel max-w-sm p-0"
                    style={{ touchAction: 'auto' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="ui-modal-panel-content ui-modal-stack">
                        <div className="ui-modal-header">
                            <h2 className="ui-modal-title">{slot.label}</h2>
                        </div>
                        <div>{renderInput()}</div>
                        <div className="ui-modal-actions">
                            <button onClick={onClose} className="ui-modal-button luxe-button-secondary">
                                Cancelar
                            </button>
                            <button onClick={handleSave} className="ui-modal-button luxe-skin-button">
                                Salvar
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
