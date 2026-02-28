
import React from 'react';
import { Asset } from '../types';

interface SephirotProps {
  asset: Asset;
  onClick: () => void;
  style?: React.CSSProperties;
}

export const Sephirot: React.FC<SephirotProps> = ({ asset, onClick, style }) => {
  const isConsciencia = asset.id === 'consciencia';
  const sphereSize = `var(--sephirot-size-${isConsciencia ? 'keter' : 'standard'}, ${isConsciencia ? '60px' : '54px'})`;
  const titleMargin = isConsciencia ? '-mb-2.5' : '-mb-4';

  return (
    <div style={style} className="flex flex-col items-center justify-center z-10 animate-fade-in">
        <div className={`luxe-title-ornate text-[color:var(--skin-accent-color)] text-[10px] font-black uppercase tracking-wider ${titleMargin} px-2 py-0.5 bg-black/60 border border-white/10 rounded z-10 shadow-[0_4px_12px_rgba(0,0,0,0.45)]`}>
            {asset.name}
        </div>
        <button 
            onClick={onClick}
            className="group relative rounded-full transition-all duration-300 focus:outline-none"
            style={{
                width: sphereSize,
                height: sphereSize,
                boxShadow: `0 0 8px 1px var(--sephirot-glow-color)`,
            }}
        >
            <div 
                className="relative w-full h-full rounded-full flex items-center justify-center text-center transition-all"
                style={{ 
                    backgroundImage: `var(--sephirot-bg-image), var(--sephirot-bg-gradient)`,
                    backgroundSize: 'var(--sephirot-image-size, 135%), cover',
                    backgroundPosition: 'center, center',
                    backgroundRepeat: 'no-repeat, no-repeat',
                    boxShadow: `inset 0 0 0 1px var(--sephirot-border-color)`
                }}
            >
                <span 
                    className="text-xl font-semibold" 
                    style={{ 
                        color: 'var(--sephirot-text-color)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.7)'
                    }}
                >
                    {asset.level}
                </span>
            </div>
        </button>
    </div>
  );
};
