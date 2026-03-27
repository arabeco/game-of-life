import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Asset, Slot, SlotValue } from '../types';
import { AssetArenaBoard } from './AssetArenaBoard';
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

const isSlotValueEmpty = (value: SlotValue | undefined): boolean => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized.length === 0 || normalized === 'nao definido' || normalized === 'não definido';
    }
    if (typeof value === 'number') return false;
    return !value.imageUrl?.trim();
};

const getPrimaryAssetSlot = (asset: Asset, assetWidgetValues: Partial<Record<string, SlotValue>>): Slot | null => {
    const baseSlot = asset.slots?.[0];
    if (!baseSlot) return null;
    const storedValue = assetWidgetValues[asset.id];
    return {
        ...baseSlot,
        value: storedValue !== undefined ? storedValue : baseSlot.value,
    };
};

export const ProfileAssetsPreview: React.FC<{
    assets: Asset[];
    skinId?: string;
    assetArtById?: Partial<Record<string, string>>;
    assetWidgetValues?: Partial<Record<string, SlotValue>>;
    visibleWidgetAssetIds?: string[];
    showArenaBoards?: boolean;
    onClose: () => void;
}> = ({
    assets,
    skinId = 'BASIC',
    assetArtById = {},
    assetWidgetValues = {},
    visibleWidgetAssetIds = [],
    showArenaBoards = true,
    onClose,
}) => {
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
    const selectedAssetLevel = selectedAsset ? Math.max(1, Number(selectedAsset.level || 1)) : 1;
    const selectedAssetMasteryPhrase = selectedAsset?.levelDescriptions?.[selectedAssetLevel] || '';
    const selectedAssetAccentRgb = hexToRgb(selectedAssetAccent);
    const selectedAssetArtUrl = selectedAsset ? assetArtById[selectedAsset.id] : undefined;
    const selectedAssetPrimarySlot = selectedAsset
        ? getPrimaryAssetSlot(selectedAsset, assetWidgetValues)
        : null;
    const canShowSelectedAssetWidget = !!(
        selectedAsset &&
        selectedAssetPrimarySlot &&
        visibleWidgetAssetIds.includes(selectedAsset.id) &&
        !isSlotValueEmpty(selectedAssetPrimarySlot.value)
    );
    const selectedAssetShellStyle: React.CSSProperties = {
        backgroundImage: `radial-gradient(circle at 16% 0%, rgba(255,246,204,0.26), transparent 29%),
            radial-gradient(circle at 24% 22%, rgba(226,192,98,0.16), transparent 25%),
            radial-gradient(circle at 92% 88%, ${rgbaString(selectedAssetAccentRgb, 0.14)}, transparent 24%),
            linear-gradient(135deg, rgba(224,186,84,0.24) 0%, rgba(255,250,230,0.06) 18%, rgba(8,8,8,0.94) 46%, rgba(2,2,2,0.98) 66%, ${rgbaString(selectedAssetAccentRgb, 0.08)} 100%)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 48px rgba(0,0,0,0.42)',
    };
    const selectedAssetCanvasStyle: React.CSSProperties = {
        backgroundImage: `${selectedAssetArtUrl ? `linear-gradient(180deg, rgba(5,5,7,0.18) 0%, rgba(5,5,7,0.78) 46%, rgba(5,5,7,0.94) 100%), url("${selectedAssetArtUrl.replace(/"/g, '\\"')}"), ` : ''}radial-gradient(circle at 16% 0%, rgba(255,246,204,0.28), transparent 29%),
            radial-gradient(circle at 92% 88%, ${rgbaString(selectedAssetAccentRgb, 0.16)}, transparent 24%),
            linear-gradient(180deg, rgba(9,11,16,0.9) 0%, rgba(5,6,9,0.96) 100%)`,
        backgroundSize: selectedAssetArtUrl ? 'cover, cover, auto, auto' : undefined,
        backgroundPosition: selectedAssetArtUrl ? 'center, center, center, center' : undefined,
        backgroundRepeat: selectedAssetArtUrl ? 'no-repeat, no-repeat, no-repeat, no-repeat' : undefined,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -40px 90px rgba(0,0,0,0.2)',
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
                        Painel do ativo
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
                            <div
                                className="mt-3 overflow-hidden rounded-[24px] border border-white/10"
                                style={selectedAssetCanvasStyle}
                            >
                                <div className="space-y-2 px-1 pb-1 pt-4">
                                    <div className="text-center">
                                        <p className="luxe-title-ornate truncate px-5 text-lg font-black uppercase tracking-[0.18em] luxe-title-shadow text-[var(--ui-card-text)]">
                                            {selectedAsset.name}
                                        </p>
                                    </div>

                                    <div className="mx-3 rounded-[20px] border border-white/10 bg-black/34 px-3 py-3 backdrop-blur-sm">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-base font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.24)]"
                                                style={{
                                                    borderColor: rgbaString(selectedAssetAccentRgb, 0.34),
                                                    background: `linear-gradient(135deg, ${rgbaString(selectedAssetAccentRgb, 0.32)} 0%, rgba(10,12,16,0.92) 100%)`,
                                                }}
                                            >
                                                {selectedAssetLevel}
                                            </div>
                                            <div className="min-w-0 text-left">
                                                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/42">
                                                    Maestria atual
                                                </p>
                                                <p className="mt-1 text-[12px] font-semibold leading-snug text-white/86">
                                                    {selectedAssetMasteryPhrase || 'Essa area ainda nao tem uma frase de maestria definida.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {canShowSelectedAssetWidget && selectedAssetPrimarySlot && (
                                        <div className="mx-3 rounded-[20px] border border-white/10 bg-black/30 px-4 py-4 backdrop-blur-sm">
                                            <p className="text-center text-[10px] font-black uppercase tracking-[0.22em] text-white/84">
                                                {selectedAssetPrimarySlot.label}
                                            </p>
                                            <div className="mt-3 flex min-h-[3.1rem] items-center justify-center rounded-xl border border-[color:var(--skin-accent-color)] bg-black/42 px-3 py-2 text-center">
                                                <p className="line-clamp-3 text-sm font-semibold text-white">
                                                    {String(selectedAssetPrimarySlot.value)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {showArenaBoards ? (
                                        <div className={canShowSelectedAssetWidget ? 'pt-1' : ''}>
                                            <AssetArenaBoard asset={selectedAsset} showArchived={false} interactive={false} />
                                        </div>
                                    ) : canShowSelectedAssetWidget ? null : (
                                        <div className="rounded-[22px] border border-white/10 bg-black/25 px-4 py-6 text-center text-sm text-white/58">
                                            Este ativo nao expõe detalhes neste perfil.
                                        </div>
                                    )}
                                </div>
                            </div>
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
                    Mapa de ativos
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
                    <div className="assets-sephirot-backdrop absolute inset-0 z-0" />

                    <div className="relative z-10 h-full w-full">
                        {SEPHIROT_COORDS.map((coord) => {
                            const asset = assets.find((item) => item.id === coord.id);
                            if (!asset) return null;
                            const assetArtUrl = assetArtById[asset.id];
                            const accent = ASSET_ACCENT_COLORS[asset.id as keyof typeof ASSET_ACCENT_COLORS] || 'var(--skin-accent-color)';
                            const accentRgb = hexToRgb(accent);
                            const activeArenas = asset.arenas.filter((arena) => !arena.isArchived).length;
                            const totalActions = asset.arenas.reduce((sum, arena) => sum + (arena.actionIds?.length || 0), 0);

                            const yNorm = coord.y / 100;
                            const yStretched = Math.min(1, Math.max(0, (yNorm - 0.5) * stretchY + 0.5));

                            return (
                                <div
                                    key={asset.id}
                                    className="absolute flex items-center justify-center"
                                    style={{
                                        left: `${coord.x}%`,
                                        top: `${10 + (yStretched * 80)}%`,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setSelectedAssetId(asset.id)}
                                        className="group relative flex min-h-[66px] w-[118px] flex-col items-center overflow-visible rounded-[22px] border px-2 pb-0.5 pt-[16px] text-center transition-all duration-300 hover:-translate-y-[2px]"
                                        style={{
                                            borderColor: rgbaString(accentRgb, 0.42),
                                            backgroundImage: `${assetArtUrl ? `linear-gradient(180deg, rgba(6,7,10,0.18) 0%, rgba(6,7,10,0.82) 42%, rgba(6,7,10,0.96) 100%), url("${assetArtUrl.replace(/"/g, '\\"')}"), ` : ''}radial-gradient(circle at 50% -16%, ${rgbaString(accentRgb, 0.19)}, transparent 34%), radial-gradient(circle at 50% 108%, ${rgbaString(accentRgb, 0.11)} 0%, transparent 54%), linear-gradient(180deg, ${rgbaString(accentRgb, 0.06)} 0%, rgba(32,36,45,0.96) 18%, rgba(10,12,16,0.985) 100%)`,
                                            backgroundSize: assetArtUrl ? 'cover, auto, auto, auto' : undefined,
                                            backgroundPosition: assetArtUrl ? 'center, center, center, center' : undefined,
                                            boxShadow: `0 18px 34px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 999px ${rgbaString(accentRgb, 0.022)}, 0 0 0 1px ${rgbaString(accentRgb, 0.12)}`,
                                        }}
                                    >
                                        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[42%]">
                                            <Sephirot
                                                asset={asset}
                                                onClick={() => setSelectedAssetId(asset.id)}
                                                useSkinArtworkOnly={hasSephirotRasterArt}
                                                showLabel={false}
                                                size="46px"
                                                interactive={false}
                                            />
                                        </div>
                                        <div className="-mt-0.5 relative z-10 flex w-full justify-center">
                                            <div className="w-[102px] rounded-[10px] border border-white/10 bg-[rgba(8,10,14,0.82)] px-2 py-[0.18rem] shadow-[0_8px_18px_rgba(0,0,0,0.22)]">
                                                <p className="w-full truncate px-0.5 text-center text-[8px] font-black uppercase leading-none tracking-[0.02em] text-white/92">
                                                    {asset.name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="-mt-0.5 w-full rounded-[12px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,10,14,0.74)_0%,rgba(8,10,14,0.88)_100%)] px-2 py-[0.42rem] text-[9px] font-semibold uppercase tracking-[0.06em]">
                                            <div className="flex items-center justify-between gap-2 text-white/78">
                                                <span><span className="font-black text-white">{activeArenas}</span> arenas</span>
                                                <span><span className="font-black text-white">{totalActions}</span> ações</span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
