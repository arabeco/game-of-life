import React from 'react';
import './reference-plate.css';

/** Shared shell from the approved arena/action HTML, without GlassCard effects. */
export const ReferencePlate = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = '', children, ...props }, ref) => (
        <div ref={ref} className={`reference-plate ${className}`} {...props}>{children}</div>
    ),
);
ReferencePlate.displayName = 'ReferencePlate';
