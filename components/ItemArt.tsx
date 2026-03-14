import React, { useEffect, useState } from 'react';
import { EmojiGlyph } from './EmojiGlyph';
import { getAuraBackground, getAuraVisual } from '../utils/auraVisuals';

interface ItemArtProps {
    src?: string;
    alt: string;
    icon?: string;
    category?: string;
    emojiSize?: 'arena' | 'action' | 'milestone' | 'picker' | 'badge';
    fallbackText?: string;
    className?: string;
    imgClassName?: string;
    iconClassName?: string;
    textClassName?: string;
    fallback?: React.ReactNode;
}

export const ItemArt: React.FC<ItemArtProps> = ({
    src,
    alt,
    icon,
    category,
    emojiSize = 'badge',
    fallbackText = 'N/A',
    className = '',
    imgClassName = '',
    iconClassName = '',
    textClassName = '',
    fallback,
}) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [src, alt, icon, fallbackText, fallback]);

    if (category === 'aura' && (!src || hasError)) {
        const auraVisual = getAuraVisual(alt);

        return (
            <div className={`${className} relative overflow-hidden rounded-[inherit]`}>
                <div
                    className="absolute inset-0 rounded-[inherit]"
                    style={{
                        backgroundImage: getAuraBackground(alt),
                        boxShadow: `inset 0 0 18px rgba(255,255,255,0.08), 0 0 18px ${auraVisual.shadow}`,
                    }}
                />
                <div className="absolute inset-[16%] rounded-full border border-white/10" />
                <div className="absolute inset-[30%] rounded-full border border-white/15" />
                <div className="relative z-10 flex h-full w-full items-center justify-center">
                    {icon ? (
                        <EmojiGlyph symbol={icon} size={emojiSize} className={iconClassName || 'text-2xl'} />
                    ) : fallback ? (
                        fallback
                    ) : (
                        <span className={textClassName}>{fallbackText}</span>
                    )}
                </div>
            </div>
        );
    }

    if (category === 'ui_skin') {
        return (
            <div className={`${className} relative overflow-hidden rounded-[inherit]`}>
                {src && !hasError ? (
                    <img
                        src={src}
                        alt={alt}
                        className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`}
                        onError={() => setHasError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_78%_80%,rgba(180,128,255,0.16),transparent_28%),linear-gradient(135deg,#241233_0%,#0d0813_100%)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-black/5 to-black/50" />
                <div className="relative z-10 flex h-full w-full items-center justify-center">
                    <div className="relative aspect-square h-[44%] rounded-full border border-white/75 bg-[radial-gradient(circle,#111118_0%,#040407_100%)] shadow-[0_0_12px_rgba(255,255,255,0.18)]">
                        <div className="absolute inset-[10%] rounded-full border border-white/15" />
                        <span className="absolute inset-0 flex items-center justify-center text-[1em] font-black text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                            7
                        </span>
                    </div>
                </div>
                {icon && (
                    <div className="absolute bottom-1 right-1 z-20 rounded-full bg-black/45 px-1.5 py-0.5 backdrop-blur-sm">
                        <EmojiGlyph symbol={icon} size={emojiSize} className="text-[11px] leading-none" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={className}>
            {src && !hasError ? (
                <img
                    src={src}
                    alt={alt}
                    className={imgClassName}
                    onError={() => setHasError(true)}
                />
            ) : fallback ? (
                fallback
            ) : icon ? (
                <EmojiGlyph symbol={icon} size={emojiSize} className={iconClassName} />
            ) : (
                <span className={textClassName}>{fallbackText}</span>
            )}
        </div>
    );
};
