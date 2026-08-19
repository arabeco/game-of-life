
import React from 'react';
import { Asset } from '../types';

interface SephirotProps {
  asset: Asset;
  onClick: () => void;
  style?: React.CSSProperties;
  artUrl?: string;
  levelColor?: string;
  useSkinArtworkOnly?: boolean;
  showLabel?: boolean;
  size?: string;
  interactive?: boolean;
}

export const Sephirot: React.FC<SephirotProps> = ({
  asset,
  onClick,
  style,
  artUrl,
  levelColor,
  useSkinArtworkOnly = false,
  showLabel = true,
  size,
  interactive = true,
}) => {
  const activeSkinId =
    typeof document !== 'undefined'
      ? (document.documentElement.getAttribute('data-skin') || '').trim().toUpperCase()
      : '';
  const useContrastHalo = activeSkinId === 'BASIC' || activeSkinId === 'GENESIS';
  const skinSpecificLevelColor =
    activeSkinId === 'BASIC'
      ? '#d9bd82'
      : activeSkinId === 'GENESIS'
        ? '#d7b684'
        : undefined;
  const resolvedLevelColor = levelColor ?? skinSpecificLevelColor ?? 'var(--sephirot-text-color)';
  const sphereSize = size || 'var(--sephirot-size-standard, 54px)';
  const titleMargin = '-mb-4';
  const sphereShadow = useSkinArtworkOnly ? 'none' : `0 0 7px 0.75px var(--sephirot-glow-color)`;
  const sphereBackgroundImage = useSkinArtworkOnly
    ? 'var(--sephirot-bg-image)'
    : 'var(--sephirot-bg-image), var(--sephirot-base-fill), var(--sephirot-bg-gradient)';
  const sphereBackgroundSize = useSkinArtworkOnly
    ? 'var(--sephirot-raster-size, 108%) var(--sephirot-raster-size, 108%)'
    : 'var(--sephirot-image-size, 92%), 100% 100%, cover';
  const sphereBackgroundPosition = useSkinArtworkOnly ? 'center' : 'center, center, center';
  const sphereBackgroundRepeat = useSkinArtworkOnly ? 'no-repeat' : 'no-repeat, no-repeat, no-repeat';
  const sphereInsetRing = useSkinArtworkOnly
    ? undefined
    : `inset 0 0 0 var(--sephirot-ring-width, 0.8px) var(--sephirot-border-color)`;
  const assetArtUrl = artUrl ? artUrl.replace(/"/g, '\\"') : '';
  const backgroundImage = artUrl
    ? `linear-gradient(180deg, rgba(5,5,8,0.24) 0%, rgba(5,5,8,0.72) 100%), url("${assetArtUrl}"), ${sphereBackgroundImage}`
    : sphereBackgroundImage;
  const backgroundSize = artUrl
    ? `100% 100%, cover, ${sphereBackgroundSize}`
    : sphereBackgroundSize;
  const backgroundPosition = artUrl
    ? `center, center, ${sphereBackgroundPosition}`
    : sphereBackgroundPosition;
  const backgroundRepeat = artUrl
    ? `no-repeat, no-repeat, ${sphereBackgroundRepeat}`
    : sphereBackgroundRepeat;

  const sphereContent = (
        <div 
            className="relative w-full h-full rounded-full flex items-center justify-center text-center transition-all"
            style={{ 
                backgroundImage,
                backgroundSize,
                backgroundPosition,
                backgroundRepeat,
                boxShadow: sphereInsetRing,
            }}
        >
            {useContrastHalo && (
                <div
                    className="pointer-events-none absolute left-1/2 top-1/2 z-0 rounded-full"
                    style={{
                        width: '62%',
                        height: '62%',
                        transform: 'translate(-50%, -55%)',
                        background: activeSkinId === 'GENESIS'
                          ? 'radial-gradient(circle, rgba(18,10,24,0.92) 0%, rgba(24,12,32,0.78) 42%, rgba(10,8,14,0.08) 76%, transparent 100%)'
                          : 'radial-gradient(circle, rgba(14,18,22,0.92) 0%, rgba(22,28,34,0.76) 42%, rgba(10,12,16,0.08) 76%, transparent 100%)',
                        filter: 'blur(0.45px)',
                    }}
                />
            )}
            <span 
                className="pointer-events-none relative z-[1] text-[1.82rem] font-black leading-none tracking-[-0.02em]" 
                style={{ 
                    color: resolvedLevelColor,
                    // Um contorno so para todas as skins: variar por skin fazia o
                    // numeral pesar diferente de uma esfera para outra.
                    textShadow: '0 1px 0 rgba(255,255,255,0.13), 0 0 3px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.82)',
                    WebkitTextStroke: '1.25px rgba(8, 8, 10, 0.97)',
                    transform: 'translateY(-0.07em)',
                }}
            >
                {asset.level}
            </span>
        </div>
  );

  return (
    <div style={style} className="flex flex-col items-center justify-center z-10 animate-fade-in">
        {showLabel && (
            <div className={`sephirot-name-label luxe-title-ornate pointer-events-none text-[color:var(--skin-accent-color)] text-[9px] font-black uppercase tracking-[0.08em] ${titleMargin} px-2 py-[0.2rem] bg-black/44 border border-white/8 rounded z-10 shadow-[0_3px_10px_rgba(0,0,0,0.32)] backdrop-blur-[3px]`}>
                {asset.name}
            </div>
        )}
        {interactive ? (
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
                {sphereContent}
            </button>
        ) : (
            <div
                aria-hidden="true"
                className="relative rounded-full"
                style={{
                    width: sphereSize,
                    height: sphereSize,
                    boxShadow: sphereShadow,
                }}
            >
                {sphereContent}
            </div>
        )}
    </div>
  );
};
