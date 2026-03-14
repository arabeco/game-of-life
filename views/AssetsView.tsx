import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Asset } from '../types';
import { AssetDossier } from '../components/AssetDossier';
import { AssetArenaBoard } from '../components/AssetArenaBoard';
import { Sephirot } from '../components/Sephirot';
import { SephirotFog } from '../components/SephirotFog';
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

type AssetSubview = 'arenas' | 'widgets';

type FogConfig = {
    color: string;
    tintStrength: number;
    alphaMax: number;
};

const ASSETS_VIEW_VERTICAL_BLEED_PX = 18;

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

const SegmentedButton: React.FC<{
    active: boolean;
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
}> = ({ active, icon, title, onClick }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        className={`rounded-full px-2.5 py-1.5 text-[10px] font-black transition-all ${
            active
                ? 'bg-[var(--skin-accent-color)] text-black shadow-[0_6px_16px_rgba(0,0,0,0.22)]'
                : 'bg-white/5 text-white/55 hover:bg-white/10'
        }`}
    >
        <span aria-hidden="true" className="inline-flex h-3.5 w-3.5 items-center justify-center">
            {icon}
        </span>
    </button>
);

export const AssetsView: React.FC = () => {
    const { assets, userProfile, appMode } = useGame();
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [assetSubview, setAssetSubview] = useState<AssetSubview>('arenas');
    const [isWidgetEditing, setIsWidgetEditing] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [fogConfig, setFogConfig] = useState<FogConfig>({
        color: '#ffffff',
        tintStrength: 0.08,
        alphaMax: 0.13,
    });
    const [hasSephirotRasterArt, setHasSephirotRasterArt] = useState(false);

    const isBasicMode = appMode === 'BASIC';
    const basicSephirotLevelColor = '#3b2412';
    const selectedAsset = assets.find(a => a.id === selectedAssetId) || null;
    const selectedAssetAccent = selectedAsset
        ? ASSET_ACCENT_COLORS[selectedAsset.id as keyof typeof ASSET_ACCENT_COLORS] || '#4b5563'
        : '#4b5563';
    const selectedAssetAccentRgb = hexToRgb(selectedAssetAccent);

    const baseAspect = 9 / 16;
    const viewportBaseHeight = '100svh - 80px - var(--safe-area-top) - 64px - var(--safe-area-bottom)';
    const shellVerticalBleed = isBasicMode ? 0 : ASSETS_VIEW_VERTICAL_BLEED_PX;
    const assetsShellStyle: React.CSSProperties = {
        height: `calc(${viewportBaseHeight} + ${shellVerticalBleed * 2}px)`,
        minHeight: `calc(${viewportBaseHeight} + ${shellVerticalBleed * 2}px)`,
        marginTop: shellVerticalBleed ? `-${shellVerticalBleed}px` : undefined,
        marginBottom: shellVerticalBleed ? `-${shellVerticalBleed}px` : undefined,
        paddingTop: shellVerticalBleed ? `${shellVerticalBleed}px` : undefined,
        paddingBottom: shellVerticalBleed ? `${shellVerticalBleed}px` : undefined,
    };
    const containerAspect = containerSize.width > 0 && containerSize.height > 0
        ? containerSize.width / containerSize.height
        : baseAspect;
    const stretchY = containerAspect < baseAspect ? baseAspect / containerAspect : 1;

    const fogPoints = useMemo(() => {
        const assetById = new Map<string, Asset>(assets.map(asset => [asset.id, asset]));

        return SEPHIROT_COORDS.map(coord => {
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
    }, [userProfile.skin, appMode]);

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

    const handleOpenAsset = (asset: Asset) => {
        setSelectedAssetId(asset.id);
        setAssetSubview('arenas');
        setIsWidgetEditing(false);
    };

    const handleBack = () => {
        setSelectedAssetId(null);
        setAssetSubview('arenas');
        setIsWidgetEditing(false);
    };

    const handleSubviewChange = (view: AssetSubview) => {
        setAssetSubview(view);
        if (view !== 'widgets') {
            setIsWidgetEditing(false);
        }
    };

    const showAssetAura = isBasicMode || assetSubview === 'arenas';
    const selectedAssetShellStyle: React.CSSProperties = {
        backgroundImage: `radial-gradient(circle at 16% 0%, rgba(255,246,204,0.42), transparent 29%),
            radial-gradient(circle at 24% 22%, rgba(226,192,98,0.24), transparent 25%),
            radial-gradient(circle at 92% 88%, ${rgbaString(selectedAssetAccentRgb, 0.2)}, transparent 24%),
            linear-gradient(135deg, rgba(224,186,84,0.42) 0%, rgba(255,250,230,0.08) 18%, rgba(8,8,8,0.94) 46%, rgba(2,2,2,0.98) 66%, ${rgbaString(selectedAssetAccentRgb, 0.12)} 100%)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 48px rgba(0,0,0,0.42)',
    };

    if (selectedAsset) {
        return (
            <div className="h-full overflow-y-auto px-4 pb-4">
                <div className="mx-auto max-w-[520px]">
                    <div
                        className="dossier-bg relative flex flex-col overflow-hidden rounded-[28px] border border-[color:var(--skin-accent-color)] px-4 pb-4 pt-4 shadow-2xl shadow-black/50"
                        style={selectedAssetShellStyle}
                    >
                        {showAssetAura && (
                            <div
                                className="modal-aura-overlay"
                                style={{ '--modal-aura-color': 'rgba(229, 191, 88, 0.16)' } as React.CSSProperties}
                            />
                        )}
                        <div
                            className="modal-sheen-overlay"
                            style={{
                                '--modal-sheen-color': 'rgba(255, 222, 120, 0.82)',
                                zIndex: 24,
                            } as React.CSSProperties}
                        />
                        <div className="relative z-10">
                        <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
                            {!isBasicMode && assetSubview === 'widgets' ? (
                                <button
                                    type="button"
                                    onClick={() => setIsWidgetEditing((value) => !value)}
                                    className={`justify-self-start rounded-full border border-white/20 p-1.5 transition-colors ${isWidgetEditing ? 'bg-[var(--skin-accent-color)]/20 border-[var(--skin-accent-color)]/40' : 'bg-transparent'}`}
                                    title="Editar widgets"
                                >
                                    <svg className={`h-4 w-4 ${isWidgetEditing ? 'text-white' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                                    </svg>
                                </button>
                            ) : (
                                <div className="h-8 w-8 justify-self-start" />
                            )}

                            {!isBasicMode ? (
                                <div className="mt-0.5 flex items-center justify-self-center gap-1 rounded-full border border-white/10 bg-black/20 p-1">
                                    <SegmentedButton
                                        active={assetSubview === 'arenas'}
                                        icon={'\u25A6'}
                                        title="Arenas"
                                        onClick={() => handleSubviewChange('arenas')}
                                    />
                                    <SegmentedButton
                                        active={assetSubview === 'widgets'}
                                        icon={'\u25EB'}
                                        title="Widgets"
                                        onClick={() => handleSubviewChange('widgets')}
                                    />
                                </div>
                            ) : (
                                <div className="justify-self-center" />
                            )}

                            <button
                                type="button"
                                onClick={handleBack}
                                className="justify-self-end px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.22em] rounded-lg luxe-skin-button"
                            >
                                OK
                            </button>
                        </div>

                        <div className="min-w-0 pb-3 pt-2 text-center">
                            <p className="luxe-title-ornate truncate px-6 text-lg font-black uppercase tracking-[0.18em] text-[color:var(--skin-accent-color)] luxe-title-shadow">
                                {selectedAsset.name}
                            </p>
                        </div>

                        <div className="overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                        {isBasicMode || assetSubview === 'arenas' ? (
                            <div className="space-y-2">
                                <div className="pt-0 text-center">
                                    <p className="text-xs font-medium tracking-[0.08em] text-white/62">Nivel {selectedAsset.level}</p>
                                </div>
                                <AssetArenaBoard asset={selectedAsset} />
                                </div>
                            ) : (
                                <AssetDossier
                                    asset={selectedAsset}
                                    onBack={handleBack}
                                    embedded
                                    showArenas={false}
                                    showHeader={false}
                                    showLevelPanel
                                    showEditButton={false}
                                    isEditingOverride={isWidgetEditing}
                                    onToggleEditing={() => setIsWidgetEditing((value) => !value)}
                                />
                            )}
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full overflow-hidden bg-black">
            <div
                className="relative flex items-center justify-center overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_30%),linear-gradient(180deg,#070707_0%,#020202_100%)]"
                style={assetsShellStyle}
            >
                <div ref={containerRef} className="relative h-full w-full">
                    {!isBasicMode && (
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
                    )}

                    <div className="relative z-10 h-full w-full">
                        <div id="assets-grid" className="relative h-full w-full">
                            {SEPHIROT_COORDS.map(coord => {
                                const asset = assets.find(a => a.id === coord.id);
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
                                            onClick={() => handleOpenAsset(asset)}
                                            levelColor={isBasicMode ? basicSephirotLevelColor : undefined}
                                            useSkinArtworkOnly={hasSephirotRasterArt}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
