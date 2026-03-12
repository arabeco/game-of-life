
import React from 'react';
import { Asset } from '../types';

interface SephirotProps {
  asset: Asset;
  onClick: () => void;
  style?: React.CSSProperties;
  levelColor?: string;
}

export const Sephirot: React.FC<SephirotProps> = ({ asset, onClick, style, levelColor }) => {
  const sphereSize = 'var(--sephirot-size-standard, 54px)';
  const titleMargin = '-mb-4';

  return (
    <div style={style} className="flex flex-col items-center justify-center z-10 animate-fade-in">
        <div className={`luxe-title-ornate pointer-events-none text-[color:var(--skin-accent-color)] text-[9px] font-black uppercase tracking-[0.08em] ${titleMargin} px-2 py-[0.2rem] bg-black/44 border border-white/8 rounded z-10 shadow-[0_3px_10px_rgba(0,0,0,0.32)] backdrop-blur-[3px]`}>
            {asset.name}
        </div>
        <button 
            onClick={onClick}
            aria-label={asset.name}
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
                    className="text-[1.25rem] font-semibold leading-none" 
                    style={{ 
                        color: levelColor ?? 'var(--sephirot-text-color)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.88)',
                        WebkitTextStroke: '0.65px rgba(24, 12, 4, 0.72)'
                    }}
                >
                    {asset.level}
                </span>
            </div>
        </button>
    </div>
  );
};
