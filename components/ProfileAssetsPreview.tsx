import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Asset } from '../types';
import { AssetDossier } from './AssetDossier';
import { Sephirot } from './Sephirot';
import { SephirotFog } from './SephirotFog';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';

const SEPHIROT_COORDS = [
    { id: 'consciencia', x: 50, y: 7 },
    { id: 'espaco-mental', x: 16.66, y: 21.5 },
    { id: 'espiritualidade', x: 83.33, y: 21.5 },
    { id: 'proposito', x: 16.66, y: 35.5 },
    { id: 'projetos', x: 83.33, y: 35.5 },
    { id: 'conexoes', x: 50, y: 49.5 },
    { id: 'trabalho', x: 16.66, y: 64.5 },
    { id: 'financas', x: 83.33, y: 64.5 },
    { id: 'hobbies', x: 50, y: 78.5 },
    { id: 'fisico', x: 50, y: 93 },
];

type FogConfig = {
    color: string;
    tintStrength: number;
    alphaMax: number;
};

const hexToRgb = (hex: string): [number, number, number] | null => {
    const normalized = hex.replace('#', '').trim();
    if (normalized.length !== 6) return null;
    const value = Number.parseInt(normalized, 16);
    if (Number.isNaN(value)) return null;
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const rgbaString = (rgb: [number, number, number] | null, alpha: number): string =>
    rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})` : `rgba(212, 175, 55, ${alpha})`;

const readCssNumber = (value: string | null | undefined, fallback: number): number => {
    const parsed = Number.parseFloat((value || '').trim());
    return Number.isFinite(parsed) ? parsed : fallback;
};

const hasRasterSephirotBackground = (value: string | null | undefined): boolean => {
    const normalized = (value || '').trim();
    if (!normalized || normalized === 'none') return false;
    return /url\((['"]?).+\.(png|jpe?g)(?:[?#][^'")]*)?\1\)/i.test(normalized);
};

export const ProfileAssetsPreview: React.FC<{
    assets: Asset[];
    skinId?: string;
    onClose: () => void;
}> = ({ assets, skinId = 'BASIC', onClose }) => {
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [fogConfig, setFogConfig] = useState<FogConfig>({
        color: '#ffffff',
        tintStrength: 0.08,
        alphaMax: 0.13,
    });
    const [hasSephirotRasterArt, setHasSephirotRasterArt] = useState(false);

    const selectedAsset = useMemo(
        () => assets.find((asset) => asset.id === selectedAssetId) || null,
        [assets, selectedAssetId]
    );

    const baseAspect = 9 / 16;
    const containerAspect = containerSize.width > 0 && containerSize.height > 0
        ? containerSize.width / containerSize.height
        : baseAspect;
    const stretchY = containerAspect < baseAspect ? baseAspect / containerAspect : 1;

    const fogPoints = useMemo(() => {
        const assetById = new Map<string, Asset>(assets.map((asset) => [asset.id, asset]));

        return SEPHIROT_COORDS.map((coord) => {
            const yNorm = coord.y / 100;
            const yStretched = Math.min(1, Math.max(0, (yNorm - 0.5) * stretchY + 0.5));
            const asset = assetById.get(coord.id);
            return {
                x: coord.x,
                y: yStretched * 100,
                level: asset ? asset.level : 1,
            };
        });
    }, [assets, stretchY]);

    useLayoutEffect(() => {
        const target = containerRef.current ?? document.documentElement;
        const styles = getComputedStyle(target);
        const fogColor = styles.getPropertyValue('--fog-color').trim() || styles.getPropertyValue('--skin-accent-color').trim() || '#ffffff';
        const tintStrength = readCssNumber(styles.getPropertyValue('--fog-tint-strength'), 0.22);
        const alphaMax = readCssNumber(styles.getPropertyValue('--fog-alpha-max'), 0.15);
        const sephirotBackground = styles.getPropertyValue('--sephirot-bg-image').trim();
        setFogConfig({ color: fogColor, tintStrength, alphaMax });
        setHasSephirotRasterArt(hasRasterSephirotBackground(sephirotBackground));
    }, [skinId]);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateSize = () => {
            const rect = container.getBoundingClientRect();
            setContainerSize({ width: rect.width, height: rect.height });
        };

        updateSize();

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(() => updateSize());
            observer.observe(container);
            return () => observer.disconnect();
        }

        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const selectedAssetAccent = selectedAsset
        ? ASSET_ACCENT_COLORS[selectedAsset.id as keyof typeof ASSET_ACCENT_COLORS] || '#4b5563'
        : '#4b5563';
    const selectedAssetAccentRgb = hexToRgb(selectedAssetAccent);
    const selectedAssetShellStyle: React.CSSProperties = {
        backgroundImage: `radial-gradient(circle at 16% 0%, rgba(255,246,204,0.42), transparent 29%),
            radial-gradient(circle at 24% 22%, rgba(226,192,98,0.24), transparent 25%),
            radial-gradient(circle at 92% 88%, ${rgbaString(selectedAssetAccentRgb, 0.2)}, transparent 24%),
            linear-gradient(135deg, rgba(224,186,84,0.42) 0%, rgba(255,250,230,0.08) 18%, rgba(8,8,8,0.94) 46%, rgba(2,2,2,0.98) 66%, ${rgbaString(selectedAssetAccentRgb, 0.12)} 100%)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 48px rgba(0,0,0,0.42)',
    };

    if (selectedAsset) {
        return (
            <div data-skin={skinId} className="flex h-full flex-col">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-1 pb-3">
                    <button
                        type="button"
                        onClick={() => setSelectedAssetId(null)}
                        className="rounded-xl border border-white/10 bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/78 transition-colors hover:bg-white/10"
                    >
                        Voltar
                    </button>
                    <div className="text-center text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                        Widgets do ativo
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] luxe-skin-button"
                    >
                        OK
                    </button>
                </div>

                <div className="mt-3 flex-1 overflow-y-auto">
                    <div
                        className="dossier-bg relative flex flex-col overflow-hidden rounded-[28px] border border-[color:var(--skin-accent-color)] px-4 pb-4 pt-4 shadow-2xl shadow-black/50"
                        style={selectedAssetShellStyle}
                    >
                        <div
                            className="modal-aura-overlay"
                            style={{ '--modal-aura-color': 'rgba(229, 191, 88, 0.16)' } as React.CSSProperties}
                        />
                        <div
                            className="modal-sheen-overlay"
                            style={{ '--modal-sheen-color': 'rgba(255, 222, 120, 0.82)', zIndex: 24 } as React.CSSProperties}
                        />
                        <div className="relative z-10">
                            <AssetDossier
                                asset={selectedAsset}
                                onBack={() => setSelectedAssetId(null)}
                                embedded
                                showArenas={false}
                                showHeader={false}
                                showLevelPanel
                                showEditButton={false}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div data-skin={skinId} className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-1 pb-3">
                <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/72">
                    Ativos
                </div>
                <div className="text-center text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                    Ativos e widgets visiveis
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] luxe-skin-button"
                >
                    OK
                </button>
            </div>

            <div className="mt-3 flex-1 overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_30%),linear-gradient(180deg,#070707_0%,#020202_100%)]">
                <div ref={containerRef} className="relative h-full w-full">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-black" />
                        <SephirotFog
                            points={fogPoints}
                            color={fogConfig.color}
                            mode="sephirot"
                            tintStrength={fogConfig.tintStrength}
                            alphaMaxOverride={fogConfig.alphaMax}
                        />
                    </div>

                    <div className="relative z-10 h-full w-full">
                        {SEPHIROT_COORDS.map((coord) => {
                            const asset = assets.find((item) => item.id === coord.id);
                            if (!asset) return null;

                            const yNorm = coord.y / 100;
                            const yStretched = Math.min(1, Math.max(0, (yNorm - 0.5) * stretchY + 0.5));

                            return (
                                <div
                                    key={asset.id}
                                    className="absolute flex items-center justify-center"
                                    style={{
                                        left: `${coord.x}%`,
                                        top: `${yStretched * 100}%`,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                >
                                    <Sephirot
                                        asset={asset}
                                        onClick={() => setSelectedAssetId(asset.id)}
                                        useSkinArtworkOnly={hasSephirotRasterArt}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
