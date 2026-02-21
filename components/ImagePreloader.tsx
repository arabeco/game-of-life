import React, { useEffect } from 'react';
import { BODY_DB, AVATAR_BASE_URL, HAIR_DB, getHairUrl } from '../constants/skins';

export const ImagePreloader: React.FC = () => {
    useEffect(() => {
        const preloadImage = (src: string) => {
            const img = new Image();
            img.src = src;
        };

        // Preload Bodies (Critical for Skin Types)
        BODY_DB.forEach(body => {
            const url = `${AVATAR_BASE_URL}/${body.filename}`;
            preloadImage(url);
        });

        // Preload Hairs (Common styles in default color)
        // We preload 'cast' (Castanho) as a baseline.
        HAIR_DB.forEach(hair => {
            // '1' is Castanho ID
            const url = getHairUrl(hair.id, '1');
            if (url) preloadImage(url);
        });
        
    }, []);

    return null; // Invisible component
};
