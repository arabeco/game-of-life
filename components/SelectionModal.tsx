import React from 'react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { CheckIcon } from './Icons';

interface SelectionModalProps<T extends string> {
    title: string;
    options: readonly T[];
    currentValue: T;
    onSelect: (value: T) => void;
    onClose: () => void;
}

export function SelectionModal<T extends string>({ title, options, currentValue, onSelect, onClose }: SelectionModalProps<T>) {
    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[245] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-center">{title}</h2>
                <div className="space-y-2">
                    {options.map(option => (
                        <button
                            key={option}
                            onClick={() => { onSelect(option); onClose(); }}
                            className={`w-full p-3 rounded-xl text-left flex justify-between items-center transition-colors ${currentValue === option ? 'bg-white/20' : 'bg-black/20 hover:bg-white/10'}`}
                        >
                            <span>{option}</span>
                            {currentValue === option && <CheckIcon className="w-5 h-5 text-[var(--gold)]" />}
                        </button>
                    ))}
                </div>
            </GlassCard>
        </div>
        </Portal>
    );
}
