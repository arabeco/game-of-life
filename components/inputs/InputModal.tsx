import React, { useState } from 'react';
import { Slot, SlotValue } from '../../types';
import { WheelPicker } from './WheelPicker';
import { SliderInput } from './SliderInput';
import { ImageUploadSlot } from './ImageUploadSlot';
import { GlassCard } from '../GlassCard';
import { ChevronRightIcon } from '../Icons';

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
    }
    
    const handleWheelSelect = (newValue: string) => {
        setCurrentValue(newValue);
        setIsPickerOpen(false);
    };

    const renderInput = () => {
        switch (slot.inputType) {
            case 'text':
                return <input type="text" value={currentValue as string} onChange={e => setCurrentValue(e.target.value)} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--gold)]" />;
            case 'textarea':
                return <textarea value={currentValue as string} onChange={e => setCurrentValue(e.target.value)} rows={5} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--gold)]" />;
            case 'wheelpick':
                return (
                     <div>
                        <button
                            onClick={() => setIsPickerOpen(!isPickerOpen)}
                            className="w-full p-3 bg-black/30 rounded-xl flex justify-between items-center text-left"
                        >
                            <span>{currentValue as string}</span>
                            <ChevronRightIcon className={`w-5 h-5 text-gray-400 transition-transform ${isPickerOpen ? 'rotate-90' : ''}`} />
                        </button>
                        {isPickerOpen && (
                            <div className="mt-2">
                                <WheelPicker options={slot.options!} value={currentValue as string} onSelect={handleWheelSelect} />
                            </div>
                        )}
                    </div>
                );
            case 'slider':
                return <SliderInput range={slot.range!} value={currentValue as number} onChange={setCurrentValue} />;
            case 'image':
                return <ImageUploadSlot value={currentValue as {imageUrl: string, caption: string}} onChange={setCurrentValue} />;
            default:
                return <div>Tipo de input não suportado.</div>
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-center">{slot.label}</h2>
                <div>{renderInput()}</div>
                <div className="flex space-x-2">
                    <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-secondary">
                        CANCELAR
                    </button>
                    <button onClick={handleSave} className="w-full py-2 rounded-xl luxe-button-primary">
                        SALVAR
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};