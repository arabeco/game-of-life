import React, { useRef, useEffect } from 'react';

interface WheelPickerProps {
    options: string[];
    value: string;
    onSelect: (value: string) => void;
}

export const WheelPicker: React.FC<WheelPickerProps> = ({ options, value, onSelect }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollRafRef = useRef<number | null>(null);
    const scrollTimeoutRef = useRef<number | null>(null);
    const itemHeight = 40;

    useEffect(() => {
        const selectedIndex = options.indexOf(value);
        if (containerRef.current && selectedIndex > -1) {
            const nextScrollTop = selectedIndex * itemHeight;
            if (Math.abs(containerRef.current.scrollTop - nextScrollTop) > 1) {
                containerRef.current.scrollTop = nextScrollTop;
            }
        }
    }, [value, options]);

    useEffect(() => () => {
        if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
        if (scrollTimeoutRef.current !== null) window.clearTimeout(scrollTimeoutRef.current);
    }, []);

    const commitSelection = () => {
        const container = containerRef.current;
        if (!container) return;
        const rawIndex = Math.round(container.scrollTop / itemHeight);
        const clampedIndex = Math.min(options.length - 1, Math.max(0, rawIndex));
        const snappedScrollTop = clampedIndex * itemHeight;
        const nextValue = options[clampedIndex];

        if (Math.abs(container.scrollTop - snappedScrollTop) > 1) {
            container.scrollTo({ top: snappedScrollTop, behavior: 'smooth' });
        }

        if (nextValue && nextValue !== value) {
            onSelect(nextValue);
        }
    };

    const scheduleCommitSelection = () => {
        if (scrollTimeoutRef.current !== null) {
            window.clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = window.setTimeout(() => {
            scrollTimeoutRef.current = null;
            commitSelection();
        }, 90);
    };

    const handleScroll = () => {
        scheduleCommitSelection();
        if (scrollRafRef.current !== null) return;
        scrollRafRef.current = requestAnimationFrame(() => {
            scrollRafRef.current = null;
            const container = containerRef.current;
            if (!container) return;
            const rawIndex = Math.round(container.scrollTop / itemHeight);
            const clampedIndex = Math.min(options.length - 1, Math.max(0, rawIndex));
            const nextValue = options[clampedIndex];
            if (nextValue && nextValue !== value) onSelect(nextValue);
        });
    };

    return (
        <div className="relative h-48 w-full bg-black/20 rounded-xl overflow-hidden" style={{ touchAction: 'pan-y' }}>
            <div
                ref={containerRef}
                onScroll={handleScroll}
                onMouseUp={scheduleCommitSelection}
                onTouchEnd={scheduleCommitSelection}
                onTouchCancel={scheduleCommitSelection}
                className="h-full overflow-y-scroll snap-y snap-mandatory"
                style={{ scrollbarWidth: 'none', touchAction: 'pan-y', overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}
            >
                <div className="h-[68px]"></div> {/* Padding top */}
                {options.map((option, index) => (
                    <div
                        key={index}
                        onClick={() => onSelect(option)}
                        className={`h-10 flex items-center justify-center text-lg snap-center cursor-pointer transition-colors ${option === value ? 'font-bold text-white' : 'text-white/62'}`}
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
