import React, { useRef, useEffect } from 'react';
import { SovereignConfig } from '../types';
import { SOVEREIGN_ASSETS, FACE_FEATURES_URL, DEFAULT_SOVEREIGN_CONFIG } from '../constants/avatar';
import { ITEMS_DB } from '../constants/items';
import { getBodyUrl, getHairUrl, BODY_DB, HAIR_DB } from '../constants/skins';
import { applyAvatarOffset, getAvatarOffset, getMascaraDoCorpo, getModoDoCabelo } from '../constants/avatarOffsets';
import { drawAuraCanvasEffect } from '../utils/auraVisuals';

interface CanvasAvatarProps {
    sovereignConfig?: SovereignConfig;
    className?: string;
    width?: number;
    height?: number;
    onImageGenerated?: (dataUrl: string) => void;
}

const hexToCssFilter = (hex: string): string => {
    // Helper to approximate hex color using CSS filters (brightness, sepia, saturate, hue-rotate)
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `brightness(0) saturate(100%) invert(${r/255}) sepia(${g/255}) saturate(${b*20}%) hue-rotate(${(Math.atan2(Math.sqrt(3)*(g-b), 2*r-g-b)*180/Math.PI)+180}deg)`;
};

const globalImageCache = new Map<string, HTMLImageElement>();
const failedImageCache = new Set<string>();

export const CanvasAvatar: React.FC<CanvasAvatarProps> = ({ 
    sovereignConfig, 
    className = '', 
    width = 300, 
    height = 300,
    onImageGenerated
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const config = { ...DEFAULT_SOVEREIGN_CONFIG, ...sovereignConfig };
    const { body, skinTone, hairStyle, hairColor, outfit, artifact, glyph, aura, orb, sovereignPlate, artifactPlate, glyphPlate } = config;

    const getAssetUrl = (category: keyof typeof SOVEREIGN_ASSETS | 'orbs' | 'plates', id: string | null) => {
        if (!id || id === 'none') return null;
        // @ts-ignore
        const asset = SOVEREIGN_ASSETS[category]?.find(a => a.id === id);
        return (asset && typeof asset === 'object' && 'url' in asset) ? (asset as { url?: string }).url || null : null;
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

        const render = async () => {
            try {
                // Create offscreen canvas for double buffering to prevent flickering
                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = width;
                offscreenCanvas.height = height;
                const offscreenCtx = offscreenCanvas.getContext('2d');
                if (!offscreenCtx) return;

                // Qual corpo esta em cena. Um ajuste marcado em `porCorpo` so se
                // aplica quando bate com ele; enquanto for null — que e o caso
                // enquanto o proprio corpo esta sendo desenhado — vale so a base.
                let corpoEmCena: string | null = null;

                const loadAndDrawImage = (url: string | null, options: {
                    tintColor?: string;
                    filter?: string;
                    compositeOperation?: GlobalCompositeOperation;
                    maskMode?: boolean;
                    /**
                     * Onde desenhar. O corpo e o rosto vao para uma camada
                     * propria, porque a mascara da roupa precisa apagar SO eles
                     * — um clearRect no canvas principal levaria junto a aura e
                     * a placa, que sao desenhadas antes.
                     */
                    alvo?: CanvasRenderingContext2D;
                } = {}): Promise<boolean> => {
                    if (!url) return Promise.resolve(false);
                    const destino = options.alvo || offscreenCtx;

                    return new Promise((resolve) => {
                        const draw = (img: HTMLImageElement) => {
                             if (!isMounted) {
                                resolve(false);
                                return;
                            }

                            destino.save();
                            
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
                                    // O ajuste entra na MASCARA, nao no desenho final: a
                                    // tempCanvas e a chapa de cor inteira, e desloca-la
                                    // moveria a cor, nao a peca.
                                    const encaixeMascara = applyAvatarOffset(width, height, getAvatarOffset(url, corpoEmCena));
                                    tempCtx.drawImage(img, encaixeMascara.x, encaixeMascara.y, encaixeMascara.w, encaixeMascara.h);
                                    destino.drawImage(tempCanvas, 0, 0, width, height);
                                }
                            } else {
                                if (options.filter) destino.filter = options.filter;
                                if (options.compositeOperation) destino.globalCompositeOperation = options.compositeOperation;
                                // Encaixe por arquivo. Sem entrada na tabela isto e
                                // exatamente drawImage(img, 0, 0, width, height).
                                const encaixe = applyAvatarOffset(width, height, getAvatarOffset(url, corpoEmCena));
                                destino.drawImage(img, encaixe.x, encaixe.y, encaixe.w, encaixe.h);
                            }
                            
                            destino.restore();
                            resolve(true);
                        };

                        // Check cache first
                        if (globalImageCache.has(url)) {
                            draw(globalImageCache.get(url)!);
                            return;
                        }

                        if (failedImageCache.has(url)) {
                            resolve(false);
                            return;
                        }

                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.src = url;
                        img.onload = () => {
                            globalImageCache.set(url, img);
                            draw(img);
                        };
                        img.onerror = (err) => {
                            const wasFailed = failedImageCache.has(url);
                            failedImageCache.add(url);
                            if (!wasFailed) {
                                console.warn(`CanvasAvatar: Failed to load image ${url}`, err);
                            }
                            resolve(false); 
                        };
                    });
                };

                const drawEmoji = (emoji: string, x: number, y: number, fontSize: number, glowColor?: string) => {
                    if (!isMounted) return;
                    offscreenCtx.save();
                    offscreenCtx.font = `${fontSize}px serif`;
                    offscreenCtx.textAlign = 'center';
                    offscreenCtx.textBaseline = 'middle';
                    
                    if (glowColor) {
                        offscreenCtx.shadowColor = glowColor;
                        offscreenCtx.shadowBlur = 20;
                    }

                    offscreenCtx.fillText(emoji, x, y);
                    offscreenCtx.restore();
                };

                if (!isMounted) return;

                // -1. Sovereign Plate (Background behind everything)
                const sovereignPlateUrl = getAssetUrl('plates', sovereignPlate);
                if (sovereignPlateUrl) {
                    await loadAndDrawImage(sovereignPlateUrl);
                }

                if (!isMounted) return;

                // 0. Aura (Background)
                // @ts-ignore
                const auraUrl = getAssetUrl('auras', aura);
                const auraLoaded = auraUrl ? await loadAndDrawImage(auraUrl, { filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))' }) : false;
                if (!auraLoaded) drawAuraCanvasEffect(offscreenCtx, width, height, aura);

                if (!isMounted) return;

                // 1 e 2. Corpo e rosto, numa camada propria.
                //
                // Eles vao para um canvas separado porque a roupa pode declarar
                // que cobre bracos, pernas ou pes — e nesse caso essas partes do
                // corpo nao devem ser desenhadas por baixo dela. Apagar direto no
                // canvas principal levaria junto a placa e a aura, que ja foram
                // desenhadas por baixo.
                const camadaCorpo = document.createElement('canvas');
                camadaCorpo.width = width;
                camadaCorpo.height = height;
                const ctxCorpo = camadaCorpo.getContext('2d');
                if (!ctxCorpo) return;

                const newBodyDef = BODY_DB.find(b => b.id === body);
                let bodyUrl: string | null = null;

                if (newBodyDef) {
                    // New system: Pre-tinted body
                    bodyUrl = getBodyUrl(newBodyDef.gender, newBodyDef.toneId);
                    await loadAndDrawImage(bodyUrl, { alvo: ctxCorpo }); // No tint, no mask
                } else {
                    // Old system fallback
                    bodyUrl = getAssetUrl('bodyStyles', body);
                    if (bodyUrl) {
                        await loadAndDrawImage(bodyUrl, { tintColor: skinTone, maskMode: true, alvo: ctxCorpo });
                    }
                }

                corpoEmCena = bodyUrl;

                if (!isMounted) return;

                // 2. Face Features
                if (bodyUrl && FACE_FEATURES_URL) {
                    await loadAndDrawImage(FACE_FEATURES_URL, { alvo: ctxCorpo });
                }

                if (!isMounted) return;

                // 3. Outfit
                const outfitUrl = getAssetUrl('outfits', outfit);

                // A roupa apaga do corpo o que ela cobre por inteiro, e so entao
                // a camada do corpo entra. Sem declaracao na tabela, o laco nao
                // roda e o resultado e identico ao de antes.
                for (const [mx, my, mw, mh] of getMascaraDoCorpo(outfitUrl, width, height)) {
                    ctxCorpo.clearRect(mx, my, mw, mh);
                }
                offscreenCtx.drawImage(camadaCorpo, 0, 0);

                if (!isMounted) return;

                // 4. Hair (Tinted or Pre-colored)
                //
                // Virou funcao porque a ordem depende da roupa. Cinco das
                // dezoito cobrem a calota do cranio, e nelas desenhar o cabelo
                // por cima produz cabelo longo pendurado na frente de um elmo
                // fechado. Elmo esconde; capuz, bone e turbante deixam o cabelo
                // espiar por baixo. As outras treze cobrem zero e seguem por
                // cima, como sempre.
                const desenharCabelo = async () => {
                    const newHairDef = HAIR_DB.find(h => h.id === hairStyle);
                    if (newHairDef) {
                        // New system
                        const url = getHairUrl(hairStyle, hairColor);

                        // Se tiver filename fixo, aplicamos filtro de cor
                        if (newHairDef.filename) {
                            const filter = hexToCssFilter(hairColor);
                            await loadAndDrawImage(url, { filter });
                        } else {
                            // Se for URL dinâmica (pré-colorida), carregamos direto
                            await loadAndDrawImage(url);
                        }
                    } else {
                        const hairUrl = getAssetUrl('hairStyles', hairStyle);
                        if (hairUrl) {
                            const filter = hexToCssFilter(hairColor);
                            await loadAndDrawImage(hairUrl, { filter });
                        }
                    }
                };

                const modoDoCabelo = getModoDoCabelo(outfitUrl);

                if (modoDoCabelo === 'porBaixo') {
                    await desenharCabelo();
                    if (!isMounted) return;
                }

                await loadAndDrawImage(outfitUrl);

                if (!isMounted) return;

                if (modoDoCabelo === 'porCima') {
                    await desenharCabelo();
                }

                if (!isMounted) return;

                // 5. Artifact Plate
                const artifactPlateUrl = getAssetUrl('plates', artifactPlate);
                if (artifactPlateUrl) {
                    await loadAndDrawImage(artifactPlateUrl);
                }

                if (!isMounted) return;

                // 6. Artifact
                const artifactUrl = getAssetUrl('artifacts', artifact);
                await loadAndDrawImage(artifactUrl);

                if (!isMounted) return;

                // 7. Glyph Plate
                const glyphPlateUrl = getAssetUrl('plates', glyphPlate);
                if (glyphPlateUrl) {
                    await loadAndDrawImage(glyphPlateUrl);
                }

                if (!isMounted) return;

                // 8. Glyph (Foreground - at feet/side)
                const glyphUrl = getAssetUrl('glyphs', glyph);
                const glyphLoaded = await loadAndDrawImage(glyphUrl);
                if (!glyphLoaded) {
                    const glyphIcon = getItemIcon(glyph);
                    if (glyphIcon) {
                        drawEmoji(glyphIcon, width * 0.8, height * 0.9, 80, '#FFFFFF');
                    }
                }

                if (!isMounted) return;

                // 9. Orb
                const orbUrl = getAssetUrl('orbs', orb);
                if (orbUrl) {
                    await loadAndDrawImage(orbUrl);
                }

                // Final Step: Draw everything to main canvas
                if (isMounted) {
                    ctx.clearRect(0, 0, width, height);
                    ctx.drawImage(offscreenCanvas, 0, 0);

                    // Generate Data URL
                    if (onImageGenerated) {
                        const dataUrl = canvas.toDataURL('image/png');
                        onImageGenerated(dataUrl);
                    }
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
