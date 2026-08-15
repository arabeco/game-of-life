import React from 'react';

export const isClanEmblemImage = (value?: string | null): boolean => {
    const normalized = String(value || '').trim();
    return normalized.startsWith('/')
        || normalized.startsWith('http://')
        || normalized.startsWith('https://')
        || normalized.startsWith('data:image/')
        || /\.(svg|png|webp|jpe?g)(\?.*)?$/i.test(normalized);
};

export const ClanEmblem: React.FC<{
    value?: string | null;
    className?: string;
    imageClassName?: string;
}> = ({ value, className = '', imageClassName = '' }) => {
    const resolved = String(value || '🏛️').trim() || '🏛️';

    return (
        <span className={`inline-flex items-center justify-center ${className}`}>
            {isClanEmblemImage(resolved) ? (
                <img src={resolved} alt="" className={`h-full w-full object-contain ${imageClassName}`} />
            ) : (
                resolved
            )}
        </span>
    );
};
