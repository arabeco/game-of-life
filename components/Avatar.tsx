import React from 'react';
import { SovereignConfig } from '../types';
import { SOVEREIGN_ASSETS, FACE_FEATURES_URL, DEFAULT_SOVEREIGN_CONFIG } from '../constants/avatar';

interface SovereignProps {
  sovereignConfig?: SovereignConfig;
  className?: string;
}

// Helper to convert HEX to a CSS filter for colorization
// This works best with a white or light gray base image for the hair
const hexToCssFilter = (hex: string): { filter: string } => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const color = { r, g, b, a: 1 };

    // This is a simplified version of a complex algorithm.
    // It works by trying to match the target color using CSS filter functions.
    // For more accurate results, a more complex library might be needed,
    // but this provides a good approximation for many colors.
    const sepia = (color.r * 0.393 + color.g * 0.769 + color.b * 0.189) / 255;
    const saturate = Math.sqrt(color.r*color.r*0.2126 + color.g*color.g*0.7152 + color.b*color.b*0.0722) / 255;

    return { filter: `brightness(0) saturate(100%) invert(${r/255}) sepia(${g/255}) saturate(${b*20}%) hue-rotate(${(Math.atan2(Math.sqrt(3)*(g-b), 2*r-g-b)*180/Math.PI)+180}deg)` };
};


export const Sovereign: React.FC<SovereignProps> = ({ sovereignConfig, className = '' }) => {
    // Merge provided config with default to prevent crash if sovereignConfig is undefined
    const config = { ...DEFAULT_SOVEREIGN_CONFIG, ...sovereignConfig };
    const { body, skinTone, hairStyle, hairColor, outfit, head_under, helmet, head_over, artifact } = config;

    const getAssetUrl = (category: 'bodyStyles' | 'hairStyles' | 'outfits' | 'head_under_items' | 'helmets' | 'head_over_items' | 'artifacts', id: string | null) => {
        if (!id || id === 'none') return null;
        const asset = SOVEREIGN_ASSETS[category].find(a => a.id === id);
        return asset ? asset.url : null;
    };
    
    const bodyUrl = getAssetUrl('bodyStyles', body);
    const hairUrl = getAssetUrl('hairStyles', hairStyle);
    const outfitUrl = getAssetUrl('outfits', outfit);
    const headUnderUrl = getAssetUrl('head_under_items', head_under);
    const helmetUrl = getAssetUrl('helmets', helmet);
    const headOverUrl = getAssetUrl('head_over_items', head_over);
    const artifactUrl = getAssetUrl('artifacts', artifact);
    
    const hairFilter = hexToCssFilter(hairColor);
    const showHair = (!helmetUrl || helmet === 'none');
    const isBelowHairAccessory = head_under === 'glasses' || head_under === 'aviators' || head_under === 'mask';
    const headUnderBelowHairUrl = isBelowHairAccessory ? headUnderUrl : null;
    const headUnderAboveHairUrl = !isBelowHairAccessory ? headUnderUrl : null;

    return (
        <div className={`relative w-full h-full ${className}`}>
            {/* Body Layer with Colorization using CSS Mask */}
            {bodyUrl && (
                <div
                    className="absolute inset-0 w-full h-full z-0"
                    style={{
                        backgroundColor: skinTone,
                        maskImage: `url(${bodyUrl})`,
                        maskSize: 'contain',
                        maskPosition: 'center',
                        maskRepeat: 'no-repeat',
                        WebkitMaskImage: `url(${bodyUrl})`,
                        WebkitMaskSize: 'contain',
                        WebkitMaskPosition: 'center',
                        WebkitMaskRepeat: 'no-repeat',
                    }}
                />
            )}
            
            {/* Face Features Layer */}
            {bodyUrl && <img src={FACE_FEATURES_URL} alt="Face" className="absolute inset-0 w-full h-full object-contain z-10" />}


            {/* Rendered Layers - These go on top of the base layer */}
            {outfitUrl && <img src={outfitUrl} alt="Outfit" className="absolute inset-0 w-full h-full object-contain z-20" />}
            {headUnderBelowHairUrl && <img src={headUnderBelowHairUrl} alt="Head Under" className="absolute inset-0 w-full h-full object-contain z-30" />}
            {showHair && hairUrl && <img src={hairUrl} alt="Hair" className="absolute inset-0 w-full h-full object-contain z-40" style={hairFilter} />}
            {headUnderAboveHairUrl && <img src={headUnderAboveHairUrl} alt="Head Under" className="absolute inset-0 w-full h-full object-contain z-45" />}
            {helmetUrl && <img src={helmetUrl} alt="Helmet" className="absolute inset-0 w-full h-full object-contain z-50" />}
            {headOverUrl && <img src={headOverUrl} alt="Head Over" className="absolute inset-0 w-full h-full object-contain z-60" />}
            {artifactUrl && <img src={artifactUrl} alt="Artifact" className="absolute inset-0 w-full h-full object-contain z-70" />}
        </div>
    );
};
