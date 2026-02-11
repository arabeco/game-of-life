import React from 'react';

interface DropIndicatorProps {
  top: number;
  height: number;
  className?: string;
}

export const DropIndicator: React.FC<DropIndicatorProps> = ({ top, height, className="" }) => (
  <div
    className={`absolute w-full pointer-events-none z-20 ${className}`}
    style={{ top: `${top}px`, height: `${height}px`, left: 0 }}
  >
    <div className="h-full w-full border-2 border-dashed border-[var(--gold)] rounded-2xl bg-[var(--gold)]/10" />
  </div>
);
