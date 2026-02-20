import React, { useRef, useEffect } from 'react';
import { SovereignConfig } from '../types';
import { SOVEREIGN_ASSETS, FACE_FEATURES_URL, DEFAULT_SOVEREIGN_CONFIG } from '../constants/avatar';
import { ITEMS_DB } from '../constants/items';

interface CanvasAvatarProps {
    sovereignConfig?: SovereignConfig;
    className?: string;
    width?: number;
    height?: number;
    onImageGenerated?: (dataUrl: string) => void;
}

const hexToCssFilter = (hex: string): string => {
    // Helper to approximate hex color using CSS filters (brightness, sepia, saturate, hue-rotate)
    // This is a complex approximation. A simpler approach is usually canvas globalCompositeOperation 'source-in' or 'multiply'
    // but here we are using filter.
    // For simplicity in this example, we return a basic filter or rely on the caller to handle tinting via maskMode.
    // However, the original code had a specific implementation. We'll try to keep it simple or reuse if possible.
    // The original code:
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
    const { body, skinTone, hairStyle, hairColor, outfit, head_under, helmet, head_over, artifact, glyph, aura } = config;

    const getAssetUrl = (category: keyof typeof SOVEREIGN_ASSETS, id: string | null) => {
        if (!id || id === 'none') return null;
        // @ts-ignore
        const asset = SOVEREIGN_ASSETS[category]?.find(a => a.id === id);
        return (typeof asset === 'object' && asset) ? asset.url : null;
    };

    const getItemIcon = (itemId: string | undefined) => {
        if (!itemId) return null;
        const item = ITEMS_DB.find(i => i.id === itemId);
        return item ? item.icon : null;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let isMounted = true;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const loadAndDrawImage = (url: string | null, options: { 
            tintColor?: string; 
            filter?: string; 
            compositeOperation?: GlobalCompositeOperation;
            maskMode?: boolean; 
        } = {}): Promise<void> => {
            if (!url) return Promise.resolve();

            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = url;
                img.onload = () => {
                    if (!isMounted) {
                        resolve();
                        return;
                    }

                    ctx.save();
                    
                    if (options.maskMode && options.tintColor) {
                        // Create a temporary canvas for masking
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = width;
                        tempCanvas.height = height;
                        const tempCtx = tempCanvas.getContext('2d');
                        if (tempCtx) {
                            tempCtx.fillStyle = options.tintColor;
                            tempCtx.fillRect(0, 0, width, height);
                            tempCtx.globalCompositeOperation = 'destination-in';
                            tempCtx.drawImage(img, 0, 0, width, height);
                            ctx.drawImage(tempCanvas, 0, 0, width, height);
                        }
                    } else {
                        if (options.filter) ctx.filter = options.filter;
                        if (options.compositeOperation) ctx.globalCompositeOperation = options.compositeOperation;
                        ctx.drawImage(img, 0, 0, width, height);
                    }
                    
                    ctx.restore();
                    resolve();
                };
                img.onerror = (err) => {
                    console.error(`CanvasAvatar: Failed to load image ${url}`, err);
                    resolve(); 
                };
            });
        };

        const drawEmoji = (emoji: string, x: number, y: number, fontSize: number, glowColor?: string) => {
            if (!isMounted) return;
            ctx.save();
            ctx.font = `${fontSize}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (glowColor) {
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 20;
            }

            ctx.fillText(emoji, x, y);
            ctx.restore();
        };

        const render = async () => {
            try {
                if (!isMounted) return;

                // 0. Aura (Background)
                // @ts-ignore
                const auraUrl = getAssetUrl('auras', aura);
                if (auraUrl) {
                    await loadAndDrawImage(auraUrl, { filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))' });
                } else {
                    const auraIcon = getItemIcon(aura);
                    if (auraIcon) {
                        drawEmoji(auraIcon, width / 2, height / 2, 200, '#FFD700'); // Big aura behind
                    }
                }

                if (!isMounted) return;

                // 1. Body (Masked with Skin Tone)
                const bodyUrl = getAssetUrl('bodyStyles', body);
                if (bodyUrl) {
                    await loadAndDrawImage(bodyUrl, { tintColor: skinTone, maskMode: true });
                }

                if (!isMounted) return;

                // 2. Face Features
                if (bodyUrl && FACE_FEATURES_URL) {
                    await loadAndDrawImage(FACE_FEATURES_URL);
                }

                if (!isMounted) return;

                // 3. Outfit
                const outfitUrl = getAssetUrl('outfits', outfit);
                await loadAndDrawImage(outfitUrl);

                if (!isMounted) return;

                // 4. Head Under (Below Hair)
                const headUnderUrl = getAssetUrl('head_under_items', head_under);
                const isBelowHairAccessory = head_under === 'glasses' || head_under === 'aviators' || head_under === 'mask';
                if (isBelowHairAccessory) {
                    await loadAndDrawImage(headUnderUrl);
                }

                if (!isMounted) return;

                // 5. Hair (Tinted)
                const hairUrl = getAssetUrl('hairStyles', hairStyle);
                const showHair = (!helmet || helmet === 'none');
                if (showHair && hairUrl) {
                    const filter = hexToCssFilter(hairColor);
                    await loadAndDrawImage(hairUrl, { filter });
                }

                if (!isMounted) return;

                // 6. Head Under (Above Hair)
                if (!isBelowHairAccessory) {
                    await loadAndDrawImage(headUnderUrl);
                }

                if (!isMounted) return;

                // 7. Helmet
                const helmetUrl = getAssetUrl('helmets', helmet);
                await loadAndDrawImage(helmetUrl);

                if (!isMounted) return;

                // 8. Head Over
                const headOverUrl = getAssetUrl('head_over_items', head_over);
                await loadAndDrawImage(headOverUrl);

                if (!isMounted) return;

                // 9. Artifact
                const artifactUrl = getAssetUrl('artifacts', artifact);
                await loadAndDrawImage(artifactUrl);

                if (!isMounted) return;

                // 10. Glyph (Foreground - at feet/side)
                const glyphUrl = getAssetUrl('glyphs', glyph);
                if (glyphUrl) {
                    // Draw at bottom right, smaller
                    // You might need to adjust positioning for image vs emoji
                    // Assuming glyph images are square and centered, we draw them full size or scaled
                    // Original emoji was at 0.8w, 0.9h
                    // Let's try to draw image similarly
                    // If image is full frame, just draw it. If it's an icon, draw it small.
                    // The glyphs seem to be "Moldes de Glifo - Bases de Pedra" or icons.
                    // Assuming they are full-frame overlays or icons.
                    // If they are icons, we should scale and position.
                    // If they are full-frame effects (like aura), we draw full.
                    // Based on "Moldes de Glifo", they sound like base stones.
                    // Let's draw them full size for now, assuming they are positioned correctly in the PNG.
                    await loadAndDrawImage(glyphUrl);
                } else {
                    const glyphIcon = getItemIcon(glyph);
                    if (glyphIcon) {
                        // Draw at bottom right or left
                        drawEmoji(glyphIcon, width * 0.8, height * 0.9, 80, '#FFFFFF');
                    }
                }

                // Generate Data URL
                if (onImageGenerated && isMounted) {
                    const dataUrl = canvas.toDataURL('image/png');
                    onImageGenerated(dataUrl);
                }
            } catch (error) {
                console.error("CanvasAvatar: Render error", error);
            }
        };

        render();

        return () => {
            isMounted = false;
        };
    }, [config, width, height, onImageGenerated]);

    return <canvas ref={canvasRef} width={width} height={height} className={className} />;
};
