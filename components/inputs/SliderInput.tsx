
import React from 'react';

interface SliderInputProps {
    range: { min: number; max: number };
    value: number;
    onChange: (value: number) => void;
}

export const SliderInput: React.FC<SliderInputProps> = ({ range, value, onChange }) => {
    return (
        <div className="p-4 space-y-2">
            <div className="text-center text-2xl font-bold accent-text">{value}</div>
            <input
                type="range"
                min={range.min}
                max={range.max}
                value={value}
                onChange={e => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-[var(--skin-accent-color)]"
            />
             <div className="flex justify-between text-xs text-gray-400">
                <span>{range.min}</span>
                <span>{range.max}</span>
            </div>
        </div>
    );
};
