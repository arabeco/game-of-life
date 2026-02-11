import React, { useRef, useEffect } from 'react';

interface WheelPickerProps {
    options: string[];
    value: string;
    onSelect: (value: string) => void;
}

export const WheelPicker: React.FC<WheelPickerProps> = ({ options, value, onSelect }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const selectedIndex = options.indexOf(value);
        if (containerRef.current && selectedIndex > -1) {
            const itemHeight = 40; // Corresponds to h-10
            containerRef.current.scrollTop = selectedIndex * itemHeight;
        }
    }, [value, options]);

    return (
        <div className="relative h-48 w-full bg-black/20 rounded-xl overflow-hidden">
            <div ref={containerRef} className="h-full overflow-y-scroll snap-y snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                <div className="h-[68px]"></div> {/* Padding top */}
                {options.map((option, index) => (
                    <div
                        key={index}
                        onClick={() => onSelect(option)}
                        className="h-10 flex items-center justify-center text-lg snap-center cursor-pointer transition-colors"
                    >
                        {option}
                    </div>
                ))}
                <div className="h-[68px]"></div> {/* Padding bottom */}
            </div>
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[72px] bg-gradient-to-b from-[#1A1A1A]/80 via-[#1A1A1A]/50 to-transparent"></div>
                <div className="absolute top-[72px] left-0 w-full h-10 border-y border-[var(--gold)]/50"></div>
                <div className="absolute bottom-0 left-0 w-full h-[72px] bg-gradient-to-t from-[#1A1A1A]/80 via-[#1A1A1A]/50 to-transparent"></div>
            </div>
        </div>
    );
};