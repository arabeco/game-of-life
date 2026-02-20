

import React from 'react';

export type GlassCardVariant = 'gold' | 'silver' | 'bronze' | 'neutral' | 'accent';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassCardVariant;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  id?: string;
  style?: React.CSSProperties;
}

// FIX: Wrapped the component with React.forwardRef to allow it to receive a ref. The ref is then passed to the underlying div element.
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(({ children, variant = 'neutral', className = '', onClick, id, style }, ref) => {
  const borderClasses: Record<GlassCardVariant, string> = {
    gold: 'gradient-border-gold',
    silver: 'gradient-border-silver',
    bronze: 'gradient-border-bronze',
    neutral: 'border-[var(--skin-line-color)]',
    accent: 'gradient-border-accent',
  };
  
  const useGradient = variant !== 'neutral';
  const baseClasses = `bg-glass-bg backdrop-blur-lg rounded-2xl p-4 ${useGradient ? 'gradient-border' : 'border'}`;

  const finalClasses = `${baseClasses} ${borderClasses[variant]} ${className}`;

  return (
    <div ref={ref} className={finalClasses} onClick={onClick} id={id} style={style}>
      {children}
    </div>
  );
});

GlassCard.displayName = 'GlassCard';
