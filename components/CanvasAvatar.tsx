import React, { useRef, useEffect, useState } from 'react';
import { SovereignConfig } from '../types';
import { SOVEREIGN_ASSETS, FACE_FEATURES_URL, DEFAULT_SOVEREIGN_CONFIG } from '../constants/avatar';

interface CanvasAvatarProps {
    sovereignConfig?: SovereignConfig;
    className?: string;
    width?: number;
    height?: number;
    onImageGenerated?: (dataUrl: string) => void;
}

const hexToCssFilter = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // This approximation logic mimics the one in Avatar.tsx
    return `brightness(0) saturate(100%) invert(${r/255}) sepia(${g/255}) saturate(${b*20}%) hue-rotate(${(Math.atan2(Math.sqrt(3)*(g-b), 2*r-g-b)*180/Math.PI)+180}deg)`;
};

export const CanvasAvatar: React.FC<CanvasAvatarProps> = ({ 
    sovereignConfig, 
    className = '', 
    width = 300, 
    height = 300,
    onImageGenerated
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const config = { ...DEFAULT_SOVEREIGN_CONFIG, ...sovereignConfig };
    const { body, skinTone, hairStyle, hairColor, outfit, head_under, helmet, head_over, artifact } = config;

    const getAssetUrl = (category: keyof typeof SOVEREIGN_ASSETS, id: string | null) => {
        if (!id || id === 'none') return null;
        // @ts-ignore
        const asset = SOVEREIGN_ASSETS[category].find(a => a.id === id);
        return (typeof asset === 'object' && asset) ? asset.url : null;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const loadAndDrawImage = (url: string | null, options: { 
            tintColor?: string; 
            filter?: string; 
            compositeOperation?: GlobalCompositeOperation;
            maskMode?: boolean; // If true, draws color then masks with image
        } = {}): Promise<void> => {
            if (!url) return Promise.resolve();

            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = url;
                img.onload = () => {
                    ctx.save();
                    
                    if (options.maskMode && options.tintColor) {
                        // Create a temporary canvas for masking
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = width;
                        tempCanvas.height = height;
                        const tempCtx = tempCanvas.getContext('2d');
                        if (tempCtx) {
                            // Draw the color
                            tempCtx.fillStyle = options.tintColor;
                            tempCtx.fillRect(0, 0, width, height);
                            // Mask with the image (destination-in keeps the color where image is opaque)
                            tempCtx.globalCompositeOperation = 'destination-in';
                            tempCtx.drawImage(img, 0, 0, width, height);
                            
                            // Draw the result onto main canvas
                            ctx.drawImage(tempCanvas, 0, 0, width, height);
                        }
                    } else {
                        if (options.filter) {
                            ctx.filter = options.filter;
                        }
                        if (options.compositeOperation) {
                            ctx.globalCompositeOperation = options.compositeOperation;
                        }
                        ctx.drawImage(img, 0, 0, width, height);
                    }
                    
                    ctx.restore();
                    resolve();
                };
                img.onerror = () => resolve(); // Skip on error
            });
        };

        const render = async () => {
            // 1. Body (Masked with Skin Tone)
            const bodyUrl = getAssetUrl('bodyStyles', body);
            if (bodyUrl) {
                await loadAndDrawImage(bodyUrl, { tintColor: skinTone, maskMode: true });
            }

            // 2. Face Features
            if (bodyUrl) {
                await loadAndDrawImage(FACE_FEATURES_URL);
            }

            // 3. Outfit
            const outfitUrl = getAssetUrl('outfits', outfit);
            await loadAndDrawImage(outfitUrl);

            // 4. Head Under (Below Hair)
            const headUnderUrl = getAssetUrl('head_under_items', head_under);
            const isBelowHairAccessory = head_under === 'glasses' || head_under === 'aviators' || head_under === 'mask';
            if (isBelowHairAccessory) {
                await loadAndDrawImage(headUnderUrl);
            }

            // 5. Hair (Tinted)
            const hairUrl = getAssetUrl('hairStyles', hairStyle);
            const showHair = (!helmet || helmet === 'none');
            if (showHair && hairUrl) {
                const filter = hexToCssFilter(hairColor);
                await loadAndDrawImage(hairUrl, { filter });
            }

            // 6. Head Under (Above Hair)
            if (!isBelowHairAccessory) {
                await loadAndDrawImage(headUnderUrl);
            }

            // 7. Helmet
            const helmetUrl = getAssetUrl('helmets', helmet);
            await loadAndDrawImage(helmetUrl);

            // 8. Head Over
            const headOverUrl = getAssetUrl('head_over_items', head_over);
            await loadAndDrawImage(headOverUrl);

            // 9. Artifact
            const artifactUrl = getAssetUrl('artifacts', artifact);
            await loadAndDrawImage(artifactUrl);

            // Generate Data URL
            if (onImageGenerated) {
                const dataUrl = canvas.toDataURL('image/png');
                onImageGenerated(dataUrl);
            }
        };

        render();

    }, [config, width, height, onImageGenerated]);

    return <canvas ref={canvasRef} width={width} height={height} className={className} />;
};
