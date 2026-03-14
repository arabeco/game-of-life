import React, { useEffect, useMemo, useState } from 'react';
import {
    getProfileBackgroundFallbackValue,
    getProfileBackgroundSources,
    isCssProfileBackground,
    resolveProfileBackgroundValue,
} from '../utils/profileBackgrounds';

interface ProfileBackgroundSurfaceProps {
    value: string;
    className?: string;
    alt?: string;
}

export const ProfileBackgroundSurface: React.FC<ProfileBackgroundSurfaceProps> = ({
    value,
    className = 'w-full h-full',
    alt = '',
}) => {
    const resolvedValue = useMemo(() => resolveProfileBackgroundValue(value), [value]);
    const sources = useMemo(() => getProfileBackgroundSources(resolvedValue), [resolvedValue]);
    const fallbackValue = useMemo(() => getProfileBackgroundFallbackValue(resolvedValue), [resolvedValue]);
    const [sourceIndex, setSourceIndex] = useState(0);

    useEffect(() => {
        setSourceIndex(0);
    }, [resolvedValue]);

    if (isCssProfileBackground(resolvedValue)) {
        return <div className={className} style={{ background: resolvedValue }} />;
    }

    const currentSource = sources[sourceIndex];

    if (!currentSource) {
        if (fallbackValue) {
            return <div className={className} style={{ background: fallbackValue }} />;
        }

        return <div className={className} />;
    }

    return (
        <img
            src={currentSource}
            alt={alt}
            className={className}
            crossOrigin={currentSource.startsWith('http') ? 'anonymous' : undefined}
            onError={() => setSourceIndex((prev) => prev + 1)}
        />
    );
};
