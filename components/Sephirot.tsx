
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

  return (
    <div style={style} className="flex flex-col items-center justify-center z-10 animate-fade-in">
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
