
import React from 'react';
import { Asset } from '../types';

interface SephirotProps {
  asset: Asset;
  onClick: () => void;
  style?: React.CSSProperties;
  levelColor?: string;
  useSkinArtworkOnly?: boolean;
}

export const Sephirot: React.FC<SephirotProps> = ({
  asset,
  onClick,
  style,
  levelColor,
  useSkinArtworkOnly = false,
}) => {
  const sphereSize = 'var(--sephirot-size-standard, 54px)';
  const titleMargin = '-mb-4';
  const sphereShadow = useSkinArtworkOnly ? 'none' : `0 0 7px 0.75px var(--sephirot-glow-color)`;
  const sphereBackgroundImage = useSkinArtworkOnly
    ? 'var(--sephirot-bg-image)'
    : 'var(--sephirot-bg-image), var(--sephirot-base-fill), var(--sephirot-bg-gradient)';
  const sphereBackgroundSize = useSkinArtworkOnly
    ? '100% 100%'
    : 'var(--sephirot-image-size, 92%), 100% 100%, cover';
  const sphereBackgroundPosition = useSkinArtworkOnly ? 'center' : 'center, center, center';
  const sphereBackgroundRepeat = useSkinArtworkOnly ? 'no-repeat' : 'no-repeat, no-repeat, no-repeat';
  const sphereInsetRing = useSkinArtworkOnly
    ? undefined
    : `inset 0 0 0 var(--sephirot-ring-width, 0.8px) var(--sephirot-border-color)`;

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
                boxShadow: sphereShadow,
            }}
        >
            <div 
                className="relative w-full h-full rounded-full flex items-center justify-center text-center transition-all"
                style={{ 
                    backgroundImage: sphereBackgroundImage,
                    backgroundSize: sphereBackgroundSize,
                    backgroundPosition: sphereBackgroundPosition,
                    backgroundRepeat: sphereBackgroundRepeat,
                    boxShadow: sphereInsetRing,
                }}
            >
                <span 
                    className="pointer-events-none relative z-[1] text-[1.28rem] font-black leading-none tracking-[-0.02em]" 
                    style={{ 
                        color: levelColor ?? 'var(--sephirot-text-color)',
                        textShadow: '0 1px 0 rgba(255,255,255,0.14), 0 0 4px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.85)',
                        WebkitTextStroke: '1.35px rgba(8, 8, 10, 0.98)'
                    }}
                >
                    {asset.level}
                </span>
            </div>
        </button>
    </div>
  );
};
