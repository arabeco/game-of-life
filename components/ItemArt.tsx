import React, { useEffect, useState } from 'react';

interface ItemArtProps {
    src?: string;
    alt: string;
    icon?: string;
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
                <span className={iconClassName}>{icon}</span>
            ) : (
                <span className={textClassName}>{fallbackText}</span>
            )}
        </div>
    );
};
